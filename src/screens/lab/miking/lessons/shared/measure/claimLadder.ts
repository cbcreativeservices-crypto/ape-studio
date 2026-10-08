/**
 * THE CLAIM LADDER — an item type shared by F15 and F16 (BATCH6_RESEARCH_
 * SUMMARY_PART2.md §3.8; machinery_sound/ and scientific_arrays/
 * GEOMETRY_PROPOSAL.md §3). Built by Lab 6 group 5 (branch lab6-g5). Pure;
 * tested.
 *
 * A ladder of RUNGS, from the smallest claim a setup can carry to the
 * largest (F15: a creative perspective → a relative comparison → a
 * calibrated pressure at a stated position → a sound power under a named
 * method). Each SETUP reaches one rung — and supports every claim at or
 * below it. Each CLAIM needs one rung, or none of them (`needs: null`: no
 * setup on this ladder carries it alone — "the hottest pixel is the fault").
 * The learner judges, for the setup they hold, which claims it supports;
 * every judgement is answered with why. Nothing here measures anything.
 */

export type LadderRung = { id: string; label: string; short: string; needs: string };
export type LadderSetup = { id: string; label: string; short: string; blurb: string; reach: string };
export type LadderClaim = { id: string; text: string; short: string; needs: string | null; why: string };
export type ClaimLadder = { id: string; rungs: readonly LadderRung[]; setups: readonly LadderSetup[]; claims: readonly LadderClaim[] };

/** The rung's place on the ladder (0 = the lowest); −1 when unknown. */
export function rungIndex(l: ClaimLadder, id: string | null): number {
  return id === null ? -1 : l.rungs.findIndex((r) => r.id === id);
}

/** Does this setup support this claim? (A claim that needs no rung of this
 *  ladder — `needs: null` — is supported by none of its setups.) */
export function supports(l: ClaimLadder, setupId: string, claimId: string): boolean {
  const s = l.setups.find((q) => q.id === setupId);
  const c = l.claims.find((q) => q.id === claimId);
  if (!s || !c || c.needs === null) return false;
  return rungIndex(l, c.needs) <= rungIndex(l, s.reach);
}

export type Verdict = 'yes' | 'no';
/** A learner's verdicts for one setup: claim id → verdict. */
export type Verdicts = Readonly<Record<string, Verdict | undefined>>;

/** Grade one setup's verdicts: how many are right, and whether every claim is judged right. */
export function gradeLadder(l: ClaimLadder, setupId: string, v: Verdicts): { right: number; judged: number; done: boolean } {
  let right = 0;
  let judged = 0;
  for (const c of l.claims) {
    const pick = v[c.id];
    if (!pick) continue;
    judged++;
    if ((pick === 'yes') === supports(l, setupId, c.id)) right++;
  }
  return { right, judged, done: right === l.claims.length };
}

/** Problems with a ladder's DATA (the tests call it): unknown rungs, a
 *  ladder whose setups cannot tell its claims apart. [] = valid. */
export function validateLadder(l: ClaimLadder): string[] {
  const out: string[] = [];
  const rungs = new Set(l.rungs.map((r) => r.id));
  for (const s of l.setups) if (!rungs.has(s.reach)) out.push(`setup ${s.id}: rung ${s.reach} unknown`);
  for (const c of l.claims) {
    if (c.needs !== null && !rungs.has(c.needs)) out.push(`claim ${c.id}: rung ${c.needs} unknown`);
    if (c.why.trim().length < 20) out.push(`claim ${c.id}: no why`);
  }
  // Every rung is reached by some setup, and needed by some claim.
  for (const r of l.rungs) {
    if (!l.setups.some((s) => s.reach === r.id)) out.push(`rung ${r.id}: no setup reaches it`);
    if (!l.claims.some((c) => c.needs === r.id)) out.push(`rung ${r.id}: no claim needs it`);
  }
  return out;
}
