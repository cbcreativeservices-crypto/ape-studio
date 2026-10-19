/**
 * dock — the DJ Systems Lab's dock keys (rack/rackTypes grammar) and the
 * transport. Every key writes the ONE shared booth (booth/boothStore), so the
 * drawing, the meters and the sound all move from the same change. Owner
 * rules honoured here: controls live only in the dock; a level fader shows
 * the amplitude ramp; a readout prints its number beside its word; a fader
 * with no effect says why (`locked`); a clear STOP is always in reach.
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { LabChip } from '../LabShell';
import type { DockParam } from '../rack/rackTypes';
import type { BoothAudio } from './booth/useBoothAudio';
import { getBooth, setPerspective, updateBooth } from './booth/boothStore';
import { playPause, setPitch, setPlaying } from './model/djDeck';
import { PITCH_RANGE_PCT } from './model/djTime';
import { TRIM_UNITY, dbStr, eqDb, faderGain, levelKnobGain, listenDb, trimDb, trimPos, type Booth, type ChannelId, type DeckId, type Perspective } from './model/djModel';

/* ── the transport (a PLAY press also asks the sound gate) ────────────── */

export type Transport = {
  toggle: (deck: DeckId) => void;
  play: (deck: DeckId) => void;
  stopAll: () => void;
  /** The learner said no to sound on this screen: offer to ask again. */
  soundDeclined: boolean;
  soundOn: () => void;
};

export function transportOf(audio: BoothAudio): Transport {
  return {
    toggle: (deck) => {
      if (!getBooth().decks[deck].playing) void audio.requestSound();
      updateBooth((b, t) => playPause(b, t, deck));
    },
    play: (deck) => {
      void audio.requestSound();
      updateBooth((b, t) => setPlaying(b, t, deck, true));
    },
    stopAll: audio.stop,
    soundDeclined: audio.soundDeclined,
    soundOn: () => void audio.requestSound(true),
  };
}

/* ── formatting ───────────────────────────────────────────────────────── */

export const pct = (v: number) => `${Math.round(v * 100)}%`;
const gainWords = (g: number) => (g <= 0 ? '−∞ dB' : dbStr(20 * Math.log10(g)));

/* ── keys ─────────────────────────────────────────────────────────────── */

export const playKey = (booth: Booth, tr: Transport, deck: DeckId): DockParam => ({
  kind: 'toggle',
  id: `play${deck}`,
  label: `PLAY ${deck}`,
  value: booth.decks[deck].playing,
  onToggle: () => tr.toggle(deck),
});

export const stopKey = (tr: Transport): DockParam => ({ kind: 'action', id: 'stop', label: '■ STOP', onPress: tr.stopAll, tint: colors.red });

export const channelFaderKey = (booth: Booth, ch: ChannelId): DockParam => ({
  kind: 'fader',
  id: `fader${ch}`,
  label: `CH${ch} FADER`,
  value: booth.ch[ch].fader,
  level: true,
  onChange: (v) => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], fader: v } } })),
  format: (v) => `CH${ch} ${pct(v)} · ${gainWords(faderGain(v))}`,
  formatShort: pct,
});

export const trimKey = (booth: Booth, ch: ChannelId): DockParam => ({
  kind: 'fader',
  id: `trim${ch}`,
  label: `TRIM ${ch}`,
  value: booth.ch[ch].trim,
  level: true,
  home: TRIM_UNITY,
  onChange: (v) => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], trim: v } } })),
  format: (v) => `TRIM ${ch} ${dbStr(trimDb(v))}`,
  formatShort: (v) => dbStr(trimDb(v)).replace(' dB', ''),
  nudges: [
    { label: '−1 dB', onPress: () => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], trim: trimPos(Math.round(trimDb(b.ch[ch].trim)) - 1) } } })), a11y: 'Trim down one decibel' },
    { label: '+1 dB', onPress: () => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], trim: trimPos(Math.round(trimDb(b.ch[ch].trim)) + 1) } } })), a11y: 'Trim up one decibel' },
  ],
});

export const levelKey = (booth: Booth, which: 'master' | 'booth' | 'phones', label: string): DockParam => ({
  kind: 'fader',
  id: which,
  label,
  value: booth.mixer[which],
  level: true,
  home: 0.75,
  onChange: (v) => updateBooth((b) => ({ ...b, mixer: { ...b.mixer, [which]: v } })),
  format: (v) => `${label} ${pct(v)} · ${gainWords(levelKnobGain(v))}`,
  formatShort: pct,
});

