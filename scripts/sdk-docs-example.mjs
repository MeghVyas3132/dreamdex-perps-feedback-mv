// The "Perps on Testnet for Developers" page example, verbatim except no sends. Wallet has 0 STT / 0 USDso.
import "node:process"
import fs from "fs"
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { parseUnits } from "viem"
const env = Object.fromEntries(fs.readFileSync(".env","utf8").trim().split("\n").map(l=>l.split("=")))
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES, privateKey: env.PRIVATE_KEY })
const j = (o) => JSON.stringify(o, (k, v) => (typeof v === "bigint" ? v.toString() : v))
const perps = await markets.client.listPerpMarkets()
const btc = perps.find((m) => m.baseSymbol === "BTC")
console.log("step1 btc from default listPerpMarkets():", btc ? btc.poolAddress : btc)
const btc2 = (await markets.client.listPerpMarkets({ baseSymbol: "BTC" }))[0]
const account = markets.walletAddress
console.log("walletAddress", account)
const elig = await markets.client.getPerpVoucherEligibility(btc2.marginBank, account)
console.log("eligibility", j(elig))
const price = parseUnits("100000", btc2.quoteDecimals)
const max = await markets.client.getMaxPerpOrderSize({ pool: btc2.poolAddress, marginBank: btc2.marginBank, account, isBid: true, price })
console.log("max", j(max))
process.exit(0)
