/**
 * InsideOffer — OBJECTS ACROSS A NEW OUTLINE (owner 2026-11-13: build the
 * remaining held items). After the stage's shape changes, the objects that
 * now stand across its edge (or outside it, when the change put them there)
 * are named, with ONE button: MOVE THEM INSIDE. It is one edit, so one UNDO
 * puts them all back. Nothing is ever moved without the button.
 *
 * Shown in Setup under the shape, and on the Stage under the drawing.
 */
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { spAcrossOutline, spMoveInside, spWhollyOn } from '../../../features/stageplot/spInside';
import type { SpId, SpProject } from '../../../features/stageplot/spTypes';
import { colors, fonts } from '../../../theme/tokens';
import { useSpEditor } from './spContext';
import { Button, Note } from './spForm';
import { stageListName } from './stage/stageLinks';

/** The objects the last change of shape put outside the stage, per plot
 *  (Setup notes them; a screen preference, never saved). */
const displaced: Record<string, SpId[]> = {};
export function noteDisplaced(projectId: string, ids: readonly SpId[]): void {
  displaced[projectId] = [...new Set([...(displaced[projectId] ?? []), ...ids])];
}

const joinAnd = (list: string[]): string => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

/** What the offer names: the objects across the edge now, and those the last
 *  change of shape put outside it (while they are still not on the stage). */
export function insideOfferIds(p: SpProject): { across: SpId[]; outside: SpId[] } {
  const across = spAcrossOutline(p);
  const outside = (displaced[p.id] ?? []).filter((id) => {
    const o = p.objects.find((x) => x.id === id);
    return !!o && !across.includes(id) && !spWhollyOn(p, o);
  });
  return { across, outside };
}

export function InsideOffer() {
  const ed = useSpEditor();
  const p = ed.project;
  const [done, setDone] = useState<{ projectId: string; words: string } | null>(null);
  const { across, outside } = insideOfferIds(p);
  const name = (id: SpId): string => {
    const o = p.objects.find((x) => x.id === id);
    return o ? stageListName(p, o) : '';
  };
  const ids = [...across, ...outside];
  if (!ids.length) return done && done.projectId === p.id ? <Note tone="good">{done.words}</Note> : null;
  const said = [
    across.length ? `Partly off the stage: ${joinAnd(across.map(name))}.` : '',
    outside.length ? `The new stage shape left ${joinAnd(outside.map(name))} outside the stage.` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const move = () => {
    let moved: SpId[] = [];
    ed.apply((q) => {
      const r = spMoveInside(q, ids);
      moved = r.moved;
      return r.p;
    });
    displaced[p.id] = [];
    const names = moved.map(name).filter(Boolean);
    setDone({ projectId: p.id, words: names.length ? `Moved inside the stage: ${joinAnd(names)}. UNDO puts ${names.length === 1 ? 'it' : 'them'} back.` : 'Nothing could be moved: there is no free place on the stage for it.' });
  };
  return (
    <Note tone="warning">
      <Text style={styles.text}>{said}</Text>
      <Text style={styles.text}>{ids.length === 1 ? 'MOVE IT INSIDE moves it the shortest distance until it is fully on the stage. Nothing else moves, and UNDO puts it back.' : 'MOVE THEM INSIDE moves each one the shortest distance until it is fully on the stage. Nothing else moves, and one UNDO puts them back.'}</Text>
      <Button tone="primary" label={ids.length === 1 ? 'MOVE IT INSIDE' : 'MOVE THEM INSIDE'} a11yLabel={`Move ${joinAnd(ids.map(name))} inside the stage`} onPress={move} />
    </Note>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19.5, color: colors.textSecondary },
});
