/**
 * djVinyl — the turntable's SETUP on the shared booth (Stage 2, Screen 17;
 * research DJ06, DJ07, DJ22's turntable feedback, DJ24's grounding). Pure
 * TypeScript; pinned by test/djStage2Engine.test.ts. The values are THIS
 * LAB'S teaching cartridge; a real one's instructions win.
 *
 * TRACKING FORCE. The counterweight's position sets the downforce: the arm
 * FLOATS level (0 g) with the weight at its balance point, and every step
 * past it adds force. The dial ring on the weight turns on its own: the
 * method is BALANCE (float the arm), ZERO the ring (without moving the
 * weight), then turn the weight — ring and all — to the force. A ring that
 * was never zeroed reads a number that is not the force (the classic setup
 * mistake); a stylus SCALE reads the truth. This cartridge: 3 – 5 g, about
 * 4 g suggested.
 *   too light → it MISTRACKS: loud, bright passages spit and distort; very
 *               light, it skips grooves;
 *   too heavy → it plays, but records and the stylus wear faster.
 * ANTI-SKATE. A spinning record pulls the arm toward the centre (skating),
 * leaning the stylus on the inner groove wall (the LEFT channel) and lifting
 * it off the outer wall (the RIGHT): too little anti-skate and the RIGHT
 * channel mistracks first. This model: skate = 12 % of the force, cancelled
 * in proportion as the anti-skate dial approaches the force (many
 * instructions say "set it equal to the force"; many scratch DJs set zero).
 *
 * GROUND. The turntable's thin ground wire to the mixer's GND post bonds the
 * signal grounds; without it the cartridge picks up a mains BUZZ (60 or
 * 50 Hz and its harmonics, by country — this model: 60 Hz) at about 0.2 mV,
 * which the phono stage then amplifies with the music. It is a SIGNAL
 * ground. The mains plug's protective earth is never removed to cure hum.
 *
 * ISOLATION (acoustic feedback). Sound from a booth monitor shakes the table;
 * the stylus reads the shaking; it goes back out of the monitor — a loop.
 * Its gain (this model, linear) = 1.25 × the booth knob's gain × channel 1's
 * fader gain ÷ 0.72 × (monitor NEAR 1 / FAR 0.35) × (isolation feet OFF 1 /
 * ON 0.22), resonant around the table's 80 Hz. Under 1 it colours the bass
 * (a boom); at 1 or more it builds into a low HOWL — which the lab holds at
 * a safe level and plays quietly.
 */
import { channelRoute, faderGain, levelKnobGain, type Booth } from './djModel.ts';
import { ARM_SIDE, type ArmAway } from '../geometry/armGeometry.ts';

export type VinylState = {
  slipmat: boolean;
  /** The counterweight's position, in grams of force PAST a hidden zero (the
   *  arm floats at BALANCE_AT). */
  weight: number;
  /** The weight position where the dial ring was zeroed (null = never). */
  ringZero: number | null;
  /** The anti-skate dial (g). */
  antiSkate: number;
  /** The arm lifted and floating (balancing): the stylus is off the record. */
  armUp: boolean;
  /** A stylus scale under the stylus (it reads the true force). */
  scale: boolean;
  /** The turntable's ground wire to the mixer's GND post. */
  gnd: boolean;
  /** Isolation feet under the turntable. */
  feet: boolean;
  /** The booth monitor stands right beside the decks. */
  monitorNear: boolean;
};

/** Where the weight floats the arm (hidden from the learner: they find it). */
export const BALANCE_AT = 2.3;
/** Where the dial ring's zero sits as found (it was never zeroed). */
export const RING_FOUND = 0.8;
/** This lab's teaching cartridge. */
export const FORCE_RANGE = { min: 3, max: 5, suggest: 4 } as const;
export const SKATE_SHARE = 0.12;
/** Mains hum: 60 Hz (the US standard), the same mains as the event screens'
 *  laptop and PA hum (model/djEvent) — one booth, one mains frequency (audio
 *  review 2 #4). Many countries run at 50 Hz. */
export const HUM_HZ = 60;
/** Hum at the cartridge (V): about 0.2 mV against its 5 mV of music. */
export const HUM_V = 0.0002;
export const CART_V = 0.005;
export const FEEDBACK_HZ = 80;

/** As found: the weight set by eye, the ring never zeroed — the dial says
 *  4.0 g; the arm really tracks at 2.5 g. */
export const freshVinyl = (): VinylState => ({ slipmat: true, weight: 4.8, ringZero: null, antiSkate: 0, armUp: false, scale: false, gnd: true, feet: false, monitorNear: true });
/** A correct setup (the screens that need one). */
export const setVinyl = (): VinylState => ({ slipmat: true, weight: BALANCE_AT + FORCE_RANGE.suggest, ringZero: BALANCE_AT, antiSkate: FORCE_RANGE.suggest, armUp: false, scale: false, gnd: true, feet: true, monitorNear: false });

