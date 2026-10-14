/**
 * Slider audit, part 4 — the Miking Labs' faders (owner 2026-10-14: the
 * bottom-dock slider "seemed like it didn't change anything, or it didn't
 * progress smoothly/equally/incrementally").
 *
 *  1. POSITION / AIM lanes span what the mic can REALLY reach (reachOf): a
 *     clip mic on a hoop used to move over 5–8 % of its lane and the rest of
 *     the travel did nothing. Now every stretch of the lane moves the mic.
 *  2. A preview lane's readout names where the mic IS during the drag (the
 *     stop first), not where the finger is (previewMemo).
 *  3. Faders that moved nothing in some states are LOCKED there, with why.
 *  4. The hand-drum context page's LEFT–RIGHT double-tap goes to its own home.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { compileScene, constrainMove, checkAssembly } = R(await import('../src/screens/lab/miking/engine/geometry/collision.ts'));
const { boundsOf } = R(await import('../src/screens/lab/miking/engine/scene/useRig.ts'));
const { micType } = R(await import('../src/screens/lab/miking/data/micTypes.ts'));
const { micBodyOf } = R(await import('../src/screens/lab/miking/engine/model/validate.ts'));
const dock = R(await import('../src/screens/lab/miking/engine/scene/placementDock.ts'));

type Pose = { p: { x: number; y: number; z: number }; az: number; el: number };

/** A rig with the engine's own preview (constrainMove from the live pose). */
function rigFor(lessonId: string, zoneId: string) {
  const L = lessonById(lessonId);
  const z = L.zones.find((q: { id: string }) => q.id === zoneId);
  const variant = z.requires?.variants?.[0] ?? z.requires?.variant ?? L.model.defaultVariant;
  const typeId = z.requires?.micTypeIds?.[0] ?? L.micTypeIds[0];
  const scene = compileScene(L.model, variant);
  const bounds = boundsOf(L, variant);
  const b = micBodyOf(micType(typeId));
  let live: Pose = z.start;
  const rig = {
    lesson: L,
    variant,
    scene,
    bounds,
    body: { A: b, B: b },
    pin: { A: null, B: null },
    stop: { A: null, B: null },
    mics: [{ slot: 'A', typeId, pattern: 'cardioid', pose: z.start, polarity: 1, on: true }],
    preview: (_s: string, to: Pose) => {
      const r = constrainMove(scene, b, live, to, bounds);
      live = r.pose;
      return r;
    },
    commit: () => {},
  };
  return { rig, live: () => live, scene, body: b, start: z.start as Pose };
}

const lanes = (rig: unknown, posAxis: 'x' | 'y' | 'z', aimAxis: 'az' | 'el' = 'el') =>
  dock.placementParams({ rig, slot: 'A', posAxis, setPosAxis: () => {}, aimAxis, setAimAxis: () => {} }) as {
    id: string;
    value: number;
    home?: number;
    onChange: (v: number) => void;
    format: (v: number) => string;
  }[];

