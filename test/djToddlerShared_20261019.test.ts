/**
 * DJ Systems Lab — toddler bug test 2026-10-19, the SHARED-file fixes (the
 * page-level ones are pinned in djToddler1to8 / 9to16 / 17to24):
 *
 *  - FaultCard (P1): a `fixed` already true when the fault starts passed at
 *    once. The card is ARMED only by a render with the fault really on, and
 *    START AGAIN restarts a fault the learner has wrecked.
 *  - useBoothAudio: `last` never went stale after a change or a stop. Each
 *    render is stamped with the booth version it was made from (`lastFresh`),
 *    and a stopped booth has no `last` (its readouts read "—").
 *  - useTakePlayer: `finished` carried over to the next take; now it belongs
 *    to the take that was played (its id).
 *  - takeStore: a take left open kept taking the next screen's chunks; the
 *    take closes as useBoothAudio unmounts.
 *  - dock: PLAY on an empty deck asked for sound.
 *  - Scene (web): a triple-tap selected a callout's words.
 *  - useBoothKit hands every page `ready`.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clearSetupPending, faultStep, kitReady, markSetupPending, setupPending } from '../src/screens/lab/dj/booth/goalStore.ts';
import { boothVersion, getBooth, readingFresh, setBooth, stopBooth, updateBooth } from '../src/screens/lab/dj/booth/boothStore.ts';
import { armTake, clearTake, closeOpenTake, finishedFor, getTake, takeOpen, writeChunk } from '../src/screens/lab/dj/booth/takeStore.ts';
import { builtBooth } from '../src/screens/lab/dj/model/djModel.ts';
import { playWantsSound } from '../src/screens/lab/dj/model/djDeck.ts';
import type { EventRender } from '../src/screens/lab/dj/engine/djEventRender.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, 'src/screens/lab/dj', p), 'utf8');

/** Run a card through renders of `fixed` values, `on` throughout. */
function run(fixedSeq: boolean[], armed = false): { armed: boolean; solved: boolean[] } {
  const solved: boolean[] = [];
  for (const f of fixedSeq) {
    const s = faultStep(armed, true, f);
    armed = s.armed;
    solved.push(s.solved);
  }
  return { armed, solved };
}

