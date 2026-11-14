# 13 live perp markets (WTI, XAU, XAG, TSLA, GOOGL, AMD…) are missing from the docs, which say "All 21 markets"
Severity: normal
Area: docs

## Steps to reproduce
1. `markets.client.listPerpMarkets({ limit: 1000 })`, or `loadMarkets(true)` with `SOMNIA_HIDEKI_TESTNET_ADDRESSES` (`scripts/markets2.mjs`, `scripts/docs-chain.mjs`).
2. Compare with https://app.dreamdex.io/docs/trading/perps-testnet#markets ("All 21 markets are margined in USDso").

## Expected
Every live perp market is documented, with its leverage, tick, minimum size, OI cap and paper-USDso eligibility.

## Actual
34 markets are active. The 13 undocumented ones are WTI, XAG, XAU, GOOGL, TSLA, HYNX, MSTR, MRVL, LITE, INTC, HOOD, COIN and AMD:
- they have stop registries
- they are on the voucher allowlist
- they carry real open interest (e.g. XAG 50.33, HOOD 1.073)
- WTI/XAG/XAU/GOOGL/TSLA are 10x and the other eight 5x (`initialMarginBps` 1000/2000)

No docs page mentions them, nor their oracle source or trading hours (they are equities and commodities).

## Evidence
`research/markets-snapshot.txt`, e.g. `XAU dec 18 imBps 1000 stopReg 1 … 0x4e66263637395f4f2edbaf87133dd5afd4be2562`, `TSLA … 0xe3458a654ce3d839b96581fb46b40a0c37d4cd61`

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
