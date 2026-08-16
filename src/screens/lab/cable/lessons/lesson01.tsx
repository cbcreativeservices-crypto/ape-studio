/**
 * Lesson 1 — What Are We Connecting? (owner spec §5.1)
 * THE INTERACTION EXEMPLAR for all Cable Lab lessons: data-driven from
 * data/lesson01.ts, tap-only, tri-state verdicts (glyph + words + color),
 * retry-until-correct, and completion credit marked ONLY when the whole
 * knowledge check is genuinely solved (markLabUnit → af_cables/l01).
 *
 * Teaching order per the owner spec: categories FIRST (what can travel),
 * then the source→destination pairs — no connector is named anywhere here.
 */
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import type { CarriedType } from '../cableTypes';
import { CARRIED_CATEGORIES, CARRY_PAIRS, carriedLabel, L01_LESSON } from '../data/lesson01';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  VerdictBanner,
  lessonStyles as s,
  type Verdict,
} from './bits';

export function Lesson01Body() {
  // ── category explorer ──────────────────────────────────────────────────
  const [cat, setCat] = useState<CarriedType>('mic_level');
  const selected = CARRIED_CATEGORIES.find((c) => c.id === cat);

  // ── source→destination exercise ────────────────────────────────────────
  const [pairIdx, setPairIdx] = useState(0);
  const [picked, setPicked] = useState<CarriedType | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [allDone, setAllDone] = useState(false);
  const pair = CARRY_PAIRS[Math.min(pairIdx, CARRY_PAIRS.length - 1)];

  const pick = useCallback(
    (opt: CarriedType) => {
      if (allDone || verdict === 'correct' || verdict === 'accepted') return;
      setPicked(opt);
      if (opt === pair.correct) setVerdict('correct');
      else if (pair.accept?.includes(opt)) setVerdict('accepted');
      else setVerdict('wrong');
    },
    [allDone, verdict, pair],
  );

  const next = useCallback(() => {
    if (pairIdx >= CARRY_PAIRS.length - 1) {
      setAllDone(true);
      // Genuine solve of the full check → lesson unit credit (R6c honesty:
      // marked here and nowhere else).
      markLabUnit('af_cables', 'l01_what_travels');
      return;
    }
    // Closure value (not a functional update) so a queued double-tap writes
    // the same index twice instead of skipping an item (sweep 2026-08-15).
    setPairIdx(pairIdx + 1);
    setPicked(null);
    setVerdict(null);
  }, [pairIdx]);

  const solvedThis = verdict === 'correct' || verdict === 'accepted';

  return (
    <>
      <PrincipleBanner />

      <Eyebrow text="WHAT CAN TRAVEL THROUGH A CABLE?" />
      <Text style={s.body}>
        Twelve different things ride cables in an audio system. Tap each one — these categories, not connector shapes, are
        how professionals think about a connection.
      </Text>
      <View style={s.chipWrap}>
        {CARRIED_CATEGORIES.map((c) => (
          <OptionChip key={c.id} label={c.label} active={c.id === cat} onPress={() => setCat(c.id)} />
        ))}
      </View>
      {selected ? (
        <DetailCard>
          <Text style={s.cardTitle}>{selected.label}</Text>
          <Text style={s.body}>{selected.blurb}</Text>
        </DetailCard>
      ) : null}

      <Eyebrow text={`WHAT MUST TRAVEL HERE? · ${Math.min(pairIdx + 1, CARRY_PAIRS.length)} OF ${CARRY_PAIRS.length}`} />
      {!allDone ? (
        <>
          <DetailCard>
            <Text style={s.cardTitle}>{`${pair.from}  →  ${pair.to}`}</Text>
            <Text style={s.hint}>Pick what has to travel between them. Wrong picks stay open — keep trying.</Text>
            <View style={s.chipWrap}>
              {pair.options.map((opt) => (
                <OptionChip
                  key={opt}
                  label={carriedLabel(opt)}
                  active={picked === opt}
                  onPress={() => pick(opt)}
                  disabled={solvedThis && picked !== opt}
                />
              ))}
            </View>
          </DetailCard>
          {verdict ? <VerdictBanner verdict={verdict} text={verdict === 'wrong' ? 'Think about the LEVEL and the KIND of what leaves the source — then try again.' : pair.explain} /> : null}
          {solvedThis ? (
            <OptionChip label={pairIdx >= CARRY_PAIRS.length - 1 ? 'FINISH CHECK ✓' : 'NEXT PAIR ›'} active action onPress={next} />
          ) : null}
        </>
      ) : (
        <CheckDoneBanner text="Lesson check complete — every connection identified by WHAT travels, before any connector was named." />
      )}

      <LessonBanner text={L01_LESSON} />
    </>
  );
}
