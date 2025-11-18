# Deployment Playbook

- Provision a small VM (2 vCPU, 8GB RAM) and a secrets manager.
- Configure API keys (.env) for your target CEX (e.g., Bybit, Binance) and RPC endpoints.
- Run read-only mode first; validate guard reasons and monitoring health.
- Enable trading with caps: position_limit_usd <= $800; leverage_limit <= 3x.
- Integrate alerting (Slack/PagerDuty) via the monitoring API.
