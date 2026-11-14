import { markets, j } from "./sdk-common.mjs"
const t0 = Date.now()
await markets.loadMarkets()
const syms = markets.symbols.filter(s => s.includes(":"))
console.log("perp symbols", syms.length, "ms", Date.now() - t0, "discoveryErr", markets.perpDiscoveryError?.message)
console.log(syms.join(" "))
for (const s of ["BTC/USDso:USDso", "NEAR/USDso:USDso", "PUMP/USDso:USDso", "ETH/USDso:USDso"]) {
  const m = markets.markets[s]
  if (!m) { console.log(s, "MISSING"); continue }
  console.log(s, j({ precision: m.precision, limits: m.limits, contractSize: m.contractSize, linear: m.linear, maxLev: m.limits?.leverage, info: undefined }))
  try { console.log("  amountToPrecision(1.23456789)", markets.amountToPrecision(s, 1.23456789), "priceToPrecision(65000.1234)", markets.priceToPrecision(s, 65000.1234)) } catch (e) { console.log("  precision err", e.message) }
}
process.exit(0)
