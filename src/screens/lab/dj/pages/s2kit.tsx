/**
 * s2kit — page plumbing shared by the Stage 2 screens (13–18): the latest
 * chunks' Stage 2 readings (engine/djStage2's report), a deck's beat times
 * in booth time (for the beat lines of the time plots), and small tray rows.
 * Additive to pages/shared.tsx; nothing here changes a Stage 1 screen.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { Card, Eyebrow } from '../../tuning/components/primitives';
import type { BoothRender } from '../engine/djRender';
import type { S2Report } from '../engine/djStage2';
import { trueGrid } from '../engine/djMusic';
import { beatAt, rateOf, timeOfBeat } from '../model/djTime';
import type { DeckState } from '../model/djModel';

/** The latest chunk's Stage 2 report (null before the first one). */
export const s2Of = (r: BoothRender | null): S2Report | null => r?.s2 ?? null;

/**
 * The last `keep` chunks' readings picked by `pick` (oldest first), so a time
 * plot has the seconds before this chunk too. A re-render that starts inside
 * a kept chunk replaces the rest of it.
 */
export function useChunkSegs<T extends { t0: number }>(last: BoothRender | null, pick: (r: BoothRender) => T | null, keep = 2, trim?: (x: T, t: number) => T): T[] {
  const [segs, setSegs] = useState<T[]>([]);
  const seen = useRef<BoothRender | null>(null);
  const pickRef = useRef(pick);
  pickRef.current = pick;
  useEffect(() => {
    if (!last || seen.current === last) return;
    seen.current = last;
    const v = pickRef.current(last);
    setSegs((s) => {
      if (!v) return s;
      // an earlier chunk keeps what it had BEFORE this one starts
      const kept = s.filter((x) => x.t0 < v.t0 - 1e-6).slice(-(keep - 1)).map((x) => (trim ? trim(x, v.t0) : x));
      return [...kept, v];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last, keep]);
  return segs;
}

/** Booth times of a playing deck's TRUE beats inside [from, to]. */
export function deckBeatTimes(d: DeckState, from: number, to: number): number[] {
  if (!d.track || !d.playing) return [];
  const g = trueGrid(d.track);
  const r = rateOf(d.pitch);
  const posAt = (t: number) => d.posSec + (t - d.at) * r;
  const b0 = Math.ceil(beatAt(g, posAt(from)));
  const b1 = Math.floor(beatAt(g, posAt(to)));
  const out: number[] = [];
  for (let k = b0; k <= b1 && out.length < 400; k++) out.push(d.at + (timeOfBeat(g, k) - d.posSec) / r);
  return out;
}

/** A tray row of choices under a heading (with an optional line under it). */
export function Choices<T extends string | number>({ head, value, items, onPick, note }: { head: string; value: T; items: readonly { id: T; label: string }[]; onPick: (id: T) => void; note?: ReactNode }) {
  return (
    <View style={styles.block}>
      <Text style={styles.head}>{head}</Text>
      <View style={styles.row}>
        {items.map((it) => (
          <LabChip key={String(it.id)} label={it.label} selected={value === it.id} onPress={() => onPick(it.id)} compact />
        ))}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

export function TrayNote({ children, warn = false }: { children: ReactNode; warn?: boolean }) {
  return <Text style={warn ? styles.warn : styles.note}>{children}</Text>;
}

/**
 * CHECK YOURSELF as EVIDENCE (learning review 2: a check reads the booth, not
 * a multiple choice): the task, a button that sets up its starting state, and
 * the result the page latches from the booth's own state and the render's
 * readings. `done` comes from the page; nothing here decides it.
 */
export function EvidenceCheck({ task, setupLabel = 'SET IT UP', onSetup, armed, done, hint, explain }: { task: string; setupLabel?: string; onSetup: () => void; armed: boolean; done: boolean; hint?: string; explain: string }) {
  return (
    <Card>
      <Eyebrow>CHECK YOURSELF</Eyebrow>
      <Text style={styles.q}>{task}</Text>
      <View style={styles.row}>
        <LabChip label={armed ? `${setupLabel} AGAIN` : setupLabel} selected={false} onPress={onSetup} />
      </View>
      {done ? (
        <Text style={[styles.explain, { color: colors.green }]}>{`✓ ${explain}`}</Text>
      ) : armed && hint ? (
        <Text style={[styles.explain, { color: colors.textSub }]}>{hint}</Text>
      ) : null}
    </Card>
  );
}

export const s2styles = StyleSheet.create({
  tray: { gap: 10 },
});

const styles = StyleSheet.create({
  block: { gap: 6 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
