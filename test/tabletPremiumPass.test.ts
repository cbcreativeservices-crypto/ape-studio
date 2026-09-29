/**
 * GUARD — the tablet premium pass (owner 2026-09-29: "look at every screen
 * making sure there are no odd shapes, formatting, odd layouts … when viewed on
 * a larger tablet size screen … tablet users are getting a premium experience").
 *
 * Measured in the web preview at 1024×1366, 1366×1024 and 1194×834 before the
 * fix: the Rack Unit's glass stayed at its PHONE height (250) on a 1004 pt-wide
 * iPad, so a lab's drawing sat marooned in a strip with ~300 pt of blank
 * faceplate under the dock; the lab well's notes, the lab and calculator lists,
 * the study card, the dashboard rack, Settings, the glossary list and eleven
 * popups/sheets all ran edge to edge; the trophy gallery and the calculator grid
 * kept two stretched columns; a photo lightbox was a 1238 pt square on a
 * 1024 pt-tall screen.
 *
 * ✅ PHONES: every rule below is a cap or a branch a phone never reaches (the
 * widest phone's short edge is 430, every cap is ≥ 460). The tests say so.
 */
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { CARD_MAX_W, POPUP_MAX_W, READING_MAX_W, popupCard } from '../src/theme/readingColumn.ts';
import { TABLET_SHORT_EDGE, gridColumns, isTabletWindow } from '../src/theme/tablet.ts';

const WIDEST_PHONE = 430;

test('a tablet is judged by the short edge — both orientations, never a phone', () => {
  // Phones, both ways up (iPhone Pro Max, SE, and a landscape phone).
  for (const [w, h] of [[430, 932], [375, 667], [932, 430], [390, 844]]) {
    assert.equal(isTabletWindow(w, h), false, `${w}×${h} is a phone`);
  }
  // iPad mini, iPad 11", iPad 13" — portrait and landscape.
  for (const [w, h] of [[744, 1133], [1133, 744], [834, 1194], [1194, 834], [1024, 1366], [1366, 1024]]) {
    assert.equal(isTabletWindow(w, h), true, `${w}×${h} is a tablet`);
  }
  assert.ok(TABLET_SHORT_EDGE > WIDEST_PHONE && TABLET_SHORT_EDGE <= 744);
});

test('grids gain columns on a tablet and keep the phone count on a phone', () => {
  // Trophy gallery: 16 pt padding each side, 220 pt tiles, 12 pt gaps, 2..4.
  for (const w of [320, 375, 390, 430]) assert.equal(gridColumns(w - 32, 220, 12, 2, 4), 2, `phone ${w}`);
  assert.equal(gridColumns(744 - 32, 220, 12, 2, 4), 3, 'iPad mini portrait');
  assert.equal(gridColumns(1024 - 32, 220, 12, 2, 4), 4, 'iPad 13" portrait');
  assert.equal(gridColumns(1366 - 32, 220, 12, 2, 4), 4, 'never past the max');
  // Cymatics gallery lives in the card column: 760 - 32 → three squares.
  assert.equal(gridColumns(CARD_MAX_W - 32, 200, 12, 2, 4), 3);
});

test('the popup width is named, centred, and never binds on a phone', () => {
  assert.equal(POPUP_MAX_W, 460);
  assert.ok(POPUP_MAX_W > WIDEST_PHONE);
  assert.ok(POPUP_MAX_W < READING_MAX_W);
  assert.equal(popupCard.maxWidth, POPUP_MAX_W);
  assert.equal(popupCard.alignSelf, 'center');
  assert.equal(popupCard.width, '100%');
});

