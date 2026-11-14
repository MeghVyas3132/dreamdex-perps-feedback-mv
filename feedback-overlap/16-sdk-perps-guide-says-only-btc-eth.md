# The SDK's shipped PERPS.md still says perps are BTC and ETH only
Severity: normal
Area: docs

## Steps to reproduce
1. `npm i @somnia-chain/markets-sdk@0.33.0`, open `node_modules/@somnia-chain/markets-sdk/docs/PERPS.md` line 3.
2. `node scripts/sdk-unified.mjs` lists the perps the SDK actually loads.

## Expected
The SDK's perps guide matches the live venue (34 active markets, 21 documented on the website).

## Actual
PERPS.md: "Perps are live on testnet: `BTC/USDso:USDso` and `ETH/USDso:USDso`". 60 perp pools exist, 34 of them active.

## Evidence
`node_modules/@somnia-chain/markets-sdk/docs/PERPS.md:3`; `scripts/sdk-unified.mjs` output

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
