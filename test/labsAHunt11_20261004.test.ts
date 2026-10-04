/**
 * Labs A — hunt 11 (2026-10-04). Receipts.
 *
 * K8 OPEN ITEM — a clip-player LOAD failure was silent. EarClipPlayer.load
 * rethrows a refused WAV write (disk full, cache cleared); every clip lab in
 * this area caught it and said nothing:
 *  1. Ear training (EarModuleScreen): the catch was empty. ▶ then lit ■ over
 *     silence — or over the PREVIOUS trial's player, whose file load() had
 *     already deleted — and spent a top-level replay on it.
 *  2. Mixing (useMixPlayback): the catch dropped the pressed ▶ back to idle
 *     with no word; the learner pressed and nothing happened.
 *  3. Tuning & Temperament (TuningPlayer.renderAndPlay): the status cleared to
 *     "Sound: stopped" / STOPPED.
 * Each now shows the shared AUDIO_UNAVAILABLE_MESSAGE (or NO SOUND in a rack
 * bezel cell), and a quiet pre-render nobody asked for stays quiet.
 *
 * K6 — Tube card: an image that failed to DOWNLOAD showed the reason left over
 * from an earlier page's refusal ("needs an active Academy sign-in" / "isn't
 * available … let us know").
 *
 * R2: run against the HEAD files and failed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

describe('Ear training: a failed clip load is told, and ▶ retries it', () => {
  const s = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  it('imports the shared message', () => {
    assert.match(s, /import \{ AUDIO_UNAVAILABLE_MESSAGE \} from '\.\.\/\.\.\/\.\.\/\.\.\/modules\/ape-dsp';/);
  });
  it('the trial load failure sets the flag and the message (never an empty catch)', () => {
    const body = between(s, 'const beginTrial = useCallback(', 'setTrial(t);');
    assert.match(body, /catch \{[\s\S]*?loadOk = false;[\s\S]*?\}/);
    assert.match(body, /loadFailedRef\.current = !loadOk;/);
    assert.match(body, /setClipError\(loadOk \? null : AUDIO_UNAVAILABLE_MESSAGE\);/);
  });
  it('▶ reloads a failed trial BEFORE the gate ask, and refuses to light ■ when it still fails', () => {
    const body = between(s, 'const onPlay = useCallback(', 'const onAnswer = useCallback(');
    const retry = body.indexOf('if (loadFailedRef.current)');
    const gate = body.indexOf('okOut = await requestAudioOutput();');
    assert.ok(retry > 0 && gate > retry, 'the retry must come before the gate ask');
    const block = body.slice(retry, gate);
    assert.match(block, /await player\(\)\?\.load\(trial\.clips\.map\(\(c\) => c\.buf\)\);/);
    assert.match(block, /catch \{\s*if \(aliveRef\.current\) setClipError\(AUDIO_UNAVAILABLE_MESSAGE\);\s*return;/);
    assert.match(block, /busyRef\.current = true;[\s\S]*finally \{\s*busyRef\.current = false;/);
  });
  it('the message is on screen as an alert under the transport', () => {
    assert.match(s, /\{transport\}\s*\{clipError \? \(\s*<Text style=\{styles\.clipError\} accessibilityRole="alert">/);
  });
});

describe('Mixing: a requested play whose clips failed to load is told', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  it('imports the shared message', () => {
    assert.match(s, /import \{ AUDIO_UNAVAILABLE_MESSAGE \} from '\.\.\/\.\.\/\.\.\/\.\.\/modules\/ape-dsp';/);
  });
  it('the render catch marks the ASKED-FOR variant failed (a quiet pre-render has none)', () => {
    const body = between(s, 'const renderAll = useCallback(', 'const renderAllRef = useRef(renderAll);');
    const c = body.slice(body.lastIndexOf('} catch {'));
    assert.match(c, /if \(current\(\)\) \{\s*if \(pendingRef\.current\) setFailed\(pendingRef\.current\);/);
    assert.match(body, /setFailed\(null\);\s*setStatus\('ready'\);/);
  });
  it('a press, and a new console, clear it', () => {
    assert.match(between(s, 'const play = useCallback(', 'const stop = useCallback('), /cancelReplay\(\);\s*setFailed\(null\);/);
    assert.match(between(s, '// New variant set →', '// PRE-RENDER WHILE THE LEARNER READS'), /setFailed\(null\);/);
  });
  it('the row that asked shows AUDIO_UNAVAILABLE_MESSAGE', () => {
    const ab = between(s, 'export function AbPlayer(', 'export function ConceptList(');
    assert.match(ab, /const failedHere = pb\.failed != null && variants\.some\(\(v\) => v\.id === pb\.failed\);/);
    assert.match(ab, /\{failedHere \? \(\s*<Text style=\{styles\.unavailable\} accessibilityRole="alert">\s*\{AUDIO_UNAVAILABLE_MESSAGE\}/);
  });
  it('the quiet pre-render still queues no play (perf receipt unchanged)', () => {
    const eff = between(s, '// PRE-RENDER WHILE THE LEARNER READS', 'const renderAll = useCallback(');
    assert.ok(!/pendingRef\.current =/.test(eff));
    assert.ok(!/setFailed\(/.test(eff));
  });
});

describe('Tuning & Temperament: a failed clip load reads as no sound, not "stopped"', () => {
  const a = read('src/features/tuning/tuningAudio.ts');
  it('renderAndPlay tells the learner (only when no STOP / newer press took over)', () => {
    const body = between(a, 'async renderAndPlay(', 'preload(makes:');
    assert.match(body, /await this\.play\(make\(\), label\);\s*\} catch \{[\s\S]*?if \(this\.token === my \+ 1\) \{\s*this\.set\(\{ playing: false, label: null, rendering: null, error: AUDIO_UNAVAILABLE_MESSAGE \}\);/);
  });
  it('STOP clears it', () => {
    assert.match(a, /if \(this\.status\.playing \|\| this\.status\.rendering \|\| this\.status\.error\) this\.set\(\{ playing: false, label: null, rendering: null \}\);/);
  });
  it('the footer, the spoken line and the rack bezel all show it', () => {
    const scr = read('src/screens/lab/tuning/TuningLabScreen.tsx');
    assert.match(scr, /: status\.error\s*\? status\.error\s*: 'Sound stopped';/);
    assert.match(scr, /: status\.error \? status\.error : 'Sound: stopped'\}/);
    const rack = read('src/screens/lab/tuning/rackLayout.tsx');
    assert.match(rack, /status\.error \? 'NO SOUND' : 'STOPPED'/);
  });
});

describe('Tube card: a download failure is a connection problem, never an earlier page\'s reason', () => {
  const s = read('src/screens/lab/tube/TubeCardScreen.tsx');
  it('the image onError resets the reason to network', () => {
    assert.match(s, /onError=\{\(\) => \{\s*setFailReason\('network'\);\s*setFailed\(true\);\s*\}\}/);
    assert.ok(!/onError=\{\(\) => setFailed\(true\)\}/.test(s));
  });
  it('a thrown fetch does too', () => {
    assert.match(s, /\.catch\(\(\) => \{\s*if \(!alive\) return;\s*setFailReason\('network'\);[^\n]*\n\s*setFailed\(true\);/);
  });
});