describe('FaultCard: armed only by a render with the fault really on', () => {
  it('a fixed that is already true at START never passes until the fault has shown', () => {
    assert.deepEqual(run([true, true, true]).solved, [false, false, false], 'stale fixed after START');
    assert.deepEqual(run([true, false, true]).solved, [false, false, true], 'the fault showed, then the learner fixed it');
  });
  it('off disarms; once armed it stays armed while on (a slip and a re-fix still count)', () => {
    assert.deepEqual(faultStep(true, false, true), { armed: false, solved: false });
    assert.deepEqual(run([false, true, false, true]).solved, [false, true, false, true]);
  });
  it('START and START AGAIN begin disarmed; the card is wired to the step', () => {
    const bits = read('bits.tsx');
    assert.match(bits, /const step = faultStep\(armed\.current, on, fixed\);/);
    assert.match(bits, /const solved = step\.solved;/);
    const begin = bits.match(/const begin = \(\) => \{([\s\S]*?)\};/);
    assert.ok(begin, 'one begin() for START and START AGAIN');
    assert.match(begin![1], /armed\.current = false;\s*start\(\);\s*setOn\(true\);\s*setShown\(0\);\s*fired\.current = false;/);
    assert.match(bits, /onPress=\{begin\}[\s\S]{0,120}accessibilityLabel=\{startLabel === 'START THE FAULT'/, 'START uses begin');
    assert.match(bits, /onPress=\{begin\} accessibilityRole="button" accessibilityLabel="Start the fault again">\s*<Text style=\{styles\.faultBtnText\}>START AGAIN<\/Text>/);
    // beside SHOW A HINT, in one row, while unsolved
    assert.match(bits, /<View style=\{styles\.faultRow\}>[\s\S]*SHOW A HINT[\s\S]*START AGAIN[\s\S]*<\/View>/);
  });
});

describe('useBoothAudio: a reading knows whether it is stale', () => {
  it('every booth change moves the version; a render stamped before it is not fresh', () => {
    setBooth(builtBooth());
    const v = boothVersion();
    assert.equal(readingFresh(v), true, 'made from the booth as it is now');
    updateBooth((b) => ({ ...b, mixer: { ...b.mixer, master: b.mixer.master === 0.5 ? 0.6 : 0.5 } }));
    assert.ok(boothVersion() > v);
    assert.equal(readingFresh(v), false, 'a chunk from before the change');
    assert.equal(readingFresh(null), false, 'no reading at all');
    assert.equal(readingFresh(boothVersion()), true);
  });
  it('stamps each render, exposes lastFresh, and drops `last` when stopped', () => {
    const s = read('booth/useBoothAudio.ts');
    assert.match(s, /const stamp = boothVersion\(\);\s*const booth = anchorAt\(getBooth\(\), t0\);/, 'stamped at the read it renders from');
    assert.match(s, /setLastRec\(\{ render, stamp \}\);/);
    assert.match(s, /const lastFresh = readingFresh\(lastStamp, boothVersion\(\)\);/);
    assert.match(s, /lastStamp: number \| null;\s*lastFresh: boolean;/);
    const restart = s.match(/const restart = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[/);
    assert.ok(restart);
    assert.match(restart![1], /if \(!anyPlaying\(getBooth\(\)\)\) \{[\s\S]*?setLastRec\(null\);[\s\S]*?return;/, 'restart, not playing');
    const stop = s.match(/const stop = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[/);
    assert.ok(stop);
    assert.match(stop![1], /setLastRec\(null\);/, 'STOP');
  });
  it('the pages’ own guards still stand (s1Guards / eventShared)', () => {
    assert.match(read('pages/eventShared.tsx'), /return renderedSince\(last, at\.current\);/);
    assert.match(read('pages/p06Gain.tsx'), /renderedSince\(last, faultAt\.current\)/);
  });
});

/** A minimal event render carrying `n` take samples at booth time t0. */
function chunk(t0: number, n: number, v = 0.25): EventRender {
  const a = new Float32Array(n).fill(v);
  return { t0, ext: { take: { l: a, r: a, mic: new Float32Array(n) } } } as unknown as EventRender;
}

describe('takes: finished per take, closed with the screen', () => {
  it('a take played to its end reads finished for that take only', () => {
    clearTake();
    armTake(10);
    writeChunk(chunk(10, 4800));
    closeOpenTake(10.1);
    const first = getTake()!;
    assert.equal(finishedFor(first.id, first), true);
    // a new take armed at the SAME booth time (the clock stood still)
    armTake(10);
    const second = getTake()!;
    assert.equal(second.armedAt, first.armedAt, 'armedAt alone cannot tell them apart');
    assert.notEqual(second.id, first.id);
    assert.equal(finishedFor(first.id, second), false, 'the old take’s end never carries over');
    assert.equal(finishedFor(null, second), false);
    assert.equal(finishedFor(second.id, null), false);
    const p = read('booth/useTakePlayer.ts');
    assert.match(p, /const finished = finishedFor\(finishedId, current\);/);
    assert.match(p, /setFinishedId\(null\);\s*setPlayedId\(t\.id\);/);
    assert.match(p, /setFinishedId\(t\.id\);/);
    clearTake();
  });
  it('a take left recording is closed as useBoothAudio unmounts; the next screen’s chunks never write into it', () => {
    clearTake();
    armTake(0);
    writeChunk(chunk(0, 4800));
    assert.equal(takeOpen(), true);
    const before = getTake()!.seconds;
    closeOpenTake(0.1); // the unmount
    assert.equal(takeOpen(), false);
    writeChunk(chunk(0.1, 48000));
    assert.equal(getTake()!.seconds, before, 'nothing written after close');
    closeOpenTake(5); // idempotent
    assert.equal(getTake()!.seconds, before);
    const s = read('booth/useBoothAudio.ts');
    const unmount = s.match(/return \(\) => \{\s*aliveRef\.current = false;([\s\S]*?)\n    \};/);
    assert.ok(unmount);
    assert.match(unmount![1], /stopBooth\(\);[\s\S]*closeOpenTake\(boothNow\(\)\);/);
    clearTake();
  });
});

describe('dock: PLAY on an empty deck never asks for sound', () => {
  it('only a deck with a track wants sound', () => {
    const b = builtBooth();
    const empty = { ...b, decks: { ...b.decks, A: { ...b.decks.A, track: null, playing: false } } };
    assert.equal(playWantsSound(empty, 'A', true), false, 'toggle on an empty deck');
    assert.equal(playWantsSound(empty, 'A'), false, 'play on an empty deck');
    const loaded = { ...b, decks: { ...b.decks, A: { ...b.decks.A, track: 'nightFerry' as const, playing: false } } };
    assert.equal(playWantsSound(loaded, 'A', true), true);
    assert.equal(playWantsSound({ ...loaded, decks: { ...loaded.decks, A: { ...loaded.decks.A, playing: true } } }, 'A', true), false, 'PAUSE never asks');
  });
  it('the transport asks through it', () => {
    const d = read('dock.tsx');
    assert.match(d, /toggle: \(deck\) => \{[\s\S]*?if \(playWantsSound\(getBooth\(\), deck, true\)\) void audio\.requestSound\(\);/);
    assert.match(d, /play: \(deck\) => \{\s*if \(playWantsSound\(getBooth\(\), deck\)\) void audio\.requestSound\(\);/);
    assert.doesNotMatch(d, /if \(!getBooth\(\)\.decks\[deck\]\.playing\) void audio\.requestSound\(\)/);
  });
});

describe('Scene callouts and the kit’s ready', () => {
  it('a callout’s words cannot be selected on the web', () => {
    const s = read('art/Scene.tsx');
    assert.match(s, /selectable=\{false\}/);
    assert.match(s, /calloutText: \{[\s\S]*?userSelect: 'none'/);
  });
  it('every page’s kit has ready: not on the first render, not while a setup is pending', () => {
    assert.equal(kitReady(false, false), false);
    assert.equal(kitReady(true, true), false);
    assert.equal(kitReady(true, false), true);
    const k = {};
    markSetupPending(k);
    assert.equal(kitReady(true, setupPending()), false);
    clearSetupPending(k);
    const sh = read('pages/shared.tsx');
    assert.match(sh, /ready: boolean \}/);
    assert.match(sh, /return \{ booth, audio, tr, motion, ready: kitReady\(mounted, setupPending\(\)\) \};/);
  });
});

// leave the shared module stores as found
stopBooth();
setBooth(builtBooth());
void getBooth;
