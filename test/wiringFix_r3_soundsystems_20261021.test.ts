/**
 * Round-3 grade fixes, Sound Systems Lab (owner decisions 2026-10-21) —
 * ratchets for R3-SS-01 … R3-SS-04. Each block fails if the old logic,
 * wording or drawing comes back.
 *  - R3-SS-01 (owner: a dedicated in-ear pair): stereo in-ears pass ONLY on
 *    the In-ears L/R pair, Aux 9 + 10 — never on Aux 7, the lobby's
 *    announce feed (capstone 6 still teaches Announce on Aux 7).
 *  - R3-SS-02 (owner: tighten): a delay takes its own side's main or MONO
 *    (never the front-fill matrix); a front fill its own side's main, MONO
 *    or Matrix 2; the feedback says why.
 *  - R3-SS-03: the LEARN "digital" row names AES3's own cable.
 *  - R3-SS-04: BUILD feed tags sit clear of every cable lane in every
 *    reference build, on a dark keyline plate.
 */
import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const outs = await import('../src/features/soundsystems/outputs.ts');
const { CAPSTONES, gradeCapstone, feedFits } = await import('../src/features/soundsystems/capstones.ts');
const { referenceBuild } = await import('./_ssReferenceBuilds.ts');
const { routeCables, placeFeedTags, pathSegments, segmentHitsBox } = await import('../src/screens/lab/soundsystems/art/VenueView.tsx');
const { placedToBeams } = await import('../src/screens/lab/soundsystems/plot.tsx');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type ConsoleOut = import('../src/features/soundsystems/types.ts').ConsoleOut;
type SlotId = import('../src/features/soundsystems/types.ts').SlotId;
type CS = import('../src/features/soundsystems/console.ts').ConsoleState;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const cap = (id: string) => CAPSTONES.find((c) => c.id === id)!;
const grade = (id: string, s: System, cs: CS = referenceBuild(id).cs) => gradeCapstone(cap(id), s, cs);
const kindId = (s: System, k: string) => s.placed.find((p) => p.kind === k)!.id;
const repoint = (s: System, slot: string, out: ConsoleOut | null): System => {
  const p = s.placed.find((x) => x.slot === slot)!;
  const l = s.links.find((x) => x.to === p.id)!;
  return sys.setLinkOut(s, l.from, l.to, out);
};
/** The festival reference build with its in-ear transmitter fed two outputs. */
function stereoFestival(a: ConsoleOut, b: ConsoleOut): System {
  const r = referenceBuild('festival');
  const s = sys.setLinkOut(r.s, kindId(r.s, 'stagebox'), kindId(r.s, 'iemTx'), a);
  const v = sys.connect(s, kindId(s, 'processor'), kindId(s, 'iemTx'), b);
  assert.ok(v.ok);
  return v.system;
}
const vocalPre = (cs: CS, ...auxes: string[]) => auxes.reduce((acc, a) => con.setSend(acc, 'vox', a, { db: 0, tap: 'pre' }), cs);

