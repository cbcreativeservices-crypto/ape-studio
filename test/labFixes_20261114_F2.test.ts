/**
 * Lab fix round 2026-11-14 · group F2 (Sound Systems + DJ Systems), phase 1.
 *
 * The owner, 2026-11-14: "Begin fixing all bugs found and do obvious (my
 * decision is not required) fixes as you suggestted in the report." Every
 * block here pins one finding of docs/labs/novice_audit_2026_11_14 (G5,
 * G5b, G5c) and would have failed before its fix.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

// House resolver hook: source modules import siblings without extensions.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const caps = await import('../src/features/soundsystems/capstones.ts');
const fx = await import('../src/screens/lab/soundsystems/fixHelpers.ts');
const { FAULTS } = await import('../src/features/soundsystems/faults.ts');
const { referenceBuild } = await import('./_ssReferenceBuilds.ts');
const dj = await import('../src/screens/lab/dj/pages/fixGuards.ts');
const guards = await import('../src/screens/lab/dj/pages/s1Guards.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type GearKind = import('../src/features/soundsystems/types.ts').GearKind;
type SlotId = import('../src/features/soundsystems/types.ts').SlotId;

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const SS = 'src/screens/lab/soundsystems';
const DJ = 'src/screens/lab/dj';

/** Place gear by id and kind; returns the system and a name → id map. */
function build(parts: [string, GearKind, SlotId][]): { s: System; id: Record<string, string> } {
  let s: System = sys.EMPTY_SYSTEM;
  const id: Record<string, string> = {};
  for (const [name, kind, slot] of parts) {
    const v = sys.place(s, kind, slot);
    assert.ok(v.ok, `place ${name} at ${slot}`);
    s = v.system;
    id[name] = v.id;
  }
  return { s, id };
}
function link(s: System, from: string, to: string): System {
  const v = sys.connect(s, from, to);
  assert.ok(v.ok, `connect ${from} → ${to}${v.ok ? '' : `: ${v.reason}`}`);
  return v.system;
}

/* ── Sound Systems · BUILD ─────────────────────────────────────────────── */

