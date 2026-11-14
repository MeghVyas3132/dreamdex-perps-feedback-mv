# The docs perps table's open-interest caps are stale on 20 of 21 markets (2–4x lower than on chain)
Severity: normal
Area: docs

## Steps to reproduce
1. `node scripts/api-indexer-vs-chain.mjs` reads `getPerpPoolParameters().maxOpenInterest` per pool (scaled by `baseDecimals`).
2. Compare with the "Open interest cap" column at https://app.dreamdex.io/docs/trading/perps-testnet#markets.

## Expected
They match; the page says "These figures are read from the live markets".

## Actual
| Market | Docs | Chain |
|---|---|---|
| BTC | 246.81545 | 493.6309 |
| ETH | 3,995.6125 | 7,991.225 |
| HYPE | 23,812.72 | 47,625.44 |
| SOL | 47,654.44 | 95,308.88 |
| XRP | 344,632 | 1,378,528 |
| ADA | 2,254,678 | 9,018,712 |
| BNB | 693.975 | 2,775.9 |
| DOGE | 5,613,590 | 22,454,360 |
| NEAR | 250,410 | 1,001,640 |
| 1000PEPE | 130,285,600 | 521,142,400 |
| ZEC | 420 | 1,680 |
| ZRO | 250,599.5 | 1,002,398 |

Only TAO matches. The docs' ZEC value of 420 is exactly ZEC's on-chain **per-account** cap, so that row mixes up the two columns.

## Evidence
`research/api-indexer-vs-chain.out` (2026-11-14T17:42:11Z, block 50237121): BTC pool `0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0` `maxOI 49363090000` (8 dec)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
