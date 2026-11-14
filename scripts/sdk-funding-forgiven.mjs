// Do funding settlements with intervalsSettled > 1 accrue only one interval? (docs: "everything owed since the last time is settled at once")
import { IDX, POOLS } from "./sdk-common.mjs"
const q = `query($pool:String!){ FundingRateUpdate(where:{pool:{_eq:$pool}, intervalsSettled:{_gt:"1"}}, order_by:{blockNumber:desc}, limit:8){ pool fundingRate cumulativeFundingPerUnit indexPrice intervalsSettled intervalsAccrued fundingWindowSec fundingIntervalSec spanStart spanEnd timestamp blockNumber txHash } }`
for (const s of ["BTC","ETH","SOL"]) {
  const r = await fetch(IDX, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: q, variables: { pool: POOLS[s] } }) }).then(r => r.json())
  if (r.errors) { console.log(JSON.stringify(r.errors)); continue }
  for (const u of r.data.FundingRateUpdate) console.log(s, "settled", u.intervalsSettled, "accrued", u.intervalsAccrued, "span", u.spanStart, "->", u.spanEnd, "(", (Number(u.spanEnd)-Number(u.spanStart))/3600, "h )", "tx", u.txHash)
}
const cnt = `query($pool:String!){ a: FundingRateUpdate_aggregate(where:{pool:{_eq:$pool}}){aggregate{count sum{intervalsSettled intervalsAccrued}}} }`
for (const s of ["BTC","ETH"]) {
  const r = await fetch(IDX, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: cnt, variables: { pool: POOLS[s] } }) }).then(r => r.json())
  console.log(s, "totals", JSON.stringify(r.data ?? r.errors))
}
