// Read indexer Market.openInterest + its progress block, then read on-chain getOpenInterest() AT that same block.
import { createPublicClient, http, parseAbi } from "viem"
const G = "https://hideki-dev.smk.somnia.host/v1/graphql", RPC = "https://api.hideki2.infra.testnet.somnia.network"
const gql = async (q) => (await (await fetch(G, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: q }) })).json())
const pc = createPublicClient({ transport: http(RPC) })
const abi = parseAbi(["function getOpenInterest() view returns (uint256)"])
const d = await gql(`{ _meta { progressBlock } Market(where:{marketType:{_eq:"PERP"}}, limit:1000){ baseSymbol poolAddress openInterest openInterestUpdatedAt } }`)
const blk = BigInt(d.data._meta[0].progressBlock)
console.log("UTC", new Date().toISOString(), "indexer progressBlock", blk, "chain head", await pc.getBlockNumber())
let bad = 0
for (const m of d.data.Market.filter(m => !/^T[0-9A-F]{6}$|LOADTEST|ADLT/.test(m.baseSymbol))) {
  const oi = await pc.readContract({ address: m.poolAddress, abi, functionName: "getOpenInterest", blockNumber: blk })
  const eq = oi.toString() === String(m.openInterest)
  if (!eq) bad++
  console.log(eq ? "OK  " : "DIFF", m.baseSymbol.padEnd(9), "indexer", m.openInterest, "chain@blk", oi.toString(), "oiUpdatedAt", m.openInterestUpdatedAt, m.poolAddress)
}
console.log("mismatches", bad)