describe('Miking POSITION lane spans the reachable stretch (no dead travel)', () => {
  it('a clip mic on the guitar: every 2 % of the lane moves the mic', () => {
    const { rig, live, scene, body, start } = rigFor('C01', 'clip.steel');
    const old = rig.bounds.max.x - rig.bounds.min.x;
    const r = dock.reachOf(rig, 'A', start, 'x', rig.bounds.min.x, rig.bounds.max.x);
    assert.ok(r.hi - r.lo > 20 && r.hi - r.lo < old * 0.3, `the clamp holds the mic to a short stretch (${(r.hi - r.lo).toFixed(0)} of ${old.toFixed(0)} mm)`);
    assert.equal(checkAssembly(scene, { ...start, p: { ...start.p, x: r.lo } }, body), null, 'the lane end is a clear pose');
    assert.equal(checkAssembly(scene, { ...start, p: { ...start.p, x: r.hi } }, body), null, 'the lane end is a clear pose');
    const pos = lanes(rig, 'x').find((p) => p.id === 'pos')!;
    let off = 0;
    let prev = live().p.x;
    for (let k = 0; k <= 50; k++) {
      const v = k / 50;
      pos.onChange(v);
      const want = r.lo + v * (r.hi - r.lo);
      if (Math.abs(live().p.x - want) > 1) off++;
      if (k > 0) assert.ok(live().p.x >= prev - 1e-9, 'moves one way, evenly');
      prev = live().p.x;
    }
    assert.ok(off <= 1, `${off} frames where the mic did not follow the lane`);
  });

  it('the lane value round-trips: the committed pose puts the cap where the finger let go', () => {
    const { rig, live } = rigFor('C01', 'clip.steel');
    const pos = lanes(rig, 'x').find((p) => p.id === 'pos')!;
    pos.onChange(0.3);
    rig.mics[0].pose = live();
    const again = lanes(rig, 'x').find((p) => p.id === 'pos')!;
    assert.ok(Math.abs(again.value - 0.3) < 0.01, `cap at ${again.value.toFixed(3)} after release, finger let go at 0.3`);
  });

  it('a part that closes the lane is named at that end, during the drag', () => {
    const { rig } = rigFor('C01', 'clip.steel');
    const r = dock.reachOf(rig, 'A', rig.mics[0].pose, 'x', rig.bounds.min.x, rig.bounds.max.x);
    const pos = lanes(rig, 'x').find((p) => p.id === 'pos')!;
    const end = r.hiStop ? 1 : r.loStop ? 0 : null;
    assert.ok(end != null, 'the clamp closes at least one end');
    pos.onChange(end!);
    assert.match(pos.format(end!), /^✕ /);
  });

  it('reachOf is cached: a re-render does not walk the geometry again', () => {
    const { rig, start } = rigFor('M01', 'in.near');
    const a = dock.reachOf(rig, 'A', start, 'x', rig.bounds.min.x, rig.bounds.max.x);
    const b = dock.reachOf(rig, 'A', start, 'x', rig.bounds.min.x, rig.bounds.max.x);
    assert.equal(a, b);
  });
});

describe('Miking AIM lane spans the turn the mic really has', () => {
  it('every step of the lane turns the mic; home is the aim home when in reach', () => {
    const { rig, live, start } = rigFor('M03', 'tom2.top');
    const r = dock.reachOf(rig, 'A', start, 'el', -80, 80);
    const aim = lanes(rig, 'x', 'el').find((p) => p.id === 'aim')!;
    let off = 0;
    for (let k = 0; k <= 40; k++) {
      const v = k / 40;
      aim.onChange(v);
      const want = Math.round(Math.ceil(r.lo - 1e-6) + v * (Math.floor(r.hi + 1e-6) - Math.ceil(r.lo - 1e-6)));
      if (Math.abs(live().el - want) > 1) off++;
    }
    assert.ok(off <= 1, `${off} steps where the mic did not turn with the lane`);
    if (r.lo <= 0 && r.hi >= 0) assert.ok(aim.home != null && aim.home > 0 && aim.home < 1);
  });
});

