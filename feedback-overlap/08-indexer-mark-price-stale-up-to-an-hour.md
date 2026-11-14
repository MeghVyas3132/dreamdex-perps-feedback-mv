# Indexer perp market rows carry a mark/index price up to ~1 hour stale and up to 4.7% off the on-chain mark
Severity: major
Area: API

## Steps to reproduce
1. `node scripts/mark-staleness.mjs`. For every perp it compares the indexer row (`listPerpMarkets` → `markPrice`, `markPriceUpdatedAt`) with the live on-chain mark returned by `client.getMaxPerpOrderSize` (read at `asOfBlock`).

## Expected
`PerpMarket.markPrice` tracks the chain within seconds (the indexer is otherwise only about 5 blocks behind head), or the type and docs say it is a lagging snapshot and point to the chain read.

## Actual
At 2026-11-14 17:39 UTC, `markPriceUpdatedAt` was 20–58 minutes old on every one of 34 markets, and every row's mark was below the chain:

| Market | Row age | Row mark | Chain mark | Diff |
|---|---|---|---|---|
| ZRO | 44 min | 1.4952158 | 1.5682793 | −4.66% |
| LIT | 44 min | 2.8660665 | 2.9479507 | −2.78% |
| NEAR | 25 min | 3.0922543 | 3.1770876 | −2.67% |
| ZEC | 44 min | 862.83983 | 883.60661 | −2.35% |
| ETH | 20 min | 1820.6054 | 1850.4141 | −1.61% |
| BTC | 28 min | 65014.054 | 65982.737 | −1.47% |

`indexPrice` and `fundingRate` share the same stale `fundingUpdatedAt`. On 40x markets, where maintenance is 1.25%, a 1.5–4.7% error makes the row's `markPrice` (the obvious field) unusable for liquidation distance, PnL or order pricing.

## Evidence
`research/mark-staleness.txt` (full 34-market table, blocks 50235655–50235824); e.g. BTC row `markPriceUpdatedAt=1794676303`.

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
