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
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
// expo-image (perf hunt 2026-10-03): memory + disk cache and off-thread decode,
// so a photo seen once paints at once on every later page and lightbox.
import { Image } from 'expo-image';
import { Modal } from '../../components/DimModal';
import { SUPABASE_URL } from '../../lib/env';
import { CARD_MAX_W } from '../../theme/readingColumn';

const BUCKET = `${SUPABASE_URL}/storage/v1/object/public/glossary-images`;

/** Public bucket URL for a `glossary-images` filename (e.g. "subwoofer.webp"). */
export function labPhotoUrl(file: string): string {
  return `${BUCKET}/${file}`;
}

type LightboxTarget = { url: string; caption?: string };
const LightboxCtx = createContext<((t: LightboxTarget) => void) | null>(null);

/** Wrap a lab's root once. Holds the single fullscreen photo modal every
 *  <LabPhoto> inside opens on tap; tap the backdrop or ✕ to close. */
/**
 * The lightbox card is a square: 92 % of the backdrop's inner width on a
 * portrait phone (unchanged), but never taller than the window leaves room
 * for (owner 2026-09-29, tablet pass). A `width: '92%'` + `aspectRatio: 1`
 * card was a 1238 pt square on a 1024 pt-tall landscape iPad — the photo ran
 * off the top and bottom of the screen with the close ✕ over it.
 */
export function useLightboxSide(): number {
  const { width, height } = useWindowDimensions();
  // 40 = the backdrop's 20 pt padding each side; 200 = caption, close ✕ and
  // safe-area room above and below the card. 760 (the card column) stops a
  // 13-inch iPad blowing a product shot up past its own pixels.
  return Math.round(Math.max(160, Math.min((width - 40) * 0.92, height - 200, CARD_MAX_W)));
}

export function LabPhotoLightbox({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<LightboxTarget | null>(null);
  const lbSide = useLightboxSide();
  return (
    <LightboxCtx.Provider value={setTarget}>
      {children}
      <Modal accessibilityViewIsModal
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
          // ONE element that says the photo AND how to close it — the image
          // was a second element nested inside this one, unreachable on iOS
          // (APE-STUDIO-W/R/S nested-element sweep, 2026-10-08).
          accessibilityLabel={`${target?.caption ?? 'Lab photograph'}. Tap to close.`}
          onAccessibilityEscape={() => setTarget(null)}
        >
          <View style={[styles.lbCard, { width: lbSide, height: lbSide }]}>
            {target ? (
              <Image
                accessible={false}
                source={{ uri: target.url }}
                style={styles.lbImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityIgnoresInvertColors
              />
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

/** Open the shared lightbox programmatically (e.g. from a control's long-press)
 *  instead of tapping a tile. Returns a no-op if no <LabPhotoLightbox> is above
 *  in the tree. */
export function useLabPhoto(): (file: string, caption?: string) => void {
  const open = useContext(LightboxCtx);
  return useCallback(
    (file: string, caption?: string) => open?.({ url: labPhotoUrl(file), caption }),
    [open],
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
      <Image accessible
        source={{ uri: url }}
        style={styles.photo}
        contentFit="contain"
        cachePolicy="memory-disk"
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
  lbCard: { backgroundColor: '#f4f4f5', borderRadius: 14, overflow: 'hidden', padding: 10 },
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
