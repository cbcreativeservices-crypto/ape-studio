/**
 * labPhoto — a reusable reference-PHOTO tile + tap-to-enlarge lightbox for the
 * labs (owner 2026-08-18, generalizing the Mic Selection lab's MicVisual /
 * MicPhotoLightbox pattern). Same public `glossary-images` bucket the flashcard
 * term photos and the Cable Lab use — nothing bundled, nothing gated (the bucket
 * is public read; access control lives at the TOPIC gate only).
 *
 * The product shots are on seamless white, so the tile is a light rounded card
 * (#f4f4f5) that reads as intentional on the dark lab UI. Every tile is tappable
 * and opens the big photo in one shared fullscreen modal — wrap a lab's root in
 * <LabPhotoLightbox> once, then use <LabPhoto file="…"> anywhere inside it.
 *
 * This is for IDENTIFICATION photos ("what this device looks like"): it does NOT
 * replace a lab's functional visualizations (live graphs, meters, coverage maps,
 * interactive controls) — those stay code-drawn. Callers pass only verified
 * bucket filenames; an absent LabPhotoLightbox just makes the tile non-tappable.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SUPABASE_URL } from '../../lib/env';

const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/glossary-images`;

/** Public bucket URL for a `glossary-images` filename (e.g. "subwoofer.webp"). */
export function labPhotoUrl(file: string): string {
  return `${BUCKET}/${file}`;
}

type LightboxTarget = { url: string; caption?: string };
const LightboxCtx = createContext<((t: LightboxTarget) => void) | null>(null);

/** Wrap a lab's root once. Holds the single fullscreen photo modal every
 *  <LabPhoto> inside opens on tap; tap the backdrop or ✕ to close. */
export function LabPhotoLightbox({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  return (
    <LightboxCtx.Provider value={setTarget}>
      {children}
      <Modal
        visible={!!target}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setTarget(null)}
      >
        <Pressable
          style={styles.lbBackdrop}
          onPress={() => setTarget(null)}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
        >
          <View style={styles.lbCard}>
            {target ? (
              <Image source={{ uri: target.url }} style={styles.lbImage} resizeMode="contain" accessibilityIgnoresInvertColors />
            ) : null}
          </View>
          {target?.caption ? <Text style={styles.lbCaption}>{target.caption}</Text> : null}
          <View style={styles.lbClose} pointerEvents="none">
            <Text style={styles.lbCloseX}>✕</Text>
          </View>
        </Pressable>
      </Modal>
    </LightboxCtx.Provider>
  );
}

/** A reference-photo tile. `file` is a bucket filename; `caption` (optional)
 *  shows under the enlarged photo. Tapping enlarges it when a <LabPhotoLightbox>
 *  is above in the tree (a ⤢ badge marks it zoomable). */
export function LabPhoto({
  file,
  caption,
  w,
  h,
  style,
  accessibilityLabel,
}: {
  file: string;
  caption?: string;
  w?: number;
  h?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const open = useContext(LightboxCtx);
  const url = labPhotoUrl(file);
  const sized = { width: w ?? '100%', height: h } as const;
  const tile = (
    <View style={[styles.tile, sized, style]}>
      <Image
        source={{ uri: url }}
        style={styles.photo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel={accessibilityLabel ?? caption ?? 'reference photo'}
      />
      {open ? (
        <View style={styles.zoomBadge} pointerEvents="none">
          <Text style={styles.zoomIcon}>⤢</Text>
        </View>
      ) : null}
    </View>
  );
  if (!open) return tile;
  return (
    <Pressable
      onPress={() => open({ url, caption })}
      accessibilityRole="button"
      accessibilityLabel={`Enlarge ${accessibilityLabel ?? caption ?? 'photo'}`}
    >
      {tile}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Light product-card tile — the bucket shots are seamless white.
  tile: { backgroundColor: '#f4f4f5', borderRadius: 8, overflow: 'hidden', padding: 4 },
  photo: { width: '100%', height: '100%' },
  zoomBadge: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: { color: '#fff', fontSize: 11, lineHeight: 13 },
  lbBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  lbCard: { width: '92%', aspectRatio: 1, backgroundColor: '#f4f4f5', borderRadius: 14, overflow: 'hidden', padding: 10 },
  lbImage: { width: '100%', height: '100%' },
  lbCaption: {
    marginTop: 14,
    maxWidth: '90%',
    color: '#e8e8ea',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  lbClose: { position: 'absolute', top: 44, right: 22 },
  lbCloseX: { color: '#fff', fontSize: 26, fontWeight: '700' },
});
