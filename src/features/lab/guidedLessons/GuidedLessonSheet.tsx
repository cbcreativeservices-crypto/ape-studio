/**
 * GuidedLessonSheet + GuidedLessonBody — the ONE reusable renderer for the
 * Guided-Lesson stack (v4 MASTER §5): Definition · (control ranges) · Formula ·
 * Common mistakes · Pro tips. Every lab and control renders through this, so the
 * content authored once in content.ts lights up everywhere consistently.
 *
 * - GuidedLessonBody: the sections, for inline use (e.g. a lab's Learn mode).
 * - GuidedLessonSheet: the same body in a slide-up modal, opened by a long-press
 *   or ⓘ on any control. Pass `controlKey` to focus one control.
 *
 * Honesty: this is instructional content only — it never claims a live
 * measurement and never renders a meter.
 */
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { LabLesson } from './types';

/** A titled block of bullet lines. */
function BulletBlock({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (!items.length) return null;
  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, accent && styles.blockTitleAccent]}>{title}</Text>
      {items.map((line, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bulletDot, accent && styles.bulletDotAccent]}>•</Text>
          <Text style={styles.bulletText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

/** The lesson sections. When `controlKey` matches a control with authored
 *  detail, that control is featured first; the lab-level mistakes/tips/formula
 *  always follow (they apply across the lab). */
export function GuidedLessonBody({ lesson, controlKey }: { lesson: LabLesson; controlKey?: string }) {
  const control = controlKey ? lesson.controls.find((c) => c.key === controlKey) : undefined;

  return (
    <View style={styles.body}>
      {control ? (
        // FOCUSED CONTROL — definition + range/default + practical.
        <View style={styles.block}>
          <Text style={styles.controlName}>
            {control.name}
            {control.advanced ? <Text style={styles.advancedTag}>  ADVANCED</Text> : null}
          </Text>
          {control.range ? <Text style={styles.controlRange}>{control.range}</Text> : null}
          {control.definition ? <Text style={styles.paragraph}>{control.definition}</Text> : null}
          {control.practical ? <Text style={styles.paragraph}>{control.practical}</Text> : null}
        </View>
      ) : (
        // WHOLE LAB — what it is + the control roster.
        <>
          <View style={styles.block}>
            <Text style={styles.paragraph}>{lesson.whatItIs}</Text>
          </View>
          {lesson.controls.length ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>CONTROLS</Text>
              {lesson.controls.map((c) => (
                <View key={c.key} style={styles.controlRow}>
                  <Text style={styles.controlRowName}>
                    {c.name}
                    {c.advanced ? <Text style={styles.advancedTag}>  ADV</Text> : null}
                  </Text>
                  {c.range ? <Text style={styles.controlRowRange}>{c.range}</Text> : null}
                  {c.definition ? <Text style={styles.controlRowDef}>{c.definition}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}

      {/* The mandatory element — always present. */}
      <BulletBlock title="COMMON MISTAKES" items={lesson.commonMistakes} accent />
      <BulletBlock title="PRO TIPS" items={lesson.proTips} />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>FORMULA / CONCEPT</Text>
        <Text style={styles.formula}>{lesson.formula}</Text>
      </View>
    </View>
  );
}

/** Slide-up modal wrapper — long-press / ⓘ any control to open. */
export function GuidedLessonSheet({
  visible,
  lesson,
  controlKey,
  onClose,
}: {
  visible: boolean;
  lesson: LabLesson;
  controlKey?: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const control = controlKey ? lesson.controls.find((c) => c.key === controlKey) : undefined;
  const heading = control ? control.name : lesson.name;
  const sub = control ? `${lesson.name} · Guided Lesson` : (lesson.tagline ?? 'Guided Lesson');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Close guided lesson" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{heading}</Text>
              <Text style={styles.sheetSub}>{sub}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <GuidedLessonBody lesson={lesson} controlKey={controlKey} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const CARD_BG = '#131316';
const CARD_BORDER = '#26262c';

const styles = StyleSheet.create({
  body: { gap: 14 },
  block: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  blockTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSecondary },
  blockTitleAccent: { color: colors.amber },
  paragraph: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  // Focused-control header
  controlName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.4, color: colors.textPrimary },
  controlRange: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.amber, marginBottom: 2 },
  advancedTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1, color: colors.textSub },

  // Control roster (whole-lab view)
  controlRow: { gap: 1, paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#20202a' },
  controlRowName: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textPrimary },
  controlRowRange: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.amber },
  controlRowDef: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  // Bullet blocks
  bulletRow: { flexDirection: 'row', gap: 7 },
  bulletDot: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSub },
  bulletDotAccent: { color: colors.amber },
  bulletText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },

  formula: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },

  // Modal chrome
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  backdropTap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.screenBg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#3a3a42', marginBottom: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 12 },
  sheetTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 0.6, color: colors.textPrimary },
  sheetSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSub, paddingHorizontal: 4 },
  sheetScroll: { paddingBottom: 20, gap: 14 },
});
