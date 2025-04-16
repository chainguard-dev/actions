# APKO Build

This action builds an image with APKO given a config file and tag to use.

## Usage

```yaml
- uses: chainguard-dev/actions/apko-build@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Config is the configuration file to use for the image build.
    # Optional, will use .apko.yaml without a defined one.
    config: foo.yaml
    # Tag is the tag that will be published.
    # Required.
    tag: ghcr.io/chainguard-dev/apko-example:latest
    # Image Refs is the path to a file where apko should emit a newline
    # delimited list of published image digests.
    # Optional, will use a temporary file when unspecified.
    image_refs: foo.images
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/apko-build@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  id: apko
  with:
    config: nginx.yaml
    tag: ghcr.io/chainguard-dev/apko-example:nginx

- shell: bash
  run: |
    COSIGN_EXPERIMENTAL=true cosign sign ${{ steps.apko.outputs.digest }}
```
