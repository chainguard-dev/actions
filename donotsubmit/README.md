# Do Not Submit

This action is an homage to the Google presubmit check that served the same
purpose.  It allows developers to mark throwaway instrumentation and prototyping
with a comment `// DO NOT SUBMIT` so the CI system will remind them about bits
of code that they forgot to scrub prior to submission.

This code is also derived from a similar check originally contributed to
Knative.

## Usage

```yaml
- uses: chainguard-dev/actions/donotsubmit@main
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@v3
  - uses: chainguard-dev/actions/donotsubmit@main
```
