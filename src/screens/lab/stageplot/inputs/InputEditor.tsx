/**
 * stageplot/inputs/InputEditor — one input, opened from its row.
 *
 * SIMPLE FIRST. A band member who is not an engineer finishes a basic row
 * with the first fields: name, channel number, how it is captured, what
 * equipment, what stand, who brings it, and whether the audience hears it.
 * Everything else in the handoff's table is under MORE DETAILS.
 *
 * Every field writes through the editor with a named spModel edit, on commit
 * (a text field commits when it is left), and only when the value changed,
 * so a field that was only looked at never starts a new revision.
 *
 * ONE ANSWER TO "WHO BRINGS IT". A DI channel that is on a DI device is
 * brought by whoever brings the device (spInputSupplier), so this editor
 * shows that answer as a line and sends the user to the device to change it:
 * the input and its device can never say two different things.
 *
 * The tool DOCUMENTS. Phantom power is recorded as the band knows it and is
 * never decided from a connector or the word "DI"; no gain, EQ or polarity
 * is suggested anywhere.
 */
import { useState } from 'react';
import { View } from 'react-native';
import {
  SP_AUDIENCE_WORD,
  SP_CAPTURE_WORD,
  SP_DESTINATION_WORD,
  SP_PHANTOM_WORD,
  SP_PRIORITY_WORD,
  SP_STAND_WORD,
  SP_SUPPLIER_WORD,
} from '../../../../features/stageplot/spCatalog';
import {
  spAssignBox,
  spAssignDi,
  spBox,
  spBoxName,
  spBoxVia,
  spBoxes,
  spSetDirect,
  spInput,
  spInputLocation,
  spObjectOfInput,
  spPairRestore,
  spPartner,
  spPatch,
  spPatchesOf,
  spPerformer,
  spRemoveInput,
  spSetNumber,
  spSetVenueChannel,
  spSource,
  spStereoToMono,
  spUpdateInput,
  spUpdateSource,
} from '../../../../features/stageplot/spModel';
import type { SpAudience, SpCapture, SpDestination, SpId, SpInput, SpPatchId, SpPhantom, SpPriority, SpStand, SpSupplier } from '../../../../features/stageplot/spTypes';
import { useSpEditor } from '../spContext';
import { Button, Choice, Fields, FocusMark, MoreDetails, Note, NumberField, Switch, TextField } from '../spForm';
import { Lines, RemoveStep, SheetBody, Small, SubTitle, bitStyles } from './bits';
import { SP_CUE_HINT, SP_MAX_CHANNEL, SP_NOBODY, SP_PHANTOM_HINT, SP_SUPPLIERS, spBoxFreeSocket, spBrokenPairDi, spInSentence, spListWords, spMonoChoice, spPairMonoWithDi, spSameNumber, spSameSocket, spSocketSub } from './inputsLogic';

/** The stage box choice that means "plugs into the console itself". */
const DIRECT = '__direct';

const opts = <T extends string>(words: Record<T, string>, order: readonly T[]): { value: T; label: string }[] => order.map((value) => ({ value, label: words[value] }));

const CAPTURE = opts<SpCapture>(SP_CAPTURE_WORD, ['mic', 'di', 'line', 'wireless', 'custom']);
const STAND = opts<SpStand>(SP_STAND_WORD, ['none', 'straight', 'tall-boom', 'short-boom', 'clamp', 'custom']);
const SUPPLIER = opts<SpSupplier>(SP_SUPPLIER_WORD, SP_SUPPLIERS);
const AUDIENCE = opts<SpAudience>(SP_AUDIENCE_WORD, ['audience', 'monitor-only', 'tbc']);
const PRIORITY = opts<SpPriority>(SP_PRIORITY_WORD, ['preferred', 'required', 'flexible']);
// A value nobody knows yet has one name in this tool: "To be confirmed".
const PHANTOM = opts<SpPhantom>({ ...SP_PHANTOM_WORD, unknown: 'To be confirmed' }, ['required', 'not-required', 'do-not-apply', 'unknown']);
const DESTINATION = opts<SpDestination>(SP_DESTINATION_WORD, ['house', 'band', 'both', 'custom']);
type DiAnswer = 'keep' | 'release' | '';
const DI_ANSWER: { value: DiAnswer; label: string }[] = [
  { value: 'keep', label: 'Keep it on the one channel' },
  { value: 'release', label: 'Take it off this input' },
];
const DI_ANSWER_HINT = 'If you take it off and nothing else uses it, the device leaves the list. The DI channel then has no DI device (DI box) yet.';

