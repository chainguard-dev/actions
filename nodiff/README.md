# Verify No Diffs

This action runs after some auto-formatting tool that contributors are expected
to run to confirm that there are no differences.

Generally this action will be consumed through a higher-level action that
performs formatting.

## Usage

```yaml
- uses: chainguard-dev/actions/nodiff@main
  with:
    # Fixup Command. For example, gofmt -w -s
    # Required.
    fixup-command: ""
```

## Scenarios

```yaml
steps:
- uses: actions/checkout@v2

# Format all the Go files in the working tree.
- run: gofmt -w $(find . -name '*.go')

# Flag any differences from gofmt.
- uses: chainguard-dev/actions/nodiff@main
  with:
    fixup-command: "gofmt -w"
```
