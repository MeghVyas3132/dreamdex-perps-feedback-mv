# Paper USDso can open positions in the six markets the docs say it can't (1000PEPE, LIT, PUMP, VVV, ZEC, ZRO)
Severity: major
Area: contracts

## Steps to reproduce
1. `node scripts/docs-voucher.mjs` calls `MarginBank(0x478769E1177C0773c43A593DCCc4Ad15F15F1394).isVoucherMarketAllowed(pool)` for every perp pool.
2. `node scripts/sdk-voucher-allowlist.mjs` calls `getPerpLeverage` for a real voucher account (0xf3c87bee…, creditFloor 1000 USDso), and `scripts/sdk-voucher-max.mjs` simulates increasing bids on ZEC and PUMP from that account.

## Expected
Per https://app.dreamdex.io/docs/trading/perps-testnet (Paper USDso column = "No") and /margin-and-liquidations ("The six newest markets are not on that list"), and the developers-page pitfall ("Increasing a position in a market outside the credit's allowlist reverts, and getMaxPerpOrderSize reports it as limitedBy: 'voucherBlocked'"): voucher accounts can't open 1000PEPE, LIT, PUMP, VVV, ZEC or ZRO.

## Actual
- `isVoucherMarketAllowed` / `voucherMarketAllowed` is `true` for all 21 documented markets, those six included, and for all 13 undocumented stock/commodity markets.
- Increasing orders on ZEC and PUMP from a voucher account simulate successfully, and `getMaxPerpOrderSize` never returns `voucherBlocked`.
- The allowlist itself works: it is `false` for the 26 test pools (T*, LOADTEST, ADLT).

So either the intended restriction is not configured on chain (Perps Arena paper money can trade the riskiest markets), or the docs, the market table and the pitfall section are wrong.

## Evidence
`research/evidence-voucher-allowlist.txt`, e.g. `ZEC docs: No | chain voucherMarketAllowed: true voucherLeverageCapX: 20 creditFloor: 1000000000000000000000`; `research/voucher-allowlist.txt` (block 50236052)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
