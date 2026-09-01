/**
 * MeasurementLibraryScreen — the shared Saved Measurement Library (Phase 2,
 * spec of record docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §7) + A/B Compare
 * (§8). Device-local records; every row expands to the FULL measurement
 * context (spec §5: always disclose measurement context) — tool, time, input
 * device, calibration, sample rate, settings, warnings, quality state.
 *
 * Compare: pick any two records → side-by-side values plus the
 * compare-compatibility report's plain-language warnings. Only a tool-type
 * mismatch hard-blocks; differing conditions WARN (spec §8).
 *
 * FlatList + memoized rows (repo convention; the store caps at 200 records).
 * Row a11y: the press target wraps only the row header, so the expanded
 * context text and the DELETE control stay reachable to screen readers
 * (review 2026-07-23).
 *
 * ACADEMY-ONLY (owner 2026-08-05, superseding the 2026-07-23 "free to use"
 * ruling that this header used to state): the Saved Measurements library sits
 * with LEARN/DEMO in the Academy training layer. The tools themselves stay
 * free. Gated here at the DESTINATION on real standing (`useToolsLocked`), so
 * every entry point is covered — the six tool screens link straight in.
 */
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, shareFooterLines, shareHeaderLines } from '../../features/commercial/brand';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { compareCompatibility } from '../../features/tools/measure/compare';
import { deleteMeasurement, useMeasurements } from '../../features/tools/measure/measurementStore';
import { QUALITY_COLOR, QUALITY_LABEL } from '../../features/tools/measure/quality';
import { WARNING_INFO, type SavedMeasurement } from '../../features/tools/measure/types';
import { colors, fonts } from '../../theme/tokens';
import { LockedButton, MembershipRequiredNote, useToolsLocked } from './ToolLockUi';
import { toolByKey } from './toolsData';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ToolLibrary'>;

const fmtHz = (hz: number) => (hz < 10 ? hz.toFixed(2) : hz.toFixed(1));
const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/** Plain-text export of one measurement's FULL context (owner 2026-07-30) —
 *  the same disclosure the expanded row shows, shaped for the OS share sheet. */
function measurementToText(m: SavedMeasurement): string {
  const lines: string[] = [
    m.title,
    `Taken: ${fmtWhen(m.created_at)}`,
    `Tool: ${toolByKey(m.tool_type).name}`,
    `Input: ${m.input_device}`,
    `Calibration: ${m.calibration_status.replace(/_/g, ' ')}`,
    `Quality: ${QUALITY_LABEL[m.quality_state]}`,
  ];
  payloadLines(m).forEach((l) => lines.push(`${l.label}: ${l.value}`));
  Object.entries(m.measurement_settings).forEach(([k, v]) =>
    lines.push(`${k.replace(/_/g, ' ')}: ${String(v ?? '—')}`),
  );
  m.warning_flags.forEach((f) => {
    const w = WARNING_INFO[f];
    lines.push(`⚠ ${w ? `${w.message} ${w.hint}` : f}`);
  });
  if (m.notes) lines.push(`Notes: ${m.notes}`);
  return lines.join('\n');
}

async function shareMeasurements(ms: SavedMeasurement[]): Promise<void> {
  if (ms.length === 0) return;
  // Common branding (owner 2026-08-10): the SAME header + footer as every other
  // share surface — no more stale "AP&E" abbreviation, no missing footer.
  const subtitle = ms.length === 1 ? 'Saved Measurement' : `Saved Measurements · ${ms.length}`;
  const header = shareHeaderLines(subtitle).join('\n');
  const middle =
    ms.length === 1
      ? measurementToText(ms[0])
      : ms.map(measurementToText).join('\n\n──────────\n\n');
  const footer = ['──────────', ...shareFooterLines()].join('\n');
  const body = `${header}\n\n${middle}\n\n${footer}`;
  try {
    await Share.share({
      title: ms.length === 1 ? ms[0].title : `${BRAND.name} — saved measurements`,
      message: body,
    });
  } catch {
    // User dismissed the share sheet, or the OS reported no target — non-fatal.
  }
}

function QualityChip({ m }: { m: SavedMeasurement }) {
  const c = QUALITY_COLOR[m.quality_state];
  return (
    <View style={[styles.qChip, { borderColor: c + 'aa' }]}>
      <Text style={[styles.qChipText, { color: c }]}>{QUALITY_LABEL[m.quality_state]}</Text>
    </View>
  );
}

