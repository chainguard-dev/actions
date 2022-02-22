# Github Actions Lint

This action performs a lint check on action yamls.
The linter is from https://github.com/rhysd/actionlint.

## Usage

```yaml
- uses: chainguard-dev/actions/actionlint@main
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: chainguard-dev/actions/actionlint@main
```
