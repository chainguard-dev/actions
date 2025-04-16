# Where Am I?

This action logs some Azure metadata about the runner environment.

## Usage

```yaml
- uses: chainguard-dev/actions/whereami@0cda751b114eb55c388e88f7479292668165602a # v1.0.2
```

This will log the following information, in a section that's collapsed by default:

```
{
  "compute": {
    "azEnvironment": "AzurePublicCloud",
    "customData": "",
    "evictionPolicy": "",
    "isHostCompatibilityLayerVm": "false",
    "licenseType": "",
    "location": "eastus2",
    "name": "EUS2-GHEUS21UB22EUS2C9-0125",
    "offer": "",
    "osType": "Linux",
    "placementGroupId": "",
...
}
```

In particular, you can see from this output that the runner is in the `eastus2` region.
