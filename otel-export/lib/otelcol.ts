import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const COLLECTOR_NAME = 'otelcol-contrib';
export const COLLECTOR_HTTP_ENDPOINT = 'localhost:4318';
export const COLLECTOR_GRPC_ENDPOINT = 'localhost:4317';

// Pinned collector version and SHA256 checksums.
// To upgrade: update COLLECTOR_VERSION and both checksums below.
const COLLECTOR_VERSION = '0.148.0';
const COLLECTOR_CHECKSUMS: Record<string, string> = {
  amd64: '224be33baa9eb534838e3d742d5327eff6a6bb60cdf4a16daf9c4e70d438fe00',
  arm64: 'cdacaa17eba2d7aec7338734669a15de0f3382828ba1f835a35a81fc3e55a9fa',
};

function verifyChecksum(filePath: string, expected: string): void {
  const content = fs.readFileSync(filePath);
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  if (actual !== expected) {
    throw new Error(
      `Checksum mismatch for collector binary.\n` +
      `  Expected: ${expected}\n` +
      `  Actual:   ${actual}`
    );
  }
  core.info(`Checksum verified: ${actual}`);
}

export async function downloadCollector(): Promise<string> {
  const toolPath = tc.find(COLLECTOR_NAME, COLLECTOR_VERSION);
  if (toolPath) {
    core.info(`Using cached collector: ${toolPath}`);
    return path.join(toolPath, COLLECTOR_NAME);
  }

  const arch = process.arch === 'x64' ? 'amd64' : process.arch;
  const expectedChecksum = COLLECTOR_CHECKSUMS[arch];
  if (!expectedChecksum) {
    throw new Error(`Unsupported architecture: ${arch}`);
  }

  const url = `https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${COLLECTOR_VERSION}/${COLLECTOR_NAME}_${COLLECTOR_VERSION}_linux_${arch}.tar.gz`;
  core.info(`Downloading OpenTelemetry Collector v${COLLECTOR_VERSION} from ${url}`);

  const downloadPath = await tc.downloadTool(url);
  verifyChecksum(downloadPath, expectedChecksum);

  const extractedPath = await tc.extractTar(downloadPath);
  const cachedPath = await tc.cacheDir(extractedPath, COLLECTOR_NAME, COLLECTOR_VERSION);

  const binaryPath = path.join(cachedPath, COLLECTOR_NAME);
  fs.chmodSync(binaryPath, '755');

  core.info(`Collector cached at: ${binaryPath}`);
  return binaryPath;
}

export interface CollectorHandle {
  pid: number;
  logPath: string;
}

export interface ResourceAttributes {
  serviceName: string;
  serviceNamespace: string;
  serviceInstanceId: string;
}

export function startCollector(
  binaryPath: string,
  configPath: string,
  resourceAttrs?: ResourceAttributes,
): CollectorHandle {
  const tempDir = process.env.RUNNER_TEMP || '/tmp';
  const logPath = path.join(tempDir, 'otelcol.log');
  const logFd = fs.openSync(logPath, 'a');

  core.info(`Starting collector with config: ${configPath}`);
  core.info(`Collector logs: ${logPath}`);

  // Set OTEL_RESOURCE_ATTRIBUTES so the resourcedetection processor's `env`
  // detector injects identity into collector-scraped data (e.g. hostmetrics).
  // SDK-sent OTLP data already carries its own resource attributes which the
  // detector will not override (override defaults to false).
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  if (resourceAttrs) {
    const attrs = [
      `service.name=${resourceAttrs.serviceName}`,
      `service.namespace=${resourceAttrs.serviceNamespace}`,
      `service.instance.id=${resourceAttrs.serviceInstanceId}`,
    ].join(',');
    env.OTEL_RESOURCE_ATTRIBUTES = env.OTEL_RESOURCE_ATTRIBUTES
      ? `${env.OTEL_RESOURCE_ATTRIBUTES},${attrs}`
      : attrs;
    core.info(`Collector OTEL_RESOURCE_ATTRIBUTES: ${env.OTEL_RESOURCE_ATTRIBUTES}`);
  }

  const proc = spawn(binaryPath, ['--config', configPath], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env,
  });

  // Close the fd in the parent — the child retains its own copy via fork.
  fs.closeSync(logFd);

  proc.on('error', (err) => {
    core.error(`Collector process error: ${err.message}`);
  });

  proc.unref();

  const pid = proc.pid;
  if (!pid) {
    throw new Error('Failed to start collector: no PID returned');
  }

  core.info(`Collector started with PID: ${pid}`);
  return { pid, logPath };
}

export async function stopCollector(pid: number, timeoutMs = 10000): Promise<void> {
  core.info(`Stopping collector (PID: ${pid})`);

  try {
    process.kill(pid, 0);
  } catch {
    core.info('Collector process already terminated');
    return;
  }

  process.kill(pid, 'SIGTERM');
  core.info('Sent SIGTERM to collector, waiting for graceful shutdown...');

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      process.kill(pid, 0);
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      core.info('Collector stopped gracefully');
      return;
    }
  }

  core.warning('Collector did not stop gracefully, sending SIGKILL');
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // Process already gone
  }
}

export function dumpCollectorLogs(logPath: string): void {
  try {
    const content = fs.readFileSync(logPath, 'utf-8').trim();
    if (content) {
      core.info('--- Collector logs ---');
      for (const line of content.split('\n')) {
        core.info(`[otelcol] ${line}`);
      }
      core.info('--- End collector logs ---');
    } else {
      core.info('No collector log output');
    }
  } catch {
    core.info('Collector log file not found');
  }
}

export async function waitForCollector(timeoutMs = 30000): Promise<void> {
  core.info(`Waiting for collector to be ready on ${COLLECTOR_HTTP_ENDPOINT}...`);

  const healthUrl = `http://${COLLECTOR_HTTP_ENDPOINT}/v1/metrics`;
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const resp = await fetch(healthUrl, { method: 'POST', body: '{}' });
      // Any response (even 4xx) means the collector is listening
      if (resp.status > 0) {
        core.info(`Collector ready (HTTP ${resp.status})`);
        return;
      }
    } catch {
      // Connection refused — collector not ready yet
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  core.warning(`Collector did not become ready within ${timeoutMs}ms, proceeding anyway`);
}
