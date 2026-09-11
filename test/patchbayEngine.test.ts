/**
 * Patchbay Signal Flow & Normalling — engine truth table.
 *
 * Pins EVERY cell of the configuration × insertion matrix (spec §12's
 * comparison table, plus the half-normalled-TOP variant from §22), the derived
 * teaching facts (four-questions answers, splits, merges, dead-ends), the
 * X-ray contact model, and the detective-mode deducer. If a copy edit ever
 * disagrees with the electronics, this file is the one that argues back.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMON_HALF_BREAK,
  CONTACT_OPEN_AT,
  consistentConfigs,
  contactsOpen,
  resolvePair,
  type PairFlow,
  type PairState,
} from '../src/screens/lab/patchbay/engine/patchbay.ts';

const flow = (s: PairState) => resolvePair(s);
const pick = (f: PairFlow) => ({
  normalActive: f.normalActive,
  normalBroken: f.normalBroken,
  destinationHears: f.destinationHears,
  sourceReaches: f.sourceReaches,
  isSplit: f.isSplit,
  isMerge: f.isMerge,
});

describe('thru — no internal vertical connection (spec §4)', () => {
  it('nothing patched: signal dead-ends; destination hears nothing', () => {
    assert.deepEqual(pick(flow({ config: 'thru', topPlugged: false, bottomPlugged: false })), {
      normalActive: false, normalBroken: false, destinationHears: 'nothing', sourceReaches: [], isSplit: false, isMerge: false,
    });
  });
  it('top patched: source goes only into the cord', () => {
    assert.deepEqual(pick(flow({ config: 'thru', topPlugged: true, bottomPlugged: false })), {
      normalActive: false, normalBroken: false, destinationHears: 'nothing', sourceReaches: ['patch'], isSplit: false, isMerge: false,
    });
  });
  it('bottom patched: destination receives the cord', () => {
    assert.deepEqual(pick(flow({ config: 'thru', topPlugged: false, bottomPlugged: true })), {
      normalActive: false, normalBroken: false, destinationHears: 'patch', sourceReaches: [], isSplit: false, isMerge: false,
    });
  });
  it('both patched: two independent connections, still no vertical path', () => {
    assert.deepEqual(pick(flow({ config: 'thru', topPlugged: true, bottomPlugged: true })), {
      normalActive: false, normalBroken: false, destinationHears: 'patch', sourceReaches: ['patch'], isSplit: false, isMerge: false,
    });
  });
  it('a thru pair never reports a broken normal — there was nothing to break', () => {
    for (const topPlugged of [false, true]) for (const bottomPlugged of [false, true]) {
      const f = flow({ config: 'thru', topPlugged, bottomPlugged });
      assert.equal(f.hasNormal, false);
      assert.equal(f.normalBroken, false);
    }
  });
});

describe('full-normal — either insertion breaks the normal (spec §7)', () => {
  it('A · nothing patched: NO PATCH CORD REQUIRED — source reaches destination', () => {
    assert.deepEqual(pick(flow({ config: 'full', topPlugged: false, bottomPlugged: false })), {
      normalActive: true, normalBroken: false, destinationHears: 'normal', sourceReaches: ['destination'], isSplit: false, isMerge: false,
    });
  });
  it('B · top patched: normal breaks; destination goes silent; source rides the cord', () => {
    assert.deepEqual(pick(flow({ config: 'full', topPlugged: true, bottomPlugged: false })), {
      normalActive: false, normalBroken: true, destinationHears: 'nothing', sourceReaches: ['patch'], isSplit: false, isMerge: false,
    });
  });
  it('C · bottom patched: alternate source replaces the normal source; original dead-ends', () => {
    assert.deepEqual(pick(flow({ config: 'full', topPlugged: false, bottomPlugged: true })), {
      normalActive: false, normalBroken: true, destinationHears: 'patch', sourceReaches: [], isSplit: false, isMerge: false,
    });
  });
  it('D · both patched: the pair stops behaving as a pair — two independent reroutes', () => {
    assert.deepEqual(pick(flow({ config: 'full', topPlugged: true, bottomPlugged: true })), {
      normalActive: false, normalBroken: true, destinationHears: 'patch', sourceReaches: ['patch'], isSplit: false, isMerge: false,
    });
  });
  it('a full-normal pair can NEVER split the source (spec §12 row 4)', () => {
    for (const topPlugged of [false, true]) for (const bottomPlugged of [false, true]) {
      assert.equal(flow({ config: 'full', topPlugged, bottomPlugged }).isSplit, false);
    }
  });
});

describe('half-normal, common bottom-break bay (spec §8–§11)', () => {
  const half = (topPlugged: boolean, bottomPlugged: boolean) =>
    flow({ config: 'half', breakSide: 'bottom', topPlugged, bottomPlugged });

  it('nothing patched: identical to full-normal at rest — that IS the setup of §8', () => {
    assert.deepEqual(pick(half(false, false)), pick(flow({ config: 'full', topPlugged: false, bottomPlugged: false })));
  });
  it('top patched: THE key moment — normal does NOT break; source splits to both', () => {
    assert.deepEqual(pick(half(true, false)), {
      normalActive: true, normalBroken: false, destinationHears: 'normal',
      sourceReaches: ['destination', 'patch'], isSplit: true, isMerge: false,
    });
  });
  it('bottom patched: normal breaks; alternate source replaces the original (§11)', () => {
    assert.deepEqual(pick(half(false, true)), {
      normalActive: false, normalBroken: true, destinationHears: 'patch', sourceReaches: [], isSplit: false, isMerge: false,
    });
  });
  it('both patched: top still taps the source; bottom feeds the destination', () => {
    assert.deepEqual(pick(half(true, true)), {
      normalActive: false, normalBroken: true, destinationHears: 'patch', sourceReaches: ['patch'], isSplit: false, isMerge: false,
    });
  });
  it('breakSide defaults to the common bay (bottom)', () => {
    assert.equal(COMMON_HALF_BREAK, 'bottom');
    assert.deepEqual(
      pick(flow({ config: 'half', topPlugged: true, bottomPlugged: false })),
      pick(half(true, false)),
    );
  });
});

describe('half-normal TOP-break variant — §22: directional, verify the bay', () => {
  const halfTop = (topPlugged: boolean, bottomPlugged: boolean) =>
    flow({ config: 'half', breakSide: 'top', topPlugged, bottomPlugged });

  it('top patched breaks the normal on this bay', () => {
    assert.deepEqual(pick(halfTop(true, false)), {
      normalActive: false, normalBroken: true, destinationHears: 'nothing', sourceReaches: ['patch'], isSplit: false, isMerge: false,
    });
  });
  it('bottom patched does NOT break — the destination receives normal + patch in parallel', () => {
    const f = halfTop(false, true);
    assert.equal(f.normalActive, true);
    assert.equal(f.destinationHears, 'both');
    assert.equal(f.isMerge, true);
  });
  it('a parallel merge is ONLY possible on the top-break variant', () => {
    const states: PairState[] = [];
    for (const config of ['full', 'thru'] as const)
      for (const topPlugged of [false, true]) for (const bottomPlugged of [false, true])
        states.push({ config, topPlugged, bottomPlugged });
    for (const topPlugged of [false, true]) for (const bottomPlugged of [false, true])
      states.push({ config: 'half', breakSide: 'bottom', topPlugged, bottomPlugged });
    for (const s of states) assert.equal(flow(s).isMerge, false, JSON.stringify(s));
  });
});

describe('invariants across the whole matrix', () => {
  const every: PairState[] = [];
  for (const config of ['full', 'half', 'thru'] as const)
    for (const breakSide of config === 'half' ? (['bottom', 'top'] as const) : [undefined])
      for (const topPlugged of [false, true])
        for (const bottomPlugged of [false, true])
          every.push({ config, breakSide, topPlugged, bottomPlugged });

  it('the destination hears nothing IFF no path reaches it', () => {
    for (const s of every) {
      const f = flow(s);
      const fed = f.normalActive || f.bottomFeedsDestination;
      assert.equal(f.destinationHears === 'nothing', !fed, JSON.stringify(s));
    }
  });
  it('the top front jack carries the source IFF a cord is in it', () => {
    for (const s of every) assert.equal(flow(s).topFeedsPatch, s.topPlugged, JSON.stringify(s));
  });
  it('normalBroken and normalActive are mutually exclusive, and only normalled bays break', () => {
    for (const s of every) {
      const f = flow(s);
      assert.equal(f.normalBroken && f.normalActive, false, JSON.stringify(s));
      if (f.normalBroken) assert.equal(f.hasNormal, true, JSON.stringify(s));
    }
  });
  it('a split is exactly "the source reaches two places"', () => {
    for (const s of every) {
      const f = flow(s);
      assert.equal(f.isSplit, f.sourceReaches.length >= 2, JSON.stringify(s));
    }
  });
  it('§12 row: "default connection exists?" — full & half yes, thru no', () => {
    assert.equal(flow({ config: 'full', topPlugged: false, bottomPlugged: false }).hasNormal, true);
    assert.equal(flow({ config: 'half', topPlugged: false, bottomPlugged: false }).hasNormal, true);
    assert.equal(flow({ config: 'thru', topPlugged: false, bottomPlugged: false }).hasNormal, false);
  });
  it('§12 row: "can tap the source without interrupting?" — only half (common bay)', () => {
    assert.equal(flow({ config: 'half', breakSide: 'bottom', topPlugged: true, bottomPlugged: false }).isSplit, true);
    assert.equal(flow({ config: 'full', topPlugged: true, bottomPlugged: false }).isSplit, false);
    assert.equal(flow({ config: 'thru', topPlugged: true, bottomPlugged: false }).isSplit, false);
  });
});

describe('X-ray insertion model (conceptual — spec §21)', () => {
  it('contacts stay closed before the teaching threshold and open at/after it', () => {
    assert.equal(contactsOpen(0), false);
    assert.equal(contactsOpen(CONTACT_OPEN_AT - 0.01), false);
    assert.equal(contactsOpen(CONTACT_OPEN_AT), true);
    assert.equal(contactsOpen(1), true);
  });
});

describe('authored scenarios are engine-true (the copy cannot rot)', () => {
  it('every predict scenario’s expected facts hold after its action', async () => {
    const { PREDICT_SCENARIOS, afterAction } = await import('../src/screens/lab/patchbay/engine/scenarios.ts');
    for (const s of PREDICT_SCENARIOS) {
      const f = resolvePair(afterAction(s)) as unknown as Record<string, unknown>;
      for (const [k, v] of Object.entries(s.expected)) assert.deepEqual(f[k], v, `${s.id} → ${k}`);
      assert.ok(s.correct >= 0 && s.correct < s.options.length, s.id);
      assert.equal(s.wrong[s.correct], undefined, `${s.id}: the correct option must not carry wrong-answer feedback`);
      assert.equal(s.wrong.length, s.options.length, `${s.id}: one feedback slot per option`);
    }
  });
  it('every detective case narrows to exactly its intended answer', async () => {
    const { DETECTIVE_CASES } = await import('../src/screens/lab/patchbay/engine/scenarios.ts');
    for (const c of DETECTIVE_CASES) {
      assert.deepEqual(consistentConfigs(c.probes.map((p) => p.test)), [c.answer], c.id);
    }
  });
  it('detective wrong-feedback never leaks: one slot per accusation, silent at the answer', async () => {
    const { DETECTIVE_CASES } = await import('../src/screens/lab/patchbay/engine/scenarios.ts');
    const ORDER = ['full', 'half', 'thru'] as const; // KIND_OPTIONS order in PageDetective
    for (const c of DETECTIVE_CASES) {
      assert.equal(c.wrong.length, ORDER.length, c.id);
      const answerIdx = ORDER.indexOf(c.answer);
      assert.equal(c.wrong[answerIdx], undefined, `${c.id}: the correct verdict must not carry wrong-feedback`);
      ORDER.forEach((kind, i) => {
        if (i === answerIdx) return;
        assert.ok(c.wrong[i], `${c.id}: accusation "${kind}" needs probe-citing feedback (else the shared check would print the answer)`);
      });
    }
  });
});

describe('Phase B data is engine-true and leak-proof', () => {
  const checkMcq = (id: string, options: string[], correct: number, wrong: (string | undefined)[]) => {
    assert.ok(correct >= 0 && correct < options.length, id);
    assert.equal(wrong.length, options.length, `${id}: one feedback slot per option`);
    assert.equal(wrong[correct], undefined, `${id}: the correct option must not carry wrong-feedback`);
    wrong.forEach((w, i) => {
      if (i !== correct) assert.ok(w, `${id}: distractor ${i} needs feedback (else the shared check prints the answer)`);
    });
  };
  it('wrong-patch cases: rendered claims hold; feedback is leak-proof', async () => {
    const { WRONG_PATCH_CASES } = await import('../src/screens/lab/patchbay/engine/scenariosB.ts');
    for (const c of WRONG_PATCH_CASES) {
      checkMcq(c.id, c.options, c.correct, c.wrong);
      if (c.render) {
        const f = resolvePair(c.render.state) as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(c.render.expected)) assert.deepEqual(f[k], v, `${c.id} → ${k}`);
      }
    }
  });
  it('the feedback-loop case really is a live loop: the comp pair normal is ACTIVE with zero cords', async () => {
    const { WRONG_PATCH_CASES } = await import('../src/screens/lab/patchbay/engine/scenariosB.ts');
    const w1 = WRONG_PATCH_CASES.find((c) => c.id === 'w1-feedback');
    assert.ok(w1?.render);
    assert.equal(resolvePair(w1.render.state).normalActive, true);
  });
  it('design rows: every row solvable, notes present, and the hard rules hold', async () => {
    const { DESIGN_ROWS } = await import('../src/screens/lab/patchbay/engine/scenariosB.ts');
    for (const r of DESIGN_ROWS) {
      const kinds = Object.keys(r.verdicts) as Array<keyof typeof r.verdicts>;
      assert.equal(kinds.length, 3, r.id);
      assert.ok(kinds.some((k) => r.verdicts[k].ok), `${r.id}: at least one acceptable configuration`);
      kinds.forEach((k) => assert.ok(r.verdicts[k].note.length > 0, `${r.id}.${k}: note required either way`));
    }
    const loop = DESIGN_ROWS.find((r) => r.id === 'g3');
    assert.ok(loop, 'the processor-loop row must exist');
    assert.equal(loop.verdicts.thru.ok, true, 'processor loop: thru is the only safe wiring');
    assert.equal(loop.verdicts.full.ok, false, 'processor loop: full-normal must be rejected');
    assert.equal(loop.verdicts.half.ok, false, 'processor loop: half-normal must be rejected');
  });
  it('assessment: 10 items, leak-proof, rendered claims engine-true', async () => {
    const { ASSESSMENT_ITEMS } = await import('../src/screens/lab/patchbay/engine/scenariosB.ts');
    assert.equal(ASSESSMENT_ITEMS.length, 10);
    for (const a of ASSESSMENT_ITEMS) {
      checkMcq(a.id, a.options, a.correct, a.wrong);
      if (a.render) {
        const f = resolvePair(a.render.state) as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(a.render.expected)) assert.deepEqual(f[k], v, `${a.id} → ${k}`);
      }
    }
  });
  it('the studio bay: 8 pairs, processors thru, defaults half-bottom', async () => {
    const { STUDIO_PAIRS } = await import('../src/screens/lab/patchbay/engine/scenariosB.ts');
    assert.equal(STUDIO_PAIRS.length, 8);
    for (const p of STUDIO_PAIRS.slice(0, 6)) {
      assert.equal(p.config, 'half', `pair ${p.n}`);
      assert.equal(p.breakSide, 'bottom', `pair ${p.n}`);
    }
    for (const p of STUDIO_PAIRS.slice(6)) assert.equal(p.config, 'thru', `pair ${p.n} (processor pairs must never normal into themselves)`);
  });
});

describe('detective mode deducer (spec §15)', () => {
  it('the canonical case: keyboard reaches mixer with no cords, AND still does with a top tap → half-normal, uniquely', () => {
    const verdict = consistentConfigs([
      { topPlugged: false, bottomPlugged: false, destinationHears: 'normal' },
      { topPlugged: true, bottomPlugged: false, destinationHears: 'normal', sourceAtPatch: true },
    ]);
    assert.deepEqual(verdict, ['half']);
  });
  it('no cords + destination silent → thru, uniquely', () => {
    assert.deepEqual(consistentConfigs([{ topPlugged: false, bottomPlugged: false, destinationHears: 'nothing' }]), ['thru']);
  });
  it('top patch silences the destination (normal existed) → full, uniquely', () => {
    const verdict = consistentConfigs([
      { topPlugged: false, bottomPlugged: false, destinationHears: 'normal' },
      { topPlugged: true, bottomPlugged: false, destinationHears: 'nothing' },
    ]);
    assert.deepEqual(verdict, ['full']);
  });
  it('a single no-cord "hears normal" observation cannot yet separate full from half', () => {
    assert.deepEqual(consistentConfigs([{ topPlugged: false, bottomPlugged: false, destinationHears: 'normal' }]), ['full', 'half']);
  });
});
