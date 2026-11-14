# Since Perps Arena closed on 9 Nov, every documented route to perps collateral is dead: new developers cannot place a single perp order
Severity: major
Area: app

## Steps to reproduce
1. Follow https://app.dreamdex.io/docs/trading/perps-testnet → Get started, step 2: "Join Perps Arena … to receive 1,000 paper USDso". https://app.testnet.dreamdex.io/competition shows **"TRADING CLOSED · FINAL CHECKS"** and "4 weeks, Oct 12–Nov 9, 2026".
2. Follow https://app.dreamdex.io/docs/developers/perps-testnet → Get test funds → Paper USDso: `getPerpVoucherEligibility` returns `eligible: true`, and `trader.claimPerpVoucher(...)` reverts (`0x3e31dcc2` = `SelfClaimDisabled()`).
3. Check whether anyone still receives credit: query the indexer for the newest `Credited` margin events:
```
curl -s https://hideki-dev.smk.somnia.host/v1/graphql -H 'content-type: application/json' \
  -d '{"query":"{ MarginEvent(where:{kind:{_eq:\"Credited\"}}, order_by:{blockNumber:desc}, limit:5){ account amount blockNumber timestamp txHash } }"}'
```
4. Try to mint the collateral `0xed7993A74dAe1e6656B704A424DcD8711aAf4F72` directly with `faucet()`, `faucet(uint256)`, `mint(address,uint256)`, `drip()` or `claim()`: all revert. The Tokyo faucet hands out STT only.

## Expected
While the Perps Builder Bounty runs (until 15 Nov), a developer can get perps collateral the way the docs and the bounty page describe ("join the Perps Arena … and you receive paper USDso every week"). Or the docs say the Arena is over and name the replacement route.

## Actual
- The last voucher credit on chain is an admin batch grant in tx `0x5f2a76f8089baaf4efcb2c2d19c351dadfd52f47b42760dd70cb2a86b85c70f4` (block 45279822, timestamp 1794181982 = 2026-11-08 23:53 UTC). No `Credited` event has happened since (checked 2026-11-14 18:10 UTC).
- Self-claim is disabled on chain, the Arena is closed, and the collateral token has no public mint. So no documented path to USDso remains on chain 50383.
- A builder arriving in the bounty's last week can't place, test or evidence any perp order. The only remaining route is asking in Discord, which the docs don't mention; the bounty page only offers it for extra funds.
- The docs still describe the Arena and the self-claim as working, and the app still shows a "Join Perps Arena" button.

## Evidence
- Screenshot `research/perps-arena-closed-2026-11-14.jpg` (app.testnet.dreamdex.io/competition, 2026-11-14 18:09 UTC)
- Indexer query above: newest `Credited` rows all at block 45279822
- `research/live-log.jsonl` steps `claimPerpVoucher` (SDK claim reverts from our funded wallet, 2026-11-14T17:48:59Z)
- Mint attempts: `scripts/voucher-claim-debug.mjs` plus the eth_call probe of faucet/mint selectors (all revert)

## Environment
@somnia-chain/markets-sdk 0.33.0, Somnia Tokyo testnet / Hideki (chain 50383), indexer https://hideki-dev.smk.somnia.host/v1/graphql, wallet 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934 (1 STT, 0 USDso). Tested 2026-11-14 UTC.
