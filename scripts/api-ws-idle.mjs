// Open the public WS feed, send nothing, and record when/how the server closes it (docs: 60s idle, silent close).
import WebSocket from "ws"
const ws = new WebSocket(process.env.WS_URL || "wss://stg.api.dreamdex.io/v0/ws/public"); const t0 = Date.now()
const log = (...a) => console.log(new Date().toISOString(), `+${((Date.now()-t0)/1000).toFixed(1)}s`, ...a)
ws.on("open", () => log("open (idle, no messages sent)"))
ws.on("message", (d) => log("msg", d.toString().slice(0, 200)))
ws.on("close", (c, r) => { log("close code", c, "reason", JSON.stringify(r.toString())); process.exit(0) })
setTimeout(() => { log("still open at 150s"); process.exit(0) }, 150000)
