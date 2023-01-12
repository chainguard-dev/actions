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
    # environment determines the environment from which to download the binary
    # from.
    # Optional (default is enforce.dev)
    environment: enforce.dev
    # audience is the identity token audience to use when creating an identity
    # token to authenticate with Chainguard.
    # Optional (default is https://issuer.enforce.dev)
    audience: https://issuer.enforce.dev
    # invite-code is an invitation code that may be used to have this workload
    # register itself with the Chainguard API the first time it executes.
    # Optional.
    invite-code: ${{ secrets.CHAINGUARD_INVITE_CODE }}
```

## Scenarios

```yaml
permissions:
  id-token: write

steps:
- uses: chainguard-dev/actions/setup-chainguard-terraform@main
  with:
    invite-code: ${{ secrets.CHAINGUARD_INVITE_CODE }}
```