export const xfaderKey = (booth: Booth): DockParam => ({
  kind: 'fader',
  id: 'xf',
  label: 'X-FADER',
  value: booth.mixer.xf,
  home: 0.5,
  onChange: (v) => updateBooth((b) => ({ ...b, mixer: { ...b.mixer, xf: v } })),
  format: (v) => (v < 0.02 ? 'X-FADER full A' : v > 0.98 ? 'X-FADER full B' : `X-FADER ${Math.round((1 - v) * 100)} A · ${Math.round(v * 100)} B`),
  formatShort: (v) => (v < 0.02 ? 'A' : v > 0.98 ? 'B' : `${Math.round(v * 100)}%`),
});

export const eqKey = (booth: Booth, ch: ChannelId, band: 'hi' | 'mid' | 'lo', setBand: (b: 'hi' | 'mid' | 'lo') => void): DockParam => ({
  kind: 'fader',
  id: `eq${ch}`,
  label: `EQ ${ch}`,
  value: booth.ch[ch].eq[band],
  home: 0.5,
  onChange: (v) => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], eq: { ...b.ch[ch].eq, [band]: v } } } })),
  format: (v) => `CH${ch} ${band === 'hi' ? 'HIGH' : band === 'mid' ? 'MID' : 'LOW'} ${eqDb(v) === -Infinity ? 'KILL' : dbStr(eqDb(v))}`,
  formatShort: (v) => (eqDb(v) === -Infinity ? 'KILL' : dbStr(eqDb(v)).replace(' dB', '')),
  chooser: {
    title: `CH${ch} EQ BAND`,
    options: [
      { id: 'hi', label: 'HIGH', blurb: 'Above about 2.5 kHz: hats, air, the edge of a synth.' },
      { id: 'mid', label: 'MID', blurb: 'About 250 Hz – 2.5 kHz: chords, voices, the body of most instruments.' },
      { id: 'lo', label: 'LOW', blurb: 'Below about 250 Hz: the kick and the bass line.' },
    ],
    selectedId: band,
    onSelect: (id) => setBand(id as 'hi' | 'mid' | 'lo'),
  },
});

export const filterKey = (booth: Booth, ch: ChannelId): DockParam => ({
  kind: 'fader',
  id: `filter${ch}`,
  label: `FILTER ${ch}`,
  value: (booth.ch[ch].filter + 1) / 2,
  home: 0.5,
  onChange: (v) => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], filter: Math.abs(v * 2 - 1) < 0.015 ? 0 : v * 2 - 1 } } })),
  format: (v) => {
    const k = v * 2 - 1;
    return Math.abs(k) <= 0.03 ? `FILTER ${ch} OFF` : k < 0 ? `FILTER ${ch} LOW-PASS ${Math.round(-k * 100)}%` : `FILTER ${ch} HIGH-PASS ${Math.round(k * 100)}%`;
  },
  formatShort: (v) => {
    const k = v * 2 - 1;
    return Math.abs(k) <= 0.03 ? 'OFF' : k < 0 ? `LP ${Math.round(-k * 100)}` : `HP ${Math.round(k * 100)}`;
  },
});

export const tempoKey = (booth: Booth, deck: DeckId): DockParam => ({
  kind: 'fader',
  id: `tempo${deck}`,
  label: `TEMPO ${deck}`,
  value: (booth.decks[deck].pitch + PITCH_RANGE_PCT) / (2 * PITCH_RANGE_PCT),
  home: 0.5,
  onChange: (v) => updateBooth((b, t) => setPitch(b, t, deck, Math.round((v * 2 - 1) * PITCH_RANGE_PCT * 100) / 100)),
  format: (v) => `TEMPO ${deck} ${(v * 2 - 1) * PITCH_RANGE_PCT >= 0 ? '+' : '−'}${Math.abs((v * 2 - 1) * PITCH_RANGE_PCT).toFixed(2)} %`,
  formatShort: (v) => `${(v * 2 - 1) * PITCH_RANGE_PCT >= 0 ? '+' : '−'}${Math.abs((v * 2 - 1) * PITCH_RANGE_PCT).toFixed(1)}`,
  nudges: [
    { label: '−0.05%', onPress: () => updateBooth((b, t) => setPitch(b, t, deck, Math.round((b.decks[deck].pitch - 0.05) * 100) / 100)), onLongPress: () => updateBooth((b, t) => setPitch(b, t, deck, b.decks[deck].pitch - 0.5)), a11y: 'Tempo down 0.05 percent; hold for half a percent' },
    { label: '+0.05%', onPress: () => updateBooth((b, t) => setPitch(b, t, deck, Math.round((b.decks[deck].pitch + 0.05) * 100) / 100)), onLongPress: () => updateBooth((b, t) => setPitch(b, t, deck, b.decks[deck].pitch + 0.5)), a11y: 'Tempo up 0.05 percent; hold for half a percent' },
  ],
});

