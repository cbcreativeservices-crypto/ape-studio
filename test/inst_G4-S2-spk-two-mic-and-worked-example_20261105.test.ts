/**
 * Instrument pass, G4 (2026-11-05). Two bugs on S2, Amplified speakers & Leslie.
 *
 * TWO MICROPHONES: one rig-wide head followed the edited mic, so mic A in front
 * was measured from the open back and read "≈ 33 cm from the open back, aimed
 * ≈ 180° off it" (EDIT FRONT did the same to mic B). Each mic now reads from the
 * side it faces, and the sentence names that mic's head, not the rig's.
 *
 * PLACEMENT, WORKED EXAMPLE: the STEP fader changed the card and a bezel cell
 * while the drawing stayed frozen. Every piece now marks the drawing. The pure
 * rules are run on the real cabinet data.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { micType } from '../src/screens/lab/miking/data/micTypes.ts';
import { compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { guideFor } from '../src/screens/lab/miking/engine/geometry/guides.ts';
import { deriveReadouts, type ReadoutCtx } from '../src/screens/lab/miking/engine/geometry/readouts.ts';
import type { MicPose, MicSlot, RefLine, Shape3, Vec3 } from '../src/screens/lab/miking/engine/model/types.ts';
import { fmtAngle, fmtLen } from '../src/screens/lab/miking/engine/model/units.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { SPK_CABS } from '../src/screens/lab/miking/lessons/spk/geometry.ts';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const SPK = read('src/screens/lab/miking/lessons/spk/pages.tsx');
const JOURNEY = read('src/screens/lab/miking/lessons/shared/journeyPages.tsx');
const PLACEMENT = read('src/screens/lab/miking/pages/PPlacement.tsx');

const slice = (src: string, from: string, to: string) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `${from} is defined`);
  return src.slice(a, b);
};
const region = (src: string, from: string, to: string) => stripTypeScriptTypes(slice(src, from, to).replace(/^export /gm, ''));

const cab = SPK_CABS['1x12'];
const front = cab.zones.find((z) => z.id === 'cab.boundary')!;
const rear = cab.zones.find((z) => z.id === 'cab.rear')!;
const TYPE = 'instDynCard';

/** The page's two mics, each read from `surface(slot)`: the sentence's real inputs. */
function pairRig(surface: (s: MicSlot) => string, rigSurface: string) {
  const scene = compileScene(cab.model, 'open');
  const ctx = { scene, surfaces: cab.model.surfaces, lines: cab.model.lines, zones: cab.zones, variant: 'open', micTypeId: TYPE, body: micBodyOf(micType(TYPE)) } as ReadoutCtx;
  const pose: Record<MicSlot, MicPose> = { A: front.start, B: rear.start };
  const refOf = (s: MicSlot) => ({ surfaceId: surface(s), lineId: 'axis' });
  return {
    lesson: { model: cab.model, zones: cab.zones },
    mics: (['A', 'B'] as const).map((slot) => ({ slot, typeId: TYPE })),
    surfaceId: rigSurface,
    lineId: 'axis',
    refOf,
    shown: (s: MicSlot) => deriveReadouts(ctx, pose[s], surface(s), 'axis'),
  };
}

const micSentence = new Function('micType', 'fmtLen', 'fmtAngle', `${region(JOURNEY, 'export function micSentence', 'const styles = StyleSheet.create')}; return micSentence;`)(micType, fmtLen, fmtAngle) as (rig: unknown, slot: MicSlot, nouns: { inside?: string; outside: string }) => string;

test('two mics: each one reads from the side of the cabinet it faces', () => {
  const init = slice(SPK, 'export function SpkTwoMic', 'const [view, setView]');
  assert.match(init, /slot: 'A'[^\n]*surfaceId: 'grille'/, 'mic A reads from the grille');
  assert.match(init, /slot: 'B'[^\n]*surfaceId: 'back'/, 'mic B reads from the open back');
  const page = slice(SPK, 'export function SpkTwoMic', '/* ═══════════════ 7 · PRACTICE');
  assert.doesNotMatch(page, /setSurfaceId/, 'no rig-wide head follows the edited mic');
});

