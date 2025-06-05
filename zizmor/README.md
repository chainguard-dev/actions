# zizmor

This Action runs a Zizmor scan from within a Wolfi container and can run both online and offline as well as upload findings to GitHub Advanced Security. It is not exhaustively configurable like the Zizmor CLI but offers a way to run scans consistently across Workflows.

The Action can be configured in several ways via these inputs:
- `octo_sts_token`*
  - Mentioned above; if empty; scans are run with the `--offline` flag
- `persona`
  - Zizmor persona to run scans with; can be `auditor`, `regular`, or `pedantic`
- `scan_category`
  - If uploading results, the category in which to store results
- `upload_results`
  - Whether to store results in a SARIF file and upload to GitHub Advanced Security

> \* If no token is passed, the Action automatically runs in offline mode. Ideally, this Action is used in conjunction with [octo-sts](https://github.com/octo-sts/action/) and _not_ the default Workflow token.

## Example Offline Workflow

```yaml
name: zizmor-scan

on:
  pull_request:

permissions: {}

jobs:
  run_zizmor:
    runs-on: ubuntu-latest

    permissions:
      actions: read
      contents: read

    name: Zizmor Scan
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Run Zizmor (Offline)
        uses: chainguard-dev/actions/zizmor@main
```


## Example Online Workflow

```yaml
name: zizmor-scan

on:
  pull_request:

permissions: {}

jobs:
  run_zizmor:
    runs-on: ubuntu-latest

    permissions:
      actions: read
      contents: read

    name: Zizmor Scan
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Set up Octo-STS
        uses: octo-sts/action@6177b4481c00308b3839969c3eca88c96a91775f # v1.0.0
        id: octo-sts
        with:
          scope: owner/repo
          identity: scan

      - name: Run Zizmor (Online)
        uses: chainguard-dev/actions/zizmor@main
        with:
          octo_sts_token: ${{ steps.octo-sts.outputs.token }}
```

## Example Results Upload

```yaml
name: zizmor-scan

on:
  pull_request:

permissions: {}

jobs:
  run_zizmor:
    runs-on: ubuntu-latest

    permissions:
      actions: read
      contents: read
      security-events: write

    name: Zizmor Scan
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Set up Octo-STS
        uses: octo-sts/action@6177b4481c00308b3839969c3eca88c96a91775f # v1.0.0
        id: octo-sts
        with:
          scope: owner/repo
          identity: scan

      - name: Run Zizmor and Upload Results
        uses: chainguard-dev/actions/zizmor@main
        with:
          octo_sts_token: ${{ steps.octo-sts.outputs.token }}
          upload_results: "true"
```
