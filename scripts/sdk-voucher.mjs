// Docs: "Any address can claim the 1,000 USDso perps credit once". Simulate the SDK-built claim from a fresh wallet.
import fs from "fs"
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { pc, MB, j } from "./sdk-common.mjs"
const env = Object.fromEntries(fs.readFileSync(".env","utf8").trim().split("\n").map(l=>l.split("=")))
const m = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES, privateKey: env.PRIVATE_KEY })
const me = m.walletAddress
console.log("eligibility", j(await m.client.getPerpVoucherEligibility(MB, me)))
const built = await m.trader.buildClaimPerpVoucher({ marginBank: MB })
console.log("built", j(built))
const call = built.call ?? built
try { const r = await pc.call({ account: me, to: call.to, data: call.data, gas: 3_000_000n }); console.log("sim OK", r.data) }
catch (e) { console.log("sim REVERT", e.walk?.(x=>x.data)?.data, (e.shortMessage||"").split("\n")[0]) }
process.exit(0)
