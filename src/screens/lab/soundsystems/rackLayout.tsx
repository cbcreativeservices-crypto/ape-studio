/**
 * SoundSystemsRackLayout — a Sound Systems page on the Rack Unit (owner,
 * 2026-09-25: "it does not follow the other labs' standard Rack system layout
 * where controls are on the bottom, the display above, data in between that
 * scrolls"). Modelled on the Cymatics wrapper so every page declares the same
 * four things and the frame owns the law: *reading may scroll; operating may
 * not.*
 *
 *   STAGE  the page's instrument — the venue plot, the system map, the
 *          console's buses, the chain of meters, a teaching diagram — PINNED
 *          on the glass, sized by the glass (StageFit keeps the drawing's
 *          aspect and never resizes it under a drag), readouts on the bezel,
 *          the honesty badge silk-screened under it.
 *   WELL   the only scroller. `wellTop` (what the learner is DOING right now:
 *          a live secondary display, the selected device's card) and the
 *          first-move caption sit OUTSIDE the disclosure; the chapter tag, the
 *          prompt, the goal chips, the prose, the checks and the go-deeper
 *          links live in ONE collapsible LAB NOTES, so once read the well goes
 *          quiet and the stage + dock own the screen.
 *   DOCK   the shared ParamLane PRE-BOUND to the page's teaching parameter
 *          over the DockButton strip; trays overlay the well only — the glass
 *          stays live, which is what lets a parts tray sit open while the
 *          learner taps a position on the plot.
 *
 * The host (SsPagedLab) gives a rack page the full height and no ScrollView
 * of its own; document pages keep the paged layout.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { CollapsibleSection } from '../LabShell';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam, StageSize, TrayOption } from '../rack/rackTypes';
import type { PageDef } from '../kit/PagedLab';

// The fit/box stages moved to the shared rack (2026-09-25); the pages import
// them from there. Kept here as re-exports so nothing else has to know.
export { StageBox, StageFit } from '../rack/StageFit';

/** A Sound Systems page: PagedLab's contract plus the rack flag the host reads. */
export type SsPageDef = PageDef & {
  /** The page renders a SoundSystemsRackLayout: the host gives it the full
   *  height and no scroll view of its own. */
  rack?: boolean;
};

export type SsRack = {
  /** The pinned display, sized by the glass. */
  stage: (w: number, h: number) => ReactNode;
  size?: StageSize;
  /** Honesty badge (Simulation / Calculated / Approximated / Illustrative). */
  badge?: string;
  /** Live readouts printed on the glass bezel (3–4 cells). */
  bezel?: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the page's teaching parameter. A
   *  page whose controls are all discrete (a parts bin, a probe, a power
   *  sequence) names its first key here and runs without a lane, the
   *  Cymatics "Change one thing" precedent. */
  initialParam: string;
  /** Suppress the drag tag when the bezel already prints the bound value live. */
  hideDragTag?: boolean;
  /** FULL SCREEN button (default on). Set false on a view-built stage whose
   *  text keeps its size at any box size (the console bus columns): zooming
   *  it would only add empty space. StageBox stages turn it off themselves. */
  fullScreen?: boolean;
};

