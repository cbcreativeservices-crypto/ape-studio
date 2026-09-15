/**
 * CredentialThumb — a small framed square of a certificate/program's artwork
 * that opens LARGE (with the title underneath) on tap (owner 2026-09-14).
 *
 * Art lives in the public `course-cards` bucket, keyed by the credential slug
 * (e.g. course-cards/cert-mixing-engineer-v3.webp), loaded through the robust
 * CardArt loader (expo-image cache + retry). Renders nothing when there is no
 * slug (nothing selected), and if a slug has no art uploaded yet the frame just
 * stays dark until it does — safe during the incremental image roll-out.
 */
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CardArt } from '../../components/CardArt';
import { fonts } from '../../theme/tokens';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjgolswjggmlpeowvtxr.supabase.co';
const artUrl = (slug: string) => `${SUPABASE_URL}/storage/v1/object/public/course-cards/${slug}.webp`;

export function CredentialThumb({
  slug,
  title,
  accent,
  size = 84,
}: {
  slug: string | null | undefined;
  title: string;
  accent: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  if (!slug) return null;
  const uri = artUrl(slug);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`View the ${title} artwork`}
        style={[styles.frame, { width: size, height: size, borderColor: accent }]}
      >
        <CardArt uri={uri} style={styles.fill} imageStyle={styles.img} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <View style={styles.enlargeCol} pointerEvents="box-none">
            <View style={[styles.enlargeFrame, { borderColor: accent }]}>
              <CardArt uri={uri} style={styles.enlargeFill} imageStyle={styles.imgLg} />
              {/* Faint disclaimer on the large view (owner 2026-09-14): the art is
                  an illustrative, AI-generated depiction, not a real photograph. */}
              <View style={styles.simBadge} pointerEvents="none">
                <Text style={styles.simBadgeText}>Simulated workplace environment</Text>
              </View>
            </View>
            <Text style={styles.enlargeTitle}>{title}</Text>
            <Text style={styles.tapHint}>Tap anywhere to close</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  frame: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#0e0e0e' },
  fill: { width: '100%', height: '100%' },
  img: { borderRadius: 9 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  enlargeCol: { alignItems: 'center', width: '100%' },
  enlargeFrame: {
    width: '86%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0e0e0e',
  },
  enlargeFill: { width: '100%', height: '100%' },
  imgLg: { borderRadius: 14 },
  // Faint gray caption pinned to the bottom of the enlarged art; a soft scrim
  // keeps it legible over any image without drawing attention.
  simBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.19)',
  },
  simBadgeText: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11,
    letterSpacing: 0.4,
    fontStyle: 'italic',
    color: 'rgba(214,214,220,0.62)',
  },
  enlargeTitle: {
    marginTop: 16,
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 18,
    letterSpacing: 0.4,
    color: '#f0f0f0',
    textAlign: 'center',
  },
  tapHint: { marginTop: 10, fontFamily: fonts.barlowRegular, fontSize: 12, color: '#8a8b93' },
});
