/**
 * djDeck — the players' transport and performance functions on the shared
 * booth, as pure state transitions at booth time `t` (seconds). Every
 * function anchors the decks at `t` first, so a change made mid-play keeps
 * the music's position continuous. Pinned by test/djTime.test.ts and
 * test/djModel.test.ts.
 *
 * THE GENERIC PLAYER (Stage 1; real players differ — their manuals win):
 *   PLAY/PAUSE  toggles playback.
 *   CUE         playing → back to the cue point, paused; paused → sets the
 *               cue point here (snapped to the beat when QUANTIZE is on).
 *   HOT CUE 1–4 empty → stores this position (quantized); set → jumps there
 *               and plays.
 *   LOOP n      a loop of n beats from here (start snapped when quantized);
 *               EXIT leaves it and the track plays on.
 *   BEAT JUMP   moves the position by ±n beats on the analysed grid.
 *   SYNC        matches the tempo (×½ / ×1 / ×2, inside the tempo range) and
 *               the beat phase, both from the ANALYSED grids.
 *   LOAD        stops the deck and loads a track, cued at its first beat —
 *               loading onto a deck the crowd is hearing stops their music.
 */
import { TRACKS, trackSeconds, trueGrid, type TrackId } from '../engine/djMusic.ts';
import { DECK_IDS, anchorAt, deckPos, type Booth, type DeckId, type DeckState } from './djModel.ts';
import { PITCH_RANGE_PCT, beatAt, beatJump as jumpBy, clampPitch, loopTrackSec, quantizeTime, syncPhaseTime, syncPitch, type Grid } from './djTime.ts';

/** The grid the DJ software shows for this deck (its analysis + the
 *  learner's edits). The ear hears trueGrid(track). */
export function analysedGrid(d: DeckState): Grid | null {
  if (!d.track) return null;
  const g = trueGrid(d.track);
  let bpm = g.bpm;
  let first = g.firstBeatSec;
  if (d.gridMode === 'LATE_HALF') first += 0.5 * (60 / g.bpm);
  if (d.gridMode === 'HALF_BPM') bpm = g.bpm / 2;
  bpm *= d.bpmFix;
  first += d.gridShiftBeats * (60 / bpm);
  return { bpm, firstBeatSec: first };
}

/** The analysed grid is the true one (to a millisecond and 0.01 BPM). */
export function gridCorrect(d: DeckState): boolean {
  const a = analysedGrid(d);
  if (!a || !d.track) return false;
  const g = trueGrid(d.track);
  if (Math.abs(a.bpm - g.bpm) > 0.01) return false;
  // Any whole-beat offset of a correct BPM is a different DOWNBEAT, not a
  // correct grid: bar 1 beat 1 must sit on the first kick.
  return Math.abs(a.firstBeatSec - g.firstBeatSec) < 0.001;
}

function mapDeck(b: Booth, t: number, id: DeckId, f: (d: DeckState, now: number) => DeckState): Booth {
  const a = anchorAt(b, t);
  return { ...a, decks: { ...a.decks, [id]: f(a.decks[id], t) } };
}

const end = (d: DeckState) => (d.track ? trackSeconds(d.track) - 1 : 0);
const clampPos = (d: DeckState, s: number) => Math.max(0, Math.min(end(d), s));

/** The track's first beat (where a player auto-cues). */
export const firstBeat = (id: TrackId): number => TRACKS[id].leadInSec;

export function load(b: Booth, t: number, id: DeckId, track: TrackId): Booth {
  return mapDeck(b, t, id, (d) => ({
    ...d,
    track,
    playing: false,
    posSec: firstBeat(track),
    cueSec: firstBeat(track),
    pitch: 0,
    hotCues: [null, null, null, null],
    loop: null,
    gridMode: 'TRUE',
    gridShiftBeats: 0,
    bpmFix: 1,
  }));
}

export function playPause(b: Booth, t: number, id: DeckId): Booth {
  return mapDeck(b, t, id, (d) => (d.track ? { ...d, playing: !d.playing } : d));
}

export function setPlaying(b: Booth, t: number, id: DeckId, playing: boolean): Booth {
  return mapDeck(b, t, id, (d) => (d.track ? { ...d, playing } : d));
}

export function cue(b: Booth, t: number, id: DeckId): Booth {
  return mapDeck(b, t, id, (d) => {
    if (!d.track) return d;
    if (d.playing) return { ...d, playing: false, posSec: d.cueSec };
    const g = analysedGrid(d);
    const here = d.quantize && g ? quantizeTime(g, d.posSec) : d.posSec;
    return { ...d, cueSec: clampPos(d, here), posSec: clampPos(d, here) };
  });
}

/** Move the position (the jog wheel when paused; a search). */
export function seek(b: Booth, t: number, id: DeckId, posSec: number): Booth {
  return mapDeck(b, t, id, (d) => ({ ...d, posSec: clampPos(d, posSec) }));
}

/** A jog NUDGE while playing: the platter is pushed or held for a moment,
 *  modelled as a position step of ±`ms` (a quick touch is ~10–20 ms). */
export function nudge(b: Booth, t: number, id: DeckId, ms: number): Booth {
  return mapDeck(b, t, id, (d) => ({ ...d, posSec: clampPos(d, d.posSec + ms / 1000) }));
}

