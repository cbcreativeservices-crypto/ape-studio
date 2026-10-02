/**
 * LabEndScreen — the shared "what's left" END SCREEN every lab finishes on
 * (owner 2026-09-29).
 *
 *   Owner hard rule: "Labs NEVER block navigation; every lab ends with a
 *   'what's left' screen."
 *   Owner rule 2026-09-29: "always keep credit and progress for users, but
 *   always allow them to review and redo labs for practice (without losing any
 *   previous credit)."
 *
 * Before this, a dozen labs ended on a dead end: PagedLab's FINISH just went
 * back, the module hosts greyed NEXT out on the last module, Foundations and
 * Mic Selection's DONE ✓ just went back, and the section-chip labs had no end
 * at all. Each now opens THIS, in flow (the host swaps it in for its body — no
 * route, no bottom sheet), modelled on the three good examples: the Cable
 * Fundamentals final step (what's-left list with jump links), the Cable
 * Install completion (banked vs this run; REPEAT never removes credit) and
 * the Sound Systems hub.
 *
 * What it draws (the words come from labEnd.ts, which is unit-tested):
 *   • LAB COMPLETE when everything is banked, otherwise WHAT'S LEFT;
 *   • every unit still to do, by name, each a jump link straight to it;
 *   • the banked units collapsed under "✓ CREDITED · n" (tap to review any);
 *   • PRACTISE AGAIN (from the start — never clears anything) and DONE, both
 *     always enabled.
 *
 * Nothing here auto-appears (Low-Light Production Mode): it only ever renders
 * because the learner pressed FINISH / DONE / the WHAT'S LEFT chip, and it has
 * no timers or entrance animation. Text ≥ 9 pt at 390 wide (smallest is 10).
 */
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { GlassButton } from '../../../components/GlassButton';
import { isGuestTier } from '../../../features/commercial/tier';
import { useTier } from '../../../features/commercial/useTier';
import { useLabPreview } from '../../../features/lab/labPreviewStore';
import { sessionCarryOpen } from '../../../features/lab/sessionCarry';
import { endLead, endTitle, whatsLeft, type LabEndRow, type LabEndUnit } from './labEnd';
import { LabNextButton, claimLabLeave } from './LabNavBar';

export type { LabEndUnit } from './labEnd';

/**
 * Should the end screen talk as if nothing is saved? A signed-out guest (house
 * guest rule, owner 2026-08-12) or a members-only preview (PREVIEW EARNS
 * NOTHING, 2026-09-01). The tier is a TRI-STATE (features/commercial/tier,
 * closer A5 of the 2026-10-02 pattern catalog): the entitlement provider
 * boots at 'anonymous', and `isGuestTier` is false while the answer is still
 * unknown, so a signed-in learner is never told otherwise.
 */
export function useLabEndGuest(): boolean {
  return isGuestTier(useTier());
}

