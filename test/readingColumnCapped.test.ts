/**
 * GUARD — a text surface must not run the full width of a tablet.
 *
 * ⛔ THE RULE: reading surfaces cap and centre; instruments and grids do not.
 *
 * Owner bug report 2026-09-24, on an iPad: "all screens seem to adjust fine to
 * the larger screen - but not audio tools". Measured live in the web preview at
 * 1024 pt, which is the only reason this was findable at all:
 *
 *   Tools HUB        560 pt wide, centred at x=225   <- already tablet-aware
 *   Tool INFO page   992 pt wide, starting at x=16   <- never was
 *
 * The hub had been capped in an earlier pass; every screen the hub PUSHES TO was
 * missed, so opening a tool stretched its body text across the whole iPad at
 * roughly 180 characters a line against a comfortable 60-90. Nothing was clipped
 * and nothing crashed, which is exactly why it reads as "doesn't adjust" and why
 * no existing test caught it.
 *
 * Walking the rest of the app at 1024 pt with the same probe found nine more.
 * Every file listed below was MEASURED running text past 940 pt before the fix.
 *
 * ⚠️ THIS IS NOT "CAP EVERYTHING". 104 scroll containers in this app have no
 * maxWidth and most of them are RIGHT: an RTA, a spectrogram, a waveform or a
 * card carousel should use the extra width a tablet gives, and capping those
 * would throw away the screen the user paid for. So this guard pins a NAMED LIST
 * of reading surfaces rather than asserting a property across the codebase, and
 * asserts the analysers stay uncapped so nobody "fixes" those the same way.
 *
 * ✅ NO PHONE CHANGES. The widest phone here is 430 pt, so a 560 pt cap never
 * binds and `alignSelf: 'center'` on a full-width child is a no-op. Tablets only.
 */
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { READING_MAX_W, TOOL_READING_MAX_W, readingColumn, readingText } from '../src/theme/readingColumn.ts';

/** [file, the style name its scroll content uses]. */
const READING_SURFACES: Array<[string, string]> = [
  // Audio Tools — what the report was actually about.
  ['src/screens/tools/ToolInfoScreen.tsx', 'scroll'],
  ['src/screens/tools/ToolLearnScreen.tsx', 'scroll'],
  ['src/screens/tools/ToolDemoScreen.tsx', 'scroll'],
  ['src/screens/tools/ConceptModuleScreen.tsx', 'scroll'],
  ['src/screens/tools/MeasurementLibraryScreen.tsx', 'scroll'],
  // Found by walking the app at 1024 pt with the same probe.
  ['src/screens/commercial/PaywallScreen.tsx', 'scroll'],
  ['src/screens/achievements/AchievementsHomeScreen.tsx', 'scroll'],
  ['src/screens/profile/ProfileScreen.tsx', 'bodyScroll'],
  ['src/screens/curriculum/CurriculumScreen.tsx', 'scroll'],
  ['src/screens/awards/AwardsScreen.tsx', 'scroll'],
  ['src/screens/awards/AwardProgressScreen.tsx', 'scroll'],
  ['src/screens/directory/DirectoryScreen.tsx', 'scroll'],
  ['src/screens/help/HelpScreen.tsx', 'scroll'],
  ['src/screens/about/AboutScreen.tsx', 'scroll'],
  ['src/screens/about/AboutHomeSheet.tsx', 'scroll'],
];

/** The tools screens share one header shape; cap it or the title sits far left
 *  of a centred body. */
const NEEDS_CAPPED_HEADER = READING_SURFACES.map(([f]) => f).filter((f) => f.includes('/tools/'));

/** A live analyser should USE a tablet's width. Pinned so nobody caps them. */
const MUST_STAY_UNCAPPED = [
  'src/screens/tools/RtaScreen.tsx',
  'src/screens/tools/SpectrogramScreen.tsx',
];

