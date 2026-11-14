// Does the pool cap a taker IOC at quotePerpClose's band edge? Simulate the close at the quote's
// limitPrice and at prices beyond the band, same block, and sum fills.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import * as SDK from "@somnia-chain/markets-sdk"
import { encodeFunctionData, parseAbi, decodeEventLog, toEventSelector, toHex, decodeErrorResult } from "viem"
const RPC = "https://api.hideki2.infra.testnet.somnia.network"
const mk = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const C = mk.client, MB = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const placeAbi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
const filledAbi = parseAbi(["event OrderFilled(uint128 indexed takerOrderId, uint128 indexed makerOrderId, uint256 quantityFilled, uint256 takerRemaining, uint256 makerRemaining, uint256 fillPrice)"]), T0 = toEventSelector(filledAbi[0])
const rpc = async (m, p) => { const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p }) }).then(r => r.json()); if (r.error) throw new Error(JSON.stringify(r.error)); return r.result }
const logsOf = (f, o = []) => { for (const l of f.logs ?? []) o.push(l); for (const c of f.calls ?? []) logsOf(c, o); return o }
async function sim(pool, from, isBid, price, qty, block) {
  const data = encodeFunctionData({ abi: placeAbi, functionName: "placeOrder", args: [isBid, 0n, price, qty, 18446744073709551615n, 2, 0, "0x0000000000000000000000000000000000000000", 0n] })
  const t = await rpc("debug_traceCall", [{ from, to: pool, data, gas: toHex(60_000_000n) }, toHex(block), { tracer: "callTracer", tracerConfig: { withLog: true } }])
  let filled = 0n, worst = null
  for (const l of logsOf(t)) if (l.address.toLowerCase() === pool.toLowerCase() && l.topics[0] === T0) { const d = decodeEventLog({ abi: filledAbi, data: l.data, topics: l.topics }); filled += d.args.quantityFilled; worst = d.args.fillPrice }
  let reason = null; if (t.error) { try { reason = decodeErrorResult({ abi: SDK.contractErrorsAbi, data: t.output }).errorName } catch { reason = (t.output ?? "").slice(0, 10) } }
  return { filled, worst, reason }
}
const [sym, account] = process.argv.slice(2)
const m = (await C.listPerpMarkets({ baseSymbol: sym }))[0], pool = m.poolAddress, tick = BigInt(m.tickSize)
const q = await C.quotePerpClose({ pool, marginBank: MB, account })
const ser = (o) => JSON.stringify(o, (k, v) => typeof v === "bigint" ? v.toString() : v)
console.log("quote", ser(q))
const steps = q.isBid ? [0n, 50n, 100n, 300n, 1000n] : [0n, 50n, 100n, 300n, 1000n]
for (const extra of steps) {
  const px = q.isBid ? ((q.limitPrice * (10000n + extra)) / 10000n / tick) * tick : ((q.limitPrice * (10000n - extra)) / 10000n / tick) * tick
  const r = await sim(pool, account, q.isBid, px, q.quantity, q.asOfBlock)
  console.log(`limit ${extra === 0n ? "= quote.limitPrice" : `beyond band by ${extra} bps`} px ${px} -> filled ${r.filled} of ${q.quantity} (quote said ${q.fillableSizeAtMaxBand} at max band) worstFill ${r.worst} revert ${r.reason ?? "-"}`)
}
process.exit(0)
