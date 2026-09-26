/**
 * ConsolePanel — the ROUTE mode's console, drawn as a desk within a phone
 * width: a scribble strip per channel, then only the columns the exercise
 * is about — a send POT with its PRE switch, the fader as a real-taper
 * mini fader, MUTE and L/R as illuminated square switches, group/DCA
 * assignment cells — and under it the buses with a METER and WHO HEARS
 * WHAT, computed from the engine.
 *
 * Tap-only by design (WCAG 2.5.7): ▲/▼ step levels, taps toggle switches.
 * Every cell announces its state; colour is always paired with a word.
 * Reuses the house hardware kit's palette, taper and scribble strip.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { LOUDNESS_STOPS, levelColorForDb } from '../../../../features/tools/levelColor';
import { faderDbToFrac, ScribbleStrip } from '../../kit/gear';
import { useSettle } from '../../cableinstall/motion';
import {
  auxBus,
  doubleRouted,
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
import { usePeakHold, useProgrammeLevel } from './motion';

const ARect = Animated.createAnimatedComponent(Rect);

export type ConsoleColumn = 'fader' | 'mute' | 'main' | 'sub' | 'dca' | `send:${string}`;

const FADER_STEP = 3;
const SEND_STEP = 3;
const OFF = -90;

const fmtDb = (db: number) => (db <= -60 ? 'OFF' : `${db > 0 ? '+' : ''}${db}`);

function stepUp(v: number, step: number, max: number): number {
  if (v <= -60) return -20;
  return Math.min(max, v + step);
}
function stepDown(v: number, step: number): number {
  if (v - step < -30) return OFF;
  return v - step;
}

/* ── a send pot: 270° sweep, amber pointer, value under ──────────────────── */

