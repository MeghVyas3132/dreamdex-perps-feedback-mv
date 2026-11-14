// exchange.amountToPrecision returns sizes that are not multiples of the pool's lotSize on markets whose lot > 1 unit.
import { markets, pc, j } from "./sdk-common.mjs"
import { parseAbi, parseUnits, encodeFunctionData } from "viem"
const abi = parseAbi(["function placeOrder(bool isBid,uint64 userData,uint256 price,uint256 quantity,uint64 expireTimestampNs,uint8 orderType,uint8 selfMatchingOption,address builder,uint96 builderFeeBpsTimes1k) payable returns (bool,uint128)", "function getOrderBookParameters() view returns (uint256,uint256,uint256)"])
await markets.loadMarkets()
const funded = process.argv[2] // optional funded trader
for (const [s, human] of [["PUMP/USDso:USDso", 1850], ["1000PEPE/USDso:USDso", 2750], ["BTC/USDso:USDso", 0.0013456]]) {
  const m = markets.markets[s]
  const pool = m.id ?? m.info?.poolAddress
  const [tick, minQ, lot] = await pc.readContract({ address: m.info?.poolAddress ?? pool, abi, functionName: "getOrderBookParameters" })
  const dec = m.info?.baseDecimals
  const amt = markets.amountToPrecision(s, human)
  const raw = parseUnits(String(amt), dec)
  console.log(s, "pool", m.info?.poolAddress, "baseDecimals", dec, "lotSize raw", lot.toString(), "=", Number(lot) / 10 ** dec, "units | precision.amount", m.precision.amount, "| amountToPrecision(", human, ") =", amt, "raw", raw.toString(), "raw % lot =", (raw % lot).toString())
  if (funded && raw % lot !== 0n) {
    const st = await markets.client.getPerpState(m.info.poolAddress)
    const px = (st.markPrice * 90n / 100n / tick) * tick
    for (const q of [raw, (raw / lot) * lot]) {
      try { await pc.call({ account: funded, to: m.info.poolAddress, data: encodeFunctionData({ abi, functionName: "placeOrder", args: [true, 0n, px, q, 18446744073709551615n, 0, 0, "0x0000000000000000000000000000000000000000", 0n] }), gas: 30_000_000n }); console.log("   sim qty", q.toString(), "OK") }
      catch (e) { console.log("   sim qty", q.toString(), "REVERT", e.walk?.(x => x.data)?.data ?? (e.shortMessage||"").split("\n")[0]) }
    }
  }
}
process.exit(0)