export function setPitch(b: Booth, t: number, id: DeckId, pct: number): Booth {
  return mapDeck(b, t, id, (d) => ({ ...d, pitch: clampPitch(pct) }));
}

export function hotCue(b: Booth, t: number, id: DeckId, pad: number): Booth {
  return mapDeck(b, t, id, (d) => {
    if (!d.track) return d;
    const set = d.hotCues[pad];
    if (set == null) {
      const g = analysedGrid(d);
      const here = d.quantize && g ? quantizeTime(g, d.posSec) : d.posSec;
      const hotCues = d.hotCues.slice();
      hotCues[pad] = clampPos(d, here);
      return { ...d, hotCues };
    }
    return { ...d, posSec: set, playing: true, loop: null };
  });
}

export function clearHotCue(b: Booth, t: number, id: DeckId, pad: number): Booth {
  return mapDeck(b, t, id, (d) => {
    const hotCues = d.hotCues.slice();
    hotCues[pad] = null;
    return { ...d, hotCues };
  });
}

export function loopIn(b: Booth, t: number, id: DeckId, beats: number): Booth {
  return mapDeck(b, t, id, (d) => {
    const g = analysedGrid(d);
    if (!d.track || !g) return d;
    // Quantized: the loop starts on the beat just behind the playhead, so it
    // never jumps forward.
    const start = d.quantize ? quantizeFloor(g, d.posSec) : d.posSec;
    return { ...d, loop: { startSec: start, lengthSec: loopTrackSec(g, beats) } };
  });
}

function quantizeFloor(g: Grid, t: number): number {
  const b = Math.floor(beatAt(g, t) + 1e-6);
  return g.firstBeatSec + (b * 60) / g.bpm;
}

export function loopExit(b: Booth, t: number, id: DeckId): Booth {
  return mapDeck(b, t, id, (d) => ({ ...d, loop: null }));
}

export function beatJump(b: Booth, t: number, id: DeckId, beats: number): Booth {
  return mapDeck(b, t, id, (d) => {
    const g = analysedGrid(d);
    if (!g) return d;
    return { ...d, posSec: clampPos(d, jumpBy(g, d.posSec, beats)), loop: null };
  });
}

/** SYNC `id` to the other deck. Returns null when no tempo multiple fits. */
export function sync(b: Booth, t: number, id: DeckId): Booth | null {
  const other: DeckId = id === 'A' ? 'B' : 'A';
  const a = anchorAt(b, t);
  const lead = a.decks[other];
  const fol = a.decks[id];
  const lg = analysedGrid(lead);
  const fg = analysedGrid(fol);
  if (!lg || !fg) return null;
  const p = syncPitch(lg.bpm, lead.pitch, fg.bpm, PITCH_RANGE_PCT);
  if (p == null) return null;
  let posSec = syncPhaseTime(lg, lead.posSec, fg, fol.posSec);
  // Never before the start of the file: the same phase, one beat later.
  while (posSec < 0) posSec += 60 / fg.bpm;
  return { ...a, decks: { ...a.decks, [id]: { ...fol, pitch: p, posSec: clampPos(fol, posSec) } } };
}

/**
 * Line `id` up with the other deck's beat phase (the ANALYSED grids), moving
 * only `id`'s position — its tempo stays where it is. The screens that teach
 * EQ and crossfader blends start deck B already tempo-matched (setup) and
 * phase-locked by this whenever a deck starts, so a blend is never judged on
 * a train wreck (audio review 2026-10-18 #2).
 */
export function alignPhase(b: Booth, t: number, id: DeckId): Booth {
  const other: DeckId = id === 'A' ? 'B' : 'A';
  const a = anchorAt(b, t);
  const lead = a.decks[other];
  const fol = a.decks[id];
  const lg = analysedGrid(lead);
  const fg = analysedGrid(fol);
  if (!lg || !fg || !lead.playing) return a;
  let posSec = syncPhaseTime(lg, lead.posSec, fg, fol.posSec);
  while (posSec < 0) posSec += 60 / fg.bpm;
  return { ...a, decks: { ...a.decks, [id]: { ...fol, posSec: clampPos(fol, posSec) } } };
}

export function setGrid(b: Booth, t: number, id: DeckId, patch: Partial<Pick<DeckState, 'gridMode' | 'gridShiftBeats' | 'bpmFix' | 'quantize'>>): Booth {
  return mapDeck(b, t, id, (d) => ({ ...d, ...patch }));
}

/** Stop every deck (STOP ALL). */
export function stopAll(b: Booth, t: number): Booth {
  const a = anchorAt(b, t);
  const decks = { ...a.decks };
  for (const id of DECK_IDS) decks[id] = { ...decks[id], playing: false };
  return { ...a, decks };
}

export const anyPlaying = (b: Booth): boolean => DECK_IDS.some((id) => b.decks[id].playing && !!b.decks[id].track);

/** Position of a deck now, in TRUE beats (what the ear counts). */
export function trueBeat(b: Booth, id: DeckId, t: number): number | null {
  const d = b.decks[id];
  if (!d.track) return null;
  return beatAt(trueGrid(d.track), deckPos(d, t));
}

/** Position of a deck now, in ANALYSED beats (what the display counts). */
export function shownBeat(b: Booth, id: DeckId, t: number): number | null {
  const d = b.decks[id];
  const g = analysedGrid(d);
  if (!g) return null;
  return beatAt(g, deckPos(d, t));
}
