/**
 * STAGE 10 — Power, Signal & Interference (spec §33). NO folklore.
 *
 * (a) THE CONCEPT FIELD — a cross-section with a movable signal cable
 * (DragSlider DISTANCE + accessible CLOSER/FARTHER steps + balanced toggle)
 * near a selectable noisy neighbor (AC feeder, transformer, motor, dimmer
 * rack, network cable). The glow is labeled a CONCEPTUAL VISUALIZATION —
 * never measured values, never fake dB numbers: the exposure indicator is a
 * qualitative LOW / MODERATE / HIGH derived from source + distance +
 * balancing. The real levers (level, balancing, shielding, current, distance,
 * geometry, grounding) are taught explicitly via the rule library
 * ('emi-no-universal-distance', 'emi-balanced-helps').
 *
 * (b) THE CROSSING — power route × signal route: the four CI_EMI_CHOICES as
 * preview cards; each pick reveals its rule verdict, and "cross near
 * perpendicular" is explicitly classified as engineering/professional
 * practice, not a universal code clause.
 *
 * Completion: field explored (distance moved + balance toggled) AND a sound
 * crossing choice made → onComplete({ signal, routing }), once.
 *
 * Accessibility: chips/cards are labeled buttons ≥44dp; the slider has
 * button-step equivalents; exposure changes are announced; verdicts are
 * glyph + words + color, never color alone.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { OptionChip } from '../../cable/lessons/bits';
import { DragSlider } from '../../foundations/bits';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { CI_CLASS_TINTS } from '../data/cableTypes';
import { CI_EMI_CHOICES } from '../data/scenarios';
import type { CiModuleProps } from '../registry';

/* ── the neighbors (qualitative noisiness only — no numbers anywhere) ───── */
type EmiSource = { id: string; label: string; noise: number; tint: string; role: string };

const EMI_SOURCES: EmiSource[] = [
  { id: 'feeder', label: 'AC FEEDER', noise: 0.8, tint: '#ff5a48', role: 'High-current supply run' },
  { id: 'xfmr', label: 'TRANSFORMER', noise: 0.85, tint: '#ff5a48', role: 'Stray magnetic field at the core' },
  { id: 'motor', label: 'MOTOR', noise: 0.8, tint: '#ff5a48', role: 'Broadband electrical hash' },
  { id: 'dimmer', label: 'DIMMER RACK', noise: 1, tint: '#ff5a48', role: 'Phase-chopped current — the classic offender' },
  { id: 'network', label: 'NETWORK CABLE', noise: 0.3, tint: '#37d97b', role: 'Low-level balanced data — a quiet neighbor' },
];

/* ── the seven real levers (rule 'emi-no-universal-distance') ───────────── */
const EMI_LEVERS: { name: string; blurb: string }[] = [
  { name: 'LEVEL', blurb: 'How strong the noise source is — and how small your signal is.' },
  { name: 'BALANCING', blurb: 'Balanced interconnects reject what couples onto both conductors.' },
  { name: 'SHIELDING', blurb: 'Shield plus correct termination intercepts field coupling.' },
  { name: 'CURRENT', blurb: 'More current in the neighbor, more magnetic field around it.' },
  { name: 'DISTANCE', blurb: 'Exposure falls fast as separation grows.' },
  { name: 'GEOMETRY', blurb: 'Long parallel runs couple; steep crossings barely do.' },
  { name: 'GROUNDING', blurb: 'Bonding and shield practice decide what becomes audible.' },
];

type ExposureBand = { word: 'LOW' | 'MODERATE' | 'HIGH'; tint: string };

function exposureFor(src: EmiSource, dist: number, balanced: boolean): ExposureBand {
  const raw = src.noise * (1 - 0.85 * dist);
  const coupled = balanced ? raw * 0.4 : raw;
  if (coupled < 0.22) return { word: 'LOW', tint: colors.green };
  if (coupled < 0.5) return { word: 'MODERATE', tint: colors.amber };
  return { word: 'HIGH', tint: '#ff9b8f' };
}

