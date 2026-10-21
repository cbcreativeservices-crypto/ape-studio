/**
 * Sound Systems BUILD — round 5 (owner decision 2026-10-21): "allow two
 * cables between the same pair (stage box to in-ear transmitter on Aux 9 and
 * Aux 10) and fix the reference stereo build."
 *
 *  - A SECOND cable between the same two devices is allowed where the far
 *    device has a free input and each cable carries its own console output
 *    (stagebox → in-ear transmitter: Aux 9 and Aux 10). A third (more cables
 *    than inputs), the same output twice, and a second cable that would carry
 *    the same thing (no output chosen on the first, or a link that carries no
 *    console output at all) are refused, each in words.
 *  - The stereo reference feeds the transmitter twice from the stagebox;
 *    nothing reaches it through the loudspeaker processor, and a build that
 *    does is flagged with one plain reason.
 *  - BUILD: each cable its own key and lane, its own OUTPUT key, its own tag
 *    plate on the plot.
 */
import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sys = await import('../src/features/soundsystems/system.ts');
const { CAPSTONES, gradeCapstone, iemTxFromProcessor, IEM_FROM_PROCESSOR_WHY } = await import('../src/features/soundsystems/capstones.ts');
const { referenceBuild, stereoFestivalBuild, Build } = await import('./_ssReferenceBuilds.ts');
const { routeCables, cableKeys, placeFeedTags, placeCableTags, pathSegments, segmentHitsBox } = await import('../src/screens/lab/soundsystems/art/VenueView.tsx');
const { placedToBeams, twinCableTag } = await import('../src/screens/lab/soundsystems/plot.tsx');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type CS = import('../src/features/soundsystems/console.ts').ConsoleState;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const festival = CAPSTONES.find((c) => c.id === 'festival')!;
const grade = (s: System, cs: CS) => gradeCapstone(festival, s, cs);
const kindId = (s: System, k: string) => s.placed.find((p) => p.kind === k)!.id;
const into = (s: System, k: string) => s.links.filter((l) => l.to === kindId(s, k));
const feedsWhy = (s: System, cs: CS) => festival.requirements.find((r) => r.id === 'feeds')!.why?.(s, cs) ?? null;

