# Setup KinD

This action spins up a KinD cluster with a handful of useful knobs exposed.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-kind@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # K8s version is the minor version of Kubernetes to install (with v).
    # For example, v1.29.x.
    # Required.
    k8s-version: 1.31.x
    # KinD Version is the version of KinD to use to orchestrate things (without v).
    # For example, 0.27.0.
    # Required.
    kind-version: 0.27.0
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
    # Feature Gates is a list of comma-separated feature gates to enable.
    # For example, InPlacePodVerticalScaling,HPAScaleToZero.
    # Optional.
    feature-gates: InPlacePodVerticalScaling,HPAScaleToZero
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-kind@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    k8s-version: 1.31.x
```
