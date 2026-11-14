import { toFunctionSelector, toEventSelector } from "viem"
import fs from "fs"
const src = fs.readFileSync("node_modules/@somnia-chain/markets-sdk/src/contractErrorsAbi.ts","utf8")
const want = process.argv.slice(2)
// crude: parse `name: "X"` with inputs in error entries
const re = /type:\s*"error",\s*name:\s*"(\w+)",\s*inputs:\s*\[([^\]]*)\]/g
let m, found = {}
while ((m = re.exec(src))) { const types = [...m[2].matchAll(/type:\s*"([\w\[\]]+)"/g)].map(x=>x[1]); const sig = `${m[1]}(${types.join(",")})`; found[toFunctionSelector(sig)] = sig }
console.log("errors in SDK abi:", Object.keys(found).length)
for (const w of want) console.log(w, "->", found[w] ?? "NOT IN SDK ERROR ABI")
