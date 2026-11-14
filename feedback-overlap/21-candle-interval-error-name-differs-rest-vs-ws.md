# The same bad candle interval returns `invalid_param` over REST and `invalid_interval` over WebSocket
Severity: normal
Area: API

## Steps to reproduce
1. REST: `curl -i "https://stg.api.dreamdex.io/v0/markets/SOMI:USDso/candles?interval=7m"`
2. WS: `{"id":13,"operation":"getMarketSymbolCandles","params":{"symbol":"SOMI:USDso","interval":"7m"}}`

## Expected
The same stable error `name` (`invalid_interval`) on both transports. The docs say `name` is stable for programmatic handling.

## Actual
REST returns `invalid_param`, and its `description` is a raw OpenAPI schema dump. WS returns `invalid_interval`.

## Evidence
`research/api-rest-probe.out`, `research/api-ws-probe.out` (17:40:50Z)

## Environment
dreamDEX HTTP/WS API at https://stg.api.dreamdex.io (the only base URL in the docs), curl and Node `ws`. Tested 2026-11-14 UTC.
