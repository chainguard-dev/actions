# Setup `yamlfmt`

This action installs [`yamlfmt`](https://github.com/google/yamlfmt) into the
actions environment.

## Usage

The action has one parameter `version` which is the version of yamlfmt to
install. It can take a release tag (eg v0.6.0), "latest", or "tip". The
latter requiring the go binary in the path to compile it.

```yaml
- uses: chainguard-dev/actions/setup-yamlfmt@main
  with:
    version: v0.6.0
```

