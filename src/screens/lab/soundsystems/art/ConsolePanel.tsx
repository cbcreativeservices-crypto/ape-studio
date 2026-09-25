/**
 * ConsolePanel — the ROUTE mode's console, drawn as the channel-and-bus
 * grid a digital desk shows on its routing page: a scribble strip per
 * channel, then only the columns the exercise is about (a send with its
 * PRE/POST tap, the main/subgroup assignment, the DCA, the mute), and under
 * it the buses with WHO HEARS WHAT computed from the engine.
 *
 * Tap-only by design (WCAG 2.5.7): levels step on tap, taps toggle. Every
 * cell announces its state; colour is always paired with a word.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { levelColorForDb } from '../../../../features/tools/levelColor';
import {
  auxBus,
  hears,
  lin2db,
  mainBus,
  matrixBus,
  setChannel,
  setDca,
  setMatrixInput,
  setMuteGroup,
  setSend,
  setSubgroup,
  subgroupBus,
  type Channel,
  type ConsoleState,
  type Contribution,
} from '../../../../features/soundsystems/console';

export type ConsoleColumn = 'fader' | 'mute' | 'main' | 'sub' | 'dca' | `send:${string}`;

const FADER_STEPS = [-90, -20, -10, -6, 0, 5] as const;
const SEND_STEPS = [-90, -12, -6, 0] as const;

function next<T extends readonly number[]>(steps: T, v: number): number {
  const i = steps.findIndex((s) => s >= v);
  const idx = i < 0 ? 0 : (i + 1) % steps.length;
  return steps[idx];
}

const fmtDb = (db: number) => (db <= -60 ? 'OFF' : `${db > 0 ? '+' : ''}${db}`);

export function ConsolePanel({
  cs,
  onChange,
  channels,
  columns,
  readonly,
}: {
  cs: ConsoleState;
  onChange: (next: ConsoleState) => void;
  /** Which channels to show (default: all). */
  channels?: readonly string[];
  columns: readonly ConsoleColumn[];
  readonly?: boolean;
}) {
  const rows = cs.channels.filter((c) => !channels || channels.includes(c.id));
  const set = (fn: (s: ConsoleState) => ConsoleState) => {
    if (!readonly) onChange(fn(cs));
  };
  const auxName = (id: string) => cs.auxes.find((a) => a.id === id)?.name.replace(/^Aux \d+ · /, '') ?? id;

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <Text style={[styles.headCell, styles.tapeCol]}>CHANNEL</Text>
        {columns.map((col) => (
          <Text key={col} style={styles.headCell} numberOfLines={1}>
            {col === 'fader' ? 'FADER' : col === 'mute' ? 'MUTE' : col === 'main' ? 'MAIN' : col === 'sub' ? 'GROUP' : col === 'dca' ? 'DCA' : auxName(col.slice(5)).toUpperCase()}
          </Text>
        ))}
      </View>
      {rows.map((ch) => (
        <View key={ch.id} style={styles.row}>
          <View style={[styles.tape, styles.tapeCol]}>
            <Text style={styles.tapeText} numberOfLines={1}>{ch.name}</Text>
          </View>
          {columns.map((col) => (
            <Cell key={col} col={col} ch={ch} cs={cs} set={set} readonly={!!readonly} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Cell({ col, ch, cs, set, readonly }: { col: ConsoleColumn; ch: Channel; cs: ConsoleState; set: (fn: (s: ConsoleState) => ConsoleState) => void; readonly: boolean }) {
  if (col === 'fader') {
    return (
      <Pressable
        style={styles.cell}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { faderDb: next(FADER_STEPS, ch.faderDb) }))}
        accessibilityRole="adjustable"
        accessibilityLabel={`${ch.name} fader`}
        accessibilityValue={{ text: `${fmtDb(ch.faderDb)} dB` }}
        accessibilityHint="Tap to step through the fader positions"
      >
        <View style={styles.faderSlot}>
          <View style={[styles.faderFill, { height: `${Math.max(4, ((ch.faderDb + 60) / 65) * 100)}%`, backgroundColor: levelColorForDb(ch.faderDb, -60, 5) }]} />
        </View>
        <Text style={styles.mono}>{fmtDb(ch.faderDb)}</Text>
      </Pressable>
    );
  }
  if (col === 'mute') {
    return (
      <Pressable
        style={[styles.cell, styles.btn, ch.mute && styles.btnMute]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { mute: !ch.mute }))}
        accessibilityRole="button"
        aria-pressed={ch.mute}
        accessibilityState={{ selected: ch.mute }}
        accessibilityLabel={`${ch.name} mute ${ch.mute ? 'on' : 'off'}`}
      >
        <View style={[styles.led, ch.mute && { backgroundColor: colors.red }]} />
        <Text style={[styles.btnText, ch.mute && { color: colors.textPrimary }]}>MUTE</Text>
      </Pressable>
    );
  }
  if (col === 'main') {
    return (
      <Pressable
        style={[styles.cell, styles.btn, ch.toMain && styles.btnOn]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { toMain: !ch.toMain }))}
        accessibilityRole="button"
        aria-pressed={ch.toMain}
        accessibilityState={{ selected: ch.toMain }}
        accessibilityLabel={`${ch.name} to main ${ch.toMain ? 'on' : 'off'}`}
      >
        <View style={[styles.led, ch.toMain && { backgroundColor: colors.amber }]} />
        <Text style={[styles.btnText, ch.toMain && { color: colors.amber }]}>L/R</Text>
      </Pressable>
    );
  }
  if (col === 'sub') {
    const cur = ch.subgroup;
    const opts: (string | null)[] = [null, ...cs.subgroups.map((s) => s.id)];
    const label = cur ? cs.subgroups.find((s) => s.id === cur)?.name ?? cur : '—';
    return (
      <Pressable
        style={[styles.cell, styles.btn, cur && styles.btnOn]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { subgroup: opts[(opts.indexOf(cur) + 1) % opts.length] }))}
        accessibilityRole="button"
        accessibilityLabel={`${ch.name} subgroup: ${cur ? label : 'none'}`}
        accessibilityHint="Tap to cycle the subgroup assignment"
      >
        <Text style={[styles.btnText, cur && { color: colors.amber }]} numberOfLines={1}>{label.toUpperCase()}</Text>
      </Pressable>
    );
  }
  if (col === 'dca') {
    const cur = ch.dca;
    const opts: (string | null)[] = [null, ...cs.dcas.map((d) => d.id)];
    const label = cur ? cs.dcas.find((d) => d.id === cur)?.name ?? cur : '—';
    return (
      <Pressable
        style={[styles.cell, styles.btn, cur && styles.btnOn]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { dca: opts[(opts.indexOf(cur) + 1) % opts.length] }))}
        accessibilityRole="button"
        accessibilityLabel={`${ch.name} DCA: ${cur ? label : 'none'}`}
        accessibilityHint="Tap to cycle the DCA assignment"
      >
        <Text style={[styles.btnText, cur && { color: colors.amber }]} numberOfLines={1}>{label}</Text>
      </Pressable>
    );
  }
  // send:<auxId>
  const auxId = col.slice(5);
  const send = ch.sends[auxId];
  const db = send?.db ?? -90;
  const tap = send?.tap ?? 'post';
  return (
    <View style={styles.cell}>
      <Pressable
        style={[styles.sendBtn, db > -60 && styles.btnOn]}
        disabled={readonly}
        onPress={() => set((s) => setSend(s, ch.id, auxId, { db: next(SEND_STEPS, db), tap }))}
        accessibilityRole="adjustable"
        accessibilityLabel={`${ch.name} send to ${auxId}`}
        accessibilityValue={{ text: `${fmtDb(db)} dB, ${tap}-fader` }}
        accessibilityHint="Tap to step the send level"
      >
        <Text style={[styles.mono, db > -60 && { color: levelColorForDb(db, -20, 0) }]}>{fmtDb(db)}</Text>
      </Pressable>
      <Pressable
        style={[styles.tapBtn, tap === 'pre' && styles.tapPre]}
        disabled={readonly}
        onPress={() => set((s) => setSend(s, ch.id, auxId, { db, tap: tap === 'pre' ? 'post' : 'pre' }))}
        accessibilityRole="button"
        accessibilityLabel={`${ch.name} send to ${auxId} tapped ${tap}-fader`}
        accessibilityHint="Tap to switch between pre-fader and post-fader"
      >
        <Text style={[styles.tapText, tap === 'pre' && { color: colors.cyanBright }]}>{tap.toUpperCase()}</Text>
      </Pressable>
    </View>
  );
}

