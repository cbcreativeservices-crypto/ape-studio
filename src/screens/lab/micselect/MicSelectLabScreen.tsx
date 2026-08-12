/**
 * MicSelectLabScreen — Microphone Selection Lab (owner spec 2026-08-12).
 * "Types, Characteristics & Applications" — a SELECTION lab: the learner
 * finishes able to read an unfamiliar mic's characteristics, weigh the
 * application, and make a DEFENSIBLE choice. Deliberately not a physics lab
 * and not a technique lab (that material lives in the other mic labs).
 *
 * Shape: 9 short lessons + the Choose-the-Microphone challenge + an optional
 * Build-Your-Mic-Locker exercise, as a stepped progression (Foundations
 * idiom: top nav + dots, BACK/NEXT, tap-to-jump, freely open, nothing
 * graded server-side). No audio, no engine — works on every build.
 *
 * Step position persists device-locally (ape:micSelStep); no-account
 * (anonymous) users always start at step 1 and never resume (owner
 * 2026-08-12 guest rule — same as Foundations).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, Line as SkLine, Path as SkPath, Skia, vec } from '@shopify/react-native-skia';
import { GlassButton } from '../../../components/GlassButton';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { colors, fonts } from '../../../theme/tokens';
import { MicArt } from './micArt';
import {
  CHALLENGE_BASE,
  CHALLENGE_FACTORS,
  CHALLENGE_LESSON,
  CHALLENGE_MICS,
  CHALLENGE_VARIANTS,
  CHAR_INTRO,
  CHARACTERISTICS,
  CLASS_NOTE,
  CURVE_LESSON,
  CURVES,
  ENV_LESSON,
  ENV_SCENARIOS,
  FORM_FACTORS,
  FORM_LESSON,
  JOB_GROUPS,
  JOBS_LESSON,
  LOCKER_JOBS,
  LOCKER_LESSON,
  LOCKER_MICS,
  LOCKER_SLOTS,
  MIC_PROFILES,
  MIC_TYPES,
  PATTERN_LESSON,
  PATTERN_REASONS,
  PATTERNS,
  polarR,
  POWER_CASES,
  POWER_NUANCE,
  SOURCE_TIERS,
  SPL_LESSON,
  SPL_MATCH,
  STAGE_SOURCES,
  type PatternKey,
} from './micSelectData';

const STEP_KEY = 'ape:micSelStep';

// ─────────────────────────────────────────────────────────────────────────────
// Small shared pieces

function LessonBanner({ text }: { text: string }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

function Chip({ label, active, onPress, dim }: { label: string; active: boolean; onPress: () => void; dim?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive, dim && { opacity: 0.55 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <Text style={styles.stars}>
      <Text style={{ color: colors.amber }}>{'★'.repeat(n)}</Text>
      <Text style={{ color: '#4a4b52' }}>{'☆'.repeat(5 - n)}</Text>
    </Text>
  );
}

function useWidth(): [number, (e: { nativeEvent: { layout: { width: number } } }) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 1 — Types

function TypesStep() {
  const [sel, setSel] = useState<string | null>('dynamic');
  const [compare, setCompare] = useState(false);
  const [pair, setPair] = useState<string[]>([]);

  const tap = (key: string) => {
    if (!compare) {
      setSel(key);
      return;
    }
    setPair((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p.slice(-1), key]));
  };

  const Detail = ({ k }: { k: string }) => {
    const t = MIC_TYPES.find((m) => m.key === k);
    if (!t) return null;
    return (
      <View style={styles.detailCol}>
        <Text style={styles.detailName}>{t.name}</Text>
        <Text style={styles.detailKlass}>{t.klass === 'transducer' ? 'TRANSDUCER PRINCIPLE' : 'DESIGN / FORM FACTOR'}</Text>
        <Text style={styles.detailHead}>WHAT IT IS</Text>
        <Text style={styles.body}>{t.what}</Text>
        <Text style={styles.detailHead}>MAJOR CHARACTERISTICS</Text>
        {t.traits.map((tr) => (
          <Text key={tr} style={styles.bullet}>{`•  ${tr}`}</Text>
        ))}
        <Text style={styles.detailHead}>TYPICAL APPLICATIONS</Text>
        <Text style={styles.body}>{t.apps}</Text>
        <Text style={styles.detailHead}>IMPORTANT LIMITATION</Text>
        <Text style={[styles.body, { color: '#e8b062' }]}>{t.limitation}</Text>
      </View>
    );
  };

  return (
    <View style={styles.stepGap}>
      <LessonBanner text={CLASS_NOTE} />
      <View style={styles.rowBetween}>
        <Text style={styles.panelEyebrow}>TAP A MICROPHONE</Text>
        <Chip label={compare ? 'COMPARING' : 'COMPARE'} active={compare} onPress={() => { setCompare((c) => !c); setPair([]); }} />
      </View>
      <View style={styles.micGrid}>
        {MIC_TYPES.map((m) => {
          const active = compare ? pair.includes(m.key) : sel === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => tap(m.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={m.name}
              style={[styles.micCell, active && styles.micCellActive]}
            >
              <MicArt kind={m.kind} w={44} h={66} />
              <Text style={styles.micCellName} numberOfLines={2}>
                {m.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {compare ? (
        pair.length === 2 ? (
          <View style={styles.compareRow}>
            <Detail k={pair[0]} />
            <View style={styles.compareDivider} />
            <Detail k={pair[1]} />
          </View>
        ) : (
          <Text style={styles.hint}>Pick two microphones to place them side by side.</Text>
        )
      ) : sel ? (
        <View style={styles.detailCard}>
          <Detail k={sel} />
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 2 — Characteristics

function CharsStep() {
  const [sel, setSel] = useState(CHARACTERISTICS[0].key);
  const c = CHARACTERISTICS.find((x) => x.key === sel)!;
  return (
    <View style={styles.stepGap}>
      <Text style={styles.body}>{CHAR_INTRO}</Text>
      <View style={styles.charHub}>
        <MicArt kind="condenser" w={48} h={72} />
        <View style={styles.chipWrap}>
          {CHARACTERISTICS.map((x) => (
            <Chip key={x.key} label={x.name} active={sel === x.key} onPress={() => setSel(x.key)} />
          ))}
        </View>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailName}>{c.name}</Text>
        {c.why.map((wl) => (
          <Text key={wl} style={styles.body}>
            {wl}
          </Text>
        ))}
        {c.flag ? <LessonBanner text={c.flag} /> : null}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 3 — Polar pattern selection

function PatternsStep() {
  const [pattern, setPattern] = useState<PatternKey>('cardioid');
  const [reason, setReason] = useState<string | null>(null);
  const [w, onLayout] = useWidth();
  const H = Math.min(240, Math.max(200, w * 0.62));
  const cx = w / 2;
  const cy = H / 2;
  const R = Math.min(cx, cy) - 26;

  const patternPath = useMemo(() => {
    if (w <= 0) return null;
    const p = Skia.Path.Make();
    const N = 180;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const r = polarR(pattern, th) * R;
      const x = cx + r * Math.sin(th);
      const y = cy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [w, pattern, R, cx, cy]);

  const verdictFor = (angleDeg: number): { v: string; c: string } => {
    const rr = polarR(pattern, (angleDeg * Math.PI) / 180);
    if (rr >= 0.6) return { v: 'picked up', c: colors.green };
    if (rr >= 0.25) return { v: 'partial', c: colors.amber };
    return { v: 'rejected', c: '#6f86b8' };
  };

  const chosenReason = PATTERN_REASONS.find((r) => r.key === reason);
  const reasonGood = chosenReason?.goodFor.includes(pattern) ?? false;
  const reasonAlt = chosenReason ? PATTERNS.find((p) => chosenReason.goodFor.includes(p.key))?.name : null;

  return (
    <View style={styles.stepGap}>
      <View style={styles.chipWrap}>
        {PATTERNS.map((p) => (
          <Chip key={p.key} label={p.name} active={pattern === p.key} onPress={() => { setPattern(p.key); setReason(null); }} />
        ))}
      </View>
      {/* Coverage map — abstract data, drawn clean per the visual standards. */}
      <View onLayout={onLayout} style={[styles.stageBox, { height: H || 220 }]}>
        {w > 0 && patternPath ? (
          <Canvas style={{ width: w, height: H }}>
            <SkLine p1={vec(cx, 8)} p2={vec(cx, H - 8)} color="#26262c" strokeWidth={1} />
            <SkLine p1={vec(8, cy)} p2={vec(w - 8, cy)} color="#26262c" strokeWidth={1} />
            <SkPath path={patternPath} color="rgba(255,198,77,0.18)" />
            <SkPath path={patternPath} style="stroke" strokeWidth={2} color={colors.amber} />
          </Canvas>
        ) : null}
        {/* mic marker + source markers over the canvas */}
        {w > 0 ? (
          <>
            <View style={[styles.micDot, { left: cx - 7, top: cy - 7 }]} />
            {STAGE_SOURCES.map((s) => {
              const rad = (s.angleDeg * Math.PI) / 180;
              const x = cx + s.dist * R * Math.sin(rad);
              const y = cy - s.dist * R * Math.cos(rad);
              const vd = verdictFor(s.angleDeg);
              return (
                <View key={s.key} style={[styles.srcMark, { left: x - 44, top: y - 12 }]}>
                  <Text style={[styles.srcLabel, { color: s.wanted ? colors.green : vd.c }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Text style={[styles.srcVerdict, { color: vd.c }]}>{vd.v}</Text>
                </View>
              );
            })}
          </>
        ) : null}
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailHead}>{`WHY DID YOU CHOOSE ${PATTERNS.find((p) => p.key === pattern)!.name.toUpperCase()}?`}</Text>
        {PATTERN_REASONS.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => setReason(r.key)}
            accessibilityRole="button"
            style={[styles.reasonRow, reason === r.key && styles.reasonRowActive]}
          >
            <Text style={styles.reasonText}>{r.text}</Text>
          </Pressable>
        ))}
        {chosenReason ? (
          <Text style={[styles.body, { color: reasonGood ? colors.green : colors.amber }]}>
            {reasonGood
              ? 'Exactly — that is what this pattern is FOR.'
              : `That reasoning points toward ${reasonAlt ?? 'a different pattern'} instead — try it above and watch the coverage change.`}
          </Text>
        ) : null}
      </View>
      <LessonBanner text={PATTERN_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 4 — Frequency response

function CurvesStep() {
  const [sel, setSel] = useState('a');
  const [w, onLayout] = useWidth();
  const H = 150;
  const c = CURVES.find((x) => x.key === sel)!;

  const path = useMemo(() => {
    if (w <= 0) return null;
    const yOf = (db: number) => 12 + ((8 - db) / 22) * (H - 24);
    const pts = c.pts.map(([x, db]) => [10 + x * (w - 20), yOf(db)] as const);
    const p = Skia.Path.Make();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      p.quadTo(pts[i][0], pts[i][1], mx, my);
    }
    p.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    return p;
  }, [w, c]);

  const zeroY = 12 + (8 / 22) * (H - 24);

  return (
    <View style={styles.stepGap}>
      <Text style={styles.body}>
        Every curve below is fictional but realistic — read the SHAPE, not a brand. Select one and ask: what does it
        emphasize, what does it attenuate, and where is that useful?
      </Text>
      <View style={styles.chipWrap}>
        {CURVES.map((x) => (
          <Chip key={x.key} label={x.name.split('·')[0].trim()} active={sel === x.key} onPress={() => setSel(x.key)} />
        ))}
      </View>
      <View onLayout={onLayout} style={[styles.stageBox, { height: H }]}>
        {w > 0 && path ? (
          <Canvas style={{ width: w, height: H }}>
            <SkLine p1={vec(10, zeroY)} p2={vec(w - 10, zeroY)} color="#33343c" strokeWidth={1} />
            <SkPath path={path} style="stroke" strokeWidth={2.5} strokeJoin="round" strokeCap="round" color={colors.amber} />
          </Canvas>
        ) : null}
        <Text style={[styles.axisText, { left: 10, bottom: 4 }]}>20 Hz</Text>
        <Text style={[styles.axisText, { alignSelf: 'center', bottom: 4 }]}>1 kHz</Text>
        <Text style={[styles.axisText, { right: 10, bottom: 4 }]}>20 kHz</Text>
        <Text style={[styles.axisText, { left: 10, top: 4 }]}>{c.name}</Text>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailHead}>EMPHASIZES</Text>
        <Text style={styles.body}>{c.emphasize}</Text>
        <Text style={styles.detailHead}>ATTENUATES</Text>
        <Text style={styles.body}>{c.attenuate}</Text>
        <Text style={styles.detailHead}>WHERE THAT IS USEFUL</Text>
        <Text style={styles.body}>{c.useful}</Text>
      </View>
      <LessonBanner text={CURVE_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 5 — Sensitivity, noise & SPL

function SplStep() {
  const [mic, setMic] = useState('cond');
  const [tier, setTier] = useState<string | null>(null);
  const profile = MIC_PROFILES.find((m) => m.key === mic)!;
  return (
    <View style={styles.stepGap}>
      <Text style={styles.body}>{SPL_LESSON}</Text>
      <View style={styles.profileRow}>
        {MIC_PROFILES.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => setMic(m.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: mic === m.key }}
            style={[styles.profileCell, mic === m.key && styles.micCellActive]}
          >
            <MicArt kind={m.kind} w={36} h={54} />
            <Text style={styles.micCellName} numberOfLines={2}>
              {m.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>{profile.traits}</Text>
      <Text style={styles.panelEyebrow}>THE SOURCE SCALE — QUIET AT THE TOP. TAP A SOURCE.</Text>
      {SOURCE_TIERS.map((t) => {
        const m = SPL_MATCH[t.key][mic];
        const open = tier === t.key;
        const vc = m.v === 'good' ? colors.green : m.v === 'watch' ? colors.amber : '#ff8a6b';
        return (
          <Pressable
            key={t.key}
            onPress={() => setTier(open ? null : t.key)}
            accessibilityRole="button"
            style={[styles.tierRow, open && styles.reasonRowActive]}
          >
            <View style={styles.rowBetween}>
              <Text style={styles.tierLabel}>{t.label}</Text>
              <Text style={[styles.tierVerdict, { color: vc }]}>
                {m.v === 'good' ? '✓ good match' : m.v === 'watch' ? '△ depends' : '⚠ caution'}
              </Text>
            </View>
            <Text style={styles.tierExamples}>{t.examples}</Text>
            {open ? <Text style={[styles.body, { marginTop: 4 }]}>{m.note}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 6 — Power

function PowerStep() {
  const [sel, setSel] = useState('dyn');
  const pc = POWER_CASES.find((p) => p.key === sel)!;
  return (
    <View style={styles.stepGap}>
      <View style={styles.chipWrap}>
        {POWER_CASES.map((p) => (
          <Chip key={p.key} label={p.name} active={sel === p.key} onPress={() => setSel(p.key)} />
        ))}
      </View>
      <View style={styles.powerDiagram}>
        <MicArt kind={pc.kind} w={44} h={66} />
        <View style={styles.cableLine} />
        <View style={styles.preampBox}>
          <Text style={styles.preampText}>PREAMP</Text>
          <View style={[styles.phantomBadge, pc.powered && styles.phantomBadgeOn]}>
            <Text style={[styles.phantomText, pc.powered && { color: '#1a1409' }]}>48 V</Text>
          </View>
        </View>
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailName}>{pc.name}</Text>
        {pc.lines.map((l) => (
          <Text key={l} style={styles.body}>
            {l}
          </Text>
        ))}
      </View>
      <LessonBanner text={POWER_NUANCE} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 7 — Form factors

function FormStep() {
  return (
    <View style={styles.stepGap}>
      <Text style={styles.body}>
        The same hypothetical capsule in different physical designs becomes a different tool for a different job.
      </Text>
      {FORM_FACTORS.map((f) => (
        <View key={f.key} style={styles.formRow}>
          <MicArt kind={f.kind} w={40} h={60} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailName}>{f.name}</Text>
            <Text style={styles.tierExamples}>{f.apps.join(' · ')}</Text>
          </View>
        </View>
      ))}
      <LessonBanner text={FORM_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 8 — Environment

function EnvStep() {
  const [sel, setSel] = useState('studio');
  const sc = ENV_SCENARIOS.find((s) => s.key === sel)!;
  return (
    <View style={styles.stepGap}>
      <Text style={styles.body}>The SAME human voice, three different worlds. Watch the priorities move.</Text>
      <View style={styles.chipWrap}>
        {ENV_SCENARIOS.map((s) => (
          <Chip key={s.key} label={s.title.split('·')[0].trim()} active={sel === s.key} onPress={() => setSel(s.key)} />
        ))}
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailName}>{sc.title}</Text>
        <Text style={styles.tierExamples}>{sc.sub}</Text>
        <Text style={styles.detailHead}>PRIORITIES</Text>
        {sc.priorities.map((p) => (
          <Text key={p} style={styles.bullet}>{`•  ${p}`}</Text>
        ))}
      </View>
      <LessonBanner text={ENV_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 9 — Application explorer

function JobsStep() {
  const [group, setGroup] = useState('voice');
  const [job, setJob] = useState('livevocal');
  const g = JOB_GROUPS.find((x) => x.key === group)!;
  const j = g.jobs.find((x) => x.key === job) ?? g.jobs[0];
  return (
    <View style={styles.stepGap}>
      <View style={styles.chipWrap}>
        {JOB_GROUPS.map((x) => (
          <Chip
            key={x.key}
            label={x.name}
            active={group === x.key}
            onPress={() => {
              setGroup(x.key);
              setJob(x.jobs[0].key);
            }}
          />
        ))}
      </View>
      <View style={styles.chipWrap}>
        {g.jobs.map((x) => (
          <Chip key={x.key} label={x.name} active={j.key === x.key} onPress={() => setJob(x.key)} />
        ))}
      </View>
      <View style={styles.detailCard}>
        <Text style={styles.detailName}>{j.name}</Text>
        {j.ratings.map(([name, n]) => (
          <View key={name} style={styles.rowBetween}>
            <Text style={styles.body}>{name}</Text>
            <Stars n={n} />
          </View>
        ))}
        <Text style={[styles.body, { marginTop: 6 }]}>{j.note}</Text>
        <Text style={[styles.detailHead, { marginTop: 4 }]}>WHICH MICROPHONE CHARACTERISTICS SATISFY THESE REQUIREMENTS?</Text>
      </View>
      <LessonBanner text={JOBS_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Final challenge

function ChallengeStep() {
  const [scenario, setScenario] = useState<'base' | string>('base');
  const [pick, setPick] = useState<string | null>(null);
  const [factors, setFactors] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [variantsDone, setVariantsDone] = useState<Set<string>>(new Set());

  const variant = CHALLENGE_VARIANTS.find((v) => v.key === scenario);
  const spec = variant ?? CHALLENGE_BASE;
  const correctPick = pick === spec.correct;
  const acceptedPick = pick != null && spec.accept.includes(pick);

  const switchScenario = (key: 'base' | string) => {
    setScenario(key);
    setPick(null);
    setFactors(new Set());
    setChecked(false);
  };

  const factorScore = CHALLENGE_FACTORS.filter((f) => f.correct && factors.has(f.key)).length;
  const factorWrong = CHALLENGE_FACTORS.filter((f) => !f.correct && factors.has(f.key)).length;

  return (
    <View style={styles.stepGap}>
      <View style={styles.detailCard}>
        <Text style={styles.detailName}>{variant ? `${CHALLENGE_BASE.title} — changed` : CHALLENGE_BASE.title}</Text>
        {variant ? (
          <Text style={[styles.body, { color: colors.amber }]}>{variant.prompt}</Text>
        ) : (
          CHALLENGE_BASE.conditions.map((cd) => (
            <Text key={cd} style={styles.bullet}>{`•  ${cd}`}</Text>
          ))
        )}
      </View>

      <Text style={styles.panelEyebrow}>CHOOSE THE MICROPHONE</Text>
      {CHALLENGE_MICS.map((m) => (
        <Pressable
          key={m.key}
          onPress={() => {
            setPick(m.key);
            setChecked(false);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: pick === m.key }}
          style={[styles.formRow, pick === m.key && styles.micCellActive]}
        >
          <MicArt kind={m.kind} w={36} h={54} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailName}>{m.label}</Text>
            <Text style={styles.tierExamples}>{m.specs.join(' · ')}</Text>
          </View>
        </Pressable>
      ))}

      {pick != null && !variant ? (
        <>
          <Text style={styles.panelEyebrow}>WHY? SELECT THE FACTORS THAT DROVE YOUR CHOICE</Text>
          {CHALLENGE_FACTORS.map((f) => {
            const on = factors.has(f.key);
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  setChecked(false);
                  setFactors((s) => {
                    const n = new Set(s);
                    if (n.has(f.key)) n.delete(f.key);
                    else n.add(f.key);
                    return n;
                  });
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[styles.reasonRow, on && styles.reasonRowActive]}
              >
                <Text style={styles.reasonText}>{`${on ? '☑' : '☐'}  ${f.label}`}</Text>
              </Pressable>
            );
          })}
          <GlassButton label="CHECK MY REASONING" tint="green" height={48} onPress={() => setChecked(true)} />
        </>
      ) : null}
      {pick != null && variant ? <GlassButton label="CHECK" tint="green" height={48} onPress={() => setChecked(true)} /> : null}

      {checked && pick != null ? (
        <View style={styles.detailCard}>
          <Text style={[styles.detailName, { color: correctPick ? colors.green : acceptedPick ? colors.amber : '#ff8a6b' }]}>
            {correctPick
              ? '✓ A defensible professional choice.'
              : acceptedPick
                ? '△ Also defensible — see the tradeoff below.'
                : 'Not the strongest choice here — read why below, then try again.'}
          </Text>
          {!variant && (correctPick || acceptedPick) ? (
            <Text style={styles.body}>
              {`Reasoning: ${factorScore}/3 key factors selected${factorWrong > 0 ? `, ${factorWrong} that don’t bear on this job` : ''}. The ones that matter: directionality, working distance, wind protection.`}
            </Text>
          ) : null}
          <Text style={styles.body}>{spec.explain}</Text>
          {variant && (correctPick || acceptedPick) ? (
            (() => {
              if (!variantsDone.has(variant.key)) setVariantsDone(new Set(variantsDone).add(variant.key));
              return null;
            })()
          ) : null}
        </View>
      ) : null}

      <Text style={styles.panelEyebrow}>CHANGE ONE VARIABLE</Text>
      <View style={styles.chipWrap}>
        <Chip label="Original brief" active={scenario === 'base'} onPress={() => switchScenario('base')} />
        {CHALLENGE_VARIANTS.map((v) => (
          <Chip
            key={v.key}
            label={variantsDone.has(v.key) ? `✓ ${v.prompt.split('.')[0]}` : v.prompt.split('.')[0]}
            active={scenario === v.key}
            onPress={() => switchScenario(v.key)}
          />
        ))}
      </View>
      <LessonBanner text={CHALLENGE_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Optional — mic locker

function LockerStep() {
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const covered = useMemo(() => {
    const s = new Set<string>();
    for (const key of chosen) {
      const m = LOCKER_MICS.find((x) => x.key === key);
      m?.covers.forEach((j) => s.add(j));
    }
    return s;
  }, [chosen]);
  return (
    <View style={styles.stepGap}>
      <Text style={styles.body}>
        {`You have ${LOCKER_SLOTS} microphone slots and ten jobs this week. Build the most VERSATILE locker you can.`}
      </Text>
      <View style={styles.rowBetween}>
        <Text style={styles.panelEyebrow}>{`SLOTS USED: ${chosen.size}/${LOCKER_SLOTS}`}</Text>
        <Text style={[styles.panelEyebrow, { color: covered.size >= 9 ? colors.green : colors.amber }]}>
          {`APPLICATIONS COVERED: ${covered.size}/${LOCKER_JOBS.length}`}
        </Text>
      </View>
      {LOCKER_MICS.map((m) => {
        const on = chosen.has(m.key);
        const full = !on && chosen.size >= LOCKER_SLOTS;
        return (
          <Pressable
            key={m.key}
            onPress={() => {
              if (full) return;
              setChosen((s) => {
                const n = new Set(s);
                if (n.has(m.key)) n.delete(m.key);
                else n.add(m.key);
                return n;
              });
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on, disabled: full }}
            style={[styles.formRow, on && styles.micCellActive, full && { opacity: 0.45 }]}
          >
            <MicArt kind={m.kind} w={30} h={45} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailName}>{`${on ? '☑' : '☐'}  ${m.name}`}</Text>
              <Text style={styles.tierExamples}>
                {`Covers: ${m.covers.map((c) => LOCKER_JOBS.find((j) => j.key === c)?.name).join(' · ')}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <View style={styles.detailCard}>
        <Text style={styles.detailHead}>THIS WEEK’S JOBS</Text>
        {LOCKER_JOBS.map((j) => (
          <View key={j.key} style={styles.rowBetween}>
            <Text style={styles.body}>{j.name}</Text>
            <Text style={{ color: covered.has(j.key) ? colors.green : '#4a4b52', fontFamily: fonts.oswaldSemiBold }}>
              {covered.has(j.key) ? '✓ covered' : '—'}
            </Text>
          </View>
        ))}
      </View>
      <LessonBanner text={LOCKER_LESSON} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The stepped shell

type StepDef = { key: string; tag: string; title: string; intro: string; Body: () => React.JSX.Element };

const STEPS: StepDef[] = [
  {
    key: 'types',
    tag: 'LESSON 1',
    title: 'MEET THE MICROPHONE TYPES',
    intro: 'What choices exist? Recognize the major categories and their broad practical differences.',
    Body: TypesStep,
  },
  {
    key: 'chars',
    tag: 'LESSON 2',
    title: 'CHARACTERISTICS THAT MATTER',
    intro: 'What makes microphones different — the foundation every later decision stands on.',
    Body: CharsStep,
  },
  {
    key: 'patterns',
    tag: 'LESSON 3',
    title: 'POLAR PATTERN SELECTION',
    intro: 'Where should the microphone listen — and what should it refuse to hear?',
    Body: PatternsStep,
  },
  {
    key: 'curves',
    tag: 'LESSON 4',
    title: 'FREQUENCY RESPONSE & TONAL CHARACTER',
    intro: 'Learn to read a response curve the way you would read a spec sheet.',
    Body: CurvesStep,
  },
  {
    key: 'spl',
    tag: 'LESSON 5',
    title: 'SENSITIVITY, NOISE & SPL',
    intro: 'Can this microphone appropriately capture this source?',
    Body: SplStep,
  },
  {
    key: 'power',
    tag: 'LESSON 6',
    title: 'ACTIVE VS. PASSIVE / POWER',
    intro: 'What does the microphone require from the rig?',
    Body: PowerStep,
  },
  {
    key: 'form',
    tag: 'LESSON 7',
    title: 'FORM FACTOR MATTERS',
    intro: 'What physical design fits the job? Selection is not just electrical.',
    Body: FormStep,
  },
  {
    key: 'env',
    tag: 'LESSON 8',
    title: 'SELECTING FOR THE ENVIRONMENT',
    intro: 'How the surroundings change the decision before any spec is read.',
    Body: EnvStep,
  },
  {
    key: 'jobs',
    tag: 'LESSON 9',
    title: 'APPLICATION EXPLORER',
    intro: 'Organized by JOB, not by microphone: priorities first, characteristics second.',
    Body: JobsStep,
  },
  {
    key: 'challenge',
    tag: 'CHALLENGE',
    title: 'CHOOSE THE MICROPHONE',
    intro: 'A realistic brief. Choose, justify — then one variable changes.',
    Body: ChallengeStep,
  },
  {
    key: 'locker',
    tag: 'OPTIONAL',
    title: 'BUILD YOUR MIC LOCKER',
    intro: 'Six slots, ten jobs — versatility is a characteristic too.',
    Body: LockerStep,
  },
];

export function MicSelectLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Guest rule (owner 2026-08-12): anonymous users neither restore nor persist
  // their place — every open starts at the first lesson.
  const { entitlement } = useEntitlement();
  const noAccountRef = useRef(entitlement === 'anonymous');
  noAccountRef.current = entitlement === 'anonymous';
  const navigatedRef = useRef(false);

  useEffect(() => {
    void AsyncStorage.getItem(STEP_KEY).then((v) => {
      if (navigatedRef.current || noAccountRef.current) return;
      const n = v == null ? NaN : Number(v);
      if (Number.isInteger(n) && n > 0 && n < STEPS.length) setStep(n);
    });
  }, []);

  const goTo = useCallback((n: number) => {
    navigatedRef.current = true;
    setStep(n);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (!noAccountRef.current) void AsyncStorage.setItem(STEP_KEY, String(n));
  }, []);

  const s = STEPS[step];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>MICROPHONE SELECTION LAB</Text>
          <Text style={styles.subtitle}>Types, Characteristics & Applications</Text>
        </View>
      </View>
      <Text style={styles.coreQ}>What microphone should I choose for this job — and why?</Text>

      <View style={styles.topNav}>
        <Pressable onPress={() => goTo(0)} disabled={step === 0} hitSlop={8} accessibilityRole="button" accessibilityLabel="First lesson">
          <Text style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}>⏮ START</Text>
        </Pressable>
        <Pressable onPress={() => goTo(Math.max(0, step - 1))} disabled={step === 0} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous lesson">
          <Text style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}>‹ PREV</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.navPos}>{`STEP ${step + 1} / ${STEPS.length}`}</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => goTo(Math.min(STEPS.length - 1, step + 1))}
          disabled={step === STEPS.length - 1}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next lesson"
        >
          <Text style={[styles.navBtn, step === STEPS.length - 1 && styles.navBtnDisabled]}>NEXT ›</Text>
        </Pressable>
      </View>
      <View style={styles.dotsRow}>
        {STEPS.map((st, i) => (
          <Pressable key={st.key} onPress={() => goTo(i)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Go to ${st.title}`}>
            <View style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
          </Pressable>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <Text style={styles.tag}>{`${s.tag} · ${step + 1} OF ${STEPS.length}`}</Text>
        <Text style={styles.stepTitle}>{s.title}</Text>
        <Text style={styles.body}>{s.intro}</Text>
        <s.Body key={s.key} />
        <View style={styles.navRow}>
          <View style={{ flex: 1 }}>
            <GlassButton label="‹ BACK" tint="gold" disabled={step === 0} onPress={() => goTo(Math.max(0, step - 1))} />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton
              label={step === STEPS.length - 1 ? 'DONE ✓' : 'NEXT ›'}
              tint="green"
              onPress={() => (step === STEPS.length - 1 ? navigation.goBack() : goTo(Math.min(STEPS.length - 1, step + 1)))}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 2 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  coreQ: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.amberLabel,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 2 },
  navBtn: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber, paddingHorizontal: 6 },
  navBtnDisabled: { color: '#45454d' },
  navPos: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSub },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2c2c33' },
  dotActive: { backgroundColor: colors.amber },
  dotDone: { backgroundColor: 'rgba(255,198,77,.45)' },

  scroll: { padding: 16, paddingTop: 8, paddingBottom: 30, gap: 10 },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.amberLabel },
  stepTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1, color: colors.textPrimary },
  stepGap: { gap: 10 },

  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, fontStyle: 'italic' },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSecondary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  banner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 11,
  },
  bannerText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },

  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.7, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  micGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  micCell: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  micCellActive: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: '#17140c' },
  micCellName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  detailCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 12,
    gap: 6,
  },
  detailCol: { flex: 1, gap: 5 },
  compareRow: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 12,
  },
  compareDivider: { width: 1, backgroundColor: '#26262c' },
  detailName: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.textPrimary },
  detailKlass: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.4, color: colors.amberLabel },
  detailHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.amberLabel, marginTop: 4 },

  charHub: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },

  stageBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#0c0d11',
    overflow: 'hidden',
  },
  micDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.amber,
    borderWidth: 2,
    borderColor: '#0c0d11',
  },
  srcMark: { position: 'absolute', width: 88, alignItems: 'center' },
  srcLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.6 },
  srcVerdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.5, opacity: 0.9 },
  reasonRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  reasonRowActive: { borderColor: 'rgba(255,198,77,.6)', backgroundColor: '#17140c' },
  reasonText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: colors.textSecondary },

  axisText: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, color: '#5a5b63' },

  profileRow: { flexDirection: 'row', gap: 8 },
  profileCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    paddingVertical: 8,
  },
  tierRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 11,
  },
  tierLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.textPrimary },
  tierVerdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6 },
  tierExamples: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },

  powerDiagram: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  cableLine: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#2a2c33' },
  preampBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 5,
  },
  preampText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
  phantomBadge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3a44',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  phantomBadgeOn: { borderColor: colors.amber, backgroundColor: colors.amber },
  phantomText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: '#5a5b63' },

  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  stars: { fontSize: 13, letterSpacing: 1 },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