/** The true downforce (g; negative = the arm's tail is heavy, it lifts). */
export const trueForce = (v: VinylState): number => v.weight - BALANCE_AT;
/** What the dial ring reads (g). */
export const dialReads = (v: VinylState): number => v.weight - (v.ringZero ?? RING_FOUND);

/** How level the arm floats while balancing (radians of tilt, + = the front
 *  dips toward the record). */
export const floatTilt = (v: VinylState): number => Math.max(-0.12, Math.min(0.12, trueForce(v) * 0.05));
/** Balanced: floating level within ±0.1 g. */
export const isBalanced = (v: VinylState): boolean => Math.abs(trueForce(v)) <= 0.1;

/** The force on each groove wall (g): the inner wall (LEFT channel) gets the
 *  skating lean, the outer (RIGHT) loses it. */
export function wallForce(v: VinylState): { L: number; R: number } {
  const F = Math.max(0, trueForce(v));
  // the skating lean, less what the anti-skate cancels (over-compensating
  // leans the other way)
  const s = SKATE_SHARE * (F - Math.min(2 * F, Math.max(0, v.antiSkate)));
  return { L: F + s, R: F - s };
}

/** Tracking: 1 = clean; below 1 the wall cannot follow the loudest groove. */
export const trackAbility = (wall: number): number => Math.max(0, Math.min(1.2, wall / (FORCE_RANGE.min * 0.95)));

/** Too light to stay in the groove at all: it skips. */
export const skips = (v: VinylState): boolean => !v.armUp && trueForce(v) < 1.6;
/** Heavier than the cartridge's range. */
export const tooHeavy = (v: VinylState): boolean => trueForce(v) > FORCE_RANGE.max + 0.05;
export const inRange = (v: VinylState): boolean => trueForce(v) >= FORCE_RANGE.min - 0.05 && trueForce(v) <= FORCE_RANGE.max + 0.05;

/** The acoustic loop's gain (linear) through the booth monitor. */
export function feedbackLoopGain(b: Booth, v: VinylState): number {
  if (!b.tt.playing || v.armUp) return 0;
  const g = levelKnobGain(b.mixer.booth) * (faderGain(b.ch[1].fader) / 0.72) * (v.monitorNear ? 1 : 0.35) * (v.feet ? 0.22 : 1);
  return 1.25 * g;
}

/**
 * THE ARM'S POSE, for every view of it (grade 2026-10-19: the top and the
 * side views must agree). A DJ turntable has NO auto-return: stopping the
 * platter leaves the stylus in its groove. On this screen the arm is either
 * ON THE RECORD (in the groove, or on the stylus scale standing on the
 * record) or LIFTED CLEAR — swung just past the platter's rim and floating
 * free, to balance it. Never on its rest.
 */
export const vinylArmOn = (v: Pick<VinylState, 'armUp'>): boolean => !v.armUp;
export const VINYL_ARM_AWAY: ArmAway = 'clear';

/** The arm's tilt in the SIDE view (radians, + = the FRONT down), and the
 *  stylus tip's height above the record (mm). Pure (tests reach it). */
export function armSidePose(v: Pick<VinylState, 'armUp' | 'weight' | 'scale'>): { angle: number; tipAbove: number; onRecord: boolean } {
  const { L } = ARM_SIDE;
  if (v.armUp) {
    // swung clear of the record, the arm floats free by its own imbalance:
    // the front dips — never down to the plinth — or the tail sinks
    const room = -ARM_SIDE.recTop - 4; // the stylus stays 4 mm over the plinth
    const angle = Math.max(-0.09, Math.min(Math.asin(room / L), floatTilt(v as VinylState) * 0.7));
    return { angle, tipAbove: -Math.sin(angle) * L, onRecord: false };
  }
  if (v.scale) {
    // on a stylus gauge standing on the record: the tip rests on its 8 mm pad
    return { angle: -Math.asin(8 / L), tipAbove: 8, onRecord: true };
  }
  return { angle: 0, tipAbove: 0, onRecord: true };
}

/** Zero the dial ring here (the weight does not move). */
export const zeroDial = (v: VinylState): VinylState => ({ ...v, ringZero: v.weight });

/**
 * A STYLUS DROP or lift on a LIVE phono channel (audio review 2 #13): the arm
 * moves onto or off the record while channel 1 is hearing the turntable and
 * its fader is up — for real a loud thump through the PA, and a dropped
 * stylus can chip. `live` = channel 1 really hears the turntable (its route).
 * Pure: the page flags it; the lab plays no thump.
 */
export const THUMP_FADER = 0.3;
export function stylusThumps(armWasUp: boolean, armIsUp: boolean, live: boolean, fader: number): boolean {
  return armWasUp !== armIsUp && live && fader > THUMP_FADER;
}

/** The same, read from the booth: moving the arm to `armIsUp` now — does it
 *  thump the PA? (Channel 1 must really hear the TURNTABLE.) */
export function armMoveThumps(b: Booth, armIsUp: boolean): boolean {
  const v = b.vinyl ?? freshVinyl();
  return stylusThumps(v.armUp, armIsUp, channelRoute(b, 1).L?.source === 'TT', b.ch[1].fader);
}