describe('R3-SS-01: a dedicated stereo in-ear pair; Announce stays on Aux 7', () => {
  it('the console has In-ears L/R on Aux 9 + 10, used for nothing else; Aux 7 is still Announce', () => {
    const cs = con.bandConsole();
    assert.deepEqual(cs.auxes.find((a) => a.id === 'aux9'), { id: 'aux9', name: 'Aux 9 · In-ears L', purpose: 'iem', masterDb: 0 });
    assert.deepEqual(cs.auxes.find((a) => a.id === 'aux10'), { id: 'aux10', name: 'Aux 10 · In-ears R', purpose: 'iem', masterDb: 0 });
    assert.deepEqual(cs.auxes.find((a) => a.id === 'aux7'), { id: 'aux7', name: 'Aux 7 · Announce', purpose: 'other', masterDb: 0 });
    assert.deepEqual([...outs.IEM_PAIR], ['aux9', 'aux10']);
    assert.ok(!outs.IEM_PAIR.includes('aux7'), 'Announce is never in the in-ear pair');
    assert.equal(outs.isIemPair(['aux7', 'aux8']), false);
    assert.equal(outs.isIemPair(['aux9', 'aux10']), true);
    assert.equal(outs.outTag('aux10'), 'AUX 10');
    assert.match(outs.outUse('aux9'), /one side of the stereo in-ear pair\. Send Aux 9 and Aux 10/);
    // No other part of the lab sends anything to the pair: ROUTE's lobby
    // page and the matrices capstone take Aux 7.
    assert.doesNotMatch(src('screens/lab/soundsystems/pagesRoute.tsx'), /aux9|aux10/);
  });
  it('stereo in-ears pass on Aux 9 + 10 with the vocal pre-fader on both sides', () => {
    const s = stereoFestival('aux9', 'aux10');
    const pack = kindId(s, 'iemPack');
    assert.deepEqual(sys.consoleWalk(s).pairs.get(pack), ['aux9', 'aux10']);
    const cs = vocalPre(referenceBuild('festival').cs, 'aux9', 'aux10');
    assert.deepEqual(grade('festival', s, cs).unmet, []);
    assert.deepEqual(grade('festival', s, vocalPre(referenceBuild('festival').cs, 'aux9')).unmet, ['iemMix'], 'both sides of the pair carry the vocal');
  });
  it('Aux 7 + 8 (Announce + the mono in-ear aux) is NOT a stereo in-ear pass, and the reason is in words', () => {
    const s = stereoFestival('aux7', 'aux8');
    const pack = kindId(s, 'iemPack');
    assert.equal(sys.feedOf(s, pack), '*');
    assert.equal(sys.consoleWalk(s).pairs.has(pack), false);
    assert.ok(grade('festival', s).unmet.includes('feeds'));
    const why = cap('festival').requirements.find((r) => r.id === 'feeds')!.why!(s, referenceBuild('festival').cs) ?? '';
    assert.match(why, /A stereo in-ear mix uses the In-ears L\/R pair: Aux 9 and Aux 10\. Aux 7 is the announce feed for the lobby\./);
    // Any other odd + even pair fails too.
    assert.ok(grade('festival', stereoFestival('aux1', 'aux2')).unmet.includes('feeds'));
  });
  it('mono in-ears still pass on Aux 8 (owner decision 6); one side of the pair alone does not', () => {
    const { s, cs } = referenceBuild('festival');
    assert.deepEqual(grade('festival', s, cs).unmet, []);
    const tx = kindId(s, 'iemTx');
    const into = s.links.find((l) => l.to === tx)!;
    assert.ok(grade('festival', sys.setLinkOut(s, into.from, into.to, 'aux9')).unmet.includes('feeds'));
  });
  it('the same words in BUILD and on the console: requirement text, festival desk columns, the strip', () => {
    const f = cap('festival').requirements;
    assert.match(f.find((r) => r.id === 'feeds')!.text, /the in-ears on Aux 8 \(or, for a stereo mix, the In-ears L\/R pair: Aux 9 \+ 10\)/);
    assert.match(f.find((r) => r.id === 'iemMix')!.text, /for stereo in-ears, both Aux 9 and Aux 10/);
    assert.doesNotMatch(f.map((r) => r.text).join(' '), /Aux 7 \+ 8/);
    const b = src('screens/lab/soundsystems/pagesBuild.tsx');
    assert.match(b, /'send:aux8', 'send:aux9', 'send:aux10'\]/);
    assert.match(b, /aux7: 'LOBBY', aux8: 'MONO', aux9: 'STEREO L', aux10: 'STEREO R'/);
    assert.match(b, /\("AUX 9\+10"\)/);
    assert.ok(src('screens/lab/soundsystems/art/diagrams.tsx').includes('label="AUX 1–4, 7–10 · PRE"'));
  });
  it('capstone 6 (matrices) still teaches and passes Announce on Aux 7', () => {
    const { s, cs } = referenceBuild('matrices');
    assert.deepEqual(grade('matrices', s, cs).unmet, []);
    assert.match(cap('matrices').requirements.find((r) => r.id === 'lobby')!.text, /the mic sent to Aux 7, the matrix taking Aux 7/);
    assert.deepEqual(grade('matrices', s, con.setMatrixInput(cs, 'mx-lobby', 'aux7', null)).unmet, ['lobby']);
  });
});

