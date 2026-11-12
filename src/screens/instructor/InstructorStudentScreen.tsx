/**
 * One student's progress, as their instructor sees it (must-do E3).
 *
 * Owner rulings (2026-10-04, 2026-10-26): topic status, % per study method per
 * topic, best score, each quiz attempt's score and date (NEVER the answers),
 * labs, final exams, credentials. Topics = enrolled + studied + every
 * completed topic, including before sharing. Labs = the certificate labs of
 * the enrolled topics + the Audio Fundamentals labs; any other finished lab is
 * listed apart under "Other labs completed".
 *
 * Progress shows what was DONE, by count and by name, never "N of total"
 * (owner 2026-10-29). Quiz scores are counts of right answers, printed alone
 * (the server does not send how many questions were served).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useLatchedPress } from '../../lib/latch';
import { LedMeter, segmentsForPct } from '../../components/LedMeter';
import { MethodIcon, type MethodKey } from '../../components/MethodIcon';
import { fitValue } from '../../theme/legibility';
import { fonts } from '../../theme/tokens';
import { fetchStudentProgress, type StudentState } from '../../features/instructor/classApi';
import {
  bestScoreText,
  CLASS_COPY,
  credentialKind,
  dayText,
  finalExamScore,
  labsByArea,
  quizScoreText,
  topicsByFace,
  type LabRow,
  type StudentProgress,
  type TopicRow,
} from '../../features/instructor/classRules';
import {
  FailedFace,
  IC,
  InstructorHeader,
  LoadingFace,
  NeverShown,
  ReadoutWindow,
  SampleStamp,
  SectionHead,
  st as bits,
} from './instructorBits';

const METHOD_KEYS: readonly string[] = ['flashcards', 'fill_in_blank', 'matching', 'scenarios', 'quiz', 'glossary'];

export function InstructorStudentScreen() {
  const route = useRoute();
  const params = (route.params ?? {}) as { shareId?: string; name?: string };
  const shareId = typeof params.shareId === 'string' ? params.shareId : '';
  const [read, setRead] = useState<StudentState | 'loading'>('loading');

  // Newest read wins, and nothing lands after unmount (pattern P11).
  const ticket = useRef(0);
  const load = useCallback(async () => {
    const mine = ++ticket.current;
    setRead('loading');
    const got = shareId ? await fetchStudentProgress(shareId) : ({ state: 'gone' } as const);
    if (mine === ticket.current) setRead(got);
  }, [shareId]);
  useEffect(() => {
    void load();
    return () => void ++ticket.current;
  }, [load]);
  const onRetry = useLatchedPress(load);

  const p = typeof read === 'object' && read.state === 'ready' ? read.progress : null;
  const name = p?.name ?? params.name ?? 'Student';

  return (
    <View style={bits.root}>
      <InstructorHeader
        eyebrow="STUDENT PROGRESS"
        title={name}
        sub={p ? <Text style={s.since}>{CLASS_COPY.sharedSince(dayText(p.sharedSince))}</Text> : null}
      />
      <ScrollView contentContainerStyle={s.body}>
        <SampleStamp />
        {read === 'loading' ? (
          <LoadingFace label={CLASS_COPY.loadingStudent} />
        ) : read.state === 'error' ? (
          <FailedFace text={CLASS_COPY.studentFailed} onRetry={onRetry} />
        ) : read.state === 'gone' ? (
          <FailedFace title={CLASS_COPY.goneTitle} text={CLASS_COPY.goneBody} />
        ) : (
          <Progress p={read.progress} />
        )}
        {p ? <NeverShown /> : null}
      </ScrollView>
    </View>
  );
}

function Progress({ p }: { p: StudentProgress }) {
  const open = p.topics.filter((t) => t.face !== 'complete').length;
  const done = p.topics.filter((t) => t.face === 'complete').length;
  const groups = topicsByFace(p.topics);
  const labGroups = labsByArea(p.labs);
  return (
    <View>
      <ReadoutWindow
        style={s.summary}
        items={[
          { value: done, label: done === 1 ? 'TOPIC DONE' : 'TOPICS DONE' },
          { value: open, label: 'IN PROGRESS' },
          // The topics' labs only, the same count the class list shows; other
          // finished labs keep their own line below.
          { value: p.labsComplete, label: p.labsComplete === 1 ? 'LAB DONE' : 'LABS DONE' },
          { value: p.credentials.length, label: p.credentials.length === 1 ? 'CREDENTIAL' : 'CREDENTIALS' },
        ]}
      />

      {groups.length === 0 ? (
        <>
          <SectionHead>{CLASS_COPY.topicsHead}</SectionHead>
          <Text style={s.empty}>{CLASS_COPY.topicsEmpty}</Text>
        </>
      ) : (
        groups.map((g) => (
          <View key={g.face}>
            <SectionHead>{g.head}</SectionHead>
            <View style={s.stack}>
              {g.topics.map((t) => (
                <TopicCard key={t.id} t={t} />
              ))}
            </View>
          </View>
        ))
      )}

      <SectionHead right={labCountText(p.labsComplete)} note={CLASS_COPY.labsNote}>
        {CLASS_COPY.labsHead}
      </SectionHead>
      {labGroups.length === 0 ? (
        <Text style={s.empty}>{CLASS_COPY.labsEmpty}</Text>
      ) : (
        <View style={s.stack}>
          {labGroups.map((g) => (
            <View key={g.area} style={s.labPanel}>
              <View style={s.labAreaRow}>
                <Text style={s.labArea}>{g.name.toUpperCase()}</Text>
                {g.done.length ? <Text style={s.labAreaCount}>{labCountText(g.done.length)}</Text> : null}
              </View>
              {g.done.map((l) => (
                <LabLine key={l.name} l={l} />
              ))}
              {g.notYet.map((l) => (
                <LabLine key={l.name} l={l} />
              ))}
            </View>
          ))}
        </View>
      )}

      {p.otherLabs.length ? (
        <>
          <SectionHead right={labCountText(p.otherLabs.length)}>{CLASS_COPY.otherLabsHead}</SectionHead>
          <View style={s.labPanel}>
            {p.otherLabs.map((l) => (
              <LabLine key={l.name} l={l} />
            ))}
          </View>
        </>
      ) : null}

      <SectionHead>{CLASS_COPY.finalsHead}</SectionHead>
      {p.finalExams.length === 0 ? (
        <Text style={s.empty}>{CLASS_COPY.finalsEmpty}</Text>
      ) : (
        <View style={s.labPanel}>
          {p.finalExams.map((f) => (
            <View key={`${f.number}-${f.submittedAt}`} style={s.examRow}>
              <Text style={s.examNo}>ATTEMPT {f.number}</Text>
              <Text style={s.examScore} {...fitValue(17)}>
                {finalExamScore(f)}
              </Text>
              <Text style={[s.tag, f.passed ? s.tagPass : s.tagMuted]}>{f.passed ? CLASS_COPY.passed : CLASS_COPY.notPassed}</Text>
              <Text style={s.date}>{dayText(f.submittedAt)}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionHead>{CLASS_COPY.credsHead}</SectionHead>
      {p.credentials.length === 0 ? (
        <Text style={s.empty}>{CLASS_COPY.credsEmpty}</Text>
      ) : (
        <View style={s.stack}>
          {p.credentials.map((c) => (
            <View key={`${c.type}-${c.name}-${c.earnedAt}`} style={s.cred}>
              <Text style={s.credKind}>{credentialKind(c.type)}</Text>
              <Text style={s.credName}>{c.name}</Text>
              <Text style={s.date}>Earned {dayText(c.earnedAt)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const labCountText = (n: number) => `${n} done`;

function LabLine({ l }: { l: LabRow }) {
  const done = !!l.completedAt;
  return (
    <View style={s.labLine} accessible accessibilityLabel={done ? `${l.name}, completed ${dayText(l.completedAt)}` : `${l.name}, ${CLASS_COPY.notYet.toLowerCase()}`}>
      <View style={[s.tick, done ? s.tickOn : s.tickOff]}>{done ? <Text style={s.tickMark}>✓</Text> : null}</View>
      <Text style={[s.labName, !done && s.labNameOff]}>{l.name}</Text>
      <Text style={[s.date, !done && s.dateOff]}>{done ? dayText(l.completedAt) : CLASS_COPY.notYet}</Text>
    </View>
  );
}

function TopicCard({ t }: { t: TopicRow }) {
  const [open, setOpen] = useState(t.face === 'studying');
  const status =
    t.face === 'complete'
      ? CLASS_COPY.completeOn(dayText(t.completedAt))
      : t.face === 'studying'
        ? CLASS_COPY.studying
        : CLASS_COPY.notStarted;
  const tone = t.face === 'complete' ? s.tagPass : t.face === 'studying' ? s.tagStudy : s.tagMuted;
  const hasDetail = t.methods.length > 0 || t.attempts.length > 0;
  return (
    <View style={s.topic}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        disabled={!hasDetail}
        style={({ pressed }) => [s.topicHead, pressed && bits.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${t.name}. ${status.toLowerCase()}. Study ${t.studyPct}%. ${bestScoreText(t)}`}
      >
        <View style={s.topicText}>
          <Text style={[s.tag, tone]}>{status}</Text>
          <Text style={s.topicName}>{t.name}</Text>
          {t.subject ? <Text style={s.topicSub}>{t.subject}</Text> : null}
        </View>
        <View style={s.topicNums}>
          <Text style={[s.studyPct, t.studyPct === 0 && s.studyPctZero]} {...fitValue(22)}>
            {t.studyPct}%
          </Text>
          <Text style={s.studyLbl}>STUDY</Text>
        </View>
      </Pressable>
      <View style={s.topicFoot}>
        <Text style={s.best}>{bestScoreText(t)}</Text>
        {hasDetail ? <Text style={s.more}>{open ? 'LESS ▴' : 'DETAILS ▾'}</Text> : null}
      </View>
      {open && hasDetail ? (
        <View style={s.detail}>
          {t.methods.length ? (
            <>
              <Text style={s.detailHead}>{CLASS_COPY.methodsHead}</Text>
              {t.methods.map((m) => (
                <View key={m.key} style={s.method}>
                  {METHOD_KEYS.includes(m.key) ? (
                    <MethodIcon method={m.key as MethodKey} size={26} off={m.pct === 0} />
                  ) : (
                    <View style={{ width: 26 }} />
                  )}
                  <Text style={s.methodName}>{m.name}</Text>
                  <View style={s.meter}>
                    <LedMeter
                      filled={segmentsForPct(m.pct)}
                      segWidth={4}
                      segHeight={9}
                      midi
                      a11yLabel={`${m.name}, ${m.pct}% complete`}
                      a11yPct={m.pct}
                    />
                  </View>
                  <Text style={s.methodPct} {...fitValue(13)}>
                    {m.pct}%
                  </Text>
                </View>
              ))}
            </>
          ) : null}
          {t.attempts.length ? (
            <>
              <Text style={[s.detailHead, { marginTop: 12 }]}>{CLASS_COPY.attemptsHead}</Text>
              {t.attempts.map((a) => (
                <View key={`${a.number}-${a.submittedAt}`} style={s.attempt}>
                  <Text style={s.attemptNo}>#{a.number}</Text>
                  <Text style={s.attemptScore}>{quizScoreText(a.score) ?? '—'}</Text>
                  {a.practice ? <Text style={[s.tag, s.tagMuted, s.practice]}>{CLASS_COPY.practice}</Text> : null}
                  <Text style={[s.date, s.attemptDate]}>{dayText(a.submittedAt)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 48 },
  since: { fontFamily: fonts.mono, fontSize: 12, color: IC.muted, marginTop: 2 },
  summary: { marginTop: 16 },
  stack: { gap: 10 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: IC.muted },
  topic: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IC.panelEdge,
    borderTopColor: '#2f3037',
    backgroundColor: IC.panel,
    overflow: 'hidden',
  },
  topicHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, paddingBottom: 8 },
  topicText: { flex: 1, gap: 5 },
  topicName: { fontFamily: fonts.barlowSemiBold, fontSize: 16.5, lineHeight: 21, color: IC.text },
  topicSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: IC.muted },
  topicNums: {
    minWidth: 64,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IC.wellEdge,
    borderTopColor: '#000',
    backgroundColor: IC.well,
  },
  studyPct: { fontFamily: fonts.mono, fontSize: 22, lineHeight: 26, color: IC.amber },
  studyPctZero: { color: '#4d4e55' },
  studyLbl: { fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.3, color: IC.sub },
  topicFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  best: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: '#cfd0d6' },
  more: { fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, color: IC.amber },
  detail: {
    borderTopWidth: 1,
    borderTopColor: '#202127',
    backgroundColor: '#0f0f12',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
  },
  detailHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: IC.sub },
  method: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodName: { width: 92, fontFamily: fonts.barlowMedium, fontSize: 13.5, color: '#d9dae0' },
  meter: { flex: 1, alignItems: 'flex-start' },
  methodPct: { width: 42, textAlign: 'right', fontFamily: fonts.mono, fontSize: 13, color: IC.text },
  attempt: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 26 },
  attemptNo: { width: 28, fontFamily: fonts.mono, fontSize: 12.5, color: IC.muted },
  attemptScore: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: IC.text },
  attemptDate: { marginLeft: 'auto' },
  practice: { marginLeft: 2 },
  tag: {
    alignSelf: 'flex-start',
    fontFamily: fonts.oswaldMedium,
    fontSize: 10.5,
    letterSpacing: 1.1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tagPass: { color: IC.green, borderColor: 'rgba(70,224,108,0.45)', backgroundColor: 'rgba(70,224,108,0.07)' },
  tagStudy: { color: IC.amber, borderColor: 'rgba(255,198,77,0.45)', backgroundColor: 'rgba(255,198,77,0.07)' },
  tagMuted: { color: IC.sub, borderColor: '#3a3b42', backgroundColor: 'transparent' },
  labPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IC.panelEdge,
    backgroundColor: IC.panel,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  labAreaRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 6 },
  labArea: { fontFamily: fonts.barlowCondensedSemiBold, fontSize: 13.5, letterSpacing: 1.3, color: IC.text },
  labAreaCount: { fontFamily: fonts.mono, fontSize: 12, color: IC.green },
  labLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1d1e23',
  },
  tick: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tickOn: { borderColor: IC.green, backgroundColor: 'rgba(70,224,108,0.14)' },
  tickOff: { borderColor: '#3d3e45' },
  tickMark: { fontSize: 11, lineHeight: 13, color: IC.green, fontFamily: fonts.barlowSemiBold },
  labName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 19, color: IC.text },
  labNameOff: { color: IC.muted, fontFamily: fonts.barlowRegular },
  date: { fontFamily: fonts.mono, fontSize: 12, color: IC.sub },
  dateOff: { color: '#64656c' },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1d1e23',
  },
  examNo: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.1, color: IC.sub, width: 76 },
  examScore: { fontFamily: fonts.mono, fontSize: 17, color: IC.text, minWidth: 64 },
  cred: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,194,51,0.42)',
    backgroundColor: 'rgba(255,194,51,0.05)',
    gap: 4,
  },
  credKind: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.8, color: '#ffc233' },
  credName: { fontFamily: fonts.barlowSemiBold, fontSize: 16.5, lineHeight: 21, color: IC.text },
});