test('the reading column is a real cap that centres', () => {
  assert.equal(readingColumn.maxWidth, READING_MAX_W);
  assert.equal(readingColumn.alignSelf, 'center');
  // Without width:100% the cap makes the box shrink to its content on a tablet
  // instead of filling up to the cap — this bug, inverted.
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
  for (const [file, style] of READING_SURFACES) {
    const src = readFileSync(file, 'utf8');
    const m = src.match(new RegExp('\\n\\s*' + style + ': \\{[^}]*\\}'));
    assert.ok(m, `${file}: no '${style}' style found — did it get renamed?`);
    assert.match(
      m![0],
      /\.\.\.readingColumn/,
      `${file}: '${style}' is uncapped, so its text spans a whole iPad`,
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
  for (const file of MUST_STAY_UNCAPPED) {
    const src = readFileSync(file, 'utf8');
    const m = src.match(/\n\s*scroll: \{[^}]*\}/);
    if (!m) continue;
    assert.doesNotMatch(
      m[0],
      /\.\.\.readingColumn/,
      `${file}: an analyser should USE a tablet's width — do not cap it`,
    );
  }
});

/**
 * The intro popups are their own family with their own width (460, not 560).
 * Two of the four had it and two did not, which is the same inconsistency as
 * the tools hub vs its detail screens — and the one that was missing is the
 * FIRST thing a new tablet user sees. Measured at 934pt on a 1024pt iPad.
 */
const INTRO_SHEETS = [
  'src/features/intro/AppWelcomeOverlay.tsx',
  'src/features/intro/ScreenIntroOverlay.tsx',
  'src/features/intro/LearningIntroSheet.tsx',
  'src/features/intro/TopicWelcomeSheet.tsx',
].map((f) => [f, 'card'] as [string, string]).concat([
  // Low-Light Production Mode's gate is the same shape: a Modal overlay card
  // carrying two paragraphs, declared width:'100%' with no cap.
  ['src/features/settings/LowLightLayer.tsx', 'gateCard'],
]);

test('every intro popup card caps its width', () => {
  for (const [file, style] of INTRO_SHEETS) {
    const src = readFileSync(file, 'utf8');
    const card = src.match(new RegExp('\\n {2}' + style + ': \\{[\\s\\S]*?\\n {2}\\},'));
    assert.ok(card, `${file}: no '${style}' style found`);
    assert.match(
      card![0],
      /maxWidth: 460,/,
      `${file}: an uncapped popup card stretches across a whole iPad`,
    );
  }
});

/**
 * Screens that stay FULL WIDTH and cap only their paragraphs — instruments and
 * anything whose artwork should keep the tablet. They must use the LEFT variant:
 * measured 2026-09-24, the centred one pushed the amplitude gate's paragraphs
 * ~210pt inward while its headings stayed at x=16, which read as ragged.
 */
const PROSE_ONLY_SCREENS = [
  'src/screens/tools/SplMeterScreen.tsx',
  'src/screens/lab/amplitude/AmplitudeOrientation.tsx',
];

test('the left-aligned variant caps the same width but does not centre', () => {
  assert.equal(readingText.maxWidth, READING_MAX_W);
  assert.equal(readingText.width, '100%');
  assert.equal(readingText.alignSelf, 'flex-start');
  assert.notEqual(readingText.alignSelf, readingColumn.alignSelf);
});

test('prose-only screens use the LEFT variant and never cap their scroll', () => {
  for (const file of PROSE_ONLY_SCREENS) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /\.\.\.readingText/, `${file}: should cap paragraphs with readingText`);
    assert.doesNotMatch(
      src,
      /\.\.\.readingColumn/,
      `${file}: the centred variant misaligns paragraphs against left-aligned headings`,
    );
    const scroll = src.match(/\n\s*(?:gateScroll|scroll): \{[^}]*\}/);
    if (scroll) {
      assert.doesNotMatch(
        scroll[0],
        /readingText|readingColumn/,
        `${file}: the scroll must stay full width — capping it shrinks the instrument`,
      );
    }
  }
});
