/**
 * Four small picks (owner 2026-11-24, must-do row D73):
 *   1. AUDIO TOOLS gets a small line under its title: "Measure · generate · analyze".
 *   2. SETTINGS gets one too: "Sound · display · reminders · account".
 *   3. Audio Community's line names its four tabs: "Directory · forum · your profile · requests".
 *   4. STUDY is orange everywhere ("Orange everywhere"): the STUDY nav label
 *      and glow, STUDY / STUDY ALL / STUDY NOW, the "Study Topic" caption and
 *      the Dashboard's Study key read STUDY_COLOR, never colors.blue. Labs keeps
 *      the blue; the LOADED pill stays amber.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { placeColor } from '../src/components/nav/circleMenuPlaces.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
// tokens.ts requires font files, so node reads it as text, not as a module.
const TOKENS = read('src/theme/tokens.ts');
const tokenHex = (k: string) => new RegExp(`\\n {2}${k}: '(#[0-9a-f]{6})'`, 'i').exec(TOKENS)?.[1];
const colors = { orange: tokenHex('orange')!, blue: tokenHex('blue')!, amber: tokenHex('amber')! };
/** One style entry `name: { ... }` (single level of braces) out of a file. */
function styleOf(src: string, name: string): string {
  const m = new RegExp(`\\n\\s*${name}: \\{([^{}]*)\\}`).exec(src);
  assert.ok(m, `style ${name} not found`);
  return m[1];
}
const BLUE_RE = /colors\.blue\b|#2f9bff|47,\s*155,\s*255|#7fbfff|127,\s*191,\s*255/i;

describe('the three subtitles (owner 2026-11-24)', () => {
  it('AUDIO TOOLS: "Measure · generate · analyze" right under the title, in the Labs subtitle look', () => {
    const s = read('src/screens/tools/ToolsHubScreen.tsx');
    assert.match(s, />AUDIO TOOLS<\/Text>\n\s*<Text style=\{styles\.screenSubtitle\}[^>]*>Measure · generate · analyze<\/Text>/);
    const st = styleOf(s, 'screenSubtitle');
    assert.match(st, /fonts\.barlowRegular/);
    assert.match(st, /fontSize: 12\.5/);
    assert.match(st, /colors\.textSub/);
    assert.match(st, /marginTop: 1/);
    // HOME key, then the section icon, then the title column: positions kept.
    const bar = s.indexOf('<View style={styles.titleBar}>');
    const order = ['<HomeOrBackKey alwaysHome', '<PlaceArt place="tools"', '<View style={styles.titleCol}>', '<AccuracyNote compact />', '<HelpKey search="tool" />'].map((t) => s.indexOf(t, bar));
    assert.ok(bar > 0 && order.every((i, k) => i > bar && (k === 0 || i > order[k - 1])), String(order));
  });

  it('SETTINGS: "Sound · display · reminders · account" right under the title', () => {
    const s = read('src/screens/settings/SettingsScreen.tsx');
    assert.match(s, />SETTINGS<\/Text>\n\s*<Text style=\{styles\.headerSubtitle\}[^>]*>Sound · display · reminders · account<\/Text>/);
    const st = styleOf(s, 'headerSubtitle');
    assert.match(st, /fonts\.barlowRegular/);
    assert.match(st, /fontSize: 12\.5/);
    assert.match(st, /colors\.textSub/);
    // Each word has a section behind it on the same screen.
    for (const t of ['title="SOUND"', 'title="DISPLAY & ACCESSIBILITY"', '>REMINDERS</Text>', 'title="ACCOUNT"']) assert.ok(s.includes(t), t);
  });

  it('Audio Community: the line names the four tabs, in its old style', () => {
    const s = read('src/screens/directory/AudioCommunityDirectoryScreen.tsx');
    assert.match(s, /<Text style=\{st\.sub\}>Directory · forum · your profile · requests<\/Text>/);
    assert.ok(!s.includes('<Text style={st.sub}>Pro Audio Training Academy</Text>'));
    for (const t of ["label: 'DIRECTORY'", "label: 'FORUM'", "label: 'MY PROFILE'", "label: 'REQUESTS'"]) assert.ok(s.includes(t), t);
  });
});

