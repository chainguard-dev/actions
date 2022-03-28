# Setup `chainctl`

This action installs the latest `chainctl` binary for a particular environment
and authenticates with it using identity tokens.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-chainctl@main
  with:
    # environment determines the environment from which to download the chainctl
    # binary from, it is required and has no default (for now).
    # Required.
    environment: cookie-monster
    # audience is the identity token audience to use when creating an identity
    # token to authenticate with Chainguard, it is rquired and has no default
    # (for now).
    # Required.
    audience: oscar-the-grouch
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
- uses: chainguard-dev/actions/setup-chainctl@main
  with:
    environment: big-bird
    audience: elmo
    invite-code: ${{ secrets.CHAINGUARD_INVITE_CODE }}
```
