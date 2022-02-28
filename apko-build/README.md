# APKO Build

This action builds an image with APKO given a config file and tag to use.

## Usage

```yaml
- uses: chainguard-dev/actions/apko-build@main
  with:
    # Config is the configuration file to use for the image build.
    # Optional, will use .apko.yaml without a defined one.
    config: foo.yaml
    # Tag is the tag that will be published.
    # Required.
    tag: ghcr.io/chainguard-dev/apko-example:latest
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/apko-build@main
  with:
    config: nginx.yaml
    tag: ghcr.io/chainguard-dev/apko-example:nginx
```
