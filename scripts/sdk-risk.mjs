// On-chain risk params per core market vs the docs market table.
import { markets, pc, j, MB, POOLS } from "./sdk-common.mjs"
const c = markets.client
for (const [s, pool] of Object.entries(POOLS)) {
  const r = await c.getPerpRiskParams(pool).catch(e => ({ err: e.message.split("\n")[0] }))
  const lev = await c.getPerpMaxLeverage?.({ pool, marginBank: MB }).catch(e => "err " + e.message.split("\n")[0])
  console.log(s, j(r), "maxLev", j(lev))
}
process.exit(0)
