// Docs market table says Paper USDso = "No" for 1000PEPE, LIT, PUMP, VVV, ZEC, ZRO. Read the on-chain voucher allowlist per market.
import { markets, pc, MB, j } from "./sdk-common.mjs"
const acct = process.argv[2] || "0xf9f8df82"
const all = await markets.client.listPerpMarkets({ limit: 200 })
const core = all.filter(m => /^(BTC|ETH|HYPE|SOL|XRP|ADA|AVAX|BNB|DOGE|LINK|NEAR|SUI|XLM|1000PEPE|LIT|PUMP|TAO|VVV|WLD|ZEC|ZRO)$/.test(m.baseSymbol))
const docsNo = new Set(["1000PEPE", "LIT", "PUMP", "VVV", "ZEC", "ZRO"])
for (const m of core) {
  const lev = await markets.client.getPerpLeverage({ marginBank: MB, pool: m.poolAddress, account: acct }).catch(e => ({ err: e.message.split("\n")[0] }))
  console.log(m.baseSymbol.padEnd(9), "docs:", docsNo.has(m.baseSymbol) ? "No " : "Yes", "| chain voucherMarketAllowed:", lev.voucherMarketAllowed, "voucherLeverageCapX:", lev.voucherLeverageCapX, "creditFloor:", lev.creditFloor?.toString(), lev.err ?? "")
}
process.exit(0)
