# getVenueHealth() grades a single global price-feed stamp, so it reports "ok" while individual perp marks are dead
Severity: normal
Area: SDK

## Steps to reproduce
1. `node scripts/deep-b-health.mjs` (markets-sdk 0.33.0, Hideki). It calls `client.getVenueHealth()` and, at the same instant, `client.getPerpFeedStatus(pool)` for every perp pool.

## Expected
A "venue health" verdict used to gate what an app shows should reflect whether the perp marks traders rely on are live. The docs for `getVenueHealth` say it answers "whether this venue serves trustworthy data now".

## Actual
`src/health.ts` `priceFeedCheck` reads one aggregate, `priceFeedScheduler.feedHealth()` (a single `lastIngestMs` / `lastKickMs` for the whole scheduler), and grades only indexer lag, chain-RPC liveness and that one stamp. It never reads per-market mark state. At 2026-11-14 18:10 UTC `getVenueHealth()` returned `status: "ok"` ("Price feed wrote a price 0 s ago") while `getPerpFeedStatus` reported `markPriceOk: false, markPrice: 0` on four live pools (here the four LOADTEST pools, the only ones with a dead mark at test time; the code path is market-agnostic: `0x736850b1…`, `0x7d195088…`, `0xb7389777…`, `0x7982b98b…`, their `indexUpdatedAt` ~45 h stale). The protocol's own rule is that a market with a stale mark stops liquidating, so a single-market oracle outage is exactly the state an app needs to detect, and `getVenueHealth` cannot surface it — the per-market read `getPerpFeedStatus` is the only one that can. An app wiring `getVenueHealth` to its "is the venue ok" banner shows green through a single-market feed outage.

## Evidence
`research/deep-b-health.txt`: `getVenueHealth` → `{"status":"ok",...,"priceFeed":"...wrote a price 0 s ago"}`; same run, `markPriceOk:false` on 4 pools. Source: `node_modules/@somnia-chain/markets-sdk/src/health.ts:186-205` (one scheduler stamp), `:94-105` (bounds).

## Environment
@somnia-chain/markets-sdk 0.33.0 (`getVenueHealth` is new in 0.33.0), Somnia Tokyo testnet / Hideki 50383, RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql. Read-only.