/* ── the LISTEN tray: whose ears the phone plays ──────────────────────── */

const PERSPECTIVES: { id: Perspective; label: string; blurb: string }[] = [
  { id: 'CROWD', label: 'CROWD', blurb: 'What the audience hears: the PA speakers.' },
  { id: 'BOOTH', label: 'BOOTH', blurb: 'What you hear standing at the decks: the booth monitors.' },
  { id: 'PHONES', label: 'PHONES', blurb: 'Your headphones: the cue and the mix, the way the mixer blends them.' },
];

export function ListenTray({ booth }: { booth: Booth }) {
  const step = (d: number) => updateBooth((b) => ({ ...b, listen: Math.max(0, Math.min(1, Math.round((b.listen + d) * 20) / 20)) }));
  return (
    <View style={styles.tray}>
      <Text style={styles.trayNote}>A phone has one headphone output, so here you switch between what the crowd hears, the booth monitors, and your headphones.</Text>
      <View style={styles.row}>
        {PERSPECTIVES.map((p) => (
          <LabChip key={p.id} label={p.label} selected={booth.perspective === p.id} onPress={() => setPerspective(p.id)} />
        ))}
      </View>
      <Text style={styles.trayNote}>{PERSPECTIVES.find((p) => p.id === booth.perspective)?.blurb}</Text>
      <View style={styles.row}>
        <LabChip label="QUIETER" selected={false} onPress={() => step(-0.05)} />
        <Text style={styles.level}>{`PLAYBACK ${Math.round(booth.listen * 100)}% · ${dbStr(listenDb(booth.listen))}`}</Text>
        <LabChip label="LOUDER" selected={false} onPress={() => step(0.05)} />
      </View>
      <Text style={styles.trayFine}>This sets how loud the PHONE plays the lab. It is not a calibrated or safe level — keep your own volume low, and it starts low again whenever you switch.</Text>
    </View>
  );
}

export const listenKey = (booth: Booth): DockParam => ({
  kind: 'group',
  id: 'listen',
  label: 'LISTEN',
  valueLabel: booth.perspective,
  render: () => <ListenTray booth={getBooth()} />,
});

/** The standard BOOTH tray: both decks' PLAY/PAUSE and the LISTEN choice in
 *  one sheet, so a page's own keys keep the dock (≤ 5 keys on a phone). */
export function BoothTray({ booth, tr, decks = ['A', 'B'] }: { booth: Booth; tr: Transport; decks?: readonly DeckId[] }) {
  return (
    <View style={styles.tray}>
      <View style={styles.row}>
        {decks.map((d) => (
          <LabChip key={d} label={`${booth.decks[d].playing ? '❚❚ PAUSE' : '▶ PLAY'} ${d}`} selected={booth.decks[d].playing} onPress={() => tr.toggle(d)} />
        ))}
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} /> : null}
      </View>
      {tr.soundDeclined ? <Text style={styles.trayFine}>Sound is off: the booth still runs and its meters still read the model — you just do not hear it.</Text> : null}
      <ListenTray booth={booth} />
    </View>
  );
}

export const boothKey = (booth: Booth, tr: Transport, decks: readonly DeckId[] = ['A', 'B']): DockParam => ({
  kind: 'group',
  id: 'booth',
  label: 'DECKS',
  valueLabel: decks.filter((d) => booth.decks[d].playing).join('+') || '—',
  valueA11y: `${decks.filter((d) => booth.decks[d].playing).map((d) => `deck ${d}`).join(' and ') || 'nothing'} playing; listening as ${booth.perspective.toLowerCase()}`,
  render: () => <BoothTray booth={getBooth()} tr={tr} decks={decks} />,
});

const styles = StyleSheet.create({
  tray: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  trayNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  trayFine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  level: { color: colors.amber, fontFamily: fonts.mono, fontSize: 13, paddingHorizontal: 4 },
});