describe('R5-SS: two cables between one pair — stagebox → in-ear transmitter on Aux 9 and Aux 10', () => {
  it('two cables stagebox → transmitter pass on Aux 9 + 10: a stereo pair, every requirement met', () => {
    const { s, cs } = stereoFestivalBuild();
    const box = kindId(s, 'stagebox');
    const tx = kindId(s, 'iemTx');
    const pair = sys.pairLinks(s, box, tx);
    assert.equal(pair.length, 2);
    assert.deepEqual(pair.map((l) => l.out), ['aux9', 'aux10']);
    assert.deepEqual(into(s, 'iemTx').map((l) => l.from), [box, box], 'both from the stagebox, nothing else into the transmitter');
    assert.deepEqual(sys.consoleWalk(s).pairs.get(kindId(s, 'iemPack')), ['aux9', 'aux10']);
    assert.deepEqual(grade(s, cs).unmet, []);
    assert.equal(grade(s, cs).pass, true);
    // either order of the two cables is the same pair
    const swapped = stereoFestivalBuild('aux10', 'aux9');
    assert.deepEqual(grade(swapped.s, swapped.cs).unmet, []);
  });

  it('a third cable is refused: the transmitter takes two', () => {
    const { s } = stereoFestivalBuild();
    const v = sys.canConnect(s, kindId(s, 'stagebox'), kindId(s, 'iemTx'), 'aux8');
    assert.equal(v.ok, false);
    assert.match(v.ok ? '' : v.reason, /In-ear monitor transmitter has no free input — it takes 2\./);
    assert.equal(sys.connect(s, kindId(s, 'stagebox'), kindId(s, 'iemTx')).ok, false);
  });

  it('the same output twice is refused — on the new cable and on the OUTPUT key', () => {
    const r = referenceBuild('festival');
    const box = kindId(r.s, 'stagebox');
    const tx = kindId(r.s, 'iemTx');
    const s = sys.setLinkOut(r.s, box, tx, 'aux9');
    const v = sys.connect(s, box, tx, 'aux9');
    assert.equal(v.ok, false);
    assert.match(v.ok ? '' : v.reason, /already carries Aux 9 · In-ears L into the in-ear monitor transmitter — a second would be the same signal twice\./);
    // run the second cable with nothing chosen, then try to set it to the first's output
    const two = sys.connect(s, box, tx);
    assert.ok(two.ok);
    assert.equal(sys.setLinkOut(two.system, box, tx, 'aux9', 1), two.system, 'refused: the system comes back unchanged');
    const second = sys.pairLinks(two.system, box, tx)[1];
    assert.ok(!sys.outChoices(two.system, second).includes('aux9'), 'the OUTPUT key never offers the twin’s output');
    assert.ok(sys.outChoices(two.system, second).includes('aux10'));
    const set = sys.setLinkOut(two.system, box, tx, 'aux10', 1);
    assert.deepEqual(sys.pairLinks(set, box, tx).map((l) => l.out), ['aux9', 'aux10']);
  });

  it('a second cable needs the first cable’s output chosen; a link that carries no console output stays one cable', () => {
    const { s } = referenceBuild('festival');
    // the reference's stagebox → transmitter cable carries Aux 8: a second may carry another output
    assert.equal(sys.canConnect(s, kindId(s, 'stagebox'), kindId(s, 'iemTx')).ok, true);
    const bare = sys.setLinkOut(s, kindId(s, 'stagebox'), kindId(s, 'iemTx'), null);
    const v = sys.canConnect(bare, kindId(bare, 'stagebox'), kindId(bare, 'iemTx'));
    assert.equal(v.ok, false);
    assert.match(v.ok ? '' : v.reason, /choose its OUTPUT first, then run a second cable for the other output\./);
    // a mic into the stagebox, the stagebox into the console: one link each
    const mic = s.placed.find((p) => p.kind === 'vocalMic')!.id;
    const m = sys.canConnect(s, mic, kindId(s, 'stagebox'));
    assert.equal(m.ok, false);
    assert.match(m.ok ? '' : m.reason, /^Already connected — one cable carries everything the vocal microphone sends the digital stagebox\./);
    assert.equal(sys.canConnect(s, kindId(s, 'stagebox'), kindId(s, 'console'), 'aux1').ok, false);
    // a loudspeaker still takes one input
    const b = new Build().put('pb', 'playback', 'stageC').put('con', 'console', 'foh').put('top', 'poweredSpeaker', 'mainL').link('pb', 'con').link('con', 'top', 'mainL');
    assert.equal(sys.canConnect(b.s, b.ids.con, b.ids.top, 'mainR').ok, false);
  });

  it('removing one cable of the pair leaves its twin', () => {
    const { s } = stereoFestivalBuild();
    const box = kindId(s, 'stagebox');
    const tx = kindId(s, 'iemTx');
    assert.deepEqual(sys.pairLinks(sys.disconnect(s, box, tx, 1), box, tx).map((l) => l.out), ['aux9']);
    assert.deepEqual(sys.pairLinks(sys.disconnect(s, box, tx, 0), box, tx).map((l) => l.out), ['aux10']);
    assert.equal(sys.pairLinks(sys.disconnect(s, box, tx), box, tx).length, 0, 'no index: every cable between the pair');
    const second = sys.pairLinks(s, box, tx)[1];
    assert.equal(sys.pairIndex(s, second), 1);
    assert.equal(sys.pairIndex(s, { ...second }), 1, 'found by what it carries when the object is a copy');
  });
});

