# SPDX Tools Install and SBOM Verification

This action installs the SPDX Java tools into the workflow
environment and optionally verifies an SBOM to ensure its
syntax conforms to the SPDX spec.

## Steps

It has two steps, both are optional:

### Install SPDX Tools

By default, the action will download and uncompress the java SPDX
tools in the current directory. You can skip this step if running
several validation steps.

### Validate SBOM

If an SBOM path is specified in the inputs, the action will run
the `Verify` subcommand to check the syntax of the SBOM.

## Usage 

Here is a minimal example validating an SBOM stored in `sbom.spdx`:

```yaml
name: Validate SBOMs

on:
  pull_request:
    branches: ['main']

jobs:
  check-spdx:
    name: Check SPDX SBOM
    runs-on: ubuntu-latest
    steps:
      - uses: chainguard-dev/actions/setup-spdx@main
        with:
          sbom-path: sbom.spdx
```

Here is a full example, it was initially written for the
[Kubernetes `bom` tool](https://github.com/kubernetes-sigs/bom)
verification step. It runs the action 3 times one to set up 
the tools and one to verify each SBOM format (tag-value, json):

```yaml
name: Validate SBOMs

on:
  pull_request:
    branches: ['main']
  push:

jobs:
  check-spdx:
    name: Check SPDX SBOMs
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@d0a58c1c4d2b25278816e339b944508c875f3613 # v3.4.0
        with:
          go-version: 1.18
          check-latest: true
      - uses: actions/checkout@93ea575cb5d8a053eaa0ac8fa3b40d7e05a33cc8 # v3.1.0
      - run: |
          go run ./cmd/bom/main.go generate -i registry.k8s.io/pause > example-image-pause.spdx
          go run ./cmd/bom/main.go generate --format=json -i registry.k8s.io/pause > example-image-pause.spdx.json
      - uses: chainguard-dev/actions/setup-spdx@spdx
        with:
          spdx-tools-version: 1.1.0
      - uses: chainguard-dev/actions/setup-spdx@main
        with:
          download: false
          spdx-tools-version: 1.1.0
          sbom-path: example-image-pause.spdx
      - uses: chainguard-dev/actions/setup-spdx@main
        with:
          download: false
          spdx-tools-version: 1.1.0
          sbom-path: example-image-pause.spdx.json
      - uses: actions/upload-artifact@v3
        if: ${{ always() }}
        with:
          name: Example SBOMs
          path: |
            example-image-pause.spdx
            example-image-pause.spdx.json
```