/** Payload summary lines for the expanded row + compare columns. */
function payloadLines(m: SavedMeasurement): { label: string; value: string }[] {
  const p = m.data_payload;
  if (p.kind === 'tap_log') {
    return [
      { label: 'FREQUENCY', value: `${fmtHz(p.freq)} Hz` },
      { label: 'PERIOD', value: `${Math.round(p.periodMs)} ms` },
      { label: 'BPM', value: `${Math.round(p.bpm)}` },
      { label: 'STABILITY', value: p.stabilityLabel ? `${p.stabilityLabel} (${p.stabilityPct}%)` : '—' },
      { label: 'MIN / MAX', value: p.minFreq != null && p.maxFreq != null ? `${fmtHz(p.minFreq)} – ${fmtHz(p.maxFreq)} Hz` : '—' },
      { label: 'INTERVALS', value: `${p.intervals}` },
    ];
  }
  if (p.kind === 'impulse_response') {
    const valid = p.perBand.filter((b) => b.rt60Sec != null);
    const lines: { label: string; value: string }[] = valid.map((b) => ({
      label: b.bandHz >= 1000 ? `${b.bandHz / 1000} kHz` : `${b.bandHz} Hz`,
      // Per-band method (§13 "always labeled" — range gates are per band, so a
      // band's fit can differ from the broadband headline). `?? p.method`
      // keeps pre-2026-07-23 records (no per-band method) rendering as before.
      value: `${b.rt60Sec!.toFixed(2)} s · ${b.method ?? p.method} · R² ${b.confidence.toFixed(2)}`,
    }));
    // Honest gaps: invalid bands are listed as such, never hidden (spec §13).
    const invalid = p.perBand.length - valid.length;
    if (invalid > 0) lines.push({ label: 'UNRELIABLE BANDS', value: `${invalid} (insufficient range)` });
    lines.push({
      label: 'NOISE FLOOR',
      value: p.noiseFloorDb != null ? `${p.noiseFloorDb.toFixed(0)} dB rel. peak` : '—',
    });
    return lines;
  }
  // Remaining engine-tool payloads (SPL log, spectrum trace, snapshots) — summary rows.
  if (p.kind === 'spl_log') {
    // Unit follows the record's calibration status (ruling R1): field-
    // calibrated logs stored dB SPL values, uncalibrated logs stored dBFS.
    const unit = m.calibration_status === 'calibrated' ? 'dB SPL' : 'dBFS';
    return [
      { label: 'LEQ', value: `${p.avgDb.toFixed(1)} ${unit} (${p.weighting})` },
      { label: 'PEAK', value: `${p.peakDb.toFixed(1)} ${unit}` },
      { label: 'DURATION', value: `${Math.round(p.durationSec)} s · ${p.response}` },
    ];
  }
  if (p.kind === 'spectrum_trace') {
    return [
      { label: 'BANDS', value: `${p.bandsHz.length} × 1/${p.fraction} octave` },
      { label: 'AVERAGING', value: p.averaging },
    ];
  }
  if (p.kind === 'waveform_snapshot') {
    return [
      { label: 'PEAK', value: `${p.peakDbfs.toFixed(1)} dBFS` },
      { label: 'CLIPPED RUNS', value: `${p.clippedRuns}` },
      { label: 'WINDOW', value: `${p.durationSec.toFixed(1)} s` },
    ];
  }
  if (p.kind === 'spectrogram_snapshot') {
    return [
      { label: 'GRID', value: `${p.grid.length} cols × ${p.bandsHz.length} cells` },
      { label: 'DYNAMIC RANGE', value: `${p.dynamicRangeDb} dB · ${p.fftPreset}` },
    ];
  }
  // Pro Audio MultiMeter snapshot (owner 2026-07-29) — summary rows. All
  // levels dBFS · uncalibrated; detections are likely conditions, not
  // guarantees (the payload's own contract).
  if (p.kind === 'multimeter_snapshot') {
    return [
      { label: 'SPL (LCF)', value: `${p.splDb.toFixed(1)} dBC est` },
      { label: 'PEAK / RMS', value: `${p.peakDb.toFixed(1)} / ${p.rmsDb.toFixed(1)} dBFS` },
      { label: 'PEAK HOLD', value: `${p.peakHoldDb.toFixed(1)} dBFS` },
      {
        label: 'DOMINANT',
        value:
          p.dominantHz != null
            ? `${fmtHz(p.dominantHz)} Hz${p.note ? ` · ${p.note}${p.cents != null ? ` (${p.cents >= 0 ? '+' : ''}${p.cents.toFixed(1)}¢)` : ''}` : ''} · ${p.dominantSource ?? '—'}`
            : '—',
      },
      { label: 'BANDS', value: `${p.bandsHz.length} × 1/3 octave` },
      {
        label: 'DETECTIONS',
        value: p.detections.length > 0 ? p.detections.map((d) => d.label).join(' · ') : 'none',
      },
      ...(p.spectrogram
        ? [{ label: 'SPECTROGRAM', value: `${p.spectrogram.grid.length} cols × ${p.spectrogram.rows} rows · ${p.spectrogram.dynamicRangeDb} dB` }]
        : []),
      // Optional gated captures (owner 2026-07-29) — text only; the image is
      // never rendered in the list (keep the row light).
      ...(p.geo
        ? [{
            label: 'LOCATION',
            value: `📍 ${p.geo.latitude.toFixed(5)}, ${p.geo.longitude.toFixed(5)}${p.geo.accuracyM != null ? ` (±${Math.round(p.geo.accuracyM)}m)` : ''}`,
          }]
        : []),
      ...(p.photoUri ? [{ label: 'PHOTO', value: 'photo attached' }] : []),
    ];
  }
  return [{ label: 'DATA', value: (p as { kind: string }).kind.replace(/_/g, ' ') }];
}

