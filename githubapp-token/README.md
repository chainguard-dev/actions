# GitHub App Token

This action generates a GitHub token authenticated as a GitHub App.

## Usage

```yaml
- uses: chainguard-dev/actions/githubapp-token@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
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
  - uses: chainguard-dev/actions/githubapp-token@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
    id: get-token
    with:
      app_id: 123
      installation_id: 456
      private_key: ${{ secrets.MY_PRIVATE_KEY }}
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
    with:
      token: ${{ steps.get-token.outputs.token }}
```
