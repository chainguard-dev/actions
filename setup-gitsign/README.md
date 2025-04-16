# setup-gitsign

This action downloads and configures gitsign to work within a GitHub Action.
This can be layered with other Git tools to provide Sigstore signing with GitHub
Actions OIDC.

## Usage

```yaml
- uses: chainguard-dev/actions/setup-gitsign@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```

This can be used with any action that respects the user's
[gitconfig](https://git-scm.com/docs/git-config)!

## Scenarios

- [Validate Commit](examples/verify.yaml)
- [Make a signed PR](examples/pr.yaml)
