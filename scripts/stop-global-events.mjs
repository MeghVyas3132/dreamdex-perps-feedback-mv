// Read the OperatorPermissionsRegistry's raw logs to find when GLOBAL placeOrderFor grants to
// perp stop registries were created (setOperatorApprovalGlobal), before/after SDK 0.33.0 (2026-11-09 15:28 UTC).
import { createPublicClient, http, keccak256, toHex } from "viem"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const REG = "0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a"
const head = await pc.getBlockNumber()
const topics = new Map()
const step = 200000n
const tx = "0x" // probe recent window first
for (let from = head - 2_000_000n; from < head; from += step) {
  const logs = await pc.getLogs({ address: REG, fromBlock: from, toBlock: from + step - 1n > head ? head : from + step - 1n }).catch((e) => { console.log("getLogs err", e.shortMessage); return [] })
  for (const l of logs) { const k = l.topics[0]; const v = topics.get(k) ?? { n: 0, last: 0n, sample: l }; v.n++; v.last = l.blockNumber; topics.set(k, v) }
}
for (const [k, v] of topics) console.log(k, "count", v.n, "lastBlock", v.last, "sampleTx", v.sample.transactionHash, "topics", v.sample.topics.length, "data", v.sample.data.slice(0, 200))
for (const s of ["OperatorApprovalSet(address,address,bytes4,bool)", "GlobalOperatorApprovalSet(address,address,bytes4,bool)", "OperatorApprovalGlobalSet(address,address,bytes4,bool)", "OperatorApprovedGlobal(address,address,bytes4,bool)", "GlobalApprovalSet(address,address,bytes4,bool)", "OperatorApprovalForPoolSet(address,address,address,bytes4,bool)", "PoolOperatorApprovalSet(address,address,address,bytes4,bool)", "OperatorApproval(address,address,address,bytes4,bool)", "OperatorApprovalUpdated(address,address,address,bytes4,bool)"]) console.log(keccak256(toHex(s)), s)
