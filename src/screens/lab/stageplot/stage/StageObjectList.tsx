/**
 * StageObjectList — THE LIST ALTERNATIVE TO DRAGGING (must-do D60, handoff
 * §3: "a list based alternative to dragging, with keyboard and screen reader
 * access").
 *
 * Every object on the stage is a row, in reading order (upstage to
 * downstage, stage right to stage left), with its name, what it is, where it
 * stands in stage words and its channel numbers and mix codes. A row is a
 * button: it selects the object, on the drawing too. The selected row opens
 * the whole inspector under it: four position buttons, typed position
 * numbers, the turn buttons, the links and the rest. So a person who cannot
 * drag, or cannot see the drawing, can build the whole stage from here.
 *
 * The inspector is a SIBLING of its row's button, never inside it (an
 * accessible element is never nested in another).
 */
import { StyleSheet, Text, View } from 'react-native';
import { spLocationWord, spOnStage } from '../../../../features/stageplot/spModel';
import type { SpId, SpProject } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { RowCard } from '../spForm';
import { StageInspector } from './StageInspector';
import { stageBadges, stageKindName, stageListName, stageListOrder } from './stageLinks';

export function StageObjectList({ project, selectedId, onSelect }: { project: SpProject; selectedId: SpId | null; onSelect: (id: SpId | null) => void }) {
  const p = project;
  if (!p.objects.length) {
    return <Text style={styles.empty}>Nothing is on the stage yet. Tap ADD in the row of buttons at the bottom to open the palette.</Text>;
  }
  return (
    <View style={styles.list}>
      {stageListOrder(p.objects).map((o) => {
        const on = o.id === selectedId;
        const name = stageListName(p, o);
        const where = spLocationWord(o);
        const badges = stageBadges(p, o);
        const grouped = o.groupId ? 'in a group' : '';
        const flag = !spOnStage(o) && !o.offstageOk ? 'the review asks about it' : '';
        const sub = [stageKindName(o.kind), where, grouped, flag].filter(Boolean).join(' · ');
        return (
          <View key={o.id} style={styles.item}>
            <RowCard
              title={name}
              subtitle={sub}
              badges={badges}
              selected={on}
              onPress={() => onSelect(on ? null : o.id)}
              a11yLabel={`${name}, ${sub}${badges.length ? `, ${badges.join(', ')}` : ''}. ${on ? 'Selected: its position buttons and details are under this row. Press to deselect it.' : 'Press to select it and to move or edit it without dragging.'}`}
            />
            {on ? (
              <View style={styles.inspector}>
                <StageInspector id={o.id} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  item: { gap: 0 },
  inspector: { borderWidth: 1, borderTopWidth: 0, borderColor: colors.amber, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: '#101014', padding: 12, marginTop: -4, paddingTop: 16 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSub },
});