test('the sentence names the head the numbers come from, whichever mic is edited', () => {
  const own = (s: MicSlot) => (s === 'A' ? 'grille' : 'back');
  // The rig-wide head is deliberately the wrong one for one mic each time.
  for (const wide of ['grille', 'back']) {
    const rig = pairRig(own, wide);
    const a = micSentence(rig, 'A', { outside: 'outside the cabinet' });
    const b = micSentence(rig, 'B', { outside: 'outside the cabinet' });
    assert.match(a, /≈ 4 cm \(1\.6 in\) from the grille/, a);
    assert.match(a, /aimed ≈ 0° off it/, a);
    assert.match(a, /At a suggested starting point: Close, at the edge of the dust cap/, a);
    assert.match(b, /≈ 10 cm \(3\.9 in\) from the open back/, b);
    assert.match(b, /aimed ≈ 0° off it/, b);
    assert.match(b, /At a suggested starting point: Behind the open back/, b);
  }
});

test('a mic with no head of its own reads the same sentence as before', () => {
  const shared = pairRig(() => 'grille', 'grille');
  assert.match(micSentence(shared, 'A', { outside: 'outside the amp' }), /from the grille/);
});

type Mark = { showZones: boolean; guides: boolean; highlight: string | null; pathsFrom: Vec3 | null; label: { text: string; at: Vec3 } | null };
type Ctx = { mic: Vec3; head: string; headPart: string | null; guide: ReturnType<typeof guideFor> | null; line: { label: string; foot: Vec3 } | null; envelope: { id: string; shape: Shape3 } | null };
const placed = new Function(`${region(PLACEMENT, 'export function lineFoot', 'export function PPlacement')}; return { lineFoot, workedMark };`)() as {
  lineFoot: (l: RefLine, p: Vec3) => Vec3;
  workedMark: (step: number, x: Ctx) => Mark;
};
const cabWorkedMark = () => new Function(`${region(SPK, 'function cabWorkedMark', 'function cabNow')}; return cabWorkedMark;`)() as (step: number, last: number, base: Mark, x: { cone: Vec3; conePart: string; headPart: string | null }) => Mark;

const marks = () => {
  const surface = cab.model.surfaces.find((s) => s.id === front.refSurface)!;
  const line = cab.model.lines.find((l) => l.id === front.radial!.line)!;
  const cone = cab.model.regions.find((r) => r.id === 'r.cone')!;
  const ctx: Ctx = { mic: front.start.p, head: surface.label, headPart: surface.partId, guide: guideFor(surface, front.start), line: { label: line.label, foot: placed.lineFoot(line, front.start.p) }, envelope: null };
  const onCab = cabWorkedMark();
  return [0, 1, 2, 3, 4, 5].map((i) => onCab(i, 5, placed.workedMark(i, ctx), { cone: cone.anchor, conePart: cone.partId, headPart: surface.partId }));
};

test('worked example: each of the six pieces changes the drawing', () => {
  const m = marks();
  m.forEach((q, i) => assert.ok(q.label || q.guides || q.showZones || q.highlight, `step ${i + 1} marks the drawing`));
  assert.equal(new Set(m.map((q) => JSON.stringify(q))).size, 6, 'six pieces, six different marks');
  assert.equal(m[0].showZones, true, 'where to begin shows the zone');
  assert.deepEqual([m[1].highlight, m[1].label?.text], ['spk.cone', 'THE SPEAKER'], 'the speaker piece marks the speaker, not the grille');
  assert.equal(m[2].guides, true, 'the distance is dimensioned');
  assert.equal(m[2].highlight, 'spk.grille', 'from the grille');
  assert.equal(m[3].label?.text, 'OFF THE CONE AXIS');
  assert.equal(m[3].pathsFrom?.x, front.start.p.x, 'the across-the-cone path runs from the axis to the mic');
  assert.equal(m[4].label?.text, 'THE AIM');
  assert.equal(m[5].highlight, 'spk.grille', 'clearance marks the grille cloth to keep off');
});

test('worked example: the drawing is handed the marks', () => {
  const place = slice(SPK, 'export function SpkPlacement', "key: 'place'");
  const view = place.slice(place.indexOf('<DualView rig={ex}'));
  for (const prop of ['art={exArt}', 'showZones={exMark.showZones}', 'zoneIds={[exZone.id]}', 'guides={exMark.guides}', 'pathsFrom={exMark.pathsFrom}', 'highlight={exMark.highlight}']) assert.ok(view.includes(prop), prop);
  assert.ok(place.includes('labelsYieldToMic: false'), 'the mark is not hidden by the mic it sits on');
});
