# setup-terraform

This action downloads and configures terraform using the `.terraform-version` file
to set the version or falls back to a default version to work within a GitHub Action.


## Usage

```yaml
- uses: chainguard-dev/actions/setup-terraform@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    terraform-version-file: '.terraform-version'
```
