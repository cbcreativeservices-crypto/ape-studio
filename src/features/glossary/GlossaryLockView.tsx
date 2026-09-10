/**
 * GlossaryLockView — the hard lock shown when a free/guest user has spent all
 * their weekly glossary lookups (owner 2026-09-10). It is a full-screen lock
 * card over a DIMMED glossary (owner: "full screen lock over a dimmed glossary"):
 * a transparent Modal with a dim backdrop, so the glossary shows through, dimmed,
 * but is fully non-interactive (the Modal captures every touch — no scrolling,
 * no search, no lists). The only ways out are "Exit to menu" or "Get Academy
 * membership". Shown both when the user hits the limit mid-session AND when a
 * locked user re-opens the Glossary from a menu. A live countdown tells them when
 * the weekly allowance resets.
 *
 * Membership removes the cap entirely; the caller returns the user to the term
 * they were last on after a successful upgrade.
 *
 * Design pass 2026-09-10 (senior-designer critique): solid amber CTA is the one
 * filled/dominant element; the reset countdown is secondary (mono readout, below
 * the title); tokens over magic hex; 48pt targets; SR labels + header role.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { GLOSSARY_WEEKLY_LIMIT } from './glossaryCap';

const AMBER = colors.amber; // academy accent (token, not a magic hex)

/** A clean padlock glyph (high-quality per the icon rule — real keyhole, not a
 *  bare line). */
function LockGlyph({ size = 46, color = AMBER }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 10V7.5a5 5 0 0 1 10 0V10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={4.5} y={10} width={15} height={10.5} rx={2.4} stroke={color} strokeWidth={1.8} />
      {/* Keyhole: a small bore + tapered stem. */}
      <Circle cx={12} cy={14.4} r={1.35} fill={color} />
      <Path d="M12 15.4 L11.4 17.6 h1.2 Z" fill={color} />
    </Svg>
  );
}

/** "3d 4h" / "5h 12m" / "8m" — coarse, human, for the on-screen readout. */
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'less than a minute';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

/** Spoken form for screen readers ("3 days 4 hours"), so "3d 4h" isn't read as
 *  "three-d four-h". */
function formatCountdownLong(ms: number): string {
  if (ms <= 0) return 'less than a minute';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.max(1, Math.floor((ms % 3600000) / 60000));
  const unit = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  if (d > 0) return `${unit(d, 'day')} ${unit(h, 'hour')}`;
  if (h > 0) return `${unit(h, 'hour')} ${unit(m, 'minute')}`;
  return unit(m, 'minute');
}

export function GlossaryLockView({
  visible,
  resetAt,
  onExit,
  onMembership,
  onExpired,
}: {
  visible: boolean;
  /** Epoch ms the weekly allowance resets (windowStart + 7 days), or null. */
  resetAt: number | null;
  onExit: () => void;
  onMembership: () => void;
  /** Fired once when the countdown reaches zero, so the caller can re-check
   *  status and lift the lock without a manual reload. */
  onExpired?: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [visible]);
  const msLeft = resetAt != null ? resetAt - now : null;
  useEffect(() => {
    if (visible && msLeft != null && msLeft <= 0) onExpired?.();
  }, [visible, msLeft, onExpired]);

  return (
    <Modal
      accessibilityViewIsModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onExit}
    >
      {/* Dim backdrop over the (still-mounted) glossary — non-dismissing: the
          only exits are the two buttons. The backdrop View captures all touches,
          so nothing beneath can be scrolled, searched, or tapped. */}
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LockGlyph />
          <Text style={styles.kicker}>PRO AUDIO GLOSSARY</Text>
          <Text style={styles.title} accessibilityRole="header">
            You’ve used this week’s lookups
          </Text>
          <Text style={styles.body}>
            You’ve used all {GLOSSARY_WEEKLY_LIMIT} of your free glossary lookups this week. Academy
            membership removes the cap — every term, every definition, always.
          </Text>

          {msLeft != null ? (
            <View
              style={styles.resetBox}
              accessible
              accessibilityLabel={`Free lookups reset in ${formatCountdownLong(msLeft)}`}
            >
              <Text style={styles.resetLabel}>FREE LOOKUPS RESET IN</Text>
              <Text style={styles.resetValue} accessibilityElementsHidden importantForAccessibility="no">
                {formatCountdown(msLeft)}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={styles.btnPrimary}
            onPress={onMembership}
            accessibilityRole="button"
            accessibilityLabel="Get Academy membership"
          >
            <Text style={styles.btnPrimaryText}>GET ACADEMY MEMBERSHIP</Text>
          </Pressable>
          <Pressable
            style={styles.btnSecondary}
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Exit to menu"
          >
            <Text style={styles.btnSecondaryText}>EXIT TO MENU</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Dim the glossary behind the lock (owner: "over a dimmed glossary"); a hard
  // lock dims harder than the app's soft PrePaywallPrompt (0.72).
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.82)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#17181a', // shared modal surface (matches PrePaywallPrompt / ToolLockUi)
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.28)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: colors.textMuted, marginTop: 2 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 21, color: colors.textPrimary, textAlign: 'center' },
  body: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
  resetBox: {
    marginTop: 2,
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(255,198,77,.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.18)',
  },
  resetLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.textMuted },
  // Mono readout (Share Tech Mono) — reads as instrumentation, and stays quieter
  // than the title so it doesn't out-shout the CTA.
  resetValue: { fontFamily: fonts.mono, fontSize: 20, color: AMBER, marginTop: 3 },
  // PRIMARY: the one SOLID element on the card, so the decision anchors here.
  btnPrimary: {
    marginTop: 6,
    alignSelf: 'stretch',
    borderRadius: 10,
    backgroundColor: AMBER,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.8, color: colors.black },
  // SECONDARY: quiet steel ghost.
  btnSecondary: {
    alignSelf: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414', // shared ghost surface (matches PrePaywallPrompt / ToolLockUi)
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.textSecondary },
});
