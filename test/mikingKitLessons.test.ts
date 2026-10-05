/**
 * The kit-level lessons (M09 Overheads, M10 Room, M11 Complete Kit Setups)
 * and their shared pieces (lessons/shared/cymbals, kitScene, kitPages) —
 * what a learner READS stays clean (owner ruling 2026-10-04: no source,
 * brand, model or person named; starting-points voice), beyond the shared
 * learner-text test:
 *
 *   • the people, publications and makers these lessons' research met (the
 *     methods have DESCRIPTIVE names on screen: "floor-tom method",
 *     "shoulder method");
 *   • the copy files and pure data (pair words, plan and channel words,
 *     cymbal names, kit part labels) — walked, internal fields skipped;
 *   • every .tsx under the kit lessons and shared kit folders, comments
 *     stripped;
 *   • the item-writing rules for the three lessons' questions;
 *   • no "free", no institutional words, no audio promised (fully silent).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { M09_LESSON } from '../src/screens/lab/miking/lessons/m09Overheads/lesson.ts';
import { M10_LESSON } from '../src/screens/lab/miking/lessons/m10Room/lesson.ts';
import { M11_LESSON } from '../src/screens/lab/miking/lessons/m11Kit/lesson.ts';
import * as M09C from '../src/screens/lab/miking/lessons/m09Overheads/copy.ts';
import * as M09P from '../src/screens/lab/miking/lessons/m09Overheads/copyPairs.ts';
import * as M10C from '../src/screens/lab/miking/lessons/m10Room/copy.ts';
import * as M11C from '../src/screens/lab/miking/lessons/m11Kit/copy.ts';
import { CHANNELS, PLANS } from '../src/screens/lab/miking/lessons/m11Kit/plan.ts';
import { CYMBAL_SPECS } from '../src/screens/lab/miking/lessons/shared/cymbals/cymbalSpec.ts';
import { kitParts } from '../src/screens/lab/miking/lessons/shared/kitScene/kitSceneModel.ts';
import { KIT_MIC_TYPES } from '../src/screens/lab/miking/data/micTypesKit.ts';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';

const LESSONS3 = [M09_LESSON, M10_LESSON, M11_LESSON];

/** The research's people, publications and makers (whole words). */
const KIT_NAMES = [
  'Glyn',
  'Johns',
  'Recorderman',
  'Stamler',
  'Pickford',
  'Brixen',
  'Brinck',
  'Keller',
  'Mike Major',
  'MusicTech',
  'Recording magazine',
  'Universal Audio',
  'UA',
  'B&H',
  'Explora',
  'R[ØO]DE',
  'Rode',
  'Zildjian',
  'Yamaha',
  'Shure',
  'DPA',
  'Audix',
  'SM4',
  'SM57',
  'SCX1C',
  'TAMA',
  'DW',
];
const NAME_RE = new RegExp(`\\b(?:${KIT_NAMES.join('|')})\\b`);
const BANNED: RegExp[] = [NAME_RE, /\bfree\b/i, /\b(classroom|instructor|student)s?\b/i, /\bSOURCED\b|\bTRIAL\b|\bILLUSTRATIVE\b/, /\bSources\b/, /\bdocumented\b/i, /\bcited\b/i];
const INTERNAL_KEYS = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind', 'id']);

function strings(v: unknown, path: string, out: { path: string; text: string }[], seen = new Set<unknown>()): void {
  if (typeof v === 'string') out.push({ path, text: v });
  else if (v && typeof v === 'object') {
    if (seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out, seen));
    else for (const [k, x] of Object.entries(v)) if (!INTERNAL_KEYS.has(k)) strings(x, `${path}.${k}`, out, seen);
  }
}
function offences(root: unknown, name: string): string[] {
  const items: { path: string; text: string }[] = [];
  strings(root, name, items);
  const bad: string[] = [];
  for (const { path, text } of items) for (const re of BANNED) if (re.test(text)) bad.push(`${path}: ${re} in "${text.slice(0, 120)}"`);
  return bad;
}

const ROOT = process.cwd();
const LESSON_DIRS = ['m09Overheads', 'm10Room', 'm11Kit', 'shared/cymbals', 'shared/kitScene', 'shared/kitPages'].map((d) => join(ROOT, 'src/screens/lab/miking/lessons', d));
const stripComments = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
function files(dir: string, ext: RegExp): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...files(p, ext));
    else if (ext.test(f)) out.push(p);
  }
  return out;
}

