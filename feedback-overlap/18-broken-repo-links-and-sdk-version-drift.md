# Two linked GitHub repos are 404, and four SDK versions are in play across the docs, the app and the bot kit
Severity: normal
Area: docs

## Steps to reproduce
1. `curl -sI https://github.com/somnia-chain/somnia-skills` (linked from /docs/developers/contracts/spot-router)
2. `curl -s https://api.github.com/repos/somnia-chain/somnia-markets` (the `repository` in `@somnia-chain/markets-sdk/package.json`)
3. Compare SDK versions: docs, npm, and the bot kit's lockfiles.

## Expected
Links resolve, and the docs, app and bot kit target one SDK version (or the docs state the minimum).

## Actual
- `somnia-chain/somnia-skills` → 404.
- `somnia-chain/somnia-markets` → `{"message":"Not Found"}`, so npm's "Repository" link and issue tracker for the SDK go nowhere.
- Versions in play:
  - the perps docs: "this page uses version 0.32.1, the one the app runs"
  - npm latest: 0.33.0
  - bot kit perp-core: 0.31.0
  - bot kit ec-core: 0.30.0
  - the event-contracts page: requires ≥ 0.29.0

## Evidence
`curl -sI https://github.com/somnia-chain/somnia-skills` → 404 and `curl -s https://api.github.com/repos/somnia-chain/somnia-markets` → Not Found (2026-11-14; we checked 202 docs links, and the only other failures were 403 bot-blocks from npmjs.com and hacken.io); `research/dreamdex-bot-kit` lockfiles

## Environment
@somnia-chain/markets-sdk 0.33.0 (the docs pin 0.32.1), viem 2.x, Node 26
Network: Somnia Tokyo testnet / "Hideki" (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql
Wallet: 0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934. Tested 2026-11-14 UTC.
