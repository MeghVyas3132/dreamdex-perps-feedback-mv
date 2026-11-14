// Voucher accounts on a non-allowlisted market: does getMaxPerpOrderSize agree with a simulated placeOrder?
import { markets, pc, MB, POOLS, IDX, j } from "./sdk-common.mjs"
import { parseAbi, encodeFunctionData } from "viem"
const abi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)","function getOrderBookParameters() view returns (uint256,uint256,uint256)"])
const q = `{ MarginEvent(where:{kind:{_eq:"Credited"}}, order_by:{blockNumber:desc}, limit:40){ account amount blockNumber } }`
const r = await fetch(IDX, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: q }) }).then(r => r.json())
if (r.errors) { console.log(JSON.stringify(r.errors)); process.exit(0) }
const accts = [...new Set(r.data.MarginEvent.map(e => e.account))]
let shown = 0
for (const a of accts) {
  const v = await markets.client.getPerpVoucher(MB, a)
  if (!v || v.floor === 0n) continue
  for (const s of ["ZEC", "PUMP", "BTC"]) {
    const pool = POOLS[s]
    const [tick, minQ, lot] = await pc.readContract({ address: pool, abi, functionName: "getOrderBookParameters" })
    const st = await markets.client.getPerpState(pool)
    const px = (st.markPrice * 97n / 100n / tick) * tick
    const m = await markets.client.getMaxPerpOrderSize({ pool, marginBank: MB, account: a, isBid: true, price: px })
    const qty = m.maxQuantity >= minQ ? m.maxQuantity : minQ
    let sim; try { await pc.call({ account: a, to: pool, data: encodeFunctionData({ abi, functionName: "placeOrder", args: [true, 0n, px, qty, 18446744073709551615n, 0, 0, "0x0000000000000000000000000000000000000000", 0n] }), gas: 30_000_000n, blockNumber: m.asOfBlock }); sim = "OK" } catch (e) { sim = "REVERT " + (e.walk?.(x => x.data)?.data ?? "") }
    console.log(a.slice(0, 10), "floor", v.floor.toString(), s, "max", m.maxQuantity?.toString(), "placeable", m.placeable, "limitedBy", m.limitedBy, "| sim qty", qty.toString(), sim)
  }
  if (++shown >= 4) break
}
process.exit(0)
