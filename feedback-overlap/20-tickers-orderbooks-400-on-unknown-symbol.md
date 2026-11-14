# /v0/tickers and /v0/orderbooks fail the whole request with 400 for one unknown symbol; the docs say unknown symbols are "silently skipped"
Severity: normal
Area: API

## Steps to reproduce
1. `curl -i "https://stg.api.dreamdex.io/v0/orderbooks?symbols=SOMI:USDso&symbols=NOPE:USDso"` (same for `/v0/tickers`)
2. `curl -i "https://stg.api.dreamdex.io/v0/orderbooks?symbols=SOMI:USDso,WETH:USDso"`

## Expected
Per the Market Data docs, unknown symbols are skipped: valid symbols' data is returned, and the comma-joined form yields `[]`.

## Actual
Every case returns `400 invalid_param`, and the valid symbols' data is dropped too. The body carries an undocumented `context.invalid_symbols`:
```
{"context":{"invalid_symbols":["NOPE:USDso"]},"description":"unknown market symbols: NOPE:USDso","name":"invalid_param","status":400}
```

## Evidence
`research/api-rest-probe.out` (2026-11-14 17:39Z), `scripts/api-rest-probe.sh`

## Environment
dreamDEX HTTP/WS API at https://stg.api.dreamdex.io (the only base URL in the docs), curl and Node `ws`. Tested 2026-11-14 UTC.
