# Run shellcheck on stuff.

This action installs shellcheck into /usr/local/bin
and then invokes it on shell programs under your working
directory.

## Usage
Default value for version is 'stable'

```yaml
- uses: chainguard-dev/actions/shellcheck@xxxxxxxxxxxx # vX.Y.Z
```

```yaml
- uses: chainguard-dev/actions/shellcheck@xxxxxxxxxxxx # vX.Y.Z
  with:
    version: v0.10.0
    paths: tools/ scripts/
```

You can also specify a json blob to pass arguments, which
allows you to easily pass multiple paths or excludes without
shell escaping.
```
- uses: chainguard-dev/actions/shellcheck@xxxxxxxxxxxxx # v1.5.0
  with:
    config_json: |
      {
        "excludes": ["[.]git/.*", ".*.swp"],
        "paths": ["src/", "tools/"],
        "match_filename": true,
        "match_shbang": false,
        "call_combined": true
      }
```
