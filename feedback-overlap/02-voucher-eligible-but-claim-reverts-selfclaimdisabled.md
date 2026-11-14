# getPerpVoucherEligibility says "eligible: true", but claimPerpVoucher always reverts with SelfClaimDisabled(), which the SDK can't decode
Severity: major
Area: SDK

## Steps to reproduce
1. Follow "Get test funds → Paper USDso" on https://app.dreamdex.io/docs/developers/perps-testnet with a fresh funded wallet:
```ts
const eligibility = await markets.client.getPerpVoucherEligibility(btc.marginBank, account)
if (eligibility.eligible) await markets.trader.claimPerpVoucher({ marginBank: btc.marginBank })
```
2. Or run `node scripts/voucher-claim-debug.mjs` (eth_call of `claim()` on the distributor) and `node scripts/sdk-voucher.mjs` (3 random fresh addresses).

## Expected
Either the claim credits 1,000 paper USDso, as the docs say ("Any address can claim the 1,000 USDso perps credit once, as long as it holds no perp positions or orders"), or eligibility returns `eligible: false` with a reason such as `selfClaimDisabled`, and the SDK error names the revert.

## Actual
- `getPerpVoucherEligibility` → `{"eligible":true,"grantAmount":"1000000000000000000000"}` for our wallet and for 3 random fresh addresses.
- `trader.claimPerpVoucher` (a live call from our wallet, 1 STT funded) → `ContractRevertError: @somnia-chain/markets-sdk: claim reverted: for an unknown reason.`
- Raw revert data is `0x3e31dcc2` = `SelfClaimDisabled()`. The selector exists in the distributor's current implementation `0x9657f0fd53efc01cd108d93c835bb4b517732b43` (behind the EIP-1967 proxy `0x2ACD9EFdA721450906bfE1bef3edE269636E42C4`). It is missing from the SDK's error ABI (`src/contractErrorsAbi.ts`) and from `PerpVoucherIneligibleReason`.
- `src/perp/voucher.ts` says its checks run "in the order VoucherDistributor.claim() checks them, so the reason names the revert a claim would produce". The contract has since gained a check the SDK doesn't mirror, so eligibility is wrong for every caller.

In practice the only working route is joining Perps Arena in the app. A bot developer following the docs gets "eligible" and then an undecodable revert.

## Evidence
- `research/evidence-voucher-claim.txt`: campaign live (start 1790553600, end 1798477478, budget 70,779 claims), 3 fresh addresses eligible=true, `claim()` revert `0x3e31dcc2`, impl slot `0x…9657f0fd53efc01cd108d93c835bb4b517732b43`, impl bytecode contains `3e31dcc2`
- `research/live-log.jsonl` steps `claimPerpVoucher` (2026-11-14T17:48:59Z)
- `cast sig "SelfClaimDisabled()"` = `0x3e31dcc2`

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
