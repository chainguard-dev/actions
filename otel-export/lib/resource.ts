import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { context } from '@actions/github';

export function checkoutAttributes(workspace: string): Record<string, string> {
  try {
    const revision = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const tree = execFileSync('git', ['rev-parse', '--verify', 'HEAD^{tree}'], { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return { 'git.checkout.revision': revision, 'git.checkout.tree': tree };
  } catch {
    // The action also supports jobs without a Git checkout.
    return {};
  }
}

export function captureResource(
  serviceName: string,
  serviceNamespace: string,
  event: Pick<typeof context, 'runId' | 'sha' | 'repo' | 'payload'>,
  checkout: Record<string, string>,
  inherited = process.env.OTEL_RESOURCE_ATTRIBUTES || '',
): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const pair of inherited.split(',')) {
    const separator = pair.indexOf('=');
    if (separator > 0) attributes[pair.slice(0, separator).trim()] = pair.slice(separator + 1).trim();
  }
  const pr = event.payload.pull_request;
  return {
    ...attributes,
    'service.name': serviceName,
    'service.namespace': serviceNamespace,
    // One setup invocation owns the collector, downstream SDKs and post-action.
    'service.instance.id': randomUUID(),
    'cicd.pipeline.run.id': String(event.runId),
    'github.run.attempt': process.env.GITHUB_RUN_ATTEMPT || '1',
    'github.repository': `${event.repo.owner}/${event.repo.repo}`,
    'github.sha': event.sha,
    ...(pr ? {
      'github.pr.number': String(pr.number),
      'git.pr.head.revision': pr.head.sha,
      'git.base.revision': pr.base.sha,
    } : {}),
    ...checkout,
  };
}

export function serializeResource(attributes: Record<string, string>): string {
  for (const [key, value] of Object.entries(attributes)) {
    if (/[,=\r\n]/.test(key) || /[,\r\n]/.test(value)) {
      throw new Error(`Resource attribute ${key} cannot be represented in OTEL_RESOURCE_ATTRIBUTES`);
    }
  }
  return Object.entries(attributes).map(([key, value]) => `${key}=${value}`).join(',');
}
