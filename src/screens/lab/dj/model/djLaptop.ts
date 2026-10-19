/**
 * djLaptop — a laptop running DJ software, on the shared booth (Stage 2,
 * Screen 16; research DJ09). SIMULATED: no real USB, MIDI or audio device is
 * touched. Pure TypeScript; pinned by test/djStage2Laptop.test.ts.
 *
 * THE RIG (one profile; real rigs vary):
 *   LAPTOP ──USB── MIXER   the mixer's own USB audio interface: AUDIO both
 *                          ways (the software's decks arrive on USB 1/2 and
 *                          USB 3/4; a channel hears them with its input
 *                          selector on USB) — and timing for that audio.
 *   CONTROLLER ──USB── LAPTOP  CONTROL messages (knob and button moves) and
 *                          bus POWER — no audio at all.
 * The software's two decks are the booth's decks A and B (their transport);
 * the media players simply are not used on this rig.
 *
 * DEVICE: the software sends its audio to ONE output device — the MIXER'S
 * USB interface, or the laptop's BUILT-IN output (then nothing reaches the
 * mixer; the little laptop speakers play it). The interface appears only
 * while its USB cable is in (and, on some systems, its driver installed).
 *
 * BUFFER AND LATENCY. The software computes audio a BUFFER at a time: one
 * buffer of B samples at rate SR lasts P = B / SR (256 at 48 kHz = 5.3 ms).
 * Output latency ≈ P + the converter's ~1 ms; a jog move is heard that much
 * later (round trip, input + output, about twice). A smaller buffer feels
 * quicker but leaves less time to finish each buffer.
 *
 * THE WORKLOAD MODEL (a simulation, stated): each buffer costs
 * C = 0.25 ms + B × c(workload) — c = 3 µs per sample for two decks, 6 µs
 * with four decks and effects, 14 µs with live stem separation (at 48 kHz;
 * per SAMPLE, so doubling the rate halves P for the same work). Now and then
 * the computer is busy elsewhere for a moment: on 2 % of buffers a SPIKE
 * steals an exponentially distributed time (mean 0.8 ms, at most 4 ms).
 * A buffer that is not finished in time is a DROPOUT — a gap and a click in
 * the sound. C ≥ P is an overload: constant dropouts.
 * The numbers are this model's, chosen to behave like a typical laptop; a
 * real one is measured with its own software.
 */
import { rng } from '../engine/djDsp.ts';
import type { ChannelId, DeckId } from './djModel.ts';

export type Workload = 'TWO DECKS' | 'FOUR + FX' | 'STEMS LIVE';
export const WORKLOADS: readonly Workload[] = ['TWO DECKS', 'FOUR + FX', 'STEMS LIVE'];
export const BUFFERS = [64, 128, 256, 512, 1024, 2048] as const;
export const RATES = [44100, 48000, 96000] as const;
export type UsbPair = 'USB 1/2' | 'USB 3/4';

export type LaptopState = {
  /** The laptop ↔ mixer USB cable. */
  usbMixer: boolean;
  /** The controller ↔ laptop USB cable. */
  usbCtrl: boolean;
  /** Where the software sends its audio. */
  device: 'MIXER USB' | 'BUILT-IN';
  rate: number;
  buffer: number;
  workload: Workload;
  /** Each software deck's output pair. */
  assign: Record<DeckId, UsbPair>;
};

export const freshLaptop = (): LaptopState => ({ usbMixer: true, usbCtrl: true, device: 'MIXER USB', rate: 48000, buffer: 512, workload: 'TWO DECKS', assign: { A: 'USB 1/2', B: 'USB 3/4' } });

/** The pair a mixer channel hears with its selector on USB. */
export const usbPairOf = (ch: ChannelId): UsbPair => (ch === 1 ? 'USB 1/2' : 'USB 3/4');

