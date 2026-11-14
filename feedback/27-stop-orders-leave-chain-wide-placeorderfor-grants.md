# Perp TP/SL left 7,203 chain-wide `placeOrderFor` grants (1,611 traders) to stop registries; they are still being issued after SDK 0.33.0 narrowed them to one pool, and nothing revokes the old ones
Severity: normal
Area: SDK

## Steps to reproduce
1. Compare `src/perp/stops.ts` across `@somnia-chain/markets-sdk` versions. 0.32.1 (the version the developer docs say "the app runs") sends `setOperatorApprovalGlobal(registry, [placeOrderFor 0x80054449], true)` before a trader's first stop. 0.33.0 sends `setOperatorApprovalForPool(pool, registry, …)` instead, with the comment "a global grant would also reach every other spot and perp pool".
2. `node scripts/stop-global-approvals.mjs` counts indexer `OperatorApproval` rows for `selector 0x80054449` whose operator is a stop registry, splitting `pool: "global"` from per-pool rows.
3. Spot-check on chain with `node scripts/stop-global-onchain.mjs` (`OperatorPermissionsRegistry 0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a .isGloballyApproved(owner, registry, 0x80054449)`) and `node scripts/stop-global-newusers.mjs`, which checks traders whose first stop came after 0.33.0 (2026-11-09 15:28 UTC).

## Expected
Placing a TP/SL on one market grants the stop registry `placeOrderFor` on that pool only, as 0.33.0 now does. Grants made under the old behaviour are narrowed or revoked (or the docs tell users how), and the app no longer issues global grants.

## Actual
- **7,203** live global `placeOrderFor` grants point at the 23 stop registries, held by **1,611** distinct traders. Only **528** are per-pool. A global grant auto-extends to every present and future spot and perp pool for that owner.
- The on-chain check agrees: 150 of 150 of the earliest stop owners (Oct 6 onward) are `isGloballyApproved = true` today.
- Global grants are **still being created after the 0.33.0 fix**: 7 are dated after 2026-11-09 15:28 UTC. For example, owner `0x2174ccbf314d593e486a2d6b64e76b9a60372c8e` sent `setOperatorApprovalGlobal` (selector `0x7f1e31ce`) in tx `0x723484e974729817d84334726ce1ece2755b084c607b98a4ab6b90ce24c395a1` (block 48333840, 2026-11-12). Six blocks later came their first stop, tx `0x6d24d0f918030f22a3af2a015754932aa4243d4293562555db8bcad209f38a32` to registry `0x1c3fabc41871ec838960f80329dcd920fec241c9`. This matches the docs saying the app runs 0.32.1.
- No version of the SDK or app revokes or narrows the existing global grants, and no docs page mentions them. Users who set one TP/SL have given a standing order-placement right across every pool, and that right outlives the fix.

This is least-privilege hygiene, not an exploit: the registries are protocol contracts. But it is the over-broad scope the maintainers themselves fixed in 0.33.0, and the fix never reached the app or existing accounts.

## Evidence
- `research/stop-global-approvals.txt`: `placeOrderFor approvals to stop registries: 7731 global: 7203 per-pool: 528`, `distinct users: 1611`, `global grants updated after 0.33.0 release: 7`
- `research/stop-global-onchain.txt`: `owner/registry pairs checked: 150 globally approved: 150`
- `research/stop-global-newusers.txt` plus the two txs above; `research/indexer-operatorapproval-0x2174.json` (`"pool":"global"` row for that owner)
- SDK source: 0.32.1 vs 0.33.0 `src/perp/stops.ts` (`setOperatorApprovalGlobal` → `setOperatorApprovalForPool`, new `requireRecordedRegistry` guard)

## Environment
@somnia-chain/markets-sdk 0.32.1 vs 0.33.0, Somnia Tokyo testnet / Hideki (chain 50383), RPC https://api.hideki2.infra.testnet.somnia.network, indexer https://hideki-dev.smk.somnia.host/v1/graphql. Read-only; tested 2026-11-14 UTC.
