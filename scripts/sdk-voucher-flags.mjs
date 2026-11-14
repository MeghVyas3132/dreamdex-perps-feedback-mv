import { pc } from "./sdk-common.mjs"
import { toFunctionSelector } from "viem"
const d = "0x2ACD9EFdA721450906bfE1bef3edE269636E42C4"
const unknown = ["0xa794443f","0xed017daa","0x7da92893","0x61680ef5","0x6c87f4b2","0x07454f57","0x09205fee","0x3fc6234e","0x4d7187dc","0x06b7c759","0x13e2c81c","0x7856c5bf","0x703e46dd"]
const guesses = ["selfClaimEnabled()","selfClaimDisabled()","isSelfClaimEnabled()","selfClaimOpen()","setSelfClaimEnabled(bool)","setSelfClaim(bool)","claimFor(address)","grant(address)","grantTo(address)","claimOnBehalf(address)","setClaimer(address,bool)","isClaimer(address)","claimers(address)","setGranter(address,bool)","grantVoucher(address)","creditFor(address)","airdrop(address[])","batchGrant(address[])","grantMany(address[])","setSelfClaimDisabled(bool)","selfClaimAllowed()","setSelfClaimAllowed(bool)","distributor()","marginBank()","collateralToken()","SelfClaimDisabled()","SelfClaimToggled(bool)","grantTo(address,uint256)"]
const map = Object.fromEntries(guesses.map(g => [toFunctionSelector(g), g]))
for (const s of unknown) {
  let ret; try { ret = (await pc.call({ to: d, data: s })).data } catch (e) { ret = "revert " + (e.walk?.(x=>x.data)?.data ?? "") }
  console.log(s, map[s] ?? "?", "->", ret)
}
