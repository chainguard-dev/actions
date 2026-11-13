# Setup `gcsfuse`

This action installs a pinned, sha256-verified `gcsfuse` .deb (default
`v3.13.0`). gcsfuse publishes no checksums, so for any other version pass
the .deb's `sha256` for the runner's arch:

```yaml
- uses: chainguard-dev/actions/setup-gcsfuse@<sha>
  with:
    version: v3.11.5
    sha256: <sha256 of gcsfuse_3.11.5_amd64.deb>
```

`version: tip` and `version: latest-release` are no longer supported.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-gcsfuse@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-gcsfuse@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```