export function LabEndScreen({
  labTitle,
  units,
  cleared,
  mode,
  noun = 'module',
  onJump,
  onPracticeAgain,
  onDone,
  doneLabel = 'DONE · BACK TO LABS',
  guest,
  bottomInset,
  extra,
  completeTitle,
}: {
  labTitle: string;
  /** Every unit of the lab, in lab order (checks last). */
  units: readonly LabEndUnit[];
  /** Unit ids already banked (credit) or done (progress). Never mutated. */
  cleared: ReadonlySet<string>;
  /** 'credit' = a certificate-credit lab (rows read CREDITED);
   *  'progress' = a lab that only remembers progress on this device (DONE). */
  mode: 'credit' | 'progress';
  /** What one unit is called in the lead line: module / page / section / step. */
  noun?: string;
  /** Jump straight to a unit (the host leaves the end screen and opens it). */
  onJump: (id: string) => void;
  /** Start the lab again from the first unit — must NOT clear any credit. */
  onPracticeAgain: () => void;
  /** Leave the lab. Always enabled. */
  onDone: () => void;
  doneLabel?: string;
  /** Override the guest reading (tests / hosts that already know). */
  guest?: boolean;
  /** Extra bottom padding when the host has no footer below this. */
  bottomInset?: boolean;
  /** ADDITIVE (Start Here, 2026-09-29): host content under the lead line and
   *  above the what's-left list — the beginner lab's "choose what's next". */
  extra?: ReactNode;
  /** ADDITIVE: the title when nothing is left, for a host that is not a
   *  "lab" to its learner (Start Here reads YOU'RE READY). */
  completeTitle?: string;
}) {
  const insets = useSafeAreaInsets();
  const autoGuest = useLabEndGuest();
  const isGuest = guest ?? autoGuest;
  // A members-only preview is told it earns nothing; a signed-out guest that
  // signing in before closing the app keeps the work (owner 2026-10-01).
  const inPreview = useLabPreview().active;
  const w = whatsLeft(units, cleared);
  const title = w.complete && completeTitle ? completeTitle : endTitle(w);
  const [showCredited, setShowCredited] = useState(false);
  // ONE exit (bug pass 2026-09-30): a double tap on DONE ran the host's
  // goBack() twice and popped a second screen (Amp, Tuning, Mic Selection,
  // Tube, Mic Principles, Speaker Coverage, every PagedLab).
  // A time window, not a one-way latch, so a host whose DONE does not leave
  // (it just changes page) still works on the next deliberate tap.
  // The window is SHARED with the header ‹ (claimLabLeave, night pass 2
  // 2026-10-01): ‹ + DONE together popped two screens.
  const done = () => {
    if (!claimLabLeave()) return;
    onDone();
  };
  // A guest banks nothing to an account, so their rows never read CREDITED.
  const tag = mode === 'credit' && !isGuest ? 'CREDITED' : 'DONE';

  const row = (r: LabEndRow, dim: boolean) => (
    <Pressable
      key={r.id}
      onPress={() => onJump(r.id)}
      style={[styles.row, dim && styles.rowDim]}
      accessibilityRole="button"
      accessibilityLabel={`${r.kind === 'check' ? '' : `${noun} ${r.num}, `}${r.label}${r.credited ? `, ${tag.toLowerCase()}` : ''}. ${r.detail ?? ''} Opens it.`}
    >
      <Text style={[styles.rowNum, r.kind === 'check' && styles.rowNumCheck]}>
        {r.kind === 'check' ? 'CHECK' : String(r.num).padStart(2, '0')}
      </Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowLabel} numberOfLines={2}>
          {r.label}
        </Text>
        {r.detail ? <Text style={styles.rowDetail}>{r.detail}</Text> : null}
      </View>
      {r.credited ? <Text style={styles.rowTag}>✓ {tag}</Text> : null}
      <Text style={styles.rowGo}>›</Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, readingColumn, bottomInset && { paddingBottom: insets.bottom + 28 }]}
    >
      <Text style={styles.kicker}>{labTitle.toUpperCase()}</Text>
      <Text style={[styles.title, w.complete && { color: colors.green }]} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.lead}>{endLead(w, { mode, noun, guest: isGuest, preview: inPreview, carry: sessionCarryOpen() })}</Text>
      {extra}

      {w.left.length > 0 ? (
        <View style={styles.list} accessibilityLabel={`${w.left.length} still to do`}>
          {w.left.map((r) => row(r, false))}
        </View>
      ) : null}

      {w.credited.length > 0 ? (
        <>
          <Pressable
            onPress={() => setShowCredited((v) => !v)}
            style={styles.creditedHead}
            accessibilityRole="button"
            accessibilityState={{ expanded: showCredited }}
            aria-expanded={showCredited}
            accessibilityLabel={`${w.credited.length} ${tag.toLowerCase()}. ${showCredited ? 'Hide' : 'Show'} them to review`}
          >
            <Text style={styles.creditedText}>
              ✓ {tag} · {w.credited.length} OF {w.total}
            </Text>
            <Text style={styles.creditedToggle}>{showCredited ? 'HIDE ▴' : 'REVIEW ▾'}</Text>
          </Pressable>
          {showCredited ? <View style={styles.list}>{w.credited.map((r) => row(r, true))}</View> : null}
        </>
      ) : null}

      <View style={styles.actions}>
        <GlassButton label="PRACTISE AGAIN FROM THE START" tint="gold" height={46} fontSize={12.5} onPress={onPracticeAgain} />
        <GlassButton label={doneLabel} tint="green" height={46} fontSize={12.5} onPress={done} />
      </View>
      <Text style={styles.note}>
        {isGuest
          ? 'Practising again, reviewing and leaving are always open.'
          : mode === 'credit'
            ? 'Practising again or reviewing never removes credit you have already earned.'
            : 'Practising again or reviewing never clears what you have already done.'}
      </Text>
    </ScrollView>
  );
}

/**
 * The in-flow way to the end screen for labs whose sections are chips rather
 * than a NEXT sequence (Tube, Mic Principles, Speaker Coverage) and for a last
 * module whose own button is held (Amp's Module 8): a plain, always-enabled
 * FINISH link at the bottom of the last section (owner 2026-09-29).
 */
export function LabEndLink({ onPress, label = 'FINISH · SEE WHAT’S LEFT ›' }: { onPress: () => void; label?: string }) {
  // The shared in-flow NEXT / FINISH (kit/LabNavBar, 2026-09-30) — same look,
  // same 48 pt, same a11y label; this export stays for its current callers.
  return <LabNextButton onPress={onPress} label={label} />;
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingTop: 12, paddingBottom: 30, gap: 12 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.6 },
  title: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 24, letterSpacing: 1.6 },
  lead: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  list: { borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#141416',
    borderTopWidth: 1,
    borderTopColor: '#1d1d21',
  },
  rowDim: { opacity: 0.7 },
  rowNum: { width: 40, color: colors.amber, fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1 },
  rowNumCheck: { color: colors.cyanBright, fontSize: 10 },
  rowLabel: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 18 },
  rowDetail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  rowTag: { color: colors.green, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },
  rowGo: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
  creditedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.35)',
    backgroundColor: '#0f1d14',
  },
  creditedText: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  creditedToggle: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  actions: { gap: 8, marginTop: 6 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
