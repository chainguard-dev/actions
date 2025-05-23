# Setup `mink`

This action installs the [`mink`](https://github.com/mattmoor/mink) CLI into the
actions workflow.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-mink@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Version is the version of mink to install.
    # For example, 1.1.0.
    # Required.
    version: 1.1.0
```

## Scenarios

```yaml
steps:
# Install the mink CLI
- uses: chainguard-dev/actions/setup-mink@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    version: 1.1.0

# (optional) Install mink on the current context.
- run: mink install
```
