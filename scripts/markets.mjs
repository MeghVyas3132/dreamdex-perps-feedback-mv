import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const t0=Date.now()
const perps = await markets.client.listPerpMarkets()
console.log("count", perps.length, "ms", Date.now()-t0)
console.log(JSON.stringify(perps[0], (k,v)=>typeof v==='bigint'?v.toString()+'n':v, 2))
for (const m of perps) console.log(m.baseSymbol, m.baseDecimals, m.quoteDecimals, m.tickSize, m.lotSize, m.minQuantity, m.maxLeverage ?? m.initialMarginBps, m.poolAddress)
console.log("cfg", JSON.stringify(await markets.client.getPerpSystemConfig(perps[0].marginBank),(k,v)=>typeof v==='bigint'?v.toString():v))
console.log("addrs", JSON.stringify(SOMNIA_HIDEKI_TESTNET_ADDRESSES))
process.exit(0)
