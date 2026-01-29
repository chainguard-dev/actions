# Close PRs

This action closes a pull request with a comment. Useful for repositories that want to automatically close external PRs or enforce contribution policies.

## Usage

```yaml
- uses: chainguard-dev/actions/close-prs@main
  with:
    # The comment to post when closing the PR
    comment: "This pull request is being closed."
```

## Requirements

- The workflow must have write permissions for pull requests
- The `GITHUB_TOKEN` must have `pull-requests: write` permission

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `comment` | The comment to post when closing the pull request | No | `This pull request is being closed.` |

## Examples

### Close all external PRs with a custom message

```yaml
name: Close External PRs

on:
  pull_request_target:
    types: [opened]

jobs:
  close:
    runs-on: ubuntu-latest
    # Only run for PRs from forks
    if: github.event.pull_request.head.repo.fork == true
    steps:
      - uses: chainguard-dev/actions/close-prs@main
        with:
          comment: |
            Thank you for your interest in contributing!

            This repository does not accept external pull requests. Please open an issue to discuss your proposed changes first.
```

### Close PRs to protected branches

```yaml
name: Protect Main Branch

on:
  pull_request_target:
    types: [opened]
    branches:
      - main

jobs:
  close:
    runs-on: ubuntu-latest
    # Only close PRs not from the organization
    if: github.event.pull_request.head.repo.owner.login != 'your-org'
    steps:
      - uses: chainguard-dev/actions/close-prs@main
        with:
          comment: "Direct PRs to main are not allowed. Please target a feature branch."
```

### Close all PRs (read-only repository)

```yaml
name: Close All PRs

on:
  pull_request_target:
    types: [opened]

jobs:
  close:
    runs-on: ubuntu-latest
    steps:
      - uses: chainguard-dev/actions/close-prs@main
        with:
          comment: |
            This repository is read-only and does not accept pull requests.

            The source of truth is maintained in an internal repository.
```