function MiniPot({ db }: { db: number }) {
  const t = db <= -60 ? 0 : (Math.max(-30, Math.min(6, db)) + 30) / 36;
  const deg = -135 + t * 270;
  const a = (deg * Math.PI) / 180;
  const cx = 14;
  const cy = 14;
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      {[-135, -67.5, 0, 67.5, 135].map((d) => {
        const r = (d * Math.PI) / 180;
        return <Line key={d} x1={cx + Math.sin(r) * 11} y1={cy - Math.cos(r) * 11} x2={cx + Math.sin(r) * 13} y2={cy - Math.cos(r) * 13} stroke={d === 0 ? colors.amberLabel : '#5a5f6a'} strokeWidth={d === 0 ? 1.4 : 1} />;
      })}
      <Circle cx={cx} cy={cy} r={9} fill="#26262c" stroke="#3d3d46" strokeWidth={1.2} />
      <Line x1={cx} y1={cy} x2={cx + Math.sin(a) * 7.5} y2={cy - Math.cos(a) * 7.5} stroke={db <= -60 ? '#5a5f6a' : colors.amber} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/* ── a mini fader with the real taper (unity at 70 % of travel) ──────────── */

function MiniFader({ db }: { db: number }) {
  const frac = faderDbToFrac(db <= -60 ? -60 : db);
  const travel = 34;
  const top = useSettle(2 + (1 - frac) * travel, { spring: { damping: 18, stiffness: 220, mass: 0.6 } });
  const cap = useAnimatedStyle(() => ({ top: top.value }));
  return (
    <View style={styles.faderBody}>
      <View style={styles.faderSlot} />
      <View style={[styles.faderUnity, { top: 2 + (1 - faderDbToFrac(0)) * travel + 3 }]} />
      <Animated.View style={[styles.faderCap, cap]}>
        <View style={styles.faderCapLine} />
      </Animated.View>
    </View>
  );
}

/* ── the panel ───────────────────────────────────────────────────────────── */

export function ConsolePanel({
  cs,
  onChange,
  channels,
  columns,
  readonly,
  sendNames,
}: {
  cs: ConsoleState;
  onChange: (next: ConsoleState) => void;
  channels?: readonly string[];
  columns: readonly ConsoleColumn[];
  readonly?: boolean;
  /** Short column subtitles for send columns (e.g. the wedge's owner). */
  sendNames?: Record<string, string>;
}) {
  const rows = cs.channels.filter((c) => !channels || channels.includes(c.id));
  const set = (fn: (s: ConsoleState) => ConsoleState) => {
    if (!readonly) onChange(fn(cs));
  };
  const auxName = (id: string) => cs.auxes.find((a) => a.id === id)?.name.replace(/^Aux \d+ · /, '') ?? id;
  const allPre = (auxId: string, tap: 'pre' | 'post') =>
    set((s) => rows.reduce((acc, ch) => (ch.sends[auxId] ? setSend(acc, ch.id, auxId, { db: ch.sends[auxId].db, tap }) : acc), s));

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <View style={styles.tapeCol}>
          <Text style={styles.headCell}>CHANNEL</Text>
        </View>
        {columns.map((col) => {
          const isSend = col.startsWith('send:');
          const auxId = col.slice(5);
          return (
            <View key={col} style={styles.headCol}>
              <Text style={styles.headCell} numberOfLines={1}>
                {col === 'fader' ? 'FADER' : col === 'mute' ? 'MUTE' : col === 'main' ? 'L/R' : col === 'sub' ? 'GROUP' : col === 'dca' ? 'DCA' : auxName(auxId).toUpperCase()}
              </Text>
              {isSend ? <Text style={styles.headSub} numberOfLines={1}>{sendNames?.[auxId] ?? cs.auxes.find((a) => a.id === auxId)?.purpose.toUpperCase()}</Text> : null}
              {isSend && !readonly ? (
                <View style={styles.allRow}>
                  <Pressable onPress={() => allPre(auxId, 'pre')} style={styles.allBtn} accessibilityRole="button" accessibilityLabel={`All sends to ${auxName(auxId)} pre-fader`}>
                    <Text style={styles.allText}>ALL PRE</Text>
                  </Pressable>
                  <Pressable onPress={() => allPre(auxId, 'post')} style={styles.allBtn} accessibilityRole="button" accessibilityLabel={`All sends to ${auxName(auxId)} post-fader`}>
                    <Text style={styles.allText}>ALL POST</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {rows.map((ch) => {
        const dbl = doubleRouted(ch, cs);
        return (
          <View key={ch.id} style={styles.row}>
            <View style={styles.tapeCol}>
              <ScribbleStrip name={ch.name} />
              {dbl ? <Text style={styles.dblWarn}>△ L/R + GROUP</Text> : null}
            </View>
            {columns.map((col) => (
              <Cell key={col} col={col} ch={ch} cs={cs} set={set} readonly={!!readonly} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function Cell({ col, ch, cs, set, readonly }: { col: ConsoleColumn; ch: Channel; cs: ConsoleState; set: (fn: (s: ConsoleState) => ConsoleState) => void; readonly: boolean }) {
  if (col === 'fader') {
    return (
      <View style={styles.cell}>
        <Pressable style={styles.nudge} disabled={readonly} onPress={() => set((s) => setChannel(s, ch.id, { faderDb: stepUp(ch.faderDb, FADER_STEP, 10) }))} accessibilityRole="button" accessibilityLabel={`${ch.name} fader up ${FADER_STEP} dB, now ${fmtDb(ch.faderDb)} dB`}>
          <Text style={styles.nudgeGlyph}>▲</Text>
        </Pressable>
        <View accessible accessibilityRole="adjustable" accessibilityLabel={`${ch.name} fader`} accessibilityValue={{ text: `${fmtDb(ch.faderDb)} dB` }} aria-valuenow={ch.faderDb} aria-valuemin={-60} aria-valuemax={10}>
          <MiniFader db={ch.faderDb} />
        </View>
        <Pressable style={styles.nudge} disabled={readonly} onPress={() => set((s) => setChannel(s, ch.id, { faderDb: stepDown(ch.faderDb, FADER_STEP) }))} accessibilityRole="button" accessibilityLabel={`${ch.name} fader down ${FADER_STEP} dB, now ${fmtDb(ch.faderDb)} dB`}>
          <Text style={styles.nudgeGlyph}>▼</Text>
        </Pressable>
        <Text style={styles.mono}>{fmtDb(ch.faderDb)}</Text>
      </View>
    );
  }
  if (col === 'mute') {
    return (
      <Pressable
        style={[styles.cell, styles.sw, ch.mute && styles.swMute]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { mute: !ch.mute }))}
        accessibilityRole="button"
        aria-pressed={ch.mute}
        accessibilityState={{ selected: ch.mute }}
        accessibilityLabel={`${ch.name} mute ${ch.mute ? 'on' : 'off'}`}
      >
        <View style={[styles.led, ch.mute && styles.ledRed]} />
        <Text style={[styles.swText, ch.mute && { color: colors.textPrimary }]}>MUTE</Text>
      </Pressable>
    );
  }
  if (col === 'main') {
    return (
      <Pressable
        style={[styles.cell, styles.sw, ch.toMain && styles.swOn]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { toMain: !ch.toMain }))}
        accessibilityRole="button"
        aria-pressed={ch.toMain}
        accessibilityState={{ selected: ch.toMain }}
        accessibilityLabel={`${ch.name} to main ${ch.toMain ? 'on' : 'off'}`}
      >
        <View style={[styles.led, ch.toMain && styles.ledAmber]} />
        <Text style={[styles.swText, ch.toMain && { color: colors.amber }]}>L/R</Text>
      </Pressable>
    );
  }
  if (col === 'sub') {
    const cur = ch.subgroup;
    const opts: (string | null)[] = [null, ...cs.subgroups.map((s) => s.id)];
    const label = cur ? cs.subgroups.find((s) => s.id === cur)?.name ?? cur : '—';
    return (
      <Pressable
        style={[styles.cell, styles.sw, cur && styles.swOn]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { subgroup: opts[(opts.indexOf(cur) + 1) % opts.length] }))}
        accessibilityRole="button"
        accessibilityLabel={`${ch.name} subgroup: ${cur ? label : 'none'}`}
        accessibilityHint="Tap to cycle the subgroup assignment"
      >
        <View style={[styles.led, cur && styles.ledAmber]} />
        <Text style={[styles.swText, cur && { color: colors.amber }]} numberOfLines={1}>{label.toUpperCase()}</Text>
      </Pressable>
    );
  }
  if (col === 'dca') {
    const cur = ch.dca;
    const opts: (string | null)[] = [null, ...cs.dcas.map((d) => d.id)];
    const label = cur ? cs.dcas.find((d) => d.id === cur)?.name ?? cur : '—';
    return (
      <Pressable
        style={[styles.cell, styles.sw, cur && styles.swOn]}
        disabled={readonly}
        onPress={() => set((s) => setChannel(s, ch.id, { dca: opts[(opts.indexOf(cur) + 1) % opts.length] }))}
        accessibilityRole="button"
        accessibilityLabel={`${ch.name} DCA: ${cur ? label : 'none'}`}
        accessibilityHint="Tap to cycle the DCA assignment"
      >
        <View style={[styles.led, cur && styles.ledAmber]} />
        <Text style={[styles.swText, cur && { color: colors.amber }]} numberOfLines={1}>{label}</Text>
      </Pressable>
    );
  }
  // send:<auxId>
  const auxId = col.slice(5);
  const send = ch.sends[auxId];
  const db = send?.db ?? OFF;
  const tap = send?.tap ?? 'post';
  return (
    <View style={styles.cell}>
      <Pressable style={styles.nudge} disabled={readonly} onPress={() => set((s) => setSend(s, ch.id, auxId, { db: stepUp(db, SEND_STEP, 6), tap }))} accessibilityRole="button" accessibilityLabel={`${ch.name} send to ${auxId} up ${SEND_STEP} dB, now ${fmtDb(db)} dB`}>
        <Text style={styles.nudgeGlyph}>▲</Text>
      </Pressable>
      <View accessible accessibilityRole="adjustable" accessibilityLabel={`${ch.name} send to ${auxId}`} accessibilityValue={{ text: `${fmtDb(db)} dB, ${tap}-fader` }} aria-valuenow={db <= -60 ? -60 : db} aria-valuemin={-60} aria-valuemax={6}>
        <MiniPot db={db} />
      </View>
      <Pressable style={styles.nudge} disabled={readonly} onPress={() => set((s) => setSend(s, ch.id, auxId, { db: stepDown(db, SEND_STEP), tap }))} accessibilityRole="button" accessibilityLabel={`${ch.name} send to ${auxId} down ${SEND_STEP} dB, now ${fmtDb(db)} dB`}>
        <Text style={styles.nudgeGlyph}>▼</Text>
      </Pressable>
      <Text style={[styles.mono, db > -60 && { color: levelColorForDb(db, -30, 6) }]}>{fmtDb(db)}</Text>
      <Pressable
        style={[styles.preSw, tap === 'pre' && styles.preOn]}
        disabled={readonly}
        onPress={() => set((s) => setSend(s, ch.id, auxId, { db, tap: tap === 'pre' ? 'post' : 'pre' }))}
        accessibilityRole="button"
        aria-pressed={tap === 'pre'}
        accessibilityState={{ selected: tap === 'pre' }}
        accessibilityLabel={`${ch.name} send to ${auxId} tapped ${tap}-fader`}
        accessibilityHint="Tap to switch between pre-fader and post-fader"
      >
        <View style={[styles.ledSm, tap === 'pre' && styles.ledGreen]} />
        <Text style={[styles.preText, tap === 'pre' && { color: colors.greenBright }]}>PRE</Text>
      </Pressable>
    </View>
  );
}

/* ── bus readouts: a meter and who hears what ────────────────────────────── */

export function BusMeter({ db, programme, peak, height = 64 }: { db: number; programme: SharedValue<number>; peak: SharedValue<number>; height?: number }) {
  const W = 14;
  const H = height;
  const frac = db <= -60 ? 0 : (Math.max(-60, Math.min(6, db)) + 60) / 66;
  const top = 4 + (1 - frac) * (H - 8);
  const bar = useAnimatedProps(() => {
    const dip = (1 - programme.value) * 0.28 * (H - 8);
    const y = Math.min(H - 5, top + dip);
    return { y, height: Math.max(1, H - 4 - y) };
  });
  const hold = useAnimatedProps(() => ({ y: Math.min(H - 6, top + (1 - peak.value) * 0.28 * (H - 8)) - 1 }));
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="bus-ramp" gradientUnits="userSpaceOnUse" x1={0} y1={4} x2={0} y2={H - 4}>
          {LOUDNESS_STOPS.map((s) => (
            <Stop key={s.pos} offset={s.pos} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={2} y={2} width={W - 4} height={H - 4} rx={2} fill="#050609" stroke="#1f2229" strokeWidth={0.6} />
      {db > -60 ? <ARect x={4} y={top} width={W - 8} height={H - 4 - top} rx={1} fill="url(#bus-ramp)" animatedProps={bar} /> : null}
      {db > -60 ? <ARect x={4} y={top - 1} width={W - 8} height={1.5} fill="#fff" opacity={0.85} animatedProps={hold} /> : null}
      <Line x1={2} y1={4 + (1 - 60 / 66) * (H - 8)} x2={W - 2} y2={4 + (1 - 60 / 66) * (H - 8)} stroke={colors.amberLabel} strokeWidth={0.6} opacity={0.6} />
    </Svg>
  );
}

export function BusHears({ title, list, note, running = true }: { title: string; list: Contribution[]; note?: string; running?: boolean }) {
  const heard = hears(list).sort((a, b) => b.gain - a.gain);
  const sumDb = lin2db(list.reduce((s, c) => s + c.gain, 0));
  const programme = useProgrammeLevel(running && heard.length > 0);
  const peak = usePeakHold(programme);
  return (
    <View style={styles.bus} accessible accessibilityLabel={`${title}: ${heard.length ? heard.map((h) => `${h.name} at ${Math.round(lin2db(h.gain))} dB`).join(', ') : 'silent'}`}>
      <View style={styles.busHead}>
        <BusMeter db={sumDb} programme={programme} peak={peak} />
        <View style={{ flex: 1, gap: 4 }}>
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
        </View>
      </View>
      {note ? <Text style={styles.busNote}>{note}</Text> : null}
    </View>
  );
}

/**
 * BusBank — the console's METER BRIDGE for the Rack Unit's glass (2026-09-25):
 * one column per bus, a scribble-strip title over a tall bus meter, and who
 * that bus hears beside it with a level bar per contributor — the same
 * arithmetic BusHears prints, arranged to be read at a glance while the
 * console itself is worked from the dock. Sized by the glass.
 */
export function BusBank({ buses, w, h, running = true }: { buses: readonly { id: string; title: string; list: Contribution[] }[]; w: number; h: number; running?: boolean }) {
  // 52 = the column's chrome: a two-line scribble strip, the sum readout,
  // gaps, padding and border — so a column never grows past the glass.
  const meterH = Math.max(56, Math.min(150, h - 52));
  const cols = Math.max(1, buses.length);
  const colW = Math.floor((w - 12 - (cols - 1) * 6) / cols);
  return (
    <View style={[styles.bank, { width: w, height: h }]}>
      {buses.map((b) => (
        <BusColumn key={b.id} title={b.title} list={b.list} width={colW} meterH={meterH} running={running} />
      ))}
    </View>
  );
}

function BusColumn({ title, list, width, meterH, running }: { title: string; list: Contribution[]; width: number; meterH: number; running: boolean }) {
  const heard = hears(list).sort((a, b) => b.gain - a.gain);
  const sumDb = lin2db(list.reduce((s, c) => s + c.gain, 0));
  const programme = useProgrammeLevel(running && heard.length > 0);
  const peak = usePeakHold(programme);
  // One contributor row is its name line, the level bar and the gap (~21 pt);
  // when they do not all fit, the last line is kept for "+n more".
  const ROW = 21;
  const fitAll = Math.floor((meterH + 3) / ROW);
  const rows = Math.max(1, heard.length > fitAll ? Math.floor((meterH + 3 - 16) / ROW) : fitAll);
  return (
    <View style={[styles.bankCol, { width }]} accessible accessibilityLabel={`${title}: ${heard.length ? heard.map((h) => `${h.name} at ${Math.round(lin2db(h.gain))} dB`).join(', ') : 'silent'}`}>
      <View style={styles.bankTape}>
        <Text style={styles.bankTitle} numberOfLines={2}>{title}</Text>
      </View>
      <View style={styles.bankBody}>
        <BusMeter db={sumDb} programme={programme} peak={peak} height={meterH} />
        <View style={{ flex: 1, gap: 3 }}>
          {heard.length === 0 ? (
            <Text style={styles.bankEmpty}>silent</Text>
          ) : (
            heard.slice(0, rows).map((h) => {
              const db = lin2db(h.gain);
              return (
                <View key={h.channelId} style={{ gap: 1 }}>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankName} numberOfLines={1}>{h.name}</Text>
                    <Text style={styles.bankDb}>{db > 0 ? '+' : ''}{Math.round(db)}</Text>
                  </View>
                  <View style={styles.bankBar}>
                    <View style={[styles.busFill, { width: `${Math.max(3, ((db + 60) / 66) * 100)}%`, backgroundColor: levelColorForDb(db, -60, 6) }]} />
                  </View>
                </View>
              );
            })
          )}
          {heard.length > rows ? <Text style={styles.bankEmpty}>+{heard.length - rows} more</Text> : null}
        </View>
      </View>
      <Text style={styles.bankSum}>{sumDb <= -60 ? 'OFF' : `${sumDb > 0 ? '+' : ''}${Math.round(sumDb)} dB`}</Text>
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
          <Text style={styles.stripTitle}>{s.name.toUpperCase()} · GROUP</Text>
          <View style={styles.stripCtl}>
            <Pressable style={[styles.sw, styles.stripBtn, s.toMain && styles.swOn]} onPress={() => onChange(setSubgroup(cs, s.id, { toMain: !s.toMain }))} accessibilityRole="button" aria-pressed={s.toMain} accessibilityState={{ selected: s.toMain }} accessibilityLabel={`${s.name} subgroup to main ${s.toMain ? 'on' : 'off'}`}>
              <View style={[styles.led, s.toMain && styles.ledAmber]} />
              <Text style={[styles.swText, s.toMain && { color: colors.amber }]}>TO L/R</Text>
            </Pressable>
            <View style={styles.cell}>
              <Pressable style={styles.nudge} onPress={() => onChange(setSubgroup(cs, s.id, { faderDb: stepUp(s.faderDb, FADER_STEP, 10) }))} accessibilityRole="button" accessibilityLabel={`${s.name} subgroup fader up, now ${fmtDb(s.faderDb)} dB`}>
                <Text style={styles.nudgeGlyph}>▲</Text>
              </Pressable>
              <View accessible accessibilityRole="adjustable" accessibilityLabel={`${s.name} subgroup fader`} accessibilityValue={{ text: `${fmtDb(s.faderDb)} dB` }}>
                <MiniFader db={s.faderDb} />
              </View>
              <Pressable style={styles.nudge} onPress={() => onChange(setSubgroup(cs, s.id, { faderDb: stepDown(s.faderDb, FADER_STEP) }))} accessibilityRole="button" accessibilityLabel={`${s.name} subgroup fader down, now ${fmtDb(s.faderDb)} dB`}>
                <Text style={styles.nudgeGlyph}>▼</Text>
              </Pressable>
              <Text style={styles.mono}>{fmtDb(s.faderDb)}</Text>
            </View>
          </View>
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
          <Text style={styles.stripTitle}>{d.name} · DCA</Text>
          <View style={styles.stripCtl}>
            <View style={styles.cell}>
              <Pressable style={styles.nudge} onPress={() => onChange(setDca(cs, d.id, { levelDb: stepUp(d.levelDb, FADER_STEP, 10) }))} accessibilityRole="button" accessibilityLabel={`${d.name} DCA up, now ${fmtDb(d.levelDb)} dB`}>
                <Text style={styles.nudgeGlyph}>▲</Text>
              </Pressable>
              <View accessible accessibilityRole="adjustable" accessibilityLabel={`${d.name} DCA level`} accessibilityValue={{ text: `${fmtDb(d.levelDb)} dB` }}>
                <MiniFader db={d.levelDb} />
              </View>
              <Pressable style={styles.nudge} onPress={() => onChange(setDca(cs, d.id, { levelDb: stepDown(d.levelDb, FADER_STEP) }))} accessibilityRole="button" accessibilityLabel={`${d.name} DCA down, now ${fmtDb(d.levelDb)} dB`}>
                <Text style={styles.nudgeGlyph}>▼</Text>
              </Pressable>
              <Text style={styles.mono}>{fmtDb(d.levelDb)}</Text>
            </View>
            <Pressable style={[styles.sw, styles.stripBtn, d.mute && styles.swMute]} onPress={() => onChange(setDca(cs, d.id, { mute: !d.mute }))} accessibilityRole="button" aria-pressed={d.mute} accessibilityState={{ selected: d.mute }} accessibilityLabel={`${d.name} DCA mute ${d.mute ? 'on' : 'off'}`}>
              <View style={[styles.led, d.mute && styles.ledRed]} />
              <Text style={[styles.swText, d.mute && { color: colors.textPrimary }]}>MUTE</Text>
            </Pressable>
          </View>
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
          style={[styles.sw, styles.stripBtn, styles.mgBtn, m.active && styles.swMute]}
          onPress={() => onChange(setMuteGroup(cs, m.id, !m.active))}
          accessibilityRole="button"
          aria-pressed={m.active}
          accessibilityState={{ selected: m.active }}
          accessibilityLabel={`${m.name} ${m.active ? 'on' : 'off'}`}
        >
          <View style={[styles.led, m.active && styles.ledRed]} />
          <Text style={[styles.swText, m.active && { color: colors.textPrimary }]}>{m.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** A matrix crosspoint row: sources as lit crosspoints (off → 0 dB → −6 dB). */
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
              style={[styles.sw, styles.xpt, on && styles.swOn]}
              onPress={() => onChange(setMatrixInput(cs, matrixId, src.id, db == null ? 0 : db === 0 ? -6 : null))}
              accessibilityRole="button"
              aria-pressed={on}
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${m.name} takes ${src.label}: ${on ? `${fmtDb(db)} dB` : 'off'}`}
              accessibilityHint="Tap to cycle: off, 0 dB, minus 6 dB"
            >
              <View style={[styles.xptDot, on && styles.xptDotOn]} />
              <Text style={[styles.swText, on && { color: colors.amber }]}>{src.label}</Text>
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
  head: { flexDirection: 'row', gap: 4, paddingHorizontal: 2, paddingBottom: 2, alignItems: 'flex-end' },
  headCol: { flex: 1, alignItems: 'center', gap: 2 },
  headCell: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 8, letterSpacing: 1.4, textAlign: 'center' },
  headSub: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 8, letterSpacing: 0.8 },
  allRow: { flexDirection: 'column', gap: 3, alignSelf: 'stretch' },
  allBtn: { minHeight: 22, paddingHorizontal: 4, borderRadius: 3, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#1a1a1f', justifyContent: 'center', alignItems: 'center' },
  allText: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 7, letterSpacing: 0.6 },
  tapeCol: { width: 72, justifyContent: 'center', gap: 2 },
  dblWarn: { color: colors.orange, fontFamily: fonts.oswaldMedium, fontSize: 8, letterSpacing: 0.6 },
  row: { flexDirection: 'row', gap: 4, alignItems: 'center', minHeight: 52, borderTopWidth: 1, borderTopColor: '#1c1e25', paddingTop: 4 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1, minHeight: 44 },
  faderBody: { width: 26, height: 40, alignItems: 'center' },
  faderSlot: { position: 'absolute', left: 11, top: 2, width: 4, height: 36, borderRadius: 2, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: '#000' },
  faderUnity: { position: 'absolute', left: 6, width: 14, height: 1.5, backgroundColor: colors.amberLabel, opacity: 0.4 },
  faderCap: { position: 'absolute', left: 4, width: 18, height: 8, borderRadius: 2, backgroundColor: '#26262c', borderWidth: 1, borderColor: '#3d3d46', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  faderCapLine: { height: 1.5, marginHorizontal: 2, backgroundColor: colors.amber },
  mono: { color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 10.5 },
  nudge: { minHeight: 22, minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  nudgeGlyph: { color: '#8b8b95', fontSize: 9 },
  sw: { minHeight: 34, borderRadius: 4, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#1a1a1f', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  swOn: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  swMute: { borderColor: colors.red, backgroundColor: '#1c1418' },
  swText: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 9, letterSpacing: 0.8 },
  led: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3a3a42' },
  ledSm: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#3a3a42' },
  ledRed: { backgroundColor: colors.red, shadowColor: colors.red, shadowOpacity: 0.9, shadowRadius: 4 },
  ledAmber: { backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.9, shadowRadius: 4 },
  ledGreen: { backgroundColor: colors.greenBright, shadowColor: colors.greenBright, shadowOpacity: 0.9, shadowRadius: 4 },
  preSw: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 20, minWidth: 40, borderRadius: 3, paddingHorizontal: 4, backgroundColor: '#0e0f13', justifyContent: 'center' },
  preOn: { backgroundColor: '#0f2416' },
  preText: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 8, letterSpacing: 1 },
  bus: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0f13', padding: 10, gap: 5 },
  busHead: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  busTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6 },
  busEmpty: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  busRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busName: { width: 84, color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12 },
  busBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#050609', overflow: 'hidden' },
  busFill: { height: '100%', borderRadius: 4 },
  busDb: { width: 30, textAlign: 'right', color: colors.textSub, fontFamily: fonts.mono, fontSize: 11 },
  busNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, marginTop: 2 },
  bank: { flexDirection: 'row', gap: 6, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  bankCol: { gap: 4, borderRadius: 8, borderWidth: 1, borderColor: '#2b2e36', backgroundColor: '#141418', padding: 5 },
  bankTape: { borderRadius: 3, backgroundColor: '#e8e2c8', paddingHorizontal: 4, paddingVertical: 2 },
  bankTitle: { color: '#1a1a1f', fontFamily: fonts.panelSemiBold, fontSize: 9, letterSpacing: 0.5 },
  bankBody: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  bankRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  bankName: { flex: 1, color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 0.3 },
  bankDb: { color: colors.textSub, fontFamily: fonts.mono, fontSize: 9 },
  bankBar: { height: 4, borderRadius: 2, backgroundColor: '#050609', overflow: 'hidden' },
  bankEmpty: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 10.5 },
  bankSum: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 9.5, textAlign: 'center' },
  stripRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  strip: { minWidth: 150, flexGrow: 1, borderRadius: 8, borderWidth: 1, borderColor: '#2b2e36', backgroundColor: '#141418', padding: 6, gap: 5 },
  stripTitle: { color: '#8b8b95', fontFamily: fonts.panelSemiBold, fontSize: 9, letterSpacing: 1.4 },
  stripCtl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripBtn: { minHeight: 32, flex: 1 },
  mgBtn: { minWidth: 120, flexGrow: 1, minHeight: 44 },
  matrix: { borderRadius: 8, borderWidth: 1, borderColor: '#2b2e36', backgroundColor: '#141418', padding: 8, gap: 6 },
  matrixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  xpt: { minWidth: 72, minHeight: 44, flexDirection: 'column', gap: 1 },
  xptDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: '#3a3a42' },
  xptDotOn: { backgroundColor: colors.amber, borderColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.9, shadowRadius: 4 },
});