type TextKey = 'label' | 'equipment' | 'alternatives' | 'connector' | 'level' | 'adapterNote' | 'standNote' | 'splitNote' | 'notes';

/** One side of a stereo pair is left alone: make it a mono request. When that
 *  side sits on a stereo DI device, what happens to the device is asked
 *  first, the same as for a whole pair. Used in the editor and as the popup
 *  of the review answer, so both ways ask the same question. */
export function PairMonoStep({ inputId, onDone }: { inputId: SpId; onDone?: () => void }) {
  const ed = useSpEditor();
  const [answer, setAnswer] = useState<DiAnswer>('');
  const device = spBrokenPairDi(ed.project, inputId);
  const run = () => {
    ed.apply((q) => spPairMonoWithDi(q, inputId, answer === 'release' ? 'release' : 'keep'));
    onDone?.();
  };
  return (
    <View style={bitStyles.gap}>
      {device ? <Choice<DiAnswer> label={`${device.label} is a stereo DI device. What happens to it`} value={answer} options={DI_ANSWER} onChange={setAnswer} hint={DI_ANSWER_HINT} /> : null}
      <Button label="MAKE THIS A MONO REQUEST" tone={onDone ? 'primary' : 'plain'} onPress={run} disabled={!!device && answer === ''} disabledReason="Choose what happens to the DI device first." />
    </View>
  );
}

