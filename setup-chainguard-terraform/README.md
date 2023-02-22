# Setup `chainguard-terraform-provider`

This action configures the use of the Chainguard terraform provider for a
particular Chainguard environment.  There are two main things this does:
1. Installs/Authenticates `chainctl` for the particular environment,
2. Configure a `~/.terraformrc` that pulls the Chainguard provider from our GCS
  bucket for this environment.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-chainguard-terraform@main
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
- uses: chainguard-dev/actions/setup-chainguard-terraform@main
  with:
    identity: "deadbeef/badf00d"
```
