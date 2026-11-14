/**
 * stageplot/inputs/BoxPanel — NUMBERED STAGE BOXES (owner GO 2026-11-13: "the
 * ability to place where stage boxes are"). A stage box is the box on the
 * stage the input cables plug into: a digital stage box sends its inputs to
 * the console over one network cable; an analog one is the end of a
 * multicore cable (a snake). Each box has a name (SB1, SB2…), a number of
 * input sockets as sold, optional returns, and a place on the stage drawing.
 *
 *   • AUTO-ASSIGN fills sockets in channel order on the box nearest each
 *     source (spAutoAssignBoxes). It never moves a socket chosen by hand, and
 *     one UNDO puts every socket back.
 *   • THE PATCH SUMMARY: each box with its sockets used and free.
 *   • A socket is chosen by hand in the input's own editor.
 *
 * Every change is one spModel edit through the editor's `apply`.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { SP_SUPPLIER_WORD } from '../../../../features/stageplot/spCatalog';
import { spBoxLine, spBoxSizeWords, spBoxUse, spBoxUseWords } from '../../../../features/stageplot/spDerive';
import { SP_BOX_MAX, SP_BOX_SIZES, spAddBox, spAutoAssignBoxes, spBox, spBoxName, spBoxObject, spLocationWord, spRemoveBox, spUpdateBox } from '../../../../features/stageplot/spModel';
import type { SpId, SpStageBox, SpSupplier } from '../../../../features/stageplot/spTypes';
import { useSpEditor } from '../spContext';
import { Button, Choice, Count, FocusMark, HelpTip, Note, NumberField, RowCard, Section, TextField } from '../spForm';
import { Lines, RemoveStep, SheetBody, Small, SubTitle, bitStyles } from './bits';
import { SP_SUPPLIERS, spBoxSocketLines } from './inputsLogic';

const SUPPLIER: { value: SpSupplier; label: string }[] = SP_SUPPLIERS.map((value) => ({ value, label: SP_SUPPLIER_WORD[value] }));
const KIND: { value: SpStageBox['kind']; label: string }[] = [
  { value: 'digital', label: 'Digital stage box' },
  { value: 'analog', label: 'Analog box on a multicore (snake)' },
  { value: 'unknown', label: 'To be confirmed' },
];
// (a size not sold as one of these is typed in the field under them: no chip is lit then)
const SIZES: { value: string; label: string }[] = SP_BOX_SIZES.map((n) => ({ value: String(n), label: `${n} inputs` }));

export const SP_BOX_HELP =
  'A stage box is where the cables from your microphones and DI devices plug in on the stage. A digital stage box has the microphone preamplifiers inside it: the engineer sets their gain from the console, and the box sends every input over a network cable (often two, for safety). It works only with a console that speaks the same format. An analog box is the end of a snake (a multicore cable) with one pair of wires for each channel. Both kinds often have returns: outputs that bring monitor mixes back to wedges or amplifiers. Boxes are sold by their number of input sockets: 16 x 8 means 16 inputs and 8 returns. A small box by the drums that plugs into the main box is a sub-snake: it keeps cables short.';

export function BoxPanel({ selectedId, onOpen }: { selectedId: SpId | null; onOpen: (boxId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const uses = spBoxUse(p);
  /** What the last AUTO-ASSIGN did, said in words under it. */
  const [said, setSaid] = useState<string | null>(null);

  const add = () => {
    const made = spAddBox(p);
    ed.apply((q) => spAddBox(q).p);
    setSaid(null);
    onOpen(made.id);
  };
  const auto = () => {
    const r = spAutoAssignBoxes(p);
    ed.apply((q) => spAutoAssignBoxes(q).p);
    setSaid(
      [
        `${r.placed === 1 ? '1 input has' : `${r.placed} inputs have`} a socket chosen by AUTO-ASSIGN.${uses.length > 1 ? ' Each input goes to the box nearest it, so the list can move between boxes.' : ''}`,
        r.left ? `${r.left === 1 ? '1 input still has' : `${r.left} inputs still have`} no socket: every box is full. Add a box, or choose a box with more sockets.` : '',
        r.wireless ? `${r.wireless === 1 ? '1 wireless input was' : `${r.wireless} wireless inputs were`} left for you: a receiver plugs in where its rack is, not where the singer stands. Choose the box by the rack in the input’s editor, or Console direct when the receivers are at FOH.` : '',
        'UNDO puts every socket back.',
      ]
        .filter(Boolean)
        .join(' '),
    );
  };
  const used = uses.reduce((n, u) => n + u.used.length, 0);
  const free = uses.reduce((n, u) => n + u.free, 0);

  return (
    <Section title="STAGE BOXES" hint="The boxes on the stage that your input cables plug into, and which socket each input uses.">
      <HelpTip title="Stage boxes, snakes and sockets" body={SP_BOX_HELP} />
      {uses.length ? (
        <View style={bitStyles.counts}>
          <Count value={uses.length} label={uses.length === 1 ? 'stage box' : 'stage boxes'} />
          <Count value={used} label={used === 1 ? 'socket used' : 'sockets used'} />
          <Count value={free} label={free === 1 ? 'socket free' : 'sockets free'} />
        </View>
      ) : (
        <Small>No stage box yet. Add one when you know where the cables plug in on the stage: the input list then says the box and socket of each input.</Small>
      )}
      {uses.map((u) => {
        const o = spBoxObject(p, u.box.id);
        const where = o ? spLocationWord(o, p.stage) : 'Not on the stage yet';
        return (
          <RowCard
            key={u.box.id}
            title={spBoxName(u.box)}
            subtitle={`${spBoxSizeWords(u.box)} · ${spBoxUseWords(u)} · ${where}`}
            badges={u.doubled.length || u.over.length ? ['NEEDS A CORRECTION'] : undefined}
            selected={selectedId === u.box.id}
            onPress={() => onOpen(u.box.id)}
            a11yLabel={`${spBoxLine(u)}. ${where}. Opens this stage box to edit it.`}
          />
        );
      })}
      <Button label="ADD A STAGE BOX" tone={uses.length ? 'plain' : 'primary'} onPress={add} a11yLabel="Add a stage box with 16 input sockets, and its symbol on the stage" />
      {uses.length && p.inputs.length ? (
        <>
          <Button label="AUTO-ASSIGN SOCKETS" tone="primary" onPress={auto} a11yLabel="Give every input with no socket the next free socket, in channel order, on the stage box nearest to it. Sockets you chose by hand are not moved." />
          <Small>AUTO-ASSIGN SOCKETS gives each input with no socket the next free socket on the box nearest to it, in channel order. Sockets you chose yourself, and inputs set to Console direct, are left alone. UNDO puts every socket back.</Small>
        </>
      ) : null}
      {said ? <Note>{said}</Note> : null}
    </Section>
  );
}

