/**
 * djChangeover — screen 23's PERFORMER CHANGEOVER, as pure functions over
 * the shared booth. Pinned by test/djChangeover.test.ts.
 *
 * THE SCENE: the outgoing DJ (DJ 1) plays from a laptop on the mixer's
 * USB 1 into CH 1 (its selector on USB). The incoming DJ (DJ 2) brings a
 * laptop for USB 2 / CH 2, and a BACKUP stick in deck B (CH 2's LINE input)
 * — playback that does not depend on any computer. Two computer paths, so
 * DJ 2 connects without anybody unplugging DJ 1.
 *
 * WHAT WOULD STOP THE MUSIC: a disconnection stops what the crowd hears when
 * it takes away a source that is ON AIR (its channel's fader and crossfader
 * are up and it is playing) — or the mixer, or the MASTER lines to the PA.
 * Pulling a playing player's stick stops that player (most do; never count
 * on one that keeps playing from memory). A laptop's charger is not a
 * source: the laptop runs on its battery.
 */
import { channelRoute, deviceLive, faderGain, xfGainFor, type Booth, type ChannelId } from './djModel.ts';
import { evOf, laptopHum, type Laptop } from './djEvent.ts';

export type ChangeItem = 'lap1.usb' | 'lap1.charger' | 'lap2.usb' | 'deckA.stick' | 'deckB.stick' | 'mixer.power' | 'master' | 'booth';
export const CHANGE_ITEMS: readonly ChangeItem[] = ['lap1.usb', 'lap1.charger', 'lap2.usb', 'deckA.stick', 'deckB.stick', 'mixer.power', 'master', 'booth'];

export const CHANGE_NAMES: Record<ChangeItem, string> = {
  'lap1.usb': 'DJ 1’s laptop USB',
  'lap1.charger': 'DJ 1’s laptop charger',
  'lap2.usb': 'DJ 2’s laptop USB',
  'deckA.stick': 'Deck A’s stick',
  'deckB.stick': 'Deck B’s backup stick',
  'mixer.power': 'The mixer’s power cord',
  master: 'The MASTER cables to the PA',
  booth: 'The BOOTH monitor cables',
};

/** What feeds a channel now: a laptop (on USB) or a player (on LINE). */
export type ChannelSource = { kind: 'lap'; k: 1 | 2 } | { kind: 'deck'; d: 'A' | 'B' } | null;

export function sourceOf(b: Booth, ch: ChannelId): ChannelSource {
  const ev = evOf(b);
  const c = b.ch[ch];
  if (c.input === 'USB') {
    const lap: Laptop = ch === 1 ? ev.lap1 : ev.lap2;
    return lap.usb ? { kind: 'lap', k: ch } : null;
  }
  const route = channelRoute(b, ch);
  const s = route.L ?? route.R;
  if (!s || s.source === 'TT') return null;
  return { kind: 'deck', d: s.source };
}

/** That source is making sound. */
export function sourcePlaying(b: Booth, s: ChannelSource): boolean {
  if (!s) return false;
  const ev = evOf(b);
  if (s.kind === 'lap') {
    const l = s.k === 1 ? ev.lap1 : ev.lap2;
    return l.alive && l.deck.playing && !!l.deck.track;
  }
  const d = b.decks[s.d];
  return d.playing && !!d.track;
}

/** The channel is on air: playing, fader and crossfader up. */
export function onAir(b: Booth, ch: ChannelId): boolean {
  const c = b.ch[ch];
  const g = faderGain(c.fader) * xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve);
  return g > 0.01 && sourcePlaying(b, sourceOf(b, ch));
}

/** The crowd hears music now (some channel on air, mixer and PA live). */
export function programOn(b: Booth): boolean {
  if (!deviceLive(b, 'mixer')) return false;
  const pa = b.plugs['mst.xlrL'] === 'paL.in' || b.plugs['mst.xlrR'] === 'paR.in' || (!!b.ev?.venue.on && (!!b.ev.venue.djL || !!b.ev.venue.djR));
  return pa && (onAir(b, 1) || onAir(b, 2));
}

/** Would pulling `item` stop the music the crowd hears right now? */
export function wouldStop(b: Booth, item: ChangeItem): boolean {
  if (!programOn(b)) return false;
  const onAirSources = ([1, 2] as const).filter((ch) => onAir(b, ch)).map((ch) => sourceOf(b, ch));
  const only = (pred: (s: ChannelSource) => boolean) => onAirSources.length > 0 && onAirSources.every(pred);
  switch (item) {
    case 'mixer.power':
    case 'master':
      return true;
    case 'booth':
    case 'lap1.charger':
      return false;
    case 'lap1.usb':
      return only((s) => s?.kind === 'lap' && s.k === 1);
    case 'lap2.usb':
      return only((s) => s?.kind === 'lap' && s.k === 2);
    case 'deckA.stick':
      return only((s) => s?.kind === 'deck' && s.d === 'A');
    case 'deckB.stick':
      return only((s) => s?.kind === 'deck' && s.d === 'B');
  }
}

/** The prediction's verdict: every item marked right or wrong. */
export function gradePrediction(b: Booth, marked: ReadonlySet<ChangeItem>): { right: boolean; perItem: Record<ChangeItem, boolean> } {
  const perItem = {} as Record<ChangeItem, boolean>;
  let right = true;
  for (const it of CHANGE_ITEMS) {
    const ok = marked.has(it) === wouldStop(b, it);
    perItem[it] = ok;
    if (!ok) right = false;
  }
  return { right, perItem };
}

/** Laptop 2 is making a ground-loop hum in CH 2. */
export const changeoverHum = (b: Booth): boolean => laptopHum(evOf(b).lap2);
