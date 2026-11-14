# No reduce-only option for perp limit/market orders in the SDK or pool ABI, though the docs offer "Reduce-only" orders
Severity: normal
Area: SDK

## Steps to reproduce
1. https://app.dreamdex.io/docs/trading/perps-testnet/orders: "**Reduce-only** orders can only shrink a position, never open or flip one."
2. In `@somnia-chain/markets-sdk@0.33.0`, `PlacePerpOrderParams` (`src/trade.ts:817`) has `pool, isBid, price, quantity, expireTimestampNs, orderType, selfMatchingOption, builder, builderFeeBpsTimes1k, gas`. `BatchOrderRequest` and `ORDER_TYPE` (0 limit, 1 FOK, 2 IOC, 3 PostOnly) have no reduce-only either.
3. The documented PerpPool `placeOrderFor(owner, isBid, userData, price, quantity, expireTimestampNs, orderType, selfMatchingOption, builder, builderFeeBpsTimes1k)` has no reduce-only argument. The only reduce-only path is the `PerpStopOrderRegistry` `intent` (0 = ReduceOnly), i.e. triggered TP/SL.

## Expected
A bot can send a plain reduce-only order (`reduceOnly: true` on `placePerpOrder` / `placeOrderFor` / batch requests), the standard way to close safely. Closing more than is held should never open the opposite side.

## Actual
There is no way to place a non-triggered reduce-only order through the SDK or the pool. A bot that closes with a plain IOC opens a reverse position whenever its size is stale: after a partial liquidation, after a TP/SL already fired, or after concurrent fills. The Orders page doesn't say the toggle is app-only or how the app enforces it. This also matters for the documented Link-a-Bot "reduce" permission and the dreamBot "Perp Risk Guard".

## Evidence
`node_modules/@somnia-chain/markets-sdk/src/trade.ts:817-860` (`PlacePerpOrderParams`), `:453` (`ORDER_TYPE`), `src/tradeAbi.ts:306-318` (reduce-only exists only on the stop registry)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
