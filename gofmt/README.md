# `gofmt`

This action runs `gofmt` over each module it discovers in the working tree and
ensures it produces no differences.  It automatically ignores several classes of
generated files, which are known to produce potentially unformatted code.

This code is also derived from a similar check originally contributed to
Knative.


## Usage

```yaml
- uses: chainguard-dev/actions/gofmt@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Args to pass to gofmt. For example, "-s".
    # Optional.
    args: "-s"
```

## Scenarios

```yaml
steps:
  - uses: actions/setup-go@0aaccfd150d50ccaeb58ebd88d36e91967a5f35b # v5.4.0
    with:
      go-version: '1.24'
      check-latest: true

  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

  - uses: chainguard-dev/actions/gofmt@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
    with:
      args: "-s"
```
