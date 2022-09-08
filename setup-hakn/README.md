# Setup chainguard-dev/hakn 

This action installs chainguard-dev/hakn Knative into the current kubectl context.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-hakn@main
  with:
    # Version is the version of hakn to install.
    # (defaults to 1.7.0)
    version: 1.7.0
    # istio-version is the version of Istio to install.
    # (defaults to 1.14.0)
    istio-version: 1.14.0
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
- uses: chainguard-dev/actions/setup-hakn@main
  with:
    version: 1.7.0
    istio-version: 1.14.0
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
