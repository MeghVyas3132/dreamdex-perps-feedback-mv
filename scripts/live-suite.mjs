// Live perps test suite on Hideki testnet (chain 50383). Sends REAL testnet txs from the
// wallet in .env. Every step is logged to research/live-log.jsonl with tx hash / error.
// Usage: node scripts/live-suite.mjs [step ...]   (no args = all steps in order)
import fs from "node:fs"
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk"
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"
import { formatUnits, parseUnits } from "viem"

const env = Object.fromEntries(fs.readFileSync(new URL("../.env", import.meta.url), "utf8").trim().split("\n").map((l) => l.split("=")))
const markets = new SomniaMarkets({
  chain: hidekiTestnet,
  indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql",
  addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
  privateKey: env.PRIVATE_KEY,
})
const C = markets.client, T = markets.trader
const me = markets.walletAddress
const LOG = new URL("../research/live-log.jsonl", import.meta.url)
const ser = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === "bigint" ? v.toString() : k === "receipt" ? { status: v?.status, gasUsed: v?.gasUsed?.toString(), blockNumber: v?.blockNumber?.toString() } : v)))
const errInfo = (e) => ({ name: e?.constructor?.name, code: e?.code, errorName: e?.errorName ?? e?.revert?.name ?? e?.data?.errorName, message: String(e?.shortMessage ?? e?.message).slice(0, 600), hash: e?.hash ?? e?.txHash })
const log = (step, rec) => { const r = { t: new Date().toISOString(), step, ...ser(rec) }; fs.appendFileSync(LOG, JSON.stringify(r) + "\n"); console.log(JSON.stringify(r).slice(0, 1500)) }
async function run(step, fn) { try { log(step, { ok: true, result: await fn() }) } catch (e) { log(step, { ok: false, error: errInfo(e) }) } }

const all = await C.listPerpMarkets({ limit: 1000 })
const M = (s) => all.find((m) => m.baseSymbol === s)
const btc = M("BTC"), eth = M("ETH"), zec = M("ZEC")
const book = async (m) => C.getSpotOrderBook(m.poolAddress, { depth: 5 })
const tick = (m) => BigInt(m.tickSize)
const snap = (p, m, up) => { const t = tick(m); return up ? ((p + t - 1n) / t) * t : (p / t) * t }
const pos = async (m) => C.getPerpPosition({ marginBank: m.marginBank, account: me, pool: m.poolAddress })
const max = async (m, isBid, price) => C.getMaxPerpOrderSize({ pool: m.poolAddress, marginBank: m.marginBank, account: me, isBid, price })

