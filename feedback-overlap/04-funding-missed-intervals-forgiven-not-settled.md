# Funding docs say missed hourly settlements are "settled at once"; the protocol accrues at most one interval and forgives the rest
Severity: major
Area: contracts

## Steps to reproduce
1. `node scripts/sdk-funding-forgiven.mjs` reads indexer `FundingRateUpdate` rows (fields `intervalsSettled`, `intervalsAccrued`) for BTC, ETH and SOL perps.
2. Compare with https://app.dreamdex.io/docs/trading/perps-testnet/funding: "Funding is applied to your position the next time it is touched … everything owed since the last time is settled at once. The result is the same as paying every hour."

## Expected
When a pool's funding update is late by N intervals, N intervals of funding accrue to the cumulative index (or the docs explain that missed intervals are dropped).

## Actual
Settlements that cover many intervals accrue only one:

| Market | intervalsSettled | intervalsAccrued | tx |
|---|---|---|---|
| ETH | 47 | 1 | 0x67e3e4f49c8db6629ed84a6fd7fc6d082d8415c7d4a71177c411d078345ba9cc |
| SOL | 58 | 1 | 0x1daecc04c6ef2906e1ed7c6644db26368cc2f7a45221945a9f20646de1d8cebc |
| SOL | 16 | 1 | 0xbbf32152dff4b5dfe2aa5cc9e5df11d33a592bb7cbd2f5bbe171e3a6e0b1a7f8 |
| BTC | 10 | 1 | 0xe95a37da155807aa0a0f1cd665fea92139818c037c1f6f58b26f1d89aca6c772 |

The SDK source states the same (`src/funding.ts`, `intervalsPerWindow`): "The contract's catch-up horizon is ONE interval, so a settlement charges at most rate / n however long the gap was, and the excess is forgiven rather than deferred."

On ETH, 46 hours of funding were never paid by either side. Traders reading the docs expect hourly funding; a funding-arb bot (like the kit's `perp-funding`) gets very different carry in quiet periods. Either the docs are wrong or the catch-up is a bug.

## Evidence
`research/evidence-funding-forgiven.txt` (rows above, with spans), `scripts/sdk-funding-forgiven.mjs`

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
