# Setup Mirror

This action configures the actions runner to use a container registry mirror.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-mirror@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Mirror is the hostname of the registry mirror. For example, mirror.gcr.io.
    # Required.
    mirror: mirror.gcr.io
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-mirror@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    mirror: mirror.gcr.io
```
