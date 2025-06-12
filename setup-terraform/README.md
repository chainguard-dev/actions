# setup-terraform

This action downloads and configures terraform using the `.terraform-version` file
to set the version or falls back to a default version to work within a GitHub Action.


## Usage

```yaml
- uses: chainguard-dev/actions/setup-terraform@b84fe5f9e5f9144c970b29aaf83ea851a6768e25 # v1.2.0
  with:
    terraform-version-file: '.terraform-version'
```
