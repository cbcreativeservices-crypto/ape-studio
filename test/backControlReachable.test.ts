/**
 * GUARD — a header back / close control must be reachable by a thumb.
 *
 * TESTER REPORT, 2026-09-23 (Frank, iPhone SE 3rd gen, build 28):
 *   "Back button does not work on multiple progress screens"
 *   "Back button doesn't work here. you have to close the app to get out"
 *
 * The control is a bare `‹` glyph — about ten points of ink at fontSize 24 —
 * in a Pressable with `hitSlop={10}`. That is roughly a 30×44pt target against
 * Apple's 44×44pt minimum, sitting flush at the left edge where iOS runs the
 * interactive pop-gesture recogniser. A tap a few points off, or one iOS reads
 * as the start of an edge swipe, does nothing at all — indistinguishable from a
 * broken button, and on a 667pt screen it reads as being trapped.
 *
 * It was 62 controls across 59 screens, which is why the report said "multiple
 * progress screens" rather than naming one. They now share BACK_HIT_SLOP.
 *
 * ⚠️ The constant is deliberately ASYMMETRIC — see its own comment. Growing the
 * area leftward is wasted; the system gesture owns that strip.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}
const SRC = join(process.cwd(), 'src');
const rel = (f: string) => relative(process.cwd(), f).split(sep).join('/');

describe('back controls are big enough to hit', () => {
  test('no goBack control carries a cramped hitSlop', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const code = readFileSync(file, 'utf8');
      if (!code.includes('goBack()')) continue;
      code.split('\n').forEach((line, i) => {
        if (!line.includes('goBack()')) return;
        // A bare number is the cramped form; the shared constant is the fix.
        const m = /hitSlop=\{(\d+)\}/.exec(line);
        if (m && Number(m[1]) < 20) {
          offenders.push(`${rel(file)}:${i + 1} — hitSlop={${m[1]}} on a back control`);
        }
      });
    }
    assert.deepEqual(
      offenders,
      [],
      `a back control is too small to hit reliably — testers report this as "the back button does not work":\n${offenders.join('\n')}`,
    );
  });

  test('the shared constant still buys a real target, and stays asymmetric', () => {
    const src = readFileSync(join(SRC, 'components', 'backHitSlop.ts'), 'utf8');
    const m = /top:\s*(\d+),\s*bottom:\s*(\d+),\s*left:\s*(\d+),\s*right:\s*(\d+)/.exec(src);
    assert.ok(m, 'BACK_HIT_SLOP no longer declares all four edges');
    const [, top, bottom, left, right] = m.map(Number);
    // Glyph is ~10pt wide and ~28pt tall; the slop has to carry it past 44.
    assert.ok(10 + left + right >= 44, `horizontal target is only ${10 + left + right}pt — under the 44pt minimum`);
    assert.ok(28 + top + bottom >= 44, `vertical target is only ${28 + top + bottom}pt — under the 44pt minimum`);
    assert.ok(right > left, 'the slop stopped favouring the RIGHT — leftward room is the system gesture’s, not ours');
  });

  test('the reported screen uses it', () => {
    // AwardProgressScreen is the one in the tester's screenshots.
    const s = readFileSync(join(SRC, 'screens', 'awards', 'AwardProgressScreen.tsx'), 'utf8');
    assert.match(s, /hitSlop=\{BACK_HIT_SLOP\}/, 'AwardProgressScreen lost the shared back hit area');
  });
});
