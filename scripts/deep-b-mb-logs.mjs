// Raw MarginBank logs over a recent block window: which events fire, and which the SDK ABI can't decode.
import { createPublicClient, http, decodeEventLog, toEventSelector } from "viem"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import * as SDK from "@somnia-chain/markets-sdk"
import fs from "node:fs"
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const MB = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const abi = SDK.marginBankEventsAbi ?? (await import("@somnia-chain/markets-sdk")).marginBankEventsAbi
const known = new Map(abi.filter(x => x.type === "event").map(e => [toEventSelector(e), e.name]))
const head = await pc.getBlockNumber()
const span = BigInt(process.argv[2] ?? 300000), step = BigInt(process.argv[3] ?? 10000)
const counts = {}, unknown = {}, rows = []
for (let from = head - span; from < head; from += step) {
  const to = from + step - 1n < head ? from + step - 1n : head
  let logs
  try { logs = await pc.getLogs({ address: MB, fromBlock: from, toBlock: to }) } catch (e) { console.log("getLogs err", from, e.shortMessage); continue }
  for (const l of logs) {
    const name = known.get(l.topics[0])
    if (!name) { unknown[l.topics[0]] = (unknown[l.topics[0]] ?? 0) + 1; continue }
    counts[name] = (counts[name] ?? 0) + 1
    try { const d = decodeEventLog({ abi, data: l.data, topics: l.topics }); rows.push({ name, block: l.blockNumber.toString(), li: l.logIndex, tx: l.transactionHash, args: JSON.parse(JSON.stringify(d.args, (k, v) => typeof v === "bigint" ? v.toString() : v)) }) } catch (e) { rows.push({ name, block: l.blockNumber.toString(), err: e.shortMessage }) }
  }
}
console.log("head", head, "span", span)
console.log("known event counts", counts)
console.log("UNDECODED topic0 counts", unknown)
fs.writeFileSync("research/deep-b-mb-logs.json", JSON.stringify({ head: head.toString(), span: span.toString(), rows }))
console.log("ABI event names:", [...new Set(known.values())].join(", "))
