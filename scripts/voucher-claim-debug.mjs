// Why does claimPerpVoucher revert while getPerpVoucherEligibility says eligible?
import { createPublicClient, http, parseAbi, decodeErrorResult, keccak256, toHex } from "viem"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import * as SDK from "@somnia-chain/markets-sdk"
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const me = process.argv[2] ?? "0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934"
const bank = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const granter = await pc.readContract({ address: bank, abi: parseAbi(["function getCreditGranter() view returns (address)"]), functionName: "getCreditGranter" })
console.log("bank.getCreditGranter():", granter, " docs VoucherDistributor: 0x2ACD9EFdA721450906bfE1bef3edE269636E42C4")
const cfgAbi = parseAbi(["function budgetRemaining() view returns (uint256)", "function isClaimed(address) view returns (bool)", "function owner() view returns (address)", "function paused() view returns (bool)"])
for (const fn of ["budgetRemaining", "owner", "paused"]) { try { console.log(fn, await pc.readContract({ address: granter, abi: cfgAbi, functionName: fn })) } catch (e) { console.log(fn, "n/a") } }
for (const sig of ["claim()", "claim(address)"]) {
  const data = keccak256(toHex(sig)).slice(0, 10) + (sig === "claim(address)" ? me.slice(2).toLowerCase().padStart(64, "0") : "")
  try { const r = await pc.call({ account: me, to: granter, data }); console.log(sig, "OK", r.data) }
  catch (e) { const raw = e?.cause?.data ?? e?.data ?? e?.walk?.((x) => x?.data)?.data; console.log(sig, "REVERT raw:", raw, "|", (e.shortMessage || e.message).split("\n")[0]) }
}
