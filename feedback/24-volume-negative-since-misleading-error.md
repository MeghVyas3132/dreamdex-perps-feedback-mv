# A negative `since` on /volume returns a misleading "time range must not exceed 40 days"
Severity: normal
Area: API

## Steps to reproduce
`curl -i "https://stg.api.dreamdex.io/v0/markets/SOMI:USDso/volume?since=-5"`

## Expected
A 400 that names `since` as invalid (it must be a non-negative timestamp).

## Actual
`400 invalid_param "time range must not exceed 40 days"`. That message points the user at the range, not at the bad `since` value.

## Evidence
`research/api-rest-probe.out` (17:39Z)

## Environment
dreamDEX HTTP/WS API at https://stg.api.dreamdex.io (the only base URL in the docs), curl and Node `ws`. Tested 2026-11-14 UTC.
