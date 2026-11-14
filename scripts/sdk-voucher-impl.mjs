// List VoucherDistributor implementation function selectors and resolve names via the public openchain signature DB.
import { pc } from "./sdk-common.mjs"
const impl = "0x9657f0fd53efc01cd108d93c835bb4b517732b43"
const code = (await pc.getCode({ address: impl })).slice(2)
const sels = new Set()
for (let i = 0; i < code.length; i += 2) {
  const op = parseInt(code.slice(i, i + 2), 16)
  if (op === 0x63) { sels.add("0x" + code.slice(i + 2, i + 10)); i += 8 }
  else if (op >= 0x60 && op <= 0x7f) i += (op - 0x5f) * 2
}
const list = [...sels]
const r = await fetch("https://api.openchain.xyz/signature-database/v1/lookup?filter=true&function=" + list.join(",")).then(r => r.json())
for (const s of list) { const n = r.result?.function?.[s]; console.log(s, n?.map(x => x.name).join(" | ") ?? "?") }