function ContextBlock({ m }: { m: SavedMeasurement }) {
  const settings = Object.entries(m.measurement_settings);
  return (
    <View style={styles.ctx}>
      {/* Quality / caution lives ONLY inside the expanded view now (owner
          2026-07-30) — the collapsed list stays clean. */}
      <View style={styles.ctxRow}>
        <Text style={styles.ctxKey}>QUALITY</Text>
        <QualityChip m={m} />
      </View>
      {payloadLines(m).map((l) => (
        <View key={l.label} style={styles.ctxRow}>
          <Text style={styles.ctxKey}>{l.label}</Text>
          <Text style={styles.ctxVal}>{l.value}</Text>
        </View>
      ))}
      <View style={styles.ctxDivider} />
      {/* Full context disclosure (spec §5/§7). */}
      <View style={styles.ctxRow}>
        <Text style={styles.ctxKey}>TAKEN</Text>
        <Text style={styles.ctxVal}>{fmtWhen(m.created_at)}</Text>
      </View>
      <View style={styles.ctxRow}>
        <Text style={styles.ctxKey}>INPUT</Text>
        <Text style={styles.ctxVal}>{m.input_device}</Text>
      </View>
      <View style={styles.ctxRow}>
        <Text style={styles.ctxKey}>CALIBRATION</Text>
        <Text
          style={[
            styles.ctxVal,
            m.calibration_status === 'calibrated' && styles.ctxValCalibrated,
          ]}
        >
          {m.calibration_status === 'calibrated'
            ? 'field-calibrated ✓'
            : m.calibration_status.replace(/_/g, ' ')}
        </Text>
      </View>
      <View style={styles.ctxRow}>
        <Text style={styles.ctxKey}>SAMPLE RATE</Text>
        <Text style={styles.ctxVal}>{m.sample_rate != null ? `${m.sample_rate} Hz` : 'n/a'}</Text>
      </View>
      {settings.map(([k, v]) => (
        <View key={k} style={styles.ctxRow}>
          <Text style={styles.ctxKey}>{k.replace(/_/g, ' ').toUpperCase()}</Text>
          <Text style={styles.ctxVal}>{String(v ?? '—')}</Text>
        </View>
      ))}
      {m.warning_flags.length > 0 && (
        <>
          <View style={styles.ctxDivider} />
          {m.warning_flags.map((f) => {
            const w = WARNING_INFO[f];
            return (
              <Text key={f} style={styles.ctxWarn}>
                ⚠ {w ? `${w.message} ${w.hint}` : f}
              </Text>
            );
          })}
        </>
      )}
      {m.notes ? <Text style={styles.ctxNotes}>{m.notes}</Text> : null}
    </View>
  );
}

