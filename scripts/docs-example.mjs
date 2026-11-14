// Verbatim "Connect" + "Size and place an order" example from
// https://app.dreamdex.io/docs/developers/perps-testnet (read-only: no privateKey)
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { parseUnits } from "viem"
const markets = new SomniaMarkets({
  chain: hidekiTestnet,
  indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql",
  addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
})
const account = process.argv[2] ?? "0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934"
const perps = await markets.client.listPerpMarkets()
console.log("listPerpMarkets() rows:", perps.length)
const btc = perps.find((m) => m.baseSymbol === "BTC")
console.log("btc:", btc?.poolAddress)
try {
  const eligibility = await markets.client.getPerpVoucherEligibility(btc.marginBank, account)
  console.log(eligibility)
} catch (e) { console.log("CRASH:", e.constructor.name, e.message) }
// Same flow with the BTC row fetched by symbol, to keep going:
const [b] = await markets.client.listPerpMarkets({ baseSymbol: "BTC" })
const ser = (o) => JSON.stringify(o, (k, v) => typeof v === "bigint" ? v.toString() : v)
console.log("eligibility", ser(await markets.client.getPerpVoucherEligibility(b.marginBank, account)))
const price = parseUnits("100000", b.quoteDecimals)
const max = await markets.client.getMaxPerpOrderSize({ pool: b.poolAddress, marginBank: b.marginBank, account, isBid: true, price })
console.log("max", ser(max))
process.exit(0)
