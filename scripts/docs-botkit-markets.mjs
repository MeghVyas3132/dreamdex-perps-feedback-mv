// Mirrors dreamdex-bot-kit packages/perp-core/src/exchange.ts + markets.ts (read-only, no key)
import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES, SOMNIA_HIDEKI_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const diff = Object.keys(SOMNIA_HIDEKI_TESTNET_ADDRESSES).filter(k => SOMNIA_TESTNET_ADDRESSES[k] !== SOMNIA_HIDEKI_TESTNET_ADDRESSES[k])
console.log("SOMNIA_TESTNET_ADDRESSES vs HIDEKI differ on:", diff.join(","))
for (const [label, addresses] of [["kit (SOMNIA_TESTNET_ADDRESSES)", SOMNIA_TESTNET_ADDRESSES], ["docs (HIDEKI)", SOMNIA_HIDEKI_TESTNET_ADDRESSES]]) {
  const ex = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", wsRpcUrl: "wss://api.hideki2.infra.testnet.somnia.network/ws", addresses })
  const t0 = Date.now()
  try {
    const mk = await ex.loadMarkets(true)
    const swaps = Object.values(mk).filter(m => m.type === "swap")
    const active = swaps.filter(m => m.active)
    const bases = active.map(m => m.symbol.split("/")[0])
    console.log(label, "loadMarkets total", Object.keys(mk).length, "swaps", swaps.length, "active", active.length, "ms", Date.now()-t0)
    console.log("  BTC-PERP resolvable:", bases.includes("BTC"), " test/LOADTEST among active:", bases.filter(b=>/^T[0-9A-F]{6}$|LOADTEST|ADLT/.test(b)).length, " sample:", bases.slice(0,60).join(" "))
  } catch (e) { console.log(label, "ERR", e.shortMessage || e.message) }
}
process.exit(0)
