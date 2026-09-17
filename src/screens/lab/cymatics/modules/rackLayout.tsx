/**
 * CymaticsRackLayout — a Cymatics module on the Rack Unit (APE_LAB_UX_PROPOSAL
 * 2026-08-23, owner-approved; the Wave modules' WaveLayout precedent). The
 * layout law: *reading may scroll; operating may not.*
 *
 *   STAGE  the module's display, PINNED on the glass (sized by the glass,
 *          never resized during an interaction), readouts on the bezel, the
 *          honesty badge silk-screened under it.
 *   WELL   the only scroller. The first-move caption sits OUTSIDE the
 *          disclosure (house rule, design pass 2026-08-31: an instruction
 *          inside a collapsed section is an instruction unread); everything
 *          else — the prose, secondary displays, undocked controls, mistakes,
 *          checks, the guided-lesson entry — lives in ONE collapsible
 *          LAB NOTES (owner 2026-08-23), so once read the well goes quiet and
 *          the stage + dock own the screen.
 *   DOCK   the shared ParamLane PRE-BOUND to the module's teaching parameter
 *          (initialParam) over the DockButton strip; trays overlay the well
 *          only — the glass stays live.
 *
 * The host (CymaticsModuleScreen) gives a rack module the full height and no
 * ScrollView of its own; prose-only modules keep the document layout.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { CollapsibleSection } from '../../LabShell';
import { RackUnit } from '../../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../../rack/rackTypes';

export type CymaticsRack = {
  /** The pinned display, sized by the glass. */
  stage: (w: number, h: number) => ReactNode;
  size?: StageSize;
  /** Honesty badge (Simulation / Calculated / Approximated / Illustrative). */
  badge?: string;
  /** Live readouts printed on the glass bezel (3–4 cells). */
  bezel?: BezelItem[];
  params: DockParam[];
  /** The fader the lane binds on mount — the module's teaching parameter. */
  initialParam: string;
  /** ⓘ display-guide entry on the bezel. */
  onGuide?: () => void;
  /** helpKey → the 'cymatics' guided lesson. */
  onHelp?: (key?: string) => void;
  /** Suppress the drag tag when the bezel already prints the bound value live. */
  hideDragTag?: boolean;
};

export function CymaticsRackLayout({
  rack,
  caption,
  notesTitle = 'LAB NOTES',
  children,
}: {
  rack: CymaticsRack;
  /** The first-move instruction — outside the disclosure, always visible. */
  caption: string;
  notesTitle?: string;
  /** The reading: prose, secondary displays, undocked controls, mistakes, checks. */
  children: ReactNode;
}) {
  return (
    <RackUnit
      stage={{
        render: rack.stage,
        size: rack.size ?? 'M',
        badge: rack.badge,
        bezel: rack.bezel,
        onGuide: rack.onGuide,
        hideDragTag: rack.hideDragTag,
      }}
      params={rack.params}
      initialParam={rack.initialParam}
      onHelp={rack.onHelp}
    >
      <View style={styles.panel}>
        <Text style={styles.caption}>{caption}</Text>
        <CollapsibleSection title={notesTitle}>
          <View style={{ gap: 12 }}>{children}</View>
          {/* Guided-lesson entry lives at the BOTTOM (owner 2026-07-29) — the
              host's row is outside the rack, so the well carries its own. */}
          <Pressable style={styles.lessonRow} onPress={() => rack.onHelp?.(undefined)} accessibilityRole="button" accessibilityLabel="Open the guided lesson">
            <Text style={styles.lessonRowText}>ⓘ GUIDED LESSON — every control long-presses for its own entry</Text>
          </Pressable>
        </CollapsibleSection>
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
  lessonRow: { marginTop: 12, borderRadius: 9, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 10, paddingHorizontal: 12 },
  lessonRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.9, color: colors.textSecondary },
});
