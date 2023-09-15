# `goimports`

This action runs `goimports` over each module it discovers in the working tree
and ensures it produces no differences.  It automatically ignores several
classes of generated files, which are known to produce potentially unformatted
code.

This code is also derived from a similar check originally contributed to
Knative.


## Usage

```yaml
- uses: chainguard-dev/actions/goimports@main
```

## Scenarios

```yaml
steps:
  - uses: actions/setup-go@v3
    with:
      go-version: '1.21'
      check-latest: true

  - uses: actions/checkout@v3

  - uses: chainguard-dev/actions/goimports@main
```
