/**
 * Labs A — full-app bug run 1 (2026-10-01 evening).
 *
 *  • HarmonicsView (Harmonic lab, LIVE mode): the tone auto-start effect ran
 *    after stopAllSound (leaving the app with "Mute audio when I leave the
 *    app" OFF leaves the gate open; with "Release microphone in the
 *    background" OFF the mic keeps capturing) and restarted the tone behind
 *    the user. It now auto-starts only while the app is in front.
 *  • Mixing lab (useMixPlayback): the armed console-edit replay was not
 *    cancelled by stopAllSound — inside its pause `active` and `pending` are
 *    null, so useStopWhenSilenced never ran stopAll — and it rendered and
 *    played behind the user. It now checks the sound-stop epoch, like the
 *    Mastering lab's useMasterPlayback.
 *  • Sound Systems page memory (soundsystems/pageMemory.ts): the module-level
 *    working-state map outlived a sign-out, and its pages complete themselves
 *    on mount — so the next account to sign in was credited with the previous
 *    account's capstones / route + operate exercises / pages. It is now
 *    dropped whenever the session-carry epoch moves (sign-out, account
 *    change, fresh Guest Mode), and kept when a guest signs in (their own
 *    work, carried by the 2026-10-01 ruling).
 * R2: every case was run against the pre-fix files and failed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) =>
  readFileSync(join(process.cwd(), p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('HarmonicsView: the LIVE tone never restarts behind the user', () => {
  const s = read('src/screens/lab/HarmonicsView.tsx');
  it('the auto-start effect requires the app to be active', () => {
    const i = s.indexOf("if (view !== 'live' || !running) return;");
    assert.ok(i > 0, 'the LIVE tone sync effect');
    const body = s.slice(i, s.indexOf('}, [view, running, feedbackAllowed, genRunning, startTone, stopTone]);', i));
    const auto = body.split('\n').find((l) => l.includes('void startTone()'));
    assert.ok(auto, 'the auto-start line');
    assert.match(auto!, /AppState\.currentState === 'active'/);
    assert.match(auto!, /isAudioOutputEnabled\(\)/);
  });
  it('AppState is imported from react-native', () => {
    assert.match(s, /import \{[^}]*\bAppState\b[^}]*\} from 'react-native';/);
  });
});

describe('Mixing lab: the armed replay never plays after every sound was stopped', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  it('the replay timer is fenced on the sound-stop epoch taken when it was armed', () => {
    const arm = s.indexOf('const armedEpoch = getSoundStopEpoch();');
    assert.ok(arm > 0, 'the epoch is captured when the replay is armed');
    const t = s.indexOf('const t = setTimeout(() => {', arm);
    assert.ok(t > arm, 'captured BEFORE the timer is set');
    const cb = s.slice(t, s.indexOf('}, REPLAY_MS);', t));
    const fence = cb.indexOf('if (getSoundStopEpoch() !== armedEpoch) return;');
    assert.ok(fence > 0, 'the timer drops the replay when the epoch moved');
    assert.ok(fence < cb.indexOf('void renderAllRef.current();'), 'before anything renders or plays');
  });
  it('getSoundStopEpoch is imported from the output store', () => {
    assert.match(s, /import \{[^}]*\bgetSoundStopEpoch\b[^}]*\} from '..\/..\/..\/features\/audio\/audioOutputStore';/);
  });
});

describe('Sound Systems page memory never crosses to another account', () => {
  const s = read('src/screens/lab/soundsystems/pageMemory.ts');
  it('the session map is dropped when the ledger epoch moves (sign-out, account change, fresh Guest Mode)', () => {
    assert.match(s, /import \{ sessionCarryEpoch \} from '..\/..\/..\/features\/lab\/sessionCarry';/);
    const fn = s.slice(s.indexOf('function liveMemory()'), s.indexOf('export const PageMemoryKey'));
    assert.match(fn, /if \(e !== memoryEpoch\) \{\s*\n\s*memory\.clear\(\);\s*\n\s*memoryEpoch = e;/);
  });
  it('every read and write of the map goes through liveMemory()', () => {
    const hook = s.slice(s.indexOf('export function usePageMemory'));
    assert.doesNotMatch(hook, /\bmemory\.(has|get|set)\(/, 'no direct, unfenced access');
    assert.match(hook, /const mem = liveMemory\(\);[\s\S]*mem\.has\(key\)/);
    assert.match(hook, /liveMemory\(\)\.set\(key, value\)/);
    const clear = s.slice(s.indexOf('export function clearPageMemory'), s.indexOf('export function usePageMemory'));
    assert.match(clear, /const mem = liveMemory\(\);/);
  });
  it('the pages that read it complete themselves on mount (why it matters)', () => {
    const build = read('src/screens/lab/soundsystems/pagesBuild.tsx');
    assert.match(build, /usePageMemory<SoundSystem>\('system'/);
    assert.match(build, /usePageMemory<ConsoleState>\('console'/);
    assert.match(build, /if \(grade\.pass\) \{\s*\n\s*markCapstonePassed\(capstone\.id\);/);
  });
});
