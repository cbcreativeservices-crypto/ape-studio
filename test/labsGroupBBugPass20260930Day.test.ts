/**
 * Labs group B — "toddler + cat" bug pass 1 of 3, 2026-09-30 (day). Source
 * guards pin the SHAPE of each screen fix (the reasoning sits in the comment
 * beside it in the source).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── credit is never removed (owner 2026-09-29) ──────────────────────────────

test('Tuning: RESET is a practice run — completed chapters are never deleted', () => {
  const t = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.doesNotMatch(t, /resetTuningProgress/);
  assert.doesNotMatch(t, /completed: \[\], lastChapter: 0, done: false, mathView \}/);
  const reset = t.slice(t.indexOf('const confirmReset'), t.indexOf('const def = '));
  assert.match(reset, /goTo\(CHAPTERS\[0\]\.index\)/);
  assert.match(reset, /stay complete/);
});

test('Sound Systems: hub and in-mode RESET keep pages, capstones, exercises and faults', () => {
  const hub = read('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx');
  assert.doesNotMatch(hub, /resetSoundSystemsProgress|resetPagedProgress/);
  assert.match(hub, /savePagedProgress\(m\.labId, \{ \.\.\.p, lastPage: 0 \}\)/);
  assert.match(hub, /clearPageMemory\(SS_MODES\.map/);
  const ss = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
  assert.doesNotMatch(ss, /resetSoundSystemsLists\(|resetPagedProgress\(/);
  const reset = ss.slice(ss.indexOf('const doReset'), ss.indexOf('const confirmReset'));
  assert.match(reset, /clearPageMemory\(\[labId\]\);\n\s*goTo\(0\);\n\s*setResetSeq/);
});

test('Tuning follows the house guest rule its own end screen promises', () => {
  const t = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(t, /const guest = useLabEndGuest\(\);/);
  // pass 3: a copy restored as a guest is never written either
  assert.match(t, /if \(!guestRef\.current && !loadedAsGuestRef\.current\) void saveTuningProgress\(next\);/);
  assert.match(t, /guestRef\.current \? \{ completed: \[\], lastChapter: 0, done: false, mathView: false \} : stored/);
});

// ── same-frame double taps ──────────────────────────────────────────────────

test('Ear training: a doubled answer scores once; a doubled ▶ spends one replay', () => {
  const s = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  const answer = s.slice(s.indexOf('const onAnswer = useCallback'), s.indexOf('const onAnswer = useCallback') + 400);
  assert.match(answer, /\|\| answeredRef\.current\) return;\n\s*answeredRef\.current = true;/);
  // re-armed only when the next trial is on screen
  assert.match(s, /answeredRef\.current = false;\n\s*setTrial\(t\);\n\s*setPhase\('answering'\);/);
  const play = s.slice(s.indexOf('const onPlay = useCallback'), s.indexOf('const onAnswer = useCallback'));
  assert.match(play, /playingNowRef\.current === i/);
  assert.match(play, /if \(playReqRef\.current\) return;/);
  assert.match(play, /playingNowRef\.current = i;\n\s*setPlaying\(i\);/);
});

test('Amp Module 8: one scored diagnosis pick per waveform', () => {
  const s = read('src/screens/lab/amp/modules/mod8Apply.tsx');
  assert.match(s, /if \(diagScoredRef\.current === diagIdx\) return;\n\s*diagScoredRef\.current = diagIdx;/);
  assert.match(s, /diagScoredRef\.current = -1; setDiagIdx\(0\)/);
});

test('Harmonograph viewer: SAVE / SHARE / PRINT are single-flight (no duplicate photo)', () => {
  const s = read('src/screens/lab/HarmonographViewer.tsx');
  assert.match(s, /const busyRef = useRef\(false\);/);
  assert.equal((s.match(/\|\| !claim\(\)\) return;/g) ?? []).length, 3);
  assert.equal((s.match(/\.finally\(release\);/g) ?? []).length, 3);
});

// ── sound: display and audio agree; no stop of a newer start ────────────────

test('Bass: a superseded model start stops the generator only if no newer start owns it', () => {
  const s = read('src/screens/lab/BassLabScreen.tsx');
  assert.match(s, /modelGenRef\.current = gen;\n\s*try \{\n\s*await ApeDsp\.genStart\(\);/);
  assert.match(s, /if \(modelGenRef\.current === gen\) void ApeDsp\.genStop\(\);/);
  assert.doesNotMatch(s, /if \(gen !== genRef\.current \|\| !isAudioOutputEnabled\(\)\)/);
});

test('Fx labs: a source or fader moved during the native start is pushed once it resolves', () => {
  const s = read('src/screens/lab/FxLabScreen.tsx');
  assert.match(s, /latestRef\.current = \{ sourceIdx, values \};/);
  assert.match(s, /if \(latest\.values !== values\) pushAllParams\(latest\.values\);/);
});

test('FM: a control changed during the native start is pushed once it resolves', () => {
  const s = read('src/screens/lab/FmLabScreen.tsx');
  assert.match(s, /pushRef\.current = pushParams;/);
  const strike = s.slice(s.indexOf('const strike = useCallback'), s.indexOf('const stop = useCallback'));
  assert.ok(strike.indexOf('if (pushRef.current !== pushParams) pushRef.current();') < strike.indexOf('setRunning(true);'));
  assert.ok(strike.indexOf('if (pushRef.current !== pushParams) pushRef.current();') > strike.indexOf('if (gen !== genRef.current) {'));
});

test('Lab display text ≥ 9 pt: Harmonics piano C labels, mic-select verdicts, amplitude spectrogram labels', () => {
  assert.doesNotMatch(read('src/screens/lab/HarmonicsView.tsx'), /fontSize=\{7\}/);
  assert.match(read('src/screens/lab/micselect/MicSelectLabScreen.tsx'), /srcVerdict: \{ fontFamily: fonts\.oswaldSemiBold, fontSize: 9,/);
  assert.match(read('src/screens/lab/amplitude/AmplitudeOrientation.tsx'), /spectroTimeLabel: \{ fontFamily: fonts\.oswaldSemiBold, fontSize: 9,/);
});

test('Speech checks page marks itself from an effect, never inside a state updater', () => {
  const s = read('src/screens/lab/speech/speechPagesB.tsx');
  assert.match(s, /const bump = \(\) => setN\(\(c\) => c \+ 1\);/);
  assert.match(s, /if \(n >= PASS_MARK && !isDone\) markDone\(\);/);
});
