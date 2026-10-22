import { afterEach, describe, expect, it, vi } from 'vitest';
import { context as githubContext } from '@actions/github';
import { checkoutAttributes, captureResource, serializeResource } from '../lib/resource.js';

function event(pr = true) {
  const context = Object.create(Object.getPrototypeOf(githubContext)) as typeof githubContext;
  context.runId = 123;
  context.sha = 'event-base';
  context.payload = { repository: { name: 'repo', owner: { login: 'org' } },
    ...(pr ? { pull_request: { number: 42, head: { sha: 'proposed-head' }, base: { sha: 'event-base' } } } : {}) };
  return context;
}

afterEach(() => vi.unstubAllEnvs());

describe('execution resource', () => {
  it('keeps event, PR head/base and checkout provenance separate', () => {
    const attrs = captureResource('ci', 'tests', event(), {
      'git.checkout.revision': 'actual-checkout', 'git.checkout.tree': 'actual-tree',
    }, 'component=images/go,team=containers');
    expect(attrs).toMatchObject({
      'github.sha': 'event-base', 'git.pr.head.revision': 'proposed-head',
      'git.base.revision': 'event-base', 'git.checkout.revision': 'actual-checkout',
      'git.checkout.tree': 'actual-tree', component: 'images/go', team: 'containers',
      'cicd.pipeline.run.id': '123', 'github.pr.number': '42',
    });
    const persisted = JSON.parse(JSON.stringify(attrs));
    expect(serializeResource(persisted)).toBe(serializeResource(attrs));
  });

  it('separates concurrent jobs and reruns without changing the native run ID', () => {
    vi.stubEnv('GITHUB_RUN_ATTEMPT', '1');
    const a = captureResource('ci', 'tests', event(), {});
    const b = captureResource('ci', 'tests', event(), {});
    vi.stubEnv('GITHUB_RUN_ATTEMPT', '2');
    const c = captureResource('ci', 'tests', event(), {});
    expect(new Set([a, b, c].map(x => x['service.instance.id'])).size).toBe(3);
    expect([a, b, c].map(x => x['cicd.pipeline.run.id'])).toEqual(['123', '123', '123']);
    expect(c['github.run.attempt']).toBe('2');
  });

  it('does not invent PR or checkout data for non-PR and non-Git jobs', () => {
    expect(checkoutAttributes('/dev/null')).toEqual({});
    const attrs = captureResource('ci', 'tests', event(false), {});
    expect(attrs['git.pr.head.revision']).toBeUndefined();
    expect(attrs['git.checkout.revision']).toBeUndefined();
  });

  it('reads the actual checkout rather than the event revision', () => {
    const attrs = checkoutAttributes(process.cwd());
    expect(attrs['git.checkout.revision']).toMatch(/^[a-f0-9]{40}$/);
    expect(attrs['git.checkout.tree']).toMatch(/^[a-f0-9]{40}$/);
  });

  it('rejects values that could inject additional environment attributes', () => {
    expect(() => serializeResource({ 'service.name': 'ci,service.instance.id=shared' })).toThrow();
  });
});
