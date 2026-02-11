import * as core from '@actions/core';
import * as fs from 'node:fs';
import * as github from '@actions/github';
import * as yaml from 'yaml';
import { collectMetrics } from './lib/collector.js';
import { stopCollector, dumpCollectorLogs } from './lib/otelcol.js';
import {
  generateTraceId,
  generateRootSpanId,
  DeterministicIdGenerator,
  createMeterProvider,
  recordMetrics,
  shutdownMeterProvider,
  createTracerProvider,
  recordTraces,
  shutdownTracerProvider,
} from './lib/exporter.js';
import type { WorkflowMetrics, CustomAttributes } from './lib/types.js';

function writeJobSummary(traceId: string, metrics: WorkflowMetrics): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

  const runUrl = `https://github.com/${metrics.repository.fullName}/actions/runs/${metrics.run.id}`;

  const summary = `
### OpenTelemetry Trace

| Field | Value |
|-------|-------|
| Trace ID | \`${traceId}\` |
| Pipeline | ${metrics.workflow} |
| Job | ${metrics.job.name} |
| Result | ${metrics.job.conclusion} |
| Duration | ${(metrics.job.durationMs / 1000).toFixed(2)}s |

[View workflow run](${runUrl})
`;

  fs.appendFileSync(summaryFile, summary);
  core.info('Wrote trace info to job summary');
}

async function run(): Promise<void> {
  let meterProvider: import('@opentelemetry/sdk-metrics').MeterProvider | undefined;
  let tracerProvider: import('@opentelemetry/sdk-trace-base').BasicTracerProvider | undefined;
  const collectorPid = parseInt(core.getState('collector-pid'), 10);
  const collectorLog = core.getState('collector-log');

  const runId = process.env.GITHUB_RUN_ID || '0';
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT || '1';
  const traceId = generateTraceId(runId, runAttempt);
  const rootSpanId = generateRootSpanId(runId, runAttempt);

  try {
    core.info('Starting OpenTelemetry export post-action');

    const token = core.getInput('github-token', { required: true });
    const serviceName = core.getInput('service-name');
    const serviceNamespace = core.getInput('service-namespace');
    const metricPrefix = core.getInput('metric-prefix');

    let customAttributes: CustomAttributes = {};
    const attributesInput = core.getInput('attributes');
    if (attributesInput) {
      try {
        customAttributes = yaml.parse(attributesInput) || {};
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        core.warning(`Failed to parse custom attributes: ${message}`);
      }
    }

    const config = { serviceName, serviceNamespace, metricPrefix };

    const octokit = github.getOctokit(token);
    const metrics = await collectMetrics(octokit, github.context);

    const { meterProvider: mp, meter } = createMeterProvider(config);
    meterProvider = mp;

    const idGenerator = new DeterministicIdGenerator(traceId, rootSpanId);
    const { tracerProvider: tp, tracer } = createTracerProvider(config, idGenerator);
    tracerProvider = tp;

    recordMetrics(meter, metrics, metricPrefix, customAttributes);
    recordTraces(tracer, metrics, customAttributes);

    await shutdownMeterProvider(meterProvider);
    await shutdownTracerProvider(tracerProvider);

    if (traceId) {
      writeJobSummary(traceId, metrics);
    }

    core.info('Telemetry exported successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.error(`Post-action failed: ${message}`);

    if (meterProvider) {
      try {
        await shutdownMeterProvider(meterProvider);
      } catch {
        /* ignore */
      }
    }
    if (tracerProvider) {
      try {
        await shutdownTracerProvider(tracerProvider);
      } catch {
        /* ignore */
      }
    }

    const failOnError = core.getInput('fail-on-error') === 'true';
    if (failOnError) {
      core.setFailed(message);
    } else {
      core.warning(`Export failed: ${message}`);
    }
  } finally {
    if (collectorPid) {
      try {
        await stopCollector(collectorPid);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        core.warning(`Failed to stop collector: ${message}`);
      }
    }

    if (collectorLog) {
      dumpCollectorLogs(collectorLog);
    }
  }
}

run();
