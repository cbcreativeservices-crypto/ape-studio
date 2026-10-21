/**
 * eventGeometry — where the event rig's extra sockets sit (Stage 2b), in the
 * same face-on millimetres as geometry/boothGeometry's rear panels. Pure, so
 * test/djEvent.test.ts can check that each sits on its panel and clears the
 * Stage 1 sockets.
 *
 * THE MIXER'S REAR, LOWER BAND (drawn only with RearPanels `extras`): REC OUT
 * (an RCA pair) under CH 2's inputs, MIDI OUT (5-pin DIN) and the CLOCK
 * switch (which channel's beat counter sends clock) under CH 1, and a second
 * USB port beside the first (USB 1 → CH 1, USB 2 → CH 2 when their selector
 * is on USB — two computers can be connected at once).
 */
export const MIXER_REAR_EXTRA = {
  'rec.L': { x: 30, y: 90, d: 10 },
  'rec.R': { x: 52, y: 90, d: 10 },
  midiOut: { x: 84, y: 90, d: 14 },
  clock: { x: 108, y: 86, w: 24, h: 8 },
  usb2: { x: 196, y: 76 },
} as const;

/* ── Screen 21: BOOTH OUT as the recording tap (R3-DJ-01) ─────────────── */

/**
 * The split lead's legs in BOOTH OUT (mixer rear mm): BOOTH L sits straight
 * above BOOTH R, so its leg cannot drop straight (it would cross BOOTH R's
 * plug). It leaves its plug down and to the right — under the "L" legend,
 * clear of the BOOTH R plug — into its own lane at x = 155, between the
 * BOOTH legends and MASTER R; BOOTH R's leg drops straight. Index 0 = L.
 */
export const BOOTH_SPLIT_JOG: readonly [number | null, number | null] = [155, null];

/**
 * The booth monitors' BOOTH cables (bth.trsL / bth.trsR) while the
 * recorder's split lead holds BOOTH OUT: one plug per jack, so they are OUT
 * of it, hanging loose beside the mixer (rear view: R on the left, as MASTER
 * R is). Each comes down from its monitor (off the top of the picture) in
 * its own lane, eases straight, and ends EXACTLY vertical, its 6.35 mm plug
 * hanging pins-down (rule book R1: always down, a loose end hangs under
 * gravity). The two plugs hang at different heights so they never touch.
 */
export const BOOTH_LOOSE = {
  R: { x: -58, boot: 68 },
  L: { x: -32, boot: 84 },
  /** Where each enters, above the picture's top edge (-26). */
  top: -48,
  /** How far the cable leans in from outside as it comes down. */
  lean: -10,
  /** The share of the drop over which it eases to vertical. */
  ease: 0.55,
} as const;
/** The 6.35 mm loose plug's length (parts.LoosePlug: boot to tip). */
export const LOOSE_TRS_LEN = 57;
/** Screen 21's gear frame with BOOTH as the tap: widened left so the loose
 *  cables hang in their own clear strip, off the mixer's panel. */
export const REC_BOOTH_FRAME = { x: -80, y: -26, w: 498, h: 184 } as const;

/* ── Screen 20 SYSTEM: passive tops and their amplifier (R3-DJ-02) ────── */

/**
 * Speakon NL4, TRUE size (mm): the chassis socket NL4MP (a D-size flange,
 * 26 wide × 31 high, its round insert ⌀ 24) on the amplifier's outputs and
 * the speaker's input cup; the cable connector NL4FC (⌀ 30 locking body,
 * its boot ⌀ 15) at BOTH ends of the lead — a Speakon lead has the same
 * connector at each end, and every chassis socket takes it (rule C13).
 * Speaker cable: heavy-gauge, unshielded two-conductor (2 × 2.5 mm²), about
 * ⌀ 10 over its jacket (rule L4) — never a mic or line cable.
 */
export const NL4 = { flangeW: 26, flangeH: 31, insertD: 24, plugD: 30, bootD: 15, cableD: 10 } as const;

/** The power amp's REAR (local mm; 482 × 88, seen from behind, so CH B is
 *  on the left): the NL4 outputs, the XLR inputs, the mains inlet, the fan. */
export const AMP_REAR = {
  fan: { x: 70, y: 44, d: 58 },
  ac: { x: 118, y: 44 },
  outB: { x: 170, y: 46 },
  outA: { x: 222.5, y: 46 },
  inB: { x: 318, y: 46 },
  inA: { x: 366, y: 46 },
} as const;

/** A passive top's REAR (local mm, the cabinet 365 × 600): the recessed
 *  connector cup with its two NL4 sockets — INPUT (from the amp) and LINK
 *  (on to another box, parallel). */
export const PASSIVE_REAR = {
  cup: { x: 182.5 - 50, y: 296, w: 100, h: 150 },
  input: { x: 182.5, y: 336 },
  link: { x: 182.5, y: 402 },
} as const;

/** Where SYSTEM draws them (SYSTEM mm): the amp above, the top below. */
export const SYS_AMP_AT = { x: 0, y: -120 } as const;
export const SYS_TOP_AT = { x: 40, y: 60 } as const;

/** The speaker lead, amp CH A OUT → the top's INPUT (SYSTEM mm, dense): it
 *  leaves the amp's plug down, hangs in one easy bow (its slack) and comes
 *  into the top's plug from above, in its own lane — nothing else runs
 *  there. */
export function speakerLeadPts(): [number, number][] {
  const a = { x: SYS_AMP_AT.x + AMP_REAR.outA.x, y: SYS_AMP_AT.y + AMP_REAR.outA.y };
  const b = { x: SYS_TOP_AT.x + PASSIVE_REAR.input.x, y: SYS_TOP_AT.y + PASSIVE_REAR.input.y };
  const bow = 14;
  const n = 48;
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([a.x + (b.x - a.x) * t + bow * Math.sin(Math.PI * t), a.y + (b.y - a.y) * t]);
  }
  return out;
}

/** A loose BOOTH cable as drawn (mixer rear mm, dense): from its entry above
 *  the frame down to its plug's boot. The last stretch is exactly vertical. */
export function boothLooseHang(side: 'L' | 'R'): [number, number][] {
  const { x, boot } = BOOTH_LOOSE[side];
  const { top, lean, ease } = BOOTH_LOOSE;
  const n = 40;
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = Math.min(1, t / ease);
    const k = u * u * (3 - 2 * u);
    out.push([x + lean * (1 - k), top + (boot - top) * t]);
  }
  return out;
}
