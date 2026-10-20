/**
 * Wiring / signal-flow fixes, group "miking_mixing" (owner 2026-10-20: "all
 * labs must be excellent in terms of cabling, connections, wiring, signal
 * path"). One ratchet per finding in docs/wiring/WIRING_FINDINGS_2026_10_20.md:
 *
 *   SS-03 + MX-01  mute vs pre-fader sends is ONE app-wide statement: it
 *                  depends on the console; each lab says what its own does;
 *   MX-02          the Mixing lab's channel path is labelled the DAW model;
 *   MG-01          Mixing Guides: a polarity flip is a CHECK, never a rule;
 *   MK-01          the DI behind the combo takes the amp's LINE / DI OUT,
 *                  never its speaker output;
 *   MK-02          "plain phantom is not a measurement mic's supply" scoped;
 *   MK-03          monitor-mix absolutes hedged;
 *   MK-04          broadcast routeProblems: own voice in the IFB is an echo;
 *                  the PA is not a speakerLoop;
 *   MK-05          cable-lane comments cite D70 (governance numbering);
 *   MK-06          app-wide: a dynamic-only setup never claims phantom;
 *   MS-01          Mic Select names the tube condenser's own supply.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { sendPathGain, type Console } from '../src/screens/lab/mixing/engine/routing.ts';
import { DI_CABLE, DI_CABLE_JACKS } from '../src/screens/lab/miking/lessons/shared/speakers/stagePlanModel.ts';
import { patchVerdict } from '../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts';
import { SPK_LESSON } from '../src/screens/lab/miking/lessons/spk/lesson.ts';
import { MEAS_CHAIN } from '../src/screens/lab/miking/lessons/shared/measure/chains.ts';
import { routeProblems, problemWords, type RoutingPlan } from '../src/screens/lab/miking/lessons/shared/broadcast/routing.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { POWER_NUANCE } from '../src/screens/lab/micselect/micSelectData.ts';

const ROOT = join(import.meta.dirname, '..');
const src = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('SS-03 + MX-01: mute vs pre-fader sends depends on the console (one statement app-wide)', () => {
  it('the Sound Systems engine says console-dependent and states its own behaviour', () => {
    const s = src('src/features/soundsystems/console.ts');
    assert.ok(s.includes('DEPENDS ON THE CONSOLE'));
    assert.ok(s.includes("THIS lab's console"));
    assert.ok(!s.includes('has always meant'), 'no universal "pre-fader has always meant" claim');
    assert.ok(!s.includes('the consoles technicians actually meet'));
  });
  it('the Sound Systems Route text and the strip caption agree: console-dependent, and this console mutes the pre sends', () => {
    const r = src('src/screens/lab/soundsystems/pagesRoute.tsx');
    assert.ok(!/classic analog rule/i.test(r), 'no "classic analog rule" as a universal');
    assert.ok(!r.includes('like most digital consoles by default'));
    assert.ok((r.match(/depends on the console/gi) ?? []).length >= 2, 'fader station + PRE/POST card');
    assert.ok(r.includes('On this console the MUTE also silences the pre-fader sends'));
    assert.ok(r.includes('On this console the channel MUTE silences its pre-fader sends'));
    const d = src('src/screens/lab/soundsystems/art/diagrams.tsx');
    assert.ok(d.includes('on this console the mute also silences the pre-fader sends; that depends on the console'));
  });
  it("the Mixing engine says console-dependent and its mixer's behaviour matches its words", () => {
    const m = src('src/screens/lab/mixing/engine/routing.ts');
    assert.ok(!m.includes('mute follows the console convention'));
    assert.ok(m.includes('DEPENDS ON THE CONSOLE'));
    assert.ok(m.includes("THIS lab's mixer keeps the pre-fader send feeding through a mute"));
    const con: Console = { channels: [], subgroups: [], auxReturns: [], vcas: [] } as unknown as Console;
    const ch = { id: 'x', name: 'X', faderDb: 0, mute: true, out: 'mix', sends: { cue: { levelDb: 0, tap: 'pre' as const }, verb: { levelDb: 0, tap: 'post' as const } } } as never;
    assert.ok(sendPathGain(ch, 'cue', con) > 0, 'this mixer: pre send keeps feeding through a mute');
    assert.equal(sendPathGain(ch, 'verb', con), 0, 'post send dies with the mute');
  });
});

describe('MX-02: the channel path is labelled the DAW model', () => {
  it('CHANNEL_PATH and the bus simplification carry the note', () => {
    const m = src('src/screens/lab/mixing/engine/routing.ts');
    assert.ok(m.includes('This is the DAW channel model'));
    assert.ok(m.includes('Teaching simplification of the DAW model'));
  });
});

describe('MG-01: Mixing Guides teach polarity as a check, never a rule', () => {
  const dir = join(ROOT, 'src/screens/lab/mixingGuides/data/guides');
  const lines = readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .flatMap((f) => readFileSync(join(dir, f), 'utf8').split('\n').map((l) => ({ f, l })));
  it('every line that flips polarity also says to check it', () => {
    const bad = lines.filter(({ l }) => /polarity/i.test(l) && /flip/i.test(l) && !/check/i.test(l));
    assert.deepEqual(bad.map(({ f, l }) => `${f}: ${l.trim()}`), []);
  });
  it('the five old rule-lines are gone and say "keep the setting that sounds fuller"', () => {
    const all = lines.map(({ l }) => l).join('\n');
    for (const old of ['polarity-flipped', 'flipped polarity, tucked under', '"Flip polarity against top mics', '"Flip polarity and check alignment', '(polarity flip, 0.5–2 ms delay)']) assert.ok(!all.includes(old), old);
    assert.ok((all.match(/flip it and keep the setting that sounds fuller/g) ?? []).length >= 5);
  });
});

describe('MK-01: the DI behind the combo takes the amp’s LINE / DI OUT, never the speaker output', () => {
  it('the declared jacks pass the lab’s own patch rule', () => {
    assert.notEqual(DI_CABLE_JACKS.amp, 'speakerOut');
    assert.equal(DI_CABLE_JACKS.di, 'diIn');
    assert.notEqual(patchVerdict(DI_CABLE_JACKS.amp, DI_CABLE_JACKS.di), 'stop');
    assert.equal(patchVerdict('speakerOut', 'diIn'), 'stop');
    assert.equal(DI_CABLE.from, 'dibox');
  });
  it('the learner note names the jack', () => {
    const items = JSON.stringify(SPK_LESSON);
    assert.ok(items.includes('taken at its LINE / DI OUT jack'));
    assert.ok(items.includes('never at its speaker output'));
  });
});

describe('MK-02: the measurement-chain phantom line is scoped to this chain', () => {
  it('no universal "not a measurement mic’s supply"', () => {
    const t = JSON.stringify(MEAS_CHAIN);
    assert.ok(!t.includes('is not a measurement mic’s supply'));
    assert.ok(t.includes('not the supply for either capsule in this chain'));
    assert.ok(t.includes('Many system-tuning measurement mics do run on 48 V phantom'));
  });
});

describe('MK-03: monitor-mix absolutes are hedged', () => {
  it('choir mics and studio headphones are starting points, not rules', () => {
    const v = src('src/screens/lab/miking/lessons/shared/ensemble/voiceGroupItems.ts');
    assert.ok(!v.includes("never go into the singers' own monitor mix"));
    assert.ok(!v.includes('a sure way to feedback'));
    assert.ok(v.includes('in-ear monitors, or a little added with care, are the exceptions'));
    const c = src('src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts');
    assert.ok(!c.includes('Real studios monitor through headphones, not wedges'));
  });
});

describe('MK-04: broadcast routing — own voice in the earpiece; the PA is not a speaker loop', () => {
  const plan: RoutingPlan = {
    sources: [
      { id: 'host', label: 'host', short: 'H', kind: 'mic', level: 'mic' },
      { id: 'remote', label: 'remote guest', short: 'R', kind: 'remote', level: 'line' },
    ],
    dests: ['phones', 'stream', 'remoteReturn', 'ifb', 'pa'],
    sends: { host: ['stream', 'remoteReturn', 'pa'], remote: ['stream', 'pa'] },
    openMics: ['host'],
  };
  it('a clean plan with the remote on the PA (a hybrid event) has no problems', () => {
    assert.deepEqual(routeProblems(plan), []);
  });
  it('the remote talker’s own voice in their earpiece is an echo', () => {
    const p = { ...plan, sends: { ...plan.sends, remote: ['stream', 'ifb'] as const } };
    const probs = routeProblems(p);
    assert.deepEqual(probs, [{ code: 'echo', dest: 'ifb', source: 'remote' }]);
    assert.match(problemWords(p, probs[0]), /own earpiece/);
  });
  it('the speakerLoop type no longer claims a PA case it never checks', () => {
    const r = src('src/screens/lab/miking/lessons/shared/broadcast/routing.ts');
    assert.ok(!r.includes("code: 'speakerLoop'; dest: 'monitor' | 'pa'"));
  });
});

describe('MK-05: cable-lane comments cite D70', () => {
  it('cueMix and CueMixPlan', () => {
    for (const f of ['src/screens/lab/miking/lessons/shared/monitoring/cueMix.ts', 'src/screens/lab/miking/lessons/shared/monitoring/CueMixPlan.tsx']) {
      const s = src(f);
      assert.ok(!s.includes('D69'), f);
      assert.ok(s.includes('D70'), f);
    }
  });
});

describe('MK-06: app-wide, a dynamic-only setup never claims phantom power', () => {
  /** A label that names a dynamic and NO other mic or powered device. */
  const DYN = /\bdynamic/i;
  const OTHER = /condenser|ribbon|miniature|\blav|omni|pair|\bmics?\b|boundary|shotgun|clip-on|diaphragm|electret|headset|piano|measurement|pickup|\bDI\b|figure-8|figure-eight/i;
  it('every lesson’s setups', () => {
    const bad: string[] = [];
    let checked = 0;
    for (const e of LESSONS) {
      const L = lessonById(e.id);
      if (!L) continue;
      for (const t of L.setupTasks ?? [])
        for (const s of t.setups) {
          if (!DYN.test(s.label) || OTHER.test(s.label)) continue;
          checked++;
          if (s.power === 'phantom') bad.push(`${e.id} ${t.id}.${s.id}: ${s.label}`);
        }
    }
    assert.ok(checked > 50, `the scan reached the dynamic-only setups (${checked})`);
    assert.deepEqual(bad, []);
  });
});

describe('MS-01: Mic Select names the tube condenser’s own supply and multi-pin cable', () => {
  it('POWER_NUANCE', () => {
    assert.match(POWER_NUANCE, /tube \(valve\) condenser/);
    assert.match(POWER_NUANCE, /own power supply/);
    assert.match(POWER_NUANCE, /multi-pin cable/);
  });
});
