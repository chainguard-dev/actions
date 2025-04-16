# Clank

This action runs [clank](https://github.com/chainguard-dev/clank), which is a simple
tool that allows you to detect imposter commits in GitHub Actions workflows.

## Usage

Basic usage:

```yaml
    permissions:
      contents: read

    - uses: chainguard-dev/actions/clank@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
        with:
          workflow-path: './.github/workflows'
          token: ${{ secrets.GITHUB_TOKEN }}
```
