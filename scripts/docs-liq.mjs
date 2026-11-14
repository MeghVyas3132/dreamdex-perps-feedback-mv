import { createPublicClient, http } from "viem"
import { liquidationEngineReadAbi as abi } from "../node_modules/@somnia-chain/markets-sdk/dist/readsAbi.js"
const pc = createPublicClient({ transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const address = "0xA66d3C24Ad4a389d863846905D8173e1017e9F4D"
for (const fn of ["getMarginBank","getBidderCount","getBidders","getLiquidationPenaltyBps","getMinLiquidationSpreadBps","getMaxLiquidationSpreadBps","getMaxLiquidationVolumePerBlock","getAdlRanker","getMaxAdlScanPerCall"]) {
  try { console.log(fn, String(await pc.readContract({ address, abi, functionName: fn }))) } catch (e) { console.log(fn, "ERR", (e.shortMessage||e.message).slice(0,100)) }
}
