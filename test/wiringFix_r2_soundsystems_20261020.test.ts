/**
 * Round-2 grade fixes, Sound Systems Lab (2026-10-20) — ratchets for
 * SS-R2-01 … SS-R2-18 (SS-R2-08 is the owner's and unchanged). Each block
 * fails if the wrong logic or wording comes back.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = new Map<string, string>();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const { CAPSTONES, gradeCapstone, feedFits, capstoneConsole } = await import('../src/features/soundsystems/capstones.ts');
const { Build, referenceBuild } = await import('./_ssReferenceBuilds.ts');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type ConsoleOut = import('../src/features/soundsystems/types.ts').ConsoleOut;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const cap = (id: string) => CAPSTONES.find((c) => c.id === id)!;
const unmet = (id: string, s: System, cs = referenceBuild(id).cs) => gradeCapstone(cap(id), s, cs).unmet;
const repoint = (s: System, slot: string, out: ConsoleOut | null): System => {
  const p = s.placed.find((x) => x.slot === slot)!;
  const l = s.links.find((x) => x.to === p.id)!;
  return sys.setLinkOut(s, l.from, l.to, out);
};
const kindId = (s: System, k: string) => s.placed.find((p) => p.kind === k)!.id;

describe('r2_soundsystems', () => {
  it('SS-R2-01: an amplifier passes at most two mixes; the reason is in words', () => {
    const r = referenceBuild('monitors');
    const b = new Build();
    b.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR').put('con', 'console', 'foh')
      .put('amp', 'amp', 'rack1').put('w1', 'wedge', 'mon1').put('w2', 'wedge', 'mon2').put('w3', 'wedge', 'mon3').put('w4', 'wedge', 'mon4')
      .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
      .link('m1', 'con').link('m2', 'con').link('d1', 'con').link('d2', 'con').link('con', 'amp')
      .link('amp', 'w1', 'aux1').link('amp', 'w2', 'aux2').link('amp', 'w3', 'aux3').link('amp', 'w4', 'aux4').link('con', 'l', 'mainL').link('con', 'r', 'mainR');
    assert.deepEqual(unmet('monitors', b.s, r.cs), ['feeds']);
    assert.equal(sys.ampsOverChannels(b.s)[0].outs.length, 4);
    assert.match(cap('monitors').requirements.find((q) => q.id === 'feeds')!.why!(b.s, r.cs) ?? '', /An amplifier has two channels: one mix each/);
    // two amps, two mixes each, pass
    const b2 = new Build();
    b2.put('m1', 'vocalMic', 'stageC').put('m2', 'instrumentMic', 'riserC').put('d1', 'di', 'stageL').put('d2', 'di', 'stageR').put('con', 'console', 'foh')
      .put('a1', 'amp', 'rack1').put('a2', 'amp', 'rack2').put('w1', 'wedge', 'mon1').put('w2', 'wedge', 'mon2').put('w3', 'wedge', 'mon3').put('w4', 'wedge', 'mon4')
      .put('l', 'poweredSpeaker', 'mainL').put('r', 'poweredSpeaker', 'mainR')
      .link('m1', 'con').link('m2', 'con').link('d1', 'con').link('d2', 'con').link('con', 'a1').link('con', 'a2')
      .link('a1', 'w1', 'aux1').link('a1', 'w2', 'aux2').link('a2', 'w3', 'aux3').link('a2', 'w4', 'aux4').link('con', 'l', 'mainL').link('con', 'r', 'mainR');
    assert.deepEqual(unmet('monitors', b2.s, r.cs), []);
    for (const c of CAPSTONES) assert.deepEqual(sys.ampsOverChannels(referenceBuild(c.id).s), [], c.id);
  });
  it('SS-R2-02: stereo in-ears (Aux 7 + 8) pass; no OUTPUT key on the radio hop', () => {
    const r = referenceBuild('festival');
    let s = sys.setLinkOut(r.s, kindId(r.s, 'stagebox'), kindId(r.s, 'iemTx'), 'aux7');
    const v = sys.connect(s, kindId(s, 'processor'), kindId(s, 'iemTx'), 'aux8');
    assert.ok(v.ok);
    s = v.system;
    assert.equal(sys.feedOf(s, kindId(s, 'iemPack')), 'aux8');
    assert.deepEqual(sys.consoleWalk(s).pairs.get(kindId(s, 'iemPack')), ['aux7', 'aux8']);
    assert.deepEqual(unmet('festival', s, r.cs), []);
    const radio = s.links.find((l) => l.to === kindId(s, 'iemPack'))!;
    assert.equal(sys.carriesOutputs(s, radio), false);
    assert.deepEqual(sys.outChoices(s, radio), []);
  });
  it('SS-R2-03: festival has an Aux 8 column and the in-ear vocal PRE check', () => {
    assert.match(src('screens/lab/soundsystems/pagesBuild.tsx'), /'send:aux6', 'send:aux8'\]/);
    const { s, cs } = referenceBuild('festival');
    assert.deepEqual(unmet('festival', s, con.setSend(cs, 'vox', 'aux8', { db: 0, tap: 'post' })), ['iemMix']);
    assert.match(cap('festival').requirements.find((q) => q.id === 'iemMix')!.text, /Aux 8 \(in-ears\) carries the singer’s vocal, PRE-fader/);
  });
  it('SS-R2-04: non-routing capstones start with Aux 6 and Matrix 1 live; the page says so', () => {
    for (const id of ['two-one', 'mono-music']) {
      const cs = capstoneConsole(cap(id));
      assert.ok(con.hears(con.auxBus(cs, 'aux6')).length > 0, id);
      assert.ok(con.hears(con.matrixBus(cs, 'mx-subs')).length > 0, id);
    }
    assert.equal(con.hears(con.auxBus(capstoneConsole(cap('festival')), 'aux6')).length, 0);
    assert.match(src('screens/lab/soundsystems/pagesBuild.tsx'), /CONSOLE_PRESET_NOTE/);
  });
  it('SS-R2-05: a wedge never takes the in-ear aux', () => {
    assert.equal(feedFits({ id: 'x', kind: 'poweredWedge', slot: 'mon1' }, 'aux8'), false);
    assert.deepEqual(unmet('monitors', repoint(referenceBuild('monitors').s, 'mon4', 'aux8')), ['feeds']);
  });
  it('SS-R2-06: delays on their own side, never the lobby or recording; fills on a main or MTX 2', () => {
    const { s } = referenceBuild('outdoor');
    assert.deepEqual(unmet('outdoor', repoint(s, 'delayL', 'mainR')), ['feeds']);
    assert.deepEqual(unmet('outdoor', repoint(s, 'delayL', 'mtx4')), ['feeds']);
    assert.deepEqual(unmet('outdoor', repoint(s, 'frontFillL', 'mtx3')), ['feeds']);
  });
  it('SS-R2-07: reference subs on MAIN MONO; checklist text', () => {
    for (const id of ['stereo-subs', 'outdoor']) {
      const { s } = referenceBuild(id);
      assert.equal(sys.feedOf(s, s.placed.find((p) => p.slot === 'subL')!.id), 'mainMono');
      assert.match(cap(id).requirements.find((q) => q.id === 'feeds')!.text, /the subs on MAIN MONO, a sub aux or matrix/);
    }
  });
  it('SS-R2-09: brief and LEARN agree on the sub’s cabling', () => {
    assert.match(cap('two-one').brief, /two cables \(L and R\) into the sub where it has two inputs, or one cable, a mono feed/);
  });
  it('SS-R2-10/11: the strip splits DCA level (fader) from DCA mute + mute group (mute); labels', () => {
    const d = src('screens/lab/soundsystems/art/diagrams.tsx');
    assert.ok(!d.includes('label="DCA · MUTE GROUP"'));
    assert.ok(d.includes('label="DCA LEVEL"') && d.includes('label="DCA MUTE · MUTE GROUP"'));
    for (const l of ['AUX 1–4, 7–8 · PRE', 'AUX 5–6 · POST', 'DIRECT OUT · PRE/POST']) assert.ok(d.includes(`label="${l}"`), l);
    assert.ok(d.includes("label: 'HIGH-PASS' }"));
    const r = src('screens/lab/soundsystems/pagesRoute.tsx');
    assert.doesNotMatch(r, /A DCA or a mute group acts here too — a hand on the fader/);
    assert.match(r, /Its MUTE works each member’s mute instead, and on this console that silences the pre-fader sends too\./);
  });
  it('SS-R2-12: the console ↔ stagebox pair is drawn as one cable', () => {
    const v = src('screens/lab/soundsystems/art/VenueView.tsx');
    assert.match(v, /merged\.add\(key\(l\)\)/);
    assert.match(v, /if \(routes\.merged\.has\(`\$\{l\.from\}-\$\{l\.to\}`\)\) return null;/);
  });
  it('SS-R2-13: compact wedge tags, the pack tagged, FOH → house left off the stage front', () => {
    const p = src('screens/lab/soundsystems/plot.tsx');
    assert.match(p, /const compactTag = \(tag: string\) => tag\.replace\(\/\^AUX \(\\d\)\$\/, 'AUX\$1'\);/);
    assert.match(p, /case 'iemPack':/);
    assert.match(src('screens/lab/soundsystems/art/VenueView.tsx'), /fohFar\.push\(/);
  });
  it('SS-R2-14/15/17/18: copy', () => {
    assert.match(src('screens/lab/soundsystems/pagesBuild.tsx'), /An analog cable carries one console output; a multicore or a network link carries them all\./);
    const b = src('screens/lab/soundsystems/pagesLearnB.tsx');
    assert.doesNotMatch(b, /must never move a wedge/);
    assert.match(b, /normally PRE-FADER/);
    assert.doesNotMatch(b, /data, not audio/);
    assert.doesNotMatch(cap('festival').venue, /broadcast/);
    assert.doesNotMatch(src('features/soundsystems/faults.ts'), /\bslave/);
  });
  it('SS-R2-16: the centre sub never takes MAIN L alone', () => {
    assert.deepEqual(unmet('mono-music', repoint(referenceBuild('mono-music').s, 'subC', 'mainL')), ['feeds']);
    assert.match(cap('mono-music').requirements.find((q) => q.id === 'feeds')!.text, /the sub on MONO, Aux 6 or Matrix 1/);
  });
  it('all ten reference builds pass', () => {
    for (const c of CAPSTONES) {
      const { s, cs } = referenceBuild(c.id);
      assert.deepEqual(gradeCapstone(c, s, cs).unmet, [], c.id);
    }
  });
});
