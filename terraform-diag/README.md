# Terraform Diagnostics

This actions processes the JSON output of a `terraform apply -json` and surfaces
useful diagnostics extracted from the output.

## Usage

```yaml
- uses: chainguard-dev/actions/terraform-diag@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  if: ${{ failure() }}
  with:
    # The JSON output of the 'terraform apply -json'
    # Required.
    json-file: mega-module.tf.json
```

## Scenarios

### Extract diagnostics from a `terraform apply -json`

```yaml
steps:
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
  - uses: hashicorp/setup-terraform@b9cd54a3c349d3f38e8881555d616ced269862dd # v3.1.2
    with:
      terraform_version: '1.11.*'
      terraform_wrapper: false
  - run: terraform apply -json -auto-approve > foo.json

  # Process the JSON output from above.
  - uses: chainguard-dev/actions/terraform-diag@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
    if: ${{ always() }}
    with:
      json-file: foo.json
```
