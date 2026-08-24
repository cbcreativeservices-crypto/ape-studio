/**
 * STAGE 1 — Why Cable Dressing Matters (spec §8).
 *
 * THE REFERENCE SCENE for this lab's teaching rhythm (spec §38):
 *   ACTION → RESULT (RuleFeedback) → WHY? (expand) → SOURCE (expand).
 * Six consequences, then the core interaction: "Which installation would you
 * approve?" — four close-ups where the pretty one is wrong, teaching
 * NEAT ≠ CORRECT. Completion: consequences reviewed + the approval call made.
 *
 * Accessibility: every choice is a labeled button (no color-only state, no
 * drag); verdicts are announced; targets ≥44dp.
 */
import { useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import type { CiModuleProps } from '../registry';

const CONSEQUENCES: { id: string; title: string; body: string }[] = [
  { id: 'safety', title: 'SAFETY', body: 'Trip hazards, damaged power cables, falling cable, obstructed access — cable placed wrong hurts people first.' },
  { id: 'reliability', title: 'RELIABILITY', body: 'Poor strain relief, excessive stress and damaged connectors become the intermittent faults that eat entire days.' },
  { id: 'signal', title: 'SIGNAL INTEGRITY', body: 'Interference exposure, deformed twisted pairs, over-bent fiber and careless routing all degrade the thing the cable exists to carry.' },
  { id: 'service', title: 'SERVICEABILITY', body: 'Technicians must identify, trace, disconnect, replace and troubleshoot — dressing decides whether that takes minutes or a shift.' },
  { id: 'mech', title: 'MECHANICAL PROTECTION', body: 'Abrasion, pinch points, crush and unsupported weight damage cable invisibly, from the inside out.' },
  { id: 'work', title: 'PROFESSIONAL WORKMANSHIP', body: 'An installation should be organized, understandable and maintainable — by someone who has never seen it before.' },
];

type ExampleId = 'a' | 'b' | 'c' | 'd';

const EXAMPLES: { id: ExampleId; name: string; caption: string; verdictRule: string; verdict: 'good' | 'bad'; short: string }[] = [
  {
    id: 'a',
    name: 'A — THE SHOWPIECE',
    caption: 'Beautifully symmetrical bundle — cinched so hard the cables have gone oval.',
    verdict: 'bad',
    verdictRule: 'mech-restraint-tension',
    short: 'Gorgeous — and the over-tight restraints are deforming every cable in the loom.',
  },
  {
    id: 'b',
    name: 'B — THE PROFESSIONAL',
    caption: 'Less photogenic: gentle bends, labeled ends, supported weight, reachable connectors.',
    verdict: 'good',
    verdictRule: 'rack-not-max-tight',
    short: 'Approve it. Supported, serviceable, honest geometry — this is what correct looks like.',
  },
  {
    id: 'c',
    name: 'C — THE PILE',
    caption: 'Unsecured cable heaped where it fell.',
    verdict: 'bad',
    verdictRule: 'sup-purpose-built',
    short: 'Nothing is supported, nothing is traceable — this isn\'t an installation yet.',
  },
  {
    id: 'd',
    name: 'D — THE BLOCKADE',
    caption: 'A tidy loom dressed straight across the ventilation grille and the service panel.',
    verdict: 'bad',
    verdictRule: 'rack-airflow',
    short: 'Neat — and it blocks cooling and service access. Tidy in the wrong place is still wrong.',
  },
];

/** Tiny honest close-up per example (training visualization). */
function ExampleArt({ id, w }: { id: ExampleId; w: number }) {
  const h = 74;
  const vb = 160;
  const common = { width: w, height: h, viewBox: `0 0 ${vb} 74` } as const;
  if (id === 'a') {
    return (
      <Svg {...common}>
        <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
        {[18, 30, 42, 54].map((y) => (
          <Path key={y} d={`M8 ${y} H152`} stroke="#4fd0e0" strokeWidth={5} strokeLinecap="round" />
        ))}
        {[40, 80, 120].map((x) => (
          <G key={x} x={x} />
        ))}
        {[40, 80, 120].map((x) => (
          <Path key={x} d={`M${x} 10 v54`} stroke="#e8e8ea" strokeWidth={3} />
        ))}
        {/* deformation at ties */}
        {[40, 80, 120].map((x) => (
          <Path key={`d${x}`} d={`M${x - 7} 36 q7 -7 14 0 q-7 7 -14 0`} fill="none" stroke="#ff9b8f" strokeWidth={1.4} />
        ))}
      </Svg>
    );
  }
  if (id === 'b') {
    return (
      <Svg {...common}>
        <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
        <Path d="M10 16 H96 C118 16 118 30 118 38 v20" stroke="#4fd0e0" strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <Path d="M10 28 H88 C110 28 112 40 112 46 v12" stroke="#37d97b" strokeWidth={4.5} fill="none" strokeLinecap="round" />
        {/* supports */}
        {[36, 72].map((x) => (
          <Path key={x} d={`M${x} 8 v6 a7 7 0 0 0 14 0`} stroke="#6f7378" strokeWidth={1.8} fill="none" />
        ))}
        {/* labels */}
        <Rect x={120} y={40} width={14} height={7} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={0.8} />
        <Rect x={114} y={52} width={14} height={7} rx={1.5} fill="#26262c" stroke="#6f7378" strokeWidth={0.8} />
      </Svg>
    );
  }
  if (id === 'c') {
    return (
      <Svg {...common}>
        <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
        <Path d="M14 60 C30 30 44 66 58 44 C70 26 84 66 98 48 C110 34 124 62 146 40" stroke="#4fd0e0" strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M20 64 C40 44 52 70 70 54 C88 40 100 68 120 52 C132 44 140 58 150 52" stroke="#37d97b" strokeWidth={4} fill="none" strokeLinecap="round" />
        <Line x1={10} y1={68} x2={150} y2={68} stroke="#2c2c33" strokeWidth={2} />
      </Svg>
    );
  }
  return (
    <Svg {...common}>
      <Rect x={0} y={0} width={vb} height={74} rx={8} fill="#101014" />
      {/* equipment face with vent + service panel */}
      <Rect x={96} y={10} width={54} height={54} rx={4} fill="#17171c" stroke="#3a3c42" strokeWidth={1.4} />
      {[18, 24, 30, 36].map((y) => (
        <Line key={y} x1={104} y1={y} x2={142} y2={y} stroke="#3a3c42" strokeWidth={2} />
      ))}
      <Rect x={104} y={44} width={38} height={14} rx={2} fill="#101014" stroke="#3a3c42" strokeWidth={1} />
      {/* neat loom straight across the vent + panel */}
      <Path d="M8 26 H150" stroke="#ffd35e" strokeWidth={5} strokeLinecap="round" />
      <Path d="M8 50 H150" stroke="#ffd35e" strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}

// react-native-svg has no <G x> shorthand — placeholder to keep tree valid.
function G(_p: { x: number }) {
  return null;
}

export function WhyScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [seen, setSeen] = useState<Set<string>>(() => new Set(completed ? CONSEQUENCES.map((c) => c.id) : []));
  const [open, setOpen] = useState<string | null>(null);
  const [pick, setPick] = useState<ExampleId | null>(completed ? 'b' : null);
  const [fired, setFired] = useState(completed);

  const consequencesDone = seen.size >= CONSEQUENCES.length;
  const artW = Math.max(120, width - 28);

  const choose = (id: ExampleId) => {
    if (pick != null) return;
    setPick(id);
    const right = id === 'b';
    AccessibilityInfo.announceForAccessibility(right ? 'Approved — correct call.' : 'Not the one a professional approves.');
    if (consequencesDone && !fired) {
      setFired(true);
      announceComplete('Stage 1 complete.');
      onComplete({ workmanship: right ? 100 : 60, serviceability: right ? 90 : 60 });
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <CiSection title="SIX THINGS RIDING ON EVERY RUN — TAP EACH">
        <View style={{ gap: 8 }}>
          {CONSEQUENCES.map((c) => {
            const isOpen = open === c.id;
            const isSeen = seen.has(c.id);
            return (
              <Pressable
                key={c.id}
                style={[styles.conseq, isSeen && styles.conseqSeen]}
                onPress={() => {
                  setOpen(isOpen ? null : c.id);
                  setSeen((s) => new Set(s).add(c.id));
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${c.title}${isSeen ? ', reviewed' : ''}`}
              >
                <Text style={[styles.conseqTitle, isSeen && { color: colors.green }]}>
                  {isSeen ? '✓ ' : ''}
                  {c.title}
                </Text>
                {isOpen ? <Text style={styles.conseqBody}>{c.body}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </CiSection>

      <CiSection title="WHICH INSTALLATION WOULD YOU APPROVE?">
        <Text style={styles.lead}>
          Four close-ups from the same job. Only one earns a professional sign-off — and it isn\'t the prettiest.
        </Text>
        <View style={{ gap: 10 }}>
          {EXAMPLES.map((ex) => {
            const picked = pick === ex.id;
            const revealed = pick != null;
            return (
              <View key={ex.id} style={[styles.example, picked && styles.examplePicked]}>
                <Pressable
                  onPress={() => choose(ex.id)}
                  disabled={revealed}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked, disabled: revealed }}
                  accessibilityLabel={`${ex.name}. ${ex.caption}${revealed ? (ex.verdict === 'good' ? '. This is the correct approval.' : '. Not approvable.') : ''}`}
                  style={{ gap: 8 }}
                >
                  <Text style={styles.exampleName}>{ex.name}</Text>
                  <ExampleArt id={ex.id} w={artW} />
                  <Text style={styles.exampleCaption}>{ex.caption}</Text>
                </Pressable>
                {revealed ? <RuleFeedback ruleId={ex.verdictRule} verdict={ex.verdict} short={ex.short} openSources={openSources} /> : null}
              </View>
            );
          })}
        </View>
        {pick != null ? (
          <View style={styles.lessonCard}>
            <Text style={styles.lessonHead}>NEAT ≠ CORRECT</Text>
            <Text style={styles.lessonBody}>
              A professional installation must simultaneously satisfy safety, performance, mechanical requirements,
              serviceability, documentation and workmanship. Appearance is a byproduct of doing those six right — never a
              substitute for them.
            </Text>
            {!consequencesDone ? (
              <Text style={styles.pendingNote}>Review all six consequences above to complete this stage.</Text>
            ) : null}
          </View>
        ) : null}
        {pick != null && consequencesDone && !fired ? (
          <Pressable
            style={styles.finishBtn}
            onPress={() => {
              setFired(true);
              announceComplete('Stage 1 complete.');
              onComplete({ workmanship: pick === 'b' ? 100 : 60, serviceability: pick === 'b' ? 90 : 60 });
            }}
            accessibilityRole="button"
            accessibilityLabel="Complete stage one"
          >
            <Text style={styles.finishText}>MARK STAGE COMPLETE ✓</Text>
          </Pressable>
        ) : null}
      </CiSection>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  conseq: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 11, paddingHorizontal: 12, gap: 6 },
  conseqSeen: { borderColor: 'rgba(55,224,95,.35)' },
  conseqTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2, color: colors.textSecondary },
  conseqBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSub },
  example: { gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  examplePicked: { borderColor: 'rgba(255,198,77,.6)' },
  exampleName: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.amberLabel },
  exampleCaption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  pendingNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.amberLabel },
  finishBtn: { alignItems: 'center', borderRadius: 10, backgroundColor: colors.green, paddingVertical: 13 },
  finishText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.2, color: '#0a1a0f' },
});
