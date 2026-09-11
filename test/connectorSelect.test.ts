/**
 * Audio Connectors & Cable Selection Lab — truth suite (owner brief
 * 2026-09-11). Pins the honesty architecture: the roster resolves entirely
 * to VERIFIED ConnectorRecords with live images; the jobs matrix cannot
 * claim a signal the verified records don't carry; every scenario has one
 * correct cable and the full problem taxonomy is exercised; the tester's
 * continuity truths (including its honest LIMITS) hold; the assessment
 * draw honors composition and the safety-critical pass rule.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BENCH_GROUPS, CABLE_PARTS, FOUR_QUESTIONS, ROSTER } from '../src/screens/lab/connectorselect/data/roster.ts';
import { JOB_MATRIX } from '../src/screens/lab/connectorselect/data/jobs.ts';
import { SCENARIOS } from '../src/screens/lab/connectorselect/data/scenarios.ts';
import { CROSS_SECTIONS, MISCONCEPTIONS, SAFETY_RULES } from '../src/screens/lab/connectorselect/data/practice.ts';
import { ASSESSMENT_BANK, DRAW_MINIMUMS, DRAW_SIZE } from '../src/screens/lab/connectorselect/data/assessment.ts';
import {
  drawAssessment,
  evaluateChoice,
  scoreAssessment,
  validateSelectionData,
  type Rng,
} from '../src/screens/lab/connectorselect/engine/evaluate.ts';
import { CABLE_CONTACTS, FAULTS, lampFor } from '../src/screens/lab/connectorselect/engine/tester.ts';
import { getConnector } from '../src/screens/lab/cable/data/registry.ts';
import { CONNECTOR_SELECT_PAGE_COUNT, CONNECTOR_SELECT_UNITS } from '../src/screens/lab/connectorselect/units.ts';

/** Deterministic rng for reproducible draws. */
function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('data validation', () => {
  it('the whole data layer validates clean', () => {
    assert.deepEqual(validateSelectionData(), []);
  });

  it('roster is the brief’s first-release scope (analog 7, speaker 6, digital+MIDI 9)', () => {
    const sizes = Object.fromEntries(BENCH_GROUPS.map((g) => [g.id, g.ids.length]));
    assert.deepEqual(sizes, { analog: 7, speaker: 6, digital: 9 });
    assert.equal(ROSTER.length, 22);
    // Advanced families stay OUT of the first release (brief).
    for (const banned of ['tt_bantam', 'db25', 'euroblock', 'mini_xlr', 'opticalcon_style']) {
      assert.ok(!ROSTER.includes(banned as never), `${banned} must not ship in release one`);
    }
    // Power connectors are excluded as subjects (visual/conceptual separation).
    for (const id of ROSTER) {
      const cat = getConnector(id)!.category;
      assert.ok(cat !== 'power_mains' && cat !== 'power_dc', `${id} is a power connector`);
    }
  });

  it('station 1 teaches all 8 cable parts and all 4 questions', () => {
    assert.equal(CABLE_PARTS.length, 8);
    assert.equal(FOUR_QUESTIONS.length, 4);
  });

  it('MIDI rides the bench with an explicit not-audio flag', async () => {
    const { CARD_FLAGS } = await import('../src/screens/lab/connectorselect/data/roster.ts');
    assert.match(CARD_FLAGS.midi_din5 ?? '', /NOT AUDIO/);
    assert.ok(ROSTER.includes('midi_din5'));
  });
});

describe('jobs matrix (station 3)', () => {
  it('every entry has at least one true and one false job (choice is real)', () => {
    for (const entry of JOB_MATRIX) {
      assert.ok(entry.jobs.some((j) => j.can), `${entry.connector}: no true jobs`);
      assert.ok(entry.jobs.some((j) => !j.can), `${entry.connector}: no distractor jobs`);
    }
  });

  it('covers the brief’s eight connector rows', () => {
    assert.deepEqual(
      JOB_MATRIX.map((e) => e.connector),
      ['xlr3', 'trs_quarter', 'trs_35', 'rca', 'bnc', 'ethernet_8p8c', 'usb_c', 'hdmi'],
    );
  });
});