const distWord = (d: number) => (d < 0.33 ? 'CLOSE' : d < 0.66 ? 'MID' : 'FAR');

/* ── the concept-field cross-section ────────────────────────────────────── */
function FieldArt({ w, src, dist, balanced, band }: { w: number; src: EmiSource; dist: number; balanced: boolean; band: ExposureBand }) {
  const h = Math.round(w * (150 / 360));
  const cx = 132 + dist * 196;
  const glowR = 34 + src.noise * 54;
  const sig = CI_CLASS_TINTS.analog;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 360 150"
      accessibilityLabel={`Cross-section, conceptual visualization: ${src.label} at left with a conceptual coupling-risk field, signal cable at ${distWord(dist)} spacing, ${balanced ? 'balanced' : 'unbalanced'} interconnect. Exposure ${band.word}. Not measured values.`}
    >
      <Defs>
        <RadialGradient id="ciEmiGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={src.tint} stopOpacity={0.4} />
          <Stop offset="55%" stopColor={src.tint} stopOpacity={0.16} />
          <Stop offset="100%" stopColor={src.tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={360} height={150} rx={10} fill="#0c0c10" />
      {/* conceptual coupling-risk field */}
      <Circle cx={64} cy={70} r={glowR} fill="url(#ciEmiGlow)" />
      <Circle cx={64} cy={70} r={glowR} fill="none" stroke={src.tint} strokeWidth={0.8} strokeDasharray="3,5" opacity={0.55} />
      {/* the source */}
      <SourceIcon id={src.id} tint={src.tint} />
      <SvgText x={64} y={124} fill="#a6a6ad" fontSize={8.5} textAnchor="middle">{src.label}</SvgText>
      <SvgText x={64} y={135} fill="#6f7378" fontSize={6.5} textAnchor="middle">{src.role.toUpperCase()}</SvgText>
      {/* distance guide */}
      <Line x1={80} y1={70} x2={cx - 21} y2={70} stroke="#6f7378" strokeWidth={1} strokeDasharray="4,4" />
      {/* the signal cable, in cross-section */}
      <Circle cx={cx} cy={70} r={19} fill="none" stroke={band.tint} strokeWidth={2.4} />
      <Circle cx={cx} cy={70} r={13} fill="#101014" stroke={sig} strokeWidth={2.6} />
      <Circle cx={cx} cy={70} r={9} fill="none" stroke="#9be8f2" strokeWidth={1.3} strokeDasharray="3,2" />
      {balanced ? (
        <G>
          <Circle cx={cx - 4} cy={70} r={2.4} fill="#e8e8ea" />
          <Circle cx={cx + 4} cy={70} r={2.4} fill="#e8e8ea" />
        </G>
      ) : (
        <Circle cx={cx} cy={70} r={2.6} fill="#e8e8ea" />
      )}
      <SvgText x={cx} y={101} fill="#a6a6ad" fontSize={8} textAnchor="middle">SIGNAL CABLE</SvgText>
      <SvgText x={cx} y={111} fill="#6f7378" fontSize={6.5} textAnchor="middle">
        {balanced ? 'BALANCED + SHIELD' : 'UNBALANCED + SHIELD'}
      </SvgText>
      {/* honesty label — required, in the drawing itself */}
      <SvgText x={180} y={146} fill="#6f7378" fontSize={7.5} textAnchor="middle">
        CONCEPTUAL VISUALIZATION — NOT MEASURED VALUES
      </SvgText>
    </Svg>
  );
}

