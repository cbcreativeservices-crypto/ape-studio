/**
 * setup — how a screen meets the shared booth. A screen that OPERATES the
 * booth needs a working system; if the learner has not built one (or jumped
 * here from CONTENTS), the cables and power are put right for them and the
 * screen says so. Everything else the learner set (decks, mixer) is kept, so
 * the booth stays ONE booth from screen to screen.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { BUILT_PLUGS, POWERED, builtBooth, systemBuilt, type Booth } from '../model/djModel';
import { TRACKS, barSec, type TrackId } from '../engine/djMusic';
import { preMatchedBooth } from '../model/djMatch';
import { getBooth, setBooth } from './boothStore';
import { clearSetupPending, markSetupPending } from './goalStore';

/** The cables and power of a built system, keeping everything else. */
export function withWorkingSystem(b: Booth): Booth {
  if (systemBuilt(b)) return b;
  const power = { ...b.power };
  for (const d of POWERED) power[d] = true;
  return { ...b, plugs: { ...BUILT_PLUGS }, power };
}

/** A deck cued at the start of bar `bar1` (1-based) of its track. */
export function cueAtBar(b: Booth, deck: 'A' | 'B', track: TrackId, bar1: number): Booth {
  const pos = TRACKS[track].leadInSec + (bar1 - 1) * barSec(track);
  return { ...b, decks: { ...b.decks, [deck]: { ...b.decks[deck], track, posSec: pos, cueSec: pos, playing: false, loop: null } } };
}

/** Deck B's tempo fader set so it plays at deck A's tempo — the blend
 *  lessons (Screens 6, 8, 9, 13, 15, 16, 24) start pre-matched so nothing
 *  is judged on drifting beats; Screen 10 shows how it is done (audio
 *  review #2). KEY LOCK is ON (second audio review 2026-10-18 #1): without
 *  it the −3.17 % tempo match also drops deck B by 0.56 of a semitone —
 *  the state Screen 14 calls OUT OF TUNE — so a pre-matched blend would be
 *  sour. Screen 14 teaches key lock; `keyLock: false` keeps the old
 *  behaviour for a caller that wants it. */
export function preMatched(b: Booth, opts: { keyLock?: boolean } = {}): Booth {
  return preMatchedBooth(b, opts.keyLock ?? true);
}

/** Both channels listening to their LINE inputs (the built system). */
export const lineInputs = (b: Booth): Booth => ({ ...b, ch: { 1: { ...b.ch[1], input: 'LINE' }, 2: { ...b.ch[2], input: 'LINE' } } });

/**
 * Run a screen's setup ONCE, before its first paint: `prepare` receives the
 * current booth (with a working system unless `needsSystem` is false) and
 * returns the booth the screen starts from. Returns whether the system had to
 * be wired for the learner (so the screen can say so), and `ready`: false on
 * the first render (which still sees the previous screen's booth), true once
 * the setup has been applied.
 */
export function useScreenSetup(prepare: (b: Booth) => Booth, needsSystem = true): { wiredForYou: boolean; ready: boolean } {
  const wired = useRef<boolean | null>(null);
  if (wired.current == null) wired.current = needsSystem && !systemBuilt(getBooth());
  const prepRef = useRef(prepare);
  prepRef.current = prepare;
  const key = useRef<object>({}).current;
  const [ready, setReady] = useState(false);
  if (!ready) markSetupPending(key);
  useLayoutEffect(() => {
    const cur = getBooth();
    // an operating screen also starts with both channels on LINE (Screen 6
    // teaches a wrong input selector; it must not follow the learner on)
    setBooth(prepRef.current(needsSystem ? lineInputs(withWorkingSystem(cur)) : cur));
    clearSetupPending(key);
    setReady(true);
    return () => clearSetupPending(key);
    // once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { wiredForYou: wired.current, ready };
}

/** A brand-new booth (START OVER and the first visit). */
export const freshBooth = builtBooth;
