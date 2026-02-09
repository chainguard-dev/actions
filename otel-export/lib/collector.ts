import * as core from '@actions/core';
import * as github from '@actions/github';
import type { WorkflowMetrics, StepMetrics } from './types.js';

type Octokit = ReturnType<typeof github.getOctokit>;
type Context = typeof github.context;

interface GitHubJob {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  runner_name: string | null;
  labels: string[];
  steps?: {
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
    started_at?: string | null;
    completed_at?: string | null;
  }[];
}

export function findCurrentJob(jobs: GitHubJob[], currentJobName: string): GitHubJob {
  const exactMatch = jobs.find((job) => job.name === currentJobName);
  if (exactMatch) return exactMatch;

  // For matrix jobs, GITHUB_JOB is the base name without matrix values
  const matrixJobs = jobs.filter((job) => job.name.startsWith(currentJobName + ' ('));

  if (matrixJobs.length === 1) {
    return matrixJobs[0];
  } else if (matrixJobs.length > 1) {
    const runnerName = process.env.RUNNER_NAME;
    if (runnerName) {
      const jobByRunner = matrixJobs.find((j) => j.runner_name === runnerName);
      if (jobByRunner) return jobByRunner;
    }

    const inProgress = matrixJobs.find((j) => j.status === 'in_progress');
    if (inProgress) return inProgress;

    return matrixJobs.sort((a, b) => {
      const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
      const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
      return bTime - aTime;
    })[0];
  }

  // Fallback — may pick the wrong job in multi-job workflows
  const job = jobs[0];
  if (!job) throw new Error('No jobs found for this workflow run');
  core.warning(`Could not match job name "${currentJobName}", falling back to "${job.name}"`);
  return job;
}

export function parseSteps(rawSteps: GitHubJob['steps']): StepMetrics[] {
  return (rawSteps ?? []).map((step) => {
    const startedAt = step.started_at ? new Date(step.started_at) : null;
    const completedAt = step.completed_at ? new Date(step.completed_at) : null;
    const durationMs =
      startedAt && completedAt ? completedAt.getTime() - startedAt.getTime() : 0;

    return {
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
      number: step.number,
      startedAt,
      completedAt,
      durationMs,
    };
  });
}

export function inferJobConclusion(jobConclusion: string | null, steps: StepMetrics[]): string {
  if (jobConclusion && jobConclusion !== 'unknown') return jobConclusion;

  const completedSteps = steps.filter((s) => s.conclusion !== null);
  if (completedSteps.some((s) => s.conclusion === 'failure')) return 'failure';
  if (completedSteps.some((s) => s.conclusion === 'cancelled')) return 'cancelled';
  if (
    completedSteps.length > 0 &&
    completedSteps.every((s) => s.conclusion === 'success' || s.conclusion === 'skipped')
  ) {
    return 'success';
  }
  return 'unknown';
}

export function extractPRNumber(context: Context): number | null {
  const fromPayload = context.payload?.pull_request?.number;
  if (fromPayload != null) return fromPayload;

  const match = process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\/merge/);
  if (match) return parseInt(match[1], 10);

  return null;
}

/**
 * Returns a snapshot of step conclusions for comparison between polls.
 * Used to detect when the API data has stabilized.
 */
function stepConclusionSnapshot(steps: GitHubJob['steps']): string {
  return (steps ?? [])
    .map((s) => `${s.number}:${s.conclusion ?? 'null'}`)
    .join(',');
}

/**
 * Checks whether step data contains a terminal conclusion (failure, cancelled,
 * timed_out) that indicates the API has caught up with the actual runner state.
 */
function hasTerminalConclusion(steps: GitHubJob['steps']): boolean {
  return (steps ?? []).some(
    (s) => s.conclusion === 'failure' || s.conclusion === 'cancelled' || s.conclusion === 'timed_out',
  );
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

async function fetchJobWithStableSteps(
  octokit: Octokit,
  owner: string,
  repo: string,
  runId: number,
  currentJobName: string,
): Promise<GitHubJob> {
  let previousSnapshot = '';

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    const job = findCurrentJob(data.jobs as GitHubJob[], currentJobName);
    const snapshot = stepConclusionSnapshot(job.steps);

    // A terminal conclusion means the API has caught up with the failure.
    if (hasTerminalConclusion(job.steps)) {
      core.info(`Step data settled on attempt ${attempt} (terminal conclusion found)`);
      return job;
    }

    // If the snapshot matches the previous poll, data has stabilized.
    if (attempt > 1 && snapshot === previousSnapshot) {
      core.info(`Step data settled on attempt ${attempt} (stable between polls)`);
      return job;
    }

    if (attempt < MAX_POLL_ATTEMPTS) {
      core.info(`Waiting for step data to settle (attempt ${attempt}/${MAX_POLL_ATTEMPTS})...`);
      previousSnapshot = snapshot;
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    } else {
      core.warning(`Step data may be stale after ${MAX_POLL_ATTEMPTS} attempts, proceeding anyway`);
      return job;
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error('Unexpected: exhausted poll loop without returning');
}

export async function collectMetrics(octokit: Octokit, context: Context): Promise<WorkflowMetrics> {
  const { owner, repo } = context.repo;
  const runId = context.runId;

  core.info(`Collecting metrics for run ${runId} in ${owner}/${repo}`);

  const currentJobName = process.env.GITHUB_JOB ?? 'unknown';

  const [job, { data: workflowRun }] = await Promise.all([
    fetchJobWithStableSteps(octokit, owner, repo, runId, currentJobName),
    octokit.rest.actions.getWorkflowRun({ owner, repo, run_id: runId }),
  ]);

  core.info(`Analyzing job: ${job.name} (${job.id})`);

  const steps = parseSteps(job.steps);

  const jobStartedAt = job.started_at ? new Date(job.started_at) : new Date();
  const jobCompletedAt = job.completed_at ? new Date(job.completed_at) : new Date();
  const jobDurationMs = jobCompletedAt.getTime() - jobStartedAt.getTime();

  const runStartedAt = workflowRun.run_started_at
    ? new Date(workflowRun.run_started_at)
    : jobStartedAt;
  const queueDurationMs = Math.max(0, jobStartedAt.getTime() - runStartedAt.getTime());

  const jobConclusion = inferJobConclusion(job.conclusion, steps);
  const prNumber = extractPRNumber(context);

  const workflowName = context.workflow || 'unknown';

  return {
    workflow: workflowName,
    job: {
      name: job.name,
      id: job.id,
      status: job.status || 'in_progress',
      conclusion: jobConclusion,
      startedAt: jobStartedAt,
      completedAt: jobCompletedAt,
      durationMs: jobDurationMs,
      queueDurationMs,
    },
    steps,
    repository: {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
    },
    run: {
      id: context.runId,
      number: context.runNumber,
      attempt: process.env.GITHUB_RUN_ATTEMPT || '1',
    },
    git: {
      sha: context.sha || process.env.GITHUB_SHA || '',
      ref: context.ref || process.env.GITHUB_REF || '',
      refName: process.env.GITHUB_REF_NAME || null,
    },
    event: {
      name: context.eventName || process.env.GITHUB_EVENT_NAME || '',
      actor: context.actor || process.env.GITHUB_ACTOR || '',
      prNumber,
    },
    runner: {
      os: process.env.RUNNER_OS || 'unknown',
      arch: process.env.RUNNER_ARCH || 'unknown',
      name: process.env.RUNNER_NAME || null,
      labels: job.labels || [],
    },
  };
}
