/**
 * YOUR STUDENTS — a verified instructor's class (must-do E3; owner "Build an
 * app screen", 2026-11-07).
 *
 * Opened from Profile → INSTRUCTOR ACCOUNT → YOUR STUDENTS, which draws only
 * once instructor_my_code() answered (an ACTIVE instructor). Every student
 * here chose to share with this instructor, for one instructor at a time, and
 * can stop at any moment. Tapping a student opens their progress.
 *
 * Three faces (house rule): loading / UNREADABLE / truly empty. A failed read
 * never reads as "no students". No "N of total" anywhere (owner 2026-10-29).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLatchedPress } from '../../lib/latch';
import { fonts } from '../../theme/tokens';
import { fetchMyClass, type ClassState } from '../../features/instructor/classApi';
import {
  CLASS_COPY,
  dayText,
  lastActiveText,
  recencyOf,
  studentReadouts,
  type ClassStudent,
} from '../../features/instructor/classRules';
import { setSampleClass, takeSampleOpen } from '../../features/instructor/sampleClass';
import {
  ActivityLamp,
  FailedFace,
  IC,
  InstructorHeader,
  LoadingFace,
  NeverShown,
  ReadoutWindow,
  SampleStamp,
  SchoolStatementDraft,
  SectionHead,
  st as bits,
} from './instructorBits';

type Nav = { navigate: (route: string, params?: Record<string, unknown>) => void };

/** "K7RM 4QX2": read aloud in two halves. Codes ignore spaces when typed. */
const grouped = (code: string) => (code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code);

export function InstructorStudentsScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const [read, setRead] = useState<ClassState | 'loading'>('loading');
  const [note, setNote] = useState<string | null>(null);

  // Newest read wins, and nothing lands after unmount (pattern P11).
  const ticket = useRef(0);
  const load = useCallback(async (quiet = false) => {
    const mine = ++ticket.current;
    if (!quiet) setRead('loading');
    const got = await fetchMyClass();
    if (mine === ticket.current) setRead(got);
  }, []);
  useEffect(() => {
    void load();
    return () => {
      ticket.current++;
      // Leaving the class turns the dev sample off (it is only ever on in __DEV__).
      setSampleClass(null);
    };
  }, [load]);

  // A student may have stopped sharing while their page was open: coming back
  // re-reads the list quietly, keeping what is on screen until it answers.
  const seen = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (seen.current) void load(true);
      seen.current = true;
      const open = takeSampleOpen();
      if (open) navigation.navigate('InstructorStudent', { shareId: open });
    }, [load, navigation]),
  );

  const onRetry = useLatchedPress(() => load());

  const code = typeof read === 'object' && read.state === 'ready' ? read.code : null;
  const onShare = useLatchedPress(async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `My Pro Audio Training Academy instructor code is ${code}. In the app, open Profile → MY INSTRUCTOR and enter it to share your progress with me.`,
      });
      setNote(null);
    } catch {
      setNote(`Couldn’t open sharing. Read the code out instead: ${code}`);
    }
  });

  const students = typeof read === 'object' && read.state === 'ready' ? read.students : [];
  const now = Date.now();

  const header = (
    <>
      <SampleStamp />
      {code ? (
        <View style={s.codePlate}>
          <View style={s.codeTop}>
            <Text style={s.codeHead}>{CLASS_COPY.codeHead}</Text>
            <Pressable
              onPress={onShare}
              hitSlop={8}
              style={({ pressed }) => [s.shareKey, pressed && bits.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Share your instructor code"
            >
              <Text style={s.shareText}>{CLASS_COPY.shareCode}</Text>
            </Pressable>
          </View>
          <Text selectable style={s.code} accessibilityLabel={`Your instructor code: ${code.split('').join(' ')}`}>
            {grouped(code)}
          </Text>
          <Text style={s.codeBody}>{CLASS_COPY.codeBody}</Text>
          {note ? <Text style={s.warn}>{note}</Text> : null}
        </View>
      ) : null}
      {read !== 'loading' && read.state === 'ready' && students.length > 0 ? (
        <SectionHead>{CLASS_COPY.listHead}</SectionHead>
      ) : null}
    </>
  );

  const footer =
    read !== 'loading' && read.state === 'ready' ? (
      <>
        <NeverShown />
        <SchoolStatementDraft />
      </>
    ) : null;

  return (
    <View style={bits.root}>
      <InstructorHeader eyebrow={CLASS_COPY.eyebrow} title={CLASS_COPY.title[0]} accent={CLASS_COPY.title[1]} />
      <FlatList
        data={students}
        keyExtractor={(x) => x.shareId}
        contentContainerStyle={s.list}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <StudentCard
            s={item}
            now={now}
            onOpen={() => navigation.navigate('InstructorStudent', { shareId: item.shareId, name: item.name })}
          />
        )}
        ListEmptyComponent={
          read === 'loading' ? (
            <LoadingFace label={CLASS_COPY.loadingClass} />
          ) : read.state === 'error' ? (
            <FailedFace text={CLASS_COPY.classFailed} onRetry={onRetry} />
          ) : read.state === 'not-instructor' ? (
            <FailedFace text={CLASS_COPY.notInstructor} />
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{CLASS_COPY.emptyTitle}</Text>
              <Text style={s.emptyBody}>{CLASS_COPY.emptyBody}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

function StudentCard({ s: x, now, onOpen }: { s: ClassStudent; now: number; onOpen: () => void }) {
  const recency = recencyOf(x.lastActivity, now);
  const active = lastActiveText(x.lastActivity, now);
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${x.name}. ${active}. Open their progress`}
    >
      <View style={s.cardTop}>
        <View style={s.cardText}>
          <Text style={s.name} numberOfLines={2}>
            {x.name}
          </Text>
          <View style={s.activeRow}>
            <ActivityLamp recency={recency} />
            <Text style={s.active}>{active}</Text>
          </View>
          <Text style={s.since}>Sharing since {dayText(x.sharedSince)}</Text>
        </View>
        <Text style={s.chev}>›</Text>
      </View>
      <ReadoutWindow items={studentReadouts(x)} style={s.window} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 48 },
  codePlate: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2b31',
    borderTopColor: '#34353c',
    backgroundColor: '#111114',
    gap: 6,
  },
  codeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.8, color: IC.sub },
  shareKey: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  shareText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: IC.amber },
  code: {
    fontFamily: fonts.mono,
    fontSize: 30,
    letterSpacing: 6,
    color: IC.amber,
    textShadowColor: 'rgba(255,198,77,0.35)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  codeBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: IC.muted },
  warn: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ffb060' },
  card: {
    padding: 14,
    paddingBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IC.panelEdge,
    borderTopColor: '#2f3037',
    backgroundColor: IC.panel,
    gap: 12,
  },
  cardPressed: { backgroundColor: '#18181c', borderColor: '#3a3b43' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.barlowSemiBold, fontSize: 18.5, lineHeight: 23, color: IC.text },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  active: { fontFamily: fonts.barlowMedium, fontSize: 13.5, color: '#cfd0d6' },
  since: { fontFamily: fonts.mono, fontSize: 11.5, letterSpacing: 0.3, color: IC.muted },
  chev: { fontFamily: fonts.oswaldMedium, fontSize: 30, color: '#5c5d65', paddingLeft: 4 },
  window: {},
  empty: {
    marginTop: 22,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#33343b',
    gap: 8,
  },
  emptyTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: IC.text },
  emptyBody: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: IC.sub },
});
