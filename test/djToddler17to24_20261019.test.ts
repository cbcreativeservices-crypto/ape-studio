/**
 * DJ Systems Lab — toddler bug test of screens 17–24 and the ending
 * (2026-10-19). Each bug found is pinned here:
 *
 *  - LEFTOVER BOOTH: a screen's own goal flags (refs set during render) saw
 *    the previous screen's booth on the first render. PREV from 18 ticked 17's
 *    "Balance, zero, set 4 g" and "Match the anti-skate"; an uncalibrated DVS
 *    carried through 19 ticked 18's "Calibrate after a change". The flags now
 *    wait for useScreenSetup's `ready`.
 *  - STALE READING: `last` is the chunk sounding NOW, rendered before the
 *    latest change. SET IT UP on 20's "tops behind you" passed at once on the
 *    old placement's dose; a voice already in the recording fixed 19's fault
 *    on START; a voice from before OPEN THE DOORS passed 24's announcement.
 *    Readings now count only from a render made after the change.
 *  - 24's debrief told the page it was done WHILE rendering (a React error);
 *    21's and 24's take was left recording when the learner walked away; 21's
 *    playback goal took any earlier take's `finished`; 23's frozen laptop
 *    could never be restarted; 22's own tempo went to 0 and below; 18's
 *    needle drop ran off the end of the record.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INT_BPM_MAX, INT_BPM_MIN, clampIntBpm, clampNeedle, holdDoneUnlessFresh } from '../src/screens/lab/dj/pages/eventGuards.ts';
import { renderedSince } from '../src/screens/lab/dj/pages/s1Guards.ts';
import { TRANSITION_FRESH, transitionStepBy } from '../src/screens/lab/dj/model/djCapstone.ts';
import { BALANCE_AT, FORCE_RANGE, dialReads, inRange, setVinyl, trueForce } from '../src/screens/lab/dj/model/djVinyl.ts';

const ROOT = join(import.meta.dirname, '..');
const page = (f: string) => readFileSync(join(ROOT, 'src/screens/lab/dj/pages', f), 'utf8');

describe('leftover booth: nothing is judged before the screen is ready', () => {
  it('the booth Screen 18 leaves would meet two of Screen 17’s goals (the hazard is real)', () => {
    const v = setVinyl();
    assert.ok(v.ringZero != null && Math.abs(v.ringZero - BALANCE_AT) <= 0.1 && Math.abs(trueForce(v) - FORCE_RANGE.suggest) <= 0.2 && Math.abs(dialReads(v) - FORCE_RANGE.suggest) <= 0.2, 'balance, zero, set 4 g');
    assert.ok(inRange(v) && Math.abs(v.antiSkate - trueForce(v)) <= 0.3, 'anti-skate matched');
  });
  it('17, 18, 21, 22 gate their own flags and their goals on ready', () => {
    for (const [f, short] of [['p17Vinyl.tsx', 'VINYL'], ['p18Dvs.tsx', 'DVS'], ['p21Rec.tsx', 'REC'], ['p22Hybrid.tsx', 'HYBRID']] as const) {
      const s = page(f);
      assert.match(s, /const \{ ready \} = useScreenSetup\(/, `${f} reads ready`);
      assert.ok(s.includes(`useVisitGoals(ctx, goals, '${short}', ready)`), `${f} passes ready to its goals`);
    }
    assert.match(page('p17Vinyl.tsx'), /if \(ready\) \{\s+if \(!v\.armUp && zeroedRight/);
    assert.match(page('p18Dvs.tsx'), /if \(ready\) \{\s+if \(d\.mode === 'ABS'/);
    assert.match(page('p19Mic.tsx'), /if \(ready && fb\.state === 'RINGING' && m\.on\) ringSeen\.current = true/);
    assert.match(page('p23Changeover.tsx'), /if \(ready && hum\) humSeen\.current = true/);
  });
});

describe('stale readings never pair with the booth as it is now', () => {
  it('renderedSince: only a chunk rendered after the change counts', () => {
    assert.equal(renderedSince(null, 10), false);
    assert.equal(renderedSince({ t0: 12 }, null), false);
    assert.equal(renderedSince({ t0: 10.05 }, 10), false, 'a chunk rendered before the change can start up to 60 ms after it');
    assert.equal(renderedSince({ t0: 10.4 }, 10), true);
  });
  it('a stale reading may start or fail a transition, never finish it', () => {
    const started = transitionStepBy(TRANSITION_FRESH, true, true, 0.85, { crowdMinDb: -20, clipped: false });
    assert.equal(started.started, true);
    const staleDone = transitionStepBy(started, false, true, 0.85, { crowdMinDb: -20, clipped: false });
    assert.equal(staleDone.done, true, 'the model alone would finish it');
    const held = holdDoneUnlessFresh(started, staleDone, false);
    assert.equal(held.done, false);
    assert.equal(held.started, true);
    assert.equal(holdDoneUnlessFresh(started, staleDone, true).done, true, 'a fresh reading finishes it');
    const done = holdDoneUnlessFresh(started, staleDone, true);
    assert.equal(holdDoneUnlessFresh(done, done, false).done, true, 'done stays done');
  });
  it('the event screens read freshness from one hook, and use it where a goal pairs a reading with the flags', () => {
    const shared = page('eventShared.tsx');
    assert.match(shared, /export function useFreshReading\(/);
    assert.match(shared, /return renderedSince\(last, at\.current\)/);
    const p19 = page('p19Mic.tsx');
    assert.match(p19, /faultAt\.current = boothNow\(\);/);
    assert.match(p19, /fixed=\{renderedSince\(last, faultAt\.current\) && voiceIn\(last, 'rec'\)\}/);
    assert.match(p19, /fresh && m\.device === 'CONDENSER'/);
    assert.match(p19, /met=\{fresh && m\.device === 'WIRELESS'/);
    const p20 = page('p20Pa.tsx');
    assert.match(p20, /met=\{fresh && v\.place === 'BEHIND'/);
    assert.match(p20, /fresh && playing && dose != null && dose <= 100/);
    const p21 = page('p21Rec.tsx');
    assert.match(p21, /fresh && armed && voiceIn\(last, 'rec'\)/);
    const p23 = page('p23Changeover.tsx');
    assert.match(p23, /holdDoneUnlessFresh\(trans\.current, transitionStepBy\(/);
    assert.match(p23, /const matched = fresh &&/);
    assert.match(p23, /const backupProved = fresh &&/);
    const p24 = page('p24Capstone.tsx');
    assert.match(p24, /fresh && doorsOpen && ev\.rec\.armedAt != null && voiceIn\(last, 'crowd'\) && voiceIn\(last, 'rec'\)/);
    assert.match(p24, /holdDoneUnlessFresh\(trans\.current, transitionStep\(/);
    assert.match(p24, /if \(fresh && doorsOpen && booth\.decks\.B\.playing/);
  });
});

describe('the rest of the hunt', () => {
  it('24: the debrief tells the page after its render, never during it', () => {
    const p24 = page('p24Capstone.tsx');
    const debrief = p24.slice(p24.indexOf('function Debrief('), p24.indexOf('/* ── what the lab covers'));
    assert.match(debrief, /useEffect\(\(\) => \{\s+if \(allRight && !fired\.current\) \{\s+fired\.current = true;\s+doneRef\.current\(\);/);
    assert.doesNotMatch(debrief, /\n  if \(allRight && !fired\.current\) \{/);
  });
  it('21 and 24: a take is never left recording behind the learner', () => {
    const p21 = page('p21Rec.tsx');
    assert.ok((p21.match(/if \(takeOpen\(\)\) closeTake\(boothNow\(\)\);/g) ?? []).length >= 2, 'closed on arrival and on leaving');
    const p24 = page('p24Capstone.tsx');
    assert.ok((p24.match(/if \(takeOpen\(\)\) closeTake\(boothNow\(\)\);/g) ?? []).length >= 2, 'closed on leaving and on a replay');
  });
  it('21: playback goals need the take recorded here, actually played; LOOPBACK is no cure for a clipping recorder', () => {
    const p21 = page('p21Rec.tsx');
    assert.match(p21, /const heardThisTake = !!take && armedHere\.current === take\.armedAt && playedTake\.current === take\.armedAt/);
    assert.match(p21, /heardThisTake && !!take && take\.hasVoice/);
    assert.match(p21, /met=\{boothTake\.current === 'done' && heardThisTake\}/);
    assert.match(p21, /\(rec\.tap === 'REC_OUT' \|\| rec\.tap === 'BOOTH'\)\}/);
  });
  it('23: a frozen laptop can be restarted, and the solved card stays solved', () => {
    const p23 = page('p23Changeover.tsx');
    assert.match(p23, /RESTART DJ 2’S LAPTOP/);
    assert.match(p23, /fixed=\{recovered \|\| \(!ev\.lap2\.alive && programOn\(booth\)\)\}/);
    const fault = p23.slice(p23.indexOf('title="DJ 2’S LAPTOP FREEZES"'));
    assert.match(fault, /start=\{\(\) => \{\s+void audio\.requestSound\(\);/);
  });
  it('22: the drum machine’s own tempo stays on its dial', () => {
    assert.equal(clampIntBpm(-5), INT_BPM_MIN);
    assert.equal(clampIntBpm(0), INT_BPM_MIN);
    assert.equal(clampIntBpm(999), INT_BPM_MAX);
    assert.equal(clampIntBpm(121.04), 121);
    assert.equal(clampIntBpm(Number.NaN), 120);
    let bpm = 120;
    for (let i = 0; i < 200; i++) bpm = clampIntBpm(bpm - 1);
    assert.equal(bpm, INT_BPM_MIN, 'two hundred taps of −1');
    assert.match(page('p22Hybrid.tsx'), /set\(\{ intBpm: clampIntBpm\(evOf\(getBooth\(\)\)\.dm\.intBpm \+ d\) \}\)/);
  });
  it('18: a needle drop stays on the record', () => {
    let pos = 50;
    for (let i = 0; i < 40; i++) pos = clampNeedle(pos + 30, 300);
    assert.equal(pos, 270);
    assert.equal(clampNeedle(-100, 300), 1);
    assert.equal(clampNeedle(10, 0), 1, 'no track: the start');
    assert.match(page('p18Dvs.tsx'), /posSec: clampNeedle\(x\.tt\.posSec \+ 30,/);
    assert.match(page('p18Dvs.tsx'), /posSec: clampNeedle\(x\.tt\.posSec - 30,/);
  });
  it('no helper file is named like a screen page', () => {
    assert.doesNotMatch('eventGuards.ts', /^p\d/);
  });
});
