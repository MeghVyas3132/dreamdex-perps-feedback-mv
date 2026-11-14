// Probe the indexer's GraphQL subscription endpoint (graphql-transport-ws and legacy graphql-ws subprotocols).
import WebSocket from "ws"
const URL = "wss://hideki-dev.smk.somnia.host/v1/graphql"
for (const proto of ["graphql-transport-ws", "graphql-ws"]) {
  await new Promise((res) => {
    const ws = new WebSocket(URL, proto); const t0 = Date.now(); let got = 0
    const log = (m) => console.log(new Date().toISOString(), proto, `+${Date.now()-t0}ms`, String(m).slice(0, 300))
    ws.on("open", () => { log("open"); ws.send(JSON.stringify({ type: "connection_init", payload: {} })) })
    ws.on("message", (d) => {
      const m = JSON.parse(d.toString()); log(d.toString())
      if (m.type === "connection_ack") ws.send(JSON.stringify(proto === "graphql-ws"
        ? { id: "1", type: "start", payload: { query: 'subscription { Market(where:{baseSymbol:{_eq:"BTC"}, marketType:{_eq:"PERP"}}){ lastPrice lastTradeAt markPrice } }' } }
        : { id: "1", type: "subscribe", payload: { query: 'subscription { Market(where:{baseSymbol:{_eq:"BTC"}, marketType:{_eq:"PERP"}}){ lastPrice lastTradeAt markPrice } }' } }))
      if (/next|data/.test(m.type) && ++got >= 3) ws.close()
    })
    ws.on("error", (e) => log("ERR " + e.message))
    ws.on("close", (c) => { log("close " + c); res() })
    setTimeout(() => ws.close(), 15000)
  })
}
process.exit(0)
