/**
 * Audit round 2 (Comp B, 2026-10-23) — Round A fixes in the A2 miking files
 * (engine, shared, data, pages and every lesson outside the a, b and c lessons).
 *
 * Pins: the owner's 2026-10-23 rulings (NIOSH + OSHA named in the hearing
 * note; free-field allowed; protective-gear mounts only with approval;
 * "qualified rigger"), the shared two-mic widget's MIC B label, the polarity
 * wording (notches and peaks swap), and a sample of single fixes. Source is
 * read with CRLF normalised.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { E04_HANDS_31, E04_IND_31 } from '../src/screens/lab/miking/lessons/e04Duets/geometry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';

const ROOT = process.cwd();
const MK = join(ROOT, 'src/screens/lab/miking');
const read = (rel: string) => readFileSync(join(MK, rel), 'utf8').replace(/\r\n/g, '\n');

function a2Files(dir = MK): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (/[\\/]lessons[\\/][abc]\d/.test(p)) continue; // A1's lessons
      out.push(...a2Files(p));
    } else if (/\.(ts|tsx)$/.test(n)) out.push(p);
  }
  return out;
}
const FILES = a2Files().map((f) => ({ f: f.slice(ROOT.length + 1), s: readFileSync(f, 'utf8').replace(/\r\n/g, '\n') }));

describe('owner ruling 2026-10-23 (1): the hearing note names NIOSH and OSHA', () => {
  it('no A2 file keeps the unnamed "widely used guideline" or "keep to about 85 dBA"', () => {
    const bad = FILES.filter(({ s }) => /widely used guideline|keep to about 85 dBA/.test(s)).map(({ f }) => f);
    assert.deepEqual(bad, []);
  });
  it('every 85 dBA line names NIOSH and, with it, OSHA 90 dBA / 5 dB', () => {
    const bad: string[] = [];
    for (const { f, s } of FILES) {
      s.split('\n').forEach((line, i) => {
        if (/^\s*(\*|\/\/|\/\*)/.test(line) || !/\b85 dBA\b/.test(line) || /\bprov:|\bsrc:|\bquote:/.test(line)) return;
        if (!/NIOSH advises/.test(line) || !/\(OSHA\) is 90 dBA with a 5 dB rule/.test(line)) bad.push(`${f}:${i + 1}`);
      });
    }
    assert.deepEqual(bad, []);
  });
  it('the shared rating check and the setting page carry the named wording', () => {
    assert.match(read('engine/model/sharedItems.ts'), /NIOSH advises no more than 85 dBA averaged over 8 hours, halving the time for every 3 dB above that; the US legal limit \(OSHA\) is 90 dBA with a 5 dB rule/);
    assert.match(read('pages/PSetting.tsx'), /NIOSH advises no more than 85 dBA averaged over an 8-hour day/);
  });
});

describe('pattern 5: the shared two-mic widget says MIC B, never a bare B', () => {
  for (const f of ['pages/PTwoMic.tsx', 'lessons/m09Overheads/PTwoOverheads.tsx', 'lessons/shared/hand/handPages.tsx', 'lessons/shared/handdrums/pages/HTwoMic.tsx', 'lessons/shared/mallets/MTwoMic.tsx']) {
    it(f, () => {
      const s = read(f);
      assert.match(s, /'MIC B POLARITY \+' : 'MIC B POLARITY −'/);
      assert.doesNotMatch(s, /'B POLARITY [+−]'/);
    });
  }
  it('the sports step and every A2 lesson prompt', () => {
    const sp = read('lessons/shared/sports/sportsPages.tsx');
    assert.match(sp, /label: 'MIC B POLARITY'/);
    assert.doesNotMatch(sp, /k: 'B POL'|Flip B’s polarity/);
    const bad = FILES.filter(({ s }) => /Flip B POLARITY|\b[Ff]lip B’s polarity/.test(s)).map(({ f }) => f);
    assert.deepEqual(bad, []);
  });
});

describe('pattern 4: a polarity flip swaps the notches and peaks', () => {
  it('no A2 line says polarity "moves the notches"', () => {
    const bad = FILES.filter(({ s }) => /moves the notches|notches move, the delay|The notches move; Δt/.test(s)).map(({ f }) => f);
    assert.deepEqual(bad, []);
  });
  it('the Rhodes explanation names the flip, then the delay', () => {
    assert.match(read('lessons/i11aRhodes/lesson.ts'), /When you flip it, the notches and peaks swap places, but the delay does not change\. Only moving a mic, or delaying its channel, changes when the sound arrives\./);
  });
});

describe('rulings 3 and 4: approval for mounts, a qualified rigger, the real rule', () => {
  it('protective gear: only with the approval of the athlete and the team', () => {
    assert.match(read('lessons/shared/sports/safety.ts'), /only with the approval of the athlete and the team/);
    assert.match(read('lessons/shared/broadcast/standing.ts'), /the helmet — not drilled, altered or moved for a mic without the team’s approval/);
  });
  it('rigging says "qualified rigger", never competent rigger or qualified crew', () => {
    // A research quote (`quote: '…'`, never rendered) keeps its source's own words.
    const shown = (s: string) => s.replace(/quote: '[^']*'/g, '').replace(/^\s*(\*|\/\/).*$/gm, '');
    const bad = FILES.filter(({ s }) => /competent rigger|certified rigger|rigged (?:and secured )?by qualified crew|rated hardware and qualified crew/.test(shown(s))).map(({ f }) => f);
    assert.deepEqual(bad, []);
    assert.match(read('lessons/e06ChildrensChoir/lesson.ts'), /put up only by a qualified rigger, with the venue’s approval/);
  });
  it('traffic and fire keep their hard bans', () => {
    assert.match(read('lessons/f04Impacts/copy.ts'), /never into a road/);
    assert.match(read('lessons/f02Clothing/copy.ts'), /Never drape cloth over a hot light/);
  });
  it('ring-out is the operator’s, not a flat "never provoke"', () => {
    const bad = FILES.filter(({ s }) => /feedback never provoked|Feedback is never provoked|Never induce feedback|never chase feedback/.test(s.replace(/^\s*(\*|\/\/).*$/gm, ''))).map(({ f }) => f);
    assert.deepEqual(bad, []);
  });
});

describe('single fixes', () => {
  it('E04: the 3:1 spacings are in cm from mm (d / 10), not d / 100', () => {
    const g = read('lessons/e04Duets/geometry.ts');
    assert.doesNotMatch(g, /_31\.d \/ 100/);
    assert.ok(E04_HANDS_31.d / 10 > 40 && E04_IND_31.d / 10 >= 3 * 22, 'the drawn spacings are tens of cm');
  });
  it('E05: widening a pair is not a fix for a choir outside its angle', () => {
    assert.doesNotMatch(read('lessons/e05Choir/lesson.ts'), /widen the pair|Move the pair back, widen it/);
  });
  it('F12: lightning names a solid building or a hard-topped car', () => {
    assert.match(read('lessons/f12SoundLevel/pages.tsx'), /solid building or a hard-topped car/);
  });
  it('F15: the fan’s sound power is above its 52 dBA pressure at 1 m', () => {
    assert.match(read('lessons/f15Machinery/ladder.ts'), /The fan’s sound power is 62 dB/);
  });
  it('M10: hear the room first, then define the target', () => {
    const s = read('lessons/m10Room/lesson.ts');
    assert.ok(s.indexOf("text: 'Hear the kit and the room") < s.indexOf("text: 'Define the target"));
  });
  it('M12/M13: the supercardioid item asks where rejection is greatest (the rear sides)', () => {
    for (const id of ['M12', 'M13']) {
      const sc = lessonById(id).scenarios.find((x) => /supercardioid\. Where does the wedge get the most rejection/.test(x.prompt));
      assert.ok(sc, id);
      assert.equal(sc!.correct, 'Toward its rear sides, near 126°');
    }
  });
  it('shared: Doppler pitch is higher on approach, not rising', () => {
    assert.doesNotMatch(read('lessons/shared/sports/passBy.ts'), /pitch seems to rise as it comes toward/);
  });
  it('shared: a louder source is allowed for decay range; calibrator adjusts within the method', () => {
    assert.match(read('lessons/shared/measure/RoomTools.tsx'), /or a louder source within safe levels/);
    assert.match(read('lessons/shared/measure/calibrator.ts'), /adjust the meter to the stated level only as the maker and the method allow, and log the change/);
  });
  it('shared: the double bass neck names geared tuning machines', () => {
    assert.match(read('lessons/shared/bowed/bowedModel.ts'), /spec\.id === 'bass' \? 'The neck carries the fingerboard; geared tuning machines/);
  });
  it('stage plans: the audience is drawn to the right', () => {
    for (const f of ['i06aTriangle', 'i12Gong', 'm12Tonbak', 'm13Tabla']) assert.doesNotMatch(read(`lessons/${f}/pages.tsx`), /the audience at the bottom/, f);
  });
  it('free-field stays allowed as the acoustics term (owner ruling 2026-10-23 (2))', () => {
    assert.match(read('pages/PContext.tsx'), /free-field/);
  });
});