/** One library row — memoized; the press target is ONLY the header strip so
 *  the expanded context + DELETE stay reachable to screen readers. */
const Row = memo(function Row({
  m,
  showTool,
  isOpen,
  isPicked,
  pickMode,
  onPress,
  onDelete,
  onShare,
}: {
  m: SavedMeasurement;
  showTool: boolean;
  isOpen: boolean;
  isPicked: boolean;
  /** Compare OR multi-select — either way the row shows a checkbox and does not expand. */
  pickMode: boolean;
  onPress: (m: SavedMeasurement) => void;
  onDelete: (m: SavedMeasurement) => void;
  onShare: (m: SavedMeasurement) => void;
}) {
  return (
    <View style={[styles.row, isPicked && styles.rowPicked]}>
      <Pressable
        style={styles.rowTop}
        onPress={() => onPress(m)}
        accessibilityRole="button"
        accessibilityState={pickMode ? { selected: isPicked } : { expanded: isOpen }}
        accessibilityLabel={m.title}
      >
        {pickMode && (
          <View style={[styles.pickBox, isPicked && styles.pickBoxOn]}>
            {isPicked ? <Text style={styles.pickMark}>✓</Text> : null}
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {m.title}
          </Text>
          <Text style={styles.rowMeta}>
            {showTool ? `${toolByKey(m.tool_type).name} · ` : ''}
            {fmtWhen(m.created_at)}
          </Text>
        </View>
        {/* Quality/caution chip removed from the collapsed row (owner 2026-07-30)
            — it now lives inside the expanded context only. */}
      </Pressable>
      {isOpen && !pickMode && (
        <>
          <ContextBlock m={m} />
          <View style={styles.rowActions}>
            <Pressable
              style={styles.shareBtn}
              onPress={() => onShare(m)}
              accessibilityRole="button"
              accessibilityLabel={`Share ${m.title}`}
            >
              <Text style={styles.shareBtnText}>SHARE</Text>
            </Pressable>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => onDelete(m)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${m.title}`}
            >
              <Text style={styles.deleteBtnText}>DELETE</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
});

export function MeasurementLibraryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const locked = useToolsLocked();
  const toolKey = route.params?.toolKey;
  const all = useMeasurements(toolKey);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  // Multi-select (owner 2026-07-30): a second pick mode for bulk share/delete,
  // mutually exclusive with Compare. `selected` holds any number of ids.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const pickMode = compareMode || selectMode;

  const pickedMs = useMemo(
    () => picked.map((id) => all.find((m) => m.id === id)).filter(Boolean) as SavedMeasurement[],
    [picked, all],
  );
  const report = pickedMs.length === 2 ? compareCompatibility(pickedMs[0], pickedMs[1]) : null;

  const onRowPress = useCallback(
    (m: SavedMeasurement) => {
      if (selectMode) {
        setSelected((prev) => (prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]));
      } else if (compareMode) {
        setPicked((prev) =>
          prev.includes(m.id) ? prev.filter((x) => x !== m.id) : prev.length >= 2 ? [prev[1], m.id] : [...prev, m.id],
        );
      } else {
        setOpenId((prev) => (prev === m.id ? null : m.id));
      }
    },
    [compareMode, selectMode],
  );

  const onRowDelete = useCallback((m: SavedMeasurement) => {
    Alert.alert('Delete measurement', `Delete “${m.title}”? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeasurement(m.id) },
    ]);
  }, []);

  const onRowShare = useCallback((m: SavedMeasurement) => {
    void shareMeasurements([m]);
  }, []);

  // Bulk actions over the current selection.
  const selectedMs = useMemo(
    () => all.filter((m) => selected.includes(m.id)),
    [all, selected],
  );
  const onShareSelected = useCallback(() => void shareMeasurements(selectedMs), [selectedMs]);
  const onToggleAll = useCallback(() => {
    setSelected((prev) => (prev.length === all.length ? [] : all.map((m) => m.id)));
  }, [all]);
  const onDeleteSelected = useCallback(() => {
    if (selected.length === 0) return;
    Alert.alert(
      'Delete measurements',
      `Delete ${selected.length} selected measurement${selected.length === 1 ? '' : 's'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selected.forEach((id) => deleteMeasurement(id));
            setSelected([]);
          },
        },
      ],
    );
  }, [selected]);

  // ACADEMY GATE (fix 2026-08-28). The hub and the Frequency Counter already
  // route free users to the Paywall, but SIX tool screens (SPL, RTA, RT60,
  // MultiMeter, Spectrogram, Waveform) link straight here, and this destination
  // had no check — so the hub's 🔒 was decorative and any free account could
  // read the whole library. Gating at the destination covers every entry point.
  if (locked) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.title}>SAVED MEASUREMENTS</Text>
            <Text style={styles.subtitle}>Academy membership</Text>
          </View>
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <MembershipRequiredNote what="open the saved measurement library" />
          <LockedButton label="SEE MEMBERSHIP" onPress={() => navigation.navigate('Paywall')} height={48} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>SAVED MEASUREMENTS</Text>
          <Text style={styles.subtitle}>{toolKey ? toolByKey(toolKey).name : 'All tools'}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {all.length >= 2 && (
          <Pressable
            style={[styles.compareBtn, compareMode && styles.compareBtnOn]}
            onPress={() => {
              setCompareMode((c) => !c);
              setPicked([]);
              setSelectMode(false);
              setSelected([]);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: compareMode }}
            accessibilityLabel="Compare measurements"
          >
            <Text style={[styles.compareBtnText, compareMode && styles.compareBtnTextOn]}>
              {compareMode ? 'COMPARING' : 'COMPARE'}
            </Text>
          </Pressable>
        )}
        {all.length >= 1 && (
          <Pressable
            style={[styles.selectBtn, selectMode && styles.selectBtnOn]}
            onPress={() => {
              setSelectMode((s) => !s);
              setSelected([]);
              setCompareMode(false);
              setPicked([]);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: selectMode }}
            accessibilityLabel="Select measurements"
          >
            <Text style={[styles.selectBtnText, selectMode && styles.selectBtnTextOn]}>
              {selectMode ? 'DONE' : 'SELECT'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Bulk-action bar — shown only in multi-select (owner 2026-07-30). */}
      {selectMode && (
        <View style={styles.selectBar}>
          <Pressable onPress={onToggleAll} accessibilityRole="button" accessibilityLabel="Select all or clear">
            <Text style={styles.selectBarLink}>{selected.length === all.length && all.length > 0 ? 'CLEAR' : 'ALL'}</Text>
          </Pressable>
          <Text style={styles.selectBarCount}>{selected.length} selected</Text>
          <View style={{ flex: 1 }} />
          <Pressable
            style={[styles.selectBarBtn, selected.length === 0 && styles.selectBarBtnDisabled]}
            onPress={onShareSelected}
            disabled={selected.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Share selected"
          >
            <Text style={styles.selectBarBtnText}>SHARE</Text>
          </Pressable>
          <Pressable
            style={[styles.selectBarBtn, styles.selectBarBtnDanger, selected.length === 0 && styles.selectBarBtnDisabled]}
            onPress={onDeleteSelected}
            disabled={selected.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Delete selected"
          >
            <Text style={[styles.selectBarBtnText, styles.selectBarBtnTextDanger]}>DELETE</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={all}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.scroll}
        renderItem={({ item }) => (
          <Row
            m={item}
            showTool={!toolKey}
            isOpen={openId === item.id}
            isPicked={selectMode ? selected.includes(item.id) : picked.includes(item.id)}
            pickMode={pickMode}
            onPress={onRowPress}
            onDelete={onRowDelete}
            onShare={onRowShare}
          />
        )}
        ListHeaderComponent={
          <>
            {compareMode && (
              <Text style={styles.compareHint}>
                {pickedMs.length < 2
                  ? `Select two measurements to compare (${pickedMs.length}/2).`
                  : 'Comparing the two selected measurements.'}
              </Text>
            )}

            {/* A/B compare panel (spec §8). */}
            {report && pickedMs.length === 2 && (
              <View style={styles.comparePanel}>
                <Text style={styles.comparePanelHead}>A / B COMPARE</Text>
                {!report.comparable ? (
                  <Text style={styles.compareBlocked}>{report.issues[0]?.message}</Text>
                ) : (
                  <>
                    <View style={styles.compareCols}>
                      {pickedMs.map((m, i) => (
                        <View key={m.id} style={styles.compareCol}>
                          <Text style={styles.compareColTag}>{i === 0 ? 'A' : 'B'}</Text>
                          <Text style={styles.compareColTitle} numberOfLines={2}>
                            {m.title}
                          </Text>
                          <QualityChip m={m} />
                          {payloadLines(m).map((l) => (
                            <View key={l.label} style={{ gap: 1 }}>
                              <Text style={styles.ctxKey}>{l.label}</Text>
                              <Text style={styles.compareVal}>{l.value}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                    {report.issues.length > 0 ? (
                      <View style={{ gap: 6 }}>
                        {report.issues.map((iss, i) => (
                          <Text key={`${iss.level}-${i}`} style={styles.compareWarn}>
                            ⚠ {iss.message}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.compareOk}>Settings and conditions match — a fair comparison.</Text>
                    )}
                  </>
                )}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>NO SAVED MEASUREMENTS YET</Text>
            <Text style={styles.emptyBody}>
              Measurements you save from the tools appear here with their full context — settings,
              input, calibration status, and quality. Every tool's SAVE control stores its
              measurement here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.4, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 28, gap: 10 },

  compareBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  compareBtnOn: { borderColor: 'rgba(77,208,225,.7)', backgroundColor: '#0b1a1d' },
  compareBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  compareBtnTextOn: { color: '#4dd0e1' },
  compareHint: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginBottom: 10 },

  selectBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  selectBtnOn: { borderColor: 'rgba(255,193,84,.7)', backgroundColor: '#1c1608' },
  selectBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary },
  selectBtnTextOn: { color: colors.amber },

  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
  },
  selectBarLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  selectBarCount: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub },
  selectBarBtn: { borderRadius: 7, borderWidth: 1, borderColor: '#3a3a3a', paddingVertical: 6, paddingHorizontal: 14 },
  selectBarBtnDanger: { borderColor: 'rgba(255,141,122,.5)' },
  selectBarBtnDisabled: { opacity: 0.4 },
  selectBarBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
  selectBarBtnTextDanger: { color: '#ff8d7a' },

  comparePanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(77,208,225,.5)',
    backgroundColor: '#0d1517',
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  comparePanelHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.8, color: '#4dd0e1' },
  compareBlocked: { fontFamily: fonts.barlowSemiBold, fontSize: 13.5, lineHeight: 19, color: '#ff8d7a' },
  compareCols: { flexDirection: 'row', gap: 12 },
  compareCol: { flex: 1, gap: 7 },
  compareColTag: { fontFamily: fonts.oswaldBold, fontSize: 16, color: '#4dd0e1' },
  compareColTitle: { fontFamily: fonts.oswaldMedium, fontSize: 13.5, color: colors.textPrimary },
  compareVal: { fontFamily: fonts.mono, fontSize: 13.5, color: colors.textPrimary },
  compareWarn: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.amber },
  compareOk: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#5bff85' },

  emptyCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
    gap: 6,
  },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel },
  emptyBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },

  row: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 10,
  },
  rowPicked: { borderColor: 'rgba(77,208,225,.7)' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontFamily: fonts.oswaldMedium, fontSize: 14.5, color: colors.textPrimary },
  rowMeta: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  qChip: { borderRadius: 5, borderWidth: 1, paddingVertical: 2.5, paddingHorizontal: 7, alignSelf: 'flex-start' },
  qChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2 },

  pickBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#3a3a3a',
    backgroundColor: '#101013',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBoxOn: { borderColor: 'rgba(77,208,225,.8)', backgroundColor: '#0b1a1d' },
  pickMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: '#4dd0e1' },

  ctx: { gap: 5 },
  ctxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  ctxKey: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  ctxVal: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary, flexShrink: 1, textAlign: 'right' },
  ctxValCalibrated: { color: '#5bff85' },
  ctxDivider: { height: 1, backgroundColor: '#26262c', marginVertical: 4 },
  ctxWarn: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.amber },
  ctxNotes: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 12.5, color: colors.textMuted, marginTop: 4 },

  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  shareBtn: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(77,208,225,.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  shareBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: '#4dd0e1' },
  deleteBtn: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,141,122,.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  deleteBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: '#ff8d7a' },
});