export function BoxEditor({ boxId, onClose, onLeaveForStage }: { boxId: SpId; onClose: () => void; onLeaveForStage: () => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const b = spBox(p, boxId);
  if (!b) {
    return (
      <SheetBody>
        <Note>This stage box is no longer in the list.</Note>
        <Button label="CLOSE" onPress={onClose} />
      </SheetBody>
    );
  }
  const set = (patch: Partial<Omit<SpStageBox, 'id'>>) => ed.apply((q) => spUpdateBox(q, boxId, patch));
  const o = spBoxObject(p, boxId);
  const plugged = p.inputs.filter((i) => i.box?.boxId === boxId).length;
  const sizeValue = String(b.inputs);
  const lines = spBoxSocketLines(p, boxId);
  const over = p.inputs.filter((i) => i.box?.boxId === boxId && i.box.socket > b.inputs).length;

  return (
    <SheetBody>
      {/* what to do next, while nothing is plugged in yet (learner review) */}
      {!plugged ? <Note>{`Next: move ${spBoxName(b)} to where the box really stands (${o ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'}, below), then tap AUTO-ASSIGN SOCKETS under STAGE BOXES.${o ? ` For now it stands at: ${spLocationWord(o, p.stage)}.` : ''}`}</Note> : null}
      <TextField label="Name of this stage box" value={b.name} onCommit={(t) => (t.trim() && t.trim() !== b.name ? set({ name: t.trim() }) : undefined)} placeholder="SB1" hint="Printed beside its symbol on the plot, and with each socket in the input list (SB1 · 7)." />
      <Choice label="Input sockets" value={sizeValue} options={SIZES} onChange={(v) => (Number(v) === b.inputs ? undefined : set({ inputs: Number(v) }))} hint="Choose the size it is sold as, or type another size below." />
      <NumberField label="Another size (input sockets)" value={b.inputs} min={1} max={SP_BOX_MAX} onCommit={(n) => (n == null || n === b.inputs ? undefined : set({ inputs: n }))} width="half" />
      {over ? <Note tone="warning">{`${over === 1 ? '1 input is' : `${over} inputs are`} on a socket past ${b.inputs}. Move ${over === 1 ? 'it' : 'them'} in the input’s editor, or choose a size with more sockets.`}</Note> : null}
      <NumberField label="Returns (outputs to the stage), if known" value={b.returns} min={0} max={SP_BOX_MAX} onCommit={(n) => (n === b.returns ? undefined : set({ returns: n }))} hint="Outputs that bring monitor mixes back to wedges or amplifiers. Leave it empty if you do not know." width="half" />
      <Choice<SpStageBox['kind']> label="Digital or analog" value={b.kind} options={KIND} onChange={(kind) => (kind === b.kind ? undefined : set({ kind }))} hint="Digital: one network cable to the console. Analog: a multicore cable with one pair of wires for each channel." />
      <FocusMark k="supplier">
        <Choice<SpSupplier> label="Who brings it" value={b.supplier} options={SUPPLIER} onChange={(supplier) => (supplier === b.supplier ? undefined : set({ supplier }))} hint="Usually the venue (the house snake), or the band when it brings its own console and stage box. A band’s digital box must speak the same format as the console it connects to: say which in the note." />
      </FocusMark>
      <TextField label="Note" value={b.note} onCommit={(t) => (t === b.note ? undefined : set({ note: t }))} multiline placeholder="Upstage right, by the drum riser" />

      <View style={bitStyles.gap}>
        <SubTitle>{`Sockets of ${spBoxName(b)}`}</SubTitle>
        {plugged ? <Lines lines={lines} /> : <Small>Nothing is plugged in yet. Use AUTO-ASSIGN SOCKETS under STAGE BOXES, or choose a socket in an input’s editor.</Small>}
      </View>

      <View style={bitStyles.gap}>
        <SubTitle>On the stage</SubTitle>
        <Small>{o ? spLocationWord(o, p.stage) : 'Not on the stage yet. Place it where the box really stands, so AUTO-ASSIGN can choose the nearest box.'}</Small>
        <Button
          label={o ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'}
          onPress={() => {
            onLeaveForStage();
            ed.goTo('stage', o ? { kind: 'object', id: o.id } : { kind: 'box', id: boxId });
          }}
          a11yLabel={o ? `Locate ${spBoxName(b)} on the stage` : `Go to the stage to place ${spBoxName(b)}`}
        />
      </View>

      <RemoveStep
        label="REMOVE THIS STAGE BOX"
        question={`Remove ${spBoxName(b)}?${o ? ' Its symbol leaves the stage.' : ''}${plugged ? ` ${plugged === 1 ? 'The input plugged into it then has' : `The ${plugged} inputs plugged into it then have`} no socket.` : ''}`}
        yes="YES, REMOVE IT"
        onRemove={() => {
          ed.apply((q) => spRemoveBox(q, boxId));
          onClose();
        }}
      />
    </SheetBody>
  );
}
