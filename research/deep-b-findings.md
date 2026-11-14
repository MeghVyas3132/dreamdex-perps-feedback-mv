# getVenueHealth() grades a single global price-feed stamp, so it reports "ok" while individual perp marks are dead
Severity: normal
Area: SDK

## Steps to reproduce
1. `node scripts/deep-b-health.mjs` (markets-sdk 0.33.0, Hideki). It calls `client.getVenueHealth()` and, at the same instant, `client.getPerpFeedStatus(pool)` for every perp pool.

## Expected
A "venue health" verdict used to gate what an app shows should reflect whether the perp marks traders rely on are live. The docs for `getVenueHealth` say it answers "whether this venue serves trustworthy data now".

## Actual
`src/health.ts` `priceFeedCheck` reads one aggregate, `priceFeedScheduler.feedHealth()` (a single `lastIngestMs` / `lastKickMs` for the whole scheduler), and grades only indexer lag, chain-RPC liveness and that one stamp. It never reads per-market mark state. At 2026-11-14 18:10 UTC `getVenueHealth()` returned `status: "ok"` ("Price feed wrote a price 0 s ago") while `getPerpFeedStatus` reported `markPriceOk: false, markPrice: 0` on four live pools (the LOADTEST pools `0x736850b1…`, `0x7d195088…`, `0xb7389777…`, `0x7982b98b…`, their `indexUpdatedAt` ~45 h stale). The protocol's own rule is that a market with a stale mark stops liquidating, so a single-market oracle outage is exactly the state an app needs to detect, and `getVenueHealth` cannot surface it — the per-market read `getPerpFeedStatus` is the only one that can. An app wiring `getVenueHealth` to its "is the venue ok" banner shows green through a single-market feed outage.

## Evidence
`research/deep-b-health.txt`: `getVenueHealth` → `{"status":"ok",...,"priceFeed":"...wrote a price 0 s ago"}`; same run, `markPriceOk:false` on 4 pools. Source: `node_modules/@somnia-chain/markets-sdk/src/health.ts:186-205` (one scheduler stamp), `:94-105` (bounds).

## Environment
@somnia-chain/markets-sdk 0.33.0, Hideki testnet 50383, RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql. Read-only.

---

# Perp TP/SL on markets-sdk 0.32.1 (the version the docs say the app runs) grants the stop registry a GLOBAL placeOrderFor approval; 0.33.0 narrowed it to the one pool
Severity: normal
Area: SDK

## Steps to reproduce
1. In 0.32.1 (`npm pack @somnia-chain/markets-sdk@0.32.1`), read `src/perp/stops.ts` `operatorApprovalCall`: it sends `setOperatorApprovalGlobal(registry, [PLACE_ORDER_FOR_SELECTOR], true)` before the first `createPendingOrder`.
2. Compare 0.33.0 `src/perp/stops.ts`: the same path now sends `setOperatorApprovalForPool(pool, registry, [PLACE_ORDER_FOR_SELECTOR], true)`, with the code comment "a global grant would also reach every other spot and perp pool."

## Expected
Placing a stop on one market authorizes the stop registry on that market only (least privilege), as 0.33.0 does.

## Actual
On 0.32.1 — the version the developer docs state "the app runs" — a trader's first TP/SL grants the PerpStopOrderRegistry a chain-wide `placeOrderFor` operator approval that auto-extends to every present and future spot and perp pool. The maintainers' own 0.33.0 fix (switching to `setOperatorApprovalForPool`) confirms the narrow grant is the intended behaviour. Anyone pinned to 0.32.1 by the docs over-grants.

## Evidence
0.32.1 `src/perp/stops.ts` `setOperatorApprovalGlobal(... [PLACE_ORDER_FOR_SELECTOR] ...)`; 0.33.0 `src/perp/stops.ts:780-787` `setOperatorApprovalForPool(p.pool, p.registry, [PLACE_ORDER_FOR_SELECTOR], true)` plus the new `requireRecordedRegistry` guard. Diff saved under `research/` (sdk 0.32.1 vs 0.33.0).

## Environment
@somnia-chain/markets-sdk 0.32.1 vs 0.33.0; Hideki testnet 50383. Static + source diff; no transactions.
