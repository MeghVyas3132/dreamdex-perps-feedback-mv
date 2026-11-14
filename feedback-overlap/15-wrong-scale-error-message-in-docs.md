# Docs give the wrong error for an owner's perp order with quantity mis-scaled to 18 decimals
Severity: normal
Area: docs

## Steps to reproduce
1. `node scripts/sdk-wrong-scale.mjs`: for 20 real SOL-PERP accounts, simulate the owner's `placeOrder` of 0.1 SOL scaled with 9 decimals (correct) and with 18 decimals (the documented mistake).
2. Compare with https://app.dreamdex.io/docs/developers/perps-testnet → "Scale quantity by the base asset's decimals".

## Expected
As documented: "The owner's own placeOrder fails differently, with `ERC20: transfer amount exceeds balance`."

## Actual
- 0.1 SOL @9 decimals → OK for 20/20.
- 0.1 SOL @18 decimals → `ERC20: insufficient allowance` for 18/20, and `ERC20: transfer amount exceeds balance` for only 2/20.

The section exists so people can recognise this mistake from its error, but it names the error most users won't see.

## Evidence
`research/evidence-wrong-scale.txt`:
```
'0.1 SOL @9dec (correct) => OK': 20,
'0.1 SOL @18dec (wrong) => Error(string): ERC20: insufficient allowance': 18,
'0.1 SOL @18dec (wrong) => Error(string): ERC20: transfer amount exceeds balance': 2
```
Same result live from our wallet on ZEC: `placeOrder reverted: Error(ERC20: insufficient allowance)` (`research/live-log.jsonl`, step `zec-open-with-voucher`).

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
