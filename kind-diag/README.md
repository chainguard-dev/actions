# KinD Diagnostics

This action describes a handful of core resources, such as
nodes and pods.  It then uploads the logs from the KinD
cluster to the action run.

## Usage

```yaml
- uses: chainguard-dev/actions/kind-diag@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
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
  - uses: actions/setup-go@0aaccfd150d50ccaeb58ebd88d36e91967a5f35b # v5.4.0
    with:
      go-version: '1.24'

  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

  # Run some KinD-based testing.

  - uses: chainguard-dev/actions/kind-diag@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
    # Only upload logs on failure.
    if: ${{ failure() }}
    with:
      cluster-resources: nodes
      namespace-resources: pods,ksvc,taskruns
```