/**
 * AmpRack — an Amplifier Principles page on the Rack Unit (owner, TestFlight
 * build 32, 2026-09-30: "displays below controls, which means your fingers
 * block what you see … this whole lab needs a redo on the rack system
 * design"). The layout law: *reading may scroll; operating may not.*
 *
 *   STAGE  the rig's waveform stack (or a module diagram), PINNED on the glass
 *          and drawn in its own shape (StageFit), so FULL SCREEN zooms it
 *          1–3× with the panel titles growing (useStageTextScale). The
 *          honesty badge is silk-screened under it.
 *   BEZEL  the rig's status (SUPPLY · HEAT · EFFICIENCY · LOAD) and the
 *          page's own readouts — on top in full screen too.
 *   WELL   the only scroller: the teaching prose, legends, secondary figures
 *          (ExpandableFigure), result cards, checks.
 *   DOCK   the ParamLane bound to the page's teaching parameter, the other
 *          controls as keys/trays, and the rig's transport (RUN / SLOW, or
 *          STEP ¼ under reduced motion) — DISPLAY ABOVE, CONTROLS BELOW.
 *
 * Model maths and teaching copy are untouched: a page hands in the PICTURE
 * (RigPicture) its model produced and a DECLARATION of its controls.
 */
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { RackUnit } from '../rack/RackUnit';
import { StageFit } from '../rack/StageFit';
import type { BezelItem, DockParam, StageSize, TrayOption } from '../rack/rackTypes';
import { CONCEPT_NOTE, WaveStack, rigAspect, rigLegend, rigPanelCount, useRigPlayhead, type RigPicture } from './AmpRig';

export type AmpRackSpec = {
  /** The waveform stack — the lab's rig picture for this page. */
  rig?: RigPicture;
  /** A module diagram on the glass instead of the rig (device model,
   *  transformer, half-bridge, gain chain): width-driven SVG of this aspect. */
  stage?: { render: (w: number, h: number) => ReactNode; aspect: number };
  /** Glass size; a three-panel rig defaults to L, everything else to M. */
  size?: StageSize;
  /** Honesty badge under the glass (default: the rig's conceptual note). */
  badge?: string;
  /** The page's readouts, ≤5 cells on a phone (compose with rigStatusBezel). */
  bezel: BezelItem[];
  /** The page's controls — faderParam / optionsParam / toggles / groups. */
  params: DockParam[];
  /** The fader the lane binds on mount — the page's teaching parameter. */
  initialParam: string;
  /** Transport keys appended to the dock: 'full' = RUN + SLOW (default for
   *  a rig), 'run' = RUN only (a dock already holding four keys), 'none'
   *  (default for a diagram stage — nothing moves). Reduced motion always
   *  gets the single STEP ¼ CYCLE key instead. */
  transport?: 'full' | 'run' | 'none';
  hideDragTag?: boolean;
};

/** Where the lab's drawings fit on the glass: StageFit's default inset. */
const FIT_PAD = 6;

