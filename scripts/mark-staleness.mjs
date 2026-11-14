// Compare indexer market-row markPrice/markPriceUpdatedAt with the live on-chain mark
// (via getMaxPerpOrderSize, which reads the chain) for every listed perp.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const acct = "0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934"
const all = (await markets.client.listPerpMarkets({ limit: 1000 })).filter(m => !/^T[0-9A-F]{6}$|LOADTEST|ADLT/.test(m.baseSymbol))
const now = Math.floor(Date.now() / 1000)
console.log("UTC", new Date().toISOString())
for (const m of all) {
  const r = await markets.client.getMaxPerpOrderSize({ pool: m.poolAddress, marginBank: m.marginBank, account: acct, isBid: true, price: BigInt(m.markPrice ?? 1) })
  const idx = Number(m.markPrice) / 1e18, live = r.markPrice ? Number(r.markPrice) / 1e18 : NaN
  console.log(m.baseSymbol.padEnd(9), "idxAgeMin", ((now - Number(m.markPriceUpdatedAt)) / 60).toFixed(0).padStart(4), "idxMark", idx.toPrecision(8).padStart(14), "chainMark", live.toPrecision(8).padStart(14), "diff%", ((idx / live - 1) * 100).toFixed(3).padStart(8), "priceable", r.priceable, "imf", r.effectiveImfBps?.toString(), "rowImBps", m.initialMarginBps, "maxPos", r.maxPositionSize?.toString(), "blk", r.asOfBlock)
}
process.exit(0)
