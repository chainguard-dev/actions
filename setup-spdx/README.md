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
      - uses: chainguard-dev/actions/setup-spdx@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
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
      - uses: actions/setup-go@0aaccfd150d50ccaeb58ebd88d36e91967a5f35b # v5.4.0
        with:
          go-version: '1.24'
          check-latest: true

      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - run: |
          go run ./cmd/bom/main.go generate -i registry.k8s.io/pause > example-image-pause.spdx
          go run ./cmd/bom/main.go generate --format=json -i registry.k8s.io/pause > example-image-pause.spdx.json

      - uses: chainguard-dev/actions/setup-spdx@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
        with:
          spdx-tools-version: 1.1.8

      - uses: chainguard-dev/actions/setup-spdx@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
        with:
          download: false
          spdx-tools-version: 1.1.8
          sbom-path: example-image-pause.spdx

      - uses: chainguard-dev/actions/setup-spdx@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
        with:
          download: false
          spdx-tools-version: 1.1.8
          sbom-path: example-image-pause.spdx.json

      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        if: ${{ always() }}
        with:
          name: Example SBOMs
          path: |
            example-image-pause.spdx
            example-image-pause.spdx.json
```