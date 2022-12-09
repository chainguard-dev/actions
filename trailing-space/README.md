# Trailing Space

This action flags trailing whitespace at the end of lines for removal.

This code is also derived from a similar check originally contributed to
Knative.

## Usage

```yaml
- uses: chainguard-dev/actions/trailing-space@main
  with:
    # Set when checkout to a non-default path.
    path: ""
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: chainguard-dev/actions/trailing-space@main
    with:
      path: "src/github.com/${{ github.repository }}"
```
