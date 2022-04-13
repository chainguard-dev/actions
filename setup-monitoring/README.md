# Setup Monitoring Stack (Prometheus / Grafana)

This action spins up a Monitoring Stack (Prometheus / Grafana) with a Grafana Render backend to export the dashboards as png.
You need a running KinD cluster before using this action

## Usage

```yaml
- uses: chainguard-dev/actions/setup-monitoring@main
  with:
    # Helm version to be installed
    # Optional.
    helm-version: v3.8.1
    # Helm chart version to be installed can be found here
    # https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/Chart.yaml
    # Optional.
    prometheus-chart-version: 34.5.1
    # In which namespace the stack will be deployed (default monitoring-system)
    # Optional.
    monitoring-namespace: monitoring-system
```

## Scenarios

```yaml
steps:
- uses: chainguard-dev/actions/setup-kind@main
  with:
    k8s-version: 1.22.x
- uses: chainguard-dev/actions/setup-monitoring@main
```
