# GitHub App Token

This action generates a GitHub token authenticated as a GitHub App.

## Usage

```yaml
- uses: chainguard-dev/actions/githubapp-token@main
  with:
    # The App ID of the GitHub App.
    # Required.
    app_id: 123
    # The installation against which to authenticate.
    # Required.
    installation_id: 456
    # The private key of the GitHub App.
    # Required.
    private_key: ${{ secrets.MY_PRIVATE_KEY }}
```

## Scenarios

```yaml
steps:
  - uses: chainguard-dev/actions/githubapp-token@main
    id: get-token
    with:
      app_id: 123
      installation_id: 456
      private_key: ${{ secrets.MY_PRIVATE_KEY }}
  - uses: actions/checkout@v3
    with:
      token: ${{ steps.get-token.outputs.token }}
```
