import { markets, j, POOLS } from "./sdk-common.mjs"
const s = await markets.client.getPerpState(POOLS[process.argv[2]||"BTC"])
console.log(j(s))
process.exit(0)
