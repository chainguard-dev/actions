# `golangci-lint`

The action runs golangci-lint and reports issues from linters.

## Usage

```yaml
- uses: chainguard-dev/actions/golangci-lint@main
  with:
    # Args to pass to golangci-lint. For example, "--issues-exit-code=0".
    # Optional.
    args: "--issues-exit-code=0"
```

## Scenarios

```yaml
steps:
  - uses: actions/setup-go@v2
    with:
      go-version: 1.17.x

  - uses: actions/checkout@v2

  - uses: chainguard-dev/actions/golangci-lint@main
    with:
      args: "--issues-exit-code=0"
```
