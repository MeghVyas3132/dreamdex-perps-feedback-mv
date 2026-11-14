// getPerpVoucherEligibility says eligible:true, but claim() reverts 0x3e31dcc2 (not in SDK's error ABI). Try several fresh addresses + campaign state + bytecode selector scan.
import { markets, pc, MB, j } from "./sdk-common.mjs"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
const camp = await markets.client.getPerpVoucherCampaign(MB)
console.log("campaign", j(camp), "now", Math.floor(Date.now()/1000))
for (let i = 0; i < 3; i++) {
  const a = privateKeyToAccount(generatePrivateKey()).address
  const el = await markets.client.getPerpVoucherEligibility(MB, a)
  let sim
  try { await pc.call({ account: a, to: camp.distributor, data: "0x4e71d92d", gas: 5_000_000n }); sim = "OK" } catch (e) { sim = "REVERT " + (e.walk?.(x => x.data)?.data ?? "") }
  console.log("fresh", a, "eligibility", j(el).replace(/\s+/g, ""), "claim() sim:", sim)
}
const code = await pc.getCode({ address: camp.distributor })
console.log("distributor code bytes", (code.length - 2) / 2, "contains 3e31dcc2:", code.includes("3e31dcc2"))
// is it a proxy?
const impl = await pc.getStorageAt({ address: camp.distributor, slot: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" })
console.log("EIP1967 impl slot", impl)
if (impl && BigInt(impl) !== 0n) { const ic = await pc.getCode({ address: "0x" + impl.slice(26) }); console.log("impl code bytes", (ic.length-2)/2, "contains 3e31dcc2:", ic.includes("3e31dcc2")) }
process.exit(0)
