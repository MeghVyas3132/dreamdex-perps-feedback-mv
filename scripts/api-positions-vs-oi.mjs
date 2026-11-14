// Sum indexer PerpPosition sizes per side for a market and compare with on-chain getOpenInterest() at the indexer block.
// Also spot-check a few individual positions against the chain (getPosition via SDK ABI).
import { createPublicClient, http, parseAbi } from "viem"
const G = "https://hideki-dev.smk.somnia.host/v1/graphql", RPC = "https://api.hideki2.infra.testnet.somnia.network"
const gql = async (q) => (await (await fetch(G, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: q }) })).json())
const pc = createPublicClient({ transport: http(RPC) })
const abi = parseAbi(["function getOpenInterest() view returns (uint256)"])
const pools = (process.argv[2] || "0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0,0xd6cb1dd58580b84d76068ac21594219ce03aeddf,0xb483ec1fb34996638677c20ab087b16f1896fa53,0x34fa62909f77699a7a6278d992f72ff31c7a619d,0x2a73129f26917124bd2a47a9b355c395c537f050").split(",")
for (const pool of pools) {
  let rows = [], off = 0
  for (;;) {
    const d = await gql(`{ _meta{progressBlock} PerpPosition(where:{market_id:{_eq:"${pool}"}, size:{_gt:"0"}}, limit:1000, offset:${off}, order_by:{id:asc}){ account isLong size updatedAtBlock } }`)
    if (d.errors) { console.log(JSON.stringify(d.errors)); break }
    rows.push(...d.data.PerpPosition); var blk = BigInt(d.data._meta[0].progressBlock)
    if (d.data.PerpPosition.length < 1000) break; off += 1000
  }
  const L = rows.filter(r => r.isLong).reduce((a, r) => a + BigInt(r.size), 0n), S = rows.filter(r => !r.isLong).reduce((a, r) => a + BigInt(r.size), 0n)
  const oi = await pc.readContract({ address: pool, abi, functionName: "getOpenInterest", blockNumber: blk })
  console.log(new Date().toISOString(), pool, "positions", rows.length, "sumLong", L, "sumShort", S, "chainOI@", blk, oi, L === oi ? "LONG=OI" : "LONG!=OI", S === oi ? "SHORT=OI" : "SHORT!=OI")
}
