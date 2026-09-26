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
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { Appear, Stagger } from '../motion';
import type { CiModuleProps } from '../registry';
import { ExampleArt, WHY_ASPECT, type ExampleId } from './whyArt';

const CONSEQUENCES: { id: string; title: string; body: string }[] = [
  { id: 'safety', title: 'SAFETY', body: 'Trip hazards, damaged power cables, falling cable, obstructed access — cable placed wrong hurts people first.' },
  { id: 'reliability', title: 'RELIABILITY', body: 'Poor strain relief, excessive stress and damaged connectors become the intermittent faults that eat entire days.' },
  { id: 'signal', title: 'SIGNAL INTEGRITY', body: 'Interference exposure, deformed twisted pairs, over-bent fiber and careless routing all degrade the thing the cable exists to carry.' },
  { id: 'service', title: 'SERVICEABILITY', body: 'Technicians must identify, trace, disconnect, replace and troubleshoot — dressing decides whether that takes minutes or a shift.' },
  { id: 'mech', title: 'MECHANICAL PROTECTION', body: 'Abrasion, pinch points, crush and unsupported weight damage cable invisibly, from the inside out.' },
  { id: 'work', title: 'PROFESSIONAL WORKMANSHIP', body: 'An installation should be organized, understandable and maintainable — by someone who has never seen it before.' },
];

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

