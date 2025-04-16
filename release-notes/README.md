# release-notes

This action installs the latest `release-notes` binary from https://github.com/kubernetes/release/tree/master/cmd/release-notes
and generate the release notes for a particular start/end revision and will open a PR to update the changes.

## Usage

```yaml
- uses: chainguard-dev/actions/release-notes@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    # Name of the branch that will be used to fetch the changelog
    # Required.
    branch_name: 'main'
    # Start Tag (defaults to merge-base(branch, prev-branch))
    # Optional.
    start_rev: 6937ed05c9dvdv59ac67528365c2d3964e793b516
    # End Tag (defaults to HEAD of the target branch)
    # Optional.
    end_rev: 6937ed05c9dvdv59ac67528365c2d3964e793b517
    # Name of the file that the changelog will be updated
    # Optional.
    changelog_filename:  'CHANGELOG.md'
    # GITHUB_TOKEN with `contents` and `pull-requests` permissions or a `repo` scoped Personal Access Token (PAT)
    # Required.
    token: ${{ secrets.GITHUB_TOKEN }}

```

## Scenarios

```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write

steps:
- uses: chainguard-dev/actions/release-notes@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    branch_name: 'main'
    start_rev: 6937ed05c9dvdv59ac67528365c2d3964e793b516
    end_rev: 6937ed05c9dvdv59ac67528365c2d3964e793b517
    changelog_filename:  'CHANGELOG.md'
    token: ${{ secrets.GITHUB_TOKEN }}
```
