import * as core from '@actions/core';
import * as crypto from 'node:crypto';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BasicTracerProvider, BatchSpanProcessor, RandomIdGenerator, type IdGenerator } from '@opentelemetry/sdk-trace-base';
import { context, trace, SpanKind, SpanStatusCode, type Tracer, type Meter } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { WorkflowMetrics, OtelConfig, CustomAttributes } from './types.js';
import { COLLECTOR_ENDPOINT } from './otelcol.js';

// Incubating in the semconv package — not yet in the stable export.
const ATTR_SERVICE_NAMESPACE = 'service.namespace';
const ATTR_SERVICE_INSTANCE_ID = 'service.instance.id';

function buildResource(config: OtelConfig) {
  return resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_NAMESPACE]: config.serviceNamespace,
    [ATTR_SERVICE_INSTANCE_ID]: process.env.GITHUB_RUN_ID || 'unknown',
  });
}

/**
 * Deterministic trace/span ID generation compatible with the otelcol-contrib
 * githubreceiver (receiver/githubreceiver/trace_event_handling.go).
 *
 * Using the same algorithm means our TRACEPARENT and the githubreceiver's
 * webhook-derived traces share the same trace ID, so spans from both sources
 * appear in a single unified trace.
 */

/** sha256("{runId}{runAttempt}t")[0:32] — matches githubreceiver newTraceID */
export function generateTraceId(runId: string, runAttempt: string): string {
  return crypto.createHash('sha256').update(`${runId}${runAttempt}t`).digest('hex').substring(0, 32);
}

/** sha256("{runId}{runAttempt}s")[16:32] — matches githubreceiver newParentSpanID */
export function generateRootSpanId(runId: string, runAttempt: string): string {
  return crypto.createHash('sha256').update(`${runId}${runAttempt}s`).digest('hex').substring(16, 32);
}

function buildCicdAttributes(
  metrics: WorkflowMetrics,
  customAttributes: CustomAttributes = {},
): Record<string, string> {
  const attrs: Record<string, string> = {
    'cicd.pipeline.name': metrics.workflow,
    'cicd.pipeline.run.id': metrics.run.id.toString(),

    'vcs.repository.name': metrics.repository.fullName,
    'vcs.repository.url.full': `https://github.com/${metrics.repository.fullName}`,
    'vcs.ref.head.name': metrics.git.refName || metrics.git.ref,
    'vcs.ref.head.revision': metrics.git.sha,

    'github.run.number': metrics.run.number.toString(),
    'github.run.attempt': metrics.run.attempt,
    'github.event.name': metrics.event.name,
    'github.actor': metrics.event.actor,
    'github.runner.os': metrics.runner.os,
    'github.runner.arch': metrics.runner.arch,
  };

  if (metrics.event.prNumber != null) {
    attrs['vcs.change.id'] = metrics.event.prNumber.toString();
  }
  if (metrics.runner.name) {
    attrs['cicd.worker.name'] = metrics.runner.name;
  }
  if (metrics.runner.labels.length > 0) {
    attrs['github.runner.label'] = metrics.runner.labels[0];
  }

  return { ...attrs, ...customAttributes };
}

type OtelResult = 'success' | 'failure' | 'cancellation' | 'skip' | 'timeout' | 'error';

const CONCLUSION_MAP: Record<string, OtelResult> = {
  success: 'success',
  failure: 'failure',
  cancelled: 'cancellation',
  skipped: 'skip',
  timed_out: 'timeout',
};

function mapToOtelResult(conclusion: string): OtelResult {
  return CONCLUSION_MAP[conclusion] ?? 'error';
}

/** Returns true when the OTel result should be treated as an error condition. */
function isErrorResult(result: OtelResult): boolean {
  return result === 'failure' || result === 'error' || result === 'timeout';
}

export function createMeterProvider(config: OtelConfig): {
  meterProvider: MeterProvider;
  meter: Meter;
} {
  core.info('Initializing MeterProvider with OTLP HTTP exporter');

  const resource = buildResource(config);

  const exporter = new OTLPMetricExporter({
    url: `http://${COLLECTOR_ENDPOINT}/v1/metrics`,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 5000,
  });

  const meterProvider = new MeterProvider({
    resource,
    readers: [metricReader],
  });

  return { meterProvider, meter: meterProvider.getMeter(config.metricPrefix) };
}

export function recordMetrics(
  meter: Meter,
  metrics: WorkflowMetrics,
  metricPrefix: string,
  customAttributes: CustomAttributes = {},
): void {
  core.info('Recording metrics');

  const baseAttributes = buildCicdAttributes(metrics, customAttributes);

  const taskDuration = meter.createHistogram(`${metricPrefix}.pipeline.task.duration`, {
    description: 'Duration of CI/CD pipeline tasks (jobs)',
    unit: 's',
  });

  taskDuration.record(metrics.job.durationMs / 1000, {
    ...baseAttributes,
    'cicd.pipeline.task.name': metrics.job.name,
    'cicd.pipeline.task.run.id': metrics.job.id.toString(),
    'cicd.pipeline.task.run.result': mapToOtelResult(metrics.job.conclusion),
  });

  if (metrics.job.queueDurationMs > 0) {
    const queueDuration = meter.createHistogram(`${metricPrefix}.pipeline.task.queue_duration`, {
      description: 'Time spent waiting for a runner before task execution',
      unit: 's',
    });

    queueDuration.record(metrics.job.queueDurationMs / 1000, {
      ...baseAttributes,
      'cicd.pipeline.task.name': metrics.job.name,
      'cicd.pipeline.task.run.id': metrics.job.id.toString(),
    });
  }

  const stepDuration = meter.createHistogram(`${metricPrefix}.pipeline.step.duration`, {
    description: 'Duration of CI/CD pipeline steps',
    unit: 's',
  });

  for (const step of metrics.steps) {
    if (step.durationMs > 0) {
      stepDuration.record(step.durationMs / 1000, {
        ...baseAttributes,
        'cicd.pipeline.task.name': metrics.job.name,
        'step.name': step.name,
        'step.number': step.number.toString(),
        'cicd.pipeline.task.run.result': mapToOtelResult(step.conclusion ?? 'unknown'),
      });
    }
  }

  core.info(`Recorded metrics for job and ${metrics.steps.length} steps`);
}

