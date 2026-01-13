# Bump Go Version File Action

This GitHub Action automatically checks for the latest stable Go version and updates your `.go-version` file if needed, then creates a pull request with the changes.

## Features

- Automatically fetches the latest stable Go version from go.dev
- Updates your `.go-version` file when a new version is available
- Creates or updates a pull request with the version bump
- Fully customizable PR titles, messages, and branch names
- Simple and focused - does one thing well

## Usage

### Example Workflow

```yaml
name: Bump Go Version File
on:
  schedule:
    - cron: '0 0 * * 1' # Run every Monday at midnight
  workflow_dispatch: # Allow manual triggers

jobs:
  bump-go:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@1af3b93b6815bc44a9784bd300feb67ff0d1eeb3 # v6.0.0

      - uses: chainguard-dev/actions/bump-go-version-file@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Dry-run Mode (Testing)

Use dry-run mode to test the action without creating a PR:

```yaml
- uses: chainguard-dev/actions/bump-go-version-file@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    dry-run: 'true'
```

In dry-run mode, the action will:
- Check for Go version updates
- Show what changes would be made
- Display the diff in the workflow summary
- **Not** create a pull request

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `go-version-file` | Path to the go version file | No | `.go-version` |
| `token` | GITHUB_TOKEN or a `repo` scoped PAT | Yes | `${{ github.token }}` |
| `signoff` | Add `Signed-off-by` line to commit message | No | `false` |
| `author` | Author name and email in format `Name <email>` | No | `${{ github.actor }} <...>` |
| `committer` | Committer name and email in format `Name <email>` | No | `github-actions[bot] <...>` |
| `labels-for-pr` | Comma or newline separated list of PR labels | No | `automated pr, dependencies` |
| `branch-for-pr` | Branch name for the PR | No | `bump-go-version` |
| `title-for-pr` | PR title | No | `chore: bump Go version` |
| `description-for-pr` | PR body/description | No | See action.yml |
| `commit-message` | Commit message | No | `chore: bump Go version` |
| `base-branch` | Base branch for the PR | No | `main` |
| `dry-run` | Run in dry-run mode (show changes without creating PR) | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `pull_request_number` | The PR number if created |
| `old-version` | The old Go version (e.g., `1.23.4`) |
| `new-version` | The new Go version (e.g., `1.24.0`) |

## Example `.go-version` File

Your repository should contain a `.go-version` file with just the Go version:

```
1.23.4
```

The action will update this file to the latest stable version when available.

## Permissions

Make sure your workflow has the necessary permissions:

```yaml
permissions:
  contents: write      # To push the branch
  pull-requests: write # To create PRs
```
