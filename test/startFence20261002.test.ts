/**
 * The start fence — pattern P4, architectural closer A1 (2026-10-02).
 *
 * 1. Behaviour of startFenced / armFence against the REAL output store:
 *    a normal start reports started; the gate closing, every sound being
 *    stopped (the epoch moving) or the caller's own token being superseded
 *    while the start is in flight stops the source and reports blocked.
 *    R2: with a fence that does not re-check after the await, every
 *    "blocked" case below reports started.
 * 2. G4 RATCHET: every native or clip start in src/ goes through the helper,
 *    and no file hand-rolls the epoch check. The allowlist may only shrink.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const store = await import('../src/features/audio/audioOutputStore.ts');
const { startFenced, armFence } = await import('../src/features/audio/startFenced.ts');

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

// ── 1. behaviour ─────────────────────────────────────────────────────────────

describe('startFenced', () => {
  it('a normal start reports started with the start value, and never calls stop', async () => {
    store.enableAudioOutput();
    const stops: string[] = [];
    try {
      const r = await startFenced({
        start: async () => {
          await tick();
          return 'voice';
        },
        stop: (v, why) => stops.push(`${v}:${why}`),
        isCurrent: () => true,
      });
      assert.deepEqual(r, { status: 'started', value: 'voice' });
      assert.deepEqual(stops, []);
    } finally {
      store.disableAudioOutput();
    }
  });

  it('the gate closing mid-start (shake-to-mute, idle lock) stops the source and reports blocked', async () => {
    store.enableAudioOutput();
    const stops: string[] = [];
    try {
      const r = await startFenced({
        start: async () => {
          await tick();
          store.disableAudioOutput(); // lands while the native start is in flight
          return 'voice';
        },
        stop: (v, why) => stops.push(`${v}:${why}`),
      });
      assert.deepEqual(r, { status: 'blocked', why: 'gate' });
      assert.deepEqual(stops, ['voice:gate']);
    } finally {
      store.disableAudioOutput();
    }
  });

  it('every sound stopped mid-start (leaving the app, mute-on-leave OFF) stops the source and reports blocked — the gate is still ON', async () => {
    store.enableAudioOutput();
    const stops: string[] = [];
    try {
      const r = await startFenced({
        start: async () => {
          await tick();
          store.signalSoundStopped(); // stopAllSound: voices stop, the gate stays on
          return 'voice';
        },
        stop: (v, why) => stops.push(`${v}:${why}`),
        isCurrent: () => true,
      });
      assert.equal(store.isAudioOutputEnabled(), true, 'the gate alone cannot see this');
      assert.deepEqual(r, { status: 'blocked', why: 'epoch' });
      assert.deepEqual(stops, ['voice:epoch']);
    } finally {
      store.disableAudioOutput();
    }
  });

  it("the caller's own token superseded mid-start (■, a close, a newer ▶) stops the source and reports blocked", async () => {
    store.enableAudioOutput();
    const stops: string[] = [];
    let gen = 1;
    const mine = gen;
    try {
      const r = await startFenced({
        start: async () => {
          await tick();
          gen++; // ■ pressed while the start was in flight
          return 'voice';
        },
        stop: (v, why) => stops.push(`${v}:${why}`),
        isCurrent: () => mine === gen,
      });
      assert.deepEqual(r, { status: 'blocked', why: 'superseded' });
      assert.deepEqual(stops, ['voice:superseded']);
    } finally {
      store.disableAudioOutput();
    }
  });

  it('the gate wins over a superseded token (nothing may sound into a closed gate), then the token, then the epoch', async () => {
    store.enableAudioOutput();
    try {
      const both = await startFenced({
        start: async () => {
          await tick();
          store.disableAudioOutput();
        },
        stop: () => {},
        isCurrent: () => false,
      });
      assert.equal(both.status === 'blocked' && both.why, 'gate');
      store.enableAudioOutput();
      const tokenAndEpoch = await startFenced({
        start: async () => {
          await tick();
          store.signalSoundStopped();
        },
        stop: () => {},
        isCurrent: () => false,
      });
      assert.equal(tokenAndEpoch.status === 'blocked' && tokenAndEpoch.why, 'superseded', 'the site decides a superseded stop');
    } finally {
      store.disableAudioOutput();
    }
  });

  it('a stop that throws or rejects is swallowed; a start that throws propagates untouched', async () => {
    store.enableAudioOutput();
    try {
      const thrown = await startFenced({
        start: async () => {
          await tick();
          store.signalSoundStopped();
        },
        stop: () => {
          throw new Error('native stop threw');
        },
      });
      assert.equal(thrown.status, 'blocked');
      const rejected = await startFenced({
        start: async () => {
          await tick();
          store.signalSoundStopped();
        },
        stop: () => Promise.reject(new Error('native stop rejected')),
      });
      assert.equal(rejected.status, 'blocked');
      await tick(); // an unhandled rejection would fail the run here
      await assert.rejects(
        startFenced({
          start: async () => {
            throw new Error('AUDIO UNAVAILABLE');
          },
          stop: () => {},
        }),
        /AUDIO UNAVAILABLE/,
      );
    } finally {
      store.disableAudioOutput();
    }
  });

  it('a synchronous start is fenced the same way', async () => {
    store.enableAudioOutput();
    try {
      const r = await startFenced({ start: () => 7, stop: () => {} });
      assert.deepEqual(r, { status: 'started', value: 7 });
    } finally {
      store.disableAudioOutput();
    }
  });
});

describe('armFence (a start deferred by a timer)', () => {
  it('reports null while open; the gate, the caller token, then the epoch when not', () => {
    store.enableAudioOutput();
    try {
      let current = true;
      const blocked = armFence(() => current);
      assert.equal(blocked(), null);
      store.signalSoundStopped();
      assert.equal(blocked(), 'epoch');
      current = false;
      assert.equal(blocked(), 'superseded');
      store.disableAudioOutput();
      assert.equal(blocked(), 'gate');
    } finally {
      store.disableAudioOutput();
    }
  });
  it('is armed on the epoch of the moment it was armed, not of the first ask', () => {
    store.enableAudioOutput();
    try {
      store.signalSoundStopped();
      const blocked = armFence();
      assert.equal(blocked(), null, 'an earlier stop-all does not block a later arm');
    } finally {
      store.disableAudioOutput();
    }
  });
});

// ── 2. G4 ratchet ────────────────────────────────────────────────────────────

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(ROOT, p).replace(/\\/g, '/');
/** Source with comments removed, so a doc comment never counts as a start. */
const code = (p: string) =>
  readFileSync(p, 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const FILES = walk(SRC);
const FENCE = 'src/features/audio/startFenced.ts';

/** (b) Clip owners that need no fence, each with the reason. May only shrink. */
const CLIP_ALLOW: Record<string, string> = {
  'src/features/ear/earPlayer.ts': 'load() never sounds and play(i) is synchronous; every async caller fences its load',
  'src/components/AudioPlayer.tsx': 'plays synchronously in the gate\'s own continuation; the gate ask is the only await and resolves true only while open',
  'src/components/SpeakButton.tsx': 'speaks synchronously in the gate\'s own continuation; the gate ask is the only await and resolves true only while open',
  'src/screens/lab/eartraining/EarModuleScreen.tsx': 'plays synchronously after the gate ask (the only await); the trial load never sounds',
};

/** (c) The only files that may read the epoch by hand: the store, the fence,
 *  and the two transport unwinders that act on the epoch's CHANGE. */
const EPOCH_ALLOW = new Set([
  'src/features/audio/audioOutputStore.ts',
  FENCE,
  'src/features/audio/useStopWhenSilenced.ts',
  'src/features/audio/useStopOnAudioMute.ts',
]);

describe('G4 ratchet: every native or clip start in src/ goes through the start fence', () => {
  it('(a) every ApeDsp gen/bin/mod start is the fence\'s `start`, its stop silences that voice, and none is awaited bare', () => {
    let natives = 0;
    for (const p of FILES) {
      const f = rel(p);
      if (f === FENCE) continue;
      const s = code(p);
      for (const kind of ['gen', 'bin', 'mod'] as const) {
        const starts = s.match(new RegExp(`ApeDsp\\.${kind}Start\\(`, 'g'))?.length ?? 0;
        if (starts === 0) continue;
        natives += starts;
        const fenced = s.match(new RegExp(`startFenced\\(\\{\\s*start: \\(\\) => ApeDsp\\.${kind}Start\\(\\),`, 'g'))?.length ?? 0;
        assert.equal(fenced, starts, `${f}: every ${kind}Start must be the fence's start (startFenced({ start: () => ApeDsp.${kind}Start(), … }))`);
        assert.doesNotMatch(s, new RegExp(`await ApeDsp\\.${kind}Start\\(`), `${f}: a bare await of ${kind}Start escapes the fence`);
        let at = -1;
        for (let n = 0; n < starts; n++) {
          at = s.indexOf('startFenced({', at + 1);
          const stop = s.slice(s.indexOf('stop:', at), s.indexOf('isCurrent:', at));
          assert.match(stop, new RegExp(`ApeDsp\\.${kind}Stop\\(\\)`), `${f}: the fence's stop must call ${kind}Stop`);
        }
        assert.match(s, /import \{[^}]*\bstartFenced\b[^}]*\} from '(\.\.\/)+features\/audio\/startFenced'/, `${f}: imports the fence`);
      }
    }
    assert.ok(natives >= 20, `expected the 20 known native starts, found ${natives}`);
  });

  it('(b) every file that owns a clip player or an utterance fences its start, or is allowlisted with a reason', () => {
    const owners = FILES.filter((p) => /new EarClipPlayer\(|createAudioPlayer\(|useAudioPlayer\(|Speech\.speak\(/.test(code(p))).map(rel);
    assert.ok(owners.length >= 10, `expected the known clip owners, found ${owners.length}`);
    for (const f of owners) {
      const s = code(join(ROOT, f));
      const fenced = /\b(startFenced|armFence)\(/.test(s) && /from '(\.\.?\/)+([\w-]+\/)*startFenced'/.test(s);
      if (fenced) {
        assert.ok(!(f in CLIP_ALLOW), `${f} is fenced — drop it from CLIP_ALLOW (the list may only shrink)`);
        continue;
      }
      assert.ok(f in CLIP_ALLOW, `${f} owns a clip player / utterance and does not go through startFenced — fence it, or allowlist it with a reason`);
    }
    for (const f of Object.keys(CLIP_ALLOW)) assert.ok(existsSync(join(ROOT, f)), `${f} is on CLIP_ALLOW but gone — remove it`);
  });

  it('(c) no file hand-rolls the fence: getSoundStopEpoch() is read only by the store, the fence and the unwinders', () => {
    for (const p of FILES) {
      const f = rel(p);
      if (EPOCH_ALLOW.has(f)) continue;
      assert.doesNotMatch(code(p), /getSoundStopEpoch\(\)/, `${f}: reads the sound-stop epoch by hand — use startFenced / armFence`);
    }
  });
});
