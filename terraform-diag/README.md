# Terraform Diagnostics

This actions processes the JSON output of a `terraform apply -json` and surfaces
useful diagnostics extracted from the output.

## Usage

```yaml
- uses: chainguard-dev/actions/terraform-diag@main
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
  - uses: actions/checkout@v3
  - uses: hashicorp/setup-terraform@v2
    with:
      terraform_version: '1.5.*'
      terraform_wrapper: false
  - run: terraform apply -json -auto-approve > foo.json

  # Process the JSON output from above.
  - uses: chainguard-dev/actions/terraform-diag@main
    if: ${{ always() }}
    with:
      json-file: foo.json
```
