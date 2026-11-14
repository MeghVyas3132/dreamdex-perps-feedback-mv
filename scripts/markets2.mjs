import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const all = await markets.client.listPerpMarkets({ limit: 1000 })
console.log("total perps", all.length)
const d = await markets.client.listPerpMarkets()
console.log("default", d.length, "BTC in default?", !!d.find(m=>m.baseSymbol==="BTC"))
const btcs = await markets.client.listPerpMarkets({ baseSymbol: "BTC" })
console.log("BTC rows", btcs.length, btcs.map(m=>[m.poolAddress,m.stopRegistry,m.initialMarginBps,m.markPrice?.toString(),m.markPriceUpdatedAt?.toString()]))
const sym = {}; for (const m of all) sym[m.baseSymbol]=(sym[m.baseSymbol]||0)+1
console.log(JSON.stringify(sym))
const now=Math.floor(Date.now()/1000)
for (const m of all.filter(m=>!/^T[0-9A-F]{6}$|LOADTEST|ADLT/.test(m.baseSymbol))) console.log(m.baseSymbol.padEnd(9), "dec",m.baseDecimals, "imBps",m.initialMarginBps, "stopReg",m.stopRegistry?1:0, "markAge",m.markPriceUpdatedAt? now-Number(m.markPriceUpdatedAt):null, "mark",m.markPrice?.toString(), "idx", m.indexPrice?.toString(), "fr", m.fundingRate?.toString(), "OI", m.openInterest?.toString(), "tick",m.tickSize.toString(),"lot",m.lotSize.toString(),"min",m.minQuantity.toString(), m.poolAddress)
process.exit(0)
