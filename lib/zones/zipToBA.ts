import { zipToState } from "./zipToState";
import { STATE_TO_BA } from "./stateToBA";
import { type BACode } from "./balancingAuthorities";

export type ZipToBAFailure = "invalid" | "not-us" | "unsupported";

export type ZipToBAResult =
  | { ok: true; ba: BACode; state: string }
  | { ok: false; reason: ZipToBAFailure };

export function zipToBA(zip: string): ZipToBAResult {
  const stateRes = zipToState(zip);
  if (!stateRes.ok) return { ok: false, reason: stateRes.reason };
  const ba = STATE_TO_BA[stateRes.state];
  if (!ba) return { ok: false, reason: "unsupported" };
  return { ok: true, ba, state: stateRes.state };
}
