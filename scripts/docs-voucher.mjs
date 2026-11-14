import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { createPublicClient, http, parseAbi } from "viem"
const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const pc = createPublicClient({ chain: hidekiTestnet, transport: http("https://api.hideki2.infra.testnet.somnia.network") })
const bank = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const abi = parseAbi(["function isVoucherMarketAllowed(address) view returns (bool)","function isPerpPoolRegistered(address) view returns (bool)"])
const all = await markets.client.listPerpMarkets({ limit: 1000 })
const block = await pc.getBlockNumber()
console.log("block", block)
for (const m of all) {
  const a = await pc.readContract({address:bank,abi,functionName:"isVoucherMarketAllowed",args:[m.poolAddress],blockNumber:block})
  console.log(m.baseSymbol.padEnd(9), a, m.poolAddress)
}
// a random non-pool address
console.log("random addr", await pc.readContract({address:bank,abi,functionName:"isVoucherMarketAllowed",args:["0x000000000000000000000000000000000000dEaD"]}))
process.exit(0)
