// Is the empty revert at getMaxPerpOrderSize's ASK an out-of-gas under the SDK's DEFAULT_GAS (10M)?
import { markets, pc, j, MB, POOLS } from "./sdk-common.mjs"
import { parseAbi, encodeFunctionData } from "viem"
const abi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
const c = markets.client
const pool = POOLS.BTC
const acct = process.argv[2] || "0x0007d05ec7b3bd37d147f6fb7b4a3f04fc7db961"
const st = await c.getPerpState(pool)
const tick = 100000000000000000n
const price = (st.markPrice / tick) * tick
const m = await c.getMaxPerpOrderSize({ pool, marginBank: MB, account: acct, isBid: false, price })
console.log("mark", st.markPrice.toString(), "price", price.toString(), "max ask", m.maxQuantity.toString(), "block", m.asOfBlock.toString())
const data = encodeFunctionData({ abi, functionName: "placeOrder", args: [false, 0n, price, m.maxQuantity, 18446744073709551615n, 0, 0, "0x0000000000000000000000000000000000000000", 0n] })
for (const gas of [10_000_000n, 30_000_000n, 100_000_000n]) {
  try { const r = await pc.call({ account: acct, to: pool, data, gas, blockNumber: m.asOfBlock }); console.log("gas", gas.toString(), "OK", r.data?.slice(0, 140)) }
  catch (e) { console.log("gas", gas.toString(), "REVERT", (e.shortMessage||e.message).split("\n")[0], e.walk?.(x=>x.data)?.data ?? "") }
}
try { const r = await pc.call({ account: acct, to: pool, data, blockNumber: m.asOfBlock }); console.log("no gas param (what SDK revertErrorForReceipt replays with): OK -> SDK reports \"no revert data recoverable\"") } catch (e) { console.log("no gas param: REVERT", e.walk?.(x=>x.data)?.data) }
try { const est = await pc.estimateGas({ account: acct, to: pool, data, blockNumber: m.asOfBlock }); console.log("estimateGas", est.toString()) } catch (e) { console.log("estimateGas failed", (e.shortMessage||e.message).split("\n")[0]) }
// how deep is the bid side?
const ob = await c.getPerpOrderBook?.(pool).catch(()=>null)
process.exit(0)
