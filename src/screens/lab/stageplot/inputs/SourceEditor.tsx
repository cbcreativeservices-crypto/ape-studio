/**
 * stageplot/inputs/SourceEditor — one SOURCE (a drum kit, a keyboard, a
 * voice): its name, its kind, who plays it, and whether it reaches the sound
 * system at all.
 *
 * "No sound system connection needed" keeps an acoustic or self-contained
 * instrument on the stage without adding to the input count. Turning the
 * connection off on a source that HAS inputs removes those inputs, so that
 * step is asked first, in place, with the rows named.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { SP_CATEGORY_ORDER, SP_CATEGORY_WORD } from '../../../../features/stageplot/spCatalog';
import { spBadge } from '../../../../features/stageplot/spDerive';
import { spAddInput, spObjectOfSource, spRemoveSource, spSource, spUpdateSource } from '../../../../features/stageplot/spModel';
import type { SpCategory, SpId } from '../../../../features/stageplot/spTypes';
import { useSpEditor } from '../spContext';
import { Button, Choice, Note, Switch, TextField } from '../spForm';
import { Lines, RemoveStep, SheetBody, Small, SubTitle, bitStyles } from './bits';
import { spPeopleOptions, spUniqueLabel } from './inputsLogic';

const CATEGORY = SP_CATEGORY_ORDER.map((value) => ({ value, label: SP_CATEGORY_WORD[value] }));
type Reason = 'acoustic' | 'self-contained' | '';
const REASON: { value: Reason; label: string }[] = [
  { value: 'acoustic', label: 'Acoustic: heard without the sound system' },
  { value: 'self-contained', label: 'Self-contained: it has its own sound' },
  { value: '', label: 'To be confirmed' },
];

export function SourceEditor({
  sourceId,
  onClose,
  onLeaveForStage,
  onOpenInput,
  onAddPackage,
}: {
  sourceId: SpId;
  onClose: () => void;
  /** LOCATE ON THE STAGE was pressed: the popup closes and the stage opens. */
  onLeaveForStage: () => void;
  onOpenInput: (id: SpId) => void;
  onAddPackage: (sourceId: SpId) => void;
}) {
  const ed = useSpEditor();
  const p = ed.project;
  const source = spSource(p, sourceId);
  const [askNone, setAskNone] = useState(false);

  if (!source) {
    return (
      <SheetBody>
        <Note>This source is no longer in your stage plot.</Note>
        <Button label="CLOSE" onPress={onClose} />
      </SheetBody>
    );
  }

  const inputs = p.inputs.filter((i) => i.sourceId === sourceId);
  const object = spObjectOfSource(p, sourceId);
  const connected = source.connection === 'inputs';
  const people = spPeopleOptions(p);

  const setConnection = (on: boolean) => {
    if (on === connected) return;
    if (!on && inputs.length) {
      setAskNone(true);
      return;
    }
    ed.apply((q) => spUpdateSource(q, sourceId, { connection: on ? 'inputs' : 'none' }));
  };
  const addOne = () => {
    const row = { label: spUniqueLabel(p.inputs.map((i) => i.label), source.label), capture: 'mic', equipment: '', stand: 'none' } as const;
    const made = spAddInput(p, sourceId, row);
    ed.apply((q) => spAddInput(q, sourceId, row).p);
    if (made.id) onOpenInput(made.id);
  };
  const locate = () => {
    onLeaveForStage();
    ed.goTo('stage', object ? { kind: 'object', id: object.id } : { kind: 'source', id: sourceId });
  };
  const remove = () => {
    ed.apply((q) => spRemoveSource(q, sourceId));
    onClose();
  };

  return (
    <SheetBody>
      <TextField label="Name of the source" value={source.label} onCommit={(t) => (t && t !== source.label ? ed.apply((q) => spUpdateSource(q, sourceId, { label: t })) : undefined)} placeholder="Drum kit, Keys, Lead vocal" />
      <Choice<SpCategory>
        label="Kind of source"
        value={source.category}
        options={CATEGORY}
        onChange={(category) => (category === source.category ? undefined : ed.apply((q) => spUpdateSource(q, sourceId, { category })))}
        hint="Used by SORT IN THE USUAL ORDER and by the counts in the summary."
      />
      <Choice<string>
        label="Who plays or sings it"
        value={source.performerId ?? ''}
        options={people}
        onChange={(v) => (v === (source.performerId ?? '') ? undefined : ed.apply((q) => spUpdateSource(q, sourceId, { performerId: v || null })))}
        hint={inputs.length > 1 ? `This is the performer for all ${inputs.length} inputs of ${source.label}.` : 'Add performers in SETUP.'}
      />

      <Switch
        label="Connects to the sound system"
        value={connected}
        onChange={setConnection}
        hint="Off means: No sound system connection needed. The source stays on the stage and adds no input."
      />
      {askNone ? (
        <View style={bitStyles.gap}>
          <Note tone="warning">
            {source.label} has {inputs.length === 1 ? 'one input' : `${inputs.length} inputs`}. Marking it as “No sound system connection needed” removes {inputs.length === 1 ? 'that input' : 'those inputs'} from the list. You can undo it afterward.
          </Note>
          <Lines lines={inputs.map((i) => `${spBadge(p, i.id)} ${i.label}`)} />
          <Button
            label={inputs.length === 1 ? 'REMOVE THE INPUT AND MARK IT' : `REMOVE THE ${inputs.length} INPUTS AND MARK IT`}
            tone="danger"
            onPress={() => {
              setAskNone(false);
              ed.apply((q) => spUpdateSource(q, sourceId, { connection: 'none' }));
            }}
          />
          <Button label="KEEP THE INPUTS" tone="plain" onPress={() => setAskNone(false)} />
        </View>
      ) : null}
      {!connected ? (
        <Choice<Reason>
          label="Why it needs no connection"
          value={source.noneReason ?? ''}
          options={REASON}
          onChange={(v) => (v === (source.noneReason ?? '') ? undefined : ed.apply((q) => spUpdateSource(q, sourceId, { noneReason: v || null })))}
        />
      ) : null}

      {connected ? (
        <View style={bitStyles.gap}>
          <SubTitle>Its inputs</SubTitle>
          {inputs.length ? (
            <Lines lines={inputs.map((i) => `${spBadge(p, i.id)} ${i.label}`)} />
          ) : (
            <Note tone="warning">{source.label} has no input yet. Add its inputs, or switch the connection off if it is acoustic or self-contained.</Note>
          )}
          <Button label="ADD INPUTS FROM A PACKAGE" onPress={() => onAddPackage(sourceId)} a11yLabel={`Add inputs to ${source.label} from a package`} />
          <Button label="ADD ONE INPUT" tone="plain" onPress={addOne} a11yLabel={`Add one input to ${source.label}`} />
        </View>
      ) : null}

      <View style={bitStyles.gap}>
        <SubTitle>On the stage</SubTitle>
        <Small>{object ? 'It has a place on the drawing.' : source.offstage ? 'Off the stage on purpose.' : 'Not on the stage yet.'}</Small>
        <Button label={object ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'} onPress={locate} a11yLabel={object ? `Locate ${source.label} on the stage` : `Go to the stage to place ${source.label}`} />
        <Switch
          label="Off the stage on purpose"
          value={source.offstage}
          onChange={(offstage) => (offstage === source.offstage ? undefined : ed.apply((q) => spUpdateSource(q, sourceId, { offstage })))}
          hint="For a source that is somewhere else, such as a playback device at the mixing position. The review then stops asking where it is."
        />
        <TextField
          label="Stage location note"
          value={source.locationNote}
          onCommit={(t) => (t === source.locationNote ? undefined : ed.apply((q) => spUpdateSource(q, sourceId, { locationNote: t })))}
          multiline
          hint="Optional, in your own words."
        />
      </View>

      <RemoveStep
        label="REMOVE THIS SOURCE"
        question={`Remove ${source.label}${inputs.length ? ` and its ${inputs.length === 1 ? 'input' : `${inputs.length} inputs`}` : ''}? Anything drawn for it on the stage stays as a drawing.`}
        yes="YES, REMOVE IT"
        onRemove={remove}
      />
    </SheetBody>
  );
}
