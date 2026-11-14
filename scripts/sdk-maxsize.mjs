// Compare getMaxPerpOrderSize against an eth_call simulation of PerpPool.placeOrder from the same account.
import { markets, pc, j, MB, POOLS } from "./sdk-common.mjs"
import { parseAbi, decodeErrorResult, BaseError } from "viem"
const c = markets.client
const abi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
async function sim(pool, from, isBid, price, qty, blockNumber) {
  try {
    const r = await pc.simulateContract({ address: pool, abi, functionName: "placeOrder", args: [isBid, 0n, price, qty, 18446744073709551615n, 0, 0, "0x0000000000000000000000000000000000000000", 0n], account: from, gas: 10_000_000n, blockNumber })
    return "OK " + j(r.result)
  } catch (e) { const m = (e.shortMessage || e.message).split("\n").slice(0,3).join(" | "); const sig = e.walk?.(x=>x.data)?.data; return "REVERT " + m + (sig? " data="+ (typeof sig==='string'?sig.slice(0,10):j(sig)):"") }
}
const sym = process.argv[2] || "BTC"
const pool = POOLS[sym]
const page = await c.getPerpPositionsPage({ pool })
const accts = page.items.slice(0, Number(process.argv[3] || 25)).map(r => r.account)
const st = await c.getPerpState(pool)
const mark = st.markPrice
console.log(sym, "mark", mark.toString())
const book = await pc.readContract({ address: pool, abi: parseAbi(["function getOrderBookParameters() view returns (uint256,uint256,uint256)"]), functionName: "getOrderBookParameters" })
const [tick, minQ, lot] = book
const priceArg = process.argv[4] ? BigInt(process.argv[4]) : mark
const priceT = (priceArg / tick) * tick
for (const a of accts) {
  const acct = await c.getMarginAccount(MB, a).catch(e => null)
  for (const isBid of [true, false]) {
    const m = await c.getMaxPerpOrderSize({ pool, marginBank: MB, account: a, isBid, price: priceT })
    if (!m.priceable) { console.log(a, "unpriceable"); continue }
    if (m.maxQuantity < minQ) continue
    const bn = m.asOfBlock
    const at = await sim(pool, a, isBid, priceT, m.maxQuantity, bn)
    const over = await sim(pool, a, isBid, priceT, m.maxQuantity + lot, bn)
    const flag = (!at.startsWith("OK") ? " <<< MAX REVERTS" : "") + (over.startsWith("OK") ? " <<< MAX+1LOT ALSO OK (understated)" : "")
    console.log(a.slice(0,10), isBid ? "BID" : "ASK", "pos", m.positionSize.toString(), "max", m.maxQuantity.toString(), "lim", m.limitedBy, "| at:", at.slice(0,90), "| +lot:", over.slice(0,110), flag)
  }
}
process.exit(0)
