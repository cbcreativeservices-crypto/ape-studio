/**
 * "Mute audio when I leave the app" — Settings toggle (owner 2026-10-01:
 * "Leaving the app mutes audio — make it optional in Settings").
 *
 * Pinned here:
 *  1. The preference defaults ON (today's behaviour) in the pure mirror AND in
 *     the persisted settings defaults, and an account reset restores it.
 *  2. Background with ON runs the full mute (panicMuteAudio).
 *  3. Background with OFF still stops every sound, but never disables output.
 *  4. The enable popup's leave-the-app sentence is conditional on the setting.
 *  5. The store's sound-stop signal reaches lab transports without moving the
 *     gate, and panicMuteAudio's split keeps its full silencing pass.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it, mock } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const leave = await import('../src/features/audio/leaveAppMute.ts');
const store = await import('../src/features/audio/audioOutputStore.ts');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel: string) => readFileSync(ROOT + rel, 'utf8');
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\/.*$/gm, '');

describe('the preference defaults ON', () => {
  it('the mirror starts ON', () => {
    assert.equal(leave.MUTE_ON_LEAVE_DEFAULT, true);
    assert.equal(leave.muteOnLeaveEnabled(), true);
  });

  it('only an explicit false turns it off', () => {
    leave.setMuteOnLeave(false);
    assert.equal(leave.muteOnLeaveEnabled(), false);
    leave.setMuteOnLeave(undefined as unknown as boolean); // old saved blob, no key
    assert.equal(leave.muteOnLeaveEnabled(), true);
  });

  it('is persisted in ape:settings with the default ON and reset on account switch', () => {
    const s = code('src/features/settings/store.ts');
    assert.match(s, /muteAudioOnLeave:\s*boolean/);
    assert.match(s, /muteAudioOnLeave:\s*MUTE_ON_LEAVE_DEFAULT/);
    assert.match(s, /setMuteOnLeave\(merged\.muteAudioOnLeave\)/); // load
    assert.match(s, /setMuteOnLeave\(s\.muteAudioOnLeave\)/); // save
    assert.match(s, /setMuteOnLeave\(DEFAULT_LOCAL_SETTINGS\.muteAudioOnLeave\)/); // resetLocal
  });
});

describe('leaving the app', () => {
  it('ON → the full mute (panicMuteAudio), not the soft stop', () => {
    const panicMute = mock.fn();
    const stopAllSound = mock.fn();
    assert.equal(leave.onLeaveApp(true, { panicMute, stopAllSound }), 'mute');
    assert.equal(panicMute.mock.callCount(), 1);
    assert.equal(stopAllSound.mock.callCount(), 0);
  });

  it('OFF → every sound stops, but output is not disabled', () => {
    const panicMute = mock.fn();
    const stopAllSound = mock.fn();
    assert.equal(leave.onLeaveApp(false, { panicMute, stopAllSound }), 'stopSound');
    assert.equal(stopAllSound.mock.callCount(), 1);
    assert.equal(panicMute.mock.callCount(), 0);
  });

  it('the gate routes background through the setting', () => {
    const g = code('src/features/audio/AudioOutputGate.tsx');
    const bg = g.slice(g.indexOf("state === 'background'"), g.indexOf("state === 'active'"));
    assert.match(bg, /onLeaveApp\(muteOnLeaveEnabled\(\),\s*\{\s*panicMute:\s*panicMuteAudio,\s*stopAllSound\s*\}\)/);
    assert.doesNotMatch(bg, /disableAudioOutput\s*\(/);
  });

  it('stopAllSound runs the same silencing pass as panicMuteAudio, minus the gate lock', () => {
    const p = code('src/features/audio/panicMute.ts');
    const body = (name: string) => {
      const i = p.indexOf(`export function ${name}`);
      return p.slice(i, p.indexOf('\n}', i));
    };
    assert.match(body('panicMuteAudio'), /silenceEverything\(\)/);
    assert.match(body('panicMuteAudio'), /disableAudioOutput\(\)/);
    assert.match(body('stopAllSound'), /silenceEverything\(\)/);
    assert.match(body('stopAllSound'), /signalSoundStopped\(\)/);
    assert.doesNotMatch(body('stopAllSound'), /disableAudioOutput/);
    const silence = p.slice(p.indexOf('function silenceEverything'));
    for (const stop of ['stopAllFilePlayers()', 'ApeDsp.genStop()', 'ApeDsp.binStop()', 'ApeDsp.modStop()', 'ApeDsp.fxReset()', 'Speech.stop()']) {
      assert.ok(silence.includes(stop), `silenceEverything still calls ${stop}`);
    }
  });

  it('the sound-stop signal notifies listeners and leaves the gate where it was', () => {
    store.enableAudioOutput();
    const seen: number[] = [];
    const off = store.subscribeAudioOutput(() => seen.push(store.getSoundStopEpoch()));
    const before = store.getSoundStopEpoch();
    store.signalSoundStopped();
    off();
    assert.deepEqual(seen, [before + 1]);
    assert.equal(store.isAudioOutputEnabled(), true);
    store.disableAudioOutput();
  });

  it('lab transport hooks unwind on the sound-stop signal', () => {
    assert.match(code('src/features/audio/useStopWhenSilenced.ts'), /\(fell \|\| stoppedAll\) && runningRef\.current/);
    assert.match(code('src/features/audio/useStopOnAudioMute.ts'), /getSoundStopEpoch\(\)/);
  });
});

describe('the copy is true for the current setting', () => {
  it('the "mutes when you leave the app" sentence shows only when ON', () => {
    assert.match(leave.enableAudioBody(true), /mutes when you leave the app/);
    assert.doesNotMatch(leave.enableAudioBody(false), /mutes when you leave the app/);
    assert.match(leave.enableAudioBody(false), /When you leave the app, any sound that is playing stops/);
    for (const on of [true, false]) assert.match(leave.enableAudioBody(on), /20 minutes untouched/);
  });

  it('the popup renders the conditional body, not a hard-coded sentence', () => {
    const g = code('src/features/audio/AudioOutputGate.tsx');
    assert.match(g, /\{enableAudioBody\(muteOnLeaveEnabled\(\)\)\}/);
    assert.doesNotMatch(g, /mutes when you leave the app/);
  });

  it('Settings shows the toggle with its label as the accessibility label', () => {
    const s = code('src/screens/settings/SettingsScreen.tsx');
    assert.match(s, /on=\{local\.muteAudioOnLeave\}\s*label=\{MUTE_ON_LEAVE_LABEL\}/);
    assert.match(s, /setLocalKey\('muteAudioOnLeave', v\)/);
    assert.equal(leave.MUTE_ON_LEAVE_LABEL, 'Mute audio when I leave the app');
    assert.match(leave.MUTE_ON_LEAVE_HINT, /^On: .* Off: any sound that is playing stops when you leave/);
  });
});