describe('R3-SS-02: fills and delays on their own feeds, their own side', () => {
  const at = (slot: SlotId) => ({ id: 'x', kind: 'poweredSpeaker' as const, slot });
  it('a delay takes its own side’s main or MONO — never the front-fill matrix', () => {
    for (const [slot, own, other] of [['delayL', 'mainL', 'mainR'], ['delayR', 'mainR', 'mainL']] as const) {
      assert.equal(feedFits(at(slot), own), true, `${slot} ${own}`);
      assert.equal(feedFits(at(slot), 'mainMono'), true, `${slot} MONO`);
      for (const bad of [other, 'mtx2', 'mtx3', 'mtx4', 'aux7'] as const) assert.equal(feedFits(at(slot), bad), false, `${slot} ${bad}`);
    }
  });
  it('a front fill takes its own side’s main, MONO or Matrix 2 — a left fill never MAIN R', () => {
    for (const [slot, own, other] of [['frontFillL', 'mainL', 'mainR'], ['frontFillR', 'mainR', 'mainL']] as const) {
      for (const ok of [own, 'mainMono', 'mtx2'] as const) assert.equal(feedFits(at(slot), ok), true, `${slot} ${ok}`);
      for (const bad of [other, 'mtx1', 'mtx3', 'mtx4', 'aux1'] as const) assert.equal(feedFits(at(slot), bad), false, `${slot} ${bad}`);
    }
  });
  it('the outdoor build: the wrong feeds fail FEEDS, with the reason in plain words', () => {
    const { s, cs } = referenceBuild('outdoor');
    const why = (x: System) => cap('outdoor').requirements.find((r) => r.id === 'feeds')!.why!(x, cs) ?? '';
    const delayOnFills = repoint(s, 'delayL', 'mtx2');
    assert.deepEqual(grade('outdoor', delayOnFills, cs).unmet, ['feeds']);
    assert.match(why(delayOnFills), /A delay speaker takes its own side’s main or MONO — the processor gives it its own level and delay\. Matrix 2 belongs to the front fills/);
    const leftFillOnRight = repoint(s, 'frontFillL', 'mainR');
    assert.deepEqual(grade('outdoor', leftFillOnRight, cs).unmet, ['feeds']);
    assert.match(why(leftFillOnRight), /A front fill needs its own level and delay.*A left fill belongs on the left side\./);
    assert.deepEqual(grade('outdoor', repoint(s, 'frontFillL', 'mainL'), cs).unmet, []);
    assert.deepEqual(grade('outdoor', repoint(s, 'delayR', 'mainMono'), cs).unmet, []);
    assert.match(cap('outdoor').requirements.find((r) => r.id === 'feeds')!.text, /each front fill on Matrix 2, MONO or its own side’s main; each delay on its own side’s main or MONO/);
  });
});

describe('R3-SS-03: the digital row names AES3’s own cable', () => {
  it('110 Ω AES cable on XLR, coax, category cable or fibre', () => {
    assert.match(src('screens/lab/soundsystems/pagesLearnB.tsx'), /cable: '110 Ω AES cable on XLR \(AES3\), coax \(AES3id or MADI\), category cable \(Dante or AVB\) or fibre — clocked from one master'/);
  });
});

