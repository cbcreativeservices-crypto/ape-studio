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
import { levelColor } from '../features/tools/levelColor';

const SEG_COUNT = 21;

function colorFor(i: number): string {
  if (i <= 10) return '#00ff44';
  if (i <= 14) return '#ffff33';
  if (i <= 17) return '#ff8844';
  if (i <= 19) return '#ff4444';
  return '#cc0000';
}

// MIDI velocity ramp (blue→red) for the whole strip — the STANDARD for the
// study-method progress meters (owner 2026-08-13). Segment 0 = blue (low), top = red.
function midiColorFor(i: number): string {
  return levelColor(i / (SEG_COUNT - 1));
}

export function LedMeter({
  filled,
  segWidth,
  segHeight,
  fullWidth = false,
  vertical = false,
  flat = false,
  midi = false,
  a11yLabel,
  a11yPct,
}: {
  filled: number;
  /** Fixed per-segment width → the meter self-sizes (compact panel mode). */
  segWidth?: number;
  /** Override the horizontal segment height (default 10) — the Dashboard's
   *  scaled rack passes its RACK_SCALE-derived height (owner 2026-08-11). */
  segHeight?: number;
  /** Fill 100% of the parent (panel mode, Booth 2026-07-10 #7 — the meter's
   *  edges align with the title readout's edges). Taller raised blocks. */
  fullWidth?: boolean;
  /** Vertical VU column that fills UPWARD — the lowest (green) segment lights
   *  first, climbing to red at the top (owner 2026-08-01). Self-sizes. */
  vertical?: boolean;
  /** BEHIND-GLASS mode (owner 2026-08-06, dashboard glass screens): the meter
   *  sits under a tinted pane, so the physical cues go — no segment bevel, no
   *  raised housing frame. Just flat lit glass segments on the dark face. */
  flat?: boolean;
  /** Recolor the whole strip on the MIDI blue→red velocity ramp instead of the
   *  green→red positional scheme. The STANDARD for study-method progress meters
   *  (owner 2026-08-13): the dashboard glass method/quiz meters + all four study
   *  screens (via LedMeterWell). Also used by the Total Progress vertical column,
   *  which its call site still flags as an experimental comparison. */
  midi?: boolean;
  /** Opt-in screen-reader semantics (A11Y 2026-09-07): when set, the meter is
   *  exposed as a progressbar with this label and its percent value. Left unset
   *  for fast audio meters, which would spam a screen reader every frame. */
  a11yLabel?: string;
  /**
   * The TRUE percentage, when the caller has one.
   *
   * ⛔ WITHOUT THIS THE NUMBER IS RE-DERIVED FROM THE SEGMENT COUNT, and that
   * is the same bug `LedMeterWell` was fixed for on 2026-09-21 — it survived
   * one layer down. The label was corrected to carry the caller's real
   * percentage while `accessibilityValue` / `aria-valuenow` below went on
   * being computed from `filled`, which is the value already rounded into 21
   * segments. So the meter announced two different numbers at once: the label
   * said "12% complete" and the progressbar value said 10.
   *
   * It is worst at zero, because `LedMeterWell` lights a minimum of one
   * segment so the meter never looks dead: a genuine 0% arrives here as
   * `filled = 1` and is announced as 5%. A display floor must never reach the
   * announcement.
   *
   * Pass the same number you print. Falls back to the derived value only when
   * the caller genuinely has nothing truer.
   */
  a11yPct?: number;
}) {
  const f = Math.max(0, Math.min(SEG_COUNT, Math.round(filled)));
  const segColor = midi ? midiColorFor : colorFor;
  const pct =
    a11yPct != null
      ? Math.max(0, Math.min(100, Math.round(a11yPct)))
      : Math.round((f / SEG_COUNT) * 100);
  const a11y = a11yLabel
    // RNW 0.21 drops the accessibilityValue OBJECT, so on web the meter announced
    // as a progressbar with no reading at all. The aria- trio carries the percent
    // there; accessibilityValue still carries it on the phone (2026-09-11).
    ? ({
        accessible: true,
        accessibilityRole: 'progressbar' as const,
        accessibilityLabel: a11yLabel,
        accessibilityValue: { min: 0, max: 100, now: pct },
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': pct,
      })
    : {};
  return (
    <View
      {...a11y}
      style={[
        styles.housing,
        vertical && styles.housingVert,
        !vertical && segWidth != null && styles.housingCompact,
        !vertical && fullWidth && styles.housingFull,
        flat && styles.housingFlat,
      ]}
    >
      {Array.from({ length: SEG_COUNT }, (_, i) => {
        const lit = i < f;
        const c = segColor(i);
        return (
          <View
            key={i}
            style={[
              vertical
                ? styles.segVert
                : segWidth != null
                  ? { width: segWidth, height: segHeight ?? 10, borderRadius: 1 }
                  : fullWidth
                    ? [styles.segFull, segHeight != null && { height: segHeight }]
                    : [styles.seg, segHeight != null && { height: segHeight }],
              // Raised physical LED block (Booth 2026-07-10): beveled edges —
              // lit top-left, shadowed bottom-right — like a bar you could
              // feel standing proud of the housing (reference: VU/PPM meter).
              // Skipped in flat (behind-glass) mode.
              !flat && styles.seg3d,
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
 *  method containers (Booth 2026-07-11) — so every screen's meter matches.
 *  Always shows at least 1 lit green segment (owner 2026-08-06). */
export function LedMeterWell({
  filled,
  label = 'Progress',
  pct: pctProp,
}: {
  filled: number;
  label?: string;
  /**
   * The REAL percentage, for the screen reader.
   *
   * ⛔ WITHOUT THIS THE LABEL AND THE SCREEN DISAGREE (owner walkthrough
   * 2026-09-21). The label used to be re-derived from `filled`, which is the
   * percentage already rounded into 21 segments — so it round-tripped
   * pct → segments → pct and quantised to the nearest 1/21. Observed live on
   * Flashcards: the screen read **12%** and the label announced **14%**
   * (11.9% → 3 segments → 14.28%). Each segment is ~4.76 points, so the
   * announcement could be off by more than two points on every study screen.
   *
   * A blind learner was being told a different number from a sighted one, on
   * the same control, at the same moment. Pass the same value you print.
   */
  pct?: number;
}) {
  // Fall back to deriving it only when the caller has no truer number to give.
  const pct =
    pctProp != null
      ? Math.round(pctProp)
      : Math.round((Math.max(0, Math.min(SEG_COUNT, filled)) / SEG_COUNT) * 100);
  return (
    <View style={styles.well}>
      {/* Study-method progress meters (flashcards + homework) ride the MIDI
       *  blue→red velocity ramp — start blue, climb to red (owner 2026-08-13). */}
      {/* `a11yPct` carries the SAME number the label states. Without it the
       *  meter re-derives the value from `filled` — and `Math.max(1, …)` below
       *  is a display floor, so 0% would be announced as 5%. */}
      <LedMeter filled={Math.max(1, filled)} fullWidth midi a11yLabel={`${label}, ${pct}% complete`} a11yPct={pct} />
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
  // Behind-glass: strip the molded plastic frame — the pane supplies the depth.
  housingFlat: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
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
