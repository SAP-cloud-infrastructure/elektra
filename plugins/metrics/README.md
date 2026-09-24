# Metrics Plugin

Provides the metrics dashboard and access to the Maia query UI.

## Usage

Open Maia from the metrics dashboard. Access requires `monitoring_viewer` or
`monitoring_admin`. Elektra attaches the session token server-side, keeping it
out of the Maia URL and JavaScript. Elektra's existing authentication cookies
are unchanged. Direct Maia API and `/federate` access are unchanged.

## Configuration

The default upstream is `https://maia.<current_region>.cloud.sap`. Override it
with `MAIA_HOST_<REGION>` (uppercase, hyphens replaced by underscores), or use
`MAIA_HOST` as a fallback. Set an origin without a path or query, for example
`MAIA_HOST=http://127.0.0.1:9091` for local development.

Maia must support relative API paths before enabling the dashboard link.

## Testing

```sh
RAILS_ENV=test bundle exec rspec \
  plugins/metrics/spec/controllers/maia_proxy_controller_spec.rb \
  plugins/metrics/spec/routing/maia_proxy_routing_spec.rb
```
