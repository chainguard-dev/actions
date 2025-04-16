# EOF newline

This action flags files that are missing newlines at the end of the file.

This code is also derived from a similar check originally contributed to
Knative.

## Usage

```yaml
- uses: chainguard-dev/actions/eof-newline@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Set when checkout to a non-default path.
    path: ""
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
  - uses: chainguard-dev/actions/eof-newline@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
    with:
      path: "src/github.com/${{ github.repository }}"
```
