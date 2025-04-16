# Do Not Submit

This action is an homage to the Google presubmit check that served the same
purpose.  It allows developers to mark throwaway instrumentation and prototyping
with a comment `// DO NOT SUBMIT` so the CI system will remind them about bits
of code that they forgot to scrub prior to submission.

This code is also derived from a similar check originally contributed to
Knative.

## Usage

```yaml
- uses: chainguard-dev/actions/donotsubmit@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```

## Scenarios

```yaml
steps:
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
  - uses: chainguard-dev/actions/donotsubmit@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```
