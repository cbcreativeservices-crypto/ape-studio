/**
 * Wiring round 8 — Sound Systems + DJ Systems (round-7 grading, 2026-10-21).
 * Each fix's ratchet: the wrong wording or the wrong pass fails here.
 *   R7-SS-01  End-fire: the FRONT box is delayed by the rear-to-front travel time.
 *   R7-SS-02  One amplifier paralleling a passive top and a passive sub on one
 *             output passed (no crossover split, rule S2). Amp mixes are now
 *             keyed by output + band; a top and a sub on one output are two
 *             channels, and an amp short of them fails with a plain reason.
 *   R7-SS-03  An aux is usually one performer's mix — one or more wedges, or
 *             one in-ear transmitter.
 *   R7-SS-04  Broadcast: plus the audience mics the PA never carries.
 *   R7-SS-05  Preamp target: the channel AVERAGES around −18 dBFS.
 *   R7-SS-06  A microphone never stands in the MAINS' coverage.
 *   R7-SS-07  Aux 7 (announce → lobby) is PRE everywhere: diagram, page default,
 *             reference build — and the page says why.
 *   R7-SS-08  The split: phantom comes from the DIRECT side only.
 *   R7-SS-09  Hum: the mechanism (shield current; pin-1 problem / unbalanced)
 *             and "same power distribution" — no lighting in the case.
 *   R7-SS-10  Network capstone: the console's outputs must come back down the
 *             link and leave the stagebox (the brief), not a direct run.
 *   R7-SS-11  One rule for monitors: a wedge through the house processor fails
 *             like an in-ear transmitter through it.
 *   R7-SS-12  Tie marks tie lanes of ONE level group only (rule book R8).
 *   R7-DJ-01  MASTER_R evidence is the unplugged PA R cable, not the meter.
 */
