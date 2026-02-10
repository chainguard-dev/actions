# Chainguard Install

> **Warning**
> This action is experimental and may change or be removed without notice.

A GitHub Action to install APK packages from [Chainguard](https://chainguard.dev) repositories into your workflow.

This action bootstraps the `apk` package manager, installs `chainctl`, and optionally authenticates with Chainguard to access private APK repositories.

## Usage

```yaml
- uses: chainguard-dev/actions/chainguard-install@main
  with:
    packages: "cosign, crane"
```

### Using the `bin` output

The `bin` output is automatically added to `$GITHUB_PATH`, but you can also reference it explicitly in subsequent steps:

```yaml
- uses: chainguard-dev/actions/chainguard-install@main
  id: install
  with:
    packages: "cosign"

- run: ${{ steps.install.outputs.bin }}/cosign version
```

### With private repository access

To access private APK repositories, you need a Chainguard assumable identity.
See [Create an Assumable Identity for a GitHub Actions Workflow](https://edu.chainguard.dev/chainguard/administration/assumable-ids/identity-examples/github-identity/) for setup instructions.

```yaml
- uses: chainguard-dev/actions/chainguard-install@main
  with:
    packages: "my-private-package"
    identity: "<chainguard-identity>"
    org: "<chainguard-org>"
```

## Inputs

| Name       | Description                                                    | Required | Default |
| ---------- | -------------------------------------------------------------- | -------- | ------- |
| `packages` | Packages to install (comma or space-separated)                 | No       | `''`    |
| `identity` | Chainguard identity for authentication                         | No       | `''`    |
| `org`      | Chainguard organization name for private APK repository access | No       | `''`    |

## Outputs

| Name       | Description                             |
| ---------- | --------------------------------------- |
| `apk-root` | APK root directory                      |
| `bin`      | Directory containing installed binaries |
