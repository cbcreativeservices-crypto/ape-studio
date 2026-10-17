/**
 * Owner rulings 2026-10-16 on the lab-art HOLDs:
 *  1. Distortion Lab: DRIVE starts at +24 dB, so the first screen already
 *     shows (and plays) the −20 dBFS test sine clipping.
 *  2. Sound Systems venue plan: the people 2.5× their true size, with a
 *     plain "people enlarged for clarity" note; the gear stays true scale.
 *  3. Miking small groups (E11/E13 side and hall): a player almost wholly
 *     behind a nearer one is drawn GHOSTED, never left out.
 *  4. B04 setup 5 (the boom below the frame): the operator holds the pole
 *     LOW — an opt-in, setup-only grip (Rim.zones); every other boom setup
 *     unchanged.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { startingSetups } from '../src/screens/lab/miking/engine/setups.ts';
import { assembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { BOOM_BELOW, FLOOR, GRIP_CLOSE, GRIP_LOW } from '../src/screens/lab/miking/lessons/b04BoomCamera/geometry.ts';
import { SHOTGUN_BODY } from '../src/screens/lab/miking/lessons/shared/fieldmics/fieldMics.ts';
import { SHOTGUN_CAPSULE_MM } from '../src/screens/lab/miking/lessons/shared/field/fieldMics.ts';

const read = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');

test('1 · Distortion: DRIVE starts at +24 dB, and that clips the −20 dBFS sine', () => {
  const cfg = read('screens/lab/fxLabConfigs.tsx');
  const dist = cfg.slice(cfg.indexOf('const distConfig'), cfg.indexOf('export const DistortionLabScreen'));
  const drive = dist.slice(dist.indexOf("label: 'DRIVE'"), dist.indexOf("label: 'TYPE'"));
  assert.match(drive, /initial: 24,/);
  assert.ok(-20 + 24 > 0, 'the driven peak passes the 0 dBFS ceiling');
});

test('2 · Venue plan: people 2.5× with the note; gear at the plan scale', () => {
  const src = read('screens/lab/soundsystems/art/VenueView.tsx');
  assert.match(src, /export const PEOPLE_ENLARGED = 2\.5;/);
  assert.match(src, /export const PEOPLE_NOTE = 'people enlarged for clarity';/);
  assert.match(src, /<FigureAboveSvg key=\{s\} x=\{q\.x\} y=\{q\.y\} pxPerMm=\{PERSON_PX_PER_MM \* PEOPLE_ENLARGED\}/);
  // The note at the plot's own word size (13 units ≈ 9.3 pt on a phone).
  assert.match(src, /fontSize=\{PLOT_FS\}[^>]*>\s*\{PEOPLE_NOTE\}/);
  assert.match(src, /export const PLOT_FS = 13;/);
  // Only the people are enlarged: the factor is defined once and used once.
  assert.equal(src.match(/PEOPLE_ENLARGED/g)?.length, 2);
});

test('3 · Small groups: a hidden player is ghosted, never left out', () => {
  const src = read('screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx');
  assert.doesNotMatch(src, /if \(own && sh && covered\(sh\)\) continue;/);
  assert.match(src, /export const GHOST_ALPHA = 0\.3;/);
  assert.match(src, /a=\{g\.ghost\[i\] \? GHOST_ALPHA : 1\}/);
  assert.match(src, /ghostLines/);
  assert.match(src, /<DashPathEffect intervals=\{\[g\.keyW \* 2\.2, g\.keyW \* 1\.6\]\} \/>/);
  const pages = read('screens/lab/miking/lessons/shared/ensemble/ensemblePages.tsx');
  assert.match(pages, /A player hidden behind a nearer one is drawn faint, with a dashed outline/);
  assert.doesNotMatch(pages, /is named from above\./);
});

const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const armOf = (id: string, variant: string, zones?: readonly string[]) => {
  const l = lessonById(id)!;
  return startingSetups(l, variant, MIC_TYPES).map((s) => {
    const sc = compileScene(l.model, variant, zones ?? s.zones.map((z) => z.id));
    return { zones: s.zones.map((z) => z.id), arms: s.mics.map((m) => assembly(sc, m.pose, micBodyOf(MIC_TYPES[m.typeId])).find((q) => q.piece === 'arm') ?? null) };
  });
};

test('4 · B04 setup 5: the pole goes to the hands held LOW, in one straight line', () => {
  const s5 = armOf('B04', 'close')[4];
  assert.deepEqual(s5.zones, ['b4.below']);
  const arm = s5.arms[0]!;
  assert.ok(dist(arm.b, GRIP_LOW) < 1e-6, 'clamped at the low grip');
  // Chest height: 1.0–1.35 m above the floor.
  const up = FLOOR - GRIP_LOW.y;
  assert.ok(up >= 1000 && up <= 1350, `${up} mm up`);
  // The scene's pole (poleLine: the mic's tail through the front hand) runs
  // on the engine's arm line, so the pole is straight at the hand.
  const tail = { x: BOOM_BELOW.tip.x - BOOM_BELOW.aim.x * (SHOTGUN_CAPSULE_MM + SHOTGUN_BODY.length.mm), y: BOOM_BELOW.tip.y - BOOM_BELOW.aim.y * (SHOTGUN_CAPSULE_MM + SHOTGUN_BODY.length.mm), z: BOOM_BELOW.tip.z - BOOM_BELOW.aim.z * (SHOTGUN_CAPSULE_MM + SHOTGUN_BODY.length.mm) };
  const u = (a: typeof tail, b: typeof tail) => {
    const l = dist(a, b);
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l, z: (b.z - a.z) / l };
  };
  const e = u(arm.a, arm.b);
  const s = u(tail, GRIP_LOW);
  const deg = (Math.acos(Math.min(1, e.x * s.x + e.y * s.y + e.z * s.z)) * 180) / Math.PI;
  assert.ok(deg < 1.5, `bend at the hand ${deg.toFixed(2)}°`);
  // The scene holds it low for that setup only.
  const scene = read('screens/lab/miking/lessons/b04BoomCamera/scene.tsx');
  assert.match(scene, /export const LOW_HOLD_SETUP = 'b4\.below';/);
  assert.match(scene, /const low = mode === 'stub' && v === 'close' && !!setup\?\.includes\(LOW_HOLD_SETUP\);/);
  assert.match(read('screens/lab/miking/engine/scene/PlacementScene.tsx'), /<Instrument view=\{view\} variant=\{variant\} micTypes=\{micTypes\} setup=\{zoneIds\} \/>/);
});

test('4 · every other boom setup keeps its overhead grip; the low grip is setup-only', () => {
  const l = lessonById('B04')!;
  // Without the setup's zones (the studio, the checks) the low grip is not in the scene.
  assert.ok(!compileScene(l.model, 'close').rims.some((r) => r.id === 'grip.low'));
  assert.ok(compileScene(l.model, 'close', ['b4.below']).rims.some((r) => r.id === 'grip.low'));
  assert.ok(!compileScene(l.model, 'close', ['b4.above']).rims.some((r) => r.id === 'grip.low'));
  const close = armOf('B04', 'close');
  for (const s of close) {
    if (s.zones.includes('b4.below')) continue;
    for (const a of s.arms) if (a && a.r > 6) assert.ok(dist(a.b, GRIP_CLOSE) < 1e-6, s.zones.join('+'));
  }
  // The studio (no setup) still clamps a below-the-frame mic overhead, as before.
  const below = startingSetups(l, 'close', MIC_TYPES)[4].mics[0];
  const a0 = assembly(compileScene(l.model, 'close'), below.pose, micBodyOf(MIC_TYPES[below.typeId])).find((q) => q.piece === 'arm')!;
  assert.ok(dist(a0.b, GRIP_CLOSE) < 1e-6);
  // B10, B11 and F09 have no setup-only grips: their drawings cannot change.
  for (const id of ['B10', 'B11', 'F09']) assert.ok(!(lessonById(id)!.model.rims ?? []).some((r) => r.zones), id);
  // The operator change is opt-in in the shared kit.
  const kit = read('screens/lab/miking/lessons/shared/field/LocationArt.tsx');
  assert.match(kit, /opts: \{ rear\?: Vec3; low\?: boolean \} = \{\}/);
  assert.match(kit, /hands = true, low = false \}/);
});
