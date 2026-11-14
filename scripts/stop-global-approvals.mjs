// How many traders hold a GLOBAL placeOrderFor approval for a perp stop registry (vs per-pool),
// and are new global grants still being created after markets-sdk 0.33.0 (2026-11-09) narrowed it?
const G = "https://hideki-dev.smk.somnia.host/v1/graphql"
const q = async (query) => (await (await fetch(G, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) })).json())
const regs = new Set()
let off = 0
for (;;) { const r = await q(`{ StopOrder(limit:1000, offset:${off}, distinct_on: registry){ registry } }`); const rows = r.data?.StopOrder ?? []; rows.forEach((x) => regs.add(x.registry.toLowerCase())); if (rows.length < 1000) break; off += 1000 }
console.log("perp/spot stop registries seen in StopOrder:", regs.size)
let all = []; off = 0
for (;;) { const r = await q(`{ OperatorApproval(limit:1000, offset:${off}, where:{selector:{_eq:"0x80054449"}}, order_by:{updatedAt:asc}){ id user operator pool allowed isDenial updatedAt } }`); if (r.errors) { console.log(JSON.stringify(r.errors).slice(0, 300)); break } const rows = r.data.OperatorApproval; all = all.concat(rows); if (rows.length < 1000) break; off += 1000 }
const toReg = all.filter((a) => regs.has(a.operator.toLowerCase()))
const isGlobal = (a) => !a.pool || a.pool === "global" || /^0x0{40}$/.test(a.pool)
const g = toReg.filter(isGlobal), p = toReg.filter((a) => !isGlobal(a))
console.log("placeOrderFor approvals to stop registries:", toReg.length, "global:", g.length, "per-pool:", p.length)
console.log("global & still allowed:", g.filter((a) => a.allowed && !a.isDenial).length, "distinct users:", new Set(g.filter((a) => a.allowed).map((a) => a.user)).size)
const cut = Date.parse("2026-11-09T15:28:00Z") / 1000
const after = g.filter((a) => Number(a.updatedAt) > cut)
console.log("global grants updated after 0.33.0 release:", after.length)
console.log("sample latest global:", JSON.stringify(g.slice(-3)))
console.log("sample latest per-pool:", JSON.stringify(p.slice(-2)))
