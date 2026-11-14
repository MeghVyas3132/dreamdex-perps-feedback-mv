// Read-only WebSocket protocol probes against dreamDEX public feed (testnet staging by default).
import WebSocket from "ws"
const URL = process.env.WS_URL || "wss://stg.api.dreamdex.io/v0/ws/public"
const ws = new WebSocket(URL)
const t0 = Date.now()
const log = (dir, m) => console.log(`${new Date().toISOString()} +${Date.now()-t0}ms ${dir} ${typeof m==="string"?m:JSON.stringify(m)}`.slice(0, 600))
const send = (m) => { const s = typeof m === "string" ? m : JSON.stringify(m); log(">>", s); ws.send(s) }
ws.on("message", (d) => log("<<", d.toString()))
ws.on("close", (c, r) => { log("CLOSE", `${c} ${r}`); process.exit(0) })
ws.on("error", (e) => log("ERR", e.message))
ws.on("open", async () => {
  log("OPEN", URL)
  const steps = [
    { operation: "ping" },
    { id: 1, operation: "getMarkets" },
    { id: 2, operation: "GETMARKETS" },
    { id: 3, operation: "invalidOp" },
    "not json",
    { id: 4 },
    { id: 5, operation: "getMarketSymbolTickers", params: { symbol: "BTC-PERP" } },
    { id: 6, operation: "getMarketSymbolTickers" },
    { id: 7, operation: "getOrderbooks", params: { symbols: "BTC-PERP" } },
    { id: 8, operation: "subscribe", channel: "orderbook", params: { symbol: "BTC-PERP" } },
    { id: 9, operation: "subscribe", channel: "nope", params: { symbol: "SOMI:USDso" } },
    { id: 10, operation: "unsubscribe", channel: "trades", params: { symbol: "SOMI:USDso" } },
    { id: 11, operation: "subscribe", channel: "trades", params: { symbol: "SOMI:USDso" } },
    { id: 11, operation: "subscribe", channel: "trades", params: { symbol: "SOMI:USDso" } },
    { id: 12, operation: "unsubscribe", channel: "trades", params: { symbol: "SOMI:USDso" } },
    { id: "str", operation: "getCurrencies" },
    { id: -1, operation: "getCurrencies" },
    { id: 1e30, operation: "getCurrencies" },
    { id: 13, operation: "getMarketSymbolCandles", params: { symbol: "SOMI:USDso", interval: "7m" } },
  ]
  for (const s of steps) { send(s); await new Promise(r => setTimeout(r, 700)) }
  setTimeout(() => { log("DONE", ""); ws.close() }, 3000)
})
