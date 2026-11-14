// getVenueHealth on Hideki vs. the actual per-market perp feed state (getPerpFeedStatus) at the same moment.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const mk = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const C = mk.client
const ser = (o) => JSON.stringify(o, (k, v) => (typeof v === "bigint" ? v.toString() : v))
console.log("UTC", new Date().toISOString())
const h = await C.getVenueHealth()
console.log("getVenueHealth:", ser(h))
const all = await C.listPerpMarkets({ limit: 1000 })
let stale = 0
for (const m of all) {
  try {
    const s = await C.getPerpFeedStatus(m.poolAddress)
    const live = s.markLive ?? s.live ?? s.priceable ?? s.status
    if (live === false || live === "stale" || live === "dead") stale++
    console.log(m.baseSymbol.padEnd(9), m.poolAddress, ser(s).slice(0, 300))
  } catch (e) { console.log(m.baseSymbol.padEnd(9), "ERR", e.message.slice(0, 160)) }
}
console.log("stale/unpriceable markets:", stale, "of", all.length)
process.exit(0)
