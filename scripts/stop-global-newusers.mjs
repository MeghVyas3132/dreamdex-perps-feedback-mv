// Users whose FIRST-ever stop order is after markets-sdk 0.33.0 (2026-11-09 15:28 UTC): do they hold a
// GLOBAL placeOrderFor grant to a perp stop registry? If yes, global grants are still being issued
// (e.g. by the app, which the docs say runs 0.32.1) after the SDK narrowed it to per-pool.
import { createPublicClient, http, parseAbi } from "viem"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const REG = "0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a"
const abi = parseAbi(["function isGloballyApproved(address owner, address operator, bytes4 selector) view returns (bool)", "function isApprovedForPool(address owner, address pool, address operator, bytes4 selector) view returns (bool)"])
const G = "https://hideki-dev.smk.somnia.host/v1/graphql"
const CUT = Math.floor(Date.parse("2026-11-09T15:28:00Z") / 1000)
const first = new Map()
for (let off = 0; ; off += 1000) {
  const r = await (await fetch(G, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: `{ StopOrder(limit:1000, offset:${off}, order_by:{createdAt:asc}){ owner registry createdAt txHash market_id } }` }) })).json()
  const rows = r.data?.StopOrder ?? []
  for (const s of rows) if (!first.has(s.owner)) first.set(s.owner, s)
  if (rows.length < 1000 || off > 60000) break
}
const fresh = [...first.values()].filter((s) => Number(s.createdAt) > CUT)
console.log("distinct stop owners:", first.size, "first stop after 0.33.0:", fresh.length)
let g = 0, list = []
for (const s of fresh.slice(0, 80)) {
  const ok = await pc.readContract({ address: REG, abi, functionName: "isGloballyApproved", args: [s.owner, s.registry, "0x80054449"] })
  if (ok) { g++; list.push(s) }
}
console.log("of", Math.min(80, fresh.length), "new owners checked, globally approved:", g)
for (const s of list.slice(0, 5)) console.log(` ${s.owner} registry ${s.registry} firstStop ${new Date(Number(s.createdAt) * 1000).toISOString()} tx ${s.txHash}`)
