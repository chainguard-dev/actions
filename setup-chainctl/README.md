# Setup `chainctl`

This action installs the latest `chainctl` binary for a particular environment
and authenticates with it using identity tokens.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-chainctl@main
  with:
    # environment determines the environment from which to download the chainctl
    # binary from.
    # Optional (default is enforce.dev)
    environment: enforce.dev

    # identity holds the ID for the identity this workload should assume when
    # speaking to Chainguard APIs.
    identity: "..."
```

## Scenarios

```yaml
permissions:
  id-token: write

steps:
- uses: chainguard-dev/actions/setup-chainctl@main
  with:
    identity: "deadbeef/badf00d"
```
