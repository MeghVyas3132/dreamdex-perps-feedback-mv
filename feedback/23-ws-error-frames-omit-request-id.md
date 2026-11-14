# WebSocket error frames omit the request `id` and collapse different causes into one message
Severity: normal
Area: API

## Steps to reproduce
Send over WS:
1. `{"id":8,"operation":"subscribe","channel":"orderbook","params":{"symbol":"BTC-PERP"}}`
2. `{"id":"str","operation":"getCurrencies"}`
3. `{"id":1e30,"operation":"getCurrencies"}`

## Expected
Error frames echo `id` (the docs say responses correlate "by id") and give the specific reason.

## Actual
- (1) `subscription_failed "subscription failed to channel: orderbook"` comes back with no `id`, and all four documented causes collapse into it.
- (2) and (3) are valid JSON but get `invalid_request "invalid JSON request"`, again with no `id`.

A client with several requests in flight can't tell which one failed.

## Evidence
`research/api-ws-probe.out` (17:40:43Z, 17:40:48–49Z)

## Environment
dreamDEX HTTP/WS API at https://stg.api.dreamdex.io (the only base URL in the docs), curl and Node `ws`. Tested 2026-11-14 UTC.