describe('preview lanes print where the mic IS', () => {
  it('previewMemo answers only for the value it noted', () => {
    const m = dock.previewMemo();
    const pose = { p: { x: 1, y: 2, z: 3 }, az: 0, el: 0 };
    assert.equal(m.at(0.5), null);
    m.note(0.5, { pose, blocked: { partId: 'shell', label: 'the shell', piece: 'body' } });
    assert.equal(m.at(0.5)?.pose, pose);
    assert.equal(m.at(0.6), null);
  });
  it('every Miking preview AIM lane reads its held result (no finger-only readout)', () => {
    for (const f of [
      'src/screens/lab/miking/lessons/shared/electric/ampPages.tsx',
      'src/screens/lab/miking/lessons/spk/pages.tsx',
      'src/screens/lab/miking/lessons/shared/hand/handPages.tsx',
      'src/screens/lab/miking/pages/PContext.tsx',
      'src/screens/lab/miking/lessons/shared/handdrums/pages/HContext.tsx',
      'src/screens/lab/miking/lessons/shared/journeyPages.tsx',
    ]) {
      const s = readFileSync(f, 'utf8');
      const previews = (s.match(/rig\.preview\(/g) ?? []).length;
      const held = (s.match(/Held\.note\(v, rig\.preview\(/g) ?? []).length;
      assert.equal(held, previews, `${f}: every rig.preview in a lane is noted`);
    }
  });
});

describe('faders that moved nothing are locked there', () => {
  it('the X/Y ANGLE lane is locked unless the pair is X/Y', () => {
    const s = readFileSync('src/screens/lab/miking/lessons/m09Overheads/PTwoOverheads.tsx', 'utf8');
    assert.match(s, /id: 'angle',[\s\S]{0,700}locked: pid === 'xy' \? undefined :/);
  });
  it('the keys mechanism SWING lane is locked until the bar has been struck (step 3)', () => {
    const s = readFileSync('src/screens/lab/miking/lessons/shared/keys/keysPages.tsx', 'utf8');
    assert.match(s, /id: 'swing'[^\n]*locked: mShown >= 3 \? undefined :/);
  });
  it('the hand-drum context AIM home follows the lane’s own axis', () => {
    const s = readFileSync('src/screens/lab/miking/lessons/shared/handdrums/pages/HContext.tsx', 'utf8');
    assert.match(s, /home: \(\(aimAxis === 'az' \? H\.context\.pose\.az : H\.context\.pose\.el\) - lo\) \/ \(hi - lo\)/);
  });
});

/* ── Part 5 (2026-10-14): a far tap never freezes; preview lanes leave React alone ── */

const C5 = R(await import('../src/screens/lab/miking/engine/geometry/collision.ts'));

/** The most meter units one checkAssembly can spend at a pose (every run, every solid, twice, plus its set-up). */
function checkCost(scene: { solids: unknown[] }, body: unknown, pose: Pose): number {
  let samples = 0;
  for (const sg of C5.assembly(scene, pose, body)) samples += Math.ceil(Math.hypot(sg.b.x - sg.a.x, sg.b.y - sg.a.y, sg.b.z - sg.a.z) / Math.max(sg.r, 4)) + 1;
  const weight = (scene.solids as { shape: { kind: string; pts?: unknown[] } }[]).reduce((w, so) => w + (so.shape.kind === 'prism' ? so.shape.pts!.length : 1), 0);
  return 2 * samples * weight + 600;
}

/** Walk a budgeted move to its end: every call's checks within its budget. */
function chunked(scene: unknown, body: unknown, from: Pose, to: Pose, bounds: unknown) {
  let cur = from;
  const poses: Pose[] = [];
  let worstMs = 0;
  let calls = 0;
  for (; calls < 5000; ) {
    // One sub-step (a check and up to three slides) may finish past the budget.
    const allowed = C5.MOVE_WORK + 4 * checkCost(scene, body, cur);
    const t0 = performance.now();
    const r = C5.constrainMove(scene, body, cur, to, bounds, C5.MOVE_WORK);
    worstMs = Math.max(worstMs, performance.now() - t0);
    calls++;
    assert.ok(r.spent <= allowed, `a call spent ${r.spent} sdf evaluations, budget ${allowed}`);
    cur = r.pose;
    poses.push(cur);
    if (r.done) return { last: r, poses, worstMs, calls };
  }
  throw new Error('the move never finished');
}

describe('a far tap on a placement lane never blocks the JS thread', () => {
  it('the orchestra (the slowest scene): a full-lane move is cut into budgeted calls and still arrives', () => {
    const { rig, start } = rigFor('E14', 'orch.main');
    const to = { ...start, p: { ...start.p, x: rig.bounds.max.x } };
    const one = C5.constrainMove(rig.scene, rig.body.A, start, to, rig.bounds);
    assert.ok(one.spent > C5.MOVE_WORK * 4, 'precondition: the one-shot move is long');
    const c = chunked(rig.scene, rig.body.A, start, to, rig.bounds);
    assert.ok(c.calls > 4, `cut into ${c.calls} calls`);
    assert.ok(c.worstMs < 40, `slowest call ${c.worstMs.toFixed(1)} ms (one-shot was the whole sweep)`);
    const d = Math.hypot(c.last.pose.p.x - one.pose.p.x, c.last.pose.p.y - one.pose.p.y, c.last.pose.p.z - one.pose.p.z);
    assert.ok(d < 1, `arrives where the one-shot move does (off by ${d.toFixed(2)} mm)`);
  });

  it('a chunked move into a part never passes through it (every pose on the way is clear)', () => {
    for (const [lid, zid] of [
      ['M01', 'in.near'],
      ['C01', 'clip.steel'],
      ['M03', 'tom2.top'],
    ] as const) {
      const { rig, start } = rigFor(lid, zid);
      for (const a of ['x', 'y', 'z'] as const)
        for (const e of [rig.bounds.min[a], rig.bounds.max[a]]) {
          const to = { ...start, p: { ...start.p, [a]: e } };
          const startsClear = checkAssembly(rig.scene, start, rig.body.A) == null;
          const c = chunked(rig.scene, rig.body.A, start, to, rig.bounds);
          if (startsClear) for (const p of c.poses) assert.equal(checkAssembly(rig.scene, p, rig.body.A), null, `${lid}/${zid} ${a}→${e}: a pose inside a part`);
          const one = C5.constrainMove(rig.scene, rig.body.A, start, to, rig.bounds);
          assert.equal(c.last.blocked?.partId ?? null, one.blocked?.partId ?? null, `${lid}/${zid} ${a}→${e}: stops at the same part`);
        }
    }
  });

  it('without a budget (the drag worklet) the move runs whole, as before', () => {
    const { rig, start } = rigFor('E14', 'orch.main');
    const r = C5.constrainMove(rig.scene, rig.body.A, start, { ...start, p: { ...start.p, x: rig.bounds.max.x } }, rig.bounds);
    assert.equal(r.done, true);
  });

  it('useRig.preview glides the rest on following macrotasks and commits on arrival', () => {
    const s = readFileSync('src/screens/lab/miking/engine/scene/useRig.ts', 'utf8');
    assert.match(s, /const preview = useCallback\([\s\S]{0,900}constrainMove\(scene, body\[slot\], live\.current\[slot\]\?\.pose \?\? sv\.value, target, bounds, MOVE_WORK\)[\s\S]{0,1200}g\.h = runSoon\(more\)/);
    assert.match(s, /const commit = useCallback\(\s*\(slot: MicSlot\) => \{\s*const g = glide\.current\[slot\];\s*if \(g\.h\) \{\s*g\.owed = true;/);
    for (const fn of ['moveTo', 'jumpTo', 'settle']) assert.match(s, new RegExp(`const ${fn} = useCallback\\(\\s*\\([^)]*\\) => \\{\\s*stopGlide\\(slot\\);`), `${fn} stops a glide first`);
  });
});

describe('preview lanes (onCommit) do not set React state in onChange', () => {
  /** onChange bodies of lanes that also declare onCommit. */
  const previewOnChanges = (s: string) => [...s.matchAll(/onChange: ((?:(?!onChange:)[\s\S])*?)\n\s*onCommit/g)].map((m) => m[1]);
  it('the ensemble, spatial-field and sports MOVE/AIM lanes', () => {
    for (const f of [
      'src/screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx',
      'src/screens/lab/miking/lessons/f10SpatialField/pages.tsx',
      'src/screens/lab/miking/lessons/shared/sports/sportsPages.tsx',
    ]) {
      const bodies = previewOnChanges(readFileSync(f, 'utf8'));
      assert.ok(bodies.length > 0, `${f}: has preview lanes`);
      // Live picture kept (2026-10-14): any setState sits behind an unchanged-step return.
      for (const b of bodies) if (/\bset[A-Z]\w*\(/.test(b)) assert.match(b, /=== live(Step|Aim)\.current\) return;/, `${f}: a preview lane sets state every frame`);
    }
  });
  it('ratchet: no other Miking preview lane does (list may only shrink)', () => {
    // PSetups' SETUP stepper: whole steps only — setIdx/setRiding bail out on an unchanged value.
    // ensemble / f10 / sports (2026-10-14): live picture restored once the lane cap
    // moved to the UI thread — they set state only when the SNAPPED step changes.
    const ALLOWED = new Set([
      'src/screens/lab/miking/pages/PSetups.tsx',
      'src/screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx',
      'src/screens/lab/miking/lessons/f10SpatialField/pages.tsx',
      'src/screens/lab/miking/lessons/shared/sports/sportsPages.tsx',
    ]);
    const bad: string[] = [];
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = `${d}/${n}`;
        return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
      });
    for (const f of walk('src/screens/lab/miking')) {
      if (ALLOWED.has(f)) continue;
      if (previewOnChanges(readFileSync(f, 'utf8')).some((b) => /\bset[A-Z]\w*\(/.test(b))) bad.push(f);
    }
    assert.deepEqual(bad, []);
  });
});

describe('the collision broad phase is exact', () => {
  it('checkAssembly names the same part as testing every sample against every solid, over every lesson zone', () => {
    const ids = new Set<string>();
    const walk = (d: string): void => {
      for (const n of readdirSync(d)) {
        const p = `${d}/${n}`;
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(n)) for (const m of readFileSync(p, 'utf8').matchAll(/['"`]([A-Z]\d{2}[A-Za-z]?)['"`]/g)) ids.add(m[1]);
      }
    };
    walk('src/screens/lab/miking');
    let poses = 0;
    let hits = 0;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const id of [...ids].sort()) {
      const L = lessonById(id);
      if (!L?.zones?.length) continue;
      for (const z of L.zones) {
        const variant = z.requires?.variants?.[0] ?? z.requires?.variant ?? L.model.defaultVariant;
        const typeId = z.requires?.micTypeIds?.[0] ?? L.micTypeIds[0];
        let scene, bounds, body;
        try {
          scene = compileScene(L.model, variant);
          bounds = boundsOf(L, variant);
          body = micBodyOf(micType(typeId));
        } catch {
          continue;
        }
        // The zone's start, and poses scattered round it (many of them inside parts).
        for (let k = 0; k < 20; k++) {
          const s = k === 0 ? 0 : 1;
          const pose = {
            p: { x: z.start.p.x + s * (rnd() - 0.5) * 400, y: z.start.p.y + s * (rnd() - 0.5) * 400, z: z.start.p.z + s * (rnd() - 0.5) * 400 },
            az: z.start.az + s * (rnd() - 0.5) * 120,
            el: z.start.el + s * (rnd() - 0.5) * 120,
          };
          const a = checkAssembly(scene, pose, body);
          const b = C5.checkAssemblyBrute(scene, pose, body);
          assert.deepEqual(a, b, `${id}/${z.id} pose ${k}`);
          poses++;
          if (a) hits++;
        }
        void bounds;
      }
    }
    assert.ok(poses > 500 && hits > 50, `${poses} poses, ${hits} of them blocked`);
  });
});

describe('fader commit lands where the finger let go (live emulator retest 2026-10-14)', () => {
  // A shared value written from JS reaches the UI runtime a moment later, but
  // a JS read is synchronous from the UI runtime: commitNow read poseA back
  // straight after preview wrote it and committed the OLD pose (a tap or a
  // flick on POSITION was saved where the mic had been).
  it('useRig commits the JS-side mirror of the last preview, not a read-back of the shared value', () => {
    const s = readFileSync('src/screens/lab/miking/engine/scene/useRig.ts', 'utf8');
    assert.match(s, /const l = live\.current\[slot\];\n\s*live\.current\[slot\] = null;\n\s*write\(slot, l \? l\.pose :/);
    assert.match(s, /constrainMove\(scene, body\[slot\], live\.current\[slot\]\?\.pose \?\? sv\.value, target, bounds, MOVE_WORK\)/);
    assert.equal((s.match(/live\.current\[slot\] = \{ pose: [rq]\.pose, blocked: [rq]\.blocked \}/g) ?? []).length, 2, 'preview and the glide both update the mirror');
  });
  it('the glide spends a time slice per macrotask, not one fixed work slice', () => {
    const s = readFileSync('src/screens/lab/miking/engine/scene/useRig.ts', 'utf8');
    assert.match(s, /const GLIDE_SLICE_MS = 10;/);
    assert.match(s, /while \(!q\.done && Date\.now\(\) - t0 < GLIDE_SLICE_MS\)/);
  });
  it('a preview lane holds its cap at the release until the commit lands', () => {
    const s = readFileSync('src/screens/lab/rack/ParamLane.tsx', 'utf8');
    assert.match(s, /if \(held\.current && value === held\.current\.from\) return;/);
    assert.match(s, /const HOLD_MS = 1500;/);
    assert.match(s, /const onGrant = useRef\(\(v: number \| null\) => \{\n\s*releaseHold\(\);/, 'a new touch drops the hold');
  });
});

describe('shared-value read-after-write (audit 2026-10-14)', () => {
  it('Harmonograph: a fresh sheet times its draw from 0, not a read-back of progress', () => {
    const s = readFileSync('src/screens/lab/HarmonographMachine.tsx', 'utf8');
    assert.match(s, /const cur = sameRun \? Math\.min\(1, Math\.max\(0, progress\.value\)\) : 0;/);
  });
});
