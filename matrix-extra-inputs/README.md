# matrix-extra-inputs

This action is designed to be used to augment
a GitHub Actions build matrix to contain extra inputs.

This converts any environment variables starting with
`EXTRA_INPUT_` into a camelcased input equivalent.

For example with an env of `EXTRA_INPUT_CHECK_IT_OUT=hello`,
this will result in an input of `checkItOut=hello`.

The action produces an output called `matrix-json` which can
passed directly to downstream actions by running `fromJSON()` on it.

## Usage

```yaml
- id: extra-inputs
  uses: chainguard-dev/actions/matrix-extra-inputs@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
  with:
    matrix-json: ${{ toJSON(matrix) }}
  env:
    EXTRA_INPUT_CHECK_IT_OUT: hello
- run: |
    echo '${{ steps.extra-inputs.outputs.matrix-json }}' > inputs.json
    echo "checkItOut value: $(jq -r .checkItOut inputs.json)"
```
