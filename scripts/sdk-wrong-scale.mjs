// Docs claim: 0.1 SOL scaled with 18 decimals -> owner placeOrder fails "ERC20: transfer amount exceeds balance". Check what actually comes back.
import { markets, pc, POOLS } from "./sdk-common.mjs"
import { parseAbi, encodeFunctionData, parseUnits } from "viem"
const abi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
const pool = POOLS.SOL
const page = await markets.client.getPerpPositionsPage({ pool })
const st = await markets.client.getPerpState(pool)
const tick = 10000000000000000n
const px = (st.markPrice * 95n / 100n / tick) * tick // resting bid 5% below mark
const counts = {}
for (const r of page.items.slice(0, 20)) {
  for (const [label, q] of [["0.1 SOL @9dec (correct)", parseUnits("0.1", 9)], ["0.1 SOL @18dec (wrong)", parseUnits("0.1", 18)]]) {
    let out
    try { await pc.call({ account: r.account, to: pool, data: encodeFunctionData({ abi, functionName: "placeOrder", args: [true, 0n, px, q, 18446744073709551615n, 0, 0, "0x0000000000000000000000000000000000000000", 0n] }), gas: 30_000_000n }); out = "OK" }
    catch (e) { const d = e.walk?.(x => x.data)?.data; out = d && d !== "0x" ? (d.startsWith("0x08c379a0") ? "Error(string): " + Buffer.from(d.slice(138), "hex").toString().replace(/\0/g, "") : d.slice(0, 10)) : (e.shortMessage || "").split("\n")[0] }
    const k = label + " => " + out; counts[k] = (counts[k] || 0) + 1
  }
}
console.log(counts)
process.exit(0)
