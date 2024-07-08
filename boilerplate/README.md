# Boilerplate header check

This action runs a simple tool to check for boilerplate file headers in various
languages.

This code is also derived from a similar check originally contributed to
Knative.


## Usage

```yaml
- uses: chainguard-dev/actions/boilerplate@main
  with:
    # Extension for files to check. For example, "go" or "sh".
    # Required.
    extension: "sh"
    # Language for describing the offending language. For example, "Go" or
    # "Shell".
    # Required.
    language: "Shell"
    # Boilerplate Directory in which to find boilerplate.{extension}.text files.
    # For example, "./hack/boilerplate".
    # Required.
    boilerplate-directory: "./hack/boilerplate"
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@v3

  - uses: chainguard-dev/actions/boilerplate@main
    with:
      extension: "sh"
      language: "Shell"
      boilerplate-directory: "./hack/boilerplate"
```
