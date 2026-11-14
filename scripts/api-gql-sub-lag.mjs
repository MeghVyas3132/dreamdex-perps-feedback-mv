// Run a 60s Market subscription for BTC-PERP and poll the same row over HTTP every 3s; report pushes vs polled changes.
import WebSocket from "ws"
const G = "https://hideki-dev.smk.somnia.host/v1/graphql", POOL = "0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0"
const Q = `{ Market_by_pk(id:"${POOL}"){ lastPrice lastTradeAt } }`
const ws = new WebSocket(G.replace("https", "wss"), "graphql-transport-ws"); const t0 = Date.now()
const log = (...a) => console.log(new Date().toISOString(), `+${((Date.now()-t0)/1000).toFixed(1)}s`, ...a)
ws.on("open", () => ws.send(JSON.stringify({ type: "connection_init" })))
ws.on("message", (d) => { const m = JSON.parse(d); if (m.type === "connection_ack") ws.send(JSON.stringify({ id: "1", type: "subscribe", payload: { query: "subscription " + Q } })); if (m.type === "next") log("PUSH", JSON.stringify(m.payload.data.Market_by_pk)) })
let last = ""
const iv = setInterval(async () => { const r = await (await fetch(G, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: Q }) })).json(); const s = JSON.stringify(r.data.Market_by_pk); if (s !== last) { log("POLL-CHANGED", s); last = s } }, 3000)
setTimeout(() => { clearInterval(iv); ws.close(); process.exit(0) }, 60000)
