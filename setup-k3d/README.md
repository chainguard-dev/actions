# Setup K3d

This action spins up a K3D cluster with a handful of useful knobs exposed.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-k3d@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Image to use for k3s. This also inherently sets the k3s version.
    # For example, cgr.dev/chainguard/k3s:latest
    k3s-image: cgr.dev/chainguard/k3s:latest
    # The version of k3d to use.
    k3d-version: 5.5.1
    # Registry Host is the authority of the local container registry to
    # stand up for this K3D cluster.
    # For example, registry.local
    registry-host: registry.local
    # Registry port is the port of the registry to expose
    registry-port: 5000
    # Registry Mirror is the hostname of a registry mirror to use for DockerHub
    # to avoid rate-limiting.
    # For example, mirror.gcr.io.
    # Required.
    registry-mirror: mirror.gcr.io
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-k3d@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```
