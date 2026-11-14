// quotePerpClose vs what the pool actually fills: for real accounts, quote a full close, then
// replay the matching IOC close with debug_traceCall (callTracer, withLog) at the quote's block
// and sum the pool's OrderFilled logs. Focus: accounts that also rest orders on the side a close
// trades against (self-match), and a control set without.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { decodeFunctionResult, encodeFunctionData, parseAbi, decodeEventLog, toEventSelector, toHex, decodeErrorResult } from "viem"
import * as SDK from "@somnia-chain/markets-sdk"
const RPC = "https://api.hideki2.infra.testnet.somnia.network"
const mk = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const C = mk.client
const MB = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const placeAbi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
const filledAbi = parseAbi(["event OrderFilled(uint128 indexed takerOrderId, uint128 indexed makerOrderId, uint256 quantityFilled, uint256 takerRemaining, uint256 makerRemaining, uint256 fillPrice)"])
const T0 = toEventSelector(filledAbi[0])
const capAbi = parseAbi(["function getReducingCapacity(address account) view returns ((int128 positionSize, uint256 pendingBidQuantity, uint256 pendingAskQuantity, uint256 pendingOppositeQuantity, uint256 effectiveReducingCapacity) capacity)"])
const STATS = { n: 0, mismatch: 0, reasons: {} }
async function rpc(method, params) { const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) }).then(r => r.json()); if (r.error) throw new Error(JSON.stringify(r.error)); return r.result }
function logsOf(frame, out = []) { for (const l of frame.logs ?? []) out.push(l); for (const c of frame.calls ?? []) logsOf(c, out); return out }
async function simulateClose(pool, from, isBid, price, quantity, block) {
  const data = encodeFunctionData({ abi: placeAbi, functionName: "placeOrder", args: [isBid, 0n, price, quantity, 18446744073709551615n, 2, 0, "0x0000000000000000000000000000000000000000", 0n] })
  const t = await rpc("debug_traceCall", [{ from, to: pool, data, gas: toHex(60_000_000n) }, toHex(block), { tracer: "callTracer", tracerConfig: { withLog: true } }])
  let filled = 0n, n = 0
  for (const l of logsOf(t)) if (l.address.toLowerCase() === pool.toLowerCase() && l.topics[0] === T0) { const d = decodeEventLog({ abi: filledAbi, data: l.data, topics: l.topics }); filled += d.args.quantityFilled; n++ }
  let reason = null; if (t.error) { try { reason = decodeErrorResult({ abi: SDK.contractErrorsAbi, data: t.output }).errorName } catch { reason = (t.output ?? "").slice(0, 10) } }
  return { filled, fills: n, error: t.error ?? null, revertReason: reason, gasUsed: BigInt(t.gasUsed) }
}
const syms = process.argv.slice(2).length ? process.argv.slice(2) : ["BTC", "ETH", "SOL", "HYPE", "XRP"]
const all = await C.listPerpMarkets({ limit: 1000 })
for (const s of syms) {
  const m = all.find(x => x.baseSymbol === s); const pool = m.poolAddress
  const block = await C.getNativeBalance ? BigInt(await rpc("eth_blockNumber", [])) : 0n
  const owners = new Map()
  for (const isBid of [true, false]) { let cursor; for (let i = 0; i < 6; i++) { const r = await C.getAllOpenOrdersOnchain(pool, { isBid, maxCount: 200, cursor, blockNumber: block }); for (const o of r.orders) { const k = o.owner.toLowerCase(); const e = owners.get(k) ?? { bids: 0n, asks: 0n }; if (isBid) e.bids += o.quantityRemaining; else e.asks += o.quantityRemaining; owners.set(k, e) } if (!r.hasMore) break; cursor = r.nextCursor } }
  let shown = 0
  for (const [owner, o] of owners) {
    const pos = await C.getPerpPosition({ marginBank: MB, account: owner, pool })
    const size = BigInt(pos.size ?? pos.position?.size ?? 0)
    if (size === 0n) continue
    const ownOpp = size > 0n ? o.bids : o.asks   // close of a long sells into bids
    const q = await C.quotePerpClose({ pool, marginBank: MB, account: owner })
    if (!q.priceable || q.quantity === 0n || q.limitPrice == null) continue
    const sim = await simulateClose(pool, owner, q.isBid, q.limitPrice, q.quantity, q.asOfBlock)
    const cap = await rpc("eth_call", [{ to: pool, data: encodeFunctionData({ abi: capAbi, functionName: "getReducingCapacity", args: [owner] }) }, toHex(q.asOfBlock)])
    const capD = decodeFunctionResult({ abi: capAbi, functionName: "getReducingCapacity", data: cap })
    const effCap = capD.effectiveReducingCapacity
    STATS.n++; if (sim.filled !== q.fillableSize) { STATS.mismatch++; STATS.reasons[sim.revertReason ?? "partial"] = (STATS.reasons[sim.revertReason ?? "partial"] ?? 0) + 1 }
    const tag = ownOpp > 0n ? "OWN-OPPOSITE" : "control"
    console.log(s, tag, owner, "block", q.asOfBlock.toString(), "size", size.toString(), "ownOppQty", ownOpp.toString(), "| quote fillable", q.fillableSize.toString(), "of", q.quantity.toString(), "limit", q.limitPrice.toString(), "| chain filled", sim.filled.toString(), "fills", sim.fills, "effReduceCap", effCap.toString(), "revert", sim.revertReason ?? "-", sim.filled !== q.fillableSize ? "  <<< MISMATCH" : "")
    if (++shown >= 12) break
  }
}
console.log("SUMMARY", JSON.stringify(STATS))
process.exit(0)
