# Chain 50383 goes by four names, the Contract Addresses page contradicts the perps page, and the perps developer page doesn't mention the Tokyo faucet
Severity: normal
Area: docs

## Steps to reproduce
1. Compare https://app.dreamdex.io/docs/developers/perps-testnet, /docs/developers/contracts/contract-addresses, the app, the explorer and the SDK.
2. Call `getOperatorPermissionsRegistry()` on any perp pool (`scripts/docs-addrs.mjs`).
3. Open https://explorer.testnet.somnia.network/tokyo/faucet.

## Expected
One name for the network, consistent contract listings, and the simplest route to gas STT on the developers page.

## Actual
- **Four names for one chain:** "Hideki testnet" (perps page, SDK `hidekiTestnet`, `SOMNIA_HIDEKI_TESTNET_ADDRESSES`), "Somnia Tokyo testnet" (Contract Addresses page, explorer, faucet, this bounty), "DreamDEX region" (app), and the explorer path `/tokyo` (`/hideki` returns 404).
- **Contract Addresses contradicts the perps page.** It says the OperatorPermissionsRegistry is "not in the SDK's Somnia Tokyo Testnet deployment", but every perp pool's `getOperatorPermissionsRegistry()` returns `0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a`, the registry the perps page lists and Link a Bot depends on. It also lists none of the perps contracts (MarginBank, PerpPoolFactory, LiquidationEngine, InsuranceFund, VoucherDistributor).
- **The SDK and docs use different RPC hosts:** the SDK default RPC is `api.hideki.…`, while the docs and bot kit use `api.hideki2.…`.
- **The faucet isn't mentioned.** "Get test funds" says the simplest route to STT is the app's Link a Bot flow, which needs an app account. The Tokyo faucet (explorer.testnet.somnia.network/tokyo/faucet: "1 STT to any address holding less than 1 STT") works without one. We used it: tx `0x53673fbc205a6b20b3d74199396891a0a6160e6c5d30f0ed3cb43a7f9d04c0b3`.

## Evidence
`scripts/docs-addrs.mjs`; faucet tx above; `research/docs2/developers_contracts_contract-addresses.md`

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
