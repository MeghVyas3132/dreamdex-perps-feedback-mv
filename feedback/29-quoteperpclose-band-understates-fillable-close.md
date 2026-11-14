# `quotePerpClose` caps closes at the pool's resting-price band, but taker closes fill beyond it, so it reports `bandToFillAll: null` for a close that fully fills
Severity: normal
Area: SDK

## Steps to reproduce
1. `node scripts/deep-a-band.mjs BTC 0x8239544db8718d75111e4aeedc42036742d22e68`
2. The script quotes the full close of this 53.917 BTC short, then replays the IOC close at the same block with limit = `quote.limitPrice` and with limits 50, 100, 300 and 1000 bps beyond it.

## Expected
`closeQuote.ts` documents three things:
- `limitPrice` is "the worst price the band allows … A valid order price".
- `bandToFillAll: null` means the opposite side "cannot fill it within maxBandBps".
- `fillableSizeAtMaxBand` is what fills at the pool's maximum band.

If the band really limits closes, the chain shouldn't fill a close past it.

## Actual
At block 50261161 the quote returns `referencePrice` 65,712.38, `maxBandBps` 250, `limitPrice` 67,355.1, `fillableSizeAtMaxBand` 1.74484 BTC of 53.917 BTC, and `bandToFillAll: null`.

Replayed on chain:
- limit = `limitPrice` → fills 174,484,000 raw (matches the quote)
- +50 bps → fills 174,484,000
- **+100, +300 and +1000 bps → fill all 5,391,722,000 (the whole 53.917 BTC), worst fill 67,777.0, which is 3.14% from the reference and past the 2.5% "max band"**, with no revert

The band, `getCircuitBreakerParameters().maxPriceMovementBps`, is a **resting**-price band, per the SDK's own ABI comment at `src/readsAbi.ts:240`. `bandEdge()` applies a bid's resting ceiling (`floor(ref·(1+bps))`) to a taker buy that never rests. So the quote says the book is too thin to exit when one IOC closes the whole position. A guard bot reading `bandToFillAll: null` falls back to a slower or partial exit for no reason.

Note for the maintainers: `contractErrorsAbi.ts` defines `FillPriceOutsideBand()`. If takers were meant to be held to `maxPriceMovementBps`, a fill at 3.14% means the pool isn't enforcing it on IOC takers.

## Evidence
`research/deep-a-band-btc.txt` (the quote JSON plus five replay lines with filled quantity and worst fill price):
```
limit = quote.limitPrice px 67355100000000000000000 -> filled 174484000 of 5391722000 ...
limit beyond band by 100 bps px 68028600000000000000000 -> filled 5391722000 of 5391722000 ... worstFill 67777000000000000000000 revert -
```
Script: `scripts/deep-a-band.mjs`

## Environment
@somnia-chain/markets-sdk 0.33.0 (`src/perp/closeQuote.ts`), Somnia Tokyo testnet / Hideki (chain 50383), BTC-PERP pool `0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0`, block 50261161, 2026-11-14 UTC. Read-only `debug_traceCall`.