describe('STUDY is orange everywhere (owner 2026-11-24)', () => {
  it('one Study colour: the Study Dashboard circle’s orange, not the blue', () => {
    assert.match(TOKENS, /\nexport const STUDY_COLOR = colors\.orange;\n/);
    assert.equal(colors.orange, '#ff8a1e');
    assert.equal(colors.orange, placeColor('study'));
    assert.match(TOKENS, /export function studyRgba\(alpha: number\): string \{\n\s*return `rgba\(255,138,30,\$\{alpha\}\)`;/);
    assert.equal(colors.blue, '#2f9bff'); // not redefined: it is Labs now
    assert.equal(placeColor('labs'), '#2f9bff');
  });

  it('the STUDY nav label and its glow', () => {
    const s = read('src/components/nav/NavIcon.tsx');
    const study = /case 'Study':\n([^]*?)case 'Achievements'/.exec(s)?.[1] ?? '';
    assert.match(study, /color: STUDY_COLOR, glowRgba: studyRgba\(0\.7\)/);
    assert.doesNotMatch(study, BLUE_RE);
  });

  it('STUDY / STUDY ALL on the enrollment cards: text, frame and fill', () => {
    const s = read('src/screens/enrollment/EnrollmentSelection.tsx');
    const btn = styleOf(s, 'studyBtn');
    assert.match(btn, /borderColor: STUDY_COLOR/);
    assert.match(btn, /backgroundColor: studyRgba\(0\.14\)/);
    assert.match(styleOf(s, 'studyText'), /color: STUDY_COLOR/);
    for (const n of ['studyBtn', 'studyText']) assert.doesNotMatch(styleOf(s, n), BLUE_RE, n);
  });

  it('GlassButton tint "study" (Home STUDY NOW) and the "Study Topic" caption', () => {
    const g = read('src/components/GlassButton.tsx');
    const tint = /\n {2}study: \{([^}]*)\}/.exec(g)?.[1] ?? '';
    assert.match(tint, /color: STUDY_COLOR/);
    assert.match(tint, /glow: studyRgba\(0\.7\)/);
    assert.doesNotMatch(tint, BLUE_RE);
    const home = read('src/screens/courses/CourseSelectionScreen.tsx');
    assert.match(home, /label="STUDY NOW"\n\s*tint="study"/);
    assert.match(styleOf(home, 'freeTopicStudy'), /color: STUDY_COLOR/);
  });

  it('the Dashboard’s Study key and the credential STUDY NOW', () => {
    const d = styleOf(read('src/screens/dashboard/DashboardScreen.tsx'), 'studyLogo');
    assert.match(d, /studyRgba\(/);
    assert.doesNotMatch(d, BLUE_RE);
    const c = read('src/screens/awards/CredentialDetailModal.tsx');
    for (const n of ['studyBtn', 'studyBtnText']) assert.doesNotMatch(styleOf(c, n), BLUE_RE, n);
    assert.match(styleOf(c, 'studyBtnText'), /color: STUDY_COLOR/);
    const e = read('src/screens/enrollment/EnrollmentScreen.tsx');
    for (const n of ['studyAllBtn', 'studyAllText', 'studyOn']) assert.doesNotMatch(styleOf(e, n), BLUE_RE, n);
  });

  it('the LOADED pill stays amber, and Labs keep the blue', () => {
    const e = read('src/screens/enrollment/EnrollmentScreen.tsx');
    assert.match(styleOf(e, 'loadPillOn'), /borderColor: colors\.amber/);
    assert.match(e, /loadPillTextOn: \{ color: colors\.amber \}/);
    assert.notEqual(colors.amber.toLowerCase(), colors.orange.toLowerCase());
    assert.match(styleOf(e, 'labCard'), /47,155,255/);
    assert.match(styleOf(read('src/screens/enrollment/EnrollmentSelection.tsx'), 'loadText'), /color: colors\.amber/);
  });
});
