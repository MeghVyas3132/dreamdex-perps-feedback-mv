# `quotePerpClose` (new in SDK 0.33.0) reports closes as fillable that revert on chain: 15 of 33 sampled real positions
Severity: major
Area: SDK

## Steps to reproduce
1. `node scripts/deep-a-closequote.mjs BTC ETH SOL HYPE XRP`. For each sampled account with a position, it:
   - calls `client.quotePerpClose({ pool, marginBank, account })`;
   - replays exactly the close the quote describes (IOC, `isBid = quote.isBid`, `price = quote.limitPrice`, `quantity = quote.quantity`, default `selfMatchingOption` 0) with `debug_traceCall` at `quote.asOfBlock`;
   - sums the pool's `OrderFilled` logs and reads `PerpPool.getReducingCapacity(account)`.
2. To replay one mismatch directly:
   `node scripts/deep-a-revert.mjs 0xd6cb1dd58580b84d76068ac21594219ce03aeddf 0x47537e3a3ea6e9391f3b26ea45618db6828c8bff false 1786020000000000000000 43376500000000000000 50259318`

## Expected
`closeQuote.ts` calls itself a "reduce-only close quote". If it reports `fillableSize > 0`, a close of that size at `limitPrice` fills, or at least doesn't revert. Anything that makes it revert should show in the result (`fillableSize: 0n` or a reason field).

## Actual
15 of 33 sampled closes the quote calls fillable revert on chain, for three reasons the quote ignores:

- **12 × `SelfMatchCancelTaker()` (`0x6ffc9258`).** The quote counts the account's own resting orders on the opposite side as liquidity. Hitting one reverts the whole IOC, including the fills against other traders. ETH, account `0x47537e3a3ea6e9391f3b26ea45618db6828c8bff`, block 50259318: the quote says 43.3765 of 43.3765 ETH is fillable at limit 1,786.02. The chain fills 0 and reverts `SelfMatchCancelTaker`. The account rests 54.59 ETH of bids.
- **2 × `InsufficientMarginForOrder()` (`0x7ea61260`).** The quote ignores the pool's reducing capacity. Account `0xfe4ce756…` is long 0.11839 BTC and "Healthy" (equity 1,397 vs IM 1,169). Its one resting ask of 0.14991 BTC drives `effectiveReducingCapacity` to 0, so the pool margin-checks the close as a brand-new short.
  - The full close and a half close revert at every price tried: best bid, −0.5%, −2% and the quote's limit.
  - The quote reports `fillableSize: 11839000` of `11839000` and `bandToFillAll: 0`.
  - At the same block the SDK's own `previewPerpOrderMargin` returns `reducingQuantity: 0, sufficient: false`, so the SDK already has the information.
- **1 × `QuantityBelowMinimum`.** A 0.1 HYPE position (minimum 0.12) is quoted 100000 of 100000 fillable. The quote aligns to `lotSize` but never checks `minQuantity`.

| Market | Sampled | Quote fillable, close reverts |
|---|---|---|
| BTC | 12 | 2 |
| ETH | 7 | 4 |
| SOL | 4 | 3 |
| HYPE | 5 | 4 |
| XRP | 5 | 2 |

`quotePerpClose` is the SDK's "can I exit?" read. A risk guard or close button that trusts it sends closes that revert, burn gas, and leave the position open, which is worst during a liquidation race.

Suggested fix:
- Read the owner's resting orders and stop the book walk at the first own order, or report `selfMatchBlocked`.
- Read `getReducingCapacity` and flag any portion above it.
- Return `fillableSize: 0n` with a reason when the position is below `minQuantity`.

## Evidence
- `research/deep-a-closequote-final.txt`: 33 rows. `SUMMARY {"n":33,"mismatch":15,"reasons":{"SelfMatchCancelTaker":12,"InsufficientMarginForOrder":2,"QuantityBelowMinimum":1}}`, with per-row block, quote vs chain fill, `effReduceCap` and revert name. Example row:
  `ETH OWN-OPPOSITE 0x47537e3a… block 50259318 size 43376500000000000000 ownOppQty 54591700000000000000 | quote fillable 43376500000000000000 of 43376500000000000000 limit 1786020000000000000000 | chain filled 0 fills 0 effReduceCap 0 revert SelfMatchCancelTaker`
- `scripts/deep-a-revert.mjs` on that row → `EXECUTION_REVERTED 0x6ffc9258 SelfMatchCancelTaker` (re-run 2026-11-14)
- `research/deep-a-closemargin-btc.txt`, `research/deep-a-fe4c-state.txt`: the `0xfe4ce756…` case (resting ask, health, `previewPerpOrderMargin`)
- `research/deep-a-replay.txt`: historical-block replays revert the same way

## Environment
@somnia-chain/markets-sdk 0.33.0 (`src/perp/closeQuote.ts`, new in 0.33.0), Somnia Tokyo testnet / Hideki (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network (`debug_traceCall`, callTracer `withLog`), blocks 50259116–50260216, 2026-11-14 UTC. Read-only.
