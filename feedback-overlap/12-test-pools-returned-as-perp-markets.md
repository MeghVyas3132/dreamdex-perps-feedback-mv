# 26 internal test/load-test pools (T581A66…, LOADTEST ×5, ADLT) come back as ordinary perp markets, with no field to filter them
Severity: normal
Area: API

## Steps to reproduce
1. `markets.client.listPerpMarkets({ limit: 1000 })` and print `baseSymbol` (`scripts/markets2.mjs`).
2. `markets.client.listPerpMarkets({ baseSymbol: "LOADTEST" })`

## Expected
Only tradable markets, or a field such as `listed` / `isTest` / `status` to filter on. On chain, the MarginBank already distinguishes them: `isVoucherMarketAllowed` is `false` for all 26.

## Actual
- 26 of 60 rows are test pools: 20 `T…` symbols (T581A66 … T1AADFF), five `LOADTEST` pools sharing one symbol, and `ADLT`.
- They are the newest rows, so they take up most of the 50-row default page (see the separate report).
- They look like real markets: same MarginBank and collateral, `initialMarginBps` 250 (40x), live-looking mark and funding.
- The `baseSymbol: "LOADTEST"` filter returns 5 different pools, so a symbol lookup is ambiguous.

A bot that iterates markets or picks the first one will trade test pools.

## Evidence
`research/markets-snapshot.txt`: `T581A66` pool `0x009e2e1fc4f571eeedc42e10830ae24202843a50` (with `stopRegistry: null`, while real markets have one); LOADTEST pools `0x736850b162802db2b54d766c686e65e1b31eb954`, `0x7d19508851d5397fd0e3b648fe30982bf86268a5`, `0xf909076d4abc6e7993e499b533e2b2a8cfbe4dd4`, `0xb738977760660b455b0ef9e7fa3eec0205c1292d`, `0x7982b98b08f9956e6665366ae93c466b44b044a5`; `research/voucher-allowlist.txt` (all 26 `false`)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
