# The docs say "an account is capped at a tenth of the OI cap on most markets"; that holds on only one of 21 markets
Severity: normal
Area: docs

## Steps to reproduce
1. `node scripts/api-indexer-vs-chain.mjs` (or `getMaxPerpOrderSize(...).maxPositionSize` via `scripts/mark-staleness.mjs`), then compute `maxPositionSize / maxOpenInterest` per pool.
2. Compare with https://app.dreamdex.io/docs/trading/perps-testnet ("A single account is capped at a tenth of it on most markets") and the developers pitfall ("a tenth of the market's open interest cap on most markets").

## Expected
About 1/10 on most markets.

## Actual
- 1/20 on ETH, SOL, XRP, ADA, AVAX, BNB, DOGE, LINK, NEAR, SUI and XLM.
- 1/40 on 1000PEPE, LIT, PUMP, VVV, WLD and ZRO.
- BTC 0.2025 (100 of 493.63 BTC), HYPE 0.126, ZEC 0.25.
- Only TAO is 1/10 among the 21 documented markets. The undocumented stock/commodity markets are 1/10.

A bot that sizes its maximum from the docs hits `MaxPositionSizeExceeded()` (`0x714b36d6`) on 17 markets.

## Evidence
`research/api-indexer-vs-chain.out`, `research/mark-staleness.txt` (e.g. ETH `maxPos 399561200000000000000` = 399.56 ETH vs OI cap 7,991.225; BTC `maxPos 10000000000` = 100 BTC)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
