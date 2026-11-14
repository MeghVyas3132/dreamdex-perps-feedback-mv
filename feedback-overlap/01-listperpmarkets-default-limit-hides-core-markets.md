# listPerpMarkets() silently drops BTC, ETH, SOL and 7 other core markets, so the docs' own perps example crashes
Severity: major
Area: SDK

## Steps to reproduce
1. `npm i @somnia-chain/markets-sdk@0.33.0 viem`
2. Run the "Connect" + "Get test funds" code from https://app.dreamdex.io/docs/developers/perps-testnet verbatim: `node scripts/docs-example.mjs`
3. `markets.client.listPerpMarkets()` returns 50 rows. `perps.find((m) => m.baseSymbol === "BTC")!` is `undefined`, and the next line (`btc.marginBank`) throws.

## Expected
`listPerpMarkets()` returns every perp market (60 exist on chain 50383 today), or at least every tradable one, so the documented `find(m => m.baseSymbol === "BTC")` works.

## Actual
`src/markets.ts` `listPerpMarkets` sends `limit: opts.limit ?? 50`, ordered newest-first. There are 60 perp markets, and the 10 oldest are the flagship ones: BTC, ETH, SOL, HYPE, XRP, DOGE, BNB, ADA, SUI and LINK. They fall off the default page, and their place is taken by 26 internal test pools (see the separate report). There is no `offset` or cursor option and nothing signals truncation, so callers can only guess a bigger `limit`.

```
listPerpMarkets() rows: 50
btc: undefined
CRASH: TypeError Cannot read properties of undefined (reading 'marginBank')
```
`listPerpMarkets({ limit: 1000 })` returns 60, including BTC at `0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0`.

Any bot or market picker built on the default call can't see the 10 most liquid perps.

Suggested fix: paginate until exhausted (perps are a small set), expose `offset`, and exclude test pools by default.

## Evidence
- `scripts/docs-example.mjs` (the verbatim docs code; output above), `scripts/markets2.mjs` → `research/markets-snapshot.txt` (`total perps 60`, `default 50`, `BTC in default? false`)
- Source: `node_modules/@somnia-chain/markets-sdk/src/markets.ts` around line 1777

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1; same code path), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
