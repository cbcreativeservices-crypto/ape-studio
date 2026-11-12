/**
 * A verified INSTRUCTOR's code for students (R1 + H2, 2026-10-27).
 *
 * Drawn by EmployerSection only when my_verifier_kind() = 'instructor'.
 * instructor_my_code() makes the 8-character code on its first call and
 * answers null for anyone who is not an active instructor, so an employer
 * never gets one even if this were drawn by mistake. Students type it in
 * Profile → MY INSTRUCTOR to share their progress.
 *
 * YOUR STUDENTS › (must-do E3, 2026-11-07) opens the class: drawn only once
 * the code has loaded, i.e. once the server confirmed an ACTIVE instructor.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { fetchMyInstructorCode } from '../../features/instructor/api';
import { CLASS_COPY } from '../../features/instructor/classRules';
import { useLatchedPress } from '../../lib/latch';
import { colors, fonts } from '../../theme/tokens';

export function InstructorCodeRow() {
  const navigation = useNavigation() as unknown as { navigate: (route: string) => void };
  const [code, setCode] = useState<string | null | 'error' | 'loading'>('loading');
  const [note, setNote] = useState<string | null>(null);

  // Newest read wins, and nothing lands after unmount (pattern P11).
  const ticket = useRef(0);
  useEffect(() => () => void ++ticket.current, []);
  const load = useCallback(async () => {
    const mine = ++ticket.current;
    setCode('loading');
    const got = await fetchMyInstructorCode();
    if (mine === ticket.current) setCode(got);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const onShare = useLatchedPress(async () => {
    if (typeof code !== 'string' || code === 'error' || code === 'loading') return;
    try {
      await Share.share({
        message: `My Pro Audio Training Academy instructor code is ${code}. In the app, open Profile → MY INSTRUCTOR and enter it to share your progress with me.`,
      });
      setNote(null);
    } catch {
      setNote(`Couldn’t open sharing. Read the code out instead: ${code}`);
    }
  });

  const onRetry = useLatchedPress(load);

  if (code === null) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>YOUR INSTRUCTOR CODE</Text>
      {code === 'loading' ? (
        <Text style={styles.body}>Loading…</Text>
      ) : code === 'error' ? (
        <>
          <Text style={styles.warn}>Couldn’t load your code just now. Check your connection.</Text>
          <Pressable onPress={onRetry} style={styles.link} accessibilityRole="button" accessibilityLabel="Try loading your instructor code again">
            <Text style={styles.linkText}>TRY AGAIN ›</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text selectable style={styles.code} accessibilityLabel={`Your instructor code: ${code.split('').join(' ')}`}>
            {code}
          </Text>
          <Text style={styles.body}>
            Give this code to students who want to share their progress with you. They enter it in
            Profile → MY INSTRUCTOR, and they can stop sharing at any time.
          </Text>
          <Pressable onPress={onShare} style={styles.link} accessibilityRole="button" accessibilityLabel="Share your instructor code">
            <Text style={styles.linkText}>SHARE MY CODE ›</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('InstructorStudents')}
            style={styles.students}
            accessibilityRole="button"
            accessibilityLabel={CLASS_COPY.entryA11y}
          >
            <Text style={styles.studentsText}>{CLASS_COPY.entry}</Text>
            <Text style={styles.studentsSub}>{CLASS_COPY.entrySub}</Text>
          </Pressable>
        </>
      )}
      {note ? <Text style={styles.warn}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.hairlineDim, paddingTop: 10 },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.textSub },
  code: { fontFamily: fonts.oswaldSemiBold, fontSize: 26, letterSpacing: 4, color: '#ffffff' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  warn: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#ffb060' },
  link: { paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  students: {
    minHeight: 56,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,0.45)',
    backgroundColor: 'rgba(255,198,77,0.06)',
  },
  studentsText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.amber },
  studentsSub: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
