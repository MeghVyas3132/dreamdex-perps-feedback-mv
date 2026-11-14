// WS probe 2: correct subscribe formats, order-id formats, documented example operations, close code.
import WebSocket from "ws"
const URL = process.env.WS_URL || "wss://stg.api.dreamdex.io/v0/ws/public"
const ws = new WebSocket(URL); const t0 = Date.now()
const log = (d, m) => console.log(`${new Date().toISOString()} +${Date.now()-t0}ms ${d} ${m}`.slice(0, 500))
const send = (m) => { const s = JSON.stringify(m); log(">>", s); ws.send(s) }
let n = 0
ws.on("message", (d) => { const s = d.toString(); if (/"update"|:update/.test(s) && n++ > 2) return; log("<<", s) })
ws.on("close", (c, r) => { log("CLOSE", `${c} ${r}`); process.exit(0) })
ws.on("open", async () => {
  const steps = [
    { operation: "subscribe", channel: "trades", params: { symbols: ["SOMI:USDso"] } },
    { operation: "subscribe", channel: "trades", params: { symbols: ["SOMI:USDso"] } },
    { operation: "unsubscribe", channel: "trades", params: { symbols: ["SOMI:USDso"] } },
    { operation: "unsubscribe", channel: "trades", params: { symbols: ["SOMI:USDso"] } },
    { operation: "subscribe", channel: "order", params: { symbol: "SOMI:USDso", orderId: "0xYourOrderId" } },
    { operation: "subscribe", channel: "order", params: { symbol: "SOMI:USDso", orderId: "0x1" } },
    { operation: "subscribe", channel: "order", params: { symbol: "SOMI:USDso", orderId: "123456789" } },
    { operation: "subscribe", channel: "order", params: { symbol: "SOMI:USDso", orderId: "01KC1F8N2NBP5GEYKE66CRJ34A" } },
    { id: 20, operation: "getMarketSymbolOrder", params: { symbol: "SOMI:USDso", id: "01KC1F8N2NBP5GEYKE66CRJ34A" } },
    { id: 21, operation: "prepareOrder", params: { symbol: "SOMI:USDso" }, payload: { type: "limit", side: "buy", price: "1.50", amount: "100", walletAddress: "0xaAaAaAaAaAbBbBbBbBbBcCcCcCcCcCcCdDdDdDdDdD" } },
  ]
  for (const s of steps) { send(s); await new Promise(r => setTimeout(r, 800)) }
  setTimeout(() => { log("CLIENT-CLOSE", "sending close 1000"); ws.close(1000, "bye") }, 1500)
})
