/**
 * PATTERN P18 (pattern hunt wave 3, 2026-10-02) — copy that contradicts
 * behaviour.
 *
 * Audit against the rules that changed recently (copy can lag behind them):
 *   • guest same-session carry: sign in before closing the app and LAB work is
 *     kept; study progress is not (owner 2026-10-01, features/lab/sessionCarry);
 *   • PREVIEW EARNS NOTHING (owner 2026-09-01): a members-only lab opened as a
 *     preview keeps nothing, carry or not;
 *   • refund = membership ends the same day; cancel = at the end of the cycle;
 *   • full screen opens at 1× (owner 2026-09-26);
 *   • Drum Tuning lives in Pitch & Tuning (owner 2026-10-01);
 *   • the Final Exam needs Academy membership (FinalExamScreen academy_required).
 * Only FALSE copy was changed (owner rule: don't change wording unless it is
 * wrong). Each fix is pinned below; each rule gets a source guard so the false
 * sentence cannot come back in another file.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const rel = (f: string) => relative(SRC, f).split(sep).join('/');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}
const strip = (code: string) =>
  code
    .replace(/\r\n/g, '\n')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
/** Every '…', "…" and `…` literal in the file (comments removed). */
const literals = (s: string): string[] => [...s.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g)].map((m) => m[0]);

const FILES = walk(SRC).map((f) => {
  const s = strip(readFileSync(f, 'utf8'));
  return { f: rel(f), s, lits: literals(s) };
});
const offenders = (re: RegExp, skip: (f: string) => boolean = () => false) =>
  FILES.flatMap(({ f, lits }) => (skip(f) ? [] : lits.filter((l) => re.test(l)).map((l) => `${f}: ${l.slice(0, 140)}`)));

// ── the two fixes ───────────────────────────────────────────────────────────

describe('fixed copy (2026-10-02)', () => {
  it('Award progress, signed out: a free account tracks progress; the Final Exam also needs membership', () => {
    const s = read('src/screens/awards/AwardProgressScreen.tsx');
    assert.match(s, /'Sign in with a free account to track your progress toward this\. It is free, and your progress is kept\. Sitting the Final Exam also needs Academy membership\.'/);
    assert.doesNotMatch(s, /free account to track your progress toward this and to sit the Final Exam/);
  });
  it('Help, Guest Mode: lab work carries on sign-in, except a members-only preview (which saves nothing)', () => {
    const s = read('src/features/help/helpContent.ts');
    // The carry sentence is kept (communityCareersFullRun2 H1 pins it too)…
    assert.match(s, /except lab work: sign in or create an account before you close the app, and the lab work from that visit is saved to it/);
    // …and it no longer promises a preview's work.
    assert.match(s, /saved to it \(a members-only lab opened as a preview saves nothing\)\./);
  });
});

// ── guards: the false sentence cannot come back elsewhere ───────────────────

describe('P18 guards', () => {
  it('no copy says a free account (alone) lets you sit the Final Exam', () => {
    assert.deepEqual(offenders(/free account[^'"`]*\bsit (the )?Final Exam/i), []);
  });

  it('no copy says a preview is saved, credited or counted (PREVIEW EARNS NOTHING)', () => {
    const bad = offenders(/\bpreview\b[^'"`.]*\b(is saved|are saved|is kept|counts toward|is credited|earns credit|banks)\b/i).filter(
      (l) => !/\b(nothing|none of this|not|never|no)\b[^'"`.]*\b(is saved|are saved|is kept|counts toward|is credited|earns credit|banks)\b/i.test(l),
    );
    assert.deepEqual(bad, []);
  });

  it('a guest is told "nothing is saved" flatly only where the copy knows carry is closed', () => {
    // Since 2026-10-01 a guest's lab work in the session IS kept on sign-in, so
    // "You are not signed in, so nothing here is saved." is only true when the
    // carry is closed (after a sign-out) or the lab is a members-only preview.
    // A file that says it must branch on sessionCarryOpen / a carry flag, or
    // be listed here with why it is true there.
    const KNOWN: Record<string, string> = {
      'screens/lab/cableinstall/completeCopy.ts': 'members-only lab: a signed-out visit is always a preview, and a preview holds nothing',
    };
    const bad = FILES.filter(
      ({ f, lits }) =>
        !KNOWN[f] &&
        lits.some((l) => /not signed in, so (nothing|none of this)[^'"`]*\bsaved\b/i.test(l) && !/\byet\b/.test(l)) &&
        !/sessionCarryOpen\(\)|\bcarry\b/.test(FILES.find((x) => x.f === f)!.s),
    ).map(({ f }) => f);
    assert.deepEqual(bad, []);
    for (const f of Object.keys(KNOWN)) assert.ok(FILES.some((x) => x.f === f), `${f} is gone — drop it from KNOWN`);
  });

  it('refund ends the same day, cancel ends at the cycle end: no copy says otherwise', () => {
    assert.deepEqual(offenders(/\brefund[^'"`]*\b(until the end|end of (the|your) (billing|period|cycle|month)|keep (your )?access)/i), []);
    assert.deepEqual(offenders(/\bcancel[^'"`]*\b(ends? (immediately|right away|the same day|today)|lose access (immediately|right away|today))/i), []);
  });

  it('full screen opens at 1×: no copy says it opens zoomed or at FIT', () => {
    assert.deepEqual(offenders(/full ?screen[^'"`]*\b(opens|starts) (at|on|in) (FIT|2×|1\.5×|3×|zoom)/i), []);
    assert.deepEqual(offenders(/\b(opens|starts) (at|on) FIT\b/), []);
  });

  it('Drum Tuning is in Pitch & Tuning, not Instruments & Recording', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    const block = (id: string) => cat.slice(cat.indexOf(`id: '${id}'`), cat.indexOf('\n  },', cat.indexOf(`id: '${id}'`)));
    assert.match(block('pitch'), /route: 'DrumTuningLab'/);
    assert.doesNotMatch(block('instruments'), /DrumTuningLab/);
    assert.match(block('pitch'), /description: '[^']*drum tuning[^']*'/);
    assert.deepEqual(offenders(/Drum Tuning[^'"`]*Instruments (&|and) Recording|Instruments (&|and) Recording[^'"`]*Drum Tuning/i), []);
  });
});
