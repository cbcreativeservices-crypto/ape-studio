/**
 * registry — which outline screen (1–24) each registered page IS, which are
 * OPTIONAL equipment paths, and what the lab covers. Pure (no React Native),
 * so test/djRegistry.test.ts reaches it.
 *
 * Pages are numbered BY ID, not by position: a page declares its outline
 * number (DJ_PAGE_NO in pages/index.ts), and a page that declares none takes
 * the number after the one before it. So the lab reads right on a branch
 * that has only some of the screens (13–18 are built on another branch and
 * merged later) and keeps reading right once they arrive.
 *
 * OPTIONAL PATHS (owner outline, "screens 16–18 can form optional equipment
 * paths"): laptop software and audio interfaces, vinyl and phono, digital
 * vinyl. A learner on a standalone or media-player rig goes from 15 straight
 * to 19. Required completion = every other screen (1–15 and 19–24). Labs
 * never block navigation; credit is kept; any screen can be redone.
 */

/** Outline numbers of the optional equipment paths. */
export const DJ_OPTIONAL_NUMBERS: readonly number[] = [16, 17, 18];

export const isOptionalNo = (n: number): boolean => DJ_OPTIONAL_NUMBERS.includes(n);

/** Each page's outline number: declared, else the previous page's + 1. */
export function numberPages<T>(pages: readonly T[], declared: ReadonlyMap<T, number>): number[] {
  const out: number[] = [];
  let last = 0;
  for (const p of pages) {
    const n = declared.get(p) ?? last + 1;
    out.push(n);
    last = n;
  }
  return out;
}

/** Every REQUIRED page is done (optional ones never hold the lab). */
export function requiredDone(numbers: readonly number[], done: (index: number) => boolean): boolean {
  return numbers.every((n, i) => isOptionalNo(n) || done(i));
}

/**
 * WHAT THIS LAB COVERS — one line per outline screen. The closing screen
 * lists the lines of the screens that are REGISTERED (so a branch without
 * some screens never lists them), each ticked only when that screen is done.
 */
export const DJ_COVERS: Readonly<Record<number, string>> = {
  1: 'Work safely: low levels first, STOP within reach, speakers on last and off first.',
  2: 'Name the gear of any DJ system and say what each piece does.',
  3: 'Read a socket — direction, connector, signal, level, channels — and patch a stereo source without losing a side.',
  4: 'Build a complete system and follow the music from the players to the crowd.',
  5: 'Load, cue and play on the spare deck without stopping the dance floor.',
  6: 'Set gain by average level with headroom, read the meters, and find the stage that clipped.',
  7: 'Cue privately, use split cue, and set the booth without touching the crowd.',
  8: 'Choose crossfader curves and assignments; blend and cut.',
  9: 'Use isolators and filters to manage two bass lines.',
  10: 'Beatmatch with your ears and the displays, tell drift from offset, and start on a phrase.',
  11: 'Check and fix a beatgrid before trusting SYNC.',
  12: 'Use hot cues, loops, beat jumps and samples in time.',
  13: 'Place an effect as an insert, on the master or on a send; set its timing in beats, dry/wet and feedback; and stop a return loop.',
  14: 'Hear how speed moves pitch, use key lock and key shift, and listen for the stretch’s artifacts.',
  15: 'Mix with stems, and tell original stems from separated audio.',
  16: 'Connect a laptop and interface: device, channels, sample rate, buffer and latency.',
  17: 'Set up a turntable and its phono stage, keep the cartridge signal clean, and keep it out of feedback.',
  18: 'Run a digital vinyl system: calibrate, choose absolute, relative or internal, recover when tracking fails, and keep the control tone off the PA.',
  19: 'Connect a microphone with the right gain and power, talk over the music, keep it out of feedback, and know which feeds carry it.',
  20: 'Hand a clean, labelled, balanced feed to the venue; set subs, crossover and placement by the numbers; protect the ears at the decks.',
  21: 'Record from the right tap at the right level, with the mic in the take, and prove it on playback.',
  22: 'Add a drum machine: audio on one cable, clock on another, started on the one.',
  23: 'Change performers without stopping the music, match levels, kill a hum safely and recover from a frozen laptop.',
  24: 'Prepare an event, cue, mix, announce to the room and the recording, and find and fix a fault from the evidence.',
};
