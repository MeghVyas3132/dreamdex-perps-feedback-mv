# The Errors page lists no perp errors; the common over-size revert InsufficientMarginForOrder() (0x7ea61260) is documented nowhere
Severity: normal
Area: docs

## Steps to reproduce
1. `node scripts/sdk-maxsize.mjs BTC 30`: for each account, simulate an order of `getMaxPerpOrderSize().maxQuantity + lotSize`.
2. Read https://app.dreamdex.io/docs/developers/contracts/errors, which the perps developers page points to ("The full list of order errors is on the Errors page").

## Expected
The Errors page covers PerpPool, MarginBank and PerpStopOrderRegistry errors, including what a trader hits most: insufficient margin, position cap, voucher, isolated market, ADL and liquidation errors.

## Actual
- 56 of 60 max+1-lot orders (30 BTC accounts × bid/ask) revert with `0x7ea61260` = `InsufficientMarginForOrder()`, which appears nowhere in the docs.
- The Errors page has only SpotPool and SpotStopOrderRegistry sections; the word "perp" is not on it.
- The perp errors the developers page does name (`InsufficientCollateral`, `MaxPositionSizeExceeded`, `IsolatedMarketBlocked`, `AmendReplacementRejected`) aren't on the Errors page either.

## Evidence
`research/evidence-maxsize.txt` (`node scripts/sdk-maxsize.mjs BTC 30`, mark 65696.82), e.g. `0x00aabf6b BID … +lot: REVERT … 0x7ea61260`; `research/docs2/developers_contracts_errors.md` (no perp section)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
