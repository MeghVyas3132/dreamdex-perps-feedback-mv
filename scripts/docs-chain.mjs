import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { createPublicClient, http, formatUnits } from "viem"
import * as ReadsAbi from "../node_modules/@somnia-chain/markets-sdk/dist/readsAbi.js"
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const DOC = ["BTC","ETH","HYPE","SOL","XRP","ADA","AVAX","BNB","DOGE","LINK","NEAR","SUI","XLM","1000PEPE","LIT","PUMP","TAO","VVV","WLD","ZEC","ZRO"]
const all = await markets.client.listPerpMarkets({ limit: 1000 })
const bank = all[0].marginBank
const c = markets.client
const out = {}
console.log("block", await pc.getBlockNumber())
try { console.log("voucherCampaign", JSON.stringify(await c.getPerpVoucherCampaign(bank),(k,v)=>typeof v==='bigint'?v.toString():v)) } catch(e){console.log("campaign err",e.shortMessage||e.message)}
let vcap; try { vcap = await pc.readContract({address:bank,abi:ReadsAbi.marginBankReadAbi,functionName:"getVoucherLeverageCap"}); console.log("voucherLevCap", vcap) } catch(e){console.log("vcap err", e.shortMessage)}
try { console.log("maxLevLimit", await pc.readContract({address:bank,abi:ReadsAbi.marginBankReadAbi,functionName:"getMaxLeverageLimit"})) } catch(e){console.log(e.shortMessage)}
for (const s of DOC) {
  const m = all.find(x=>x.baseSymbol===s)
  if (!m) { console.log(s, "MISSING"); continue }
  const r = {}
  try { const p = await c.getPerpRiskParams(m.poolAddress); Object.assign(r,{im:p.initialMarginBps, mm:p.maintenanceMarginBps, co:p.closeOutMarginBps, oiCap:formatUnits(p.maxOpenInterest,m.baseDecimals), posCap:formatUnits(p.maxPositionSize,m.baseDecimals), ratio: p.maxOpenInterest? Number(p.maxPositionSize*10000n/p.maxOpenInterest)/10000:null, taker:p.takerFeeBpsTimes1k, maker:p.makerFeeBpsTimes1k}) } catch(e){ r.riskErr=e.shortMessage||e.message }
  try { const h = await c.getPerpHealthSnapshot(m.poolAddress); r.priceable=h.priceable; if(h.priceable) r.effIm=h.effectiveImfBps } catch(e){ r.hErr=e.shortMessage||e.message }
  try { const st = await c.getPerpState(m.poolAddress); Object.assign(r,{fw:st.fundingWindowSec, fi:st.fundingIntervalSec, markOk:st.markPriceOk, idxAge: Math.floor(Date.now()/1000)-Number(st.indexUpdatedAt), oi: formatUnits(st.openInterest,m.baseDecimals)}) } catch(e){ r.stErr=e.shortMessage||e.message }
  try { const ob = await pc.readContract({address:m.poolAddress, abi:ReadsAbi.perpPoolReadAbi ?? [], functionName:"getOrderBookParameters"}); r.ob = ob.map(String) } catch(e){ r.obErr=(e.shortMessage||e.message).slice(0,80) }
  try { r.voucherAllowed = await pc.readContract({address:bank,abi:ReadsAbi.marginBankReadAbi,functionName:"isVoucherMarketAllowed",args:[m.poolAddress]}) } catch(e){ r.vaErr=e.shortMessage }
  try { r.marketMaxLev = await pc.readContract({address:bank,abi:ReadsAbi.marginBankReadAbi,functionName:"getMaxLeverage",args:["0x0000000000000000000000000000000000000001", m.poolAddress]}) } catch(e){ r.mlErr=(e.shortMessage||e.message).slice(0,80) }
  if (m.stopRegistry) { try { r.stopSomi = formatUnits(await c.getPerpStopOrderSomiPayment(m.stopRegistry),18) } catch(e){ r.stopErr=e.shortMessage } }
  r.indexerImBps = m.initialMarginBps; r.dec=m.baseDecimals; r.tick=formatUnits(m.tickSize,18); r.min=formatUnits(m.minQuantity,m.baseDecimals); r.pool=m.poolAddress; r.stopRegistry=m.stopRegistry
  out[s]=r
  console.log(s, JSON.stringify(r,(k,v)=>typeof v==='bigint'?v.toString():v))
}
import fs from "fs"; fs.writeFileSync("research/chain-markets.json", JSON.stringify(out,(k,v)=>typeof v==='bigint'?v.toString():v,1))
process.exit(0)
