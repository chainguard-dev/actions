import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const COLLECTOR_NAME = 'otelcol-contrib';
export const COLLECTOR_ENDPOINT = 'localhost:4318';

function getDownloadUrl(version: string): string {
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const arch = process.arch === 'x64' ? 'amd64' : process.arch;

  return `https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v${version}/${COLLECTOR_NAME}_${version}_${platform}_${arch}.tar.gz`;
}

export async function downloadCollector(version: string): Promise<string> {
  const toolPath = tc.find(COLLECTOR_NAME, version);
  if (toolPath) {
    core.info(`Using cached collector: ${toolPath}`);
    return path.join(toolPath, COLLECTOR_NAME);
  }

  const url = getDownloadUrl(version);
  core.info(`Downloading OpenTelemetry Collector v${version} from ${url}`);

  const downloadPath = await tc.downloadTool(url);
  const extractedPath = await tc.extractTar(downloadPath);
  const cachedPath = await tc.cacheDir(extractedPath, COLLECTOR_NAME, version);

  const binaryPath = path.join(cachedPath, COLLECTOR_NAME);

  if (process.platform !== 'win32') {
    fs.chmodSync(binaryPath, '755');
  }

  core.info(`Collector cached at: ${binaryPath}`);
  return binaryPath;
}

export interface CollectorHandle {
  pid: number;
  logPath: string;
}

export function startCollector(binaryPath: string, configPath: string): CollectorHandle {
  const tempDir = process.env.RUNNER_TEMP || '/tmp';
  const logPath = path.join(tempDir, 'otelcol.log');
  const logFd = fs.openSync(logPath, 'a');

  core.info(`Starting collector with config: ${configPath}`);
  core.info(`Collector logs: ${logPath}`);

  const proc = spawn(binaryPath, ['--config', configPath], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
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
  core.info(`Waiting for collector to be ready on ${COLLECTOR_ENDPOINT}...`);

  const healthUrl = `http://${COLLECTOR_ENDPOINT}/v1/metrics`;
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