test('the Rack Unit glass grows on a tablet, never below the phone rule, never for S', () => {
  const src = readFileSync('src/screens/lab/rack/RackUnit.tsx', 'utf8');
  assert.match(src, /isTabletWindow\(winW, winH\)/, 'the glass must read the LIVE window (rotation)');
  assert.match(src, /TABLET_STAGE_SHARE = \{ S: 0, M: 0\.34, L: 0\.4 \}/);
  // Never smaller than what a phone of the same window would get.
  assert.match(src, /Math\.max\(phoneTarget, tabletTarget\)/);
  // A view-built stage (StageBox → fixed()) keeps the phone height.
  assert.match(src, /tablet && !fixedStage \?/);
  // The well reads in the reading column, the dock sits in it too.
  assert.match(src, /contentContainerStyle=\{\[styles\.well, readingColumn\]\}/);
  assert.match(src, /dockInner: \{ width: '100%', maxWidth: READING_MAX_W, alignSelf: 'center'/);
});

/** [file, what must appear] — each measured edge to edge at 1024 before. */
const CAPPED: Array<[string, RegExp]> = [
  // Lab shells and lab pages.
  ['src/screens/lab/LabShell.tsx', /contentContainerStyle=\{\[styles\.scroll, readingColumn\]\}/],
  ['src/screens/lab/kit/PagedLab.tsx', /styles\.scroll, readingColumn,/],
  ['src/screens/lab/soundsystems/SsPagedLab.tsx', /styles\.scroll, readingColumn,/],
  ['src/screens/lab/tuning/TuningLabScreen.tsx', /styles\.scroll, readingColumn,/],
  ...['amp/AmpModuleScreen', 'eq/EqModuleScreen', 'cymatics/CymaticsModuleScreen', 'digital/DigitalModuleScreen', 'gain/GainModuleScreen', 'meter/MeterModuleScreen', 'wave/WaveModuleScreen'].map(
    (f) => [`src/screens/lab/${f}.tsx`, /styles\.scroll, readingColumn/] as [string, RegExp],
  ),
  // Lab and calculator lists / card pages.
  ...['AudioLearningScreen', 'EarLabScreen', 'LabCategoryScreen', 'amp/AmpLabHomeScreen', 'eq/EqLabHomeScreen', 'gain/GainLabHomeScreen', 'meter/MeterLabHomeScreen', 'wave/WaveLabHomeScreen', 'digital/DigitalLabHomeScreen', 'cymatics/CymaticsHomeScreen', 'eartraining/EarTrainingLabScreen', 'cable/CableLabScreen', 'tube/TubeReferenceScreen', 'production/ProductionLabScreen', 'micselect/MicSelectLabScreen', 'cableinstall/CableInstallLabScreen', 'calc/CalcLabScreen', 'calc/CalcWorkspaceScreen', 'calc/CalcSymbolsKeyScreen', 'calc/CalcWorkflowsScreen', 'calc/CalcWorkflowEditScreen', 'calc/CalcWorkflowRunScreen', 'calc/CalcProjectsScreen', 'calc/CalcResultsScreen', 'cymatics/GalleryScreen'].map(
    (f) => [`src/screens/lab/${f}.tsx`, /\b(styles\.\w+), cardColumn\b/] as [string, RegExp],
  ),
  ['src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx', /scroll: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx', /scroll: \{[^}]*\.\.\.cardColumn/],
  // Study, dashboard, glossary, achievements, settings, community, sign-in.
  ['src/screens/study/FlashcardsScreen.tsx', /\n {2}body: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/study/FillInBlankScreen.tsx', /\n {2}body: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/dashboard/DashboardScreen.tsx', /\n {2}scroll: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/glossary/GlossaryScreen.tsx', /\n {2}list: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/glossary/GlossaryScreen.tsx', /\n {2}cardList: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/achievements/TopicsScreen.tsx', /styles\.scroll, cardColumn/],
  ['src/screens/achievements/CredentialWall.tsx', /styles\.scroll, cardColumn/],
  ['src/screens/settings/SettingsScreen.tsx', /styles\.scroll, cardColumn/],
  ['src/screens/directory/ExploreView.tsx', /\n {2}body: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/directory/MyProfileView.tsx', /\n {2}body: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/directory/ProfileSetupFlow.tsx', /\n {2}scroll: \{[^}]*\.\.\.cardColumn/],
  ['src/screens/enrollment/HomeSetupSheet.tsx', /styles\.scroll, cardColumn/],
  ['src/screens/auth/AuthScreen.tsx', /\n {2}scroll: \{[^}]*maxWidth: POPUP_MAX_W \+ 40/],
  ['src/screens/results/TrophyScreen.tsx', /buttonWrap: \{ \.\.\.popupCard/],
  // Popups and sheets.
  ['src/features/glossary/GlossaryTermPopup.tsx', /\.\.\.popupCard/],
  ['src/screens/dashboard/TopicDeckSheet.tsx', /\.\.\.popupCard/],
  ['src/screens/dashboard/DashboardScreen.tsx', /termsSheet: \{\n[^}]*\.\.\.popupCard/],
  ['src/screens/directory/AudioCommunityDirectoryScreen.tsx', /sheet: \{\n[^}]*\.\.\.cardColumn/],
  ['src/screens/directory/MyProfileView.tsx', /sheet: \{\n[^}]*\.\.\.cardColumn/],
  ['src/screens/directory/RequestsView.tsx', /sheet: \{\n[^}]*\.\.\.cardColumn/],
  ['src/screens/courses/StudyAreaExplore.tsx', /sheet: \{\n[^}]*\.\.\.cardColumn/],
  ['src/screens/lab/calc/FormulaKeyPopup.tsx', /sheet: \{\n[^}]*\.\.\.cardColumn/],
  ['src/components/LabRequirementsSheet.tsx', /sheet: \{\n[^}]*\.\.\.cardColumn/],
  ['src/features/lab/guidedLessons/GuidedLessonSheet.tsx', /sheet: \{\n[^}]*\.\.\.readingColumn/],
  ['src/components/TrophyModal.tsx', /belowWrap: \{[^}]*\.\.\.readingColumn/],
  ['src/screens/about/AboutHomeSheet.tsx', /maxWidth: READING_MAX_W \+ 40/],
  ['src/features/audio/SoundSafetyWarning.tsx', /card: \{\n[^}]*maxWidth: 460/],
  ['src/components/CoachMark.tsx', /\(winW - POPUP_MAX_W\) \/ 2/],
];

test('every surface fixed in the tablet pass stays capped', () => {
  for (const [file, re] of CAPPED) {
    // Normalise line endings: some working copies are CRLF (autocrlf).
    const src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    assert.match(src, re, `${file}: lost its tablet cap — it will run edge to edge on an iPad again`);
  }
});

test('grids re-key on a column change and pad a short last row', () => {
  const g = readFileSync('src/screens/achievements/GalleryScreen.tsx', 'utf8');
  assert.match(g, /key=\{`cols-\$\{cols\}`\}/, 'numColumns cannot change on a mounted FlatList');
  assert.match(g, /numColumns=\{cols\}/);
  const c = readFileSync('src/screens/lab/calc/CalcLabScreen.tsx', 'utf8');
  assert.match(c, /tablet && styles\.tileFrameTablet/);
});

test('aspect-locked art is bounded by the window HEIGHT, not only its width', () => {
  const lb = readFileSync('src/screens/lab/labPhoto.tsx', 'utf8');
  assert.match(lb, /height - 200, CARD_MAX_W/, 'a square lightbox must fit a landscape iPad');
  assert.doesNotMatch(lb, /lbCard: \{ width: '92%', aspectRatio: 1/);
  const mic = readFileSync('src/screens/lab/micselect/micArt.tsx', 'utf8');
  assert.match(mic, /useLightboxSide\(\)/);
  const spl = readFileSync('src/screens/tools/SplMeterScreen.tsx', 'utf8');
  assert.match(spl, /const instW = isTabletWindow\(winW, winH\) \? Math\.min\(winW, CARD_MAX_W\) : winW;/);
  assert.match(spl, /const dialW = instW - 32;/);
  const cy = readFileSync('src/screens/lab/cymatics/GalleryScreen.tsx', 'utf8');
  assert.match(cy, /const previewW = Math\.min\(contentW, Math\.max\(240, wh - 320\)\);/);
});
