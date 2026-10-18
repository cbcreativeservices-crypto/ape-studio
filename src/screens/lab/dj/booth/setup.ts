/**
 * setup — how a screen meets the shared booth. A screen that OPERATES the
 * booth needs a working system; if the learner has not built one (or jumped
 * here from CONTENTS), the cables and power are put right for them and the
 * screen says so. Everything else the learner set (decks, mixer) is kept, so
 * the booth stays ONE booth from screen to screen.
 */
import { useLayoutEffect, useRef } from 'react';
import { BUILT_PLUGS, POWERED, builtBooth, systemBuilt, type Booth } from '../model/djModel';
import { TRACKS, barSec, type TrackId } from '../engine/djMusic';
import { getBooth, setBooth } from './boothStore';

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

/**
 * Run a screen's setup ONCE, before its first paint: `prepare` receives the
 * current booth (with a working system unless `needsSystem` is false) and
 * returns the booth the screen starts from. Returns whether the system had to
 * be wired for the learner (so the screen can say so).
 */
export function useScreenSetup(prepare: (b: Booth) => Booth, needsSystem = true): { wiredForYou: boolean } {
  const wired = useRef<boolean | null>(null);
  if (wired.current == null) wired.current = needsSystem && !systemBuilt(getBooth());
  const prepRef = useRef(prepare);
  prepRef.current = prepare;
  useLayoutEffect(() => {
    const cur = getBooth();
    setBooth(prepRef.current(needsSystem ? withWorkingSystem(cur) : cur));
    // once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { wiredForYou: wired.current };
}

/** A brand-new booth (START OVER and the first visit). */
export const freshBooth = builtBooth;
