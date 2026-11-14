// getPerpPositionsPage pagination: compare paged walk vs one-shot query.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const mk = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const C = mk.client
for (const opts of [{}, { includeFlat: true }, { minSize: 1n }]) {
  const seen = new Map(); let cursor, pages = 0, dup = 0
  do { const p = await C.getPerpPositionsPage({ ...opts, limit: 97, cursor }); pages++; for (const r of p.items) { if (seen.has(r.id)) dup++; seen.set(r.id, r) } cursor = p.nextCursor ?? undefined } while (cursor && pages < 400)
  const one = await C.getPerpPositionsPage({ ...opts, limit: 1000 })
  console.log(JSON.stringify(opts, (k, v) => typeof v === "bigint" ? v.toString() : v), "paged rows", seen.size, "pages", pages, "dups", dup, "first1000", one.items.length, "next", one.nextCursor)
  if (seen.size) console.log(" sample ids", [...seen.keys()].slice(0, 3))
}
process.exit(0)
