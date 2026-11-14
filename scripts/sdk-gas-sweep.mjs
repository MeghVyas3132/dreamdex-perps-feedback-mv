// Gas used by a marketable perp order vs size, compared with SDK DEFAULT_GAS (10,000,000).
import { markets, pc, MB, POOLS } from "./sdk-common.mjs"
import { parseAbi, encodeFunctionData } from "viem"
const DEFAULT_GAS = 10_000_000n // dist/config.js DEFAULT_GAS (not exported from package root)
const abi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
console.log("SDK DEFAULT_GAS export:", DEFAULT_GAS?.toString())
const sym = process.argv[2] || "BTC", pool = POOLS[sym]
const acct = process.argv[3] || "0x0007d05ec7b3bd37d147f6fb7b4a3f04fc7db961"
const st = await markets.client.getPerpState(pool)
const [tick, minQ, lot] = await pc.readContract({ address: pool, abi: parseAbi(["function getOrderBookParameters() view returns (uint256,uint256,uint256)"]), functionName: "getOrderBookParameters" })
const isBid = process.argv[4] === "bid"
// IOC (orderType 1?) - use limit at mark -2% for sells / +2% for buys
const px = ((isBid ? st.markPrice * 102n : st.markPrice * 98n) / 100n / tick) * tick
const bn = await pc.getBlockNumber()
for (const mult of [1n, 10n, 50n, 100n, 300n, 1000n, 3000n]) {
  const q = minQ * mult
  const data = encodeFunctionData({ abi, functionName: "placeOrder", args: [isBid, 0n, px, q, 18446744073709551615n, 0, 0, "0x0000000000000000000000000000000000000000", 0n] })
  let used = "?"
  try { used = (await pc.estimateGas({ account: acct, to: pool, data, blockNumber: bn, gas: 200_000_000n })).toString() } catch (e) { used = "estimate-fail: " + (e.shortMessage||e.message).split("\n")[0] }
  let at10 = "OK"
  try { await pc.call({ account: acct, to: pool, data, gas: 10_000_000n, blockNumber: bn }) } catch (e) { at10 = "REVERT " + ((e.walk?.(x=>x.data)?.data) || "0x(no data)") }
  console.log(sym, isBid ? "BUY" : "SELL", "qty", q.toString(), "estGas", used, "| at 10M:", at10)
}
process.exit(0)
