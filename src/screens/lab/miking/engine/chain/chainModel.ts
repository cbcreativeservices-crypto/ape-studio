/**
 * THE CHAIN RACK — a Miking page type with no mic to drag (owner decision
 * D-6B-1, default yes; BATCH6_RESEARCH_SUMMARY_PART2.md §3.3). Built once by
 * Lab 6 group 4 (branch lab6-g4) for the measurement lessons (F11–F16) and
 * the broadcast chains (Lab 7); engine-level and generic: a lesson supplies
 * its chain as DATA. Pure; tested in node.
 *
 *   SLOTS     the links of a chain in signal order (capsule → preamp →
 *             power → input → analyzer; or a meter's settings; or a test
 *             signal's path). Each offers a few real PARTS.
 *   RULES     a join that is REFUSED, with its reason in plain words — a
 *             prepolarized capsule on a polarization supply, an externally
 *             polarized one on a constant-current input, either on bare 48 V
 *             phantom without the approved unit. A refusal is a teaching
 *             moment: it is shown, never silently "fixed".
 *   BRIEFS    a question the chain must answer, with the parts each slot may
 *             hold for it (several may pass) and why the others do not suit
 *             THIS question (a part can be safe and still the wrong tool).
 *
 * `checkChain` grades a set of picks against a brief: complete, refused (and
 * why), suits the brief (and why not). Nothing here touches a real device.
 */

export type ChainPart = {
  id: string;
  label: string;
  /** The dock button's value (a few characters). */
  short: string;
  /** One or two plain sentences: what it is, what picking it does. */
  blurb: string;
};
export type ChainSlot = { id: string; label: string; short: string; parts: readonly ChainPart[] };
/** A refused join: refused when EVERY pair in `all` is picked. `safety`
 *  marks a refusal that protects equipment or people (said in exact words). */
export type ChainRule = { id: string; all: readonly (readonly [slot: string, part: string])[]; reason: string; safety?: boolean };
/** A question the chain must answer. `ok[slot]` = the parts that suit it
 *  (absent = any part that is not refused); `why[part]` = why a part does not
 *  suit THIS question. `label`: the result's honest name once it passes. */
export type ChainBrief = { id: string; title: string; question: string; ok: Readonly<Record<string, readonly string[]>>; why: Readonly<Record<string, string>>; label: string };
export type ChainSpec = { id: string; slots: readonly ChainSlot[]; rules: readonly ChainRule[]; briefs: readonly ChainBrief[] };
export type ChainPicks = Readonly<Record<string, string | null>>;

export type ChainCheck = {
  /** Every slot holds a part. */
  complete: boolean;
  /** The refused joins among the picks. */
  refused: ChainRule[];
  /** Parts that are allowed but do not suit the brief, with why. */
  misfits: { slot: string; part: string; why: string }[];
  /** Complete, nothing refused, everything suits the brief. */
  pass: boolean;
};

/** Is this rule triggered by the picks? */
export function triggered(rule: ChainRule, picks: ChainPicks): boolean {
  return rule.all.every(([slot, part]) => picks[slot] === part);
}

export function checkChain(spec: ChainSpec, brief: ChainBrief, picks: ChainPicks): ChainCheck {
  const complete = spec.slots.every((s) => !!picks[s.id]);
  const refused = spec.rules.filter((r) => triggered(r, picks));
  const misfits: ChainCheck['misfits'] = [];
  for (const s of spec.slots) {
    const p = picks[s.id];
    if (!p) continue;
    const ok = brief.ok[s.id];
    // A refused part is answered by its refusal; it is not listed twice.
    if (refused.some((r) => r.all.some(([rs, rp]) => rs === s.id && rp === p))) continue;
    if (ok && !ok.includes(p)) misfits.push({ slot: s.id, part: p, why: brief.why[p] ?? 'It does not suit this question.' });
  }
  return { complete, refused, misfits, pass: complete && refused.length === 0 && misfits.length === 0 };
}

/** Problems with a chain's DATA (the tests and validate call it): unknown
 *  slots or parts in rules and briefs, a brief nothing can pass, a passing
 *  set a rule refuses. [] = valid. */
export function validateChain(spec: ChainSpec): string[] {
  const out: string[] = [];
  const slot = new Map(spec.slots.map((s) => [s.id, new Set(s.parts.map((p) => p.id))]));
  for (const r of spec.rules) {
    if (!r.reason.trim()) out.push(`rule ${r.id}: no reason`);
    for (const [s, p] of r.all) if (!slot.get(s)?.has(p)) out.push(`rule ${r.id}: ${s}/${p} unknown`);
  }
  for (const b of spec.briefs) {
    for (const [s, parts] of Object.entries(b.ok)) {
      if (!slot.has(s)) out.push(`brief ${b.id}: slot ${s} unknown`);
      for (const p of parts) if (!slot.get(s)?.has(p)) out.push(`brief ${b.id}: ${s}/${p} unknown`);
      for (const p of slot.get(s) ?? []) if (!parts.includes(p) && !b.why[p]) out.push(`brief ${b.id}: no reason why ${p} does not suit`);
    }
    // At least one chain must pass the brief.
    if (!passable(spec, b)) out.push(`brief ${b.id}: no chain passes it`);
  }
  return out;
}

/** Does any combination of suitable parts pass the brief? (Small: a few slots of a few parts.) */
export function passable(spec: ChainSpec, brief: ChainBrief): boolean {
  const options = spec.slots.map((s) => (brief.ok[s.id] ?? s.parts.map((p) => p.id)).filter((id) => s.parts.some((p) => p.id === id)));
  const walk = (i: number, picks: Record<string, string>): boolean => {
    if (i === spec.slots.length) return checkChain(spec, brief, picks).pass;
    for (const id of options[i]) if (walk(i + 1, { ...picks, [spec.slots[i].id]: id })) return true;
    return false;
  };
  return walk(0, {});
}
