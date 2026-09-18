/**
 * Celebration — the ONE component that draws every celebration in the app.
 *
 * Two forms, chosen by `formFor(tier, suppressed)`:
 *
 *   'screen'  a full-screen modal over a dimmed backdrop (milestone, credential)
 *   'notice'  an inline card that sits in the flow (step, stage)
 *
 * If this file ever grows `if (id === ...)` the design has been broken: every
 * difference between celebrations belongs in `catalog.ts`.
 *
 * ── LOW-LIGHT PRODUCTION MODE ────────────────────────────────────────────────
 *
 * The standing rule is absolute: in that mode NOTHING may auto-appear or flash.
 * These are the most auto-appearing things in the app, and this app is used in
 * dark control rooms during shows — a full-screen congratulation over a live
 * console is genuinely disruptive.
 *
 * So when overlays are suppressed EVERY tier collapses to the quiet inline
 * notice, no modal is ever mounted, and no haptic fires. The achievement is
 * still recorded and the Trophy Case still updates; only the interruption is
 * withheld. That was absent from the spec and is the single most important
 * thing in this file.
 */
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { useOverlaysSuppressed } from '../dev/popupSuppressStore';
import type { CelebrationAction, CelebrationActionKind, CelebrationDef, CelebrationValues } from './types';
import { fill, formFor } from './types';

export function Celebration({
  def,
  values,
  onAction,
}: {
  def: CelebrationDef;
  values: CelebrationValues;
  /** Every button routes here; the host maps the kind to a real action. */
  onAction: (kind: CelebrationActionKind) => void;
}) {
  const suppressed = useOverlaysSuppressed();
  const form = formFor(def.tier, suppressed);
  const { height } = useWindowDimensions();

  // A success haptic for the two tiers that have earned one — never for an
  // encouragement (a quiz not passed must not buzz like a win), and never in
  // low-light, where the whole point is not to intrude.
  useEffect(() => {
    if (suppressed || def.encouragement) return;
    if (def.tier !== 'milestone' && def.tier !== 'credential') return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [def.tier, def.encouragement, suppressed]);

  const body = (
    <CelebrationBody def={def} values={values} onAction={onAction} form={form} />
  );

  if (form === 'notice') {
    return (
      <View
        style={[styles.notice, def.encouragement && styles.noticeEncouragement]}
        accessibilityRole="summary"
        accessibilityLiveRegion="polite"
      >
        {body}
      </View>
    );
  }

  return (
    <Modal accessibilityViewIsModal visible transparent animationType="fade" statusBarTranslucent
      onRequestClose={() => onAction('dismiss')}
    >
      <View style={styles.backdrop}>
        <View style={[styles.screenCard, { maxHeight: height * 0.86 }]}>
          <ScrollView contentContainerStyle={styles.screenBody} showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CelebrationBody({
  def,
  values,
  onAction,
  form,
}: {
  def: CelebrationDef;
  values: CelebrationValues;
  onAction: (kind: CelebrationActionKind) => void;
  form: 'notice' | 'screen';
}) {
  const accent = def.encouragement ? colors.amberLabel : colors.green;
  const subject = def.subject ? fill(def.subject, values) : '';
  const stat = def.stat ? fill(def.stat, values) : '';
  const title = fill(def.title, values);

  return (
    <>
      {def.kicker ? (
        <Text style={[styles.kicker, { color: accent }, form === 'notice' && styles.kickerSm]}>
          {def.kicker}
        </Text>
      ) : null}

      <Text style={[styles.title, form === 'notice' && styles.titleSm]}>{title}</Text>

      {/* An interpolated value can come back empty — a subject line with nothing
          in it must not leave a blank gap where a name should be. */}
      {subject ? (
        <Text style={[styles.subject, form === 'notice' && styles.subjectSm]}>{subject}</Text>
      ) : null}

      {stat ? <Text style={[styles.stat, { color: accent }]}>{stat}</Text> : null}

      {def.body.map((p) => {
        const text = fill(p, values);
        return text ? (
          <Text key={p.slice(0, 28)} style={[styles.body, form === 'notice' && styles.bodySm]}>
            {text}
          </Text>
        ) : null;
      })}

      <View style={form === 'notice' ? styles.actionsRow : styles.actionsCol}>
        {def.actions.map((a) => (
          <ActionButton key={a.kind + a.label} action={a} accent={accent} onPress={() => onAction(a.kind)} />
        ))}
      </View>
    </>
  );
}

function ActionButton({
  action,
  accent,
  onPress,
}: {
  action: CelebrationAction;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        action.primary ? { borderColor: accent, backgroundColor: `${accent}1f` } : styles.btnSecondary,
        pressed && styles.btnPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <Text style={[styles.btnText, action.primary ? { color: accent } : styles.btnTextSecondary]}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── the quiet inline form ────────────────────────────────────────────────
  notice: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: '#2a2d31',
    borderLeftColor: colors.green,
    backgroundColor: '#141518',
    padding: 14,
    gap: 6,
  },
  noticeEncouragement: { borderLeftColor: colors.amberLabel },

  // ── the full-screen form ─────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,8,10,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  screenCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#17181a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2d31',
    overflow: 'hidden',
  },
  screenBody: { padding: 22, gap: 10, alignItems: 'center' },

  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, textAlign: 'center' },
  kickerSm: { fontSize: 11, letterSpacing: 1.1, textAlign: 'left' },
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 21,
    lineHeight: 27,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleSm: { fontSize: 14, lineHeight: 19, textAlign: 'left' },
  subject: {
    fontFamily: fonts.barlowMedium,
    fontSize: 15.5,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subjectSm: { fontSize: 13, lineHeight: 18, textAlign: 'left' },
  stat: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.8, textAlign: 'center', marginTop: 2 },
  body: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bodySm: { fontSize: 12.5, lineHeight: 18, textAlign: 'left' },

  actionsCol: { width: '100%', gap: 9, marginTop: 10 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  btn: {
    borderRadius: 9,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexGrow: 1,
  },
  btnSecondary: { borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#141414' },
  btnPressed: { opacity: 0.72 },
  btnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, textAlign: 'center' },
  btnTextSecondary: { color: colors.textSecondary },
});
