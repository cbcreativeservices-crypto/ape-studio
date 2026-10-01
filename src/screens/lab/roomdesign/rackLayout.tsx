/**
 * RoomRackLayout — a Room Design module on the Rack Unit (owner: "use our
 * standard rack layout, include full screens where appropriate"). The
 * Cymatics / Sound Systems wrapper, unchanged in law: *reading may scroll;
 * operating may not.*
 *
 *   STAGE  the plan or the side view, PINNED on the glass, readouts on the
 *          bezel, the honesty badge (CALCULATED / ESTIMATED / MEASURED)
 *          silk-screened under it. FULL SCREEN is ON for every module — the
 *          room editor is a working surface, and the views lay out in glass
 *          units so everything zooms and every drag maps at every step.
 *   WELL   the only scroller: `wellTop` (what the learner is doing now), the
 *          first-move caption, then ONE collapsible LAB NOTES.
 *   DOCK   the shared ParamLane pre-bound to the module's teaching parameter
 *          over the DockButton strip; trays overlay the well only.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { CollapsibleSection } from '../LabShell';
import { RackUnit } from '../rack/RackUnit';
import type { BezelItem, DockParam, StageSize } from '../rack/rackTypes';

export type RoomRack = {
  stage: (w: number, h: number) => ReactNode;
  size?: StageSize;
  badge: string;
  bezel?: BezelItem[];
  params: DockParam[];
  initialParam: string;
  hideDragTag?: boolean;
  fullScreen?: boolean;
};

export function RoomRackLayout({
  rack,
  caption,
  captionFirst = false,
  wellTop,
  notesTitle = 'LAB NOTES',
  children,
}: {
  rack: RoomRack;
  caption: string;
  /** Put the first-move caption ABOVE the status lines (Monitoring: "drag
   *  the speakers…" before the readouts — cognitive review 23). */
  captionFirst?: boolean;
  wellTop?: ReactNode;
  notesTitle?: string;
  children: ReactNode;
}) {
  return (
    <RackUnit
      stage={{
        render: rack.stage,
        size: rack.size ?? 'L',
        badge: rack.badge,
        bezel: rack.bezel,
        hideDragTag: rack.hideDragTag,
        fullScreen: rack.fullScreen ?? true,
      }}
      params={rack.params}
      initialParam={rack.initialParam}
    >
      <View style={styles.panel}>
        {captionFirst ? <Text style={styles.caption}>{caption}</Text> : null}
        {wellTop ? <View style={styles.wellTop}>{wellTop}</View> : null}
        {captionFirst ? null : <Text style={styles.caption}>{caption}</Text>}
        <CollapsibleSection title={notesTitle}>
          <View style={styles.notes}>{children}</View>
        </CollapsibleSection>
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 8 },
  wellTop: { gap: 8 },
  notes: { gap: 12 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSub },
});
