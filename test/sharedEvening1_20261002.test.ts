/**
 * SHARED area — evening toddler hunt, pass 1 (2026-10-02).
 *
 * Each test names the scenario and FAILED against the code before its fix.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;

// ── LabAudioPlayer, driven for real on stub players ─────────────────────────
// The native player, the signed-URL fetch and the fence are stubbed; the
// pool logic under test is the real class.
g.__LAP_PLAYERS__ = [] as Array<{ uri: string; removed: boolean; paused: number; played: number }>;
const mod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const STUBS: Record<string, string> = {
  'expo-audio': mod(`
    export function createAudioPlayer(src) {
      const p = { uri: src.uri, removed: false, paused: 0, played: 0,
        addListener() { return { remove() {} }; },
        remove() { this.removed = true; }, pause() { this.paused++; }, play() { this.played++; },
        seekTo() { return Promise.resolve(); } };
      globalThis.__LAP_PLAYERS__.push(p);
      return p;
    }
    export async function setAudioModeAsync() {}
  `),
  './labAudio': mod(`let n = 0; export async function fetchLabAudio(lab, asset) { n++; return { asset: { url: 'u:' + asset + ':' + n }, reason: null }; }`),
  './labProbe': mod(`export function labProbe() {}`),
  '../audio/outputCeiling': mod(`export function applyCeiling() {}`),
  '../audio/filePlayers': mod(`export function unregisterFilePlayer() {}`),
  '../audio/startFenced': mod(`export async function startFenced(f) { const value = await f.start(); return { status: 'started', value }; }`),
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes('LabAudioPlayer') && STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { LabAudioPlayer, URL_REUSE_MS } = await import('../src/features/lab/LabAudioPlayer.ts');

test('LabAudioPlayer: a note re-tapped after its URL went stale does not orphan the old native player (leak until the app dies)', async () => {
  const players = g.__LAP_PLAYERS__ as Array<{ uri: string; removed: boolean }>;
  players.length = 0;
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;
  try {
    const lap = new LabAudioPlayer();
    assert.equal(await lap.play('lab', 'A4'), 'ok');
    // The learner listens, thinks, and taps the SAME note again later: the
    // pooled player is stale, so a fresh one is made for the new URL.
    now += URL_REUSE_MS + 1000;
    assert.equal(await lap.play('lab', 'A4'), 'ok');
    assert.equal(players.length, 2);
    // The first player is no longer pooled and no longer current: nobody owns
    // it, so it must have been released — before the fix it lived on, still
    // loaded, until the process died (dispose never saw it either).
    assert.equal(players[0].removed, true, 'the superseded player was never released');
    lap.dispose();
    assert.ok(players.every((p) => p.removed), 'dispose must release every player it made');
  } finally {
    Date.now = realNow;
  }
});

test('LabAudioPlayer: dispose releases the playing player even when the pool already holds a fresher one', async () => {
  const players = g.__LAP_PLAYERS__ as Array<{ uri: string; removed: boolean }>;
  players.length = 0;
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;
  try {
    const lap = new LabAudioPlayer();
    assert.equal(await lap.play('lab', 'C4'), 'ok');
    now += URL_REUSE_MS + 1000;
    // A preload refreshes the stale note while it is still `current`.
    lap.preload('lab', ['C4']);
    for (let i = 0; i < 20; i++) await Promise.resolve();
    await new Promise<void>((r) => setImmediate(r));
    assert.equal(players.length, 2);
    lap.dispose();
    assert.ok(players.every((p) => p.removed), 'the current (unpooled) player survived dispose');
  } finally {
    Date.now = realNow;
  }
});

// ── labCompletion: an account switch while mark_lab_complete is in flight ──
const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('labCompletion: a mark_lab_complete answer that lands after the account wipe does not mark the NEXT account as sent', () => {
  const src = read('../src/features/lab/labCompletion.ts');
  const fire = src.slice(src.indexOf('async function fireComplete'), src.indexOf('async function retryUnsent'));
  // The generation is captured before the await and compared after it.
  assert.match(fire, /const gen = completionGen;[\s\S]*await supabase\.rpc\('mark_lab_complete'[\s\S]*if \(gen !== completionGen\) return;[\s\S]*sent\.add\(labKey\)/);
  const reset = src.slice(src.indexOf('export function resetLocal'), src.indexOf('/** Live lab progress'));
  assert.match(reset, /completionGen\+\+|completionGen \+= 1/);
});

test('labCompletion: a device read that lands after the account wipe does not merge the departing user’s units', () => {
  const src = read('../src/features/lab/labCompletion.ts');
  const hyd = src.slice(src.indexOf('function hydrate()'), src.indexOf('// Warm at boot'));
  assert.match(hyd, /const gen = completionGen;[\s\S]*await AsyncStorage\.getItem\(STORAGE_KEY\);[\s\S]*if \(gen !== completionGen\) return;[\s\S]*JSON\.parse/);
  const reset = src.slice(src.indexOf('export function resetLocal'), src.indexOf('/** Live lab progress'));
  assert.match(reset, /hydrating = null/);
});

// ── useLabNav: a DIMMED key must not eat the next real tap ─────────────────
test('useLabNav: a tap on the dimmed ⏮ / ‹ PREV does not claim the 400 ms lock (the NEXT right after it still lands)', () => {
  const src = read('../src/screens/lab/kit/useLabNav.ts');
  const start = src.slice(src.indexOf('const start = useCallback'), src.indexOf('const prev = useCallback'));
  assert.ok(start.indexOf('if (!view.startOn) return;') < start.indexOf('if (lock()) return;'), '⏮ claims the lock before knowing it does nothing');
  const prev = src.slice(src.indexOf('const prev = useCallback'), src.indexOf('const next = useCallback'));
  assert.ok(prev.indexOf('if (!view.prevOn) return;') >= 0 && prev.indexOf('if (!view.prevOn) return;') < prev.indexOf('if (lock()) return;'), '‹ PREV claims the lock before knowing it does nothing');
});
