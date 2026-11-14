# Perps market table and margin page show the wrong leverage and margin for 12 of 21 markets (BTC/ETH/SOL/HYPE are 40x, not 20x)
Severity: major
Area: docs

## Steps to reproduce
1. `node scripts/docs-chain.mjs` (or `scripts/sdk-risk.mjs`) reads `getPerpPoolParameters()` / risk params for every pool. `client.getMaxPerpOrderSize(...).effectiveImfBps` agrees (`scripts/mark-staleness.mjs`).
2. Compare with the Markets table on https://app.dreamdex.io/docs/trading/perps-testnet and the thresholds table on /docs/trading/perps-testnet/margin-and-liquidations.

## Expected
The documented leverage and margins match the chain. The page says "These figures are read from the live markets".

## Actual
Initial / maintenance / close-out margin, in basis points:

| Markets | Docs | Chain |
|---|---|---|
| BTC, ETH, HYPE, SOL | 20x (500/250/125) | **40x (250/125/62)** |
| XRP | 20x | 20x (500/250/125), matches |
| ADA, AVAX, BNB, DOGE, LINK, NEAR, SUI, XLM | 10x | 10x, matches |
| 1000PEPE, LIT, PUMP, TAO, VVV, WLD, ZEC, ZRO | 5x (2000/1000/500) | **10x (1000/500/250)** |

- MarginBank `getPerpSystemConfig().maxLeverageLimit` = 40. The margin page says leverage is "20x, 10x or 5x on testnet".
- The warning "a position opened at the full 20x is liquidated after a move of roughly 2.5%" is wrong for BTC/ETH/SOL/HYPE: at their real 40x it is about 1.25%.
- Only voucher accounts are held to 20x (`getVoucherLeverageCap() = 20`), and the docs don't mention that cap.

## Evidence
- BTC pool `0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0`: `imBps 250, mmBps 125`. `getMaxPerpOrderSize` → `"effectiveImfBps":"250"` (`research/mark-staleness.txt`, block 50235824)
- Full per-market dump: `research/chain-markets.json`

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
