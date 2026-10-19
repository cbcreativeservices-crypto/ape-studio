/**
 * eventShared — plumbing for the event screens (19–24): the booth kit
 * rendering through the event layer (engine/djEventRender), readings from
 * its latest render, the LISTEN tray with the RECORDER perspective, the
 * announcement, and bezel cells. Built ON pages/shared and dock, never
 * instead of them.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { BezelItem } from '../../rack/rackTypes';
import { getBooth, setPerspective, updateBooth, boothNow } from '../booth/boothStore';
import { eventRenderer, isEventRender, type EventRender } from '../engine/djEventRender';
import { voiceSeconds } from '../engine/djVoice';
import { LISTEN_FRESH, dbStr, listenDb, type Booth } from '../model/djModel';
import { anyPlaying } from '../model/djDeck';
import { evOf, freshEvent, type EventRig } from '../model/djEvent';
import { PEAK_RED, useBoothKit, type BoothKit } from './shared';
import type { BoothAudioOpts } from '../booth/useBoothAudio';
import { levelColorForDb } from '../../../../features/tools/levelColor';

export type EventKit = BoothKit & { last: EventRender | null };

/** The booth kit for an event screen. `onChunk` hears each chunk as it
 *  starts sounding (the recorder's take). */
export function useEventKit(opts?: { lockPhase?: boolean; onChunk?: BoothAudioOpts['onChunk'] }): EventKit {
  const audioOpts = useMemo<BoothAudioOpts>(() => ({ render: eventRenderer, onChunk: opts?.onChunk }), [opts?.onChunk]);
  const kit = useBoothKit({ lockPhase: opts?.lockPhase, audio: audioOpts });
  const last = isEventRender(kit.audio.last) ? kit.audio.last : null;
  return { ...kit, last };
}

/** A booth with a fresh event rig (a screen's own baseline), patched. */
export function withFreshEvent(b: Booth, f?: (ev: EventRig) => EventRig): Booth {
  const ev = freshEvent();
  return { ...b, ev: f ? f(ev) : ev };
}

/** The loudest raw block of an event tap over a render (dBFS), or null. */
export function extPeak(r: EventRender | null, tap: 'mic' | 'recL' | 'recR' | 'sub', onlySpeech = false): number | null {
  if (!r) return null;
  let m = -120;
  const a = r.ext.raw[tap];
  for (let k = 0; k < a.length; k++) if ((!onlySpeech || r.ext.speech[k]) && a[k] > m) m = a[k];
  return m <= -59.9 ? null : m;
}

/** The render carried speech at all. */
export const hadSpeech = (r: EventRender | null): boolean => !!r && r.ext.speech.some((x) => x === 1);

/** VOICE reaching a feed: the mic's own share is clearly there. */
export const VOICE_FLOOR_DB = -50;
export const voiceIn = (r: EventRender | null, feed: 'master' | 'booth' | 'rec' | 'crowd'): boolean => !!r && hadSpeech(r) && r.ext.micIn[feed] > VOICE_FLOOR_DB;

/** Make the announcement: it starts sounding at the next render (so it is
 *  heard from its first syllable). Old ones are forgotten. */
export function announce(leadSec: number): void {
  const at = boothNow() + leadSec;
  updateBooth((b) => {
    const ev = evOf(b);
    const keep = ev.mic.says.filter((s) => s.at + voiceSeconds() > at - 0.5);
    return { ...b, ev: { ...ev, mic: { ...ev.mic, says: [...keep, { at }] } } };
  });
}

/** Is an announcement sounding now (or about to)? */
export function announcing(b: Booth): boolean {
  const t = boothNow();
  return (b.ev?.mic.says ?? []).some((s) => t < s.at + voiceSeconds());
}

/** An announcement needs music under it (the booth's clock runs only while
 *  something plays). */
export const musicOn = (b: Booth): boolean => anyPlaying(b);

/** A cell: a dB reading tinted on the ramp. */
export function dbCell(k: string, db: number | null, unit = 'dBFS'): BezelItem {
  if (db == null || !Number.isFinite(db)) return { k, v: '—', tint: colors.textSub };
  if (unit === 'dBFS' && db >= 0) return { k, v: 'CLIP', tint: PEAK_RED };
  return { k, v: db.toFixed(1), vA11y: `${db.toFixed(1)} ${unit}`, sub: unit, tint: unit === 'dBFS' ? levelColorForDb(db, -40, 0) : colors.amber };
}