export function SoundSystemsRackLayout({
  rack,
  caption,
  wellTop,
  notesTitle = 'LAB NOTES',
  children,
}: {
  rack: SsRack;
  /** The first-move instruction — outside the disclosure, always visible. */
  caption: string;
  /** What the learner is doing right now — above the caption, outside the
   *  disclosure (the well-top slot, owner report 2026-09-17). */
  wellTop?: ReactNode;
  notesTitle?: string;
  /** The reading: chapter tag, prompt, goals, prose, checks, go-deeper links. */
  children: ReactNode;
}) {
  // FULL SCREEN (owner 2026-09-25): the same stage, same page state, at the
  // whole phone with zoom, the dock along for the ride — the RACK owns it
  // (`fullScreen`); a StageBox stage declines the button itself.
  return (
    <RackUnit
      stage={{
        render: rack.stage,
        size: rack.size ?? 'M',
        badge: rack.badge,
        bezel: rack.bezel,
        hideDragTag: rack.hideDragTag,
        fullScreen: rack.fullScreen !== false,
      }}
      params={rack.params}
      initialParam={rack.initialParam}
      // The paged host mounts its own BACK / CONTINUE footer under the rack and
      // pads the safe area there.
      bottomInset={0}
    >
      <View style={styles.panel}>
        {wellTop ? <View style={styles.wellTop}>{wellTop}</View> : null}
        <Text style={styles.caption}>{caption}</Text>
        <CollapsibleSection title={notesTitle}>
          <View style={styles.notes}>{children}</View>
        </CollapsibleSection>
      </View>
    </RackUnit>
  );
}

/* ── fader helpers ────────────────────────────────────────────────────────── */

/** Lane position (0..1) of a value in [min, max]. */
export const lanePos = (v: number, min: number, max: number): number => Math.max(0, Math.min(1, (v - min) / (max - min)));

/** Value in [min, max] at lane position p, snapped to `step`. */
export const laneVal = (p: number, min: number, max: number, step = 1): number => {
  const raw = min + Math.max(0, Math.min(1, p)) * (max - min);
  const snapped = Math.round(raw / step) * step;
  return Math.max(min, Math.min(max, Number(snapped.toFixed(6))));
};

/**
 * A FLIP-THROUGH fader: one dock key that is both a chooser and a slider
 * (owner 2026-08-30 — one key does chooser-then-slider). Tapping opens the
 * list; riding the lane steps through the same list in order, so a page whose
 * teaching choice is a collection (ten system types, thirteen output
 * configurations, the stations of a channel strip) puts that choice in the
 * learner's thumb — the picture changes with every step.
 */
export function flipFader<T extends { id: string }>(opts: {
  id: string;
  label: string;
  items: readonly T[];
  selectedId: string;
  onSelect: (id: string) => void;
  name: (t: T) => string;
  short?: (t: T) => string;
  blurb?: (t: T) => string;
  title?: string;
  /** Sticky = the list stays open for A/B while the glass reacts. */
  sticky?: boolean;
  /** What the lane reads while NOTHING is selected (the builder's empty
   *  hand, a map with no station inspected yet). Riding still selects. */
  empty?: string;
}): DockParam {
  const n = Math.max(1, opts.items.length);
  const found = opts.items.findIndex((t) => t.id === opts.selectedId);
  const idx = Math.max(0, found);
  const at = (p: number) => opts.items[Math.round(Math.max(0, Math.min(1, p)) * (n - 1))];
  const cur = opts.items[idx];
  // The lane readout is one line over the fader: a long name (a system type,
  // a socket's destination) falls back to its short form there; the tray and
  // the bezel carry the full name.
  const readout = (t: T) => {
    const full = opts.name(t);
    return full.length > 26 && opts.short ? opts.short(t) : full;
  };
  const options: TrayOption[] = opts.items.map((t) => ({ id: t.id, label: opts.name(t), blurb: opts.blurb?.(t) }));
  return {
    kind: 'fader',
    id: opts.id,
    label: opts.label,
    value: n > 1 ? idx / (n - 1) : 0,
    onChange: (p) => {
      const t = at(p);
      if (t && t.id !== opts.selectedId) opts.onSelect(t.id);
    },
    format: (p) => (found < 0 && opts.empty && p === 0 ? opts.empty : readout(at(p) ?? cur)),
    formatShort: (p) => (found < 0 && opts.empty && p === 0 ? '—' : (opts.short ?? opts.name)(at(p) ?? cur)),
    chooser: { title: opts.title, options, selectedId: opts.selectedId, onSelect: opts.onSelect, sticky: opts.sticky },
  };
}

const styles = StyleSheet.create({
  panel: { gap: 8 },
  wellTop: { gap: 8 },
  notes: { gap: 12 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
});