export function AmpRack({ spec, children }: { spec: AmpRackSpec; children: ReactNode }) {
  const play = useRigPlayhead();
  const rig = spec.rig;
  const transport = spec.transport ?? (rig ? 'full' : 'none');

  // The transport as dock keys — the same state the stack animates from.
  const transportParams = useMemo<DockParam[]>(() => {
    if (transport === 'none') return [];
    if (!play.motion) return [{ kind: 'action', id: 'step', label: 'STEP ¼', onPress: play.step }];
    const keys: DockParam[] = [{ kind: 'toggle', id: 'run', label: 'RUN', value: play.running, onToggle: () => play.setRunning(!play.running) }];
    if (transport === 'full') keys.push({ kind: 'toggle', id: 'slow', label: 'SLOW', value: play.slow, onToggle: () => play.setSlow(!play.slow) });
    return keys;
  }, [transport, play]);

  const params = useMemo(() => [...spec.params, ...transportParams], [spec.params, transportParams]);
  const aspect = rig ? rigAspect(rig) : (spec.stage?.aspect ?? 2);
  const size: StageSize = spec.size ?? (rig && rigPanelCount(rig) >= 3 ? 'L' : 'M');
  const legend = rig ? rigLegend(rig) : [];

  return (
    <RackUnit
      params={params}
      initialParam={spec.initialParam}
      stage={{
        size,
        fullScreen: true,
        badge: spec.badge ?? CONCEPT_NOTE,
        bezel: spec.bezel,
        hideDragTag: spec.hideDragTag,
        render: (w, h) => {
          // The widest box of the drawing's shape that fits the glass — the
          // same fit StageFit makes, so the stack is handed its exact size.
          const fitW = Math.max(40, Math.min(Math.max(40, w - FIT_PAD * 2), Math.max(40, h - FIT_PAD * 2) * aspect));
          const fitH = fitW / aspect;
          return (
            <StageFit w={w} h={h} aspect={aspect} pad={FIT_PAD}>
              {rig ? <WaveStack w={fitW} h={fitH} p={rig} play={play} /> : spec.stage?.render(fitW, fitH)}
            </StageFit>
          );
        },
      }}
    >
      <View style={styles.well}>
        {legend.length ? (
          <View style={styles.legendRow}>
            {legend.map((l) => (
              <Text key={l.text} style={[styles.legend, { color: l.color }]}>{l.text}</Text>
            ))}
          </View>
        ) : null}
        {children}
      </View>
    </RackUnit>
  );
}

/* ── dock declarations from the lab's own value ranges ──────────────────── */

/**
 * A continuous control as a dock FADER: the lane rides 0..1, the page keeps
 * its real range (min..max, snapped to `step`) and its own format.
 */
export function faderParam(o: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  formatShort?: (v: number) => string;
  onChange: (v: number) => void;
  /** A LEVEL fader (input level, drive): the lane shows the amplitude ramp. */
  level?: boolean;
  /** Neutral position in the page's units (double-tap returns here). */
  home?: number;
  tint?: string;
}): DockParam {
  const span = o.max - o.min || 1;
  const step = o.step ?? 0.01;
  return {
    kind: 'fader',
    id: o.id,
    label: o.label,
    value: (o.value - o.min) / span,
    onChange: (t) => {
      const raw = o.min + Math.max(0, Math.min(1, t)) * span;
      const snapped = Math.round(raw / step) * step;
      o.onChange(Math.min(o.max, Math.max(o.min, snapped)));
    },
    format: () => o.format(o.value),
    formatShort: o.formatShort ? () => o.formatShort!(o.value) : undefined,
    level: o.level,
    tint: o.tint,
    home: o.home != null ? (o.home - o.min) / span : undefined,
  };
}

/**
 * A choice as a dock TRAY key. Sticky by default — the lab's selectors are
 * teaching collections (class A → B → AB, 8 Ω → 4 Ω → 2 Ω): the tray stays
 * open so the choices can be A/B'd while the glass reacts.
 */
export function optionsParam<T extends string | number>(o: {
  id: string;
  label: string;
  value: T;
  options: { key: T; label: string; short?: string; blurb?: string }[];
  onChange: (v: T) => void;
  sticky?: boolean;
}): DockParam {
  const sel = o.options.find((x) => x.key === o.value);
  const options: TrayOption[] = o.options.map((x) => ({ id: String(x.key), label: x.label, blurb: x.blurb }));
  return {
    kind: 'options',
    id: o.id,
    label: o.label,
    valueLabel: sel ? (sel.short ?? sel.label) : '—',
    options,
    selectedId: sel ? String(sel.key) : null,
    onSelect: (id) => {
      const hit = o.options.find((x) => String(x.key) === id);
      if (hit) o.onChange(hit.key);
    },
    sticky: o.sticky ?? true,
  };
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legend: { fontFamily: fonts.barlowMedium, fontSize: 11, color: colors.textSub },
});
