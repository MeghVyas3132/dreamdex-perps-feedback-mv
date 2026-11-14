# The HTTP/WebSocket API docs never say perps are unsupported, and there is no API base URL for the perps chain
Severity: normal
Area: docs

## Steps to reproduce
1. `curl https://stg.api.dreamdex.io/v0/markets`
2. `curl "https://stg.api.dreamdex.io/v0/tickers?symbols=BTC-PERP"`
3. Over WS send `{"id":8,"operation":"subscribe","channel":"orderbook","params":{"symbol":"BTC-PERP"}}`

## Expected
Either the HTTP/WS API serves perps, or the HTTP API / WebSocket API pages state that perps are SDK + indexer + chain only and link the Hideki indexer.

## Actual
- `/v0/markets` returns 3 spot markets (Shannon 50312).
- Perp symbols return `400 invalid_param "unknown market symbols: BTC-PERP"`.
- The WS subscribe returns `subscription_failed`.
- The base-URL table lists Shannon only, and no page says perps are out of scope, so a builder following Developers → HTTP API can't find a perps endpoint.
- The `kind` and `stopRegistry` fields returned by `/v0/markets` are undocumented.

## Evidence
`research/api-rest-probe.out` (17:39:32Z), `research/api-ws-probe.out` (17:40:43Z); `scripts/api-rest-probe.sh`, `scripts/api-ws-probe.mjs`

## Environment
dreamDEX HTTP/WS API at https://stg.api.dreamdex.io (the only base URL in the docs), curl and Node `ws`. Tested 2026-11-14 UTC.
