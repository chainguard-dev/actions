# matrix-check-inputs

This action is designed to be used to check the incoming
inputs (dynamically generated).

This is useful to use to test the functionality of `matrix-extra-inputs`.

## Usage

```yaml
- id: extra-inputs
  uses: chainguard-dev/actions/matrix-extra-inputs@main
  with:
    matrix-json: ${{ toJSON(matrix) }}
  env:
    EXTRA_INPUT_CHECK_IT_OUT: hello
- uses: chainguard-dev/actions/matrix-check-inputs@main
  with: ${{ fromJSON(steps.extra-inputs.outputs.matrix-json) }}
```
