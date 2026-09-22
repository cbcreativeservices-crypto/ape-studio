/**
 * The progress meter must announce the number it prints.
 *
 * ⛔ WHAT THIS PINS (owner walkthrough 2026-09-21, found on a real phone).
 * `LedMeterWell` derived its screen-reader percentage from `filled` — the
 * value already rounded into 21 segments — so it round-tripped
 * pct → segments → pct. Observed live on Flashcards: the screen read **12%**
 * while the accessibility label announced **14%** (11.9% → 3 segments →
 * 14.28%). A blind learner was told a different number from a sighted one, on
 * the same control, at the same moment.
 *
 * Each segment is 100/21 ≈ 4.76 points, so the drift reaches ~2.4 points —
 * small, but it is a number the app states twice and gets wrong once.
 *
 * The component takes a `pct` prop now. These tests mirror both the old
 * derivation and the new one so the gap is measured rather than asserted.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const SEG_COUNT = 21;

/** What the screens print. */
const printed = (pct: number) => (pct >= 100 ? 100 : Math.min(Math.round(pct), 99));
/** What the screens pass as `filled`. */
const segmentsForPct = (pct: number) => Math.round((Math.max(0, Math.min(100, pct)) / 100) * SEG_COUNT);
/** The OLD label: re-derived from the segment count. */
const announcedOld = (filled: number) => Math.round((Math.max(0, Math.min(SEG_COUNT, filled)) / SEG_COUNT) * 100);
/** The NEW label: the real percentage, rounded once. */
const announcedNew = (pct: number) => Math.round(pct);

test('the exact case seen on the phone: 11.9% printed 12 and announced 14', () => {
  const pct = (27 / 226) * 100; // 27 of 226 cards
  assert.equal(printed(pct), 12);
  assert.equal(announcedOld(segmentsForPct(pct)), 14, 'the old derivation really did say 14');
  assert.equal(announcedNew(pct), 12, 'the new label must agree with the screen');
});

test('printed and announced now agree across the whole range', () => {
  const bad: string[] = [];
  for (let n = 0; n <= 1000; n++) {
    const pct = (n / 1000) * 100;
    if (announcedNew(pct) !== printed(pct) && pct < 100) {
      // printed() clamps to 99 below 100 on purpose — "100%" is reserved for
      // genuinely finished. Allow exactly that one difference.
      if (!(printed(pct) === 99 && announcedNew(pct) === 100)) bad.push(pct.toFixed(1));
    }
  }
  assert.deepEqual(bad, [], `announced != printed at: ${bad.slice(0, 10).join(', ')}`);
});

test('the old derivation was wrong often, not rarely — so this was worth fixing', () => {
  let wrong = 0;
  for (let n = 0; n <= 100; n++) {
    if (announcedOld(segmentsForPct(n)) !== printed(n)) wrong++;
  }
  // Quantising to 21 segments misses most whole percentages.
  assert.ok(wrong > 50, `expected the old label to be wrong for most values, got ${wrong}/101`);
});

test('a zero fill still announces zero, not the min-1 display floor', () => {
  // LedMeterWell lights at least one segment so the meter never looks dead.
  // That floor is a DISPLAY choice and must not reach the announcement.
  assert.equal(announcedNew(0), 0);
});

/* ────────────────────────────────────────────────────────────────────────────
 * THE OTHER HALF — the progressbar VALUE, not the label. (2026-09-22)
 *
 * The fix above corrected the label and stopped there. `LedMeterWell` handed
 * `LedMeter` a correct label string while `LedMeter` went on computing its own
 * `accessibilityValue` / `aria-valuenow` from `filled` — the segment count. So
 * the same control announced two different numbers at once, and the tests
 * passed because they only ever modelled the label.
 *
 * Found by an independent pass on 2026-09-22 looking for values that are
 * RECONSTRUCTED rather than passed through. Worth remembering: the first fix
 * was verified against the thing it changed, not against the whole control.
 * ──────────────────────────────────────────────────────────────────────────── */

/** What LedMeter announced as its VALUE before `a11yPct` existed. */
const valueOld = (filled: number) =>
  Math.round((Math.max(0, Math.min(SEG_COUNT, Math.round(filled))) / SEG_COUNT) * 100);