export async function shutdownMeterProvider(meterProvider: MeterProvider): Promise<void> {
  await meterProvider.forceFlush();
  await meterProvider.shutdown();
  core.info('MeterProvider shut down');
}

/**
 * IdGenerator that pins all spans to a deterministic trace ID and assigns a
 * specific span ID to the first span created (the root "RUN" span).
 *
 * This ensures the root span IS the TRACEPARENT span, so child spans created
 * by external tools (e.g. trace-exec) parent directly to it.
 *
 * All subsequent spans (step spans) get the same trace ID but random span IDs.
 *
 * When a githubreceiver is introduced, this class can be swapped for a remote
 * parent context approach where the receiver's webhook span is the true root.
 */
export class DeterministicIdGenerator implements IdGenerator {
  private readonly fallback = new RandomIdGenerator();
  private rootSpanIdUsed = false;

  constructor(
    private readonly traceId: string,
    private readonly rootSpanId: string,
  ) {}

  generateTraceId(): string {
    return this.traceId;
  }

  generateSpanId(): string {
    if (!this.rootSpanIdUsed) {
      this.rootSpanIdUsed = true;
      return this.rootSpanId;
    }
    return this.fallback.generateSpanId();
  }
}

export function createTracerProvider(
  config: OtelConfig,
  idGenerator?: IdGenerator,
): {
  tracerProvider: BasicTracerProvider;
  tracer: Tracer;
} {
  core.info('Initializing TracerProvider with OTLP HTTP exporter');

  const resource = buildResource(config);

  const exporter = new OTLPTraceExporter({
    url: `http://${COLLECTOR_ENDPOINT}/v1/traces`,
  });

  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
    ...(idGenerator ? { idGenerator } : {}),
  });

  return { tracerProvider, tracer: tracerProvider.getTracer(config.metricPrefix) };
}

export function recordTraces(
  tracer: Tracer,
  metrics: WorkflowMetrics,
  customAttributes: CustomAttributes = {},
): void {
  core.info('Recording traces');

  const baseAttributes = buildCicdAttributes(metrics, customAttributes);

  const jobResult = mapToOtelResult(metrics.job.conclusion);
  const runUrl = `https://github.com/${metrics.repository.fullName}/actions/runs/${metrics.run.id}`;

  const jobSpan = tracer.startSpan(`RUN ${metrics.workflow}`, {
    kind: SpanKind.SERVER,
    startTime: metrics.job.startedAt,
    attributes: {
      ...baseAttributes,
      // Pipeline-level attributes (this is our root span)
      'cicd.pipeline.action.name': 'RUN',
      'cicd.pipeline.result': jobResult,
      'cicd.pipeline.run.url.full': runUrl,
      // Task-level attributes
      'cicd.pipeline.task.name': metrics.job.name,
      'cicd.pipeline.task.run.id': metrics.job.id.toString(),
      'cicd.pipeline.task.run.result': jobResult,
      'cicd.pipeline.task.run.url.full': `${runUrl}/job/${metrics.job.id}`,
    },
  });

  const jobContext = trace.setSpan(context.active(), jobSpan);

  for (const step of metrics.steps) {
    if (step.startedAt && step.completedAt) {
      const stepResult = mapToOtelResult(step.conclusion ?? 'unknown');
      const stepSpan = tracer.startSpan(
        step.name,
        {
          kind: SpanKind.INTERNAL,
          startTime: step.startedAt,
          attributes: {
            ...baseAttributes,
            'cicd.pipeline.task.name': metrics.job.name,
            'step.name': step.name,
            'step.number': step.number.toString(),
            'cicd.pipeline.task.run.result': stepResult,
          },
        },
        jobContext,
      );

      if (isErrorResult(stepResult)) {
        stepSpan.setStatus({ code: SpanStatusCode.ERROR, message: `Step ${step.conclusion}` });
        stepSpan.setAttribute('error.type', step.conclusion ?? 'unknown');
      }

      stepSpan.end(step.completedAt);
    }
  }

  if (isErrorResult(jobResult)) {
    jobSpan.setStatus({ code: SpanStatusCode.ERROR, message: `Job ${metrics.job.conclusion}` });
    jobSpan.setAttribute('error.type', metrics.job.conclusion);
  }
  jobSpan.end(metrics.job.completedAt);

  core.info(`Recorded traces for job and ${metrics.steps.length} steps`);
}

export async function shutdownTracerProvider(tracerProvider: BasicTracerProvider): Promise<void> {
  await tracerProvider.forceFlush();
  await tracerProvider.shutdown();
  core.info('TracerProvider shut down');
}
