# Clank

This action runs [clank](https://github.com/chainguard-dev/clank), which is a simple
tool that allows you to detect imposter commits in GitHub Actions workflows.

## Usage

Basic usage:

```yaml
    permissions:
      contents: read

    - uses: chainguard-dev/actions/clank@main
        with:
          workflow-path: './.github/workflows'
          token: ${{ secrets.GITHUB_TOKEN }}
```
