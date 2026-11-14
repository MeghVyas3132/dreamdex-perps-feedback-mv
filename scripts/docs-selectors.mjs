import fs from "fs"
import { toFunctionSelector, toEventSelector } from "viem"
import * as E from "../node_modules/@somnia-chain/markets-sdk/dist/contractErrorsAbi.js"
import * as T from "../node_modules/@somnia-chain/markets-sdk/dist/tradeAbi.js"
import * as R from "../node_modules/@somnia-chain/markets-sdk/dist/readsAbi.js"
// canonical error sigs from SDK ABIs
const sig = (x) => `${x.name}(${(x.inputs||[]).map(i=>i.type.startsWith('tuple')?'('+i.components.map(c=>c.type).join(',')+')'+i.type.slice(5):i.type).join(',')})`
const errs = new Map()
for (const mod of [E,T,R]) for (const v of Object.values(mod)) if (Array.isArray(v)) for (const x of v) if (x.type==='error') { const s=sig(x); errs.set(x.name,(errs.get(x.name)||new Set()).add(s)) }
console.log("SDK error names:", errs.size)
const sel = (s)=> toFunctionSelector(s)
const bad=[]; let checked=0
for (const f of fs.readdirSync("research/docs2")) {
  const t = fs.readFileSync("research/docs2/"+f,"utf8")
  for (const line of t.split("\n")) {
    const sels = [...line.matchAll(/0x[0-9a-f]{8}\b(?![0-9a-fA-F])/g)].map(m=>m[0])
    if (!sels.length) continue
    const names = [...line.matchAll(/`([A-Z][A-Za-z0-9]+)(\([^`]*\))?`/g)]
    for (const n of names) {
      const name=n[1]; let cands=[]
      if (n[2]) cands.push(name+n[2].replace(/\s+\w+(?=[,)])/g,'').replace(/\s/g,''))
      for (const s of errs.get(name)||[]) cands.push(s)
      if (!n[2] && !errs.has(name)) cands.push(name+"()")
      const hashes = cands.map(sel)
      const hit = sels.some(s=>hashes.includes(s))
      checked++
      if (!hit && errs.has(name)) bad.push({f,name,docSel:sels.join(','),sdkSigs:[...errs.get(name)],sdkSel:[...errs.get(name)].map(sel), line:line.slice(0,200)})
      else if (!hit) bad.push({f,name,docSel:sels.join(','),noSdk:true,guess:hashes, line:line.slice(0,160)})
    }
  }
}
console.log("checked", checked)
for (const b of bad) console.log(JSON.stringify(b))