/** What it announces now, when the caller passes the truth. */
const valueNew = (pct: number) => Math.max(0, Math.min(100, Math.round(pct)));
/** LedMeterWell's DISPLAY FLOOR: never show a dead meter. */
const withFloor = (filled: number) => Math.max(1, filled);

test('the progressbar VALUE now agrees with the label it sits next to', () => {
  const pct = (27 / 226) * 100; // the same 11.9% case as above
  // 11.9469% -> 3 segments -> 14. The VALUE was computed exactly the way the
  // old LABEL was, so it reproduced the original 12-vs-14 gap one layer down.
  assert.equal(valueOld(segmentsForPct(pct)), 14, 'the old value really did say 14');
  assert.equal(printed(pct), 12, 'while the screen said 12');
  assert.equal(valueNew(pct), 12, 'label and value must now match');
});

test('⛔ the display floor must never reach the announcement', () => {
  // LedMeterWell lights one segment at 0% so the meter does not look broken.
  // That floor is a VISUAL choice; announcing it tells a blind learner they
  // have made progress they have not made.
  assert.equal(valueOld(withFloor(0)), 5, 'the old value announced 5% at zero');
  assert.equal(valueNew(0), 0, 'zero must announce as zero');
});

test('label and value agree across the whole range', () => {
  const bad: string[] = [];
  for (let n = 0; n <= 1000; n++) {
    const pct = (n / 1000) * 100;
    if (valueNew(pct) !== announcedNew(pct)) bad.push(pct.toFixed(1));
  }
  assert.deepEqual(bad, [], `label != value at: ${bad.slice(0, 10).join(', ')}`);
});

test('the old derivation disagreed with the label for most values — so this mattered', () => {
  let wrong = 0;
  for (let n = 0; n <= 100; n++) {
    if (valueOld(withFloor(segmentsForPct(n))) !== announcedNew(n)) wrong++;
  }
  assert.ok(wrong > 50, `expected the old VALUE to be wrong for most percentages, got ${wrong}/101`);
});

test('SOURCE GUARD: LedMeterWell must hand LedMeter the real percentage', () => {
  // The bug was a missing prop, not bad arithmetic, so this is what pins it.
  const src = readFileSync(new URL('../src/components/LedMeter.tsx', import.meta.url), 'utf8');
  const well = src.slice(src.indexOf('export function LedMeterWell'));
  assert.match(
    well,
    /<LedMeter[^>]*a11yPct=\{pct\}/s,
    'LedMeterWell must pass a11yPct, or the value is re-derived from the segment count again',
  );
});

/**
 * ⛔ AND THE GUARD ABOVE WAS TOO NARROW — it read only LedMeter.tsx.
 *
 * A third instance was sitting in EnrollmentScreen the whole time: a LedMeter
 * with an a11yLabel and no a11yPct, announcing 14 while its label said 12. The
 * guard could not see it, so the suite went green over a live bug. Found by an
 * independent pass on 2026-09-22, hours after the "fix".
 *
 * A guard that inspects one file cannot pin a rule about every CALLER. This one
 * sweeps the repo: any LedMeter that bothers to carry a screen-reader label must
 * also carry the real percentage, or the number it announces is quantised to
 * 1/21 and disagrees with the label right next to it.
 */
test('SOURCE GUARD: every LedMeter with a label must pass the real percentage', () => {
  const root = new URL('../src/', import.meta.url);
  const rel = (u: URL) =>
    decodeURIComponent(u.pathname).slice(decodeURIComponent(root.pathname).length);

  const walk = (dir: URL): URL[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? walk(new URL(e.name + '/', dir))
        : e.name.endsWith('.tsx')
          ? [new URL(e.name, dir)]
          : [],
    );

  const offenders: string[] = [];
  for (const file of walk(root)) {
    const src = readFileSync(file, 'utf8');
    // Each <LedMeter ... /> element, INCLUDING the multi-line ones - which is
    // exactly where the missed instance was hiding.
    for (const m of src.matchAll(/<LedMeter[\s\S]*?\/>/g)) {
      const el = m[0];
      if (el.includes('a11yLabel') && !el.includes('a11yPct')) offenders.push(rel(file));
    }
  }
  assert.deepEqual(
    offenders,
    [],
    'these meters announce a value derived from the segment count, not the one they print: ' +
      offenders.join(', '),
  );
});
