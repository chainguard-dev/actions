# Image Digest Update (digesta-bot)

This action updates a image digest when using the tag+digest pattern.
If the tag is mutable it will have a new digest when the tag is updated.
If there is a change in the digest this action will update to the latest digest
and open a PR

## Usage

```yaml
    - uses: chainguard-dev/actions/digesta-bot@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Scenarios

```yaml
name: Image digest update

on:
  workflow_dispatch:
  schedule:
    # At the end of every day
    - cron: "0 0 * * *"

jobs:
  image-update:
    name: Image digest update
    runs-on: ubuntu-latest

    permissions:
      contents: write
      pull-requests: write

    steps:
    - uses: actions/checkout@v3
    - uses: chainguard-dev/actions/digesta-bot@main
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
```
