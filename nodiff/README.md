# Verify No Diffs

This action runs after some auto-formatting tool that contributors are expected
to run to confirm that there are no differences.

Generally this action will be consumed through a higher-level action that
performs formatting.

## Usage

```yaml
- uses: chainguard-dev/actions/nodiff@1df2b5598adffbfe72a3abe9243d73e338bbb006 # v1.4.10
  with:
    # Set when checkout to a non-default path.
    path: ""
    # Fixup Command. For example, gofmt -w -s
    # Required.
    fixup-command: ""
```

## Scenarios

```yaml
steps:
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

# Format all the Go files in the working tree.
- run: gofmt -w $(find . -name '*.go')

# Flag any differences from gofmt.
- uses: chainguard-dev/actions/nodiff@1df2b5598adffbfe72a3abe9243d73e338bbb006 # v1.4.10
  with:
    path: "src/github.com/${{ github.repository }}"
    fixup-command: "gofmt -w"
```
