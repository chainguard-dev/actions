# `gofmt`

This action runs `gofmt` over each module it discovers in the working tree and
ensures it produces no differences.  It automatically ignores several classes of
generated files, which are known to produce potentially unformatted code.

This code is also derived from a similar check originally contributed to
Knative.


## Usage

```yaml
- uses: chainguard-dev/actions/gofmt@main
  with:
    # Args to pass to gofmt. For example, "-s".
    # Optional.
    args: "-s"
```

## Scenarios

```yaml
steps:
  - uses: actions/setup-go@v2
    with:
      go-version: 1.17.x

  - uses: actions/checkout@v2

  - uses: chainguard-dev/actions/gofmt@main
    with:
      args: "-s"
```
