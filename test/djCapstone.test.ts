/**
 * DJ Systems Lab, Stage 2b — the closing event (screen 24): the fault bank,
 * the rule for combining faults, the REPRODUCIBLE seeded scenario, and the
 * debrief (model/djCapstone). Each fault is planted on a real booth, read
 * through the real render where it shows there, and repaired with the
 * booth's own controls.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { builtBooth, connect, trimPos, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { freshEvent, micGainPos, recGainPos, withEv, withMic, withRec } from '../src/screens/lab/dj/model/djEvent.ts';
import { DEBRIEF_PARTS, FAULTS, FAULT_IDS, allFixed, compatible, debriefOptions, hintsFor, plant, scenarioFor, type FaultId } from '../src/screens/lab/dj/model/djCapstone.ts';
import { renderEvent } from '../src/screens/lab/dj/engine/djEventRender.ts';
import { load } from '../src/screens/lab/dj/model/djDeck.ts';

function event(): Booth {
  let b: Booth = { ...builtBooth(), ev: freshEvent() };
  b = { ...b, decks: { A: { ...b.decks.A, playing: true, at: 0, posSec: 40 }, B: { ...b.decks.B, playing: true, at: 0, posSec: 40 } }, ch: { 1: { ...b.ch[1], fader: 0.85 }, 2: { ...b.ch[2], fader: 0.85, cue: true } } };
  b = withMic(b, { input: 'MIC1', on: true, gain1: micGainPos(44), toRec: true });
  return withRec(b, { tap: 'REC_OUT', gain: recGainPos(0), armedAt: 0 });
}

/** The repair for each fault, with the booth's own controls. */
const REPAIR: Record<FaultId, (b: Booth) => Booth> = {
  CH2_SELECTOR: (b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'LINE' } } }),
  XF_ASSIGN: (b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], xf: 'THRU' } } }),
  MASTER_R: (b) => connect(b, 'mst.xlrR', 'paR.in')!,
  TRIM_HOT: (b) => ({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], trim: trimPos(0) } } }),
  PA_HUM: (b) => withEv(b, (e) => ({ ...e, paLWall: false })),
  PHONES_BLEND: (b) => ({ ...b, mixer: { ...b.mixer, cueMix: 0 } }),
  REC_NO_MIC: (b) => withMic(b, { toRec: true }),
  REC_CLIP: (b) => withRec(b, { gain: recGainPos(0) }),
  MEDIA_FAIL: (b) => withEv(load(b, 0, 'B', 'glassHarbour'), (e) => ({ ...e, mediaFail: false })),
  MIC_DOWN: (b) => withMic(b, { level: 0.75 }),
  PA_INPUT_MIC: (b) => withEv(b, (e) => ({ ...e, paRMic: false })),
};

describe('the fault bank', () => {
  it('every fault, planted, reads not fixed; repaired with the controls, reads fixed', () => {
    for (const f of FAULT_IDS) {
      const bad = FAULTS[f].inject(event());
      assert.equal(FAULTS[f].fixed(bad), false, `${f} planted`);
      assert.equal(FAULTS[f].fixed(REPAIR[f](bad)), true, `${f} repaired`);
    }
  });
  it('a clean booth has none of them', () => {
    for (const f of FAULT_IDS) assert.equal(FAULTS[f].fixed(event()), true, f);
  });
  it('the render shows what the fault says', () => {
    const r = (b: Booth) => renderEvent(b, 0, 1.2, null);
    assert.ok(r(FAULTS.CH2_SELECTOR.inject(event())).rmsDb.ch2 < -80, 'CH 2 dark');
    assert.ok(r(FAULTS.TRIM_HOT.inject(event())).clipped.ch1 > 0, 'CH 1 clips');
    const half = r(FAULTS.MASTER_R.inject(event()));
    assert.ok(half.rmsDb.masterR > -40, 'MASTER R still live at the mixer');
    assert.equal(r(FAULTS.PA_HUM.inject(event())).ext.hum.crowd, true, 'hum in the crowd');
    assert.equal(r(FAULTS.PA_HUM.inject({ ...event(), perspective: 'BOOTH' })).ext.hum.crowd, true);
    assert.ok(r(FAULTS.REC_CLIP.inject(event())).ext.clipped.rec > 0, 'the recorder clips');
    assert.equal(r(FAULTS.REC_CLIP.inject(event())).clipped.master, 0, 'the room does not');
    assert.equal(FAULTS.MEDIA_FAIL.inject(event()).decks.B.track, null, 'deck B has no file');
    // the two faults added 2026-10-18 (audio review #30)
    const sayB = (b: Booth) => withMic(b, { says: [{ at: 0.1 }] });
    const down = r(sayB(FAULTS.MIC_DOWN.inject(event())));
    assert.ok(Math.max(...down.ext.raw.mic) > -40, 'MIC meter live (before LEVEL)');
    assert.ok(down.ext.micIn.crowd < -50 && down.ext.micIn.rec < -50, 'no feed carries the voice');
    const paR = r(FAULTS.PA_INPUT_MIC.inject(event()));
    assert.ok((paR.ext.clipped.paR ?? 0) > 0, 'PA R overloads');
    assert.equal(paR.clipped.master, 0, 'the MASTER is clean');
  });
  it('every fault speaks in plain words: symptom, cause, evidence, repair, prevention', () => {
    for (const f of FAULT_IDS) for (const k of ['symptom', 'cause', 'evidence', 'repair', 'prevention'] as const) assert.ok(FAULTS[f][k].length > 20, `${f}.${k}`);
    assert.doesNotMatch(FAULTS.PA_HUM.repair, /lift the (mains )?earth\b(?! )/i);
  });
});

