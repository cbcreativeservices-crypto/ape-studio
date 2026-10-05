/**
 * Miking Labs, Lab 1 — the four concert lessons (M06 timpani, M07a concert
 * bass drum, M07b concert snare, M08 headed tambourine): the model and the
 * lesson data, checked against the relationships the sources state.
 *
 *   • every lesson validates (validateLesson), has the 9 journey pages and is
 *     registered in Lab 1 after M01, in order, with its own art;
 *   • every zone's start pose is inside its zone and collision-free for EVERY
 *     mic type the zone allows, in every variant it allows; the middle of each
 *     zone's drawn band is clear of every solid too;
 *   • every zone / part / dim source key resolves to a SOURCES table;
 *   • every placeholder dim is named in the lesson's unknowns;
 *   • the item-writing rules (LESSON_JOURNEY §5) hold for every check;
 *   • per lesson: part counts, sizes, layout and anchors (the 29/26 in pair
 *     and the four-drum set, the 1 m spot, the strike point a third in from
 *     the hoop; 36 × 16 in and the 45 cm diagonal spot; 14 × 6½ in with 10
 *     rods, 14 strands, 2.3 mm rim, "a good 4 in"; Ø 254 mm, the 45° hold,
 *     6–12 in, two staggered jingle rows);
 *   • the kettle's pitch ratios are the Cymatics model's measured series;
 *   • the orchestra plan names each lesson's own instrument at its centre and
 *     keeps every lesson's wedges on the stage.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { aimVec } = await import('../src/screens/lab/miking/engine/geometry/vec.ts');
const { PAGE_IDS } = await import('../src/screens/lab/miking/engine/model/types.ts');
const { KETTLE_SHAPES } = await import('../src/screens/lab/miking/engine/physics/kettle.ts');
const { TIMPANI, TIMP_DIMS, GAP_PAIR, HEAD_Y, strikePoint } = await import('../src/screens/lab/miking/lessons/m06Timpani/model.ts');
const { CBD_DIMS, R: CBD_R, D: CBD_D } = await import('../src/screens/lab/miking/lessons/m07aConcertBassDrum/model.ts');
const { CSN_DIMS, R: CSN_R, D: CSN_D, RIM_Y } = await import('../src/screens/lab/miking/lessons/m07bConcertSnare/model.ts');
const { TAMB_DIMS, POSES, R: TB_R } = await import('../src/screens/lab/miking/lessons/m08HeadedTambourine/model.ts');
const { CONCERT_SNARE_14x65 } = await import('../src/screens/lab/miking/lessons/shared/drums/concertSpec.ts');
const { LESSON_FRAMES, ORCH_BOX, PERC, orchHitTest, toPlan, timpaniShown } = await import('../src/screens/lab/miking/lessons/shared/concert/orchestraPlanModel.ts');

type L = NonNullable<ReturnType<typeof lessonById>>;
const IDS = ['M06', 'M07a', 'M07b', 'M08'] as const;
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const SRC_FILES: Record<(typeof IDS)[number], string[]> = {
  M06: ['timpani'],
  M07a: ['concert_bass_drum', 'timpani'],
  M07b: ['concert_snare', 'snare'],
  M08: ['headed_tambourine', 'congas', 'timpani'],
};
const keysOf = (dirs: string[]) => {
  const keys = new Set<string>();
  const text = dirs.map((d) => read(`docs/labs/miking/${d}/SOURCES.md`)).join('\n') + read('docs/labs/miking/SOURCES_SHARED.md');
  for (const m of text.matchAll(/^\| ([A-Z0-9][A-Z0-9-]+) \|/gm)) keys.add(m[1]);
  return keys;
};

describe('the four concert lessons validate and are registered in Lab 1', () => {
  it('registered after M01, in order, as drums lessons', () => {
    const ids = (LESSONS as readonly { id: string; labId: string }[]).map((l) => l.id);
    const at = IDS.map((id) => ids.indexOf(id));
    assert.ok(at.every((i) => i > ids.indexOf('M01')), `${ids}`);
    assert.deepEqual([...at].sort((a, b) => a - b), at, 'M06, M07a, M07b, M08 in order');
    for (const id of IDS) assert.equal((LESSONS as readonly { id: string; labId: string }[]).find((l) => l.id === id)!.labId, 'drums');
    const art = read('src/screens/lab/miking/data/lessonArt.ts');
    for (const id of IDS) assert.match(art, new RegExp(`\\b${id}: \\{ Instrument: \\w+, labels: \\w+, hitTest: \\w+, StrikeSequence: \\w+, CoupledHeads: \\w+, SettingPlan: orchestraPlanFor\\('\\w+'\\) \\}`));
  });
  for (const id of IDS) {
    it(`${id}: validateLesson is clean; the nine journey pages are there`, () => {
      const l = lessonById(id) as L;
      assert.ok(l, id);
      assert.deepEqual(validateLesson(l, MIC_TYPES), []);
      assert.deepEqual(Object.keys(l.pages).sort(), [...PAGE_IDS].sort());
      assert.equal(l.labId, 'drums');
    });
  }
});

describe('zones: inside, clear, for every allowed mic type and variant', () => {
  for (const id of IDS) {
    const l = lessonById(id) as L;
    const m = l.model;
    it(`${id}: every zone start is inside its zone and collision-free for each mic type`, () => {
      for (const z of l.zones) {
        const types = z.requires?.micTypeIds ?? l.micTypeIds;
        const variants = z.requires?.variant ? [z.requires.variant] : (z.requires?.variants ?? m.variants.map((v) => v.id));
        for (const v of variants) {
          const scene = compileScene(m, v);
          for (const t of types) {
            const body = micBodyOf(MIC_TYPES[t]);
            const hit = checkAssembly(scene, z.start, body);
            assert.equal(hit, null, `${z.id} (${v}, ${t}) hits ${hit?.partId}`);
            assert.ok(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: t, mount: body.mount }, z.start), `${z.id} start not in zone (${v}, ${t})`);
          }
        }
      }
    });
    it(`${id}: the middle of each zone's drawn band is clear of every solid`, () => {
      for (const z of l.zones) {
        assert.ok(z.drawn?.side && z.drawn.top, `${z.id} draws itself in both views`);
        const s = z.drawn!.side!;
        const tp = z.drawn!.top!;
        const p = { x: (s.u0 + s.u1) / 2, y: (s.v0 + s.v1) / 2, z: (tp.v0 + tp.v1) / 2 };
        const v = z.requires?.variant ?? m.defaultVariant;
        const t = (z.requires?.micTypeIds ?? l.micTypeIds)[0];
        const hit = checkAssembly(compileScene(m, v), { p, az: z.start.az, el: z.start.el }, micBodyOf(MIC_TYPES[t]));
        assert.equal(hit, null, `${z.id}: the band's middle hits ${hit?.partId}`);
        // and the start lies inside its own drawn band (the picture agrees with the test)
        assert.ok(z.start.p.x >= s.u0 - 1 && z.start.p.x <= s.u1 + 1 && z.start.p.y >= s.v0 - 1 && z.start.p.y <= s.v1 + 1, `${z.id}: start outside its side band`);
        assert.ok(z.start.p.z >= tp.v0 - 1 && z.start.p.z <= tp.v1 + 1, `${z.id}: start outside its top band`);
      }
    });
    it(`${id}: every recommended starting point faces −x within the dock's ±80° (the engine's aim range)`, () => {
      for (const z of l.zones) {
        assert.ok(Math.abs(z.start.az) <= 80 && Math.abs(z.start.el) <= 80, `${z.id}`);
        assert.ok(aimVec(z.start.az, z.start.el).x < 0.01, `${z.id} faces −x`);
      }
    });
  }
});

describe('sources, unknowns and the item rules', () => {
  for (const id of IDS) {
    const l = lessonById(id) as L;
    const keys = keysOf(SRC_FILES[id]);
    it(`${id}: every zone, part, region and orient src resolves to a SOURCES key`, () => {
      const srcs: string[] = [];
      for (const z of l.zones) srcs.push(z.src);
      for (const p of l.model.parts) if (p.prov.kind === 'sourced' || p.prov.kind === 'trial') srcs.push(p.prov.src);
      for (const r of l.model.regions) if (r.prov.kind === 'sourced' || r.prov.kind === 'trial') srcs.push(r.prov.src);
      for (const o of l.orient) srcs.push(o.src);
      srcs.push(l.sound.head.strikeSrc);
      const missing = [...new Set(srcs)].filter((s) => !keys.has(s));
      assert.deepEqual(missing, []);
    });
    it(`${id}: checks follow the item rules (length cue, absolute words, a why for every wrong option)`, () => {
      const items = [...l.scenarios, ...l.symptoms, ...l.diagnostic];
      let longest = 0;
      for (const s of items) {
        const others = s.options.filter((o) => o !== s.correct);
        const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
        assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: ${s.correct.length} vs ${mean.toFixed(1)}`);
        if (s.options.every((o) => o === s.correct || o.length < s.correct.length)) longest++;
        for (const o of others) {
          assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
          assert.ok(s.why[o], `${s.id}: no why for "${o}"`);
        }
      }
      assert.ok(longest <= items.length / 4, `correct is the longest in ${longest} of ${items.length}`);
    });
    it(`${id}: the quick check is 6 items over the foundations, with a critical hearing item`, () => {
      assert.equal(l.diagnostic.length, 6);
      assert.ok(l.diagnostic.some((d) => d.critical && /distortion limit/.test(d.correct)));
      for (const p of ['instrument', 'sound', 'setting']) assert.equal(l.diagnostic.filter((d) => d.covers === p).length, 2, p);
    });
    it(`${id}: from MICROPHONES on, every page carries a FROM EARLIER check`, () => {
      for (const p of ['microphone', 'placement', 'context'] as const) {
        const ids = l.pages[p].credit.scenarios;
        assert.ok(l.scenarios.some((s) => ids.includes(s.id) && /^FROM EARLIER/.test(s.prompt)), p);
      }
    });
    it(`${id}: no tendency is called a result; the ⓘ note is the starting-points note`, () => {
      for (const z of l.zones) assert.doesNotMatch(z.tendency, /\bresult\b/i);
      assert.match(l.accuracyDetail, /^ABOUT THESE STARTING POINTS\. After our research/);
    });
  }
  it('every placeholder dim is named in its lesson’s unknowns', () => {
    const cases: [string, Record<string, { placeholder?: boolean }>][] = [
      ['M06', TIMP_DIMS],
      ['M07a', CBD_DIMS],
      ['M07b', { ...CSN_DIMS, yFloor: { placeholder: true } }],
      ['M08', TAMB_DIMS],
    ];
    for (const [id, dims] of cases) {
      const named = (lessonById(id) as L).unknowns.flatMap((u) => u.dims);
      for (const [k, d] of Object.entries(dims)) if (d.placeholder) assert.ok(named.includes(k) || (k === 'batterH' && named.includes('yFloor')), `${id}: ${k}`);
    }
  });
});

describe('M06 timpani (timpani/GEOMETRY_PROPOSAL.md)', () => {
  const l = lessonById('M06') as L;
  const m = l.model;
  it('a 29 in and a 26 in pair, larger on the player’s left; the set of four adds 32 and 23 in', () => {
    const two = TIMPANI.filter((t) => !t.four);
    assert.deepEqual(two.map((t) => Math.round(t.d.mm * 10) / 10), [736.6, 660.4]);
    assert.ok(two[0].c.z < 0 && two[1].c.z > 0, 'international order: the larger drum at −z');
    assert.deepEqual(TIMPANI.filter((t) => t.four).map((t) => t.inch), [32, 23]);
    const heads = (v: string) => compileScene(m, v).solids.filter((s) => /^tp\.head\d+$/.test(s.partId)).length;
    assert.equal(heads('two'), 2);
    assert.equal(heads('four'), 4);
  });
  it('the pair’s rim gap is 61.5 mm and no two drums touch', () => {
    const [a, b] = TIMPANI.filter((t) => !t.four);
    assert.ok(Math.abs(b.c.z - a.c.z - a.d.mm / 2 - b.d.mm / 2 - 61.5) < 0.05);
    for (let i = 0; i < TIMPANI.length; i++)
      for (let j = i + 1; j < TIMPANI.length; j++) {
        const p = TIMPANI[i];
        const q = TIMPANI[j];
        assert.ok(Math.hypot(p.c.x - q.c.x, p.c.z - q.c.z) > p.d.mm / 2 + q.d.mm / 2 + 50, `${p.id}–${q.id}`);
      }
  });
  it('the shared spot is about 1 m above the heads, between the two drums', () => {
    const z = l.zones.find((q) => q.id === 'tp.pair')!;
    assert.equal(HEAD_Y - z.start.p.y, 1000);
    assert.ok(Math.abs(z.start.p.z - GAP_PAIR.z) < 1e-9);
    assert.ok(z.distance.min <= 1000 && z.distance.max >= 1000);
    assert.equal(TIMP_DIMS.spotH.mm, 1000);
  });
  it('the strike point is a third of the radius in from the hoop, on the player’s side', () => {
    for (const t of TIMPANI) {
      const s = strikePoint(t);
      assert.ok(Math.abs(t.c.x - s.x - (t.d.mm / 2) * (2 / 3)) < 1e-9);
      assert.ok(s.x < t.c.x, 'toward the player (−x)');
    }
  });
  it('the kettle ratios are the measured principal series against (1,1)', () => {
    const r = (n: number) => KETTLE_SHAPES.find((s) => s.n === n && s.s === 1)!.ratio;
    assert.equal(r(1), 1);
    assert.ok(Math.abs(r(2) - 1.5) < 1e-9 && Math.abs(r(3) - 1.99) < 1e-9 && Math.abs(r(4) - 2.44) < 1e-9);
    assert.ok(r(0) < 1, '(0,1) sits below the note');
    assert.deepEqual(KETTLE_SHAPES.map((s) => s.ratio), [...KETTLE_SHAPES.map((s) => s.ratio)].sort((a, b) => a - b));
    assert.equal(l.sound.head.shapes, 'kettle');
  });
});

describe('M07a concert bass drum (concert_bass_drum/GEOMETRY_PROPOSAL.md)', () => {
  const l = lessonById('M07a') as L;
  it('36 × 16 in; two heads; four locking casters; one variant (the drum never moves)', () => {
    assert.ok(Math.abs(CBD_R * 2 - 914.4) < 1e-9);
    assert.ok(Math.abs(CBD_D - 406.4) < 1e-9);
    assert.equal(l.model.parts.filter((p) => /^cbd\.caster/.test(p.id)).length, 4);
    assert.equal(l.model.variants.length, 1);
  });
  it('the spot starts 45 cm from the playing-head centre, above it, looking diagonally down at the head', () => {
    const z = l.zones.find((q) => q.id === 'cbd.spot')!;
    const p = z.start.p;
    assert.ok(Math.abs(Math.hypot(p.x, p.y, p.z) - 450) < 1e-6);
    assert.ok(p.y < 0 && p.x > 0, 'above the centre, on the player’s side');
    const a = aimVec(z.start.az, z.start.el);
    const t = -p.x / a.x;
    assert.ok(Math.abs(p.y + a.y * t) < 1, 'its axis meets the head at the centre');
    assert.equal(CBD_DIMS.deccaDist.mm, 450);
  });
  it('no zone sits in the mallet’s swing or the damping hands (zone starts clear)', () => {
    const scene = compileScene(l.model, 'set');
    for (const z of l.zones) assert.equal(checkAssembly(scene, z.start, micBodyOf(MIC_TYPES.orchDyn)), null, z.id);
    assert.ok(scene.solids.some((s) => s.partId === 'env.mallet') && scene.solids.some((s) => s.partId === 'env.damp'));
  });
});

describe('M07b concert snare (concert_snare/GEOMETRY_PROPOSAL.md)', () => {
  const l = lessonById('M07b') as L;
  it('14 × 6½ in, 10 rods per head, a 2.3 mm rim, 14-strand cable snares', () => {
    assert.ok(Math.abs(CSN_R * 2 - 355.6) < 1e-9);
    assert.ok(Math.abs(CSN_D - 165.1) < 1e-9);
    assert.equal(CONCERT_SNARE_14x65.rods.n.mm, 10);
    assert.equal(CONCERT_SNARE_14x65.hoop.t.mm, 2.3);
    assert.equal(CONCERT_SNARE_14x65.wires!.strands.mm, 14);
  });
  it('the close zone is 2.5–7.5 cm above the rim; the farther one starts at a good 4 in', () => {
    const top = l.zones.find((z) => z.id === 'csn.top')!;
    assert.deepEqual(top.distance, { min: 25, max: 75 });
    assert.equal(top.refSurface, 'rim');
    assert.equal(l.model.surfaces.find((s) => s.id === 'rim')!.point.y, RIM_Y);
    assert.ok(Math.abs(l.zones.find((z) => z.id === 'csn.whole')!.distance.min - 4 * 25.4) < 1e-9);
  });
  it('the snares are on or off: released, they hang clear of the head', () => {
    const y = (v: string) => (compileScene(l.model, v).solids.find((s) => /^csn\.snares/.test(s.partId))!.shape as { min: { y: number } }).min.y;
    assert.ok(y('off') > y('on'));
  });
  it('the top and bottom mics sit on opposite sides of the drum (the opposite-head sum)', () => {
    const top = l.zones.find((z) => z.id === 'csn.top')!.start.p;
    const bot = l.zones.find((z) => z.id === 'csn.bottom')!.start.p;
    assert.ok(top.y < 0 && bot.y > CSN_D);
    assert.equal(l.copy?.twoMic?.opposite?.surface, 'batter');
  });
  it('the sticks’ reach is on the player’s side, 450 mm above the head', () => {
    const env = l.model.envelopes.find((e) => e.id === 'env.sticks')!.shape as { kind: string; a0: number; a1: number; y0: number };
    assert.equal(env.kind, 'sector');
    assert.ok(env.a0 > Math.PI / 2 && env.a1 < (3 * Math.PI) / 2, 'the player’s half (−x)');
    assert.equal(-env.y0, CSN_DIMS.stickH.mm);
  });
});

describe('M08 headed tambourine (headed_tambourine/GEOMETRY_PROPOSAL.md)', () => {
  const l = lessonById('M08') as L;
  it('Ø 254 mm; held, shaken and mounted; the hold at 45°', () => {
    assert.ok(Math.abs(TB_R * 2 - 254) < 1e-9);
    assert.deepEqual(l.model.variants.map((v) => v.id), ['held', 'shaken', 'mounted']);
    const n = POSES.held.n;
    assert.ok(Math.abs(Math.acos(-n.y) * (180 / Math.PI) - TAMB_DIMS.holdDeg.mm) < 1e-9, 'the head faces 45° up');
    assert.ok(n.x > 0, 'toward the mic side');
  });
  it('the starting distances are 6–12 in (152.4–304.8 mm)', () => {
    for (const z of l.zones.filter((q) => q.kind === 'sourced')) assert.ok(Math.abs(z.distance.min - 152.4) < 1e-9 && Math.abs(z.distance.max - 304.8) < 1e-9, z.id);
  });
  it('each state has at least two starting points (the placement credit is reachable)', () => {
    for (const v of ['held', 'shaken', 'mounted']) assert.ok(l.zones.filter((z) => z.requires?.variant === v).length >= 2, v);
  });
  it('the shake’s sweep is ±150 mm across', () => {
    const e = l.model.envelopes.find((q) => q.id === 'env.shake')!.shape as { min: { z: number }; max: { z: number } };
    assert.ok(e.max.z - e.min.z >= 2 * (TB_R + TAMB_DIMS.shake.mm));
  });
});

describe('the orchestra plan (where it sits)', () => {
  it('names each lesson’s own instrument at its own centre', () => {
    const at = { timpani: timpaniShown(false)[0].c, bassDrum: PERC.bassDrum.c, snare: PERC.snare.c, tambourine: PERC.tambourine.c };
    for (const [id, c] of Object.entries(at)) assert.equal(orchHitTest(c.u, c.v, 1, { scene: 'kit', four: false, wedges: [] }), id);
  });
  it('the timpani frame maps the pair either side of its origin, the larger on the player’s left', () => {
    const f = LESSON_FRAMES.timpani;
    const ds = timpaniShown(false);
    assert.deepEqual(ds.map((d) => d.c), TIMPANI.filter((t) => !t.four).map((t) => toPlan(f, t.c)));
  });
  it('every lesson’s wedges land on the stage, clear of the players’ instruments', () => {
    const own = { M06: 'timpani', M07a: 'bassDrum', M07b: 'snare', M08: 'tambourine' } as const;
    const B = ORCH_BOX.wide;
    for (const id of IDS) {
      for (const w of (lessonById(id) as L).live.wedges) {
        const p = toPlan(LESSON_FRAMES[own[id]], w.p);
        assert.ok(p.u > B.u0 && p.u < B.u1 && p.v > B.v0 && p.v < B.v1, `${id}/${w.id}`);
        const hit = orchHitTest(p.u, p.v, 1, { scene: 'kit', four: false, wedges: [] });
        assert.ok(hit === null || hit === 'brass' || hit === 'strings' || hit === 'winds', `${id}/${w.id} sits on ${hit}`);
      }
    }
  });
});

describe('the shared pages keep M01 as it was', () => {
  it('HOW IT SOUNDS step 3 defaults to the two-headed drum’s words; the kit plan stays the default setting', () => {
    const snd = read('src/screens/lab/miking/pages/PSound.tsx');
    assert.match(snd, /title: 'Two heads, one air'/);
    assert.match(snd, /C\.sound\.pair \?\? TWO_HEADS/);
    const set = read('src/screens/lab/miking/pages/PSetting.tsx');
    assert.match(set, /Own \? \([\s\S]*\) : plan \? \(/);
    assert.match(set, /PW\?\.title \?\? 'On the kit'/);
    assert.equal((lessonById('M01') as L).copy?.sound?.pair, undefined);
  });
});
