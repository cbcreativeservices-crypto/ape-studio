/**
 * GUARD — a text surface must not run the full width of a tablet.
 *
 * ⛔ THE RULE: reading surfaces cap and centre; instruments do not.
 *
 * Owner bug report 2026-09-24, on an iPad: "all screens seem to adjust fine to
 * the larger screen - but not audio tools". Measured live in the web preview at
 * 1024 pt, which is the whole reason this was findable:
 *
 *   Tools HUB        560 pt wide, centred at x=225   <- already tablet-aware
 *   Tool INFO page   992 pt wide, starting at x=16   <- never was
 *
 * The hub had been capped in an earlier pass; every screen the hub PUSHES TO was
 * missed, so the moment you opened a tool the body text stretched across the
 * whole iPad at roughly 180 characters a line against a comfortable 60-90.
 * Nothing was clipped and nothing crashed, which is exactly why it reads as
 * "doesn't adjust" and why no test caught it.
 *
 * ⚠️ THIS IS NOT "CAP EVERYTHING". 104 scroll containers in this app have no
 * maxWidth, and most of them are RIGHT: an RTA, a spectrogram, a waveform or a
 * card grid genuinely should use the extra width a tablet gives. Capping those
 * would throw away the screen the user paid for. The guard therefore pins the
 * named READING surfaces, not a blanket property check.
 *
 * ✅ NO PHONE CHANGES. The widest phone here is 430 pt, so a 560 pt cap never
 * binds and `alignSelf: 'center'` on a full-width child is a no-op. Tablets only.
 */
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { READING_MAX_W, TOOL_READING_MAX_W, readingColumn } from '../src/theme/readingColumn.ts';

/** Screens whose job is to be READ. Each must cap its header AND its scroll. */
const READING_SURFACES = [
  'src/screens/tools/ToolInfoScreen.tsx',
  'src/screens/tools/ToolLearnScreen.tsx',
  'src/screens/tools/ToolDemoScreen.tsx',
  'src/screens/tools/ConceptModuleScreen.tsx',
  'src/screens/tools/MeasurementLibraryScreen.tsx',
  'src/screens/commercial/PaywallScreen.tsx',
];

/** Header is capped too, or the title sits far left of a centred body. */
const NEEDS_CAPPED_HEADER = READING_SURFACES.filter((f) => f.includes('/tools/'));

test('the reading column is a real cap that centres', () => {
  assert.equal(readingColumn.maxWidth, READING_MAX_W);
  assert.equal(readingColumn.alignSelf, 'center');
  // Without width:100% the cap makes the box shrink to its content instead of
  // filling up to the cap — the bug this guard exists to prevent, inverted.
  assert.equal(readingColumn.width, '100%');
});

test('the cap never binds on any phone this app is device-passed on', () => {
  const WIDEST_PHONE = 430;
  assert.ok(
    READING_MAX_W > WIDEST_PHONE,
    `a ${READING_MAX_W}pt cap would re-layout phones; it must only affect tablets`,
  );
});

test('the Tools hub and its detail screens share ONE width', () => {
  assert.equal(TOOL_READING_MAX_W, READING_MAX_W);
  const hub = readFileSync('src/screens/tools/ToolsHubScreen.tsx', 'utf8');
  assert.match(
    hub,
    /const HUB_MAX_CONTENT_W = TOOL_READING_MAX_W;/,
    'the hub must import the shared width, not re-declare 560 — they drifted apart once already',
  );
});

test('every reading surface caps its scroll content', () => {
  for (const file of READING_SURFACES) {
    const src = readFileSync(file, 'utf8');
    const scroll = src.match(/\n\s*scroll: \{[^}]*\}/);
    assert.ok(scroll, `${file}: no 'scroll' style found — did it get renamed?`);
    assert.match(
      scroll![0],
      /\.\.\.readingColumn/,
      `${file}: the scroll content is uncapped, so its text spans a whole iPad`,
    );
  }
});

test('tools reading surfaces cap the header so it lines up with the body', () => {
  for (const file of NEEDS_CAPPED_HEADER) {
    const src = readFileSync(file, 'utf8');
    const header = src.match(/\n\s*header: \{[^}]*\}/);
    assert.ok(header, `${file}: no 'header' style found`);
    assert.match(
      header![0],
      /\.\.\.readingColumn/,
      `${file}: the header is uncapped, so the title sits far left of the centred body`,
    );
  }
});

test('live instrument screens are deliberately NOT capped', () => {
  // If someone "fixes" these the same way, a tablet RTA gets worse, not better.
  for (const file of ['src/screens/tools/RtaScreen.tsx', 'src/screens/tools/SpectrogramScreen.tsx']) {
    const src = readFileSync(file, 'utf8');
    const scroll = src.match(/\n\s*scroll: \{[^}]*\}/);
    if (!scroll) continue;
    assert.doesNotMatch(
      scroll![0],
      /\.\.\.readingColumn/,
      `${file}: an analyser should USE a tablet's width — do not cap it`,
    );
  }
});
