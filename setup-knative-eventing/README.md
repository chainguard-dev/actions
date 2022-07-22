# Setup Knative Eventing

This action installs Knative Eventing into the current kubectl context.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-knative-eventing@main
  with:
    # Version is the version of Knative Eventing to install.
    # (defaults to 1.5.0)
    version: 1.5.0
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-knative-eventing@main
  with:
    version: 1.5.0
```