const steps = {
  async balances() {
    await run("balances", async () => ({ me, stt: formatUnits(await C.getNativeBalance(me), 18), margin: await C.getMarginAccount(btc.marginBank, me), elig: await C.getPerpVoucherEligibility(btc.marginBank, me) }))
  },
  async voucher() {
    await run("claimPerpVoucher", () => T.claimPerpVoucher({ marginBank: btc.marginBank }))
    await run("claimPerpVoucher-again", () => T.claimPerpVoucher({ marginBank: btc.marginBank }))
    await run("margin-after-voucher", () => C.getMarginAccount(btc.marginBank, me))
  },
  async voucherRules() {
    const b = await book(zec)
    await run("zec-max-size(voucherBlocked?)", () => max(zec, true, BigInt(b.asks[0].price)))
    await run("zec-open-with-voucher", () => T.placePerpOrder({ pool: zec.poolAddress, isBid: true, price: BigInt(b.asks[0].price), quantity: BigInt(zec.minQuantity), orderType: 2 }))
    await run("setLeverage-with-voucher(docs: blocked)", () => T.setPerpLeverage({ pool: btc.poolAddress, leverageX: 5 }))
    await run("withdraw-voucher(docs: blocked)", () => T.withdrawMargin({ marginBank: btc.marginBank, amount: parseUnits("1", 18) }))
  },
  async restingAndCancel() {
    const b = await book(btc)
    const far = snap((BigInt(b.bids[0].price) * 90n) / 100n, btc, false)
    let id
    await run("btc-gtc-resting-bid", async () => { const r = await T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far, quantity: BigInt(btc.minQuantity) }); id = r.orderId; return r })
    await run("btc-open-order-chain", () => (id != null ? C.getOrderOnchain(btc.poolAddress, id) : null))
    await run("btc-cancel", () => T.cancelOrder({ pool: btc.poolAddress, orderId: id }))
    await run("btc-cancel-again", () => T.cancelOrder({ pool: btc.poolAddress, orderId: id }))
  },
  async invalidOrders() {
    const b = await book(btc)
    const far = snap((BigInt(b.bids[0].price) * 90n) / 100n, btc, false)
    await run("off-tick-price", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far + 1n, quantity: BigInt(btc.minQuantity) }))
    await run("off-lot-qty", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far, quantity: BigInt(btc.minQuantity) + 1n }))
    await run("below-min-qty", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far, quantity: BigInt(btc.minQuantity) - BigInt(btc.lotSize) }))
    await run("zero-qty", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far, quantity: 0n }))
    await run("ioc-no-fill", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far, quantity: BigInt(btc.minQuantity), orderType: 2 }))
    await run("fok-no-fill", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: far, quantity: BigInt(btc.minQuantity), orderType: 1 }))
    await run("postonly-crossing", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: BigInt(b.asks[0].price), quantity: BigInt(btc.minQuantity), orderType: 3 }))
    await run("too-big", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: BigInt(b.asks[0].price), quantity: BigInt(btc.minQuantity) * 100000n, orderType: 2 }))
  },
  async roundTrip() {
    let b = await book(btc)
    const q = BigInt(btc.minQuantity) * 2n
    const buyPx = snap((BigInt(b.asks[0].price) * 1005n) / 1000n, btc, true)
    await run("btc-max-before-open", () => max(btc, true, buyPx))
    await run("btc-ioc-open-long", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: buyPx, quantity: q, orderType: 2 }))
    await run("btc-position-chain", () => pos(btc))
    await run("btc-liq-price", () => C.getLiquidationPrice({ marginBank: btc.marginBank, pool: btc.poolAddress, account: me }))
    await run("btc-health", () => C.getAccountHealth(btc.marginBank, me))
    await run("btc-positions-indexer", () => C.listPerpPositions(me))
    b = await book(btc)
    const sellPx = snap((BigInt(b.bids[0].price) * 995n) / 1000n, btc, false)
    // close MORE than held to see whether a plain order flips the position (no reduce-only flag)
    await run("btc-ioc-close", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: false, price: sellPx, quantity: q, orderType: 2 }))
    await run("btc-position-after-close", () => pos(btc))
    await run("margin-after-roundtrip", () => C.getMarginAccount(btc.marginBank, me))
  },
  async shortRoundTrip() {
    let b = await book(eth)
    const q = BigInt(eth.minQuantity)
    await run("eth-ioc-open-short", () => T.placePerpOrder({ pool: eth.poolAddress, isBid: false, price: snap((BigInt(b.bids[0].price) * 995n) / 1000n, eth, false), quantity: q, orderType: 2 }))
    await run("eth-position-chain", () => pos(eth))
    await run("eth-positions-indexer", () => C.listPerpPositions(me))
    await run("eth-liq-price", () => C.getLiquidationPrice({ marginBank: eth.marginBank, pool: eth.poolAddress, account: me }))
  },
  async flip() {
    let b = await book(btc)
    const q = BigInt(btc.minQuantity)
    await run("btc-flip-open-long", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: snap((BigInt(b.asks[0].price) * 1005n) / 1000n, btc, true), quantity: q, orderType: 2 }))
    await run("btc-flip-pos-long", () => pos(btc))
    b = await book(btc)
    await run("btc-flip-sell-2x", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: false, price: snap((BigInt(b.bids[0].price) * 995n) / 1000n, btc, false), quantity: 2n * q, orderType: 2 }))
    await run("btc-flip-pos-after", () => pos(btc))
    b = await book(btc)
    await run("btc-flip-cleanup", () => T.placePerpOrder({ pool: btc.poolAddress, isBid: true, price: snap((BigInt(b.asks[0].price) * 1005n) / 1000n, btc, true), quantity: q, orderType: 2 }))
    await run("btc-flip-pos-final", () => pos(btc))
  },
  async stops() {
    const b = await book(eth)
    const p = await pos(eth)
    const tp = snap((BigInt(b.bids[0].price) * 90n) / 100n, eth, false)
    let res
    await run("eth-stop-tp", async () => (res = await T.placePerpStopOrder({ registry: eth.stopRegistry, pool: eth.poolAddress, isBid: true, quantity: BigInt(eth.minQuantity), triggerPrice: tp, triggerOperator: 1, stopOrderType: 0 })))
    await run("stt-after-stop", async () => formatUnits(await C.getNativeBalance(me), 18))
    const sid = res?.stopOrderId ?? res?.orderId
    if (sid != null) await run("eth-stop-cancel", () => T.cancelPerpStopOrder({ registry: eth.stopRegistry, pool: eth.poolAddress, stopOrderId: sid, orderId: sid }))
    await run("stt-after-cancel", async () => formatUnits(await C.getNativeBalance(me), 18))
    await run("eth-pos", () => p)
  },
}

const want = process.argv.slice(2)
for (const [k, f] of Object.entries(steps)) if (!want.length || want.includes(k)) await f()
process.exit(0)
