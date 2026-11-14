// Compare the Hideki indexer's Market rows against on-chain pool reads for every non-test perp market.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { createPublicClient, http, parseAbi } from "viem"
const RPC = "https://api.hideki2.infra.testnet.somnia.network"
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const pc = createPublicClient({ chain: hidekiTestnet, transport: http(RPC) })
const abi = parseAbi([
  "function getOrderBookParameters() view returns ((uint256 tickSize, uint256 minQuantity, uint256 lotSize))",
  "function getPerpPoolParameters() view returns ((uint256 initialMarginBps, uint256 maintenanceMarginBps, uint256 closeOutMarginBps, uint256 maxOpenInterest, uint256 maxPositionSize, uint256 takerFeeBpsTimes1k, int256 makerFeeBpsTimes1k, uint256 insuranceFundShareBps))",
  "function getOpenInterest() view returns (uint256)",
  "function getCurrentFundingRate() view returns (int256)",
  "function tryGetMarkPrice() view returns (bool, uint256)",
  "function getIndexPrice() view returns (uint256, uint256)",
  "function getCumulativeFundingPerUnit() view returns (int256)",
])
const all = (await markets.client.listPerpMarkets({ limit: 1000 })).filter(m => !/^T[0-9A-F]{6}$|LOADTEST|ADLT/.test(m.baseSymbol))
const now = Math.floor(Date.now() / 1000)
console.log("UTC", new Date().toISOString(), "head", await pc.getBlockNumber())
const out = []
for (const m of all) {
  const r = async (fn) => { try { return await pc.readContract({ address: m.poolAddress, abi, functionName: fn }) } catch (e) { return "ERR:" + (e.shortMessage || e.message).slice(0, 80) } }
  const [ob, pp, oi, fr, mk, ix, cf] = await Promise.all(["getOrderBookParameters","getPerpPoolParameters","getOpenInterest","getCurrentFundingRate","tryGetMarkPrice","getIndexPrice","getCumulativeFundingPerUnit"].map(r))
  const row = {
    sym: m.baseSymbol,
    idx_imBps: m.initialMarginBps, chain_imBps: pp.initialMarginBps?.toString(), chain_mmBps: pp.maintenanceMarginBps?.toString(),
    chain_maxOI: pp.maxOpenInterest?.toString(), chain_maxPos: pp.maxPositionSize?.toString(),
    tickEq: ob.tickSize === BigInt(m.tickSize), lotEq: ob.lotSize === BigInt(m.lotSize), minEq: ob.minQuantity === BigInt(m.minQuantity),
    idx_OI: m.openInterest?.toString(), chain_OI: oi?.toString(),
    idx_fr: m.fundingRate?.toString(), chain_fr: fr?.toString(),
    idx_mark: m.markPrice?.toString(), chain_markOk: mk?.[0], chain_mark: mk?.[1]?.toString(),
    idx_index: m.indexPrice?.toString(), chain_index: ix?.[0]?.toString(), chain_indexAge: ix?.[1] ? now - Number(ix[1]) : null,
    idx_markAge: m.markPriceUpdatedAt ? now - Number(m.markPriceUpdatedAt) : null,
    idx_cfpu: m.cumulativeFundingPerUnit?.toString(), chain_cfpu: cf?.toString(),
  }
  out.push(row); console.log(JSON.stringify(row))
}
process.exit(0)
