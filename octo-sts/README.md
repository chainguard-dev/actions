# `octo-sts`

This action federates the Github actions identity token for a Github App token
according to the Trust Policy in the target organization or repository.

## Usage

```yaml
permissions:
  id-token: write # Needed to federate tokens.

steps:
- uses: chainguard-dev/actions/octo-sts@main
  id: octo-sts
  with:
    # environment determines the environment from which to download the chainctl
    # binary from.
    # Optional (default is enforce.dev)
    scope: your-org/your-repo

    # identity holds the ID for the identity this workload should assume when
    # speaking to Chainguard APIs.
    identity: foo

- env:
    GH_TOKEN: ${{ steps.octo-sts.outputs.token }}
  run: |
    gh repo list
```

The above will load a "trust policy" from `.github/chainguard/foo.sts.yaml` in
the repository `your-org/your-repo`.  Suppose this contains the following, then
workflows in `my-org/my-repo` will receive a token with the specified
permissions on `my-org/my-repo`.

```yaml
issuer: https://token.actions.githubusercontent.com
subject: repo:my-org/my-repo:ref:refs/heads/main

permissions:
  contents: read
  issues: write
```
