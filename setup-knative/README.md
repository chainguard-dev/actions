# Setup Knative

This action installs Knative Serving and Eventing into the current kubectl
context.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-knative@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Version is the version of Knative to install.
    # For example, 1.11.0.
    # Required.
    version: 1.11.0
    # Version is the version of Istio to install.
    # For example, 1.17.5.
    istio-version: 1.17.5
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
- uses: chainguard-dev/actions/setup-knative@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    version: 1.11.0
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
