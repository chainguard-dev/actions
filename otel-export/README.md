# OpenTelemetry export

The collector, subsequent steps and the post-action share one generated
`service.instance.id` per action invocation. Use `cicd.pipeline.run.id` and
`github.run.attempt` to locate the GitHub run; the instance ID is no longer a
run ID. Deterministic trace and span IDs are unchanged. Supply the expanded
`job-name` for matrix jobs, for example `build (images/go)`.

At setup, the action exports `OTEL_RESOURCE_ATTRIBUTES` for downstream SDKs
and persists the same resource for its post-action. Existing environment
attributes (for example `component=images/go`) are preserved; action-owned
identity fields take precedence. The `attributes` input still adds attributes
to post-action metrics and spans only.

`github.sha` retains the event SHA. PR events additionally carry
`git.pr.head.revision`, `git.base.revision` and `github.pr.number`.
`git.checkout.revision` and `git.checkout.tree` describe Git HEAD when setup
runs, so place this action after checkout. They do not describe uncommitted
changes or later checkout changes. Non-Git workspaces omit checkout fields.
Post-action `vcs.ref.head.revision` now describes the PR head on PR events,
including `pull_request_target`, rather than the event's base SHA.

Resource values must be representable in the comma-delimited OTel environment
format (no commas or newlines). Invalid values follow `fail-on-error` behavior.
The post-action uses jobs from the exact run attempt and refuses ambiguous
job matches instead of silently attributing another job's results.
