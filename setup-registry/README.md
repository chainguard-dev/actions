# Setup OCI registry

This action installs a minimal in-memory OCI registry.

Source for the registry is available here:
https://github.com/google/go-containerregistry/tree/main/cmd/registry

## Usage

```yaml
- uses: chainguard-dev/actions/setup-registry@main
  with:
    # Port is the port to run the server on.
    # Default is 1338
    port: 1339
```

## Scenarios

```yaml
steps:
# Setup the registry on port 1338
- uses: chainguard-dev/actions/setup-registry@main

# Copy an image to the registry.
- run: crane cp cgr.dev/chainguard/static localhost:1338/static

# Build an image to the registry.
- env:
    KO_DOCKER_REPO: localhost:1338/app
  run: ko build ./cmd/app
```
