/**
 * Audio Career Finder — bundled index integrity (owner workbook v2 → JSON via
 * scripts/build-career-index.py + scripts/career-index-overrides.json).
 *
 * Reads the JSON with fs (no import attributes needed under node --test) and
 * checks the contracts the screens rely on, plus the corrections the
 * industry-accuracy review of 2026-09-04 asked for.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { FAMILIES } from '../src/features/careerfinder/families.ts';

type Raw = { id: string; f: number; t: string; alt?: string[]; cls: number; st: number; rel: number; tier: number; ori: number; wm: number; prep: number; reg?: 1; pe?: 1 };
const index = JSON.parse(readFileSync(new URL('../src/data/careerIndex.json', import.meta.url), 'utf8')) as {
  version: string; families: string[]; enums: Record<string, string[]>; careers: Raw[];
};
const meta = JSON.parse(readFileSync(new URL('../src/data/careerFamilies.json', import.meta.url), 'utf8')) as { id: string; name: string; field: string; subject: string; topicGs: number[]; count: number }[];
const inFamily = (name: string) => index.careers.filter((c) => index.families[c.f] === name);
const titled = (t: string) => index.careers.find((c) => c.t === t);

describe('career index', () => {
  it('has 1,902 titles across the same 42 families the app hand-authors, in the same order', () => {
    assert.equal(index.careers.length, 1902);
    assert.deepEqual(index.families, FAMILIES.map((f) => f.name));
    assert.deepEqual(meta.map((m) => m.id), FAMILIES.map((f) => f.id));
  });
  it('every enum code decodes', () => {
    const e = index.enums;
    for (const c of index.careers) {
      assert.ok(e.titleClass[c.cls] && e.status[c.st] && e.relationship[c.rel] && e.tier[c.tier] && e.orientation[c.ori] && e.workModel[c.wm] && e.preparation[c.prep], c.id);
    }
    assert.equal(e.tier.length, 3);
  });
  it('family counts in careerFamilies.json match the index', () => {
    for (const m of meta) assert.equal(m.count, inFamily(m.name).length, m.name);
  });
  it('every family links to a real field › subject and only real topics', () => {
    for (const m of meta) {
      assert.ok(m.field && m.subject, m.name);
      for (const gs of m.topicGs) assert.ok(Number.isInteger(gs) && gs >= 3000, `${m.name}: ${gs}`);
    }
  });
});

describe('index corrections (industry review 2026-09-04)', () => {
  it('licensed hearing-care and speech titles are flagged regulated', () => {
    for (const t of ['Hearing Instrument Specialist', 'Speech-Language Pathology Assistant', 'Voice Therapist', 'Neurosonographer', 'Audiologist']) {
      assert.equal(titled(t)?.reg, 1, t);
    }
  });
  it('consulting acoustics engineers carry the PE note', () => {
    const arch = inFamily('Architectural Acoustics, Noise & Vibration');
    const eng = arch.filter((c) => /(Engineer|Consultant)$/.test(c.t));
    assert.ok(eng.length > 5);
    for (const c of eng) assert.equal(c.pe, 1, c.t);
  });
  it('sonar titles live in the Defense family, and civilian sonar engineers are not "military-trained"', () => {
    for (const t of ['Sonar Technician', 'Sonar Systems Engineer', 'Sonar Signal-Processing Engineer']) {
      assert.equal(index.families[titled(t)!.f], 'Defense, Sonar & Acoustic Intelligence', t);
    }
    for (const t of ['Sonar Software Engineer', 'Sonar Algorithm Engineer', 'Sonar Test Engineer']) {
      assert.doesNotMatch(index.enums.preparation[titled(t)!.prep], /Military/, t);
    }
  });
  it('audiologists are clinicians, not researchers', () => {
    for (const c of index.careers.filter((c) => c.t.includes('Audiologist'))) assert.equal(index.enums.orientation[c.ori], 'Clinical / therapeutic', c.t);
  });
  it('no title is both "closely related / supporting" and audio-core', () => {
    const rel = index.enums.relationship;
    for (const c of index.careers) {
      if (c.tier === 0) assert.ok(rel[c.rel] === 'Core audio/acoustics' || rel[c.rel] === 'Acoustics-based profession', `${c.t}: ${rel[c.rel]} cannot be audio-core`);
    }
  });
  it('working live-sound roles do not carry the "bachelor’s degree common" default', () => {
    for (const t of ['Front-of-House Engineer', 'Monitor Engineer', 'Touring Audio Engineer']) {
      assert.doesNotMatch(index.enums.preparation[titled(t)!.prep], /Bachelor's degree common/, t);
    }
  });
  it('representative careers the review replaced are real index titles in their family', () => {
    const check: [string, string[]][] = [
      ['Hearing, Audiology, Psychoacoustics & Accessibility', ['Audiologist', 'Hearing Instrument Specialist', 'Psychoacoustician']],
      ['Medical Ultrasound & Therapeutic Acoustics', ['Diagnostic Medical Sonographer', 'Ultrasound Transducer Engineer', 'Ultrasound Imaging Scientist']],
      ['Stagecraft, Rigging, Power & Production Support', ['Entertainment Rigger', 'Audio Stagehand']],
      ['Theatre, Worship, Venues & Show Control', ['Theatrical Sound Designer', 'Theatre A1']],
      ['Field Recording, Sound Libraries & Sonic Heritage', ['Wildlife Sound Recordist', 'Sound Library Producer', 'Sonic Heritage Specialist']],
    ];
    for (const [fam, titles] of check) {
      const have = new Set(inFamily(fam).map((c) => c.t));
      for (const t of titles) assert.ok(have.has(t), `${fam}: ${t}`);
      const f = FAMILIES.find((x) => x.name === fam)!;
      for (const t of titles) assert.ok(f.examples.includes(t), `${fam} examples should include ${t}`);
    }
  });
});
