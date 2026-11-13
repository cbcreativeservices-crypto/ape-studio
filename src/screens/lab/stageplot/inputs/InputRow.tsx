/**
 * stageplot/inputs/InputRow — ONE BLOCK of the input list: a single input,
 * or the two sides of a stereo pair, with one set of move buttons.
 *
 * The list is a phone screen, not a spreadsheet. A row says, at one glance:
 * the channel number, the name, who plays it and where, how it is captured
 * and on what stand. A stereo side is marked L or R in words, a click or cue
 * carries MONITOR ONLY, and two rows with one number both say SAME NUMBER.
 * Tapping a row opens its editor; the ▲ ▼ buttons (44 pt each, no drag
 * needed) move the block, and a pair moves as one.
 *
 * The move buttons are SIBLINGS of the row, never inside it: a Pressable
 * inside a Pressable hides the inner one from a screen reader. Each state is
 * given twice, as `accessibilityState` and as its `aria-` prop, because the
 * web build carries only the second to the page.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fitValue } from '../../../../theme/legibility';
import { colors, fonts } from '../../../../theme/tokens';
import { Tag } from './bits';
import type { SpRowBlock, SpRowView } from './inputsLogic';

const NUM_SIZE = 22;

function RowBody({ view, selected, onOpen }: { view: SpRowView; selected: boolean; onOpen: (id: string) => void }) {
  return (
    <Pressable
      onPress={() => onOpen(view.id)}
      style={[styles.row, selected ? styles.rowSelected : null]}
      accessibilityRole="button"
      accessibilityLabel={`${view.a11y} Opens this input to edit it.`}
      accessibilityState={{ selected }}
      aria-selected={selected}
    >
      <View style={styles.numBox}>
        <Text style={styles.num} {...fitValue(NUM_SIZE)}>
          {view.number}
        </Text>
        {selected ? <Text style={styles.numMark}>▸</Text> : null}
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{view.label}</Text>
        <Text style={styles.who}>
          {view.who} · {view.where}
        </Text>
        <Text style={styles.how}>
          {view.capture} · {view.stand}
        </Text>
        <Text style={styles.how}>
          {view.supplier}
          {view.venue ? ` · Venue channel: ${view.venue}` : ''}
        </Text>
        <View style={styles.tags}>
          {view.sameNumberAs.length ? <Tag tone="warn" text="! SAME NUMBER" /> : null}
          {view.side ? <Tag tone="pair" text={view.side === 'L' ? 'L · LEFT' : 'R · RIGHT'} /> : null}
          {view.monitorOnly ? <Tag tone="warn" text="MONITOR ONLY: kept out of the audience mix" /> : null}
          {view.cueToAudience && !view.cueAudienceOk ? <Tag tone="warn" text="CLICK OR CUE: set to go to the audience mix" /> : null}
          {view.cueAudienceOk ? <Tag text="CLICK OR CUE: the audience is meant to hear it" /> : null}
          {view.audienceTbc ? <Tag text="AUDIENCE MIX: to be confirmed" /> : null}
          {view.required ? <Tag text="REQUIRED" /> : null}
          {view.pairBroken ? <Tag tone="warn" text="OTHER SIDE MISSING" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function InputBlock({ block, selectedIds, onOpen, onMove }: { block: SpRowBlock; selectedIds: ReadonlySet<string>; onOpen: (id: string) => void; onMove: (id: string, by: -1 | 1) => void }) {
  const first = block.rows[0];
  return (
    <View style={[styles.block, block.pair ? styles.blockPair : null]}>
      <View style={styles.rows}>
        {block.pair ? (
          <View style={styles.pairLine}>
            <Text style={styles.pairHead}>STEREO PAIR</Text>
            <Text style={styles.pairNote}>The two rows move as one.</Text>
          </View>
        ) : null}
        {block.rows.map((view) => (
          <RowBody key={view.id} view={view} selected={selectedIds.has(view.id)} onOpen={onOpen} />
        ))}
      </View>
      <View style={styles.moveCol}>
        <Pressable
          onPress={() => onMove(first.id, -1)}
          disabled={!block.canUp}
          style={[styles.moveButton, block.canUp ? null : styles.moveButtonOff]}
          accessibilityRole="button"
          accessibilityLabel={`Move ${block.moves} up`}
          accessibilityState={{ disabled: !block.canUp }}
          aria-disabled={!block.canUp}
        >
          <Text style={[styles.moveGlyph, block.canUp ? null : styles.moveGlyphOff]}>▲</Text>
        </Pressable>
        <Pressable
          onPress={() => onMove(first.id, 1)}
          disabled={!block.canDown}
          style={[styles.moveButton, block.canDown ? null : styles.moveButtonOff]}
          accessibilityRole="button"
          accessibilityLabel={`Move ${block.moves} down`}
          accessibilityState={{ disabled: !block.canDown }}
          aria-disabled={!block.canDown}
        >
          <Text style={[styles.moveGlyph, block.canDown ? null : styles.moveGlyphOff]}>▼</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  blockPair: { borderLeftWidth: 3, borderLeftColor: colors.cyanBright, paddingLeft: 6 },
  rows: { flex: 1, gap: 6 },
  pairLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8 },
  pairHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.cyanBright },
  pairNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  row: { flexGrow: 1, flexDirection: 'row', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#141414', minHeight: 64 },
  rowSelected: { borderColor: colors.amber, borderWidth: 2, backgroundColor: '#1b1810' },
  numBox: { width: 42, alignItems: 'center', gap: 2 },
  num: { fontFamily: fonts.mono, fontSize: NUM_SIZE, color: colors.amber, textAlign: 'center', width: 42 },
  numMark: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.amber },
  text: { flex: 1, gap: 3 },
  label: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, lineHeight: 22, color: colors.textPrimary },
  who: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  how: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  moveCol: { justifyContent: 'center', gap: 6 },
  moveButton: { width: 44, minHeight: 44, flexGrow: 1, borderRadius: 8, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  moveButtonOff: { borderColor: colors.hairlineDim, backgroundColor: '#0f0f0f' },
  moveGlyph: { fontFamily: fonts.barlowSemiBold, fontSize: 16, color: colors.textPrimary },
  moveGlyphOff: { color: '#4a4a4a' },
});
