/**
 * stageplot/inputs/OrderPanel — the whole-list order tools for one channel
 * list: the usual order (a convenience, never called a standard), Renumber
 * with or without the reserved channels, and the reserved channels as typed.
 *
 * A revision that was marked ready or shared says so first: the next change to the
 * order or to a number starts a new revision, and the packet shows it. The
 * venue's own channels are never touched from here.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { spPatch, spRenumber, spSetReserved, spSortConventional } from '../../../../features/stageplot/spModel';
import { spNumbersFollowOrder } from '../../../../features/stageplot/spReview';
import type { SpPatchId } from '../../../../features/stageplot/spTypes';
import { confirmDialog } from '../../../../lib/confirm';
import { useSpEditor } from '../spContext';
import { Button, Note, Section, Switch, TextField } from '../spForm';
import { Small, bitStyles } from './bits';
import { SP_MAX_CHANNEL, spInSentence, spParseReserved, spReservedText, spSharedNotice } from './inputsLogic';

/** "Keep reserved channels free" is a choice of this screen, not of the
 *  document: it is remembered while the app is open, so a visit to another
 *  area does not turn it back on. */
const keepReservedChoice: Partial<Record<SpPatchId, boolean>> = {};

export function OrderPanel({ patchId }: { patchId: SpPatchId }) {
  const ed = useSpEditor();
  const p = ed.project;
  const patch = spPatch(p, patchId);
  const [keepReserved, setKeepReservedState] = useState(keepReservedChoice[patchId] ?? true);
  const setKeepReserved = (on: boolean) => {
    keepReservedChoice[patchId] = on;
    setKeepReservedState(on);
  };
  const [rejected, setRejected] = useState<string[]>([]);
  if (!patch || !patch.order.length) return null;

  const shared = spSharedNotice(p);
  const inStep = spNumbersFollowOrder(p, patchId);
  const reserved = spReservedText(patch.reserved);

  /** A whole-list change on a revision that was marked ready or shared is asked first. */
  const whole = (title: string, yes: string, run: () => void) => {
    if (!shared) {
      run();
      return;
    }
    confirmDialog(title, shared, yes, run);
  };
  const sort = () => whole('Sort a stage plot that may have been sent?', 'Sort the list', () => ed.apply((q) => spSortConventional(q, patchId, { keepReserved })));
  const renumber = () => whole('Renumber a stage plot that may have been sent?', 'Renumber', () => ed.apply((q) => spRenumber(q, patchId, { keepReserved })));

  const commitReserved = (text: string) => {
    const read = spParseReserved(text);
    setRejected(read.rejected);
    if (read.numbers.join(',') === patch.reserved.join(',')) return;
    ed.apply((q) => spSetReserved(q, patchId, read.numbers));
  };

  return (
    <Section title="ORDER OF THE INPUT LIST" hint={`For the ${spInSentence(patch.name)} list. Use the ▲ and ▼ buttons on a row to move one input. The buttons below change the whole list.`}>
      {shared ? <Note tone="warning">{shared}</Note> : null}
      <View style={bitStyles.gap}>
        <Button label="SORT IN THE USUAL ORDER" onPress={sort} a11yLabel={`Sort the ${spInSentence(patch.name)} list in the usual order`} />
        <Small>Drums, percussion, bass, guitars, keys, horns, playback, other sources, then vocals. This is a convenience, not a house standard: a venue may use another order.</Small>
      </View>
      <View style={bitStyles.gap}>
        <Button label="RENUMBER" onPress={renumber} a11yLabel={`Renumber the ${spInSentence(patch.name)} list from 1 in its present order`} />
        <Small>
          Numbers the list 1, 2, 3 in its present order. {inStep ? 'The numbers follow the order now.' : 'Some numbers do not follow the order now, or are missing.'} Gaps you typed are closed; reserved channels can stay free.
        </Small>
        <Switch
          label="Keep reserved channels free"
          value={keepReserved}
          onChange={setKeepReserved}
          hint={!patch.reserved.length ? 'No channel is reserved yet.' : keepReserved ? `SORT IN THE USUAL ORDER and RENUMBER skip ${reserved}.` : `Reserved: ${reserved}. They are not kept free while this is off. An input given one of them is a review question, to settle before Ready to advance.`}
        />
      </View>
      <TextField
        label="Reserved channels"
        value={reserved}
        onCommit={commitReserved}
        placeholder="7, 15-16"
        hint="Channel numbers you keep free on purpose. Type numbers and ranges, such as 7, 15-16."
      />
      {rejected.length ? <Note tone="warning">Not read as a channel number: {rejected.join(', ')}. Use whole numbers from 1 to {SP_MAX_CHANNEL}.</Note> : null}
    </Section>
  );
}
