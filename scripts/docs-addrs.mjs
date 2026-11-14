import { createPublicClient, http, parseAbi } from "viem"
import fs from "fs"
const pc = createPublicClient({ transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const files = ["developers_perps-testnet.md","trading_common_link-a-bot.md","developers_dreambot.md","developers_dreambot_run-your-bot.md","developers_dreambot_strategies.md","developers_dreambot_dreamfly.md","trading_perps-testnet.md"]
const seen = new Map()
for (const f of files) { const t = fs.readFileSync("research/docs2/"+f,"utf8"); for (const m of t.matchAll(/0x[0-9a-fA-F]{40}/g)) if(!seen.has(m[0])) seen.set(m[0], f) }
// also testnet section of contract-addresses page
const ca = fs.readFileSync("research/docs2/developers_contracts_contract-addresses.md","utf8")
const tn = ca.split("### Testnet (Somnia Tokyo Testnet")[1].split("### Mainnet")[0]
for (const m of tn.matchAll(/0x[0-9a-fA-F]{40}/g)) seen.set(m[0], "contract-addresses#testnet")
const erc = parseAbi(["function symbol() view returns (string)","function decimals() view returns (uint8)"])
for (const [a,f] of seen) {
  const code = await pc.getCode({address:a}).catch(e=>"ERR")
  let extra=""
  try { extra = (await pc.readContract({address:a,abi:erc,functionName:"symbol"})) + "/" + (await pc.readContract({address:a,abi:erc,functionName:"decimals"})) } catch {}
  console.log(a, f, code && code!=="0x" ? `code ${(code.length-2)/2}B` : "NO CODE", extra)
}