describe('R3-SS-04: feed tags clear of the cable lanes, on a keyline plate', () => {
  /** The BUILD plot's tags for a system, exactly as pagesBuild makes them. */
  const tagsFor = (s: System) => {
    const walk = sys.consoleWalk(s);
    const tags = new Map<string, string>();
    for (const [id, f] of walk.feeds) {
      const pair = walk.pairs.get(id);
      tags.set(id, pair ? `AUX ${pair[0].slice(3)}+${pair[1].slice(3)}` : f === '*' ? outs.OUT_UNSET : outs.outTag(f));
    }
    const beams = placedToBeams(s.placed, new Set(sys.trace(s).live), tags);
    const routes = routeCables(s.placed, s.links);
    return { places: placeFeedTags(beams, s.placed, routes), routes };
  };
  const lanesOf = (routes: ReturnType<typeof routeCables>) => [...routes.paths].filter(([k]) => !routes.merged.has(k)).flatMap(([, d]) => pathSegments(d));
  it('every reference build: every tag sits clear of every lane and of every other tag', () => {
    for (const c of CAPSTONES) {
      const { s } = referenceBuild(c.id);
      const { places, routes } = tagsFor(s);
      const lanes = lanesOf(routes);
      const boxes = [...places].map(([b, t]) => ({ feed: b.feed, ...t }));
      assert.ok(boxes.length > 0, c.id);
      for (const t of boxes) {
        assert.equal(t.clear, true, `${c.id} ${t.feed}`);
        assert.ok(!lanes.some((seg) => segmentHitsBox(seg, t.box)), `${c.id} ${t.feed} on a lane`);
      }
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].box;
          const b = boxes[j].box;
          assert.ok(!(a.x0 + 1 < b.x1 - 1 && a.x1 - 1 > b.x0 + 1 && a.y0 + 1 < b.y1 - 1 && a.y1 - 1 > b.y0 + 1), `${c.id}: ${boxes[i].feed} meets ${boxes[j].feed}`);
        }
    }
  });
  it('the graded clashes: the festival pack, the festival sub R and the outdoor sub L are off their lanes', () => {
    const fest = tagsFor(referenceBuild('festival').s).places;
    const pack = [...fest].find(([b]) => b.feed === 'AUX8');
    assert.ok(pack, 'the pack reads AUX8');
    assert.equal(pack![1].clear, true);
    assert.ok(pack![1].box.x0 > 296, 'right of the stagebox’s wedge lanes');
    const subR = [...fest].find(([b]) => b.feed === 'AUX 6' && b.x === 280)!;
    assert.equal(subR[1].clear, true);
    const out = tagsFor(referenceBuild('outdoor').s).places;
    const subL = [...out].find(([b]) => b.feed === 'MONO' && b.x === 80)!;
    assert.equal(subL[1].clear, true);
    // the front-fill L run along y 109 no longer passes through it
    assert.ok(subL[1].box.y0 > 109 || subL[1].box.y1 < 109);
  });
  it('a tag with no clear spot keeps its own and is carried by its plate; plates draw only where cables are', () => {
    const v = src('screens/lab/soundsystems/art/VenueView.tsx');
    assert.match(v, /const plated = links\.length > 0;/);
    assert.match(v, /\{plated \? <Rect x=\{tag\.box\.x0\} y=\{tag\.box\.y0\}[^>]*fill="#0a0b0e"[^>]*stroke=\{beam\.color\}/);
    assert.match(v, /<PlotLabel x=\{tag\.x\} y=\{tag\.y\}/);
    // the stereo pack's wider tag is the known fallback case
    const st = tagsFor(stereoFestival('aux9', 'aux10')).places;
    assert.ok([...st].some(([b]) => b.feed === 'AUX9+10'));
  });
  it('the BARRIER label move (eb7057df) is kept', () => {
    assert.match(src('screens/lab/soundsystems/art/VenueView.tsx'), /const BARRIER_LABEL = \{ x: AUD\.left \+ /);
  });
});
