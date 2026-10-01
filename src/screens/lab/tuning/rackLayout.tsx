/**
 * TuningRackLayout — a Tuning & Temperament chapter on the Rack Unit (owner,
 * TestFlight build 32, 2026-09-30: "poor arrangement of controls above
 * displays … do a proper rack system for it", and "full screen on most labs
 * where we can do it"). Modelled on the Cymatics and Sound Systems wrappers so
 * every chapter declares the same four things and the frame owns the law:
 * *reading may scroll; operating may not.*
 *
 *   STAGE  the chapter's display — the cents rail, the harmonic ladders, the
 *          octave elevator, the fifth spiral, the deviation chart — PINNED on
 *          the glass (StageFit keeps the drawing's aspect and never resizes it
 *          under a drag), the exact numbers on the bezel, the honesty badge
 *          silk-screened under it. FULL SCREEN is on for every stage: the
 *          drawings are SVG (text scales with the viewBox) or scale their own
 *          text by useStageTextScale (the elevator), so everything zooms.
 *   WELL   the only scroller: the standing accuracy note, the chapter
 *          objective, `wellTop` (a live secondary figure the dock also
 *          drives), the first-move caption, then ONE collapsible LAB NOTES
 *          with the prose, the derivations, the step-by-step cards and the
 *          understanding check.
 *   DOCK   the shared ParamLane PRE-BOUND to the chapter's teaching parameter
 *          (the upper note in cents, the fifth width, the number of fifths…)
 *          over the DockButton strip — presets, play keys, STOP — so every
 *          control that changes the picture is under the thumb, in full screen
 *          too. Trays overlay the well only; the glass stays live.
 *
 * The host (TuningLabScreen) gives a rack chapter the full height and no
 * ScrollView of its own; the reading chapter (12) keeps the document layout.
 * The host's footer (sound line, ■ STOP, BACK / CONTINUE) sits under the rack
 * and pads the safe area, so the rack takes `bottomInset={0}`.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { AccuracyNote } from '../../../components/AccuracyNote';
import { CollapsibleSection } from '../LabShell';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';
import type { PlayerStatus, TuningPlayer } from '../../../features/tuning/tuningAudio';
import type { Mono } from '../../../features/ear/earDsp';
import type { LabCtx } from './labCtx';

// The fader helpers are the Sound Systems ones (lane position ↔ value, the
// flip-through chooser-fader); one implementation, shared.
export { flipFader, lanePos, laneVal } from '../soundsystems/rackLayout';

/**
 * A gentle snap onto an exact target (review 2026-09-30). The lane steps in
 * 0.1 ¢ — fine, but the alignment windows are 0.05 ¢ and ⁴√5 = 696.578 ¢ sits
 * between two steps (696.6 gives a third 0.09 ¢ wide — the window could NOT
 * be reached from the lane, only from SHOW ME). The rail already snaps a
 * finger onto its landmarks (dragRail.snapToLandmark); this is the same rule
 * for a lane: within `window` of the target the value IS the target, exact.
 */
export const snapNear = (value: number, target: number, window = 0.25): number => (Math.abs(value - target) < window ? target : value);

/** The accuracy caveat every chapter carries (the host used to print it at the
 *  top of its scroll). This lab PLAYS synthesized tones — it never uses the
 *  microphone — and what the learner hears passes through an uncalibrated
 *  output and speaker or headphones. */
export const TUNING_ACCURACY_DETAIL =
  "The tones here are synthesized exactly, but you hear them through this phone's uncalibrated output and your speaker or headphones. Use a dedicated tuner or a calibrated reference for work that has to be right.";

/** Honesty badges. Every number on a tuning display is computed from exact
 *  ratios — nothing here is measured. */
export const BADGE_EXACT = 'CALCULATED — exact ratios, nothing measured';
export const BADGE_MODEL = 'EXPLANATORY MODEL — not a measurement';

export type TuningRack = {
  /** The pinned display, sized by the glass. */
  stage: (w: number, h: number) => ReactNode;
  size?: StageSize;
  /** Honesty badge (defaults to BADGE_EXACT). */
  badge?: string;
  /** Live readouts printed on the glass bezel (3–4 cells). */
  bezel?: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the chapter's teaching parameter. A
   *  chapter whose controls are all discrete (play keys, a part picker) names
   *  its first key here and runs without a lane (the Cymatics precedent). */
  initialParam: string;
  /** Suppress the drag tag when the bezel already prints the bound value live. */
  hideDragTag?: boolean;
};

