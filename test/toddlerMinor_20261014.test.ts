/**
 * Toddler bug hunt 2026-10-14 — owner-approved items #29 and #31 (a–h).
 * Report: Downloads/2026-10-14_TODDLER_BUG_HUNT_REPORT.md §3.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { NEXT_STEPS, SECTIONS } from '../src/features/startHere/startHereContent.ts';
import {
  coverLabPreview,
  endLabPreview,
  getLabPreview,
  startLabPreview,
} from '../src/features/lab/labPreviewStore.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Source with comments stripped and line endings normalised. */
const src = (p: string) =>
  readFileSync(resolve(ROOT, p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const raw = (p: string) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

describe('#29 tools hub — MIC OFF · DEMO on the live tiles', () => {
  const hub = src('src/screens/tools/ToolsHubScreen.tsx');
  const engine = src('src/screens/tools/hubPreviewEngine.ts');

  it('the hub engine reports the mic as off when refused / absent / spike / error', () => {
    assert.match(engine, /state === 'denied' \|\| state === 'absent' \|\| state === 'spike' \|\| state === 'error'/);
    assert.match(engine, /micOff: micOffState\(state\)/);
  });

  it('the label is drawn on live (static-art) tiles only, at ≥ 9 pt', () => {
    assert.match(hub, /micOff=\{hubPreview\.micOff\}/);
    assert.match(hub, /armed && micOff && !Skin && !Sim \?/);
    assert.match(hub, />MIC OFF · DEMO</);
    const size = /micOffChipText: \{[^}]*fontSize: (\d+(?:\.\d+)?)/.exec(hub);
    assert.ok(size && Number(size[1]) >= 9, 'MIC OFF · DEMO is at least 9 pt');
  });
});

describe('#31a Start Here — the intro counts what is really there', () => {
  it('six lessons plus one lab, and the welcome text says so', () => {
    const lessons = SECTIONS.filter((s) => s.kind === 'lesson' || s.kind === 'review').length;
    const labs = SECTIONS.filter((s) => s.kind === 'lab').length;
    assert.equal(lessons, 6);
    assert.equal(labs, 1);
    const welcome = SECTIONS.find((s) => s.kind === 'welcome')!.pages[0].paras!.join(' ');
    assert.match(welcome, /six short lessons plus one hands-on lab/);
  });
});

describe('#31b Start Here — a fast second FINISH tap does not open a next-steps card', () => {
  const s = src('src/screens/startHere/StartHereScreen.tsx');
  it('FINISH stamps the end screen and the open latch', () => {
    assert.match(s, /endShownAt\.current = Date\.now\(\);\s*lastOpenAt\.current = Date\.now\(\);\s*tone\.stop\(\);\s*setListOpen\(false\);\s*setEnding\(true\);/);
  });
  it('every end-screen action waits for the screen to settle', () => {
    assert.match(s, /onJump=\{\(id\) => endSettled\(\) && goTo/);
    assert.match(s, /onPracticeAgain=\{\(\) => endSettled\(\) && goTo\(0\)\}/);
    assert.match(s, /onDone=\{\(\) => endSettled\(\) && leave\(\)\}/);
  });
});

describe('#31c Flashcards — the KNOWN view keeps your place', () => {
  const f = src('src/screens/study/FlashcardsScreen.tsx');
  it('leaving the KNOWN view returns to the card you were on', () => {
    assert.match(f, /if \(!showKnown\) knownChipPlace\.current = \{ id: card\?\.id, idx \};/);
    assert.match(f, /deck\.findIndex\(\(c\) => c\.id === back\.id\)/);
  });
  it('un-marking a card in the KNOWN view moves to the next card, never back to card 1', () => {
    assert.match(
      f,
      /setInTermList\('known', card\.id, false\);\s*if \(showKnown && !bookmarkedOnly && !starredOnly\) \{[\s\S]*?setIdx\(\(i\) => Math\.max\(0, Math\.min\(i, deck\.length - 2\)\)\);/,
    );
  });
});

describe('#31d / #31e Glossary', () => {
  const g = src('src/screens/glossary/GlossaryScreen.tsx');
  const coach = src('src/components/CoachMark.tsx');
  it('the hint pill is docked under the list (no overlap; the root carries insets.bottom)', () => {
    assert.match(g, /<CoachMark docked text="Tap a term to expand or collapse the complete definition"/);
    assert.match(g, /paddingTop: insets\.top, paddingBottom: insets\.bottom/);
    assert.match(coach, /docked\s*\?\s*\{ position: 'relative'/);
  });
  it('an empty Custom tab with no search explains how to add terms', () => {
    assert.match(g, /filter === 'custom' && !search\.trim\(\) \? \(\s*<Text style=\{styles\.empty\}>\{CUSTOM_EMPTY\}<\/Text>/);
    assert.doesNotMatch(raw('src/screens/glossary/GlossaryScreen.tsx').match(/const CUSTOM_EMPTY =\s*'([^']*)'/)![1], /shorter word/);
  });
});

describe('#31f Trophy Case — a guest is never shown a certificate they did not choose', () => {
  const w = src('src/screens/achievements/CredentialWall.tsx');
  it('a guest candidate shows a neutral prompt with no credential name', () => {
    const block = /if \(result\.kind === 'candidate' && guest\) \{([\s\S]*?)\n {2}\}/.exec(w);
    assert.ok(block, 'guest branch exists');
    assert.doesNotMatch(block![1], /result\.name/);
    assert.match(block![1], /Choose a \{noun\} to work toward\./);
  });
});

describe('#31g FREE LOOK INSIDE opens uncovered', () => {
  it('Start Here asks for a look-inside entry; the gate arms it uncovered', () => {
    const step = NEXT_STEPS.flatMap((g) => g.steps).find((s) => s.access === 'preview')!;
    assert.equal(step.to.kind, 'route');
    assert.deepEqual(step.to.kind === 'route' ? step.to.params : null, { lookInside: true });
    const gate = src('src/features/lab/withMembershipPreview.tsx');
    assert.match(gate, /startLabPreview\(route\.name, labRouteName\(route\.name\) \?\? 'This lab', \{ covered: !lookInside \}\)/);
  });
  it('the store opens uncovered on request, covers on a tap, and defaults to covered', () => {
    startLabPreview('SoundSystemsLab', 'Sound Systems Lab', { covered: false });
    assert.equal(getLabPreview().active, true);
    assert.equal(getLabPreview().covered, false);
    coverLabPreview();
    assert.equal(getLabPreview().covered, true);
    endLabPreview();
    startLabPreview('SoundSystemsLab', 'Sound Systems Lab');
    assert.equal(getLabPreview().covered, true, 'every other entry keeps the sheet');
    endLabPreview();
    assert.equal(getLabPreview().active, false);
  });
  it('the uncovered overlay still takes every touch and raises the sheet only on a tap', () => {
    const o = src('src/features/lab/LabPreviewOverlay.tsx');
    assert.match(o, /if \(active && !covered\) \{\s*return <FreeLookBar onCover=\{coverLabPreview\} onClose=\{leaveLab\}/);
    assert.match(o, /<View style=\{StyleSheet\.absoluteFill\} accessibilityViewIsModal>\s*<Pressable\s*style=\{\{ flex: 1 \}\}\s*onPress=\{onCover\}/);
  });
});

describe('#31h calibration sharing is OFF until chosen', () => {
  it('only a stored "1" reads as ON; Settings starts OFF; the guest wipe does not keep it', () => {
    const dp = src('src/features/tools/measure/deviceProfile.ts');
    assert.match(dp, /return \(await AsyncStorage\.getItem\(CONSENT_KEY\)\) === '1';/);
    assert.match(src('src/screens/settings/SettingsScreen.tsx'), /const \[contribute, setContribute\] = useState\(false\);/);
    assert.doesNotMatch(raw('src/features/account/clearLocalAccountData.ts'), /ape:crowdsource/);
  });
});
