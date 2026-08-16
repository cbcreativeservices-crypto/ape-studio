/**
 * Lesson 4 — Same Plug, Different Job (owner spec §5.4)
 * The lab's major look-alike demonstration: one comparison at a time,
 * side-by-side cards for the look-alike sides (connector artwork is
 * owner-supplied — ART SLOT comments mark the mount points), a tap-only
 * INTERCHANGEABLE? call with tri-state verdicts, then the record-derived
 * why + technically honest consequence. Data lives in data/lesson04.ts;
 * every rendered fact traces to the verified connector records.
 *
 * Completion (§1.7 honesty): markLabUnit('af_cables', 'l04_same_plug') fires
 * exactly once, when the tenth comparison has been answered correctly —
 * never on view, never on mount.
 */
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { PLUG_COMPARISONS, type InterchangeAnswer } from '../data/lesson04';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  OptionChip,
  PrincipleBanner,
  VerdictBanner,
  lessonStyles as s,
  type Verdict,
} from './bits';

/** What the learner can tap. 'yes' is never the correct answer (owner spec). */
type InterchangeChoice = 'yes' | InterchangeAnswer;

const CHOICES: { id: InterchangeChoice; label: string }[] = [
  { id: 'yes', label: 'YES' },
  { id: 'no', label: 'NO' },
  { id: 'depends', label: 'IT DEPENDS' },
];

/** Misconception-correcting nudge for a wrong pick — never reveals the key. */
function wrongHint(picked: InterchangeChoice, answer: InterchangeAnswer): string {
  if (picked === 'yes') {
    return 'Fit is never the test. Behind identical shells, the cable construction, the specification, or the assigned job can differ — look again.';
  }
  return answer === 'depends'
    ? 'Look closer: is anything physically different here, or is it the same cable — with a job assignment or format that must match at both ends?'
    : 'No assignment or setting can make this swap correct — the difference is built into the cable, connector, or system itself.';
}

export function Lesson04Body() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<InterchangeChoice | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [allDone, setAllDone] = useState(false);
  const comp = PLUG_COMPARISONS[Math.min(idx, PLUG_COMPARISONS.length - 1)];

  const pick = useCallback(
    (opt: InterchangeChoice) => {
      if (allDone || verdict === 'correct') return;
      setPicked(opt);
      setVerdict(opt === comp.answer ? 'correct' : 'wrong');
    },
    [allDone, verdict, comp],
  );

  const next = useCallback(() => {
    if (idx >= PLUG_COMPARISONS.length - 1) {
      setAllDone(true);
      // Genuine solve of all ten look-alike calls → lesson unit credit
      // (§1.7 honesty: marked here and nowhere else).
      markLabUnit('af_cables', 'l04_same_plug');
      return;
    }
    // Closure value (not a functional update) so a queued double-tap writes
    // the same index twice instead of skipping an item (sweep 2026-08-15).
    setIdx(idx + 1);
    setPicked(null);
    setVerdict(null);
  }, [idx]);

  const solved = verdict === 'correct';

  return (
    <>
      <Eyebrow text={`LOOK-ALIKE ${Math.min(idx + 1, PLUG_COMPARISONS.length)} OF ${PLUG_COMPARISONS.length}`} />
      <Text style={s.body}>
        Each pair below fits where the other fits. Decide whether they are interchangeable — then see the technically
        honest result of choosing wrong.
      </Text>

      {!allDone ? (
        <>
          <View style={styles.compareRow}>
            <View style={styles.side}>
              <DetailCard>
                {/* ART SLOT: owner-supplied illustration for side A of this
                    comparison mounts here (ruling 2026-08-15) — labeled text
                    carries the comparison until it lands. */}
                <Text style={s.cardHead}>A</Text>
                <Text style={s.cardTitle}>{comp.aLabel}</Text>
              </DetailCard>
            </View>
            <View style={styles.side}>
              <DetailCard>
                {/* ART SLOT: owner-supplied illustration for side B of this
                    comparison mounts here. */}
                <Text style={s.cardHead}>B</Text>
                <Text style={s.cardTitle}>{comp.bLabel}</Text>
              </DetailCard>
            </View>
            {comp.cLabel ? (
              <View style={styles.side}>
                <DetailCard>
                  {/* ART SLOT: owner-supplied illustration for side C (TRS
                      three-way comparison only) mounts here. */}
                  <Text style={s.cardHead}>C</Text>
                  <Text style={s.cardTitle}>{comp.cLabel}</Text>
                </DetailCard>
              </View>
            ) : null}
          </View>

          <DetailCard>
            <Text style={s.cardHead}>WHY THEY LOOK ALIKE</Text>
            <Text style={s.body}>{comp.sameLooks}</Text>
            <Text style={s.cardTitle}>{comp.question}</Text>
            <Text style={s.hint}>Wrong picks stay open — keep trying.</Text>
            <View style={s.chipWrap}>
              {CHOICES.map((c) => (
                <OptionChip
                  key={c.id}
                  label={c.label}
                  active={picked === c.id}
                  onPress={() => pick(c.id)}
                  disabled={solved && picked !== c.id}
                />
              ))}
            </View>
          </DetailCard>

          {verdict && picked ? (
            <VerdictBanner verdict={verdict} text={verdict === 'correct' ? comp.why : wrongHint(picked, comp.answer)} />
          ) : null}

          {solved ? (
            <>
              <DetailCard>
                <Text style={s.cardHead}>THE HONEST RESULT OF CHOOSING WRONG</Text>
                <Text style={s.body}>{comp.consequence}</Text>
              </DetailCard>
              <OptionChip
                label={idx >= PLUG_COMPARISONS.length - 1 ? 'FINISH CHECK ✓' : 'NEXT LOOK-ALIKE ›'}
                active
                action
                onPress={next}
              />
            </>
          ) : null}
        </>
      ) : (
        <CheckDoneBanner text="All ten look-alikes called correctly — never by the shell, always by what the connection carries." />
      )}

      <PrincipleBanner />
    </>
  );
}

const styles = StyleSheet.create({
  compareRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  side: { flexBasis: 140, flexGrow: 1 },
});
