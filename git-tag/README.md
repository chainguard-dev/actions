# GitHub Action: Bump and Push Git Tag (SemVer)

This GitHub Action automatically bumps and pushes a Git tag based on the [Semantic Versioning 2.0.0](https://semver.org/) specification. It supports `major`, `minor`, `bugfix`, `prerelease`, and `build` levels, with optional support for forcing a specific version.

It uses [fsaintjacques/semver-tool](https://github.com/fsaintjacques/semver-tool) internally to handle SemVer parsing, validation, and bumping.

## 🚀 Features

- Auto-increment semantic versions from Git tags
- Customizable bump level
- Dry-run mode for testing
- Forced version tagging support
- Build metadata using timestamp

## 🧪 Inputs

| Name            | Description                                                                                 | Required | Default |
|-----------------|---------------------------------------------------------------------------------------------|----------|---------|
| `bump_level`    | Which part of the SemVer version to increment: `major`, `minor`, `patch`, `prerelease`, or `build`. | ✅       | `build` |
| `git_tag_prefix`| Git tag prefix (e.g. `v`)                                                                   | ✅       | `v`     |
| `forced_version`| A SemVer-compatible version to force instead of bumping                                     | ❌       |         |
| `dry_run`       | If `true`, do not push any tags (for testing purposes)                                      | ✅       | `false` |
| `token`         | GitHub token required to authenticate and push the tag                                      | ❌       |  `GITHUB_TOKEN`       |
| `author`        | The author name and email address (format: `Display Name <email@address.com>`)              | ❌       | `$github.actor <$github.actor_id+$github.actor@users.noreply.github.com>` |
| `committer`     | The committer name and email address (format: `Display Name <email@address.com>`)           | ❌       | github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>  |
| `use-gitsign`   | Use gitsign to sign commits                                                                 | ❌       |   `true`      |

## 📦 Outputs

| Name              | Description                        |
|-------------------|------------------------------------|
| `bumped_version`  | The computed SemVer version        |
| `git_tag`         | The full Git tag (prefix + version)|

## 🛠 Usage

```yaml
jobs:
  bump-tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Bump and push Git tag
        uses: chainguard-dev/actions/git-tag@main
        with:
          bump_level: build
          git_tag_prefix: v
          dry_run: false
          token: ${{ steps.octo-sts.outputs.token }}
          author: "octo-sts[bot] <157150467+octo-sts[bot]@users.noreply.github.com>"
          committer: "octo-sts[bot] <157150467+octo-sts[bot]@users.noreply.github.com>"
```

## Documentation

### Build Metadata

When using `bump_level: build`, the version includes build metadata based on the timestamp:

```sh
1.0.0+202504111030
```
This provides a sortable, unique identifier for CI-generated builds.

### Edge Cases

- No tags found in the repo ➝ Action fails unless forced_version is used
- Tag already exists ➝ Action fails to prevent duplicate tagging
- Invalid version ➝ Action fails with helpful error message