describe('scenarios (station 5)', () => {
  it('all 12 of the brief’s scenarios exist', () => {
    assert.equal(SCENARIOS.length, 12);
  });

  it('the four-question verdict maps each problem to the honest failing rows', () => {
    const s7 = SCENARIOS.find((s) => s.id === 's07_amp_passive')!;
    const damage = s7.choices.find((c) => c.verdict === 'speaker_into_input')!;
    const v = evaluateChoice(damage);
    assert.equal(v.safe, false);
    assert.equal(v.overall, false);
    const correct = evaluateChoice(s7.choices.find((c) => c.verdict === 'correct')!);
    assert.ok(correct.fit && correct.signal && correct.construction && correct.safe && correct.overall);
  });

  it('fits_but_verify is UNVERIFIED, not passed — and never overall-correct (the trap)', () => {
    const s1 = SCENARIOS.find((s) => s.id === 's01_dyn_mic')!;
    const trap = s1.choices.find((c) => c.verdict === 'fits_but_verify')!;
    const v = evaluateChoice(trap);
    assert.equal(v.fit, true);
    assert.equal(v.unverified, true); // UI renders rows 2–4 as amber "?"
    assert.equal(v.overall, false);
  });

  it('a stereo-into-balanced mismatch does NOT blame the construction (record: identical construction)', () => {
    const s4 = SCENARIOS.find((s) => s.id === 's04_stereo_keys')!;
    const c = s4.choices.find((x) => x.name.includes('ONE balanced input'))!;
    const v = evaluateChoice(c);
    assert.equal(v.signal, false);
    assert.equal(v.construction, true); // rowsOverride — the assignment, not the cable, is wrong
  });
});

describe('cable tester (station 6)', () => {
  const byId = new Map(FAULTS.map((f) => [f.id, f]));

  it('open conductor: straight paths pass except the broken one', () => {
    const f = byId.get('open_hot')!;
    assert.equal(lampFor(f, 0, 0, false, true), 'lit');
    assert.equal(lampFor(f, 1, 1, false, true), 'dark');
    assert.equal(lampFor(f, 2, 2, false, true), 'lit');
  });

  it('pins 2/3 reversed: everything passes, crossed', () => {
    const f = byId.get('pins_23_reversed')!;
    assert.equal(lampFor(f, 1, 2, false, true), 'lit');
    assert.equal(lampFor(f, 2, 1, false, true), 'lit');
    assert.equal(lampFor(f, 1, 1, false, true), 'dark');
  });

  it('tip-ring short: extra paths ON TOP of straight ones', () => {
    const f = byId.get('short_tip_ring')!;
    assert.equal(lampFor(f, 0, 0, false, true), 'lit');
    assert.equal(lampFor(f, 0, 1, false, true), 'lit');
    assert.equal(lampFor(f, 1, 0, false, true), 'lit');
    assert.equal(lampFor(f, 2, 0, false, true), 'dark');
  });

  it('left/right reversed on the RCA pair: channels arrive at each other’s position', () => {
    const f = byId.get('lr_reversed')!;
    assert.equal(CABLE_CONTACTS[f.kind].length, 4);
    assert.equal(lampFor(f, 0, 2, false, true), 'lit'); // L center → R center
    assert.equal(lampFor(f, 0, 0, false, true), 'dark');
  });

  it('intermittent passes at rest and flickers ONLY under wiggle', () => {
    const f = byId.get('intermittent')!;
    assert.equal(lampFor(f, 0, 0, false, true), 'lit');
    assert.equal(lampFor(f, 0, 0, true, true), 'flicker');
    assert.equal(lampFor(f, 1, 1, true, true), 'lit'); // other paths steady
  });

  it('not seated reads fully dead until reseated', () => {
    const f = byId.get('not_seated')!;
    assert.equal(lampFor(f, 0, 0, false, false), 'dark');
    assert.equal(lampFor(f, 0, 0, false, true), 'lit');
  });

  it('HONESTY: wrong cable TYPE passes every straight continuity check (the tester’s limit)', () => {
    const f = byId.get('wrong_type')!;
    for (let i = 0; i < 3; i++) assert.equal(lampFor(f, i, i, false, true), 'lit');
    // A TS plug's one long sleeve spans the ring AND sleeve positions of the
    // TRS fixture — cross-testing honestly shows them joined (cognition pass).
    assert.equal(lampFor(f, 1, 2, false, true), 'lit');
    assert.equal(lampFor(f, 2, 1, false, true), 'lit');
    // …and the verified record says exactly this about continuity testing.
    assert.match(getConnector('ts_quarter')!.basicTest, /cannot tell instrument cable from speaker cable/);
  });

  it('bent pin reads like an open — inspection is what disambiguates', () => {
    const bent = byId.get('bent_pin')!;
    const open = byId.get('open_hot')!;
    for (let i = 0; i < 3; i++) {
      assert.equal(lampFor(bent, i, i, false, true), lampFor(open, i, i, false, true));
    }
    assert.match(bent.inspect, /INSPECTION FINDS IT/);
  });
});

