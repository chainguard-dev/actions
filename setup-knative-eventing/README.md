# Setup Knative

This action installs Knative Eventing into the current kubectl context.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-knative-eventing@main
  with:
    # Version is the version of Knative Eventing to install.
    # For example, 1.2.0.
    # Required.
    version: 1.2.0
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-knative-eventing@main
  with:
    version: 1.2.0
```
