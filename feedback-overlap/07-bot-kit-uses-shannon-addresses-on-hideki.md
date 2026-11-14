# The dreamDEX bot kit's perp tools pass Shannon addresses on Hideki, so 26 test pools count as live markets
Severity: major
Area: SDK

## Steps to reproduce
1. Clone https://github.com/somnia-chain/dreamdex-bot-kit (commit 4e75896).
2. In `packages/perp-core/src/exchange.ts`, `NETWORK=hideki` (chain 50383) still constructs the exchange with `SOMNIA_TESTNET_ADDRESSES` (Shannon).
3. `node scripts/docs-botkit-markets.mjs` reproduces the kit's market discovery read-only against SDK 0.33.0.

## Expected
On Hideki the kit uses `SOMNIA_HIDEKI_TESTNET_ADDRESSES`, as https://app.dreamdex.io/docs/developers/perps-testnet shows, and lists the 34 active perps.

## Actual
- The Shannon `perpPoolFactory` (`0x516d2cb6…`), `marginBank` (`0xdd4A14A2…`) and `collateral` addresses have **no code** on chain 50383.
- The SDK then finds no pool statuses and silently defaults every perp to `active: true`.
- The kit's `perpMarkets()` returns 60 "active" markets, including all 26 internal test pools (T581A66…, LOADTEST ×5, ADLT).

Effects:
- `perp:doctor` and `perp-guard` with no `PERP_SYMBOL` list test pools as live.
- `linkCoverage` reports missing links for them.
- `requireMarket("LOADTEST")` resolves instead of throwing.

The kit also pins SDK 0.31.0 (perp-core) and 0.30.0 (ec-core), while the docs say the app runs 0.32.1.

## Evidence
`scripts/docs-botkit-markets.mjs`; `eth_getCode` of the Shannon perp addresses on 50383 returns `0x`; the kit's lockfile shows `@somnia-chain/markets-sdk@0.31.0`.

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
