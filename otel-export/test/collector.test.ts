import { describe, it, expect } from 'vitest';
import { findCurrentJob, inferJobConclusion } from '../lib/collector.js';

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'build',
    status: 'completed' as string | null,
    conclusion: 'success' as string | null,
    created_at: '2024-01-01T00:00:00Z',
    started_at: '2024-01-01T00:00:05Z' as string | null,
    completed_at: '2024-01-01T00:01:00Z' as string | null,
    runner_name: 'runner-1' as string | null,
    runner_group_name: null as string | null,
    runner_group_id: null as number | null,
    labels: ['ubuntu-latest'],
    steps: undefined as undefined | { name: string; status: string; conclusion: string | null; number: number; started_at?: string | null; completed_at?: string | null }[],
    ...overrides,
  };
}

describe('findCurrentJob', () => {
  it('returns exact name match', () => {
    const jobs = [makeJob({ name: 'build' }), makeJob({ name: 'test' })];
    expect(findCurrentJob(jobs, 'build').name).toBe('build');
  });

  it('matches single matrix job by prefix', () => {
    const jobs = [makeJob({ name: 'build (images/go)' })];
    expect(findCurrentJob(jobs, 'build').name).toBe('build (images/go)');
  });

  it('matches matrix job by RUNNER_NAME when multiple candidates exist', () => {
    const saved = process.env.RUNNER_NAME;
    try {
      process.env.RUNNER_NAME = 'runner-2';
      const jobs = [
        makeJob({ name: 'build (images/go)', runner_name: 'runner-1' }),
        makeJob({ name: 'build (images/redis)', runner_name: 'runner-2' }),
      ];
      expect(findCurrentJob(jobs, 'build').name).toBe('build (images/redis)');
    } finally {
      if (saved === undefined) delete process.env.RUNNER_NAME;
      else process.env.RUNNER_NAME = saved;
    }
  });

  it('falls back to in_progress job when runner name does not match', () => {
    const saved = process.env.RUNNER_NAME;
    try {
      delete process.env.RUNNER_NAME;
      const jobs = [
        makeJob({ name: 'build (images/go)', status: 'completed' }),
        makeJob({ name: 'build (images/redis)', status: 'in_progress' }),
      ];
      expect(findCurrentJob(jobs, 'build').name).toBe('build (images/redis)');
    } finally {
      if (saved !== undefined) process.env.RUNNER_NAME = saved;
    }
  });

  it('falls back to most recently started job', () => {
    const saved = process.env.RUNNER_NAME;
    try {
      delete process.env.RUNNER_NAME;
      const jobs = [
        makeJob({ name: 'build (images/go)', status: 'completed', started_at: '2024-01-01T00:00:00Z' }),
        makeJob({ name: 'build (images/redis)', status: 'completed', started_at: '2024-01-01T00:05:00Z' }),
      ];
      expect(findCurrentJob(jobs, 'build').name).toBe('build (images/redis)');
    } finally {
      if (saved !== undefined) process.env.RUNNER_NAME = saved;
    }
  });

  it('throws when no jobs exist', () => {
    expect(() => findCurrentJob([], 'build')).toThrow(/No jobs found/);
  });
});

describe('inferJobConclusion', () => {
  it('returns explicit conclusion when present', () => {
    expect(inferJobConclusion('success', [])).toBe('success');
  });

  it('treats "unknown" as missing', () => {
    const steps = [{ name: 's', status: 'completed', conclusion: 'failure' as string | null, number: 1, startedAt: null, completedAt: null, durationMs: 0 }];
    expect(inferJobConclusion('unknown', steps)).toBe('failure');
  });

  it('infers failure from steps', () => {
    const steps = [
      { name: 'a', status: 'completed', conclusion: 'success' as string | null, number: 1, startedAt: null, completedAt: null, durationMs: 0 },
      { name: 'b', status: 'completed', conclusion: 'failure' as string | null, number: 2, startedAt: null, completedAt: null, durationMs: 0 },
    ];
    expect(inferJobConclusion(null, steps)).toBe('failure');
  });

  it('infers cancelled from steps', () => {
    const steps = [
      { name: 'a', status: 'completed', conclusion: 'cancelled' as string | null, number: 1, startedAt: null, completedAt: null, durationMs: 0 },
    ];
    expect(inferJobConclusion(null, steps)).toBe('cancelled');
  });

  it('infers success when all steps succeed or skip', () => {
    const steps = [
      { name: 'a', status: 'completed', conclusion: 'success' as string | null, number: 1, startedAt: null, completedAt: null, durationMs: 0 },
      { name: 'b', status: 'completed', conclusion: 'skipped' as string | null, number: 2, startedAt: null, completedAt: null, durationMs: 0 },
    ];
    expect(inferJobConclusion(null, steps)).toBe('success');
  });

  it('returns unknown when no steps have conclusions', () => {
    const steps = [
      { name: 'a', status: 'queued', conclusion: null, number: 1, startedAt: null, completedAt: null, durationMs: 0 },
    ];
    expect(inferJobConclusion(null, steps)).toBe('unknown');
  });
});