/** Per-sample work (µs at 48 kHz) for a workload. */
export const WORK_US: Record<Workload, number> = { 'TWO DECKS': 3, 'FOUR + FX': 6, 'STEMS LIVE': 14 };
export const OVERHEAD_MS = 0.25;
export const SPIKE_P = 0.02;
export const SPIKE_MEAN_MS = 0.8;
export const SPIKE_MAX_MS = 4;
export const CONVERTER_MS = 1;

/** One buffer's length (ms). */
export const bufferMs = (buffer: number, rate: number): number => (buffer / rate) * 1000;
/** Output latency (ms): one buffer plus the converter. */
export const outputLatencyMs = (buffer: number, rate: number): number => bufferMs(buffer, rate) + CONVERTER_MS;
/** Input + output (a control signal in, the sound back out — DVS). */
export const roundTripMs = (buffer: number, rate: number): number => 2 * outputLatencyMs(buffer, rate);
/** The time one buffer's work takes (ms). */
export function workMs(l: Pick<LaptopState, 'buffer' | 'workload'>): number {
  return OVERHEAD_MS + (l.buffer * WORK_US[l.workload]) / 1000;
}
/** Processing load: the share of each buffer's time the work takes (0 … ∞). */
export const loadOf = (l: Pick<LaptopState, 'buffer' | 'rate' | 'workload'>): number => workMs(l) / bufferMs(l.buffer, l.rate);

/** Expected dropouts per minute (the model, analytically). */
export function dropoutsPerMin(l: Pick<LaptopState, 'buffer' | 'rate' | 'workload'>): number {
  const P = bufferMs(l.buffer, l.rate);
  const C = workMs(l);
  const perSec = l.rate / l.buffer;
  if (C >= P) return perSec * 60;
  const margin = P - C;
  if (margin >= SPIKE_MAX_MS) return 0;
  return SPIKE_P * Math.exp(-margin / SPIKE_MEAN_MS) * perSec * 60;
}

/** The smallest buffer this workload runs with NO dropouts at this rate. */
export function stableBuffer(workload: Workload, rate: number): number {
  for (const b of BUFFERS) if (dropoutsPerMin({ buffer: b, rate, workload }) === 0) return b;
  return BUFFERS[BUFFERS.length - 1];
}

/**
 * The dropouts in booth time [t0, t0 + seconds): the start of each buffer
 * that missed its deadline (booth seconds). Deterministic per buffer index
 * (a seeded draw), so a chunk join and a re-render agree.
 */
export function dropoutsIn(l: LaptopState, t0: number, seconds: number): number[] {
  const P = bufferMs(l.buffer, l.rate) / 1000;
  const C = workMs(l) / 1000;
  const out: number[] = [];
  const k0 = Math.ceil(t0 / P);
  const k1 = Math.floor((t0 + seconds) / P);
  if (C >= P) {
    for (let k = k0; k <= k1; k += 1) out.push(k * P);
    return out;
  }
  const margin = P - C;
  if (margin * 1000 >= SPIKE_MAX_MS) return out;
  for (let k = k0; k <= k1; k++) {
    const r = rng((0xb0f + Math.imul(k, 0x9e3779b1)) >>> 0);
    if (r() >= SPIKE_P) continue;
    const spike = Math.min(SPIKE_MAX_MS, -SPIKE_MEAN_MS * Math.log(Math.max(1e-9, 1 - r()))) / 1000;
    if (spike > margin) out.push(k * P);
  }
  return out;
}

/** Does deck `d`'s software audio reach mixer channel `ch` over USB? */
export function laptopFeeds(l: LaptopState | undefined, d: DeckId, ch: ChannelId): boolean {
  if (!l || !l.usbMixer || l.device !== 'MIXER USB') return false;
  return l.assign[d] === usbPairOf(ch);
}

/** The devices the software can see. */
export const devicesSeen = (l: LaptopState): ('MIXER USB' | 'BUILT-IN')[] => (l.usbMixer ? ['MIXER USB', 'BUILT-IN'] : ['BUILT-IN']);
