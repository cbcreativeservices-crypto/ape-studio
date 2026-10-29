/**
 * Slider audit 2026-10-14 — the owner's HOLD decisions for the Miking Labs.
 *
 *  #5  "Miking faders with only 3–4 positions: turn them into tap buttons
 *      instead of a slider." A fader whose whole travel holds just 3 or 4
 *      values is a key that opens its choices (`kind: 'options'`), with the
 *      same choices and the same effect. Fixed lists are written as options;
 *      lists that come from the lesson (sound stages, plan items, parts,
 *      setups…) go through engine/rack/fewStops.ts, which turns them into tap
 *      choices exactly when they hold 3–4 stops.
 *  #23 Audience TURN / sports AIM direction wording: "left/right of centre",
 *      "centre" at 0.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import type { DockParam } from '../src/screens/lab/rack/rackTypes';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const few = R(await import('../src/screens/lab/miking/engine/rack/fewStops.ts'));
const venue = R(await import('../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts'));

const ROOT = 'src/screens/lab/miking';
const read = (p: string) => readFileSync(p, 'utf8');
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.tsx?$/.test(n) ? [join(d, n)] : []));

type Fader = Extract<DockParam, { kind: 'fader' }>;
type Options = Extract<DockParam, { kind: 'options' }>;
const fader = (o: Partial<Fader> = {}): Fader => ({
  kind: 'fader',
  id: 'step',
  label: 'STEP',
  value: 0.5,
  onChange: () => {},
  format: (v) => `full ${v}`,
  formatShort: (v) => `short ${v}`,
  helpKey: 'help',
  ...o,
});

/** Every `kind: 'fader'` object in the Miking sources, with what sits just before it. */
function faders(): { file: string; id: string; obj: string; before: string }[] {
  const out: { file: string; id: string; obj: string; before: string }[] = [];
  for (const f of walk(ROOT)) {
    const s = read(f);
    let i = 0;
    while ((i = s.indexOf("kind: 'fader'", i)) >= 0) {
      const b = s.lastIndexOf('{', i);
      let d = 0;
      let j = b;
      for (; j < s.length; j++) {
        if (s[j] === '{') d++;
        else if (s[j] === '}' && --d === 0) break;
      }
      const obj = s.slice(b, j + 1);
      out.push({ file: relative(ROOT, f).split(sep).join('/'), id: (obj.match(/id: '([^']+)'/) ?? [])[1] ?? '?', obj, before: s.slice(Math.max(0, b - 60), b) });
      i += 10;
    }
  }
  return out;
}

describe('#5 · the few-stops rule (engine/rack/fewStops.ts)', () => {
  it('3 and 4 stops are tap choices; 2 and 5 are not', () => {
    assert.deepEqual([1, 2, 3, 4, 5, 8].map(few.fewStops), [false, false, true, true, false, false]);
  });

  it('tapsWhenFew keeps the id, label, help and readout, lists every stop, and picks with the fader’s own effect', () => {
    const picked: number[] = [];
    const p = few.tapsWhenFew(fader(), 4, 2, (i: number) => `choice ${i}`, (i: number) => picked.push(i)) as Options;
    assert.equal(p.kind, 'options');
    assert.equal(p.id, 'step');
    assert.equal(p.label, 'STEP');
    assert.equal(p.helpKey, 'help');
    assert.equal(p.valueLabel, 'short 0.5', 'the key shows the fader’s short readout');
    assert.equal(p.valueA11y, 'full 0.5', 'the full readout is read aloud');
    assert.deepEqual(p.options.map((o) => o.label), ['choice 0', 'choice 1', 'choice 2', 'choice 3']);
    assert.equal(p.selectedId, '2');
    assert.equal(p.sticky, true, 'the tray stays open so the choices can be A/B’d');
    p.onSelect('3');
    p.onSelect('0');
    assert.deepEqual(picked, [3, 0]);
  });

  it('no stop selected → nothing highlighted; a locked fader keeps its lock; other counts keep the fader', () => {
    assert.equal((few.tapsWhenFew(fader(), 3, -1, String, () => {}) as Options).selectedId, null);
    const locked = fader({ locked: 'why' });
    assert.equal(few.tapsWhenFew(locked, 3, 0, String, () => {}), locked);
    for (const n of [2, 5, 12]) {
      const f = fader();
      assert.equal(few.tapsWhenFew(f, n, 0, String, () => {}), f);
    }
  });

  it('faderUnlessFew drops a fader whose tap twin is already on the dock', () => {
    const f = fader({ id: 'setup' });
    assert.deepEqual(few.faderUnlessFew(3, f), []);
    assert.deepEqual(few.faderUnlessFew(4, f), []);
    assert.deepEqual(few.faderUnlessFew(5, f), [f]);
  });
});

describe('#5 · no Miking fader has a fixed 3–4 stop travel', () => {
  it('no fader snaps to Math.round(v * 2) or (v * 3) — those are tap keys now', () => {
    const bad = faders().filter((f) => /Math\.round\(\w+ \* [23]\)(?!\s*[/*])/.test(f.obj)).map((f) => `${f.file}#${f.id}`);
    assert.deepEqual(bad, []);
  });

  it('the fixed 3–4 choice controls are options keys', () => {
    const want: [string, string, number][] = [
      ['lessons/a12Organ/pages.tsx', 'mode', 3], // HARMONIC
      ['lessons/shared/electric/ampPages.tsx', 'spot', 3],
      ['lessons/shared/keys/keysPages.tsx', 'spot', 3], // the 12-inch speaker and the oval
      ['lessons/spk/pages.tsx', 'spot', 3],
      ['lessons/shared/freereed/ReedSound.tsx', 'shape', 4],
      ['lessons/shared/woodwinds/WindSoundPage.tsx', 'mode', 4], // RESONANCE
      ['lessons/shared/mallets/MSound.tsx', 'shape', 3],
      ['lessons/m11Kit/pages.tsx', 'stage', 4],
    ];
    for (const [file, id] of want) {
      const s = read(join(ROOT, file));
      assert.ok(new RegExp(`kind: 'options',\\s*id: '${id}'`).test(s), `${file}: ${id} is an options key`);
      assert.ok(!faders().some((f) => f.file === file && f.id === id), `${file}: no ${id} fader is left`);
    }
    assert.equal((read(join(ROOT, 'lessons/shared/keys/keysPages.tsx')).match(/kind: 'options', id: 'spot'/g) ?? []).length, 2);
  });

  it('a page whose teaching key became tap choices binds the lane to a fader that is still there', () => {
    assert.match(read(join(ROOT, 'lessons/shared/freereed/ReedSound.tsx')), /params: shapeParams,[\s\S]{0,40}initialParam: 'swing'/);
    assert.match(read(join(ROOT, 'lessons/shared/mallets/MSound.tsx')), /params: shapeParams,\s*initialParam: 'swing'/);
    assert.match(read(join(ROOT, 'lessons/shared/woodwinds/WindSoundPage.tsx')), /initialParam: 'swing'/);
    for (const f of ['lessons/shared/lutes/LuteSound.tsx', 'lessons/shared/guitars/StringSound.tsx']) {
      assert.match(read(join(ROOT, f)), /initialParam: fewStops\(regions\.length\) \? 'swing' : 'region'/, f);
    }
  });
});

describe('#5 · every stepped picker over a lesson list goes through the few-stops rule', () => {
  /** Index-snapping faders left as faders ON PURPOSE: every list here holds 5+ stops.
   *  Ratchet — this list may only SHRINK. */
  const FIVE_PLUS: Readonly<Record<string, string>> = {
    'lessons/b12Parabolic/pages.tsx#part': '7 parts',
    'lessons/m12Tonbak/pages.tsx#shape': 'HEAD_SHAPES: 5',
    'lessons/shared/cymbals/CymbalSound.tsx#shape': 'CYMBAL_SHAPES: 6',
    'lessons/shared/electric/ampPages.tsx#harm': 'HARMONICS: 8',
    'lessons/shared/field/fieldSteps.tsx#pitch': 'PITCHES: 10',
    'lessons/shared/guitars/StringSound.tsx#shape': 'SHAPES: 6 · HEAD_SHAPES: 5',
    'lessons/shared/handdrums/pages/HSound.tsx#shape': 'HEAD_SHAPES: 5',
    'lessons/shared/keys/keysPages.tsx#step': 'MECH_STEPS: 5',
    'lessons/shared/kitPages/kitSoundSteps.tsx#shape': 'CYMBAL_SHAPES: 6',
    'lessons/shared/lutes/LuteSound.tsx#shape': 'SHAPES: 6',
    'lessons/shared/mallets/MSound.tsx#bar': 'every bar of the instrument',
    'lessons/shared/mallets/MTwoMic.tsx#bar': 'every natural bar',
    'lessons/shared/measure/SystemTools.tsx#window': 'WIN_STEPS: 12',
    'lessons/shared/metal/metalPages.tsx#shape': 'bar 5 · disc 6 or 9',
    'lessons/shared/metal/metalPages.tsx#bar': 'every chime bar',
    'lessons/shared/sports/sportsPages.tsx#layer': 'LAYERS: 6',
    'lessons/shared/strings/PStringSound.tsx#shape': 'MAX_SHAPE: 8',
    'lessons/spk/pages.tsx#part': 'LESLIE_PARTS: 8',
    'pages/PSound.tsx#shape': 'HEAD_SHAPES or KETTLE_SHAPES: 5',
  };
  const INDEX = /Math\.round\(\w+ \* \(?(?:Math\.max\(0, )?[\w.]+ - 1\)?\)?\)/;
  const WRAPPED = /(tapsWhenFew\(\s*|faderUnlessFew\([^,()]+,\s*)$/;

  it('an index-snapping fader is wrapped (tapsWhenFew / faderUnlessFew) or holds 5+ stops', () => {
    const loose = [...new Set(faders().filter((f) => INDEX.test(f.obj) && !WRAPPED.test(f.before)).map((f) => `${f.file}#${f.id}`))].sort();
    assert.deepEqual(loose, Object.keys(FIVE_PLUS).sort());
  });

  it('the wrapped pickers cover the sound STEP, worked STEP, ITEM, PART, SETUP, SECTION, TARGET, REGION and PAIR keys', () => {
    const wrapped = faders().filter((f) => WRAPPED.test(f.before));
    const ids = new Set(wrapped.map((f) => f.id));
    for (const id of ['step', 'piece', 'item', 'part', 'setup', 'sec', 'target', 'region', 'pair']) assert.ok(ids.has(id), `a wrapped ${id} picker`);
    assert.ok(wrapped.length >= 55, `${wrapped.length} wrapped pickers`);
  });

  it('the shared HOW IT SOUNDS stepper is tap choices with the stage titles when it has 3–4 stages', () => {
    const s = read(join(ROOT, 'lessons/shared/hand/handPages.tsx'));
    assert.match(s, /export function useStepper\(n: number, hidden: boolean, titles\?: readonly string\[\]\)/);
    assert.match(s, /const params: DockParam\[\] = \[\s*tapsWhenFew\(\s*\{\s*kind: 'fader',\s*id: 'step'/);
    for (const f of walk(ROOT).filter((q) => /useStepper\(n, hidden/.test(read(q)))) {
      assert.match(read(f), /useStepper\(n, hidden, S\.stages\.map\(\(q\) => q\.title\)\)/, f);
    }
  });

  it('a SETUP fader beside its SETUPS key is dropped at 3–4 setups (no second identical key)', () => {
    for (const f of ['pages/PSetups.tsx', 'lessons/f10SpatialField/pages.tsx', 'lessons/shared/ensemble/ensemblePages.tsx', 'lessons/shared/sports/sportsPages.tsx']) {
      const s = read(join(ROOT, f));
      assert.match(s, /\.\.\.faderUnlessFew\((setups|list)\.length, \{\s*kind: 'fader',\s*id: 'setup'/, f);
      assert.match(s, /id: 'pick',\s*label: 'SETUPS'/, `${f}: the SETUPS tap key stays`);
    }
  });
});

describe('#23 · direction lanes read "left/right of centre"', () => {
  it('aimWords / aimShort', () => {
    assert.equal(venue.aimWords(0), 'centre');
    assert.equal(venue.aimWords(0.4), 'centre');
    assert.equal(venue.aimWords(20), '20° left of centre');
    assert.equal(venue.aimWords(-35.2), '35° right of centre');
    assert.equal(venue.aimShort(20), '20°L');
    assert.equal(venue.aimShort(-35), '35°R');
    assert.equal(venue.aimShort(0), '0°');
  });

  it('the sports AIM, the audience TURN and the spatial FRONT lanes all use it', () => {
    const sports = read(join(ROOT, 'lessons/shared/sports/sportsPages.tsx'));
    assert.match(sports, /label: 'AIM',[\s\S]{0,1600}format: \(v\) => aimWords\(Math\.round\(v \* 120 - 60\)\),\s*formatShort: \(\) => aimShort\(aim\),/);
    const aud = read(join(ROOT, 'lessons/shared/broadcast/audiencePages.tsx'));
    assert.match(aud, /label: 'TURN',[\s\S]{0,400}format: \(\) => \(turn === 0 \? 'center: aimed at the middle of the section' : aimWords\(turn\)\),\s*formatShort: \(\) => aimShort\(turn\),/);
    assert.doesNotMatch(aud, /`turned \$\{Math\.abs\(turn\)\}°/);
    const f10 = read(join(ROOT, 'lessons/f10SpatialField/pages.tsx'));
    assert.match(f10, /label: 'FRONT',[\s\S]{0,500}format: \(\) => \(face === 0 \? 'center: facing the scene front' : aimWords\(-face\)\),\s*formatShort: \(\) => aimShort\(-face\),/);
    assert.doesNotMatch(f10, /`turned \$\{Math\.abs\(face\)\}° to the/);
  });

  it('the dish readouts read "at … of centre"', () => {
    const sports = read(join(ROOT, 'lessons/shared/sports/sportsPages.tsx'));
    assert.equal((sports.match(/from the dish, at \$\{aimWords\(want\)\}/g) ?? []).length, 2);
  });
});
