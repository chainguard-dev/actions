import { describe, it, expect, vi } from 'vitest';
import { MeterProvider, InMemoryMetricExporter, PeriodicExportingMetricReader, AggregationTemporality } from '@opentelemetry/sdk-metrics';
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { recordMetrics, recordTraces, shutdownMeterProvider, generateTraceId, generateRootSpanId, DeterministicIdGenerator } from '../lib/exporter.js';
import type { WorkflowMetrics } from '../lib/types.js';

const PREFIX = 'test.ci';

function makeMetrics(overrides: Partial<WorkflowMetrics> = {}): WorkflowMetrics {
  return {
    workflow: 'ci',
    job: {
      name: 'build',
      id: 100,
      status: 'completed',
      conclusion: 'success',
      startedAt: new Date('2024-01-01T00:00:00Z'),
      completedAt: new Date('2024-01-01T00:10:00Z'),
      durationMs: 600_000,
      queueDurationMs: 5_000,
    },
    steps: [
      { name: 'checkout', status: 'completed', conclusion: 'success', number: 1, startedAt: new Date('2024-01-01T00:00:00Z'), completedAt: new Date('2024-01-01T00:00:05Z'), durationMs: 5_000 },
      { name: 'build', status: 'completed', conclusion: 'success', number: 2, startedAt: new Date('2024-01-01T00:00:05Z'), completedAt: new Date('2024-01-01T00:09:00Z'), durationMs: 535_000 },
    ],
    repository: { owner: 'org', repo: 'repo', fullName: 'org/repo' },
    run: { id: 1234, number: 42, attempt: '1' },
    git: { sha: 'abc123', ref: 'refs/heads/main', refName: 'main' },
    event: { name: 'push', actor: 'user', prNumber: null },
    runner: { os: 'Linux', arch: 'X64', name: 'runner-1', groupName: null, labels: ['ubuntu-latest'] },
    ...overrides,
  };
}

function createTestTracer(idGenerator?: DeterministicIdGenerator) {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
    ...(idGenerator ? { idGenerator } : {}),
  });
  const tracer = provider.getTracer(PREFIX);
  return { exporter, provider, tracer };
}

describe('shutdownMeterProvider', () => {
  it('exports metrics exactly once', async () => {
    let exportCount = 0;
    const inner = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
    const originalExport = inner.export.bind(inner);
    vi.spyOn(inner, 'export').mockImplementation((...args) => {
      exportCount++;
      return originalExport(...args);
    });

    const reader = new PeriodicExportingMetricReader({ exporter: inner, exportIntervalMillis: 3_600_000 });
    const provider = new MeterProvider({ readers: [reader] });
    const meter = provider.getMeter(PREFIX);

    recordMetrics(meter, makeMetrics(), PREFIX);
    await shutdownMeterProvider(provider);

    expect(exportCount).toBe(1);
  });
});

describe('recordTraces', () => {
  it('creates root span with step children', () => {
    const { exporter, tracer } = createTestTracer();
    recordTraces(tracer, makeMetrics());

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(3); // 1 root + 2 steps

    const root = spans.find((s) => s.name === 'RUN ci');
    expect(root).toBeDefined();
    expect(root!.kind).toBe(SpanKind.SERVER);

    const children = spans.filter((s) => s.parentSpanContext?.spanId === root!.spanContext().spanId);
    expect(children).toHaveLength(2);
    expect(children.map((s) => s.name)).toContain('checkout');
    expect(children.map((s) => s.name)).toContain('build');
  });

  it('sets error status on failed jobs', () => {
    const { exporter, tracer } = createTestTracer();
    recordTraces(tracer, makeMetrics({ job: { ...makeMetrics().job, conclusion: 'failure' } }));

    const root = exporter.getFinishedSpans().find((s) => s.name === 'RUN ci');
    expect(root!.status.code).toBe(SpanStatusCode.ERROR);
    expect(root!.attributes['error.type']).toBe('failure');
  });

  it('sets error status on failed steps', () => {
    const { exporter, tracer } = createTestTracer();
    const metrics = makeMetrics({
      steps: [
        { name: 'failing-step', status: 'completed', conclusion: 'failure', number: 1, startedAt: new Date('2024-01-01T00:00:00Z'), completedAt: new Date('2024-01-01T00:01:00Z'), durationMs: 60_000 },
      ],
    });
    recordTraces(tracer, metrics);

    const step = exporter.getFinishedSpans().find((s) => s.name === 'failing-step');
    expect(step!.status.code).toBe(SpanStatusCode.ERROR);
  });

  it('skips steps without timestamps', () => {
    const { exporter, tracer } = createTestTracer();
    recordTraces(tracer, makeMetrics({
      steps: [{ name: 'pending', status: 'queued', conclusion: null, number: 1, startedAt: null, completedAt: null, durationMs: 0 }],
    }));

    expect(exporter.getFinishedSpans()).toHaveLength(1); // root only
  });

  it('uses deterministic trace/span IDs', () => {
    const traceId = generateTraceId('9999', '1');
    const spanId = generateRootSpanId('9999', '1');
    const idGen = new DeterministicIdGenerator(traceId, spanId);

    const { exporter, tracer } = createTestTracer(idGen);
    recordTraces(tracer, makeMetrics());

    const root = exporter.getFinishedSpans().find((s) => s.name === 'RUN ci');
    expect(root!.spanContext().traceId).toBe(traceId);
    expect(root!.spanContext().spanId).toBe(spanId);

    const children = exporter.getFinishedSpans().filter((s) => s !== root);
    for (const child of children) {
      expect(child.spanContext().traceId).toBe(traceId);
      expect(child.spanContext().spanId).not.toBe(spanId);
    }
  });

  it('is deterministic and varies with inputs', () => {
    expect(generateTraceId('100', '1')).toBe(generateTraceId('100', '1'));
    expect(generateRootSpanId('100', '1')).toBe(generateRootSpanId('100', '1'));
    expect(generateTraceId('100', '1')).not.toBe(generateTraceId('100', '2'));
    expect(generateRootSpanId('100', '1')).not.toBe(generateRootSpanId('200', '1'));
  });
});
