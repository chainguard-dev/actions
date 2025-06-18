# Setup Argo Workflows and Argo CLI

This action downloads and configures argo workflows and argo cli

To install Argo Workflows you first need to have a K8s cluster or setuip kind

## Usage

```yaml
- uses: chainguard-dev/actions/setup-kind@0cda751b114eb55c388e88f7479292668165602a # v1.0.2

- uses: chainguard-dev/actions/setup-argo-workflows@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```

### Optional Inputs
The following optional inputs:

| Input | Description |
| --- | --- |
| `argo-version` | `argo` version to use instead of the default. |
| `install-argo-cli-only` | install only the argo cli. |
