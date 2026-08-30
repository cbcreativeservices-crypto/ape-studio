/**
 * FilterSlopes — EQ Lab lesson 8 (owner spec 2026-08-07): dB/octave, seen
 * geometrically. The cutoff is HELD at 80 Hz and ONLY the slope changes —
 * 6 · 12 · 18 · 24 · 36 · 48 dB/oct — with every slope overlaid as a ghost so
 * the chosen one reads against the whole family.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): renders the RackUnit frame
 * itself (EqModuleScreen gives rack modules the full height, no host
 * ScrollView). The slope-family chart PINS on the stage with the Butterworth
 * honesty line as its badge; the geometry proof (the REAL attenuation one and
 * two octaves below the cutoff) reads live on the bezel. The SLOPE itself is
 * the teaching fader — ride the lane and watch the skirt swing through the
 * family; the sticky SLOPES tray gives the exact console values for A/B.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ResponseCurveGraph, type ResponseCurve } from '../../../../features/lab/fxViz';
import { CheckQuestion, type CheckSpec } from '../../foundations/bits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { butterworthHpDb, gainColor } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import type { EqModuleComponentProps } from './registry';

const CUTOFF = 80;
const SLOPES = [6, 12, 18, 24, 36, 48] as const;
/** Tray blurbs: what each steepness is FOR. 6 dB/oct = one pole; every +6 is
 *  another pole and a steeper wall (owner 2026-08-28). */
const SLOPE_BLURBS: Record<number, string> = {
  6: 'One pole — the gentlest tilt there is. Barely a filter: a tone control.',
  12: 'Two poles — the workhorse. Enough to clean rumble without sounding processed.',
  18: 'Three poles — noticeably firmer; the classic crossover slope of many PA systems.',
  24: 'Four poles — a real wall. Standard for subwoofer crossovers, where overlap causes trouble.',
  36: 'Six poles — surgical. Very steep, and the phase shift near the corner grows with it.',
  48: 'Eight poles — a cliff. Maximum separation, maximum phase cost: nothing is free.',
};
type Slope = (typeof SLOPES)[number];

const CHECK: CheckSpec = {
  question: '“24 dB per octave” describes…',
  options: [
    'How quickly attenuation increases beyond the filter’s transition region',
    'How much the filter boosts at the cutoff',
    'How wide the filter’s Q is',
  ],
  correctIdx: 0,
  reveal:
    'Slope is the RATE of attenuation past the transition region: each octave beyond the cutoff loses roughly another 24 dB. Steeper slope = harder edge; gentler slope = more gradual.',
  wrongHint: 'Filters here only remove — and Q belongs to bells, not slopes.',
};

export function FilterSlopesModule(_p: EqModuleComponentProps) {
  const [slope, setSlope] = useState<Slope>(12);
  const order = slope / 6;

  const curves = useMemo<ResponseCurve[]>(
    () => [
      // The whole family stays overlaid (ghosts) — the spec's key visual.
      ...SLOPES.filter((s) => s !== slope).map((s) => ({
        at: (f: number) => butterworthHpDb(CUTOFF, f, s / 6),
        emphasis: 'ghost' as const,
      })),
      { at: (f: number) => butterworthHpDb(CUTOFF, f, order), emphasis: 'main' },
    ],
    [slope, order],
  );

  const atOctBelow = butterworthHpDb(CUTOFF, CUTOFF / 2, order);
  const atTwoOct = butterworthHpDb(CUTOFF, CUTOFF / 4, order);

  const slopeIdx = SLOPES.indexOf(slope);
  const params: DockParam[] = [
    {
      // ONE key (owner 2026-08-30). These were two keys driving the SAME
      // value: the lane swept the family, the tray picked exact console
      // numbers. Now the key opens the exact-value menu and the lane sweeps —
      // sticky, so the family can still be A/B'd while the curves react, and
      // the lane binds when the tray closes.
      kind: 'fader',
      id: 'slope',
      label: 'SLOPE',
      // The lane steps through the discrete family — snap to the nearest.
      value: slopeIdx / (SLOPES.length - 1),
      onChange: (t) => {
        const i = Math.round(Math.max(0, Math.min(1, t)) * (SLOPES.length - 1));
        setSlope(SLOPES[i]);
      },
      format: () => `${slope} dB/OCT`,
      formatShort: () => `${slope}`,
      chooser: {
        title: 'SLOPE',
        selectedId: String(slope),
        onSelect: (id) => setSlope(Number(id) as Slope),
        sticky: true, // exact console values, A/B while the family reacts
        options: SLOPES.map((s) => ({ id: String(s), label: `${s} dB/OCT`, blurb: SLOPE_BLURBS[s] })),
      },
    },
  ];

  return (
    <RackUnit
      initialParam="slope"
      params={params}
      stage={{
        size: 'M', // teaching chart
        badge: `Butterworth response — order ${order} (${slope} dB/oct asymptotic).`,
        bezel: [
          { k: 'SLOPE', v: `${slope} dB/OCT` },
          { k: 'CUTOFF', v: `${CUTOFF} Hz` },
          // Geometry proof: the REAL computed attenuation at 40 and 20 Hz.
          { k: '@40 Hz', v: `${atOctBelow.toFixed(1)} dB` },
          { k: '@20 Hz', v: `${atTwoOct.toFixed(1)} dB` },
        ],
        render: (w, h) => (
          <View style={{ width: w, height: h, justifyContent: 'center', paddingHorizontal: 6, paddingTop: 4 }}>
            {/* A slope is pure attenuation (all ≤0 dB) → MIDI blue (owner 2026-08-07). */}
            <ResponseCurveGraph curves={curves} dbRange={48} height={Math.max(70, h - 24)} mainColor={gainColor(0)} />
          </View>
        ),
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          Same filter, same 80 Hz cutoff — only the SLOPE changes. Slope describes how quickly
          attenuation increases beyond the filter’s transition region, in dB per octave. Ride the
          SLOPE lane through the family — the ghosts are the other slopes.
        </GlossaryText>

        <Text style={styles.caption}>
          The bezel proves the geometry with REAL computed values: the attenuation one octave below
          the cutoff (40 Hz) and two octaves below (20 Hz) tracks the slope you chose.
        </Text>

        <Text style={styles.caption}>
          Gentle slopes (6–12 dB/oct) sound transparent and are common on channel low-cuts; steep
          slopes (24–48 dB/oct) carve harder and appear in crossovers and surgical cleanup. Watch how
          the −3 dB point stays put while the skirt swings.
        </Text>

        <CheckQuestion spec={CHECK} />
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
