# Setup KinD

This action spins up a KinD cluster with a handful of useful knobs exposed.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-kind@main
  with:
    # K8s version is the minor version of Kubernetes to install.
    # For example, 1.23.x.
    # Required.
    k8s-version: 1.23.x
    # KinD Version is the version of KinD to use to orchestrate things.
    # For example, 0.12.0.
    # Required.
    kind-version: 0.16.0
    # Registry Authority is the authority of the local container registry to
    # stand up for this KinD cluster.
    # For example, registry.local:5000.
    # Required.
    registry-authority: registry.local:5000
    # Registry Mirror is the hostname of a registry mirror to use for DockerHub
    # to avoid rate-limiting.
    # For example, mirror.gcr.io.
    # Required.
    registry-mirror: mirror.gcr.io
    # Cluster Suffix is the DNS suffix used for Kubernetes services.
    # For example, cluster.local.
    # Required.
    cluster-suffix: cluster.local
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-kind@main
  with:
    k8s-version: 1.23.x
```
