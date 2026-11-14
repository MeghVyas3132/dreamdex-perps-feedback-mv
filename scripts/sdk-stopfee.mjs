import { markets, pc, POOLS, j } from "./sdk-common.mjs"
const all = await markets.client.listPerpMarkets({ limit: 200 })
const regs = [...new Set(all.map(m => m.stopRegistry).filter(Boolean))]
console.log("distinct stopRegistries", regs.length, "markets without stopRegistry:", all.filter(m => !m.stopRegistry).map(m => m.baseSymbol).join(","))
for (const r of regs) console.log(r, "somiPayment", (await markets.client.getPerpStopOrderSomiPayment?.(r).catch(e => "err " + e.message.split("\n")[0]))?.toString())
process.exit(0)
