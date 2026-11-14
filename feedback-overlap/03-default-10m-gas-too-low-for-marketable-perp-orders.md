# The SDK's default 10M gas is too low for marketable perp orders: they revert with empty data, and the SDK reports "no revert data recoverable"
Severity: major
Area: SDK

## Steps to reproduce
1. `node scripts/sdk-gas.mjs`: simulates a BTC-PERP IOC ask at the mark for the account's `getMaxPerpOrderSize` quantity (account 0x0007d05e…, block 50239772) at 10M, 30M and 100M gas.
2. `node scripts/sdk-maxsize.mjs BTC 15`: repeats it for 15 accounts.

## Expected
`trader.placePerpOrder` either estimates gas or uses a default that fits a normal marketable order. If gas runs out, the error says so.

## Actual
- At 10,000,000 gas (the SDK default `TraderConfig.gas`, and what the docs and bot kit recommend) the call reverts with empty data `0x`. The identical call at 30M succeeds (`estimateGas` ≈ 28.7M). A wider re-run (`node scripts/sdk-maxsize.mjs BTC 30`, 10M gas) had 22 of 30 BTC accounts' max-size asks at the mark revert with empty data, while the same accounts' bids passed.
- `perpOrderCall` never estimates gas. On a status-0 receipt, `revertErrorForReceipt` replays the call **without** the gas cap, so the replay succeeds and the user sees `no revert data recoverable` instead of "out of gas".
- The developers page says "the bot kit sends every perp order with 10,000,000" and that "a generous limit costs nothing extra", which implies 10M is always enough.

Bots fail on their most important orders (large IOC/market orders that sweep levels, i.e. de-risking), with a misleading error.

## Evidence
- `research/evidence-gas.txt`:
```
gas 10000000 REVERT Execution reverted for an unknown reason. 0x
gas 30000000 OK 0x…01…150000000000ba62a2
no gas param (what SDK revertErrorForReceipt replays with): OK -> SDK reports "no revert data recoverable"
```
- `research/evidence-maxsize.txt` (22 lines marked `<<< MAX REVERTS`, `data=0x`)
- `research/evidence-gas-sweep.txt` (gas estimate grows from 3.3M to 17M+ with the number of levels crossed)

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
