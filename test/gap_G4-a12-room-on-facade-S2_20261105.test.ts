/**
 * A12 Meet step 3 draws the organ facade, which does not change with the
 * room, so a ROOM chooser there moved nothing on screen (S2). The opt-out on
 * MeetSpec removes the chooser and its bezel cell for A12 only; the nave plan
 * keeps ROOM, because that is where pews, congregation and PA are drawn.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { ORGAN_FRONT } = R(await import('../src/screens/lab/miking/lessons/a12Organ/art.tsx'));

const LESSONS_DIR = fileURLToPath(new URL('../src/screens/lab/miking/lessons/', import.meta.url));
const read = (f: string) => readFileSync(join(LESSONS_DIR, f), 'utf8').replace(/\r\n/g, '\n');
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : [];
});
const metal = read('shared/metal/metalPages.tsx');
const organ = read('a12Organ/pages.tsx');
const meetFn = metal.slice(metal.indexOf('export function MetalInstrument'), metal.indexOf('2 · HOW IT SOUNDS'));

describe('A12 Meet step 3 has no ROOM control', () => {
  it('the facade really is the same picture in both rooms, so a chooser there could show nothing', () => {
    const m = lessonById('A12')!.model as { variants: { id: string }[]; parts: { id: string; variants?: string[]; listIn?: string[] }[]; regions: { variants?: string[] }[] };
    const [a, b] = m.variants.map((v) => v.id);
    assert.ok(a && b && m.variants.length === 2);
    assert.deepEqual(ORGAN_FRONT.box(a), ORGAN_FRONT.box(b));
    assert.deepEqual(ORGAN_FRONT.labels(a), ORGAN_FRONT.labels(b));
    const listed = (v: string) => m.parts.filter((q) => (!q.variants || q.variants.includes(v)) && (!q.listIn || q.listIn.includes(v))).map((q) => q.id);
    assert.deepEqual(listed(a), listed(b));
    assert.ok(m.regions.every((r) => !r.variants), 'no region depends on the room');
  });

  it('the spec opts out, and the opt-out removes the param, its words and the bezel cell', () => {
    const spec = organ.slice(organ.indexOf('const meet = MetalInstrument('), organ.indexOf('type PageFn'));
    assert.match(spec, /partsVariant: false,/);
    assert.match(metal, /partsVariant\?: false;/);
    assert.match(meetFn, /const vp = spec\.partsVariant === false \? null : variantParam\(p, spec\.variantKey\);/);
    assert.match(meetFn, /\.\.\.\(spec\.partsVariant === false \? \[\] : \[\{ k: spec\.variantKey,/, 'the bezel cell goes with the chooser');
    assert.match(meetFn, /\.\.\.\(vp \? \[vp\] : \[\]\)/);
    assert.match(meetFn, /\{vp && vNote \? <Body>/, 'the room words go with the chooser');
    assert.match(meetFn, /\{ k: 'PART', v: shown \? shown\.short\.toUpperCase\(\) : 'TAP ONE', flex: 1\.5 \}/);
  });
});

describe('everything else keeps its chooser', () => {
  it('A12 is the only lesson that opts out', () => {
    const setters = walk(LESSONS_DIR).filter((f) => /partsVariant: false/.test(readFileSync(f, 'utf8')));
    assert.equal(setters.length, 1, setters.join(', '));
    assert.ok(setters[0].includes('a12Organ') && setters[0].endsWith('pages.tsx'), setters[0]);
  });

  it('the opt-out only touches the parts step of Meet', () => {
    assert.equal((metal.match(/spec\.partsVariant/g) ?? []).length, 2);
    assert.match(metal.slice(metal.indexOf('2 · HOW IT SOUNDS')), /const vp = variantParam\(p, spec\.variantKey\);/);
  });

  it('the A12 nave plan still switches the room and draws it', () => {
    const setting = organ.slice(organ.indexOf('function NavePlan'), organ.indexOf('The whole nave') + 800);
    assert.match(setting, /PLAN_ITEMS\.filter\(\(i\) => !i\.service \|\| variant === 'service'\)/);
    assert.match(organ, /\{ kind: 'options', id: 'room', label: 'ROOM', valueLabel: service \? 'SERVICE' : 'EMPTY', selectedId: variant, onSelect: \(id\) => setVariant\(id\)/);
  });
});
