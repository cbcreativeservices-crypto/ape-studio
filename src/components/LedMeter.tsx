/**
 * LedMeter — 21-segment sequential progress meter (design-reference
 * LedMeter.dc.html + seed brief §1). Positional segment colors:
 * 0–10 green · 11–14 yellow · 15–17 orange · 18–19 light-red · 20 dark-red.
 * F-7 (r7): at 100% every segment stays lit in its OWN positional color —
 * never recolored uniform red. Recessed housing, 2px gaps.
 * (The 4-level per-segment brightness sub-states land with the study
 * screens' animation in M4; the meter renders integer fills here.)
 */
import { Platform, StyleSheet, View } from 'react-native';

const SEG_COUNT = 21;

function colorFor(i: number): string {
  if (i <= 10) return '#00ff44';
  if (i <= 14) return '#ffff33';
  if (i <= 17) return '#ff8844';
  if (i <= 19) return '#ff4444';
  return '#cc0000';
}

export function LedMeter({
  filled,
  segWidth,
  fullWidth = false,
  vertical = false,
}: {
  filled: number;
  /** Fixed per-segment width → the meter self-sizes (compact panel mode). */
  segWidth?: number;
  /** Fill 100% of the parent (panel mode, Booth 2026-07-10 #7 — the meter's
   *  edges align with the title readout's edges). Taller raised blocks. */
  fullWidth?: boolean;
  /** Vertical VU column that fills UPWARD — the lowest (green) segment lights
   *  first, climbing to red at the top (owner 2026-08-01). Self-sizes. */
  vertical?: boolean;
}) {
  const f = Math.max(0, Math.min(SEG_COUNT, Math.round(filled)));
  return (
    <View
      style={[
        styles.housing,
        vertical && styles.housingVert,
        !vertical && segWidth != null && styles.housingCompact,
        !vertical && fullWidth && styles.housingFull,
      ]}
    >
      {Array.from({ length: SEG_COUNT }, (_, i) => {
        const lit = i < f;
        const c = colorFor(i);
        return (
          <View
            key={i}
            style={[
              vertical
                ? styles.segVert
                : segWidth != null
                  ? { width: segWidth, height: 10, borderRadius: 1 }
                  : fullWidth
                    ? styles.segFull
                    : styles.seg,
              // Raised physical LED block (Booth 2026-07-10): beveled edges —
              // lit top-left, shadowed bottom-right — like a bar you could
              // feel standing proud of the housing (reference: VU/PPM meter).
              styles.seg3d,
              lit
                ? [
                    { backgroundColor: c },
                    Platform.OS === 'ios' && {
                      // CRISP glow — tight radius, no camera-lens fuzz.
                      shadowColor: c,
                      shadowOpacity: 0.85,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]
                : styles.segOff,
            ]}
          />
        );
      })}
    </View>
  );
}

/** The meter mounted in the SAME recessed panel well as the Dashboard study
 *  method containers (Booth 2026-07-11) — so every screen's meter matches. */
export function LedMeterWell({ filled }: { filled: number }) {
  return (
    <View style={styles.well}>
      <LedMeter filled={filled} fullWidth />
    </View>
  );
}

/** Convert a 0–100 pct to a segment fill. */
export function segmentsForPct(pct: number): number {
  return Math.round((Math.max(0, Math.min(100, pct)) / 100) * SEG_COUNT);
}

const styles = StyleSheet.create({
  // Default now matches the Dashboard study-method meter (Booth 2026-07-11):
  // full-width stretched housing + taller 10px raised blocks, app-wide.
  // Wrapped in a small BLACK PLASTIC BEVEL (user request 2026-07-22): a raised
  // molded frame — top/left edges catch light, bottom/right fall into shadow.
  housing: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: 4,
    paddingHorizontal: 5,
    backgroundColor: '#080808',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopColor: '#3a3a3a',
    borderLeftColor: '#2b2b2b',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
    borderRadius: 5,
    flexDirection: 'row',
    gap: 2,
  },
  housingCompact: { width: 'auto', alignSelf: 'flex-start' },
  housingFull: { width: '100%', alignSelf: 'stretch' },
  // Vertical VU column — stack bottom→top so segment 0 (green) sits at the
  // bottom and the fill climbs upward. Self-sizes to its 21 blocks.
  //
  // Re-light the FRAME for a tall column (owner 2026-08-01): the base housing's
  // heavy dark RIGHT border dominates a narrow vertical meter and reads as a
  // side light — mismatching the top-lit horizontal meters below. Override so
  // the TOP lip catches the light and the BOTTOM falls into shadow, with the two
  // long side edges near-symmetric, so the column reads lit from ABOVE like the
  // rest.
  housingVert: {
    width: 'auto',
    height: 'auto',
    alignSelf: 'center',
    flexDirection: 'column-reverse',
    borderTopWidth: 2,
    borderTopColor: '#474748',
    borderBottomWidth: 2.5,
    borderBottomColor: '#000000',
    borderLeftWidth: 1.5,
    borderLeftColor: '#303032',
    borderRightWidth: 1.5,
    borderRightColor: '#161617',
  },
  segVert: { width: 16, height: 7, borderRadius: 1 },
  segFull: { flex: 1, height: 10, borderRadius: 1 },
  seg: { flex: 1, height: 10, borderRadius: 1 },
  // Bevel that makes each segment a raised block: light catches the top-left
  // edge, the bottom-right falls into shadow.
  seg3d: {
    borderWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderLeftColor: 'rgba(255,255,255,0.22)',
    borderBottomColor: 'rgba(0,0,0,0.55)',
    borderRightColor: 'rgba(0,0,0,0.3)',
  },
  // Unlit = gray physical blocks (reference photo), not near-invisible.
  segOff: { backgroundColor: '#3b3c3e' },
  // Recessed panel well (matches the Dashboard method container cutout).
  well: {
    alignSelf: 'stretch',
    backgroundColor: '#0b0b0d',
    padding: 2.5,
    borderRadius: 3,
    borderTopWidth: 2.5,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightWidth: 1,
    borderTopColor: '#000000',
    borderLeftColor: '#000000',
    borderBottomColor: 'rgba(255,255,255,0.14)',
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
});
