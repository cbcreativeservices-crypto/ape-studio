/**
 * StageMovePad — the POSITION and TURN buttons of one stage object, small
 * enough to stand in the dock's OBJECT tray UNDER THE PINNED DRAWING (visual
 * review 2, B10: in the popup these buttons had no visible effect, because
 * the popup covered the stage; "a control with no visible effect").
 *
 * Two rows of four: move one step toward stage right, upstage, downstage,
 * stage left (in the order the drawing has them, left to right); turn 15°
 * either way, face the audience, face upstage. Every button is 44 points
 * high, says what it does in words as well as with its arrow, and makes one
 * spModel edit (one undo step). A move button moves ONE axis: the other
 * stays exactly where it was.
 *
 * The same pad is in the list of objects under the drawing (the selected
 * row), so the list alternative to dragging and the dock agree.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spObject, spUpdateObject } from '../../../../features/stageplot/spModel';
import type { SpId } from '../../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../../theme/tokens';
import { useSpEditor } from '../spContext';
import { stageFacingWord, stagePosWords } from './stageGeom';
import { stageListName, stageNudge } from './stageLinks';

function PadButton({ glyph, word, a11y, onPress }: { glyph?: string; word: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={a11y}>
      {glyph ? <Text style={styles.glyph}>{glyph}</Text> : null}
      <Text style={styles.word}>{word}</Text>
    </Pressable>
  );
}

export function StageMovePad({ id }: { id: SpId }) {
  const ed = useSpEditor();
  const p = ed.project;
  const o = spObject(p, id);
  if (!o) return null;
  const name = stageListName(p, o);
  const nudge = (dx: number, dy: number) => ed.apply((q) => stageNudge(q, id, dx, dy));
  const turn = (rot: number) => ed.apply((q) => spUpdateObject(q, id, { rot }));
  const grouped = !!o.groupId;
  return (
    <View style={styles.pad}>
      <Text style={styles.line} accessibilityLiveRegion="polite">{`${stagePosWords(p, o)}. ${o.rot}°, ${stageFacingWord(o.rot)}.`}</Text>
      <Text style={styles.caption}>{`MOVE ONE ${p.stage.snap ? 'GRID STEP' : 'SMALL STEP'}${grouped ? ' (ITS GROUP MOVES WITH IT)' : ''}`}</Text>
      <View style={styles.row}>
        <PadButton glyph="◀" word="STAGE RIGHT" a11y={`Move ${name} one step toward stage right`} onPress={() => nudge(-1, 0)} />
        <PadButton glyph="▲" word="UPSTAGE" a11y={`Move ${name} one step upstage`} onPress={() => nudge(0, -1)} />
        <PadButton glyph="▼" word="DOWNSTAGE" a11y={`Move ${name} one step downstage, toward the audience`} onPress={() => nudge(0, 1)} />
        <PadButton glyph="▶" word="STAGE LEFT" a11y={`Move ${name} one step toward stage left`} onPress={() => nudge(1, 0)} />
      </View>
      <Text style={styles.caption}>TURN</Text>
      <View style={styles.row}>
        <PadButton glyph="↺" word="15°" a11y={`Turn ${name} 15 degrees counterclockwise`} onPress={() => turn(o.rot - 15)} />
        <PadButton glyph="↻" word="15°" a11y={`Turn ${name} 15 degrees clockwise`} onPress={() => turn(o.rot + 15)} />
        <PadButton word="FACE THE AUDIENCE" a11y={`Turn ${name} to face the audience`} onPress={() => turn(0)} />
        <PadButton word="FACE UPSTAGE" a11y={`Turn ${name} to face upstage`} onPress={() => turn(180)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  line: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  caption: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSub },
  button: { flex: 1, minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: '#3a3a42', backgroundColor: '#141418', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 4, gap: 1 },
  pressed: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  glyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 18, color: colors.amber },
  word: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.6, color: colors.textPrimary, textAlign: 'center' },
});
