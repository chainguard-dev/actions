export interface StepMetrics {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number;
}

export interface JobMetrics {
  name: string;
  id: number;
  status: string;
  conclusion: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  queueDurationMs: number;
}

export interface WorkflowMetrics {
  workflow: string;
  job: JobMetrics;
  steps: StepMetrics[];
  repository: {
    owner: string;
    repo: string;
    fullName: string;
  };
  run: {
    id: number;
    number: number;
    attempt: string;
  };
  git: {
    sha: string;
    ref: string;
    refName: string | null;
  };
  event: {
    name: string;
    actor: string;
    prNumber: number | null;
  };
  runner: {
    os: string;
    arch: string;
    name: string | null;
    groupName: string | null;
    labels: string[];
  };
}

export interface OtelConfig {
  serviceName: string;
  serviceNamespace: string;
  metricPrefix: string;
}

export type CustomAttributes = Record<string, string>;
