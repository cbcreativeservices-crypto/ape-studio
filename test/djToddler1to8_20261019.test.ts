/**
 * DJ Systems Lab — toddler bug test of screens 1–8 (2026-10-19). One check
 * per fixed bug:
 *  - leftover booth: a page's OWN goal flags (useState / refs set during
 *    render) are judged only once its setup is applied (`ready`), so arriving
 *    from another screen never ticks them (p01, p03, p05, p08);
 *  - Screen 1 RESET returns to the screen's own start (channel fader up),
 *    not a fresh booth with every fader down (PLAY A was silent);
 *  - Screen 4 starts unwired (an auto-wired booth ticked three wiring goals
 *    on arrival) — a redo too, since 2026-10-19 (a redo is a fresh practice
 *    run); UNWIRE clears the thump note;
 *  - Screen 5 judges a LOAD on the booth BEFORE it (a load stops the deck);
 *  - Screens 6 and 7: a fault's "fixed" reads only a render made after START
 *    THE FAULT (a chunk from before read Fixed at once);
 *  - Screen 3: the PLAY key never reads STOPPED over a running turntable.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RENDER_MARGIN_S, deckOnAir, loadVerdict, renderedSince } from '../src/screens/lab/dj/pages/s1Guards.ts';
import { builtBooth, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { load, setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';

const ROOT = join(import.meta.dirname, '..');
const page = (f: string) => readFileSync(join(ROOT, 'src/screens/lab/dj/pages', f), 'utf8');

/** Deck A on air: playing, fader up, THRU. */
function aOnAir(): Booth {
  const b = builtBooth();
  const x: Booth = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.85, xf: 'THRU' }, 2: { ...b.ch[2], fader: 0, xf: 'THRU' } } };
  return setPlaying(x, 0, 'A', true);
}

describe('Screen 5: a load is judged on the booth before it', () => {
  it('a load always stops the deck — so "was it on air?" must be asked first', () => {
    const before = aOnAir();
    assert.equal(deckOnAir(before, 'A'), true);
    const after = load(before, 0, 'A', 'glassHarbour');
    assert.equal(deckOnAir(after, 'A'), false, 'after the load nothing is on air: the old check could never warn');
  });
  it('loading onto the on-air deck warns and earns nothing; the spare deck B with a matchable track earns the goal', () => {
    const before = aOnAir();
    assert.deepEqual(loadVerdict(before, 'A', true), { stoppedCrowd: true, credit: false });
    assert.deepEqual(loadVerdict(before, 'B', true), { stoppedCrowd: false, credit: true });
    assert.deepEqual(loadVerdict(before, 'B', false), { stoppedCrowd: false, credit: false }, 'a track deck A cannot tempo-match earns nothing');
    assert.equal(loadVerdict(builtBooth(), 'A', true).credit, false, 'the goal is the SPARE deck B');
  });
  it('p05 passes the booth from before the load and judges with loadVerdict', () => {
    const s = page('p05Play.tsx');
    assert.match(s, /const before = getBooth\(\);\s*updateBooth\(\(x, tt\) => load\(x, tt, deck, t\)\);\s*onLoaded\(deck, t, before\)/);
    assert.match(s, /loadVerdict\(before, dk, m\.ok\)/);
  });
});

describe('Screens 6 and 7: a fault is fixed only on a render made after it started', () => {
  it('a chunk rendered before (or just at) the start does not count; one well after does', () => {
    assert.equal(renderedSince(null, 10), false);
    assert.equal(renderedSince({ t0: 12 }, null), false, 'no fault started on this visit');
    assert.equal(renderedSince({ t0: 9.5 }, 10), false, 'the clean chunk from before the start');
    assert.equal(renderedSince({ t0: 10 + RENDER_MARGIN_S / 2 }, 10), false, 'an old chunk that starts sounding inside the 60 ms re-render wait');
    assert.equal(renderedSince({ t0: 10 + 0.06 + 0.15 }, 10), true, 'the first chunk after the start (60 ms wait + the smallest render lead)');
  });
  it('p06 and p07 stamp the start and gate `fixed` on it', () => {
    for (const f of ['p06Gain.tsx', 'p07Cue.tsx']) {
      const s = page(f);
      assert.match(s, /faultAt\.current = boothNow\(\);/, f);
      assert.match(s, /renderedSince\(last, faultAt\.current\)/, f);
    }
  });
});

describe('a page’s own goal flags wait for its setup', () => {
  it('p01, p03, p05 and p08 judge their render-time flags only when ready', () => {
    const p01 = page('p01Welcome.tsx');
    assert.match(p01, /const \{ ready \} = useScreenSetup/);
    assert.match(p01, /if \(ready && booth\.decks\.A\.playing && !heardA\)/);
    assert.match(p01, /if \(ready && booth\.perspective !== 'CROWD' && !switched\)/);
    assert.match(p01, /if \(ready && heardA && /);
    assert.match(page('p03Connect.tsx'), /if \(ready && lOnly && !oneSide\)/);
    const p05 = page('p05Play.tsx');
    assert.match(p05, /if \(ready && booth\.decks\.B\.playing && booth\.decks\.B\.track && !playedB\)/);
    assert.match(p05, /if \(ready && airA && !aOnAir\)/);
    const p08 = page('p08Faders.tsx');
    assert.match(p08, /if \(ready && both && assigned && m\.xfCurve === 'BLEND'\)/);
    assert.match(p08, /if \(ready && both && assigned && m\.xfCurve === 'CUT'/);
  });
});

describe('Screen 1 RESET and Screen 4 entry', () => {
  it('RESET returns to the screen’s own start: channel 1 fader up (a fresh booth has every fader down)', () => {
    assert.equal(builtBooth().ch[1].fader, 0, 'why a plain fresh booth left PLAY A silent');
    const s = page('p01Welcome.tsx');
    assert.match(s, /setBooth\(welcomeBooth\(freshBooth\(\), 'nightFerry'\)\)/);
    assert.match(s, /fader: 0\.8, xf: 'THRU'/);
  });
  it('Screen 4 starts unwired (a redo too: a fresh practice run), and UNWIRE clears the thump note', () => {
    const s = page('p04Build.tsx');
    assert.match(s, /useScreenSetup\(\(b\) => \(\{ \.\.\.unbuilt\(b\), perspective: 'CROWD' \}\), false\)/);
    assert.doesNotMatch(s, /ctx\.isDone && systemBuilt/, 'a redo no longer keeps the built booth (its wiring chips would tick on arrival)');
    assert.match(s, /setLastPower\(null\);\s*\/\/[^\n]*\n\s*setMiss\(null\);/);
  });
  it('Screen 3: the PLAY key names a running turntable whichever SOURCE is shown', () => {
    const s = page('p03Connect.tsx');
    assert.match(s, /valueLabel: \[booth\.decks\.A\.playing \? 'A ▶' : '', booth\.tt\.playing \? 'TT ▶' : ''\]/);
    assert.match(s, /■ STOP TURNTABLE/);
  });
  it('Screens 5 and 7 bind a fader as the initial lane (no rack contract warning)', () => {
    assert.match(page('p05Play.tsx'), /initialParam: 'search'/);
    assert.match(page('p07Cue.tsx'), /initialParam: 'phones'/);
  });
});