function SourceIcon({ id, tint }: { id: string; tint: string }) {
  if (id === 'xfmr') {
    return (
      <G>
        <Rect x={46} y={54} width={36} height={32} rx={3} fill="#17171c" stroke={tint} strokeWidth={1.6} />
        <Path d="M55 60 q7 10 0 20" stroke={tint} strokeWidth={1.6} fill="none" />
        <Path d="M73 60 q-7 10 0 20" stroke={tint} strokeWidth={1.6} fill="none" />
        <Line x1={62.5} y1={58} x2={62.5} y2={82} stroke="#6f7378" strokeWidth={1.2} />
        <Line x1={65.5} y1={58} x2={65.5} y2={82} stroke="#6f7378" strokeWidth={1.2} />
      </G>
    );
  }
  if (id === 'motor') {
    return (
      <G>
        <Circle cx={62} cy={70} r={14} fill="#17171c" stroke={tint} strokeWidth={1.6} />
        <Rect x={76} y={66} width={11} height={8} rx={2} fill="none" stroke={tint} strokeWidth={1.4} />
        <Circle cx={62} cy={70} r={4} fill="none" stroke="#6f7378" strokeWidth={1.2} />
      </G>
    );
  }
  if (id === 'dimmer') {
    return (
      <G>
        <Rect x={46} y={48} width={36} height={44} rx={3} fill="#17171c" stroke={tint} strokeWidth={1.6} />
        {[57, 70, 83].map((y) => (
          <G key={y}>
            <Line x1={52} y1={y} x2={76} y2={y} stroke="#6f7378" strokeWidth={1.4} />
            <Circle cx={y === 70 ? 68 : 58} cy={y} r={2.6} fill={tint} />
          </G>
        ))}
      </G>
    );
  }
  if (id === 'network') {
    return (
      <G>
        <Circle cx={64} cy={70} r={11} fill="#101014" stroke={tint} strokeWidth={2.2} />
        {[
          [-3.5, -3.5],
          [3.5, -3.5],
          [-3.5, 3.5],
          [3.5, 3.5],
        ].map(([dx, dy]) => (
          <Circle key={`${dx}${dy}`} cx={64 + dx} cy={70 + dy} r={1.8} fill="#e8e8ea" />
        ))}
      </G>
    );
  }
  // AC feeder
  return (
    <G>
      <Circle cx={64} cy={70} r={14} fill="#101014" stroke={tint} strokeWidth={2.6} />
      <Circle cx={64} cy={63} r={2.6} fill="#e8e8ea" />
      <Circle cx={58} cy={74} r={2.6} fill="#e8e8ea" />
      <Circle cx={70} cy={74} r={2.6} fill="#e8e8ea" />
    </G>
  );
}

