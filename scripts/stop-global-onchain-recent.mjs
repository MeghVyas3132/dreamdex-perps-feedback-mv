import { createPublicClient, http, parseAbi } from "viem"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const REG = "0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a"
const abi = parseAbi(["function isGloballyApproved(address owner, address operator, bytes4 selector) view returns (bool)"])
const G = "https://hideki-dev.smk.somnia.host/v1/graphql"
const r = await (await fetch(G, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: `{ StopOrder(limit:400, order_by:{createdAt:desc}){ owner registry createdAt } }` }) })).json()
const seen = new Map(); for (const s of r.data.StopOrder) { const k = s.owner + s.registry; if (!seen.has(k)) seen.set(k, s) }
let n = 0, glob = [], early = 0, late = 0
for (const s of [...seen.values()].slice(0, 150)) {
  const ok = await pc.readContract({ address: REG, abi, functionName: "isGloballyApproved", args: [s.owner, s.registry, "0x80054449"] })
  n++; if (ok) { glob.push(s); Number(s.createdAt) < 1794238080 ? early++ : late++ }
}
console.log("owner/registry pairs checked:", n, "globally approved:", glob.length, "(first stop before 0.33.0:", early, "after:", late, ")")
console.log(glob.slice(0, 5).map((s) => `${s.owner} -> registry ${s.registry} firstStop ${new Date(Number(s.createdAt) * 1000).toISOString()}`).join("\n"))
