# Setup Knative Eventing

This action installs Knative Eventing into the current kubectl context.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-knative-eventing@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Version is the version of Knative Eventing to install.
    # (defaults to 1.11.0)
    version: 1.11.0
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-knative-eventing@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    version: 1.11.0
```
