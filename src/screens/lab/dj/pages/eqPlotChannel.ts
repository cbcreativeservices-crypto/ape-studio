/**
 * eqPlotChannel — which channel Screen 9's frequency plot draws, the pure half
 * (tests reach it).
 *
 * RESONANCE is a peak at the FILTER's edge, so while the learner turns it the
 * plot must show the channel whose filter is on — the channel the highlight and
 * the "CHn FILTER" label already point at. It used to show channel 1 always,
 * so with only the CH2 filter on the peak never appeared (owner 2026-11-25,
 * fix-first 15). Every other knob plots its own channel, as before.
 */
import type { ChannelId } from '../model/djModel.ts';

/** The channel the FILTER readouts name: the one picked in the EQ+FILT key,
 *  else the only filter that is on, else channel 1 (unchanged rule). */
export function filterChannel(sel: string, filterOn1: boolean, filterOn2: boolean): ChannelId {
  return sel === 'f2' ? 2 : sel === 'f1' ? 1 : filterOn2 && !filterOn1 ? 2 : 1;
}

/** The plotted channel: the filter's channel for RESONANCE, the knob's own
 *  channel for everything else. */
export function eqPlotChannel(focus: string, focusCh: ChannelId, filtCh: ChannelId): ChannelId {
  return focus === 'res' ? filtCh : focusCh;
}
