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
  function withRunner(name: string, fn: () => void) {
    const saved = process.env.RUNNER_NAME;
    try {
      process.env.RUNNER_NAME = name;
      fn();
    } finally {
      if (saved === undefined) delete process.env.RUNNER_NAME;
      else process.env.RUNNER_NAME = saved;
    }
  }

  function withoutRunner(fn: () => void) {
    const saved = process.env.RUNNER_NAME;
    try {
      delete process.env.RUNNER_NAME;
      fn();
    } finally {
      if (saved !== undefined) process.env.RUNNER_NAME = saved;
    }
  }

  it('matches by runner name regardless of job naming', () => {
    withRunner('runner-3', () => {
      const jobs = [
        makeJob({ name: 'skipped', runner_name: null }),
        makeJob({ name: 'caller / inner', runner_name: 'runner-3' }),
      ];
      expect(findCurrentJob(jobs, 'wrong-name').name).toBe('caller / inner');
    });
  });

  it('handles matrix jobs via runner name', () => {
    withRunner('runner-2', () => {
      const jobs = [
        makeJob({ name: 'build (a)', runner_name: 'runner-1' }),
        makeJob({ name: 'build (b)', runner_name: 'runner-2' }),
      ];
      expect(findCurrentJob(jobs, 'build').name).toBe('build (b)');
    });
  });

  it('handles reusable workflows via runner name', () => {
    withRunner('runner-5', () => {
      const jobs = [
        makeJob({ name: 'other', runner_name: null, conclusion: 'skipped' }),
        makeJob({ name: 'caller / inner', runner_name: 'runner-5' }),
      ];
      expect(findCurrentJob(jobs, 'inner').name).toBe('caller / inner');
    });
  });

  it('falls back to exact name match without runner name', () => {
    withoutRunner(() => {
      const jobs = [makeJob({ name: 'build' }), makeJob({ name: 'test' })];
      expect(findCurrentJob(jobs, 'build').name).toBe('build');
    });
  });

  it('falls back to matrix prefix match without runner name', () => {
    withoutRunner(() => {
      const jobs = [makeJob({ name: 'build (variant-a)' })];
      expect(findCurrentJob(jobs, 'build').name).toBe('build (variant-a)');
    });
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
