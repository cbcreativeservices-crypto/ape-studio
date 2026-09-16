/**
 * CredentialThumb — a small framed square of a certificate/program's artwork
 * that opens in a full-screen IMAGE VIEWER on tap (owner 2026-09-14; viewer
 * redesigned 2026-09-15).
 *
 * Art lives in the public `course-cards` bucket, keyed by the credential slug
 * (e.g. course-cards/cert-mixing-engineer-v3.webp), loaded through the robust
 * CardArt loader (expo-image cache + retry). Renders nothing when there is no
 * slug (nothing selected), and if a slug has no art uploaded yet the frame just
 * stays dark until it does — safe during the incremental image roll-out.
 *
 * CLOSE GRAMMAR (2026-09-15 — the three "close" actions on the chooser were
 * being confused): this viewer is the ONLY place on the chooser that shows a
 * ✕ glyph. It is a round chip floating on the scrim (image-viewer chrome, not
 * screen chrome) plus tap-anywhere-to-close, in the TrophyModal grammar. The
 * chooser screen itself exits via a labeled ‹ BACK, and an expanded card
 * collapses via ▴ COLLAPSE — so ✕ can only ever mean "close this image".
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardArt } from '../../components/CardArt';
import { LowLightDim } from '../../features/settings/LowLightLayer';
import { colors, fonts } from '../../theme/tokens';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjgolswjggmlpeowvtxr.supabase.co';
/** Public URL of a credential's card art in the `course-cards` bucket. Shared
 *  with the chooser rows + CredentialDetailModal (2026-09-15) so every surface
 *  resolves the SAME file for a slug. */
export const credentialArtUrl = (slug: string) => `${SUPABASE_URL}/storage/v1/object/public/course-cards/${slug}.webp`;
const artUrl = credentialArtUrl;

/** Sized against BOTH axes so landscape is governed by the height term. */
function artSize(w: number, h: number): number {
  return Math.round(Math.min(w - 40, h * 0.56, 440));
}

/** Eyebrow shown over the title in the viewer / detail popup. */
export function credentialEyebrow(kind: 'certificate' | 'program' | undefined): string | null {
  return kind === 'certificate' ? 'SPECIALIZED CERTIFICATE' : kind === 'program' ? 'PROGRAM CERTIFICATE' : null;
}

export function CredentialThumb({
  slug,
  title,
  accent,
  size = 84,
  kind,
}: {
  slug: string | null | undefined;
  title: string;
  accent: string;
  size?: number;
  /** Optional eyebrow over the title in the viewer ("SPECIALIZED CERTIFICATE"
   *  / "PROGRAM CERTIFICATE"). Omit for no eyebrow. */
  kind?: 'certificate' | 'program';
}) {
  const [open, setOpen] = useState(false);
  if (!slug) return null;
  const uri = artUrl(slug);
  const close = () => setOpen(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`View the ${title} artwork full screen`}
        hitSlop={6}
        style={({ pressed }) => [styles.frame, { width: size, height: size, borderColor: accent }, pressed && styles.framePressed]}
      >
        <CardArt uri={uri} style={styles.fill} imageStyle={styles.img} />
        {/* Corner tick: this square opens larger. Tiny, in the accent, so the
            thumb reads as an image button rather than a static badge. */}
        <View style={[styles.expandTick, { borderColor: accent }]} pointerEvents="none" />
      </Pressable>

      <CredentialArtViewer visible={open} slug={slug} title={title} accent={accent} kind={kind} onClose={close} />
    </>
  );
}

/**
 * The full-screen image viewer on its own (split out 2026-09-15 so the
 * CredentialDetailModal can open the SAME viewer from its full-bleed art head
 * without rendering a thumb). Behaviour unchanged: round ✕ chip, tap anywhere
 * to close, "Simulated workplace environment" caption.
 */
export function CredentialArtViewer({
  visible,
  slug,
  title,
  accent,
  kind,
  onClose,
}: {
  visible: boolean;
  slug: string;
  title: string;
  accent: string;
  kind?: 'certificate' | 'program';
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const uri = artUrl(slug);
  const ART = artSize(width, height);
  const eyebrow = credentialEyebrow(kind);
  const close = onClose;
  return (
    <>
      <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        {/* Full-bleed viewer: the whole scrim closes on tap (TrophyModal grammar). */}
        <Pressable
          style={styles.scrim}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={`${title} artwork. Tap to close.`}
        >
          <View style={styles.center} pointerEvents="none">
            <View style={[styles.artFrame, { width: ART, height: ART, borderColor: accent, shadowColor: accent }]}>
              <CardArt uri={uri} style={styles.fill} imageStyle={styles.imgLg} />
            </View>
            {/* Disclaimer (owner 2026-09-14): the art is an illustrative,
                AI-generated depiction, not a real photograph. Sits as a caption
                under the frame — the way a viewer credits an image — instead of
                a scrim pinned over the art. */}
            <Text style={styles.caption}>Simulated workplace environment</Text>
            <View style={styles.titleBlock}>
              {eyebrow ? <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>

          {/* The viewer's own close: a round chip floating on the scrim, inside
              the safe area — visually nothing like the chooser's header. */}
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close image"
            style={({ pressed }) => [styles.closeChip, { top: insets.top + 14, right: 18 }, pressed && styles.closeChipPressed]}
          >
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>

          <Text style={[styles.hint, { bottom: insets.bottom + 22 }]} pointerEvents="none">
            TAP ANYWHERE TO CLOSE
          </Text>
        </Pressable>
        <LowLightDim />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Thumb.
  frame: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#0e0e0e' },
  framePressed: { opacity: 0.75 },
  fill: { width: '100%', height: '100%' },
  img: { borderRadius: 9 },
  expandTick: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 9,
    height: 9,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderBottomRightRadius: 2,
    opacity: 0.9,
  },

  // Viewer.
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(6,6,8,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  center: { alignItems: 'center', width: '100%', gap: 12 },
  artFrame: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#0d0d0e',
    overflow: 'hidden',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  imgLg: { borderRadius: 14 },
  caption: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.textMutedDeep,
    textAlign: 'center',
  },
  titleBlock: { alignItems: 'center', gap: 5, marginTop: 6, paddingHorizontal: 12 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2 },
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.4,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  closeChip: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  closeChipPressed: { backgroundColor: 'rgba(255,255,255,0.22)' },
  closeGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, lineHeight: 22, color: colors.textPrimary },
  hint: {
    position: 'absolute',
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
  },
});