describe('R5-SS: the in-ear transmitter never fed from the loudspeaker processor', () => {
  it('processor → transmitter is flagged, with one plain reason', () => {
    const r = referenceBuild('festival');
    let s = sys.setLinkOut(r.s, kindId(r.s, 'stagebox'), kindId(r.s, 'iemTx'), 'aux9');
    const v = sys.connect(s, kindId(s, 'processor'), kindId(s, 'iemTx'), 'aux10');
    assert.ok(v.ok, 'the cable may be run — it is the check that flags it');
    s = v.system;
    const cs = stereoFestivalBuild().cs;
    assert.equal(iemTxFromProcessor(s), true);
    assert.ok(grade(s, cs).unmet.includes('feeds'));
    assert.equal(feedsWhy(s, cs), IEM_FROM_PROCESSOR_WHY);
    assert.match(IEM_FROM_PROCESSOR_WHY, /^The in-ear transmitter is fed from the loudspeaker processor — that carries the house mix with its EQ, delay and limiting for the PA, not the performer’s in-ear mix\./);
    assert.ok(!IEM_FROM_PROCESSOR_WHY.includes('\n'), 'one line');
  });

  it('the stereo reference passes and has no processor → transmitter link; neither does any capstone reference', () => {
    const { s, cs } = stereoFestivalBuild();
    assert.equal(grade(s, cs).pass, true);
    assert.equal(iemTxFromProcessor(s), false);
    const kind = (id: string) => s.placed.find((p) => p.id === id)!.kind;
    assert.ok(!s.links.some((l) => kind(l.from) === 'processor' && kind(l.to) === 'iemTx'));
    for (const c of CAPSTONES) assert.equal(iemTxFromProcessor(referenceBuild(c.id).s), false, c.id);
    const ref = readFileSync(new URL('./_ssReferenceBuilds.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(ref, /connect\([^)]*'processor'[^)]*'iemTx'/);
  });

  it('the old one-cable workaround is gone from the earlier rounds’ stereo helpers', () => {
    for (const f of ['wiringFix_r2_soundsystems_20261020.test.ts', 'wiringFix_r3_soundsystems_20261021.test.ts', 'wiringFix_r4_soundsystems_20261021.test.ts']) {
      assert.doesNotMatch(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'), /connect\(s, kindId\(s, 'processor'\), kindId\(s, 'iemTx'\)/, f);
    }
  });
});

describe('R5-SS: BUILD shows both cables — two lanes, two tags, two OUTPUT keys', () => {
  const tagsFor = (s: System) => {
    const walk = sys.consoleWalk(s);
    const feed = new Map<string, string>();
    for (const [id, f] of walk.feeds) {
      const pair = walk.pairs.get(id);
      feed.set(id, pair ? `AUX\n${pair[0].slice(3)}+${pair[1].slice(3)}` : String(f));
    }
    const routes = routeCables(s.placed, s.links);
    const ft = placeFeedTags(placedToBeams(s.placed, new Set(sys.trace(s).live), feed), s.placed, routes);
    const tagged = s.links.map((l) => [l, twinCableTag(s, l, walk)] as const).filter((x): x is readonly [typeof x[0], string] => !!x[1]);
    return { routes, ft, tagged, ct: placeCableTags(tagged, s.placed, routes, ft.values()) };
  };

  it('each cable has its own key and its own lane — never drawn over its twin', () => {
    const { s } = stereoFestivalBuild();
    const keys = cableKeys(s.links);
    const [a, b] = sys.pairLinks(s, kindId(s, 'stagebox'), kindId(s, 'iemTx'));
    assert.equal(keys.get(a), `${a.from}-${a.to}`);
    assert.equal(keys.get(b), `${a.from}-${a.to}#2`);
    const routes = routeCables(s.placed, s.links);
    const da = routes.paths.get(keys.get(a)!)!;
    const db = routes.paths.get(keys.get(b)!)!;
    assert.ok(da && db && da !== db);
    // no straight piece of one lies on the other
    const sa = pathSegments(da);
    const sb = pathSegments(db);
    const collinear = (p: number[], q: number[]) =>
      (Math.abs(p[0] - p[2]) < 0.05 && Math.abs(q[0] - q[2]) < 0.05 && Math.abs(p[0] - q[0]) < 3 && Math.min(Math.max(p[1], p[3]), Math.max(q[1], q[3])) - Math.max(Math.min(p[1], p[3]), Math.min(q[1], q[3])) > 0.5) ||
      (Math.abs(p[1] - p[3]) < 0.05 && Math.abs(q[1] - q[3]) < 0.05 && Math.abs(p[1] - q[1]) < 3 && Math.min(Math.max(p[0], p[2]), Math.max(q[0], q[2])) - Math.max(Math.min(p[0], p[2]), Math.min(q[0], q[2])) > 0.5);
    assert.ok(!sa.some((p) => sb.some((q) => collinear(p, q))), 'the two lanes keep CABLE_GAP apart');
    // a single cable keeps the old key
    const mono = referenceBuild('festival').s;
    for (const [l, k] of cableKeys(mono.links)) assert.equal(k, `${l.from}-${l.to}`);
  });

  it('each twin wears its own output on a plate, clear of every lane, tag and device, and the plates never meet', () => {
    const { s } = stereoFestivalBuild();
    const { routes, ft, tagged, ct } = tagsFor(s);
    assert.deepEqual(tagged.map(([, t]) => t), ['AUX 9', 'AUX 10']);
    assert.equal(ct.size, 2);
    const lanes = [...routes.paths].filter(([k]) => !routes.merged.has(k)).flatMap(([, d]) => pathSegments(d));
    const plates = [...ct.values()];
    for (const t of plates) {
      assert.equal(t.clear, true, t.text);
      assert.ok(!lanes.some((sg) => segmentHitsBox(sg, t.box)), `${t.text} on a lane`);
      for (const f of ft.values()) assert.ok(!(t.box.x0 < f.box.x1 - 1 && t.box.x1 > f.box.x0 + 1 && t.box.y0 < f.box.y1 - 1 && t.box.y1 > f.box.y0 + 1), `${t.text} meets a feed tag`);
    }
    const [p, q] = plates.map((t) => t.box);
    assert.ok(!(p.x0 + 1 < q.x1 - 1 && p.x1 - 1 > q.x0 + 1 && p.y0 + 1 < q.y1 - 1 && p.y1 - 1 > q.y0 + 1), 'the two plates meet at most edge to edge');
    // a plate that stands off its cable points at it: the leader ends ON its own cable
    for (const [l, text] of tagged) {
      const t = ct.get(routes.keys.get(l)!)!;
      assert.equal(t.text, text);
      if (!t.leader) continue;
      const own = pathSegments(routes.paths.get(routes.keys.get(l)!)!);
      const { x1, y1 } = t.leader;
      assert.ok(own.some(([ax, ay, bx, by]) => x1 >= Math.min(ax, bx) - 0.1 && x1 <= Math.max(ax, bx) + 0.1 && y1 >= Math.min(ay, by) - 0.1 && y1 <= Math.max(ay, by) + 0.1), `${text}: the dot is on its own cable`);
    }
    // the leaders never cross each other
    const ls = plates.flatMap((t) => (t.leader ? [t.leader] : []));
    if (ls.length === 2) {
      const [m, n] = ls;
      const d = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      assert.ok(!(d(m.x0, m.y0, m.x1, m.y1, n.x0, n.y0) * d(m.x0, m.y0, m.x1, m.y1, n.x1, n.y1) < 0 && d(n.x0, n.y0, n.x1, n.y1, m.x0, m.y0) * d(n.x0, n.y0, n.x1, n.y1, m.x1, m.y1) < 0));
    }
  });

  it('only a cable with a twin is tagged; an unchosen twin reads OUT ?', () => {
    const r = referenceBuild('festival');
    const walk = sys.consoleWalk(r.s);
    assert.ok(r.s.links.every((l) => twinCableTag(r.s, l, walk) === undefined));
    const two = sys.connect(r.s, kindId(r.s, 'stagebox'), kindId(r.s, 'iemTx'));
    assert.ok(two.ok);
    const w2 = sys.consoleWalk(two.system);
    assert.deepEqual(sys.pairLinks(two.system, kindId(r.s, 'stagebox'), kindId(r.s, 'iemTx')).map((l) => twinCableTag(two.system, l, w2)), ['AUX 8', 'OUT ?']);
  });

  it('the page: one OUTPUT key per cable in, a tap removes only that cable, each sets only its own cable, the plot gets the tags', () => {
    const b = src('screens/lab/soundsystems/pagesBuild.tsx');
    assert.match(b, /const selLinks = sel \? feedLinks\(b\.system, sel\.id, b\.walk\) : \[\];/);
    assert.match(b, /selLinks\.map\(\(l, i\) => outputParam\(b, l, sel\.kind, selLinks\.length > 1 \? i \+ 1 : 0\)\)/);
    assert.match(b, /const id = n > 1 \? `output\$\{n\}` : 'output';/);
    assert.match(b, /disconnect\(s, l\.from, l\.to, Math\.max\(0, pairIndex\(s, l\)\)\)/);
    assert.match(b, /setLinkOut\(s, l\.from, l\.to, out, Math\.max\(0, pairIndex\(s, l\)\)\)/);
    assert.match(b, /cableTag=\{\(l\) => twinCableTag\(b\.system, l, b\.walk\)\}/);
    assert.match(b, /FED BY · \{fedByEach\} — two cables, one output each/);
    const v = src('screens/lab/soundsystems/art/VenueView.tsx');
    assert.match(v, /const k = routes\.keys\.get\(l\) \?\? `\$\{l\.from\}-\$\{l\.to\}`;\n {10}const d = routes\.paths\.get\(k\);/);
    assert.match(v, /<G key=\{`tag-\$\{k\}`\}>/);
  });

  it('the words: no line says one cable per pair; the free build says how to run a second', () => {
    const sysSrc = src('features/soundsystems/system.ts');
    assert.doesNotMatch(sysSrc, /'Already connected — tap the link to remove it\.'/);
    const b = src('screens/lab/soundsystems/pagesBuild.tsx');
    assert.match(b, /Tap the same two devices again for a second cable where the far one has a free input — a stereo in-ear feed is two cables from the stagebox to the transmitter, Aux 9 and Aux 10, each with its own OUTPUT key — never the same output twice\./);
    const caps = src('features/soundsystems/capstones.ts');
    assert.match(caps, /the In-ears L\/R pair: Aux 9 \+ 10, two cables from the stagebox\)/);
  });
});