/* ── bus readouts: who hears what ────────────────────────────────────────── */

export function BusHears({ title, list, note }: { title: string; list: Contribution[]; note?: string }) {
  const heard = hears(list).sort((a, b) => b.gain - a.gain);
  return (
    <View style={styles.bus} accessible accessibilityLabel={`${title}: ${heard.length ? heard.map((h) => `${h.name} at ${Math.round(lin2db(h.gain))} dB`).join(', ') : 'silent'}`}>
      <Text style={styles.busTitle}>{title}</Text>
      {heard.length === 0 ? (
        <Text style={styles.busEmpty}>silent — nothing reaches this output</Text>
      ) : (
        heard.map((h) => {
          const db = lin2db(h.gain);
          return (
            <View key={h.channelId} style={styles.busRow}>
              <Text style={styles.busName} numberOfLines={1}>{h.name}</Text>
              <View style={styles.busBar}>
                <View style={[styles.busFill, { width: `${Math.max(3, ((db + 60) / 66) * 100)}%`, backgroundColor: levelColorForDb(db, -60, 6) }]} />
              </View>
              <Text style={styles.busDb}>{db > 0 ? '+' : ''}{Math.round(db)}</Text>
            </View>
          );
        })
      )}
      {note ? <Text style={styles.busNote}>{note}</Text> : null}
    </View>
  );
}