describe('combining faults', () => {
  it('never two from the same part of the system, never two that hide each other', () => {
    for (const a of FAULT_IDS)
      for (const b of FAULT_IDS) {
        if (!compatible(a, b)) continue;
        assert.notEqual(FAULTS[a].subsystem, FAULTS[b].subsystem, `${a} + ${b}`);
      }
    assert.equal(compatible('CH2_SELECTOR', 'MEDIA_FAIL'), false);
    assert.equal(compatible('REC_NO_MIC', 'REC_CLIP'), false);
    assert.equal(compatible('MASTER_R', 'TRIM_HOT'), true);
  });
  it('a seeded event is reproducible, and every event it makes is legal and repairable', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 600; seed++) {
      const s = scenarioFor(seed);
      assert.deepEqual(scenarioFor(seed), s, `seed ${seed} replays`);
      assert.ok(s.faults.length >= 1 && s.faults.length <= 2);
      if (s.faults.length === 2) assert.ok(compatible(s.faults[0], s.faults[1]), `${seed}: ${s.faults.join('+')}`);
      const planted = plant(event(), s);
      assert.equal(allFixed(planted, s), false);
      assert.equal(allFixed(s.faults.reduce((b, f) => REPAIR[f](b), planted), s), true, `${seed} repairs`);
      seen.add(s.faults[0]);
    }
    assert.equal(seen.size, FAULT_IDS.length, 'every fault comes up');
  });
  it('about half the events carry a second fault', () => {
    let two = 0;
    for (let seed = 1; seed <= 1000; seed++) if (scenarioFor(seed).faults.length === 2) two++;
    assert.ok(two > 350 && two < 650, `${two}`);
  });
});

describe('hints never print the answers (second reviews 2026-10-18)', () => {
  it('no hint is a debrief answer, and every fault has its own probe and pointer', () => {
    for (const f of FAULT_IDS) {
      const h = hintsFor(f);
      assert.equal(h.length, 3);
      for (const p of DEBRIEF_PARTS) for (const x of h) assert.notEqual(x, FAULTS[f][p], `${f} hint gives the ${p}`);
      assert.ok(FAULTS[f].probe.length > 20 && FAULTS[f].where.length > 15, f);
    }
  });
  it('wrong options come from the fault’s OWN plausible list, each with a reason', () => {
    for (const f of FAULT_IDS)
      for (const p of DEBRIEF_PARTS) {
        assert.ok(FAULTS[f].wrong[p].length >= 2, `${f}.${p}`);
        const q = debriefOptions(f, p, 3);
        assert.equal(q.why.length, q.options.length);
        q.options.forEach((o, i) => {
          if (i === q.correct || /^Lift the mains earth/.test(o)) return;
          assert.ok(FAULTS[f].wrong[p].some((w) => w.t === o), `${f}.${p}: ${o} is not one of its own wrong options`);
          assert.ok(q.why[i].length > 15);
        });
      }
  });
});

describe('the debrief', () => {
  it('each part offers the fault’s own answer among others, the same way every replay', () => {
    for (const f of FAULT_IDS)
      for (const p of DEBRIEF_PARTS) {
        const q = debriefOptions(f, p, 42);
        assert.equal(q.options[q.correct], FAULTS[f][p]);
        assert.ok(q.options.length >= 3);
        assert.equal(new Set(q.options).size, q.options.length, 'no repeated option');
        assert.deepEqual(debriefOptions(f, p, 42), q);
      }
  });
  it('the right answer is not always in the same place', () => {
    const at = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) for (const f of FAULT_IDS) at.add(debriefOptions(f, 'cause', seed).correct);
    assert.ok(at.size >= 3, [...at].join(','));
    const first = FAULT_IDS.flatMap((f) => DEBRIEF_PARTS.map((p) => debriefOptions(f, p, 11).correct === 0)).filter(Boolean).length;
    assert.ok(first < FAULT_IDS.length * DEBRIEF_PARTS.length * 0.6, 'not mostly first');
  });
  it('the unsafe earth lift is always a WRONG repair and prevention', () => {
    for (const f of FAULT_IDS)
      for (const p of ['repair', 'prevention'] as const) {
        const q = debriefOptions(f, p, 7);
        const k = q.options.findIndex((o) => /mains earth/.test(o) && /^Lift/.test(o));
        assert.ok(k >= 0 && k !== q.correct);
      }
  });
});
