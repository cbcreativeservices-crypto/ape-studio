/**
 * PatchbayRack — a Patchbay page on the Rack Unit (owner 2026-10-10:
 * "convert the patchbay lab, all 23 modules, to the rack layout").
 *
 *   STAGE  the page's instrument — the vertical pair (faceplate over the
 *          schematic, in its shorter GLASS geometry), the jack cutaway, the
 *          8-pair studio bay — PINNED on the glass and fitted to it at its own
 *          aspect (StageFit), the read-only readouts on the bezel, the honesty
 *          badge silk-screened under it. The jack and column taps on the
 *          drawing still work; every one of them is ALSO a dock key.
 *   WELL   the only scroller: the page's prose, its status line (the pair's
 *          readout, where the figure's own status used to sit), the goal
 *          chips, the predict / check cards — in the page's original order.
 *   DOCK   every control: the jacks as TOP / BOTTOM toggles, the plug as the
 *          PLUG INSERTION fader, the bay's pair as a chooser-fader, the
 *          reveal and insert switches as toggles.
 *
 * FULL SCREEN is the rack's own (a working surface: the dock comes along, the
 * bezel readouts ride on top, the drawing zooms). kit/PagedLab gives a page
 * flagged `rack: true` the full height and no ScrollView of its own.
 *
 * ⛔ 9 pt (owner 2026-09-25): every drawing here is authored at 9 viewBox
 * units of text on a 340-unit-wide viewBox, so it must render ≥ 340 pt wide.
 * The glass on a tall phone is sized for that from the drawing's own aspect
 * (`patchbayGlassHeight`); a short phone (< 760 pt) keeps the rack's own rule
 * and FULL SCREEN covers it.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../theme/tokens';
import { RackUnit } from '../rack/RackUnit';
import { StageFit } from '../rack/StageFit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';
import { PB, pairStatus } from './art/PatchPairView';
import { contactsOpen, type PairState } from './engine/patchbay';
import { PAD, fitWidth, patchbayGlassHeight } from './glassFit.ts';

export { DRAWING_W } from './glassFit.ts';

export type PatchbayRackSpec = {
  /** The drawing at width `w` (its height follows from `aspect`). */
  draw: (w: number) => ReactNode;
  /** The drawing's aspect (w ÷ h). */
  aspect: number;
  /** Declared glass size (the tall-phone height comes from the aspect). */
  size?: StageSize;
  badge?: string;
  bezel?: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount; a page whose keys are all switches
   *  names its first key (the rack runs without a lane — the Cymatics
   *  "Change one thing" precedent). */
  initialParam: string;
  /** The bezel already prints the bound fader's value live. */
  hideDragTag?: boolean;
};

export function PatchbayRack({ rack, children }: { rack: PatchbayRackSpec; children: ReactNode }) {
  const { height: winH } = useWindowDimensions();
  const size = rack.size ?? 'L';
  return (
    <RackUnit
      stage={{
        size,
        phoneHeight: patchbayGlassHeight(winH, rack.aspect, size),
        badge: rack.badge,
        bezel: rack.bezel,
        hideDragTag: rack.hideDragTag,
        fullScreen: true,
        render: (w, h) => (
          <StageFit w={w} h={h} aspect={rack.aspect} pad={PAD}>
            {rack.draw(fitWidth(w, h, rack.aspect))}
          </StageFit>
        ),
      }}
      params={rack.params}
      initialParam={rack.initialParam}
    >
      <View style={styles.well}>{children}</View>
    </RackUnit>
  );
}

/** The pair's jacks as two dock switches — the same toggles the jack taps on
 *  the drawing make. */
export function jackKeys(state: Pick<PairState, 'topPlugged' | 'bottomPlugged'>, toggle: (jack: 'top' | 'bottom') => void): DockParam[] {
  return [
    { kind: 'toggle', id: 'top', label: 'TOP JACK', value: state.topPlugged, onToggle: () => toggle('top') },
    { kind: 'toggle', id: 'bottom', label: 'BOTTOM JACK', value: state.bottomPlugged, onToggle: () => toggle('bottom') },
  ];
}

/** The pair's read-only bezel: both jacks, the normal, and what the
 *  destination hears — the same resolved flow the status line reads. */
export function pairBezel(state: PairState, sourceLabel: string, destLabel: string, sourceLive = true): BezelItem[] {
  const { flow, hazard } = pairStatus(state, sourceLabel, destLabel, sourceLive);
  const normal = !flow.hasNormal ? 'NONE' : flow.normalActive ? 'INTACT' : 'BROKEN';
  const dest =
    flow.destinationHears === 'normal'
      ? sourceLive ? 'SOURCE' : 'IDLE'
      : flow.destinationHears === 'both'
        ? 'BOTH'
        : flow.destinationHears === 'patch'
          ? 'PATCH'
          : 'NOTHING';
  return [
    { k: 'TOP', v: state.topPlugged ? 'CORD' : 'EMPTY', tint: state.topPlugged ? PB.cord : colors.textSub },
    { k: 'BOTTOM', v: state.bottomPlugged ? 'CORD' : 'EMPTY', tint: state.bottomPlugged ? PB.cord : colors.textSub },
    { k: 'NORMAL', v: normal, tint: !flow.hasNormal ? colors.textSub : flow.normalActive ? PB.flow : hazard ? PB.hazard : PB.break },
    { k: 'DEST HEARS', v: dest, tint: dest === 'NOTHING' ? (hazard ? PB.hazard : colors.textSub) : dest === 'PATCH' ? PB.cord : dest === 'IDLE' ? colors.textSub : PB.flow, flex: 1.2 },
  ];
}

/** The cutaway's PLUG INSERTION slider as the dock's fader (0–100 %, the old
 *  slider's 1 % step). */
export function insertionFader(insertion: number, setInsertion: (v: number) => void): DockParam {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return {
    kind: 'fader',
    id: 'insertion',
    label: 'PLUG INSERTION',
    value: insertion,
    onChange: (v) => setInsertion(Math.max(0, Math.min(1, Math.round(v * 100) / 100))),
    format: pct,
  };
}

/** The cutaway's readout row, on the bezel: the % and the two contact words. */
export function cutawayBezel(insertion: number): BezelItem[] {
  const open = contactsOpen(insertion);
  return [
    { k: 'INSERTION', v: `${Math.round(insertion * 100)}%`, tint: colors.textPrimary },
    { k: 'CONTACTS', v: open ? 'OPEN' : 'TOUCHING', tint: open ? PB.break : PB.flow, flex: 1.2 },
    { k: 'NORMAL', v: open ? 'BROKEN' : 'INTACT', tint: open ? PB.break : PB.flow },
  ];
}

const styles = StyleSheet.create({
  well: { gap: 12 },
});