export function TuningRackLayout({
  ctx,
  rack,
  caption,
  wellTop,
  notesTitle = 'LAB NOTES',
  children,
}: {
  ctx: LabCtx;
  rack: TuningRack;
  /** The first-move instruction — outside the disclosure, always visible. */
  caption: string;
  /** What the learner is working with right now — a live secondary figure the
   *  dock also drives — above the caption, outside the disclosure. */
  wellTop?: ReactNode;
  notesTitle?: string;
  /** The reading: prose, derivations, step cards, the understanding check. */
  children: ReactNode;
}) {
  return (
    <RackUnit
      stage={{
        render: rack.stage,
        size: rack.size ?? 'M',
        badge: rack.badge ?? BADGE_EXACT,
        bezel: rack.bezel,
        hideDragTag: rack.hideDragTag,
        // FULL SCREEN on every tuning stage (owner 2026-09-30): the rack owns
        // it — zoom 1–3×, the bezel readouts across the top, this same dock
        // at the bottom.
        fullScreen: true,
      }}
      params={rack.params}
      initialParam={rack.initialParam}
      // The host mounts its own footer under the rack and pads the safe area there.
      bottomInset={0}
    >
      <View style={styles.panel}>
        <AccuracyNote style={styles.accuracy} detail={TUNING_ACCURACY_DETAIL} />
        {ctx.objective ? (
          <View style={styles.objective} accessible accessibilityLabel={`In this chapter: ${ctx.objective}`}>
            <Text style={styles.objectiveKicker}>IN THIS CHAPTER</Text>
            <Text style={styles.objectiveText}>{ctx.objective}</Text>
          </View>
        ) : null}
        {wellTop ? <View style={styles.wellTop}>{wellTop}</View> : null}
        <Text style={styles.caption}>{caption}</Text>
        <CollapsibleSection title={notesTitle}>
          <View style={styles.notes}>{children}</View>
        </CollapsibleSection>
      </View>
    </RackUnit>
  );
}

/* ── sound on the rack ───────────────────────────────────────────────────── */

/** The one player's status, for a chapter's bezel and play keys. */
export function usePlayerStatus(player: TuningPlayer): PlayerStatus {
  const [status, setStatus] = useState<PlayerStatus>({ playing: false, label: null });
  useEffect(() => player.subscribe(setStatus), [player]);
  return status;
}

/** A SOUND bezel cell: the transport state is a readout, and in full screen
 *  the footer's sound line is off screen — this cell rides along the top. */
export function soundCell(status: PlayerStatus, flex = 1): BezelItem {
  return {
    k: 'SOUND',
    v: status.rendering ? 'RENDER…' : status.playing ? '♪ PLAYING' : 'STOPPED',
    tint: status.playing ? colors.green : undefined,
    flex,
  };
}

/** The ■ STOP key. Every chapter that plays a tone carries one in its dock,
 *  so audio can be stopped from full screen too (the footer's ■ STOP is not
 *  on screen there). */
export function stopKey(player: TuningPlayer): DockParam {
  return { kind: 'action', id: 'stop', label: '■ STOP', onPress: () => player.stop(), tint: colors.red };
}

/** A clip a PLAY tray can start. */
export type PlayClip = { id: string; label: string; make: () => Mono; name: string; blurb?: string };

/**
 * A PLAY tray: one dock key that opens the chapter's clips as a sticky tray
 * (the lab-tray rule: A/B-ing is the lesson, so it stays open) and starts the
 * one tapped through the player's single render latch. The key shows the clip
 * last started; the SOUND bezel cell shows whether it is still sounding.
 */
export function playTray(opts: {
  player: TuningPlayer;
  id?: string;
  label?: string;
  clips: PlayClip[];
  last: string | null;
  setLast: (id: string) => void;
  short?: (clip: PlayClip) => string;
}): DockParam {
  const cur = opts.clips.find((c) => c.id === opts.last) ?? null;
  return {
    kind: 'options',
    id: opts.id ?? 'play',
    label: opts.label ?? 'PLAY',
    valueLabel: cur ? (opts.short ? opts.short(cur) : cur.label) : '▶',
    options: opts.clips.map((c) => ({ id: c.id, label: `▶ ${c.label}`, blurb: c.blurb })),
    selectedId: opts.last,
    onSelect: (id) => {
      const clip = opts.clips.find((c) => c.id === id);
      if (!clip) return;
      opts.setLast(id);
      void opts.player.renderAndPlay(clip.make, clip.name);
    },
    sticky: true,
  };
}

/** A play ACTION key for a single clip (the chapter's one obvious sound). */
export function playKey(player: TuningPlayer, id: string, label: string, make: () => Mono, name: string): DockParam {
  return { kind: 'action', id, label, onPress: () => void player.renderAndPlay(make, name) };
}

const styles = StyleSheet.create({
  panel: { gap: 8 },
  accuracy: { alignSelf: 'flex-start' },
  objective: { borderLeftWidth: 2, borderLeftColor: colors.amberLabel, paddingLeft: 10, paddingVertical: 2, gap: 2 },
  objectiveKicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  objectiveText: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  wellTop: { gap: 8 },
  notes: { gap: 12 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
});