import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sys = await import('../src/features/soundsystems/system.ts');
const caps = await import('../src/features/soundsystems/capstones.ts');
const { referenceBuild, Build } = await import('./_ssReferenceBuilds.ts');
const { tieMarks, tieGroup, routeCables } = await import('../src/screens/lab/soundsystems/art/VenueView.tsx');
const { FAULTS } = await import('../src/screens/lab/dj/model/djCapstone.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const cap = (id: string) => caps.CAPSTONES.find((c) => c.id === id)!;
const feedsReq = (id: string) => cap(id).requirements.find((r) => r.id === 'feeds')!;

/** The stereo-subs build with ONE 2-channel amp driving each top AND its sub
 *  from MAIN L / MAIN R — the build the round-7 grader passed. */
function sharedAmpBuild(subOut: 'same' | 'mono' = 'same'): System {
  const b = new Build();
  b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('rx', 'wirelessRx', 'stageR')
    .put('box', 'stagebox', 'stageBox').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('amp', 'amp', 'rack2')
    .put('l', 'passiveSpeaker', 'mainL').put('r', 'passiveSpeaker', 'mainR').put('sl', 'passiveSub', 'subL').put('sr', 'passiveSub', 'subR')
    .link('m1', 'box').link('m2', 'box').link('d1', 'box').link('rx', 'box').link('box', 'con').link('con', 'proc')
    .link('proc', 'amp').link('amp', 'l', 'mainL').link('amp', 'r', 'mainR')
    .link('amp', 'sl', subOut === 'same' ? 'mainL' : 'mainMono').link('amp', 'sr', subOut === 'same' ? 'mainR' : 'mainMono');
  return b.s;
}

describe('R7-SS-01 — end-fire: the front box is delayed', () => {
  const b = src('screens/lab/soundsystems/pagesLearnB.tsx');
  const block = b.slice(b.indexOf('  endfire: {'), b.indexOf('  flown: {'));
  it('names the FRONT box as the delayed one, by the rear-to-front travel time', () => {
    assert.match(block, /the FRONT box delayed by the time sound takes to travel from the rear box to it/);
    assert.match(block, /each box further forward is delayed by the time sound takes to travel to it from the box behind/);
    assert.doesNotMatch(block, /rear box delayed/);
  });
});

describe('R7-SS-02 — a passive top and a passive sub never share one amp channel', () => {
  it('ONE 2-ch amp on MAIN L/R to tops AND subs: four channels, the feeds row fails with the plain reason', () => {
    const s = sharedAmpBuild();
    const over = sys.ampsOverChannels(s);
    assert.equal(over.length, 1);
    assert.equal(over[0].channels, 4);
    assert.deepEqual(over[0].topAndSub, ['mainL', 'mainR']);
    for (const id of ['stereo-subs', 'outdoor', 'festival']) assert.equal(feedsReq(id).test(s, caps.capstoneConsole(cap(id))), false, id);
    const why = feedsReq('stereo-subs').why!(s, caps.capstoneConsole(cap('stereo-subs')))!;
    assert.equal(why, caps.topAndSubWhy(['mainL', 'mainR']));
    assert.match(why, /Tops and subs need their own amp channels after the processor’s crossover/);
    assert.ok(!why.includes('\n'));
    assert.equal(caps.gradeCapstone(cap('stereo-subs'), s, caps.capstoneConsole(cap('stereo-subs'))).pass, false);
  });
  it('subs on MAIN MONO from that same amp: three mixes, still over two channels', () => {
    const over = sys.ampsOverChannels(sharedAmpBuild('mono'));
    assert.equal(over[0].channels, 3);
  });
  it('a top and a sub on one output count as two channels (output + band), so a 2-ch amp can carry exactly that', () => {
    const b = new Build();
    b.put('mic', 'vocalMic', 'stageC').put('con', 'console', 'foh').put('proc', 'processor', 'rack1').put('amp', 'amp', 'rack2')
      .put('c', 'passiveSpeaker', 'mainC').put('sub', 'passiveSub', 'subC')
      .link('mic', 'con').link('con', 'proc').link('proc', 'amp').link('amp', 'c', 'mainMono').link('amp', 'sub', 'mainMono');
    assert.deepEqual(sys.ampsOverChannels(b.s), []);
  });
  it('all ten reference builds still pass, every amp within its channels', () => {
    for (const c of caps.CAPSTONES) {
      const { s, cs } = referenceBuild(c.id);
      assert.deepEqual(caps.gradeCapstone(c, s, cs).unmet, [], c.id);
      assert.deepEqual(sys.ampsOverChannels(s), [], c.id);
    }
  });
});

describe('R7-SS-03 — an aux is usually one performer’s mix', () => {
  it('LEARN and ROUTE say one or more wedges, or one in-ear transmitter', () => {
    assert.match(src('screens/lab/soundsystems/pagesLearnB.tsx'), /Each aux is usually one performer’s mix — one or more wedges, or one in-ear transmitter;/);
    assert.match(src('screens/lab/soundsystems/pagesRoute.tsx'), /Each aux is then usually one performer’s mix — one or more wedges, or one in-ear transmitter\./);
    for (const p of ['pagesLearnB.tsx', 'pagesRoute.tsx']) assert.doesNotMatch(src('screens/lab/soundsystems/' + p), /feeds one wedge amplifier channel/);
  });
});

describe('R7-SS-04..06 — wording', () => {
  it('broadcast: plus the audience mics the PA never carries', () => {
    const c = src('features/soundsystems/console.ts');
    assert.match(c, /the house mix plus a bit more vocal and the audience mics the PA never carries\./);
    assert.doesNotMatch(c, /a lot less of the audience mics/);
  });
  it('the preamp target is an average, not a peak', () => {
    const o = src('screens/lab/soundsystems/pagesOperate.tsx');
    assert.match(o, /so the channel averages around −18 dBFS/);
    assert.doesNotMatch(o, /peaks around −18 dBFS/);
  });
  it('a microphone never stands in the mains’ coverage', () => {
    const c = src('screens/lab/soundsystems/pagesLearnC.tsx');
    // audit R2 R018559: the absolute became the professional rule (2026-10-23)
    assert.match(c, /Keep microphones out of the mains’ coverage where you can\./);
    assert.doesNotMatch(c, /never stand in a loudspeaker’s coverage/);
  });
});

describe('R7-SS-07 — Aux 7 (announce → lobby) is PRE everywhere', () => {
  it('the diagram, the MATRICES page default and its words agree', () => {
    assert.ok(src('screens/lab/soundsystems/art/diagrams.tsx').includes('label="AUX 1–4, 7–10 · PRE"'));
    const r = src('screens/lab/soundsystems/pagesRoute.tsx');
    assert.match(r, /setSend\(s, 'mc', 'aux7', \{ db, tap: mcSend\?\.tap \?\? 'pre' \}\)/);
    assert.doesNotMatch(r, /'aux7', \{ db, tap: mcSend\?\.tap \?\? 'post' \}/);
    assert.match(r, /Its Aux 7 send is PRE-fader, like the monitor sends/);
  });
  it('the matrices reference build sends the announce mic PRE', () => {
    const { cs } = referenceBuild('matrices');
    assert.equal(cs.channels.find((c) => c.id === 'mc')!.sends.aux7?.tap, 'pre');
  });
});

describe('R7-SS-08 — the analog split names its phantom side', () => {
  it('the option blurb and the card: phantom from the DIRECT side; isolated outputs do not pass it', () => {
    const b = src('screens/lab/soundsystems/pagesLearnB.tsx');
    assert.match(b, /Phantom power comes only from the console on the DIRECT side — the isolated outputs do not pass it\./);
    assert.match(b, /Phantom power comes only from the console on the splitter’s DIRECT \(hard-wired\) side; the transformer-isolated outputs do not pass it/);
  });
});

describe('R7-SS-09 — hum: the mechanism and the same power distribution', () => {
  it('names the shield current, the pin-1 problem or unbalanced run, and drops lighting', () => {
    const f = src('features/soundsystems/faults.ts');
    assert.match(f, /where the shield lands on the audio circuit ground instead \(a pin-1 problem\), or the run is unbalanced, that current becomes hum\./);
    assert.match(f, /Feed the console and every powered loudspeaker from the same power distribution, on one ground reference/);
    assert.doesNotMatch(f, /audio and lighting/);
  });
});

describe('R7-SS-10 — network: the outputs come back down the same link', () => {
  const net = cap('network');
  it('the brief is enforced by a RETURNS row', () => {
    assert.match(net.brief, /the console’s outputs come back down the same link to leave the stagebox/);
    const row = net.requirements.find((r) => r.id === 'returns')!;
    assert.match(row.text, /The console’s outputs come back down the same link and leave the stagebox/);
  });
  it('the reference build passes; the same build with a direct console → processor run fails only that row', () => {
    const { s, cs } = referenceBuild('network');
    assert.deepEqual(caps.gradeCapstone(net, s, cs).unmet, []);
    const id = (k: string) => s.placed.find((p) => p.kind === k)!.id;
    const direct: System = { ...s, links: s.links.map((l) => (l.from === id('stagebox') && l.to === id('processor') ? { ...l, from: id('console') } : l)) };
    assert.equal(caps.outputsViaStagebox(direct), false);
    assert.deepEqual(caps.gradeCapstone(net, direct, cs).unmet, ['returns']);
  });
});

describe('R7-SS-11 — monitor feeds come from the console’s auxes, never the house processor', () => {
  it('a wedge (or its amp) fed through the processor fails the feeds row with its own plain reason', () => {
    const { s, cs } = referenceBuild('festival');
    const id = (k: string) => s.placed.find((p) => p.kind === k)!.id;
    const w1 = s.placed.find((p) => p.kind === 'poweredWedge')!.id;
    const viaProc: System = { ...s, links: s.links.map((l) => (l.to === w1 && l.from === id('stagebox') ? { ...l, from: id('processor') } : l)) };
    assert.equal(caps.wedgeFromProcessor(viaProc), true);
    assert.equal(feedsReq('festival').test(viaProc, cs), false);
    assert.equal(feedsReq('festival').why!(viaProc, cs), caps.WEDGE_FROM_PROCESSOR_WHY);
    assert.match(caps.WEDGE_FROM_PROCESSOR_WHY, /Monitor feeds come from the console’s aux outputs/);
    assert.match(caps.IEM_FROM_PROCESSOR_WHY, /^The in-ear transmitter is fed from the loudspeaker processor — that carries the house mix/);
  });
  it('no reference build feeds a wedge through the processor', () => {
    for (const c of caps.CAPSTONES) assert.equal(caps.wedgeFromProcessor(referenceBuild(c.id).s), false, c.id);
  });
});

describe('R7-SS-12 — tie marks tie one level group only (rule book R8)', () => {
  it('the groups: mic/line, loudspeaker, data', () => {
    assert.equal(tieGroup('mic'), 'line');
    assert.equal(tieGroup('line'), 'line');
    assert.equal(tieGroup('instrument'), 'line');
    assert.equal(tieGroup('speaker'), 'speaker');
    assert.equal(tieGroup('digital'), 'data');
  });
  it('line | speaker | speaker | line: only the two speaker lanes are taped', () => {
    const marks = tieMarks([{ c: 0, a: 0, b: 100, g: 'line' }, { c: 4, a: 0, b: 100, g: 'speaker' }, { c: 8, a: 0, b: 100, g: 'speaker' }, { c: 12, a: 0, b: 100, g: 'line' }], true);
    assert.ok(marks.length > 0);
    for (const m of marks) assert.match(m, /^M 1\.8 \S+ L 10\.2 \S+$/, m);
  });
  it('line | line | data: the data lane is never taped in', () => {
    const marks = tieMarks([{ c: 0, a: 0, b: 100, g: 'line' }, { c: 4, a: 0, b: 100, g: 'line' }, { c: 8, a: 0, b: 100, g: 'data' }], false);
    for (const m of marks) assert.match(m, /^M \S+ -2\.2 L \S+ 6\.2$/, m);
  });
  it('speaker | line | speaker: a tie never crosses another group to reach its own kind', () => {
    assert.deepEqual(tieMarks([{ c: 0, a: 0, b: 100, g: 'speaker' }, { c: 4, a: 0, b: 100, g: 'line' }, { c: 8, a: 0, b: 100, g: 'speaker' }], true), []);
  });
  it('every lane the router pushes carries its cable’s group', () => {
    const v = src('screens/lab/soundsystems/art/VenueView.tsx');
    const pushes = v.match(/[vh]Lanes\.push\(\{[^}]*\}\)/g)!;
    assert.equal(pushes.length, 8);
    for (const p of pushes) assert.match(p, /g: tieGroup\([wr]\.l\.level\)/, p);
  });
  it('the outdoor and festival plots still tape their looms', () => {
    for (const id of ['outdoor', 'festival']) {
      const { s } = referenceBuild(id);
      assert.ok(routeCables(s.placed, s.links).ties.length > 0, id);
    }
  });
});

describe('R7-DJ-01 — MASTER_R: the evidence is the unplugged PA R cable', () => {
  const f = FAULTS.MASTER_R;
  it('the evidence names the loose cable and says why the meter cannot prove it', () => {
    assert.match(f.evidence, /at PA R’s input the MASTER R cable was hanging loose/);
    assert.match(f.evidence, /The MASTER meters read before the output stage/);
    assert.doesNotMatch(f.evidence, /^Both MASTER meters were live/);
  });
  it('no distractor clears the mixer’s output on the meter alone', () => {
    const whys = [...f.wrong.cause, ...f.wrong.evidence].map((w) => w.why).join(' ');
    assert.doesNotMatch(whys, /The MASTER R meter was live — the signal left the mixer/);
    assert.match(whys, /reads before the output stage/);
  });
});
