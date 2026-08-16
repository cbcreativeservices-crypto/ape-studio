/**
 * Lesson 9 — Handling & Inspection (owner spec §5.9).
 * Structure per the lesson01 exemplar: pure data in data/lesson09.ts, tap-only
 * interactions, tri-state verdicts (glyph + words + color), retry-until-
 * correct, and completion credit marked ONLY when the full Inspection Scene is
 * genuinely solved (markLabUnit → af_cables/l09_handling).
 *
 * Three sections: (a) correct-practice explorer, (b) the record-derived fault
 * vocabulary as a reference list, (c) the Inspection Scene — 12 judged
 * vignettes (8 faulty + 4 acceptable), each explained with its disposition.
 */
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import {
  FAULT_VOCABULARY,
  HANDLING_PRACTICES,
  L09_LESSON,
  SCENE_ITEMS,
  type SceneJudgment,
} from '../data/lesson09';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  VerdictBanner,
  lessonStyles as s,
  type Verdict,
} from './bits';

export function Lesson09Body() {
  // ── (a) correct-practice explorer ──────────────────────────────────────
  const [practiceId, setPracticeId] = useState(HANDLING_PRACTICES[0].id);
  const practice = HANDLING_PRACTICES.find((p) => p.id === practiceId);

  // ── (c) the Inspection Scene ───────────────────────────────────────────
  const [itemIdx, setItemIdx] = useState(0);
  const [picked, setPicked] = useState<SceneJudgment | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [allDone, setAllDone] = useState(false);
  const item = SCENE_ITEMS[Math.min(itemIdx, SCENE_ITEMS.length - 1)];

  const judge = useCallback(
    (opt: SceneJudgment) => {
      if (allDone || verdict === 'correct') return;
      setPicked(opt);
      setVerdict(opt === item.answer ? 'correct' : 'wrong');
    },
    [allDone, verdict, item],
  );

  const next = useCallback(() => {
    if (itemIdx >= SCENE_ITEMS.length - 1) {
      setAllDone(true);
      // Every one of the 12 judgments genuinely solved → lesson unit credit
      // (R6c honesty: marked here and nowhere else).
      markLabUnit('af_cables', 'l09_handling');
      return;
    }
    // Closure value (not a functional update) so a queued double-tap writes
    // the same index twice instead of skipping an item (sweep 2026-08-15).
    setItemIdx(itemIdx + 1);
    setPicked(null);
    setVerdict(null);
  }, [itemIdx]);

  const solvedThis = verdict === 'correct';

  return (
    <>
      <Eyebrow text="CORRECT PRACTICES" />
      <Text style={s.body}>
        Professional handling is a short list of habits applied every single time. Tap each one — together they are why
        one crew’s cable stock can be trusted and another’s cannot.
      </Text>
      <View style={s.chipWrap}>
        {HANDLING_PRACTICES.map((p) => (
          <OptionChip key={p.id} label={p.label} active={p.id === practiceId} onPress={() => setPracticeId(p.id)} />
        ))}
      </View>
      {practice ? (
        <DetailCard>
          <Text style={s.cardTitle}>{practice.title}</Text>
          <Text style={s.body}>{practice.copy}</Text>
        </DetailCard>
      ) : null}

      <Eyebrow text="THE INSPECTION EYE" />
      <Text style={s.body}>
        Faults have names. Learn the vocabulary and your eye starts finding them on its own — this is the reference list
        the Inspection Scene below draws from.
      </Text>
      <DetailCard>
        {FAULT_VOCABULARY.map((f) => (
          <View key={f.id}>
            <Text style={s.cardHead}>{f.term}</Text>
            <Text style={s.body}>{f.looksLike}</Text>
          </View>
        ))}
      </DetailCard>

      <Eyebrow text={`THE INSPECTION SCENE · ${Math.min(itemIdx + 1, SCENE_ITEMS.length)} OF ${SCENE_ITEMS.length}`} />
      {/* ART SLOT: owner-supplied illustrated inspection scene mounts here —
          a workbench of the 12 cables/connectors below, each tappable. Until
          the artwork lands, the scene runs as judged text vignettes. */}
      {!allDone ? (
        <>
          <Text style={s.body}>
            Twelve cables and connectors, described the way you would meet them. Judge each one: FAULT or OK. Faults get
            a disposition — repair by a qualified person, relabel, or remove from service.
          </Text>
          <DetailCard>
            <Text style={s.cardTitle}>{item.vignette}</Text>
            <Text style={s.hint}>Wrong judgments stay open — look again and retry.</Text>
            <View style={s.chipWrap}>
              <OptionChip
                label="FAULT"
                active={picked === 'fault'}
                onPress={() => judge('fault')}
                disabled={solvedThis && picked !== 'fault'}
              />
              <OptionChip
                label="OK"
                active={picked === 'ok'}
                onPress={() => judge('ok')}
                disabled={solvedThis && picked !== 'ok'}
              />
            </View>
          </DetailCard>
          {verdict ? <VerdictBanner verdict={verdict} text={verdict === 'wrong' ? item.nudge : item.explain} /> : null}
          {solvedThis ? (
            <OptionChip
              label={itemIdx >= SCENE_ITEMS.length - 1 ? 'FINISH INSPECTION ✓' : 'NEXT ITEM ›'}
              active
              action
              onPress={next}
            />
          ) : null}
        </>
      ) : (
        <CheckDoneBanner text="Inspection complete — all 12 judged correctly: every fault named and dispositioned, every acceptable item passed for the right reason." />
      )}

      <LessonBanner text={L09_LESSON} />
    </>
  );
}