export function InputEditor({
  inputId,
  onClose,
  onLeaveForStage,
  onOpenInput,
  onOpenSource,
  onOpenDi,
}: {
  inputId: SpId;
  onClose: () => void;
  /** LOCATE ON THE STAGE was pressed: the popup closes and the stage opens. */
  onLeaveForStage: () => void;
  onOpenInput: (id: SpId) => void;
  onOpenSource: (id: SpId) => void;
  onOpenDi: (id: SpId) => void;
}) {
  const ed = useSpEditor();
  const p = ed.project;
  const input = spInput(p, inputId);
  const [monoOpen, setMonoOpen] = useState(false);
  const [keep, setKeep] = useState<'L' | 'R'>('L');
  const [diChoice, setDiChoice] = useState<DiAnswer>('');

  if (!input) {
    return (
      <SheetBody>
        <Note>This input is no longer in the list.</Note>
        <Button label="CLOSE" onPress={onClose} />
      </SheetBody>
    );
  }

  const source = spSource(p, input.sourceId);
  const performer = spPerformer(p, source?.performerId ?? null);
  const partner = spPartner(p, input);
  const patchIds = spPatchesOf(input);
  const location = spInputLocation(p, inputId);
  const object = spObjectOfInput(p, inputId);
  const siblings = p.inputs.filter((i) => i.sourceId === input.sourceId);
  const mono = input.pairId && partner ? spMonoChoice(p, input.pairId) : null;
  const diDevice = input.capture === 'di' && input.diDeviceId ? p.diDevices.find((d) => d.id === input.diDeviceId) : undefined;
  const cueToAudience = input.cue && input.audience === 'audience';
  const boxes = spBoxes(p);
  const boxOf = input.box ? spBox(p, input.box.boxId) : undefined;
  const sameSocket = spSameSocket(p, inputId);
  // (round 2) a sub-snake plugged into this socket, and where a sub-snake's socket arrives
  const subHere = spSocketSub(p, inputId);
  const via = input.box ? spBoxVia(p, input.box.boxId, input.box.socket) : null;

  const set = (patch: Partial<Omit<SpInput, 'id' | 'sourceId' | 'pairId' | 'side'>>) => ed.apply((q) => spUpdateInput(q, inputId, patch));
  const text = (key: TextKey, keepIfEmpty = false) => (t: string) => {
    if (t === input[key] || (keepIfEmpty && !t)) return;
    set({ [key]: t } as Partial<Pick<SpInput, TextKey>>);
  };
  const number = (patchId: SpPatchId) => (n: number | null) => {
    if (n === (spPatch(p, patchId)?.numbers[inputId] ?? null)) return;
    ed.apply((q) => spSetNumber(q, patchId, inputId, n));
  };
  const venue = (patchId: SpPatchId) => (t: string) => {
    if (t === (spPatch(p, patchId)?.venue[inputId] ?? '')) return;
    ed.apply((q) => spSetVenueChannel(q, patchId, inputId, t));
  };

  const locate = () => {
    onLeaveForStage();
    ed.goTo('stage', object ? { kind: 'object', id: object.id } : { kind: 'input', id: inputId });
  };

  const makeMono = () => {
    if (!mono || !input.pairId) return;
    const pairId = input.pairId;
    const kept = p.inputs.find((i) => i.pairId === pairId && i.side === keep);
    ed.apply((q) => spStereoToMono(q, pairId, { keep, di: diChoice === 'release' ? 'release' : 'keep' }));
    setMonoOpen(false);
    if (kept && kept.id !== inputId) onOpenInput(kept.id);
  };

  const remove = () => {
    ed.apply((q) => spRemoveInput(q, inputId));
    onClose();
  };
  const removeBoth = () => {
    if (!partner) return;
    const other = partner.id;
    ed.apply((q) => spRemoveInput(spRemoveInput(q, inputId), other));
    onClose();
  };

  const removeQuestion = partner
    ? `Remove ${input.label}? ${partner.label} stays in the list, and the review then asks if you want the pair back or a mono request.`
    : siblings.length === 1 && source
      ? `Remove ${input.label}? ${source.label} then has no input, and the review asks if it is acoustic or still needs one.`
      : `Remove ${input.label} from the list? Anything drawn for it on the stage stays as a drawing.`;

  return (
    <SheetBody>
      {input.audience === 'monitor-only' ? <Note tone="warning">MONITOR ONLY: kept out of the audience mix. The packet says so wherever this input appears.</Note> : null}
      {cueToAudience ? (
        <View style={bitStyles.gap}>
          <Note tone="warning">This is a click or cue, and it is set to go to the audience mix. Keep that only if the audience is meant to hear it.</Note>
          <Switch
            label="The audience is meant to hear it"
            value={input.cueAudienceOk}
            onChange={(cueAudienceOk) => (cueAudienceOk === input.cueAudienceOk ? undefined : set({ cueAudienceOk }))}
            hint="On answers the review question. The routing is not changed, and the question comes back if you change who hears it."
          />
        </View>
      ) : null}

      <TextField label="Name of this input" value={input.label} onCommit={text('label', true)} placeholder="Kick, Bass DI, Lead vocal" />
      {patchIds.map((pid) => {
        const patch = spPatch(p, pid);
        const same = spSameNumber(p, pid, inputId);
        const n = patch?.numbers[inputId] ?? null;
        return (
          <View key={pid} style={bitStyles.gap}>
            <NumberField
              label={patchIds.length > 1 ? `Channel number, ${spInSentence(patch?.name ?? pid)}` : 'Channel number'}
              value={n}
              onCommit={number(pid)}
              min={1}
              max={SP_MAX_CHANNEL}
              width="half"
              hint="Your proposed number. You can leave gaps."
            />
            {same.length ? (
              <Note tone="warning">
                Channel {n} is also given to {spListWords(same)}. Give each its own number.
              </Note>
            ) : null}
            {/* said HERE, beside the field, as a duplicate is (R2-SP2-09) */}
            {n != null && patch?.reserved.includes(n) ? (
              <Note tone="warning">
                Channel {n} is kept free on purpose in the {spInSentence(patch.name)} list. Give this input another number, or stop keeping channel {n} free in ORDER OF THE INPUT LIST.
              </Note>
            ) : null}
          </View>
        );
      })}
      <Choice label="How it is captured" value={input.capture} options={CAPTURE} onChange={(capture) => (capture === input.capture ? undefined : set({ capture }))} />
      <TextField
        label={input.capture === 'mic' ? 'Microphone' : 'Equipment'}
        value={input.equipment}
        onCommit={text('equipment')}
        placeholder={input.capture === 'mic' ? 'Model or kind of microphone' : 'Model or kind of equipment'}
        hint={`${input.capture === 'mic' ? 'For example: dynamic vocal microphone. ' : ''}What you type is a preference unless you mark it Required under MORE DETAILS.`}
      />
      <Choice label="Stand or mount" value={input.stand} options={STAND} onChange={(stand) => (stand === input.stand ? undefined : set({ stand }))} />
      {input.stand === 'custom' ? <TextField label="Describe the stand or mount" value={input.standNote} onCommit={text('standNote')} /> : null}
      <FocusMark k="supplier">
      {diDevice ? (
        <View style={bitStyles.gap}>
          <SubTitle>Who brings it</SubTitle>
          <Small>
            {SP_SUPPLIER_WORD[diDevice.supplier]}, with its DI device: {diDevice.label}. A DI channel is brought by whoever brings its device, so you change the answer on the device.
          </Small>
          <Button label="OPEN THE DI DEVICE" tone="plain" onPress={() => onOpenDi(diDevice.id)} a11yLabel={`Open the DI device ${diDevice.label} to change who brings it`} />
        </View>
      ) : (
        <Choice
          label="Who brings it"
          value={input.supplier}
          options={SUPPLIER}
          onChange={(supplier) => (supplier === input.supplier ? undefined : set({ supplier }))}
          hint="The microphone, DI or receiver for this input. The stand can have its own answer under MORE DETAILS."
        />
      )}
      </FocusMark>
      <FocusMark k="audience">
        <Choice label="Who hears it" value={input.audience} options={AUDIENCE} onChange={(audience) => (audience === input.audience ? undefined : set({ audience }))} />
      </FocusMark>

      {/* THE STAGE BOX SOCKET (2026-11-13): only when the plot has boxes */}
      {boxes.length ? (
        <FocusMark k="box">
          <View style={bitStyles.gap}>
            <Choice
              label="Stage box"
              value={input.box ? input.box.boxId : input.direct ? DIRECT : ''}
              options={[{ value: '', label: 'No stage box socket yet' }, ...boxes.map((b) => ({ value: b.id, label: `${spBoxName(b)} (${b.inputs} inputs)` })), { value: DIRECT, label: 'Console direct: no stage box' }]}
              onChange={(v) => {
                if (v === (input.box ? input.box.boxId : input.direct ? DIRECT : '')) return;
                if (v === DIRECT) ed.apply((q) => spSetDirect(q, inputId, true));
                else if (!v) ed.apply((q) => spSetDirect(spAssignBox(q, inputId, null), inputId, false));
                else {
                  // the lowest free socket of that box, chosen by hand
                  const s = spBoxFreeSocket(p, v, inputId) ?? (boxes.find((b) => b.id === v)?.inputs ?? 1);
                  ed.apply((q) => spAssignBox(q, inputId, { boxId: v, socket: s }));
                }
              }}
              hint="Where this input’s cable plugs in on the stage. Console direct: it plugs into the console itself at front of house (FOH), such as a playback laptop, wireless receivers racked at FOH, a talkback microphone or an audience microphone. It still needs a console input."
            />
            {input.box && boxOf ? (
              <>
                <NumberField label={`Socket on ${spBoxName(boxOf)}`} value={input.box.socket} min={1} max={boxOf.inputs} width="half" onCommit={(n) => (n == null || n === input.box?.socket ? undefined : ed.apply((q) => spAssignBox(q, inputId, { boxId: boxOf.id, socket: n })))} hint={`${spBoxName(boxOf)} has sockets 1 to ${boxOf.inputs}.`} />
                <Small>{input.box.byHand ? 'Chosen by you: AUTO-ASSIGN SOCKETS never moves it.' : 'Chosen by AUTO-ASSIGN SOCKETS. Type a socket to choose it yourself.'}</Small>
                {sameSocket.length ? <Note tone="warning">{`Socket ${input.box.socket} of ${spBoxName(boxOf)} is also given to ${spListWords(sameSocket)}. One socket takes one cable: give each its own.`}</Note> : null}
                {input.box.socket > boxOf.inputs ? <Note tone="warning">{`${spBoxName(boxOf)} has ${boxOf.inputs} sockets, so there is no socket ${input.box.socket}. Choose another socket or box.`}</Note> : null}
                {subHere ? <Note tone="warning">{`${spBoxName(subHere)} plugs into socket ${input.box.socket} of ${spBoxName(boxOf)}. One socket takes one cable: choose another socket.`}</Note> : null}
                {via?.steps.length && !via.past ? <Small>{`${spBoxName(boxOf)} is a sub-snake: this socket arrives at ${via.steps.map((x) => `${spBoxName(x.box)} · ${x.socket}`).join(', then ')}.`}</Small> : null}
                {via?.past ? <Note tone="warning">{`${spBoxName(boxOf)} is a sub-snake, and its cable to ${spBoxName(via.past)} does not carry socket ${input.box.socket}. Choose a lower socket, or give the sub-snake more sockets of ${spBoxName(via.past)} in its stage box editor.`}</Note> : null}
              </>
            ) : null}
          </View>
        </FocusMark>
      ) : null}

      <View style={bitStyles.gap}>
        <SubTitle>On the stage</SubTitle>
        <Small>
          {source ? `${source.label}${performer ? ` · ${performer.name}` : ` · ${SP_NOBODY}`}` : ''}
          {location ? ` · ${location}` : source?.offstage ? ' · Off the stage on purpose' : ' · Not on the stage yet'}
        </Small>
        <Button
          label={object ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'}
          onPress={locate}
          a11yLabel={object ? `Locate ${input.label} on the stage` : `Go to the stage to place ${input.label}`}
        />
        {source ? <Button label="EDIT THE SOURCE" tone="plain" onPress={() => onOpenSource(source.id)} a11yLabel={`Edit the source ${source.label}`} /> : null}
      </View>

      {input.pairId ? (
        <View style={bitStyles.gap}>
          <SubTitle>Stereo pair</SubTitle>
          {partner ? (
            <>
              <Small>
                {input.side === 'L' ? 'Left' : 'Right'} side of a pair with {partner.label}. The two rows stay together when you move them. L and R name the two audio channels. They are not taken from the drawing.
              </Small>
              {monoOpen && mono ? (
                <View style={bitStyles.gap}>
                  <Note tone="warning">{mono.says}</Note>
                  <Choice label="Which side stays" value={keep} options={mono.sides.map((s) => ({ value: s.side, label: `${s.label} (it becomes ${mono.monoLabel(s.side)})` }))} onChange={setKeep} />
                  {mono.di ? (
                    <Choice<DiAnswer> label={`${mono.di.label} is a ${mono.di.channels === 2 ? 'stereo' : 'mono'} DI device. What happens to it`} value={diChoice} options={DI_ANSWER} onChange={setDiChoice} hint={DI_ANSWER_HINT} />
                  ) : null}
                  <Button label="MAKE IT MONO" tone="primary" onPress={makeMono} disabled={!!mono.di && diChoice === ''} disabledReason="Choose what happens to the DI device first." />
                  <Button label="KEEP IT STEREO" tone="plain" onPress={() => setMonoOpen(false)} />
                </View>
              ) : (
                <Button label="MAKE IT MONO" tone="plain" onPress={() => setMonoOpen(true)} a11yLabel={`Make ${input.label} and ${partner.label} one mono input`} />
              )}
            </>
          ) : (
            <>
              <Note tone="warning">The other side of this stereo pair is gone. Put it back, or make this a mono request.</Note>
              <Button label="PUT THE OTHER SIDE BACK" onPress={() => ed.apply((q) => spPairRestore(q, inputId).p)} a11yLabel={`Put the other side of ${input.label} back`} />
              <PairMonoStep inputId={inputId} />
            </>
          )}
        </View>
      ) : null}

      <MoreDetails title="More details" focusKeys={['di', 'standSupplier', 'phantom', 'destination']}>
        <Choice label="How firm is the equipment choice" value={input.priority} options={PRIORITY} onChange={(priority) => (priority === input.priority ? undefined : set({ priority }))} hint="Preferred: you would like it. Required: the show needs it. Flexible: anything suitable." />
        <TextField label="Acceptable alternatives" value={input.alternatives} onCommit={text('alternatives')} hint="In your own words. An alternative is not counted as extra equipment, and the tool does not claim two models are the same." />
        {input.capture === 'di' ? (
          p.diDevices.length ? (
            <FocusMark k="di">
            <Choice
              label="DI device for this input"
              value={input.diDeviceId ?? ''}
              options={[{ value: '', label: 'No DI device (DI box) yet' }, ...p.diDevices.map((d) => ({ value: d.id, label: `${d.label} (${d.channels === 2 ? 'stereo, 2 channels' : 'mono, 1 channel'})` }))]}
              onChange={(v) => (v === (input.diDeviceId ?? '') ? undefined : ed.apply((q) => spAssignDi(q, inputId, v || null)))}
              hint="A DI channel is one input. A DI device carries it: a mono device carries one DI channel, a stereo device two."
            />
            </FocusMark>
          ) : (
            <FocusMark k="di">
            <Note>No DI device (DI box) is listed yet. Add one under DI DEVICES, or leave it: the packet then says this DI channel has no DI device yet.</Note>
            </FocusMark>
          )
        ) : null}
        <Fields>
          <TextField label="Connector" value={input.connector} onCommit={text('connector')} placeholder="XLR, 1/4 inch" width="half" />
          <TextField label="Signal level, if known" value={input.level} onCommit={text('level')} placeholder="For example: line level" width="half" />
        </Fields>
        <TextField label="Adapter or interface note" value={input.adapterNote} onCommit={text('adapterNote')} />
        {input.stand !== 'none' ? (
          <FocusMark k="standSupplier">
            <Choice label="Who brings the stand" value={input.standSupplier} options={SUPPLIER} onChange={(standSupplier) => (standSupplier === input.standSupplier ? undefined : set({ standSupplier }))} />
          </FocusMark>
        ) : null}
        {input.stand !== 'none' && input.stand !== 'custom' ? <TextField label="Stand note" value={input.standNote} onCommit={text('standNote')} /> : null}
        <FocusMark k="phantom">
          <Choice label="Phantom power for this device" value={input.phantom} options={PHANTOM} onChange={(phantom) => (phantom === input.phantom ? undefined : set({ phantom }))} hint={SP_PHANTOM_HINT} />
        </FocusMark>
        <FocusMark k="destination">
        <Choice
          label="Where it goes"
          value={input.destination}
          options={DESTINATION}
          onChange={(destination) => (destination === input.destination ? undefined : set({ destination }))}
          hint="An input that also feeds the band monitor rig gets a second channel number in that list."
        />
        </FocusMark>
        {input.destination === 'both' || input.destination === 'custom' ? (
          <TextField
            label={input.destination === 'both' ? 'How the split is made' : 'Describe where it goes'}
            value={input.splitNote}
            onCommit={text('splitNote')}
            multiline
            hint="Who provides the split and how it connects, if you know. Left empty, it is printed as one question for the venue."
          />
        ) : null}
        <Switch
          label="Click, cue or private talkback"
          value={input.cue}
          onChange={(cue) => (cue === input.cue ? undefined : set({ cue }))}
          hint={`${SP_CUE_HINT} Turning this on makes the input monitor only and keeps it out of every monitor mix that has not asked for it. You can change either afterward.`}
        />
        {patchIds.map((pid) => (
          <TextField
            key={pid}
            label={pid === 'band' ? 'The band monitor rig’s channel or socket, if it differs' : 'The venue’s own channel or socket'}
            value={spPatch(p, pid)?.venue[inputId] ?? ''}
            onCommit={venue(pid)}
            placeholder="CH 17, SB-A 4"
            hint={pid === 'band' ? 'Only if it differs from your number in that list. This tool never renumbers it.' : 'Only if the venue told you. It is printed beside your number, and this tool never renumbers it.'}
          />
        ))}
        {source ? (
          <TextField
            label="Stage location note"
            value={source.locationNote}
            onCommit={(t) => (t === source.locationNote ? undefined : ed.apply((q) => spUpdateSource(q, source.id, { locationNote: t })))}
            hint={`Optional. The stage words come from the drawing. This note belongs to ${source.label}${siblings.length > 1 ? ` and is shared by its ${siblings.length} inputs` : ''}.`}
          />
        ) : null}
        <TextField label="Notes" value={input.notes} onCommit={text('notes')} multiline hint="Anything about the capture, a changeover or the connection." />
      </MoreDetails>

      {siblings.length > 1 && source ? (
        <View style={bitStyles.gap}>
          <SubTitle>Other inputs of {source.label}</SubTitle>
          <Lines lines={siblings.filter((i) => i.id !== inputId).map((i) => i.label)} />
        </View>
      ) : null}

      <RemoveStep label="REMOVE THIS INPUT" question={removeQuestion} yes="YES, REMOVE IT" onRemove={remove} extra={partner ? { label: 'REMOVE BOTH SIDES', onPress: removeBoth } : undefined} />
    </SheetBody>
  );
}