export function auxHears(cs: ConsoleState, auxId: string) {
  return auxBus(cs, auxId);
}
export function mainHears(cs: ConsoleState) {
  return mainBus(cs);
}
export function subgroupHears(cs: ConsoleState, id: string) {
  return subgroupBus(cs, id);
}
export function matrixHears(cs: ConsoleState, id: string) {
  return matrixBus(cs, id);
}

/* ── group strips: subgroups, DCAs, mute groups, matrices ────────────────── */

export function SubgroupStrip({ cs, onChange, ids }: { cs: ConsoleState; onChange: (s: ConsoleState) => void; ids?: readonly string[] }) {
  const list = cs.subgroups.filter((s) => !ids || ids.includes(s.id));
  return (
    <View style={styles.stripRow}>
      {list.map((s) => (
        <View key={s.id} style={styles.strip}>
          <Text style={styles.stripTitle}>{s.name.toUpperCase()}</Text>
          <Pressable
            style={[styles.btn, styles.stripBtn, s.toMain && styles.btnOn]}
            onPress={() => onChange(setSubgroup(cs, s.id, { toMain: !s.toMain }))}
            accessibilityRole="button"
            aria-pressed={s.toMain}
            accessibilityState={{ selected: s.toMain }}
            accessibilityLabel={`${s.name} subgroup to main ${s.toMain ? 'on' : 'off'}`}
          >
            <View style={[styles.led, s.toMain && { backgroundColor: colors.amber }]} />
            <Text style={[styles.btnText, s.toMain && { color: colors.amber }]}>TO L/R</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.stripBtn]}
            onPress={() => onChange(setSubgroup(cs, s.id, { faderDb: next(FADER_STEPS, s.faderDb) }))}
            accessibilityRole="adjustable"
            accessibilityLabel={`${s.name} subgroup fader`}
            accessibilityValue={{ text: `${fmtDb(s.faderDb)} dB` }}
          >
            <Text style={styles.mono}>{fmtDb(s.faderDb)}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function DcaStrip({ cs, onChange }: { cs: ConsoleState; onChange: (s: ConsoleState) => void }) {
  return (
    <View style={styles.stripRow}>
      {cs.dcas.map((d) => (
        <View key={d.id} style={styles.strip}>
          <Text style={styles.stripTitle}>{d.name}</Text>
          <Pressable
            style={[styles.btn, styles.stripBtn]}
            onPress={() => onChange(setDca(cs, d.id, { levelDb: next(FADER_STEPS, d.levelDb) }))}
            accessibilityRole="adjustable"
            accessibilityLabel={`${d.name} DCA level`}
            accessibilityValue={{ text: `${fmtDb(d.levelDb)} dB` }}
          >
            <Text style={styles.mono}>{fmtDb(d.levelDb)}</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.stripBtn, d.mute && styles.btnMute]}
            onPress={() => onChange(setDca(cs, d.id, { mute: !d.mute }))}
            accessibilityRole="button"
            aria-pressed={d.mute}
            accessibilityState={{ selected: d.mute }}
            accessibilityLabel={`${d.name} DCA mute ${d.mute ? 'on' : 'off'}`}
          >
            <View style={[styles.led, d.mute && { backgroundColor: colors.red }]} />
            <Text style={[styles.btnText, d.mute && { color: colors.textPrimary }]}>MUTE</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function MuteGroupStrip({ cs, onChange }: { cs: ConsoleState; onChange: (s: ConsoleState) => void }) {
  return (
    <View style={styles.stripRow}>
      {cs.muteGroups.map((m) => (
        <Pressable
          key={m.id}
          style={[styles.btn, styles.stripBtn, styles.mgBtn, m.active && styles.btnMute]}
          onPress={() => onChange(setMuteGroup(cs, m.id, !m.active))}
          accessibilityRole="button"
          aria-pressed={m.active}
          accessibilityState={{ selected: m.active }}
          accessibilityLabel={`${m.name} ${m.active ? 'on' : 'off'}`}
        >
          <View style={[styles.led, m.active && { backgroundColor: colors.red }]} />
          <Text style={[styles.btnText, m.active && { color: colors.textPrimary }]}>{m.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** A matrix row: source chips toggle on/off at 0 dB (−6 dB on a second tap). */
export function MatrixStrip({ cs, onChange, matrixId, sources }: { cs: ConsoleState; onChange: (s: ConsoleState) => void; matrixId: string; sources: readonly { id: string; label: string }[] }) {
  const m = cs.matrices.find((x) => x.id === matrixId);
  if (!m) return null;
  return (
    <View style={styles.matrix}>
      <Text style={styles.stripTitle}>{m.name.toUpperCase()}</Text>
      <View style={styles.matrixRow}>
        {sources.map((src) => {
          const db = m.inputs[src.id];
          const on = db != null;
          return (
            <Pressable
              key={src.id}
              style={[styles.btn, styles.matrixBtn, on && styles.btnOn]}
              onPress={() => onChange(setMatrixInput(cs, matrixId, src.id, db == null ? 0 : db === 0 ? -6 : null))}
              accessibilityRole="button"
              aria-pressed={on}
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${m.name} takes ${src.label}: ${on ? `${fmtDb(db)} dB` : 'off'}`}
              accessibilityHint="Tap to cycle: off, 0 dB, minus 6 dB"
            >
              <Text style={[styles.btnText, on && { color: colors.amber }]}>{src.label}</Text>
              <Text style={[styles.mono, { fontSize: 10 }, on && { color: colors.amber }]}>{on ? fmtDb(db) : 'off'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#2b2e36', borderTopColor: '#3a3d46', backgroundColor: '#141418', padding: 6, gap: 4, userSelect: 'none' as never },
  head: { flexDirection: 'row', gap: 4, paddingHorizontal: 2, paddingBottom: 2 },
  headCell: { flex: 1, color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 8, letterSpacing: 1.4, textAlign: 'center' },
  tapeCol: { flex: 1.3, textAlign: 'left' },
  row: { flexDirection: 'row', gap: 4, alignItems: 'stretch', minHeight: 44 },
  tape: { backgroundColor: '#d9d3c2', borderRadius: 3, justifyContent: 'center', paddingHorizontal: 5 },
  tapeText: { color: '#17171a', fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.8 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 44 },
  faderSlot: { width: 6, height: 26, borderRadius: 3, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: '#000', justifyContent: 'flex-end', overflow: 'hidden' },
  faderFill: { width: '100%', borderRadius: 3 },
  mono: { color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 11 },
  btn: { minHeight: 34, borderRadius: 4, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#1a1a1f', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  btnOn: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  btnMute: { borderColor: colors.red, backgroundColor: '#1c1418' },
  btnText: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 9, letterSpacing: 0.8 },
  led: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3a3a42' },
  sendBtn: { minWidth: 40, minHeight: 26, borderRadius: 4, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#1a1a1f', alignItems: 'center', justifyContent: 'center' },
  tapBtn: { minWidth: 40, minHeight: 16, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0f13' },
  tapPre: { backgroundColor: '#0f1a22' },
  tapText: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 8, letterSpacing: 1 },
  bus: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0f13', padding: 10, gap: 5 },
  busTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6 },
  busEmpty: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  busRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busName: { width: 84, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12 },
  busBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#050609', overflow: 'hidden' },
  busFill: { height: '100%', borderRadius: 4 },
  busDb: { width: 30, textAlign: 'right', color: colors.textSub, fontFamily: fonts.mono, fontSize: 11 },
  busNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, marginTop: 2 },
  stripRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  strip: { minWidth: 100, flexGrow: 1, borderRadius: 8, borderWidth: 1, borderColor: '#2b2e36', backgroundColor: '#141418', padding: 6, gap: 5 },
  stripTitle: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 9, letterSpacing: 1.4 },
  stripBtn: { minHeight: 32 },
  mgBtn: { minWidth: 120, flexGrow: 1, minHeight: 44 },
  matrix: { borderRadius: 8, borderWidth: 1, borderColor: '#2b2e36', backgroundColor: '#141418', padding: 8, gap: 6 },
  matrixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  matrixBtn: { minWidth: 64, minHeight: 44, flexDirection: 'column', gap: 1 },
});
