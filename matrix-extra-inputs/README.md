# matrix-extra-inputs

This action is designed to be used to augment
a GitHub Actions build matrix to contain extra inputs.

This converts any environment variables starting with
`EXTRA_INPUT_` into a camelcased input equivalent.

For example with an env of `EXTRA_INPUT_CHECK_IT_OUT=hello`,
this will result in an input of `checkItOut=hello`.

The action produces an output called `matrix-json` which can
passed directly to downstream actions by running `fromJSON()` on it.
See the usage example below for an example of this.

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