export function WhyScene({ width, completed, onComplete, openSources }: CiModuleProps) {
  const [seen, setSeen] = useState<Set<string>>(() => new Set(completed ? CONSEQUENCES.map((c) => c.id) : []));
  const [open, setOpen] = useState<string | null>(null);
  const [pick, setPick] = useState<ExampleId | null>(completed ? 'b' : null);
  // Scored on the FIRST pick; the stage now ENDS on approving the right one
  // (learning pass 2026-08-31 — it used to say "Stage 1 complete." right after
  // telling you your approval was wrong).
  const [firstPick, setFirstPick] = useState<ExampleId | null>(completed ? 'b' : null);
  const [fired, setFired] = useState(completed);

  const consequencesDone = seen.size >= CONSEQUENCES.length;
  // Cables draw themselves in once the cards are mounted (one beat after mount
  // so the first paint is the empty rack, then the install happens).
  const [artRun, setArtRun] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setArtRun(true), 120);
    return () => clearTimeout(id);
  }, []);
  const artW = Math.max(120, width - 28);

  const choose = (id: ExampleId) => {
    if (pick === 'b') return; // approved — done
    if (firstPick == null) setFirstPick(id);
    setPick(id);
    const right = id === 'b';
    AccessibilityInfo.announceForAccessibility(right ? 'Approved — correct call.' : 'Not the one a professional approves.');
    if (right && consequencesDone && !fired) {
      const scoredRight = (firstPick ?? id) === 'b';
      setFired(true);
      announceComplete('Stage 1 complete.');
      onComplete({ workmanship: scoredRight ? 100 : 60, serviceability: scoredRight ? 90 : 60 });
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <CiSection title="SIX THINGS RIDING ON EVERY RUN — TAP EACH">
        <View style={{ gap: 8 }}>
          {CONSEQUENCES.map((c, ci) => {
            const isOpen = open === c.id;
            const isSeen = seen.has(c.id);
            return (
              <Stagger key={c.id} index={ci}>
              <Pressable
                style={[styles.conseq, isSeen && styles.conseqSeen]}
                onPress={() => {
                  setOpen(isOpen ? null : c.id);
                  setSeen((s) => new Set(s).add(c.id));
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                aria-expanded={isOpen}
                accessibilityLabel={`${c.title}${isSeen ? ', reviewed' : ''}`}
              >
                <Text style={[styles.conseqTitle, isSeen && { color: colors.green }]}>
                  {isSeen ? '✓ ' : ''}
                  {c.title}
                </Text>
                {isOpen ? <Text style={styles.conseqBody}>{c.body}</Text> : null}
              </Pressable>
              </Stagger>
            );
          })}
        </View>
      </CiSection>

      <CiSection title="WHICH INSTALLATION WOULD YOU APPROVE?">
        <Text style={styles.lead}>
          Four closeups from the same job site. Only one earns a professional sign-off — and it isn’t the prettiest.
        </Text>
        <View style={{ gap: 10 }}>
          {EXAMPLES.map((ex) => {
            const picked = pick === ex.id;
            const revealed = pick != null;
            // After a wrong reveal only the correct install stays tappable.
            const locked = revealed && (pick === 'b' || ex.id !== 'b');
            return (
              <View key={ex.id} style={[styles.example, picked && styles.examplePicked]}>
                {/* Tap the name, the drawing or the caption to approve. The
                    FULL SCREEN button sits OUTSIDE the choosing press targets —
                    nested inside one, its click also approved the example. */}
                <Pressable
                  onPress={() => choose(ex.id)}
                  disabled={locked}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked, disabled: locked }}
                  aria-pressed={picked}
                  aria-disabled={locked}
                  accessibilityLabel={`${ex.name}. ${ex.caption}${revealed ? (ex.verdict === 'good' ? '. This is the correct approval.' : '. Not approvable.') : ''}`}
                >
                  <Text style={styles.exampleName}>{ex.name}</Text>
                </Pressable>
                <ExpandableFigure
                  width={artW}
                  aspect={WHY_ASPECT}
                  title={`CLOSE-UP ${ex.id.toUpperCase()}`}
                  render={(fw, fh) =>
                    fw === artW ? (
                      <Pressable onPress={() => choose(ex.id)} disabled={locked} accessible={false}>
                        <ExampleArt id={ex.id} w={fw} h={fh} run={artRun} revealed={revealed} />
                      </Pressable>
                    ) : (
                      <ExampleArt id={ex.id} w={fw} h={fh} run={artRun} revealed={revealed} />
                    )
                  }
                  controls={
                    <Pressable
                      onPress={() => choose(ex.id)}
                      disabled={locked}
                      style={[styles.fsApprove, locked && { opacity: 0.45 }]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: locked }}
                      accessibilityLabel={`Approve ${ex.name}`}
                    >
                      <Text style={styles.fsApproveText}>
                        {picked ? (ex.verdict === 'good' ? '✓ APPROVED' : '✕ NOT APPROVABLE') : `APPROVE ${ex.id.toUpperCase()}`}
                      </Text>
                    </Pressable>
                  }
                />
                <Pressable onPress={() => choose(ex.id)} disabled={locked} accessible={false}>
                  <Text style={styles.exampleCaption}>{ex.caption}</Text>
                </Pressable>
                {revealed ? (
                  <Appear>
                    <RuleFeedback ruleId={ex.verdictRule} verdict={ex.verdict} short={ex.short} openSources={openSources} />
                  </Appear>
                ) : null}
              </View>
            );
          })}
        </View>
        {pick != null ? (
          <Appear delay={120}>
          <View style={styles.lessonCard}>
            <Text style={styles.lessonHead}>NEAT ≠ CORRECT</Text>
            <Text style={styles.lessonBody}>
              A professional installation must simultaneously satisfy safety, performance, mechanical requirements,
              serviceability, documentation and workmanship. Appearance is a byproduct of doing those six right — never a
              substitute for them.
            </Text>
            {/* Says what it COSTS, not what it forbids. NEXT works regardless
                (owner 2026-09-20) — the learner was getting stuck here with no
                visible way on, which is the opposite of a lab. */}
            {!consequencesDone ? (
              <Text style={styles.pendingNote}>
                Open all six consequences above to earn credit for this stage. You can move on without them and come
                back — the completion screen tracks what is left.
              </Text>
            ) : null}
            {pick != null && pick !== 'b' ? (
              <Text style={styles.pendingNote}>Now approve the one that earns sign-off.</Text>
            ) : null}
          </View>
          </Appear>
        ) : null}
        {pick === 'b' && consequencesDone && !fired ? (
          <Pressable
            style={styles.finishBtn}
            onPress={() => {
              setFired(true);
              announceComplete('Stage 1 complete.');
              onComplete({ workmanship: firstPick === 'b' ? 100 : 60, serviceability: firstPick === 'b' ? 90 : 60 });
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
  fsApprove: { alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.6)', backgroundColor: '#1a1710', paddingHorizontal: 16 },
  fsApproveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.amber },
  finishBtn: { alignItems: 'center', borderRadius: 10, backgroundColor: colors.green, paddingVertical: 13 },
  finishText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.2, color: '#0a1a0f' },
});