/* ── crossing-geometry previews ─────────────────────────────────────────── */
function CrossPreview({ kind, w }: { kind: string; w: number }) {
  const h = 64;
  const pow = '#ff5a48';
  const sig = CI_CLASS_TINTS.analog;
  return (
    <Svg width={w} height={h} viewBox="0 0 120 64">
      <Rect x={0} y={0} width={120} height={64} rx={7} fill="#0c0c10" />
      <Line x1={8} y1={20} x2={112} y2={20} stroke={pow} strokeWidth={3.2} />
      {kind === 'parallel-close' ? (
        <Line x1={8} y1={27} x2={112} y2={27} stroke={sig} strokeWidth={2.6} />
      ) : kind === 'separated' ? (
        <G>
          <Line x1={8} y1={52} x2={112} y2={52} stroke={sig} strokeWidth={2.6} />
          <Line x1={60} y1={25} x2={60} y2={47} stroke="#6f7378" strokeWidth={1} />
          <Path d="M57 28 l3 -4 l3 4" fill="none" stroke="#6f7378" strokeWidth={1} />
          <Path d="M57 44 l3 4 l3 -4" fill="none" stroke="#6f7378" strokeWidth={1} />
        </G>
      ) : kind === 'perpendicular' ? (
        <Line x1={60} y1={6} x2={60} y2={58} stroke={sig} strokeWidth={2.6} />
      ) : (
        <G>
          <Rect x={8} y={40} width={104} height={16} rx={2} fill="none" stroke="#6f7378" strokeWidth={1.2} />
          <Line x1={12} y1={48} x2={108} y2={48} stroke={sig} strokeWidth={2.6} />
        </G>
      )}
    </Svg>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function EmiScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [srcId, setSrcId] = useState('feeder');
  const [dist, setDist] = useState(0.5);
  const [balanced, setBalanced] = useState(false);
  const [moved, setMoved] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [lastPick, setLastPick] = useState<string | null>(null);
  const firedRef = useRef(completed);
  const mountedRef = useRef(false);

  const src = EMI_SOURCES.find((x) => x.id === srcId) ?? EMI_SOURCES[0];
  const band = exposureFor(src, dist, balanced);
  const artW = Math.max(160, width);

  // Announce band changes (skip the mount announcement).
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    AccessibilityInfo.announceForAccessibility(`Exposure ${band.word.toLowerCase()}.`);
  }, [band.word]);

  const onDist = (v: number) => {
    setDist(v);
    if (Math.abs(v - 0.5) > 0.05) setMoved(true);
  };
  const stepDist = (delta: number) => {
    setDist((d) => Math.max(0, Math.min(1, d + delta)));
    setMoved(true);
  };
  const setBal = (v: boolean) => {
    if (v !== balanced) setToggled(true);
    setBalanced(v);
  };

  /* crossing */
  const wrongCount = useMemo(
    () => picked.filter((id) => CI_EMI_CHOICES.find((c) => c.id === id)?.ok === false).length,
    [picked],
  );
  const answeredOk = useMemo(() => picked.some((id) => CI_EMI_CHOICES.find((c) => c.id === id)?.ok === true), [picked]);
  const lastChoice = lastPick ? CI_EMI_CHOICES.find((c) => c.id === lastPick) ?? null : null;

  const pickCrossing = (id: string) => {
    const c = CI_EMI_CHOICES.find((x) => x.id === id);
    if (!c) return;
    setLastPick(id);
    setPicked((p) => (p.includes(id) ? p : [...p, id]));
    AccessibilityInfo.announceForAccessibility(`${c.ok ? 'Sound choice' : 'Poor geometry'}. ${c.note}`);
  };

  /* completion */
  const explored = moved && toggled;
  const allDone = explored && answeredOk;
  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    const signal = Math.max(55, 100 - 15 * wrongCount);
    const routing = Math.max(60, 100 - 12 * wrongCount);
    announceComplete('Stage 10 complete.');
    onComplete({ signal, routing });
  }, [allDone, wrongCount, onComplete]);

  const cardW = Math.max(120, Math.floor((width - 8) / 2));

  return (
    <View style={{ gap: 16 }}>
      {completed ? <Text style={s.replayNote}>✓ Stage already recorded complete — replay freely.</Text> : null}

      {/* (a) THE CONCEPT FIELD */}
      <CiSection title="THE CONCEPT FIELD — MOVE THE SIGNAL CABLE">
        <Text style={s.lead}>
          One signal cable near one noisy neighbor. Pick the neighbor, slide the cable, and flip the interconnect between
          balanced and unbalanced — the exposure call is qualitative, because coupling has levers, not one magic distance.
        </Text>
        <View style={s.chipWrap}>
          {EMI_SOURCES.map((x) => (
            <OptionChip key={x.id} label={x.label} active={srcId === x.id} onPress={() => setSrcId(x.id)} />
          ))}
        </View>
        <FieldArt w={artW} src={src} dist={dist} balanced={balanced} band={band} />
        <Text style={s.caption}>
          The glow marks a conceptual coupling-risk region — not measured values, and no universal separation distance
          exists. Training colors — field cable colors vary.
        </Text>
        <View style={s.exposureRow} accessibilityLiveRegion="polite" accessibilityLabel={`Exposure ${band.word}. ${src.label}, ${balanced ? 'balanced' : 'unbalanced'}, ${distWord(dist)} spacing.`}>
          <Text style={s.exposureLabel}>EXPOSURE</Text>
          <Text style={[s.exposureWord, { color: band.tint }]}>{band.word}</Text>
          <Text style={s.exposureCtx} numberOfLines={1}>
            {`${src.label} · ${balanced ? 'BALANCED' : 'UNBALANCED'} · ${distWord(dist)}`}
          </Text>
        </View>
        <DragSlider value={dist} onChange={onDist} label="DISTANCE" readout={distWord(dist)} />
        <View style={s.chipWrap}>
          <OptionChip label="◂ CLOSER" action onPress={() => stepDist(-0.25)} />
          <OptionChip label="FARTHER ▸" action onPress={() => stepDist(0.25)} />
          <View style={{ width: 10 }} />
          <OptionChip label="BALANCED PAIR" active={balanced} onPress={() => setBal(true)} />
          <OptionChip label="UNBALANCED" active={!balanced} onPress={() => setBal(false)} />
        </View>
        <View style={s.leverCard}>
          <Text style={s.leverHead}>THE REAL LEVERS — NOT A MAGIC NUMBER</Text>
          {EMI_LEVERS.map((l) => (
            <View key={l.name} style={s.leverRow}>
              <Text style={s.leverName}>{l.name}</Text>
              <Text style={s.leverBlurb}>{l.blurb}</Text>
            </View>
          ))}
        </View>
        <RuleFeedback ruleId="emi-no-universal-distance" verdict="info" openSources={openSources} />
        <RuleFeedback ruleId="emi-balanced-helps" verdict="info" openSources={openSources} />
      </CiSection>

      {/* (b) THE CROSSING */}
      <CiSection title="THE CROSSING — POWER ROUTE MEETS SIGNAL ROUTE">
        <Text style={s.lead}>
          The signal route has to get past the feeder route. Four geometries — judge them. You can try more than one; the
          verdict for each appears below.
        </Text>
        <View style={s.grid}>
          {CI_EMI_CHOICES.map((c) => {
            const wasPicked = picked.includes(c.id);
            const isLast = lastPick === c.id;
            return (
              <Pressable
                key={c.id}
                style={[s.crossCard, { width: cardW }, isLast && s.crossCardLast]}
                onPress={() => pickCrossing(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isLast }}
                accessibilityLabel={`${c.label}${wasPicked ? (c.ok ? '. Judged: sound choice.' : '. Judged: poor geometry.') : ''}`}
              >
                <CrossPreview kind={c.id} w={cardW - 22} />
                <Text style={s.crossLabel}>
                  {wasPicked ? (
                    <Text style={{ color: c.ok ? colors.green : '#ff9b8f' }}>{c.ok ? '✓ ' : '✕ '}</Text>
                  ) : null}
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {lastChoice ? (
          <RuleFeedback
            key={lastChoice.id}
            ruleId={lastChoice.ruleId}
            verdict={lastChoice.ok ? 'good' : 'bad'}
            short={lastChoice.note}
            openSources={openSources}
          />
        ) : null}
        {picked.length > 0 ? (
          <View style={s.keyCard}>
            <Text style={s.keyHead}>PRACTICE, NOT A CODE CLAUSE</Text>
            <Text style={s.keyBody}>
              “Cross near perpendicular” is engineering / professional practice — it minimizes shared length. It becomes a
              requirement only when a standard, the project or a manufacturer specifies separation for the scenario; those
              scenario-specific requirements govern when they exist.
            </Text>
          </View>
        ) : null}
      </CiSection>

      <Text style={[s.checkLine, allDone && { color: colors.green }]} accessibilityLiveRegion="polite">
        {`${moved ? '✓' : '○'} MOVE DISTANCE   ${toggled ? '✓' : '○'} FLIP BALANCED/UNBALANCED   ${answeredOk ? '✓' : '○'} SOLVE THE CROSSING`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  replayNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.green },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  exposureRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  exposureLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSecondary },
  exposureWord: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 1.2 },
  exposureCtx: { flexShrink: 1, fontFamily: fonts.mono, fontSize: 10.5, color: colors.textSub },
  leverCard: { gap: 7, borderRadius: 11, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  leverHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amber },
  leverRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  leverName: { width: 88, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSecondary, marginTop: 1 },
  leverBlurb: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  crossCard: {
    gap: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 10,
    minHeight: 108,
  },
  crossCardLast: { borderColor: 'rgba(255,198,77,.6)' },
  crossLabel: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16.5, color: colors.textSecondary },
  keyCard: { gap: 5, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  keyHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  keyBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  checkLine: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6, color: colors.amberLabel },
});
