/**
 * Source guards for the lab SHELL / RACK / lab-audio part of the bug hunt of
 * 2026-09-29 (LP1–LP8). Each test pins the SHAPE of one fix so a later edit
 * cannot quietly undo it; the reasoning lives beside each fix in the source.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('LP3 rack: nothing presents over FULL SCREEN — help and tray long-presses leave it first', () => {
  const s = read('src/screens/lab/rack/RackUnit.tsx');
  assert.match(s, /const leaveFullThen = useCallback\(\(fn: \(\) => void\) => \{/);
  // Bug pass 3 (2026-09-30): the timer is kept in a ref and cleared on unmount.
  assert.match(s, /setFull\(false\);\n\s+\/\/ The Modal fades out[^\n]*\n[\s\S]{0,120}?leaveTimer\.current = setTimeout\(\(\) => \{\n\s+leaveTimer\.current = null;\n\s+fn\(\);\n\s+\}, FULL_DISMISS_MS\);/);
  assert.match(s, /\(helpKey\?: string\) => leaveFullThen\(\(\) => onHelp\(helpKey\)\)/);
  // No surface calls the lab's onHelp directly any more — only through `help`.
  assert.doesNotMatch(s, /onHelp\?\.\(p\.helpKey\)/);
  assert.doesNotMatch(s, /onHelp=\{onHelp\}/);
  assert.equal((s.match(/onHelp=\{help\}/g) ?? []).length, 4, 'both trays + both bezel strips route through help');
  // A tray chip's own long-press (a photo) is wrapped too, and both trays get the routed param.
  assert.match(s, /onLongPress: \(\) => leaveFullThen\(o\.onLongPress as \(\) => void\)/);
  assert.equal((s.match(/<DockTray param=\{trayRouted\}/g) ?? []).length, 2);
});

test('LP3 shell: a tap on the lesson row while `lessonOpen` is stuck re-presents the sheet', () => {
  const s = read('src/screens/lab/LabShell.tsx');
  assert.match(s, /const openLesson = \(\) => \{\n\s+if \(!lessonOpen\) \{\n\s+setLessonOpen\(true\);\n\s+return;\n\s+\}\n\s+setLessonOpen\(false\);\n\s+setTimeout\(\(\) => setLessonOpen\(true\), 60\);/);
  assert.doesNotMatch(s, /onPress=\{\(\) => setLessonOpen\(true\)\}/);
});

test('LP8 full screen: Android back closes an open tray before leaving', () => {
  const f = read('src/screens/lab/rack/StageFullScreen.tsx');
  assert.match(f, /onRequestClose=\{onBack \?\? onClose\}/);
  const r = read('src/screens/lab/rack/RackUnit.tsx');
  assert.match(r, /onBack=\{\(\) => \{\n\s+if \(trayParam\) \{\n\s+closeTray\(\);\n\s+return;\n\s+\}\n\s+setFull\(false\);/);
});

test('LP6 hidden rack: its open tray gives up Android back', () => {
  const t = read('src/screens/lab/rack/DockTray.tsx');
  assert.match(t, /if \(!open \|\| !active\) return;/);
  // onClose rides a ref since 2026-10-01 (navShellBugPass20261001.test.ts).
  assert.match(t, /\}, \[open, active, navCtx\]\);/);
  const r = read('src/screens/lab/rack/RackUnit.tsx');
  assert.match(r, /maxHeight=\{rootH > 0 \? trayRoom : undefined\} active=\{active\} \/>/);
  const shell = read('src/screens/lab/LabShell.tsx');
  assert.match(shell, /onHelp=\{rack\.onHelp\}\n\s+active=\{mode === 'explore'\}/);
});

test('LP1 safety: a lab clip / tuning clip re-checks the gate right before it starts', () => {
  const p = read('src/features/lab/LabAudioPlayer.ts');
  const gate = p.indexOf("if (!isAudioOutputEnabled()) return 'blocked';");
  assert.ok(gate > 0, 'LabAudioPlayer re-checks the gate');
  // Pooled players (owner 2026-09-29): the re-check sits after every await
  // and before the pooled clip is started.
  assert.ok(gate > p.lastIndexOf('await this.load('), 'after the last await');
  assert.ok(gate < p.indexOf('got.player.play();'), 'before play()');
  const t = read('src/features/tuning/tuningAudio.ts');
  // Saved clips (owner 2026-09-29): the pooled voice or the one-slot `ear`.
  assert.match(t, /await this\.ear\.load\(\[buf\]\);\n\s+if \(my !== this\.token \|\| !voice\) return;\n(\s+\/\/[^\n]*\n)+\s+if \(!isAudioOutputEnabled\(\)\) return;\n\s+this\.voice = voice;\n\s+voice\.play\(0\);/);
});

test('LP5 Bass lab: ■ is never disabled, and the signed-URL fetch is bounded', () => {
  const b = read('src/screens/lab/BassLabScreen.tsx');
  assert.match(b, /disabled=\{sample\.loading && !running\}/);
  const p = read('src/features/lab/LabAudioPlayer.ts');
  assert.match(p, /export const LAB_AUDIO_FETCH_MS = 8000;/);
  assert.match(p, /await Promise\.race\(\[\n\s+fetchLabAudio\(labKey, assetKey\),/);
  assert.match(p, /setTimeout\(\(\) => r\(\{ asset: null, reason: 'network' \}\), LAB_AUDIO_FETCH_MS\)/);
});

test('LP2 Harmonics: the live tone auto-starts only into an open gate', () => {
  const s = read('src/screens/lab/HarmonicsView.tsx');
  assert.match(s, /if \(feedbackAllowed && !genRunning && isAudioOutputEnabled\(\)\) void startTone\(\);/);
});

test('LP4 shell: the entry audio prompt stays away under Low-Light / suppressed overlays', () => {
  const s = read('src/screens/lab/LabShell.tsx');
  const ask = s.slice(s.indexOf('const ask = () => {'));
  assert.ok(ask.indexOf('if (areOverlaysSuppressed()) return;') > 0);
  assert.ok(ask.indexOf('if (areOverlaysSuppressed()) return;') < ask.indexOf('void requestAudioOutput();'));
});

test('LP7 ear training: per-play token on the clear-timer, and the chip follows a mute', () => {
  const s = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  assert.match(s, /const my = \+\+playTokenRef\.current;/);
  assert.match(s, /if \(my === playTokenRef\.current\) setPlaying\(\(cur\) => \(cur === i \? null : cur\)\);/);
  assert.match(s, /useStopWhenSilenced\(playing != null, \(\) => \{/);
});
