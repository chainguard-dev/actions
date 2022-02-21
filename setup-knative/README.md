# Setup Knative

This action installs Knative Serving and Eventing into the current kubectl
context.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-knative@main
  with:
    # Version is the version of Knative to install.
    # For example, 1.2.
    # Required.
    version: 1.2
    # Serving Features is the encoded JSON containing the features to enable
    # in this installation of Knative Serving.
    # For example, {"kubernetes.podspec-fieldref":"enabled"}.
    # Required.
    serving-features: '{}'
    # Serving Defaults is the encoded JSON containing the default values for
    # this installation of Knative Serving.
    # For example, {"revision-timeout-seconds":"120"}.
    # Required.
    serving-defaults: '{}'
    # Serving Autoscaler is the encoded JSON containing the autoscaler settings
    # in this installation of Knative Serving.
    # For example, {"min-scale":"1"}.
    # Required.
    serving-autoscaler: '{}'
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-knative@main
  with:
    version: 1.2
    serving-features: >
      {
        "kubernetes.podspec-fieldref": "enabled",
        "kubernetes.podspec-securitycontext": "enabled"
      }
    serving-defaults: >
      {
        "revision-timeout-seconds": "120",
        "container-concurrency": "1"
      }
    serving-autoscaler: >
      {
        "min-scale": "2",
        "max-scale": "3"
      }

```