describe('kit lessons — learner text names no source, person or maker', () => {
  for (const l of LESSONS3) {
    it(`${l.id}: the lesson data is clean`, () => {
      assert.deepEqual(offences(l, l.id), []);
    });
  }
  it('the copy files and pure data are clean', () => {
    const bad = [
      ...offences(M09C, 'm09.copy'),
      ...offences(M09P, 'm09.pairs'),
      ...offences(M10C, 'm10.copy'),
      ...offences(M11C, 'm11.copy'),
      ...offences(PLANS, 'plans'),
      ...offences(CHANNELS, 'channels'),
      ...offences(Object.values(CYMBAL_SPECS).map((s) => s.name), 'cymbals'),
      ...offences(kitParts().map((p) => [p.label, p.note]), 'kitParts'),
    ];
    assert.deepEqual(bad, []);
  });
  it('the kit mic types’ learner words are clean', () => {
    for (const t of Object.values(KIT_MIC_TYPES)) {
      for (const s of [t.label, t.short, t.blurb, t.power, ...t.patterns.map((p) => p.label)]) for (const re of BANNED) assert.doesNotMatch(s, re, t.id);
    }
  });
  it('every .tsx in the kit lessons and shared kit folders is clean (comments stripped)', () => {
    const bad: string[] = [];
    for (const d of LESSON_DIRS) {
      for (const f of files(d, /\.tsx$/)) {
        stripComments(readFileSync(f, 'utf8'))
          .split('\n')
          .forEach((line, i) => {
            for (const re of BANNED) if (re.test(line)) bad.push(`${f}:${i + 1}: ${re}`);
          });
      }
    }
    assert.deepEqual(bad, []);
  });
  it('the methods carry descriptive names on screen', () => {
    const all = JSON.stringify([M09_LESSON, M09C, M09P]);
    assert.match(all, /floor-tom method/);
    assert.match(all, /shoulder method/);
  });
});

describe('kit lessons — registered after the toms, in order', () => {
  it('Lab 1 lists M09, M10, M11 after the toms', () => {
    const ids = LESSONS.map((l) => l.id);
    const i9 = ids.indexOf('M09');
    assert.ok(i9 > 0);
    assert.deepEqual(ids.slice(i9, i9 + 3), ['M09', 'M10', 'M11']);
    for (const id of ['M09', 'M10', 'M11']) assert.equal(LESSONS.find((l) => l.id === id)!.labId, LESSONS.find((l) => l.id === 'M01')!.labId);
  });
});

describe('kit lessons — item-writing rules', () => {
  const ABSOLUTE = /\b(always|any|never|every)\b/i;
  for (const l of LESSONS3) {
    const items = [...l.scenarios, ...l.symptoms];
    it(`${l.id}: correct answer present, options unique, a why for each wrong option`, () => {
      for (const s of items) {
        assert.ok(s.options.includes(s.correct), s.id);
        assert.equal(new Set(s.options).size, s.options.length, s.id);
        const why = (s as { why?: Record<string, string> }).why;
        if (why) for (const o of s.options) if (o !== s.correct) assert.ok(why[o], `${s.id}: why for "${o}"`);
      }
    });
    it(`${l.id}: no absolute words in wrong options; the correct answer is not a length tell`, () => {
      let longest = 0;
      for (const s of items) {
        for (const o of s.options) if (o !== s.correct) assert.doesNotMatch(o, ABSOLUTE, `${s.id}: "${o}"`);
        const others = s.options.filter((o) => o !== s.correct);
        const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
        assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: correct ${s.correct.length} vs mean ${mean.toFixed(1)}`);
        if (s.options.every((o) => o === s.correct || o.length < s.correct.length)) longest++;
      }
      assert.ok(longest <= Math.ceil(items.length / 4), `${l.id}: the correct answer is longest in ${longest} of ${items.length}`);
    });
  }
});

describe('kit lessons — fully silent', () => {
  it('no audio promised in the data or the pages', () => {
    const all = JSON.stringify(LESSONS3);
    assert.doesNotMatch(all, /\b(listen to the example|play the (sample|clip)|hear the example)\b/i);
    for (const d of LESSON_DIRS) for (const f of files(d, /\.tsx?$/)) assert.doesNotMatch(readFileSync(f, 'utf8'), /startFenced|expo-av|expo-audio|AudioContext/, f);
  });
});
