/**
 * The audio output gate stays ON while the learner is using the app
 * (owner, build 32, 2026-09-30: "if a student turns on audio it should stay on,
 * also if they're switching screens … if they're continuing to use it, it's
 * muting too soon").
 *
 * Pinned here:
 *  1. Changing screens never re-locks the gate — no screen or shared component
 *     calls disableAudioOutput / panicMuteAudio; screens stop only their own
 *     sound (useStopOnClose / useStopOnBlur).
 *  2. A SIGNED_IN that merely re-announces the account already signed in
 *     (session restore, web tab refocus) does not mute; a new sign-in does.
 *  3. The 20-minute idle auto-mute counts PLAYING sound as use: it re-arms
 *     while a file player or native voice is sounding, and fires only after
 *     20 minutes with no touch and nothing sounding.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const store = await import('../src/features/audio/audioOutputStore.ts');
const players = await import('../src/features/audio/filePlayers.ts');
const { authEventReMute } = await import('../src/features/audio/authReMute.ts');

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('screen changes never re-lock the gate', () => {
  it('no screen or shared component calls disableAudioOutput / panicMuteAudio', () => {
    const files = [...walk(join(ROOT, 'src/screens')), ...walk(join(ROOT, 'src/components'))];
    const offenders = files.filter((f) => {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      return /\b(disableAudioOutput|panicMuteAudio)\s*\(/.test(code);
    });
    assert.deepEqual(offenders, []);
  });

  it('the blur / close hooks stop the screen\'s own sound, not the gate', () => {
    const src = readFileSync(join(ROOT, 'src/features/audio/useStopOnBlur.ts'), 'utf8');
    assert.doesNotMatch(src, /import[^;]*\b(disableAudioOutput|panicMuteAudio)\b/);
  });
});

describe('auth re-mute: only a NEW sign-in mutes', () => {
  const real = (id: string) => ({ user: { id, is_anonymous: false } });
  const anon = { user: { id: 'anon-1', is_anonymous: true } };

  it('first sign-in mutes and remembers the account', () => {
    assert.deepEqual(authEventReMute('SIGNED_IN', real('a'), null), { mute: true, known: 'a' });
  });

  it('the same account re-announced (restore / tab refocus) does not mute', () => {
    assert.deepEqual(authEventReMute('SIGNED_IN', real('a'), 'a'), { mute: false, known: 'a' });
  });

  it('INITIAL_SESSION / TOKEN_REFRESHED learn the account without muting', () => {
    assert.deepEqual(authEventReMute('INITIAL_SESSION', real('a'), null), { mute: false, known: 'a' });
    assert.deepEqual(authEventReMute('TOKEN_REFRESHED', real('a'), null), { mute: false, known: 'a' });
    // …so a later re-announcement of them keeps sound on.
    assert.equal(authEventReMute('SIGNED_IN', real('a'), 'a').mute, false);
  });

  it('a different account, or a sign-in after sign-out, still mutes', () => {
    assert.equal(authEventReMute('SIGNED_IN', real('b'), 'a').mute, true);
    const out = authEventReMute('SIGNED_OUT', null, 'a');
    assert.deepEqual(out, { mute: false, known: null });
    assert.equal(authEventReMute('SIGNED_IN', real('a'), out.known).mute, true);
    assert.equal(authEventReMute('PASSWORD_RECOVERY', real('a'), null).mute, true);
  });

  it('an anonymous glossary session never mutes', () => {
    assert.deepEqual(authEventReMute('SIGNED_IN', anon, 'a'), { mute: false, known: 'a' });
  });

  it('the gate routes its auth listener through authEventReMute', () => {
    const gate = readFileSync(join(ROOT, 'src/features/audio/AudioOutputGate.tsx'), 'utf8');
    assert.match(gate, /authEventReMute\(event, session, knownUser\)/);
    assert.match(gate, /setOutputSoundingProbe\(/);
  });
});

describe('20-minute idle auto-mute counts playing sound as use', () => {
  const MIN = 60_000;
  let fake: { playing: boolean; pause(): void };

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000 });
    players.__resetFilePlayersForTests();
    store.setOutputSoundingProbe(null);
    store.disableAudioOutput();
    fake = {
      playing: false,
      pause() {
        this.playing = false;
      },
    };
  });

  afterEach(() => {
    store.disableAudioOutput();
    store.setOutputSoundingProbe(null);
    players.__resetFilePlayersForTests();
    mock.timers.reset();
  });

  it('IDLE_MS is 20 minutes', () => {
    assert.equal(store.IDLE_MS, 20 * MIN);
  });

  it('silent and untouched for 20 minutes → mutes', () => {
    store.enableAudioOutput();
    mock.timers.tick(20 * MIN - 1);
    assert.equal(store.isAudioOutputEnabled(), true);
    mock.timers.tick(1);
    assert.equal(store.isAudioOutputEnabled(), false);
  });

  it('a touch restarts the 20 minutes', () => {
    store.enableAudioOutput();
    mock.timers.tick(15 * MIN);
    store.touchAudioActivity();
    mock.timers.tick(15 * MIN);
    assert.equal(store.isAudioOutputEnabled(), true, 'muted 15 min after a touch');
    mock.timers.tick(5 * MIN);
    assert.equal(store.isAudioOutputEnabled(), false);
  });

  it('a file player that is still playing keeps the gate on', () => {
    store.enableAudioOutput();
    players.registerFilePlayer(fake);
    fake.playing = true;
    mock.timers.tick(45 * MIN);
    assert.equal(store.isAudioOutputEnabled(), true, 'muted while a clip was playing');
    fake.playing = false;
    mock.timers.tick(20 * MIN);
    assert.equal(store.isAudioOutputEnabled(), false, 'silence for 20 min must still mute');
  });

  it('a running native voice keeps the gate on; a throwing probe does not', () => {
    let running = true;
    store.setOutputSoundingProbe(() => running);
    store.enableAudioOutput();
    mock.timers.tick(60 * MIN);
    assert.equal(store.isAudioOutputEnabled(), true);
    running = false;
    mock.timers.tick(20 * MIN);
    assert.equal(store.isAudioOutputEnabled(), false);

    store.setOutputSoundingProbe(() => {
      throw new Error('native gone');
    });
    store.enableAudioOutput();
    mock.timers.tick(20 * MIN);
    assert.equal(store.isAudioOutputEnabled(), false);
  });

  it('the session bypass still defeats the timer entirely', () => {
    store.setIdleBypass(true);
    store.enableAudioOutput();
    mock.timers.tick(120 * MIN);
    assert.equal(store.isAudioOutputEnabled(), true);
  });
});
