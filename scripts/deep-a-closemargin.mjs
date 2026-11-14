// Does a pure reduce (full close) of a long need margin? Probe one account at one block across limit prices.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { encodeFunctionData, parseAbi, toHex, decodeErrorResult } from "viem"
import * as SDK from "@somnia-chain/markets-sdk"
const RPC = "https://api.hideki2.infra.testnet.somnia.network"
const mk = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const C = mk.client, MB = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const placeAbi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
const rpc = async (m, p) => { const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p }) }).then(r => r.json()); if (r.error) throw new Error(JSON.stringify(r.error)); return r.result }
const ser = (o) => JSON.stringify(o, (k, v) => typeof v === "bigint" ? v.toString() : v)
async function sim(pool, from, isBid, price, qty, block, ot = 2) {
  const data = encodeFunctionData({ abi: placeAbi, functionName: "placeOrder", args: [isBid, 0n, price, qty, 18446744073709551615n, ot, 0, "0x0000000000000000000000000000000000000000", 0n] })
  const t = await rpc("debug_traceCall", [{ from, to: pool, data, gas: toHex(60_000_000n) }, toHex(block), { tracer: "callTracer" }])
  if (!t.error) return "OK"
  try { return decodeErrorResult({ abi: SDK.contractErrorsAbi, data: t.output }).errorName } catch { return "revert " + (t.output ?? "").slice(0, 10) }
}
const [sym, account] = process.argv.slice(2)
const m = (await C.listPerpMarkets({ baseSymbol: sym }))[0], pool = m.poolAddress
const block = BigInt(await rpc("eth_blockNumber", []))
const pos = await C.getPerpPosition({ marginBank: MB, account, pool })
const acct = await C.getMarginAccount(MB, account)
const q = await C.quotePerpClose({ pool, marginBank: MB, account })
console.log("block", block, "pos", ser(pos).slice(0, 400))
console.log("account", ser(acct).slice(0, 500))
console.log("quote", ser(q))
const book = await C.getSpotOrderBook(pool, { depth: 3, blockNumber: q.asOfBlock })
const isBid = q.isBid, best = BigInt((isBid ? book.asks : book.bids)[0].price), tick = BigInt(m.tickSize)
const prices = { best, "best±0.5%": isBid ? (best * 1005n / 1000n / tick) * tick : (best * 995n / 1000n / tick) * tick, "best±2%": isBid ? (best * 102n / 100n / tick) * tick : (best * 98n / 100n / tick) * tick, quoteLimit: q.limitPrice }
for (const [k, p] of Object.entries(prices)) console.log(k.padEnd(10), p.toString(), "full close IOC:", await sim(pool, account, isBid, p, q.quantity, q.asOfBlock), "| half:", await sim(pool, account, isBid, p, (q.quantity / 2n / q.lotSize) * q.lotSize, q.asOfBlock))
process.exit(0)
