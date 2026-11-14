import { markets, j, MB, POOLS } from "./sdk-common.mjs"
const c = markets.client
const page = await c.getPerpPositionsPage({ pool: POOLS.BTC })
console.log("rows", page.rows?.length ?? page.positions?.length, Object.keys(page))
const rows = page.rows ?? page.positions ?? page.items
for (const r of rows.slice(0, 12)) console.log(j(r))
process.exit(0)
