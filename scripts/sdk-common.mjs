import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { createPublicClient, http } from "viem"
export const RPC = "https://api.hideki2.infra.testnet.somnia.network"
export const IDX = "https://hideki-dev.smk.somnia.host/v1/graphql"
export const ME = "0x66D14F79aC6B0Ceba708c12D7D7c84fB06C05934"
export const markets = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: IDX, addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
export const pc = createPublicClient({ chain: hidekiTestnet, transport: http(RPC) })
export const j = (o) => JSON.stringify(o, (k, v) => (typeof v === "bigint" ? v.toString() : v), 1)
export const MB = "0x478769e1177c0773c43a593dccc4ad15f15f1394"
export const POOLS = { BTC: "0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0", ETH: "0xd6cb1dd58580b84d76068ac21594219ce03aeddf", SOL: "0xb483ec1fb34996638677c20ab087b16f1896fa53", XRP: "0x7058579f3248559963f79adb937c6de9f953e060", NEAR: "0x1cd15ae8bff0fe0a7f49233be8b90734775ba454", ZEC: "0x2a73129f26917124bd2a47a9b355c395c537f050", PUMP: "0x76c981a52530cdf9497559140aafcd8cd16836e7", ADA: "0x34fa62909f77699a7a6278d992f72ff31c7a619d" }