/** VOICE IN: which feeds carry the mic (✓ or —), from the last render. */
export function voiceCell(r: EventRender | null): BezelItem {
  if (!hadSpeech(r)) return { k: 'VOICE IN', v: 'NOT SPEAKING', tint: colors.textSub };
  const f = (x: 'crowd' | 'booth' | 'rec', w: string) => `${w}${voiceIn(r, x) ? '✓' : '—'}`;
  return { k: 'VOICE IN', v: [f('crowd', 'CRD'), f('booth', 'BTH'), f('rec', 'REC')].join(' '), vA11y: `voice in the crowd ${voiceIn(r, 'crowd') ? 'yes' : 'no'}, the booth ${voiceIn(r, 'booth') ? 'yes' : 'no'}, the recording ${voiceIn(r, 'rec') ? 'yes' : 'no'}`, tint: colors.green };
}

/* ── LISTEN, with the recorder ────────────────────────────────────────── */

const PERSP = [
  { id: 'CROWD', blurb: 'What the audience hears.' },
  { id: 'BOOTH', blurb: 'What you hear at the decks: the booth monitors.' },
  { id: 'PHONES', blurb: 'Your headphones.' },
  { id: 'RECORDER', blurb: 'What the recorder is taking in, after its own input gain.' },
] as const;

export function hearingOf(b: Booth): string {
  return b.ev?.hearRec ? 'RECORDER' : b.perspective;
}

/** Whose ears the phone plays — the booth's three, or the RECORDER's input.
 *  Every switch starts the listen level low again. */
export function EventListen({ withRecorder = true }: { withRecorder?: boolean }) {
  const b = getBooth();
  const now = hearingOf(b);
  const pick = (id: string) => {
    if (id === 'RECORDER') updateBooth((x) => ({ ...x, listen: LISTEN_FRESH, ev: { ...evOf(x), hearRec: true } }));
    else {
      if (b.ev?.hearRec) updateBooth((x) => ({ ...x, listen: LISTEN_FRESH, ev: { ...evOf(x), hearRec: false } }));
      setPerspective(id as Booth['perspective']);
    }
  };
  const step = (d: number) => updateBooth((x) => ({ ...x, listen: Math.max(0, Math.min(1, Math.round((x.listen + d) * 20) / 20)) }));
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>LISTEN AS (the phone plays one of these)</Text>
      <View style={styles.row}>
        {PERSP.filter((p) => withRecorder || p.id !== 'RECORDER').map((p) => (
          <LabChip key={p.id} label={p.id} selected={now === p.id} onPress={() => pick(p.id)} compact />
        ))}
      </View>
      <Text style={styles.note}>{PERSP.find((p) => p.id === now)?.blurb}</Text>
      <View style={styles.row}>
        <LabChip label="QUIETER" selected={false} onPress={() => step(-0.05)} compact />
        <Text style={styles.level}>{`PLAYBACK ${Math.round(b.listen * 100)}% · ${dbStr(listenDb(b.listen))}`}</Text>
        <LabChip label="LOUDER" selected={false} onPress={() => step(0.05)} compact />
      </View>
      <Text style={styles.fine}>This is how loud the PHONE plays the lab — not a calibrated or safe level. It starts low again whenever you switch.</Text>
    </View>
  );
}

/** A labelled chip row inside a tray. */
export function Row({ head, children }: { head: string; children: React.ReactNode }) {
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>{head}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export function TrayNote({ children, tone }: { children: React.ReactNode; tone?: 'warn' | 'fine' }) {
  return <Text style={tone === 'warn' ? styles.warn : tone === 'fine' ? styles.fine : styles.note}>{children}</Text>;
}

export const trayStyles = StyleSheet.create({
  stack: { gap: 10 },
});

const styles = StyleSheet.create({
  tray: { gap: 6 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  fine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  level: { color: colors.amber, fontFamily: fonts.mono, fontSize: 13, paddingHorizontal: 4 },
});
