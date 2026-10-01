/**
 * Mastering Lab — the content (owner build order 2026-10-01).
 *
 *  • Every scenario's answer key is consistent: `correct` is one of its
 *    options, ids are unique, every module has decisions, the triage and
 *    tool banks use their fixed option sets.
 *  • NO hard-coded "the" loudness target (owner hard rule): wherever a LUFS,
 *    dBTP or format number appears in the copy it is marked as an EXAMPLE
 *    (or is a fact: Red Book, BS.1770, R128 / A/85 existing).
 *  • Monitoring copy protects hearing; mastering is never "just louder".
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  ALL_SCENARIOS, CONTROL_ITEMS, DESTINATIONS, KEY_TERMS, MASTERING_MODULES, PROJECT_CHECKS, PROJECT_QC, PROJECT_SEQUENCES, PROJECT_TRACKS,
  TOOL_GROUPS, TOOL_OPTIONS, TOOL_SCENARIOS, TRIAGE_OPTIONS, TRIAGE_SCENARIOS, scenariosForModule,
} from '../src/screens/lab/mastering/masteringContent.ts';

const ROOT = join(process.cwd(), 'src', 'screens', 'lab', 'mastering');

function allSource(): string {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) out.push(readFileSync(p, 'utf8'));
    }
  };
  walk(ROOT);
  return out.join('\n');
}

describe('answer keys', () => {
  it('every scenario names a correct option that exists, by value', () => {
    for (const s of ALL_SCENARIOS) {
      assert.ok(s.options.includes(s.correct), `${s.id}: "${s.correct}" is not one of its options`);
      assert.ok(s.options.length >= 3, `${s.id}: at least three options`);
      assert.equal(new Set(s.options).size, s.options.length, `${s.id}: duplicate options`);
      assert.ok(s.explain.length > 20, `${s.id}: an explanation is the teaching moment`);
    }
  });
  it('scenario ids are unique across the lab', () => {
    const ids = ALL_SCENARIOS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });
  it('every module has decisions to answer and every scenario belongs to a module', () => {
    for (const m of MASTERING_MODULES) assert.ok(scenariosForModule(m.id).length >= 4, `${m.id} has fewer than 4 decisions`);
    const moduleIds = new Set(MASTERING_MODULES.map((m) => m.id));
    for (const s of ALL_SCENARIOS) assert.ok(moduleIds.has(s.moduleId), `${s.id} → unknown module ${s.moduleId}`);
    assert.equal(MASTERING_MODULES.length, 8, 'eight chapters, eight modules');
    assert.deepEqual(MASTERING_MODULES.map((m) => m.num), [1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('the triage and tool banks use their fixed option sets, with every option used at least once as an answer', () => {
    for (const s of TRIAGE_SCENARIOS) assert.deepEqual([...s.options], [...TRIAGE_OPTIONS]);
    for (const o of TRIAGE_OPTIONS) assert.ok(TRIAGE_SCENARIOS.some((s) => s.correct === o), `triage never answers "${o}"`);
    for (const s of TOOL_SCENARIOS) assert.deepEqual([...s.options], [...TOOL_OPTIONS]);
    assert.ok(TOOL_SCENARIOS.some((s) => s.correct === 'Listen on another system first'), 'verification before processing is one of the answers');
  });
  it('the EP: every track has a decision, every sequence orders every track, the checklist has a key', () => {
    const ids = PROJECT_TRACKS.map((t) => t.id);
    for (const seq of PROJECT_SEQUENCES) assert.deepEqual([...seq.order].sort(), [...ids].sort(), `${seq.id} must order all tracks once`);
    assert.ok(PROJECT_CHECKS.some((c) => c.needed) && PROJECT_CHECKS.some((c) => !c.needed), 'the checklist key has needed and not-needed lines');
    assert.ok(PROJECT_QC.length >= 6);
    const vocalTrack = PROJECT_TRACKS.find((t) => t.id === 'p3')!;
    assert.equal(vocalTrack.issue.correct, 'Mix revision', 'a buried vocal in one section is a mix revision — the lab\'s foundation');
  });
  it('the control map covers every owner and every stage', () => {
    for (const o of ['mix', 'master', 'either'] as const) assert.ok(CONTROL_ITEMS.some((c) => c.owner === o));
    for (const st of ['tracks', 'bus', 'master', 'delivery'] as const) assert.ok(CONTROL_ITEMS.some((c) => c.stage === st));
    assert.equal(CONTROL_ITEMS.find((c) => c.id === 'vocalLevel')?.owner, 'mix');
    assert.equal(CONTROL_ITEMS.find((c) => c.id === 'format')?.owner, 'master');
  });
  it('tool groups: no "required chain" — the shelf is grouped by decision, analog is optional', () => {
    assert.ok(TOOL_GROUPS.every((g) => g.decision.length > 0));
    assert.match(TOOL_GROUPS.find((g) => g.id === 'analog')!.title, /optional/i);
    assert.ok(TOOL_GROUPS.find((g) => g.id === 'analog')!.items.some((i) => /neither/i.test(i)));
  });
  it('key terms exist for every module', () => {
    for (const m of MASTERING_MODULES) assert.ok((KEY_TERMS[m.id] ?? []).length >= 2, `${m.id} key terms`);
  });
});

describe('no hard-coded "the" loudness target', () => {
  const src = allSource();
  it('every numeric LUFS / dBTP / format figure in the copy is an EXAMPLE or a measured readout, never the rule', () => {
    // Prose sentences (string literals) that state a number as a target.
    const forbidden = [
      /target[^.\n]{0,40}-\d+\s*LUFS/i,
      /-\d+\s*LUFS[^.\n]{0,40}(target|standard|required|must)/i,
      /(always|must|should)\s+(be|master|deliver)[^.\n]{0,30}-\d+(\.\d+)?\s*(LUFS|dBTP)/i,
      /the (streaming|spotify|apple|youtube|cd|vinyl|broadcast) (target|standard) is\s*-?\d/i,
    ];
    for (const re of forbidden) assert.doesNotMatch(src, re, `a loudness number is stated as the rule: ${re}`);
  });
  it('every destination keeps its facts apart from its labelled examples, and asks to confirm the CURRENT spec', () => {
    for (const d of DESTINATIONS) {
      assert.ok(d.confirm.length >= 4, `${d.id}: a checklist`);
      for (const e of d.examples) assert.match(e, /EXAMPLE/, `${d.id}: an example line must say so: "${e}"`);
      assert.ok(d.confirm.some((c) => /current|confirm|approved|preferences|accepted|requested/i.test(c)), `${d.id}: confirm the current requirements`);
    }
    const cd = DESTINATIONS.find((d) => d.id === 'cd')!;
    assert.ok(cd.facts.some((f) => /16-bit, 44\.1 kHz/.test(f)), 'Red Book is stated as a fact');
    const bc = DESTINATIONS.find((d) => d.id === 'broadcast')!;
    assert.ok(bc.facts.some((f) => /R128/.test(f) && /A\/85/.test(f) && /BS\.1770/.test(f)));
  });
  it('the loudness module says the target depends on content and destination', () => {
    const l = scenariosForModule('loudness');
    assert.ok(l.some((s) => /depends on/i.test(s.prompt) && /content and the destination/i.test(s.correct)));
  });
});

describe('owner wording rules', () => {
  const src = allSource();
  it('mastering is never defined as making it louder; the lab says so', () => {
    assert.match(src, /not simply .making it louder/);
    assert.match(src, /Louder is not better/);
  });
  it('monitoring guidance protects hearing and mentions fatigue', () => {
    assert.match(src, /fatigue/i);
    assert.match(src, /hearing/i);
    assert.doesNotMatch(src, /turn (it )?up to hear/i);
    assert.doesNotMatch(src, /as loud as (you|possible)[^'"]{0,30}(best|better)/i);
  });
  it('no "free" / upsell copy in the lab (members never see it)', () => {
    assert.doesNotMatch(src, /\b(upgrade|free trial|unlock with|subscribe)\b/i);
  });
  it('matched-level listening is explained: the gain comes from the loudness estimates, attenuation only', () => {
    assert.match(src, /quietest/);
    assert.match(src, /attenuation only/i);
    assert.match(src, /LUFS/);
  });
});
