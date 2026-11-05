/**
 * Instrument audit G5-S2 (2026-11-05), the amplified chain shared by C02, C04
 * and C08.
 *
 * 1. HOW IT SOUNDS said "Still to do for this page's credit" and named the
 *    string step, but MEET_DROP removes that step, so the note could never
 *    clear. A "still to do" may only name a step the learner can see.
 * 2. The worked example's STEP control moved a card and a bezel marker while
 *    the drawing stayed frozen. Every piece now marks the drawing (workedMark,
 *    as in PPlacement), and each piece marks something different.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { guideFor } from '../src/screens/lab/miking/engine/geometry/guides.ts';
import type { RefLine, Shape3, Vec3 } from '../src/screens/lab/miking/engine/model/types.ts';
import { ampModel, type AmpRig } from '../src/screens/lab/miking/lessons/shared/speakers/ampModel.ts';
import { zonesFor } from '../src/screens/lab/miking/lessons/shared/speakers/ampZones.ts';
import { C02_WORKED } from '../src/screens/lab/miking/lessons/c02GuitarAmp/model.ts';
import { C08_WORKED } from '../src/screens/lab/miking/lessons/c08BassAmp/model.ts';
import { wurliModel } from '../src/screens/lab/miking/lessons/shared/keys/wurliModel.ts';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const AMP = read('src/screens/lab/miking/lessons/shared/electric/ampPages.tsx');
const PLACEMENT = read('src/screens/lab/miking/pages/PPlacement.tsx');

const region = (src: string, from: string, to: string) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `${from} is defined`);
  return stripTypeScriptTypes(src.slice(a, b).replace(/^export /gm, ''));
};

/** The credit and the note, as the page computes them, with the page's own lines. */
const soundRegion = () => AMP.slice(AMP.indexOf('function AmpSound('), AMP.indexOf('function AmpSetting('));

test('the note never names the string step MEET IT leaves out', () => {
  const src = soundRegion();
  const note = src.slice(src.indexOf('Still to do for this page'), src.indexOf('</Note>', src.indexOf('Still to do for this page')));
  assert.ok(src.includes("const stringShown = !MEET_DROP.has('string');"), 'the page asks whether the step is shown');
  // The page's own words, run: with the step dropped, only the cone is owed.
  const owed = /const stringOwed = (.+);/.exec(src);
  assert.ok(owed, 'what is owed is worked out once');
  const run = (dropped: boolean, stringDone: boolean, reached: boolean) => {
    const MEET_DROP = new Set(dropped ? ['string'] : []);
    const stringShown = !MEET_DROP.has('string');
    const stringOwed = new Function('stringShown', 'stringDone', `return ${owed[1]};`)(stringShown, stringDone) as boolean;
    const body = /`Still to do[^`]*?(\$\{[\s\S]*)`\}$/.exec(`\`${note}`)![1];
    const st = { steel: false };
    const words = new Function('stringOwed', 'reached', 'st', `return \`${body}\`;`)(stringOwed, reached, st) as string;
    return { showing: !reached || stringOwed, words };
  };
  assert.equal(run(true, false, false).words, 'step the cone through to the end.', 'dropped: only the cone is named');
  assert.equal(run(true, false, true).showing, false, 'dropped: the note clears on the cone alone');
  assert.match(run(false, false, false).words, /three harmonics.*, and step the cone/, 'shown: the string step is still asked for');
  assert.equal(run(false, false, true).showing, true, 'shown: the note stays until the string is done');
});

test('the note and the credit agree, and neither waits for a hidden step', () => {
  const src = soundRegion();
  const effect = src.slice(src.indexOf('if (coneDone.current'), src.indexOf("onInteractive('soundPath')"));
  assert.ok(effect.includes('!stringOwed'), 'soundPath waits only for a string step that is shown');
  assert.ok(!/coneDone\.current && stringDone/.test(src), 'it does not wait for stringDone itself');
  assert.ok(src.includes('{!reached || stringOwed ? <Note tone="warn">'), 'the note shows on the same condition');
});

