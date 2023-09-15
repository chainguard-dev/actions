# KinD Diagnostics

This action describes a handful of core resources, such as
nodes and pods.  It then uploads the logs from the KinD
cluster to the action run.

## Usage

```yaml
- uses: chainguard-dev/actions/kind-diag@main
  if: ${{ failure() }}
  with:
    # Cluster Resources. For example, nodes.
    # Required.
    cluster-resources: nodes

    # Namespace Resources. For example, pods
    # Required.
    namespace-resources: pods
```

## Scenarios

### Dump Knative Services and Tekton TaskRuns on failure

```yaml
steps:
  - uses: actions/setup-go@v3
    with:
      go-version: '1.21'

  - uses: actions/checkout@v3

  # Run some KinD-based testing.

  - uses: chainguard-dev/actions/kind-diag@main
    # Only upload logs on failure.
    if: ${{ failure() }}
    with:
      cluster-resources: nodes
      namespace-resources: pods,ksvc,taskruns
```