/**
 * Toddler pass, area 7 (Home · onboarding · study · quizzes · final exam ·
 * credentials · glossary · career finder · notifications · settings),
 * 2026-10-13 — receipts, one test per fix.
 *
 * 1 · LabRequirementsSheet (changed today) docked to the bottom edge with only
 *     its 16 pt padding: "Go to labs" / "Close" sat under an Android
 *     three-button bar and in the iPhone home-indicator strip. It now pads by
 *     the bottom inset, like StudyAreaExplore's sheet.
 * 2 · The NEW `labs_incomplete` Final Exam refusal said "this certificate" —
 *     programs raise it too — and "they're listed on the certificate", which no
 *     screen does. It now says "credential" and points at Lab Requirements in
 *     My Enrollment.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
/** Comments out, so a mention in prose never passes. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('1 · the lab requirements sheet pads its buttons above the bottom inset', () => {
  const src = code(read('src/components/LabRequirementsSheet.tsx'));
  assert.match(src, /import \{ useSafeAreaInsets \} from 'react-native-safe-area-context'/);
  assert.match(src, /const insets = useSafeAreaInsets\(\)/);
  assert.match(src, /style=\{\[s\.sheet, \{ paddingBottom: Math\.max\(insets\.bottom, 12\) \+ 6 \}\]\}/);
});

test('2 · labs_incomplete says "credential" and names where the list lives', () => {
  const copy = code(read('src/features/finalExam/api.ts')).match(/labs_incomplete:\s*"([^"]+)"/)?.[1] ?? '';
  assert.ok(copy.length > 0);
  assert.doesNotMatch(copy, /certificate/i);
  assert.match(copy, /credential/);
  assert.match(copy, /Lab Requirements/);
  assert.match(copy, /My Enrollment/);
});
