# dreamDEX Perps Builder Bounty: feedback track

Reproducible reports against the dreamDEX perps SDK (`@somnia-chain/markets-sdk` 0.33.0), the Somnia Tokyo / Hideki testnet contracts (chain 50383), the perps indexer, the HTTP/WS API and the docs. Each one is in its own file in [`feedback/`](feedback), in the bounty template.

Every claim is backed by a script in [`scripts/`](scripts) and its saved output in [`research/`](research). Reads are `eth_call`/indexer only, except where a tx hash is quoted.

## Reports

### New reports: [`feedback/`](feedback)

| # | Severity | Area | Title |
|---|---|---|---|
| 25 | major | app | [Since Perps Arena closed on 9 Nov, every documented route to perps collateral is dead](feedback/25-no-route-to-perps-collateral-since-arena-closed.md) |
| 22 | normal | docs | [Documented order-ID formats (ULID, 0x…) rejected; only decimal works](feedback/22-documented-order-id-formats-rejected.md) |
| 23 | normal | API | [WS error frames omit the request id](feedback/23-ws-error-frames-omit-request-id.md) |
| 24 | normal | API | [Negative `since` on /volume gives a misleading 40-day error](feedback/24-volume-negative-since-misleading-error.md) |
| 26 | normal | SDK | [`getVenueHealth()` (new in 0.33.0) reports ok while perp marks are dead](feedback/26-getvenuehealth-ok-while-perp-marks-dead.md) |
| 27 | normal | SDK | [7,203 chain-wide `placeOrderFor` grants left by perp TP/SL, still issued after the 0.33.0 fix](feedback/27-stop-orders-leave-chain-wide-placeorderfor-grants.md) |

### Independently reproduced, overlapping earlier public reports: [`feedback-overlap/`](feedback-overlap)

We reproduced these 21 issues on 2026-11-14 with fresh evidence (SDK 0.33.0, current chain values). Other public repos describe the same issues, so they are kept apart and are not claimed as new. They include the 50-row `listPerpMarkets` cap, the voucher `SelfClaimDisabled` revert, the 10M default gas, funding catch-up forgiveness, the leverage/OI tables, the voucher allowlist, bot-kit Shannon addresses and stale indexer marks.

## Reproduce

```bash
npm install                      # @somnia-chain/markets-sdk 0.33.0 + viem
node scripts/docs-example.mjs    # 01: verbatim docs example → TypeError
node scripts/mark-staleness.mjs  # 08, 05, 10: indexer vs chain, per market
node scripts/voucher-claim-debug.mjs   # 02: raw revert 0x3e31dcc2
node scripts/sdk-gas.mjs         # 03: same order, 10M reverts / 30M succeeds
```
Scripts that sign (`scripts/live-suite.mjs`) read `PRIVATE_KEY` from a local `.env`, which is not committed.

## Environment
- Somnia Tokyo testnet / Hideki, chain 50383
- RPC `https://api.hideki2.infra.testnet.somnia.network`
- Indexer `https://hideki-dev.smk.somnia.host/v1/graphql`
- REST/WS `https://stg.api.dreamdex.io`
- Test wallet `0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934`
- Tested 2026-11-14 UTC