describe('BUILD capstone 2: Center cluster and Sub · center can both be placed by a tap', () => {
  it('the two positions really are closer than a placed box’s tap circle (the blocker)', () => {
    const c = sys.slotDef('mainC');
    const s = sys.slotDef('subC');
    assert.ok(Math.hypot(c.x - s.x, c.y - s.y) < 22, 'if this changes, the plot fix below may no longer be needed');
  });
  it('the free ring’s tap area is drawn AFTER the placed gear, so it wins the tap', () => {
    const v = read(`${SS}/art/VenueView.tsx`);
    const placedAt = v.indexOf('{/* placed gear, as plan glyphs rotated to aim */}');
    const hitAt = v.indexOf('key={`hit-${s}`}');
    assert.ok(placedAt > 0 && hitAt > placedAt, 'target hit circles come after the placed devices');
    // the ring itself, not the box's glyph centre (18 units away), is the target near a box
    assert.match(v, /r=\{near \? 14 : 18\}/);
    assert.ok(!/r=\{18\} fill="transparent" onPress=\{\(\) => p\.onTapSlot/.test(v.slice(0, placedAt)), 'no tap circle for a slot under the placed gear');
  });
  it('the IN HAND card lists every free position as a button too', () => {
    const b = read(`${SS}/pagesBuild.tsx`);
    assert.match(b, /freeTargets\.map\(\(t\) => \(\s*<Pressable key=\{t\} onPress=\{\(\) => b\.tapSlot\(t\)\}/);
    assert.match(b, /accessibilityLabel=\{`Place at \$\{slotDef\(t\)\.label\}`\}/);
  });
  it('with both placed, requirements 3 and 4 are met', () => {
    const { s } = build([['top', 'poweredSpeaker', 'mainC'], ['sub', 'poweredSub', 'subC']]);
    const g = caps.gradeCapstone(caps.capstone('mono-music'), s, caps.capstoneConsole(caps.capstone('mono-music')));
    assert.ok(g.met.includes('mono') && g.met.includes('sub'));
  });
});

describe('BUILD: no requirement is met before anything is placed ("REQS already reads 1/8")', () => {
  for (const c of caps.CAPSTONES) {
    it(`${c.id}: 0 of ${c.requirements.length} on the empty venue`, () => {
      assert.deepEqual(caps.gradeCapstone(c, sys.EMPTY_SYSTEM, caps.capstoneConsole(c)).met, []);
    });
  }
  it('capstone 6: "every monitor send is PRE" waits for a send, then ticks on PRE', () => {
    const c = caps.capstone('monitors');
    const { s } = build([['mic', 'vocalMic', 'stageC']]);
    let cs = con.bandConsole();
    assert.ok(caps.gradeCapstone(c, s, cs).unmet.includes('pre'), 'no send yet: not met');
    cs = con.setSend(cs, 'vox', 'aux1', { db: -20, tap: 'post' });
    assert.ok(caps.gradeCapstone(c, s, cs).unmet.includes('pre'));
    cs = con.setSend(cs, 'vox', 'aux1', { db: -20, tap: 'pre' });
    assert.ok(caps.gradeCapstone(c, s, cs).met.includes('pre'));
  });
  it('capstones 4 and 9: "every passive cabinet has an amplifier" waits for a cabinet', () => {
    const { s } = build([['amp', 'amp', 'rack1'], ['mic', 'vocalMic', 'stageC']]);
    for (const id of ['stereo-subs', 'outdoor']) {
      const c = caps.capstone(id);
      assert.ok(caps.gradeCapstone(c, s, caps.capstoneConsole(c)).unmet.includes('amps'), id);
    }
  });
  it('capstone 7: "the drums still reach the main mix" is judged once the drums are on DRUMS', () => {
    const c = caps.capstone('groups-fx');
    const { s } = build([['mic', 'vocalMic', 'stageC']]);
    let cs = con.bandConsole();
    assert.ok(caps.gradeCapstone(c, s, cs).unmet.includes('drumsMain'));
    for (const d of ['kick', 'snare', 'oh']) cs = con.setChannel(cs, d, { subgroup: 'sub-drums', toMain: false });
    assert.ok(caps.gradeCapstone(c, s, cs).met.includes('drumsMain'));
  });
  it('every reference build still passes', () => {
    for (const c of caps.CAPSTONES) {
      const r = referenceBuild(c.id);
      assert.deepEqual(caps.gradeCapstone(c, r.s, r.cs).unmet, [], c.id);
    }
  });
});

describe('BUILD: a wrong cable the engine accepts reads △ with the reason, not a green ✓', () => {
  it('capstone 2: playback straight into the sub goes around the mix', () => {
    const { s, id } = build([['pb', 'playback', 'stageR'], ['sub', 'poweredSub', 'subC']]);
    const after = link(s, id.pb, id.sub);
    assert.match(caps.linkWarning(caps.capstone('mono-music'), s, after, id.pb, id.sub) ?? '', /AROUND the mix/);
  });
  it('capstone 5: a mic straight to the console skips the stagebox', () => {
    const { s, id } = build([['mic', 'vocalMic', 'stageC'], ['con', 'console', 'foh']]);
    const after = link(s, id.mic, id.con);
    assert.match(caps.linkWarning(caps.capstone('network'), s, after, id.mic, id.con) ?? '', /stagebox/);
  });
  it('capstone 9: a delay box live without the processor', () => {
    const { s: s0, id } = build([['mic', 'vocalMic', 'stageC'], ['con', 'console', 'foh'], ['amp', 'amp', 'rack1'], ['dl', 'passiveSpeaker', 'delayL']]);
    let s = link(link(s0, id.mic, id.con), id.con, id.amp);
    const after = link(s, id.amp, id.dl);
    assert.match(caps.linkWarning(caps.capstone('outdoor'), s, after, id.amp, id.dl) ?? '', /not through the processor/);
    s = after;
  });
  it('a microphone has one output: a second cable from it is called out', () => {
    const { s: s0, id } = build([['mic', 'vocalMic', 'stageC'], ['con', 'console', 'foh'], ['box', 'stagebox', 'stageBox']]);
    const s = link(s0, id.mic, id.con);
    const after = link(s, id.mic, id.box);
    assert.match(caps.linkWarning(null, s, after, id.mic, id.box) ?? '', /one output/);
  });
  it('a build that follows its brief gets no △ on any cable (all ten reference builds, cable by cable)', () => {
    for (const c of caps.CAPSTONES) {
      const r = referenceBuild(c.id);
      let s: System = { placed: r.s.placed, links: [] };
      for (const l of r.s.links) {
        const v = sys.connect(s, l.from, l.to, l.out ?? undefined);
        assert.ok(v.ok, `${c.id}: ${l.from} → ${l.to}`);
        assert.equal(caps.linkWarning(c, s, v.system, l.from, l.to), null, `${c.id}: ${l.from} → ${l.to}`);
        s = v.system;
      }
    }
  });
  it('the page shows the warning as △ (not ok) and passes the capstone in', () => {
    const b = read(`${SS}/pagesBuild.tsx`);
    assert.match(b, /setMsg\(warn \? \{ text: `[^`]*\$\{warn\}` \} : \{/);
    assert.match(b, /useBuilder\(EMPTY_SYSTEM, capstone\.id\)/);
  });
});

describe('BUILD: one full stop after every venue ("One presenter..")', () => {
  it('venueSentence never doubles the stop', () => {
    for (const c of caps.CAPSTONES) assert.ok(!/\.\.$/.test(fx.venueSentence(c.venue)), c.id);
    assert.equal(fx.venueSentence('A meeting room for sixty. One presenter.'), 'A meeting room for sixty. One presenter.');
    assert.equal(fx.venueSentence('No stop'), 'No stop.');
  });
  it('the capstone caption uses it', () => {
    assert.match(read(`${SS}/pagesBuild.tsx`), /\$\{venueSentence\(capstone\.venue\)\} Build it/);
  });
});

/* ── Sound Systems · TROUBLESHOOT ──────────────────────────────────────── */

describe('TROUBLESHOOT: readouts in words', () => {
  it('"OK · WRONGCONTENT" reads "WRONG CONTENT"; a flagged healthy station reads its flag alone', () => {
    assert.equal(fx.readoutOf({ signal: 'ok', note: '', flags: ['wrongContent'] } as never), 'WRONG CONTENT');
    assert.equal(fx.readoutOf({ signal: 'ok', note: '', flags: ['hum'] } as never), 'HUM');
    assert.equal(fx.readoutOf({ signal: 'low', note: '', flags: ['limiting'] } as never), 'LOW · LIMITING');
    assert.equal(fx.readoutOf({ signal: 'none', note: '' } as never), 'NO SIGNAL');
  });
  it('no fault case prints a run-together code word anywhere', () => {
    for (const f of Object.values(FAULTS) as { reads: Record<string, { signal: string; note: string; flags?: string[] }> }[]) {
      for (const r of Object.values(f.reads)) {
        assert.ok(!/[A-Z]{3,}[a-z]|[a-z][A-Z]/.test(fx.readoutOf(r as never)), fx.readoutOf(r as never));
        assert.ok(!/^OK · /.test(fx.readoutOf(r as never)), 'OK is never put on the station where the fault shows');
      }
    }
  });
  it('the PROBE key shows the whole reading ("PROBE ▸ NO" for NO SIGNAL)', () => {
    assert.equal(fx.mapReadout({ signal: 'none', note: '' } as never), 'NO SIGNAL');
    const t = read(`${SS}/pagesTroubleshoot.tsx`);
    assert.ok(!t.includes("readoutOf(c.reads[last]).split(' ')[0]"), 'no first-word cut on the PROBE key');
    assert.match(t, /valueLabel: last \? mapReadout\(c\.reads\[last\]\)/);
  });
});

describe('TROUBLESHOOT: a fault is named from a reading, and the FAULT tray closes per case (quick win 10)', () => {
  it('no name before the first probe (a 0-probe answer counted as solved)', () => {
    assert.equal(fx.canName(false, false, 0), false);
    assert.equal(fx.canName(false, false, 1), true);
    assert.equal(fx.canName(true, false, 3), false);
    assert.equal(fx.canName(false, true, 3), false);
    const t = read(`${SS}/pagesTroubleshoot.tsx`);
    assert.match(t, /if \(!canName\(solved, locked, probes\.length\)\) return;/);
    assert.match(t, /locked: probes\.length === 0 && pick == null \? NAME_NEEDS_A_PROBE : undefined/);
    assert.ok(!/[.]$/.test(fx.NAME_NEEDS_A_PROBE), 'the dock adds its own full stop');
  });
  it('the FAULT key changes id on every new case, every RESET and when solved', () => {
    assert.notEqual(fx.faultKeyId(1, false), fx.faultKeyId(2, false));
    assert.notEqual(fx.faultKeyId(3, false), fx.faultKeyId(3, true));
    const t = read(`${SS}/pagesTroubleshoot.tsx`);
    assert.match(t, /id: faultKeyId\(run, solved\)/);
    assert.equal((t.match(/setRun\(\(n\) => n \+ 1\)/g) ?? []).length, 2, 'openCase and RESET both start a new run');
  });
});

describe('Mode end screens: "<MODE> COMPLETE", never "LAB COMPLETE" after one mode', () => {
  it('modeCompleteTitle', () => {
    assert.equal(fx.modeCompleteTitle('Sound Systems · Troubleshoot'), 'TROUBLESHOOT COMPLETE');
    assert.equal(fx.modeCompleteTitle('Sound Systems · Learn'), 'LEARN COMPLETE');
  });
  it('the paged host passes it to the end screen', () => {
    assert.match(read(`${SS}/SsPagedLab.tsx`), /completeTitle=\{modeCompleteTitle\(title\)\}/);
  });
});

/* ── Sound Systems · OPERATE ───────────────────────────────────────────── */

describe('OPERATE 3 and 4: a met goal that is not true now says so', () => {
  it('goalChipText', () => {
    assert.deepEqual(fx.goalChipText('No stage clipping', true, false), { mark: '✓ ', text: 'No stage clipping · met earlier, not now', lost: true });
    assert.equal(fx.goalChipText('No stage clipping', true, true).text, 'No stage clipping');
    assert.equal(fx.goalChipText('No stage clipping', false, false).mark, '○ ');
  });
  it('both state pages pass the live state', () => {
    assert.equal((read(`${SS}/pagesOperate.tsx`).match(/now=\{goals\.map\(\(g\) => g\.hit\)\}/g) ?? []).length, 2);
  });
});

describe('OPERATE 5: the rack’s spoken label follows the drawing on power-down', () => {
  const RACK = [{ step: 'sources', label: 'Stage devices' }, { step: 'console', label: 'Console' }, { step: 'amps', label: 'Amplifiers' }];
  it('steps switched OFF so far read off; the rest on', () => {
    const said = fx.rackA11y(RACK, new Set(['amps']), 'down');
    assert.equal(said, 'The rack: Stage devices on, Console on, Amplifiers off');
    assert.equal(fx.rackA11y(RACK, new Set(['sources']), 'up'), 'The rack: Stage devices on, Console off, Amplifiers off');
    assert.match(read(`${SS}/pagesOperate.tsx`), /accessibilityLabel=\{rackA11y\(RACK, on, direction\)\}/);
  });
});

/* ── Sound Systems · ROUTE ─────────────────────────────────────────────── */

describe('ROUTE: four wedge columns at 390 never cut a channel name ("Lead vo…")', () => {
  it('ConsolePanel shortens the long names on a narrow column only', () => {
    const p = read(`${SS}/art/ConsolePanel.tsx`);
    assert.match(p, /'Lead vocal': 'Vocal'/);
    assert.match(p, /\{bankRowName\(h\.name, width\)\}/);
    assert.match(p, /return width < 96 \?/);
  });
});

/* ── house slang ───────────────────────────────────────────────────────── */

describe('"ride" and "lane" as instructions read "slide" and "slider"', () => {
  const files = [
    ...['pagesLearnA.tsx', 'pagesLearnB.tsx', 'pagesLearnC.tsx', 'pagesRoute.tsx', 'pagesOperate.tsx', 'soundsystemsScreenGuides.ts'].map((f) => `${SS}/${f}`),
    `${DJ}/djScreenGuides.ts`,
    `${DJ}/pages/p06Gain.tsx`,
    `${DJ}/pages/p07Cue.tsx`,
    `${DJ}/pages/p21Rec.tsx`,
    `${DJ}/pages/p22Hybrid.tsx`,
  ];
  for (const f of files) {
    it(f, () => {
      const body = read(f).split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
      assert.ok(!/\b[Rr]ide [A-Z]/.test(body), 'no "Ride STATION" style instruction');
      assert.ok(!/The lane is the|the lane’s key|double-tap the lane|ride the lane/i.test(body));
    });
  }
});

/* ── DJ Systems ────────────────────────────────────────────────────────── */

describe('DJ screen 6: the hidden overload counts as fixed only when the booth STAYS clean', () => {
  const at = 100;
  it('one clean 3 s chunk is not enough; that chunk and the next 8 s one are', () => {
    let run = guards.CLEAN_RUN_FRESH;
    const c1 = { t0: at + 1, seconds: 3 };
    run = guards.cleanRunStep(run, c1, true, at);
    assert.ok(guards.cleanFor(run, c1) < guards.CLEAN_HOLD_S, 'the old rule ticked here');
    const c2 = { t0: at + 4, seconds: 8 };
    run = guards.cleanRunStep(run, c2, true, at);
    assert.ok(guards.cleanFor(run, c2) >= guards.CLEAN_HOLD_S);
  });
  it('a chunk that clips ends the run; a chunk from before the fault never counts', () => {
    let run = guards.cleanRunStep(guards.CLEAN_RUN_FRESH, { t0: at - 5, seconds: 8 }, true, at);
    assert.equal(run.since, null);
    run = guards.cleanRunStep(run, { t0: at + 1, seconds: 3 }, true, at);
    run = guards.cleanRunStep(run, { t0: at + 4, seconds: 8 }, false, at);
    assert.equal(guards.cleanFor(run, { t0: at + 4, seconds: 8 }), 0);
  });
  it('the page judges "fixed" on the held run', () => {
    const p = read(`${DJ}/pages/p06Gain.tsx`);
    assert.match(p, /fixed=\{!!last && renderedSince\(last, faultAt\.current\) && heldClean\}/);
  });
});

describe('DJ screen 10: "+0.06 beat" never shows for both a pass and a miss', () => {
  it('three decimals split the pass mark', () => {
    assert.equal(dj.beatOffsetText(0.058), '+0.058 beat');
    assert.equal(dj.beatOffsetText(-0.44), '−0.440 beat');
    const passes = [0.05, 0.06, 0.062, 0.0624].map((x) => dj.beatOffsetText(x));
    const misses = [0.0625, 0.063, 0.064, 0.07].map((x) => dj.beatOffsetText(x));
    for (const x of [0.05, 0.06, 0.062, 0.0624]) assert.ok(dj.beatAligned(x));
    for (const x of [0.0625, 0.063, 0.064, 0.07]) assert.ok(!dj.beatAligned(x));
    for (const p of passes) assert.ok(!misses.includes(p), p);
  });
  it('the readout uses it', () => {
    assert.match(read(`${DJ}/pages/p10Tempo.tsx`), /v: both \? beatOffsetText\(off\) : '—', tint: both && beatAligned\(off\)/);
  });
});

describe('DJ screen 24: THE ROOM and the hot-trim fault agree', () => {
  it('a clipping channel reads CLIPPING in the room', () => {
    const p = read(`${DJ}/pages/p24Capstone.tsx`);
    assert.match(p, /last\.clipped\.master \+ last\.clipped\.bus > 0 \|\| chClip \? 'CLIPPING'/);
  });
  it('above +3 dB but not clipping, the page says the trim is still hot', () => {
    assert.equal(dj.trimStillHot(4, false), true);
    assert.equal(dj.trimStillHot(3, false), false);
    assert.equal(dj.trimStillHot(12, true), false, 'still clipping: the room already reads CLIPPING');
    assert.match(read(`${DJ}/pages/p24Capstone.tsx`), /trimHotOpen \? <Note tone="try">/);
  });
});

describe('DJ screens 4 and 24: power switches are named and big enough', () => {
  it('the whole row is the switch, named for its device', () => {
    const t = read(`${DJ}/trays.tsx`);
    assert.match(t, /accessibilityRole="switch"/);
    assert.match(t, /accessibilityLabel=\{powerSwitchA11y\(p\.label, on, noCord\)\}/);
    assert.match(t, /powerRow: \{[^}]*minHeight: 44/);
    assert.match(t, /powerPill: \{ minWidth: 64, minHeight: 36/);
    assert.ok(!/LabChip label=\{booth\.power\[p\.id\] \? 'ON' : 'OFF'\}/.test(t), 'no bare "OFF" chip');
  });
});

describe('DJ screens 7 and 21: "dBFS dBFS"', () => {
  it('a cell with the unit on its sub line does not put it in the value too', () => {
    const s = read(`${DJ}/pages/shared.tsx`);
    const e = read(`${DJ}/pages/eventShared.tsx`);
    assert.ok(!/vA11y: `\$\{db\.toFixed\(1\)\} dBFS`, sub:/.test(s));
    assert.ok(!/vA11y: `\$\{db\.toFixed\(1\)\} \$\{unit\}`, sub: unit/.test(e));
  });
});

describe('DJ screen 11: a stray tap in the GRID tray cannot restart the fault', () => {
  it('the scenario row sits behind its own fold, closed by default', () => {
    const p = read(`${DJ}/pages/p11Grid.tsx`);
    assert.match(p, /const \[scenOpen, setScenOpen\] = useState\(false\);/);
    assert.match(p, /\{scenOpen \? \(\s*<>\s*<Text style=\{styles\.head\}>DECK B’S ANALYSIS/);
  });
});

describe('DJ screen 14: the fault’s own key lock and key shift are not free ticks', () => {
  it('keyStagedAfter', () => {
    let s = dj.keyStagedAfter(dj.KEY_STAGED_NONE, 'faultStart');
    assert.deepEqual(s, { lock: true, shift: true });
    s = dj.keyStagedAfter(s, 'shiftPick');
    assert.deepEqual(s, { lock: true, shift: false });
    s = dj.keyStagedAfter(s, 'lockToggle');
    assert.deepEqual(s, dj.KEY_STAGED_NONE);
  });
  it('the page holds "Lock the key" and "Shift the key a step" while staged', () => {
    const p = read(`${DJ}/pages/p14Key.tsx`);
    assert.match(p, /if \(ready && !staged\.current\.lock && both && matched && B\.keyLock/);
    assert.match(p, /if \(ready && !staged\.current\.shift && B\.playing/);
    assert.match(p, /staged\.current = keyStagedAfter\(staged\.current, 'faultStart'\);/);
  });
});

/* ══ PHASE 2 (coordinator 2026-11-14: fill in the shared mechanisms) ══════ */

const { SOUND_SYSTEMS_CHECK } = await import('../src/features/soundsystems/check.ts');
const { checkWhyProblems } = await import('../src/features/lab/checkFeedback.ts');
const longestRatio = (options: readonly string[], correct: number) => {
  const others = options.filter((_, i) => i !== correct).map((o) => o.length);
  return options[correct].length / Math.max(...others);
};

describe('Phase 2 · Sound Systems check: a reason for every wrong option, balanced options', () => {
  for (const q of SOUND_SYSTEMS_CHECK) {
    it(q.id, () => {
      const wrong = q.options.filter((o) => o !== q.correct);
      assert.deepEqual(Object.keys(q.why ?? {}).sort(), [...wrong].sort(), 'every wrong option has its own why');
      assert.deepEqual(checkWhyProblems(q), []);
      assert.ok(longestRatio(q.options, q.options.indexOf(q.correct)) <= 1.45, 'the right answer is not the one long line');
    });
  }
});

describe('Phase 2 · TROUBLESHOOT: neutral cards, balanced options, a reason per wrong option', () => {
  const GIVEAWAY = /PRE-fader|INTERNAL clock|pins 2 and 3|400 Hz|0\.0 ms|input 4|Subgroup 3|turned up|attenuators|smaller cabinet|on-axis|Energy-Efficient|unbalanced|mains circuit/;
  for (const f of FAULTS as readonly { id: string; title: string; setup: string; options: readonly string[]; correct: number; why?: readonly (string | null)[] }[]) {
    it(f.id, () => {
      assert.doesNotMatch(f.setup, GIVEAWAY, 'the card describes the system, not the fault');
      assert.ok(longestRatio(f.options, f.correct) <= 1.45, `right option is not the long one (${f.options[f.correct]})`);
      assert.equal(f.why?.length, f.options.length);
      f.options.forEach((o, i) => {
        if (i === f.correct) assert.equal(f.why![i], null);
        else {
          assert.ok(f.why![i] && f.why![i]!.split(/\s+/).length <= 30, `${o}: a reason of 30 words or fewer`);
          assert.ok(!f.why![i]!.includes(f.options[f.correct]), 'never quotes the right option');
        }
      });
    });
  }
  it('the group notes no longer say where the answer is', () => {
    const src = read('src/features/soundsystems/faults.ts');
    assert.ok(!/is usually the station|are the stations\./.test(src));
  });
  it('a wrong pick prints that option’s reason', () => {
    assert.match(read(`${SS}/pagesTroubleshoot.tsx`), /c\.why\?\.\[pick\] \? `\$\{c\.why\[pick\]\} `/);
  });
});

describe('Phase 2 · LEARN and ROUTE quizzes: each wrong pick has its own line', () => {
  it('Match the venue and Choose the configuration say what the wrong choice is built for', () => {
    const a = read(`${SS}/pagesLearnA.tsx`);
    assert.match(a, /wrong=\{pool\.map\(\(k, j\) => \(j === 0 \? undefined : builtFor\(SYSTEM_TYPES\[k\]\.when\)\)\)\}/);
    assert.match(a, /wrong=\{\[undefined, \.\.\.c\.distractors\.map\(\(d\) => builtFor\(OUTPUT_CONFIGS\.find/);
  });
  it('ROUTE 6: PFL, solo-in-place and the direct output each get a reason', () => {
    assert.match(read(`${SS}/pagesRoute.tsx`), /'PFL listens BEFORE the fader, in mono: you would not hear the fader or the pan\.'/);
  });
});

describe('Phase 2 · DJ checks: the right answer is never the one long line', () => {
  it('every UnderstandingCheck on the 24 screens', () => {
    const STR = /'([^']*)'|"([^"]*)"/g;
    let n = 0;
    for (let i = 1; i <= 24; i++) {
      const f = readdirSync(`${DJ}/pages`).find((x) => x.startsWith(`p${String(i).padStart(2, '0')}`) && x.endsWith('.tsx'));
      if (!f) continue;
      for (const m of read(`${DJ}/pages/${f}`).matchAll(/<UnderstandingCheck([\s\S]*?)\/>/g)) {
        const opts = /options=\{\[([\s\S]*?)\]\}/.exec(m[1]);
        const c = /correct=\{(\d+)\}/.exec(m[1]);
        if (!opts || !c) continue;
        const list = [...opts[1].matchAll(STR)].map((x) => x[1] ?? x[2]);
        assert.ok(longestRatio(list, Number(c[1])) <= 1.45, `${f}: ${list[Number(c[1])]}`);
        assert.match(m[1], /wrong=\{\[/, `${f}: every wrong option has its own reason`);
        n++;
      }
    }
    assert.ok(n >= 15);
  });
});

describe('Phase 2 · end screens', () => {
  it('Sound Systems rows name their own missing goals; the shared rule is said once', () => {
    const p = read(`${SS}/SsPagedLab.tsx`);
    assert.match(p, /detail: goalsLeftLine\(`\$\{labId\}:\$\{i\}`\)/);
    assert.match(p, /howItCounts=\{SS_HOW_A_PAGE_COUNTS\}/);
    assert.match(read(`${SS}/bits.tsx`), /setGoalsLeft\(scope, leftKey \? leftKey\.split\('\|'\) : \[\]\)/);
    assert.match(read(`${SS}/pagesBuild.tsx`), /setGoalsLeft\(scope, unmetKey/);
    assert.match(read(`${SS}/pageMemory.ts`), /return `Left: \$\{shown\}/);
  });
  it('both end guides start with the state-neutral line', () => {
    const line = "start: 'Read WHERE TO START at the top: it names the next thing to do from where you are.',";
    assert.ok(read(`${SS}/soundsystemsScreenGuides.ts`).includes(line));
    assert.ok(read(`${DJ}/djScreenGuides.ts`).includes(line));
  });
  it('the Sound Systems CHECK guide no longer promises the explanation on a wrong tap', () => {
    const g = read(`${SS}/soundsystemsScreenGuides.ts`);
    assert.ok(!g.includes('with an explanation. Keep trying'));
    assert.ok(g.includes('a second wrong pick also shows the explanation'));
  });
});

describe('Phase 2 · bezel captions, the silent learner, the accuracy chip', () => {
  it('captions on the code-like readouts, 14 characters at most', () => {
    const all = [...readdirSync(SS).filter((f) => f.endsWith('.tsx')).map((f) => read(`${SS}/${f}`)), ...readdirSync(`${DJ}/pages`).filter((f) => f.endsWith('.tsx')).map((f) => read(`${DJ}/pages/${f}`))].join('\n');
    const caps = [...all.matchAll(/\{ k: '([^']+)', caption: '([^']+)'/g)];
    assert.ok(caps.length >= 60, String(caps.length));
    for (const [, k, c] of caps) assert.ok(c.length <= 14, `${k}: ${c}`);
    assert.match(all, /\{ k: 'HEADROOM', caption: 'room to clip'/);
    assert.match(all, /\{ k: 'B vs A', caption: '\+ = B is early'/);
  });
  it('DJ: the sound-off line on every screen; ABOUT chip with the lab’s own note', () => {
    assert.match(read(`${DJ}/DjRack.tsx`), /soundOffLine: DJ_SOUND_OFF_LINE,/);
    assert.match(read(`${DJ}/DJSystemsLabScreen.tsx`), /accuracyVariant="about"/);
  });
});

/* ══ checker C1 follow-up (2026-11-14) ═════════════════════════════════════ */

describe('Checker C1 · small items', () => {
  it('an end row’s "Left: …" line ends with a full stop (it is read before "Opens it.")', () => {
    assert.match(read(`${SS}/pageMemory.ts`), /\$\{labels\.length > 2 \? `, \+ \$\{labels\.length - 2\} more` : ''\}\.`;/);
  });
  it('OPERATE: the STEP buttons name the device only, never FIRST / LAST / save first', async () => {
    const op = await import('../src/features/soundsystems/operate.ts');
    for (const s of [...op.POWER_UP, ...op.POWER_DOWN]) assert.doesNotMatch(s.short, /FIRST|LAST|first|last/, s.short);
  });
  it('DJ 11: the GRID tray no longer states the check’s answer', () => {
    assert.ok(!read(`${DJ}/pages/p11Grid.tsx`).includes('the music’s structure finds the one, not the loudest kick'));
  });
  it('DJ 14: "1 semitone", not "1 semitones"', () => {
    assert.match(read(`${DJ}/pages/p14Key.tsx`), /Math\.abs\(B\.keyShift \?\? 0\) === 1 \? 'semitone' : 'semitones'/);
  });
  it('TROUBLESHOOT: the step line follows the walk (changed reading, solved)', () => {
    const t = read(`${SS}/pagesTroubleshoot.tsx`);
    assert.ok(t.includes("solved ? 'Solved. Read WHY, THE FIX and THE WALK below.'"));
    assert.ok(t.includes("stateOf(reading) !== 'ok' ? 'This reading is not healthy."));
  });
});

/* ══ PHASE 3 (the owner's decisions, 2026-11-14) ═══════════════════════════ */

describe('Phase 3 · 7 · the three fault titles, as the owner chose', () => {
  it('renamed', () => {
    const titles = (FAULTS as readonly { title: string }[]).map((f) => f.title);
    for (const t of ['Hum through the system', 'Sound cuts in and out', 'Vocals coming out of the subwoofer']) assert.ok(titles.includes(t), t);
    for (const t of ['Ground loop', 'Intermittent cable or connector', 'Subwoofer receives vocals unintentionally']) assert.ok(!titles.includes(t), t);
  });
});

describe('Phase 3 · 2 · no "N of total" progress counters', () => {
  it('leftWord says what is left', async () => {
    const h = await import('../src/screens/lab/soundsystems/fixHelpers.ts');
    assert.equal(h.leftWord(3, 10), '7 LEFT');
    assert.equal(h.leftWord(10, 10, 'PASS'), 'PASS');
    assert.equal(dj.leftWord(2, 9, 'ALL IN'), '7 LEFT');
  });
  it('the old counters are gone from both labs', () => {
    const ss = readdirSync(SS).filter((f) => f.endsWith('.tsx')).map((f) => read(`${SS}/${f}`)).join('\n');
    for (const old of ['of 10 · ${', 'OF 10 · ${', '} OF ${cases.length}', '${row.done}/${row.total}', '${grade.met.length}/${capstone.requirements.length}', '${correct}/${DESTINATIONS.length}', '${seen.size}/10', 'OF ${VENUE_CASES.length}']) assert.ok(!ss.includes(old), old);
    const d = readdirSync(`${DJ}/pages`).filter((f) => f.endsWith('.tsx')).map((f) => read(`${DJ}/pages/${f}`)).join('\n');
    for (const old of ['${audioOk} / 9', '${powerOk} / 7', '4/4 FOUND', 'FIND ${job + 1}/4', 'FIND ${find + 1}/3', 'FAULT ${i + 1} OF 2']) assert.ok(!d.includes(old), old);
  });
});

describe('Phase 3 · 1 · "done" = work done', () => {
  it('no Sound Systems page marks itself done on opening', () => {
    for (const f of readdirSync(SS).filter((x) => /^pages.*\.tsx$/.test(x))) {
      assert.doesNotMatch(read(`${SS}/${f}`), /useEffect\(\(\) => \{\s*if \(!ctx\.isDone\) ctx\.markDone\(\);/, f);
    }
  });
  it('the bench intro and the LEARN wrap page count on a goal', () => {
    assert.match(read(`${SS}/pagesTroubleshoot.tsx`), /label: 'Find where the example walk stopped', hit: found/);
    assert.match(read(`${SS}/pagesLearnC.tsx`), /label: 'Tap all four practice modes', hit: seenModes\.size >= WRAP_MODES\.length/);
  });
  it('the words no longer say opening counts', () => {
    const g = read(`${SS}/soundsystemsScreenGuides.ts`);
    assert.ok(!g.includes('counts as soon as you open it') && !g.includes('opening it is enough to mark it read'));
  });
});

describe('Phase 3 · 3 · one progress word, the plain model note', () => {
  it('Sound Systems says "module" (the strip’s word), never "page", for its unit', () => {
    assert.ok(!read(`${SS}/SsPagedLab.tsx`).includes('noun="page"'));
    assert.match(read(`${SS}/fixHelpers.ts`), /SS_HOW_A_PAGE_COUNTS = 'A module counts/);
  });
  it('every Sound Systems rack draws a sentence-case model note, no all-caps badge', () => {
    const ss = readdirSync(SS).filter((f) => /^pages.*\.tsx$/.test(f)).map((f) => read(`${SS}/${f}`)).join('\n');
    assert.ok(!/\bbadge: /.test(ss));
    const notes = [...ss.matchAll(/modelNote: '([^']+)'/g)].map((m) => m[1]);
    assert.ok(notes.length >= 25, String(notes.length));
    for (const n of notes) {
      assert.ok(n.length <= 90, n);
      assert.match(n, /^[A-Z]/, n);
      assert.doesNotMatch(n, /[A-Z]{4,}/, `sentence case, no all-caps words: ${n}`);
    }
    assert.match(read(`${SS}/rackLayout.tsx`), /modelNote: rack\.modelNote,/);
  });
});

describe('Phase 3 · 5 · capstone 6: the beginner core first, the rest folded', () => {
  it('five core channels, MORE CHANNELS for the rest', () => {
    const b = read(`${SS}/pagesBuild.tsx`);
    assert.match(b, /MONITOR_CORE_CHANNELS: readonly string\[\] = \['vox', 'gtr', 'bass', 'kick', 'keys'\]/);
    assert.match(b, /channels=\{core \?\? ui\.channels\}/);
    assert.match(b, /\{moreChannels \? <ConsolePanel/);
  });
});

describe('Phase 3 · 3 · DJ’s one progress word is "screen"', () => {
  it('the DJ PagedLab passes unitNoun="screen"; its copy never calls a unit a module', () => {
    assert.match(read(`${DJ}/DJSystemsLabScreen.tsx`), /unitNoun="screen"/);
    assert.doesNotMatch(read(`${DJ}/djScreenGuides.ts`), /\bmodules?\b/i);
  });
});

describe('Checker K1 · the last two progress totals in Sound Systems', () => {
  it('the hub’s WHAT IS LEFT rows and the capstone console card say what is left', () => {
    assert.ok(!read(`${SS}/SoundSystemsLabScreen.tsx`).includes('{r.done}/{r.total}'));
    assert.match(read(`${SS}/SoundSystemsLabScreen.tsx`), /\{leftWord\(r\.done, r\.total, '✓ DONE'\)\}/);
    assert.match(read(`${SS}/pagesBuild.tsx`), /ON THE CONSOLE · \{leftWord\(routeMet, routeReqs\.length, '✓ ALL'\)\}/);
  });
});
