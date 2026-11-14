// Decode why a full IOC close reverts for accounts quotePerpClose calls fillable.
import { encodeFunctionData, parseAbi, toHex, decodeErrorResult } from "viem"
import * as SDK from "@somnia-chain/markets-sdk"
const RPC = "https://api.hideki2.infra.testnet.somnia.network"
const placeAbi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)"])
const rpc = async (m, p) => { const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p }) }).then(r => r.json()); if (r.error) throw new Error(JSON.stringify(r.error)); return r.result }
const [pool, from, isBid, price, qty, block] = process.argv.slice(2)
const data = encodeFunctionData({ abi: placeAbi, functionName: "placeOrder", args: [isBid === "true", 0n, BigInt(price), BigInt(qty), 18446744073709551615n, 2, 0, "0x0000000000000000000000000000000000000000", 0n] })
const t = await rpc("debug_traceCall", [{ from, to: pool, data, gas: toHex(60_000_000n) }, toHex(BigInt(block)), { tracer: "callTracer" }])
const deepest = (f) => { for (const c of f.calls ?? []) if (c.error) return deepest(c); return f }
const d = deepest(t)
let name = null; try { name = decodeErrorResult({ abi: SDK.contractErrorsAbi ?? [], data: d.output }).errorName } catch {}
console.log("top", t.error, (t.output ?? "").slice(0, 74), "| deepest to", d.to, d.error, (d.output ?? "").slice(0, 138), name ?? "", d.revertReason ?? "")
