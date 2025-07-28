# Run shellcheck on stuff.

This action installs shellcheck into /usr/local/bin
and then invokes it on shell programs under your working
directory.

## just a comment

## Usage
Default value for version is 'stable'

```yaml
- uses: chainguard-dev/actions/shellcheck@xxxxxxxxxxxx # vX.Y.Z
```

```yaml
- uses: chainguard-dev/actions/shellcheck@xxxxxxxxxxxx # vX.Y.Z
  with:
    version: v0.10.0
```
