// Docs: hourly payment = size × INDEX price × rate / 8. Check the cumulative-funding delta of consecutive settlements.
import { IDX, POOLS } from "./sdk-common.mjs"
const q = `query($pool:String!){ FundingRateUpdate(where:{pool:{_eq:$pool}}, order_by:{blockNumber:desc}, limit:6){ fundingRate cumulativeFundingPerUnit indexPrice markPrice intervalsSettled intervalsAccrued fundingWindowSec fundingIntervalSec timestamp blockNumber txHash } }`
for (const s of ["BTC", "ETH", "XRP"]) {
  const r = (await fetch(IDX, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: q, variables: { pool: POOLS[s] } }) }).then(r => r.json())).data.FundingRateUpdate
  for (let i = 0; i < r.length - 1; i++) {
    const a = r[i + 1], b = r[i]
    const d = BigInt(b.cumulativeFundingPerUnit) - BigInt(a.cumulativeFundingPerUnit)
    const n = BigInt(b.fundingWindowSec / b.fundingIntervalSec)
    const acc = BigInt(b.intervalsAccrued)
    const viaIdxPrev = BigInt(a.indexPrice) * BigInt(a.fundingRate) * acc / n
    const viaIdxCur = BigInt(b.indexPrice) * BigInt(b.fundingRate) * acc / n
    const viaMarkCur = b.markPrice ? BigInt(b.markPrice) * BigInt(b.fundingRate) * acc / n : null
    console.log(s, "blk", b.blockNumber, "acc", b.intervalsAccrued, "delta", d.toString(), "| idx(prev)*rate(prev)/n", viaIdxPrev.toString(), "| idx(cur)*rate(cur)/n", viaIdxCur.toString(), "| mark(cur)*rate/n", viaMarkCur?.toString())
  }
}
