# EOF newline

This action flags files that are missing newlines at the end of the file.

This code is also derived from a similar check originally contributed to
Knative.

## Usage

```yaml
- uses: chainguard-dev/actions/eof-newline@main
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: chainguard-dev/actions/eof-newline@main
```