type Mark = { showZones: boolean; guides: boolean; highlight: string | null; pathsFrom: Vec3 | null; label: { text: string; at: Vec3; align?: string } | null };
type Ctx = { mic: Vec3; head: string; headPart: string | null; guide: ReturnType<typeof guideFor> | null; line: { label: string; foot: Vec3 } | null; envelope: { id: string; shape: Shape3 } | null };
const placed = new Function(`${region(PLACEMENT, 'export function lineFoot', 'export function PPlacement')}; return { lineFoot, workedMark };`)() as {
  lineFoot: (l: RefLine, p: Vec3) => Vec3;
  workedMark: (step: number, x: Ctx) => Mark;
};
const ampWorkedMark = (step: number, mark: Mark, cone: { partId: string; anchor: Vec3 }) => new Function(`${region(AMP, 'export function ampWorkedMark', 'export type AmpPart')}; return ampWorkedMark;`)()(step, mark, cone) as Mark;

/** The same marks the page makes, on the real model and zone of each rig. */
const marksFor = (rig: AmpRig, set: 'guitar' | 'bass', workedId: string) => {
  const model = ampModel(rig, 'test', 'test');
  const zone = zonesFor(rig, set).find((z) => z.id === workedId)!;
  const surface = model.surfaces.find((s) => s.id === zone.refSurface)!;
  const line = model.lines.find((l) => l.id === zone.radial!.line)!;
  const ctx: Ctx = { mic: zone.start.p, head: surface.label, headPart: surface.partId, guide: guideFor(surface, zone.start), line: { label: line.label, foot: placed.lineFoot(line, zone.start.p) }, envelope: model.envelopes[0] ?? null };
  return { model, marks: [0, 1, 2, 3, 4, 5].map((i) => ampWorkedMark(i, placed.workedMark(i, ctx), model.regions[0])) };
};

for (const [rig, set, id] of [['combo', 'guitar', C02_WORKED], ['bass', 'bass', C08_WORKED]] as const) {
  test(`${rig}: every worked piece changes the drawing`, () => {
    const { marks } = marksFor(rig, set, id);
    assert.equal(new Set(marks.map((m) => JSON.stringify(m))).size, 6, 'six pieces, six different marks');
    for (const [i, m] of marks.entries()) assert.ok(m.label || m.guides || m.showZones || m.highlight, `piece ${i + 1} marks the drawing`);
  });

  test(`${rig}: the marks say what the card says`, () => {
    const { marks, model } = marksFor(rig, set, id);
    assert.equal(marks[0].showZones, true, 'where to begin shows the blue zone');
    assert.equal(marks[1].showZones, false, 'and only that piece does');
    assert.equal(marks[1].label?.text, 'THE SPEAKER', 'the speaker piece names the speaker, not the grille');
    assert.ok(model.parts.some((p) => p.id === marks[1].highlight), 'and lights a real part');
    assert.equal(marks[1].highlight, 'spk.cone');
    assert.equal(marks[2].guides, true, 'the distance draws its dimension');
    assert.equal(marks[2].highlight, 'spk.grille', 'measured from the grille, as the card says');
    assert.equal(marks[3].label?.text, 'OFF THE CONE AXIS');
    assert.equal(marks[3].label?.at.y, 0, 'across the cone starts on the axis');
    assert.ok(marks[4].pathsFrom, 'the aim runs along the axis of the mic');
  });
}

test('the reed piano shares these pages: the speaker piece lights its own oval, not a part it does not have', () => {
  const model = wurliModel('test', 'test');
  const none = { showZones: false, guides: false, highlight: null, pathsFrom: null, label: null };
  const m = ampWorkedMark(1, none, model.regions[0]);
  assert.equal(m.highlight, 'wur.cone');
  assert.ok(model.parts.some((p) => p.id === m.highlight), 'the part is on this drawing');
  assert.ok(!model.parts.some((p) => p.id === 'spk.cone'), 'the guitar amp part id would light nothing here');
  assert.equal(m.label?.text, 'THE SPEAKER');
});

test('the marks reach the drawing', () => {
  const step = AMP.slice(AMP.indexOf("key: 'watch'"), AMP.indexOf('badge:', AMP.indexOf("key: 'watch'")));
  for (const prop of ['art={exArt}', 'showZones={exMark.showZones}', 'zoneIds={[exZone.id]}', 'guides={exMark.guides}', 'pathsFrom={exMark.pathsFrom}', 'highlight={exMark.highlight}']) assert.ok(step.includes(prop), prop);
  assert.ok(AMP.includes('id: \'worked.mark\''), 'the mark\'s words are put on the art');
  assert.ok(AMP.includes('the mark on the drawing show the piece being read'), 'the prompt tells the student to look at the drawing');
});
