# The order-ID formats in the docs (a ULID and "0x…") are rejected; only decimal uint128 works
Severity: normal
Area: docs

## Steps to reproduce
`node scripts/api-ws-probe2.mjs`, which sends:
1. the Operations page example `getMarketSymbolOrder` with id `01KC1F8N2NBP5GEYKE66CRJ34A`
2. the Real-Time Feed example `subscribe` / `order` with `orderId: "0xYourOrderId"`, plus `"0x1"` and `"123456789"`

## Expected
The formats shown in the docs are accepted.

## Actual
- The ULID returns `400 invalid_order_id`.
- Every `0x…` id returns a generic `subscription_failed` with no reason.
- Only the decimal id (`"123456789"`) subscribes.

## Evidence
`research/api-ws-probe2.out` (17:41:17–20Z)

## Environment
dreamDEX HTTP/WS API at https://stg.api.dreamdex.io (the only base URL in the docs), curl and Node `ws`. Tested 2026-11-14 UTC.
