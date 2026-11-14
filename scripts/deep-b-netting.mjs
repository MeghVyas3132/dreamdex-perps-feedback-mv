// PERPS.md "Account equity for scoring" netting recipe, run on a real account between two pinned blocks.
// residual = (totalEquity(b) - totalEquity(a)) - (inflows - outflows)   == trading PnL; must be 0 if the account never traded.
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
const mk = new SomniaMarkets({ chain: hidekiTestnet, indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql", addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES })
const C = mk.client, MB = "0x478769E1177C0773c43A593DCCc4Ad15F15F1394"
const [acct, aS, bS] = process.argv.slice(2); const a = BigInt(aS), b = BigInt(bS)
const f = (x) => (Number(x) / 1e18).toFixed(6)
const eqA = await C.getAccountEquity(acct, { scope: "perps", marginBank: MB, blockNumber: a })
const eqB = await C.getAccountEquity(acct, { scope: "perps", marginBank: MB, blockNumber: b })
const r = { sinceBlock: a + 1n, toBlock: b }
const me = await C.getMarginEvents(acct, { ...r, kinds: ["Deposit", "Credited", "Withdraw", "CreditReclaimed"], limit: 1000 })
const pulls = await C.listPerpMarginPulls({ account: acct, ...r, limit: 1000 }).catch(e => { console.log("pulls err", e.message); return [] })
const mf = await C.listPerpMainFundingEvents({ account: acct, ...r, limit: 1000 }).catch(e => { console.log("mainfunding err", e.message); return [] })
let inflow = 0n, outflow = 0n
for (const e of me) (e.kind === "Deposit" || e.kind === "Credited") ? inflow += BigInt(e.amount) : outflow += BigInt(e.amount)
for (const p of pulls) inflow += BigInt(p.amount)
for (const m of mf) if (m.kind === "Returned") outflow += BigInt(m.amount ?? m.principal ?? 0)
const all = await C.getMarginEvents(acct, { ...r, limit: 1000 })
const kinds = {}; for (const e of all) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1
console.log(JSON.stringify({ acct, a: a.toString(), b: b.toString(), eqA: f(eqA.totalEquity), eqB: f(eqB.totalEquity), dEq: f(eqB.totalEquity - eqA.totalEquity), inflow: f(inflow), outflow: f(outflow), residual_tradingPnL: f(eqB.totalEquity - eqA.totalEquity - inflow + outflow), flowRows: me.length, pullRows: pulls.length, mainFundingRows: mf.length, allMarginEventKinds: kinds }))
if (process.argv[5] === "-v") { for (const e of all) console.log(e.blockNumber, e.logIndex, e.kind, f(e.amount), e.pool ?? "", e.txHash); for (const p of pulls) console.log("PULL", JSON.stringify(p)) }
process.exit(0)