describe('safety & misconceptions', () => {
  it('all nine required safety rules present', () => {
    assert.equal(SAFETY_RULES.length, 9);
  });

  it('all nine misconception cards present — and every one is FALSE by contract', () => {
    assert.equal(MISCONCEPTIONS.length, 9);
    for (const m of MISCONCEPTIONS) assert.equal(m.answer, false);
  });

  it('station 4 compares all eight constructions', () => {
    assert.equal(CROSS_SECTIONS.length, 8);
  });
});

describe('final assessment', () => {
  it('draw honors size, composition minimums, uniqueness — and ALWAYS carries every safety-critical question', () => {
    const criticalIds = ASSESSMENT_BANK.filter((q) => q.critical).map((q) => q.id);
    assert.ok(criticalIds.length >= 2);
    for (let seed = 1; seed <= 60; seed++) {
      const paper = drawAssessment(seededRng(seed * 7919));
      assert.equal(paper.length, DRAW_SIZE);
      assert.equal(new Set(paper.map((q) => q.id)).size, DRAW_SIZE);
      for (const [kind, min] of Object.entries(DRAW_MINIMUMS)) {
        const n = paper.filter((q) => q.kind === kind).length;
        assert.ok(n >= (min ?? 0), `seed ${seed}: ${n} '${kind}' < ${min}`);
      }
      // Cognition-pass P2: without force-inclusion ~2.5% of draws carried NO
      // critical question, making the required-correct pass rule vacuous.
      const ids = new Set(paper.map((q) => q.id));
      for (const cid of criticalIds) assert.ok(ids.has(cid), `seed ${seed}: paper missing critical '${cid}'`);
    }
  });

  it('different seeds produce different papers (retries genuinely reshuffle)', () => {
    const a = drawAssessment(seededRng(1)).map((q) => q.id).join(',');
    const b = drawAssessment(seededRng(2)).map((q) => q.id).join(',');
    assert.notEqual(a, b);
  });

  it('80% passes only when every safety-critical answer is right', () => {
    const paper = drawAssessment(seededRng(7));
    const perfect = new Map(paper.map((q) => [q.id, q.correct]));
    assert.equal(scoreAssessment(paper, perfect).passed, true);

    // Miss exactly one critical question: ≥80% overall, still a fail.
    const critical = paper.find((q) => q.critical);
    assert.ok(critical, 'every drawn paper carries the critical questions (force-included by drawAssessment)');
    const oneMiss = new Map(perfect);
    oneMiss.set(critical!.id, (critical!.correct + 1) % critical!.options.length);
    const r = scoreAssessment(paper, oneMiss);
    assert.ok(r.pct >= 80);
    assert.equal(r.passed, false);
    assert.deepEqual(r.criticalMisses, [critical!.id]);

    // Miss three non-critical: below 80%, fail on score alone.
    const nonCritical = paper.filter((q) => !q.critical).slice(0, 3);
    const lowScore = new Map(perfect);
    for (const q of nonCritical) lowScore.set(q.id, (q.correct + 1) % q.options.length);
    const r2 = scoreAssessment(paper, lowScore);
    assert.equal(r2.pct < 80, true);
    assert.equal(r2.passed, false);
  });

  it('bank options never telegraph by length (correct ≤ 1.6× mean of distractors)', () => {
    for (const q of ASSESSMENT_BANK) {
      const others = q.options.filter((_, i) => i !== q.correct);
      const mean = others.reduce((s, o) => s + o.length, 0) / others.length;
      assert.ok(
        q.options[q.correct].length <= mean * 1.6,
        `${q.id}: correct option conspicuously longer (${q.options[q.correct].length} vs mean ${Math.round(mean)})`,
      );
    }
  });
});

describe('units bridge', () => {
  it('one unit per page, count matches', () => {
    assert.equal(CONNECTOR_SELECT_UNITS.length, CONNECTOR_SELECT_PAGE_COUNT);
    assert.equal(new Set(CONNECTOR_SELECT_UNITS).size, CONNECTOR_SELECT_PAGE_COUNT);
  });
});
