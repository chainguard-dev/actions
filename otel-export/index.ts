import * as core from '@actions/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { downloadCollector, startCollector, waitForCollector, COLLECTOR_ENDPOINT, type ResourceAttributes } from './lib/otelcol.js';
import { generateTraceId, generateRootSpanId } from './lib/exporter.js';

async function run(): Promise<void> {
  try {
    const collectorConfigPath = core.getInput('collector-config', { required: true });
    const collectorVersion = core.getInput('collector-version');

    const configPath = path.isAbsolute(collectorConfigPath)
      ? collectorConfigPath
      : path.join(process.env.GITHUB_WORKSPACE || process.cwd(), collectorConfigPath);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Collector config not found: ${configPath}`);
    }

    core.info('Starting OpenTelemetry Export action');

    const binaryPath = await downloadCollector(collectorVersion);

    const serviceName = core.getInput('service-name');
    const serviceNamespace = core.getInput('service-namespace');
    const resourceAttrs: ResourceAttributes = {
      serviceName,
      serviceNamespace,
      serviceInstanceId: process.env.GITHUB_RUN_ID || 'unknown',
    };

    const { pid, logPath } = startCollector(binaryPath, configPath, resourceAttrs);

    core.saveState('collector-pid', pid.toString());
    core.saveState('collector-log', logPath);

    await waitForCollector();

    const runId = process.env.GITHUB_RUN_ID || '0';
    const runAttempt = process.env.GITHUB_RUN_ATTEMPT || '1';
    const traceId = generateTraceId(runId, runAttempt);
    const spanId = generateRootSpanId(runId, runAttempt);
    const traceparent = `00-${traceId}-${spanId}-01`;

    const envFile = process.env.GITHUB_ENV;
    if (envFile) {
      fs.appendFileSync(envFile, `TRACEPARENT=${traceparent}\n`);
      fs.appendFileSync(envFile, `OTEL_EXPORTER_OTLP_ENDPOINT=http://${COLLECTOR_ENDPOINT}\n`);
    }

    core.setOutput('traceparent', traceparent);
    core.setOutput('trace-id', traceId);
    core.setOutput('span-id', spanId);

    core.info(`Trace ID: ${traceId}`);
    core.info(`TRACEPARENT=${traceparent}`);
    core.info('OpenTelemetry collector running, telemetry will be exported after job completes');
  } catch (error) {
    const failOnError = core.getInput('fail-on-error') === 'true';
    const message = error instanceof Error ? error.message : String(error);
    if (failOnError) {
      core.setFailed(message);
    } else {
      core.warning(`Setup failed: ${message}`);
    }
  }
}

run();
