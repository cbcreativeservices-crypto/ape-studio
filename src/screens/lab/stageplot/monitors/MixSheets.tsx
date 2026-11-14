/**
 * stageplot/monitors/MixSheets — what goes inside the popup that makes and
 * the popup that edits a MIX (what a performer hears). Devices are edited in
 * their own popups (DeviceSheets): a mix is not a device, and neither popup
 * counts one as the other.
 *
 *   NewMixBody    who hears it, mono or stereo, how it is delivered and who
 *                 creates it; then the usual devices for that delivery, SHOWN
 *                 AS ROWS BEFORE ANYTHING IS ADDED (the band can untick any).
 *                 The mix and its kept devices are added as one edit.
 *   MixBody       every field of one mix. Each change is saved immediately
 *                 through the editor and can be undone. A mix with no device
 *                 on it is offered the same usual devices, so a mix made from
 *                 a review answer ends with something to hear it through.
 *
 * These are BODIES: MonitorsArea owns the one popup (`Sheet`) and swaps its
 * body, so going from a mix to one of its devices never closes one popup and
 * opens another in the same moment.
 *
 * For a mix the house console does not create, both bodies ask what the venue
 * provides for it, with one line that explains each choice.
 */
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SP_MIX_INSTRUCTIONS } from '../../../../features/stageplot/spCatalog';
import { spAssignReturn, spAssignReturnR, spBox, spBoxName, spMixMaySplit, spMixReturnSpots, spSetReturnKeep, spRemoveMix, spReturnBoxes, spReturnWordsOn, spSetFromConsole, spUpdateMix } from '../../../../features/stageplot/spModel';
import type { SpId, SpMix } from '../../../../features/stageplot/spTypes';
import { RemoveStep } from '../inputs/bits';
import { useSpEditor } from '../spContext';
import { Button, Choice, FocusMark, MoreDetails, Note, NumberField, Switch, TextField } from '../spForm';
import { ButtonRow, ChipRow, FieldLabel, Line, SubHeading, ToggleChip } from './bits';
import {
  SPM_DELIVERY_HINT,
  SPM_DELIVERY_OPTIONS,
  SPM_FEED_HINT,
  SPM_FROM_CONSOLE,
  SPM_RETURN_HINT,
  SPM_RETURN_R_HINT,
  spmFreeReturn,
  spmSameReturn,
  spmSharedWords,
  SPM_FEED_OPTIONS,
  SPM_FORMAT_OPTIONS,
  SPM_PERSONAL_MIXER_NOTE,
  SPM_PROVIDER_HINT,
  SPM_PROVIDER_OPTIONS,
  SPM_SHARE_WHERE_POPUP,
  SPM_USUAL_NOTE,
  spmAddDevice,
  spmAddDevicesToMix,
  spmAddMixWithDevices,
  spmAddOwnInstruction,
  spmBlankDraft,
  spmClickNotes,
  spmDeviceTitle,
  spmDevicesOfMix,
  spmDraftLine,
  spmFeedWhy,
  spmMixTitle,
  spmNeedsTransmitter,
  spmOffHouse,
  spmOwnInstructions,
  spmOwnRig,
  spmPerformerName,
  spmRowWord,
  spmShareLine,
  spmShareOpen,
  spmToggleInstruction,
  spmUsualDevices,
  type SpmDeviceRow,
  type SpmMixDraft,
} from './monitorPlan';

/** Chips for who hears a mix. Several performers may share one mix. */
function Recipients({ chosen, onToggle, onSetup }: { chosen: readonly SpId[]; onToggle: (id: SpId) => void; onSetup: () => void }) {
  const { project } = useSpEditor();
  return (
    <View style={styles.field}>
      <FieldLabel>Who hears this mix</FieldLabel>
      {project.performers.length ? (
        <>
          <ChipRow>
            {project.performers.map((pf) => {
              const name = spmPerformerName(pf);
              const on = chosen.includes(pf.id);
              return <ToggleChip key={pf.id} label={name} selected={on} onPress={() => onToggle(pf.id)} a11yLabel={on ? `Take ${name} off this mix` : `Put ${name} on this mix`} />;
            })}
          </ChipRow>
          <Line tone="dim">Several performers can share one mix.</Line>
        </>
      ) : (
        <>
          <Note>There are no performers yet. Add them in SETUP, then choose who hears this mix.</Note>
          <Button label="GO TO SETUP" onPress={onSetup} a11yLabel="Go to the Setup area to add performers" />
        </>
      )}
    </View>
  );
}

/** The proposed devices as chips the band can untick. Nothing is added here. */
function ProposedDevices({ rows, off, onToggle }: { rows: readonly SpmDeviceRow[]; off: readonly string[]; onToggle: (key: string) => void }) {
  const { project } = useSpEditor();
  if (!rows.length) return null;
  return (
    <ChipRow>
      {rows.map((r) => {
        const on = !off.includes(r.key);
        const name = spmRowWord(project, r);
        return <ToggleChip key={r.key} label={name} selected={on} onPress={() => onToggle(r.key)} a11yLabel={on ? `Do not add ${name}` : `Add ${name}`} />;
      })}
    </ChipRow>
  );
}

const toggleId = <T extends string>(list: readonly T[], id: T): T[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function NewMixBody({ recipients, onClose, onAdded }: { recipients: SpId[]; onClose: () => void; onAdded: (mixId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const [draft, setDraft] = useState<SpmMixDraft>(() => spmBlankDraft(recipients));
  /** The proposed device rows the band unticked. */
  const [off, setOff] = useState<string[]>([]);
  const rows = useMemo(() => spmUsualDevices(p, draft), [p, draft]);
  const kept = rows.filter((r) => !off.includes(r.key));

  /** Two presses in the same moment add one mix. */
  const added = useRef(false);
  const add = () => {
    if (added.current) return;
    added.current = true;
    const offNow = off;
    // the id the model gives the new mix (ids are made from the project itself)
    const mixId = spmAddMixWithDevices(p, draft, kept).mixId;
    ed.apply((cur) => spmAddMixWithDevices(cur, draft, spmUsualDevices(cur, draft).filter((r) => !offNow.includes(r.key))).p);
    onAdded(mixId);
  };

  return (
    <View style={styles.sheet}>
      <Line tone="dim">A mix is what a performer hears. The devices that play it are listed separately.</Line>
      <Recipients
        chosen={draft.recipients}
        onToggle={(id) => setDraft((d) => ({ ...d, recipients: toggleId(d.recipients, id) }))}
        onSetup={() => {
          onClose();
          ed.goTo('setup');
        }}
      />
      <Choice label="Mono or stereo" value={draft.format} options={SPM_FORMAT_OPTIONS} onChange={(format) => setDraft((d) => ({ ...d, format }))} />
      <Choice label="How it is delivered" value={draft.delivery} options={SPM_DELIVERY_OPTIONS} onChange={(delivery) => setDraft((d) => ({ ...d, delivery }))} hint={SPM_DELIVERY_HINT} />
      <Choice label="Who creates this mix" value={draft.provider} options={SPM_PROVIDER_OPTIONS} onChange={(provider) => setDraft((d) => ({ ...d, provider }))} hint={SPM_PROVIDER_HINT} />
      {spmOffHouse(draft) ? (
        <Choice label="What is requested from the venue" value={draft.venueFeed} options={SPM_FEED_OPTIONS} onChange={(venueFeed) => setDraft((d) => ({ ...d, venueFeed }))} hint={`${spmFeedWhy(draft.provider)}\n${SPM_FEED_HINT}`} />
      ) : null}
      {draft.provider === 'personal-mixer' ? <Note>{SPM_PERSONAL_MIXER_NOTE}</Note> : null}

      <View style={styles.block}>
        <SubHeading>DEVICES TO ADD WITH THIS MIX</SubHeading>
        <Line tone="dim">{SPM_USUAL_NOTE[draft.delivery]}</Line>
        <ProposedDevices rows={rows} off={off} onToggle={(key) => setOff((list) => toggleId(list, key))} />
        <Line>{spmDraftLine(draft, kept.length)}</Line>
      </View>

      <ButtonRow>
        <Button label="ADD THIS MIX" tone="primary" onPress={add} a11yLabel="Add this mix and the devices marked" />
        <Button label="CANCEL" onPress={onClose} a11yLabel="Close without adding a mix" />
      </ButtonRow>
    </View>
  );
}

export function MixBody({
  mix,
  onClose,
  onNeeds,
  onAddDevice,
  onOpenDevice,
}: {
  mix: SpMix;
  onClose: () => void;
  onNeeds: (mixId: SpId) => void;
  onAddDevice: (mixId: SpId) => void;
  onOpenDevice: (deviceId: SpId) => void;
}) {
  const ed = useSpEditor();
  const p = ed.project;
  const id = mix.id;
  const title = spmMixTitle(mix);
  type MixPatch = Partial<Omit<SpMix, 'id' | 'needs'>>;
  const set = (patch: MixPatch) => ed.apply((cur) => spUpdateMix(cur, id, patch));
  /** A change worked out from the mix AS IT IS NOW (two quick taps on two
   *  chips must both count). */
  const change = (from: (now: SpMix) => MixPatch) => ed.apply((cur) => spUpdateMix(cur, id, from(cur.mixes.find((x) => x.id === id) ?? mix)));
  const devices = spmDevicesOfMix(p, id);
  const share = spmShareLine(p, mix);
  /** "How its devices are fed" is open: the popup says where to type it, and
   *  shows that field (MORE DETAILS opens with it). */
  const shareOpen = spmShareOpen(p, mix);
  const clickNotes = spmClickNotes(p, mix);
  const own = spmOwnInstructions(mix.instructions);
  // (round 2) returns: the boxes that have them (and the one it is on)
  const retBoxes = spReturnBoxes(p);
  const retBox = mix.ret ? spBox(p, mix.ret.boxId) : undefined;
  const retChoices = retBox && !retBoxes.includes(retBox) ? [...retBoxes, retBox] : retBoxes;
  const sameRet = spmSameReturn(p, id);
  // (round 3) every return it takes, on its own box (a stereo mix's R may be on another)
  const pastSpots = spMixReturnSpots(mix).filter((s) => s.ret > (spBox(p, s.boxId)?.returns ?? 0));
  const stereo = mix.format === 'stereo';
  const rBox = mix.retR ? spBox(p, mix.retR.boxId) : undefined;
  const rChoices = rBox && !retBoxes.includes(rBox) ? [...retBoxes, rBox] : retBoxes;

  // A mix with no device yet is offered the usual ones for its delivery.
  const [off, setOff] = useState<string[]>([]);
  const usual = useMemo(() => (devices.length ? [] : spmUsualDevices(p, mix)), [p, mix, devices.length]);
  const keptUsual = usual.filter((r) => !off.includes(r.key));
  const addUsual = () => {
    const offNow = off;
    ed.apply((cur) => {
      const now = cur.mixes.find((x) => x.id === id);
      // only while the mix still has no device: a second press adds nothing
      return now && !spmDevicesOfMix(cur, id).length ? spmAddDevicesToMix(cur, id, spmUsualDevices(cur, now).filter((r) => !offNow.includes(r.key))).p : cur;
    });
  };

  const left = devices.length ? ` Its ${devices.length === 1 ? 'device stays' : `${devices.length} devices stay`} on the device list, and will say “Not on any mix”.` : '';

  return (
    <View style={styles.sheet}>
      <Line tone="dim">{`${mix.code} is the label of this mix in your stage plot. It is not a console output number.`}</Line>
      <TextField label="Name" value={mix.name} onCommit={(name) => set({ name })} placeholder="Who or what it is for" />
      <Recipients
        chosen={mix.recipients}
        onToggle={(pid) => change((now) => ({ recipients: toggleId(now.recipients, pid) }))}
        onSetup={() => {
          onClose();
          ed.goTo('setup');
        }}
      />
      <Choice label="Mono or stereo" value={mix.format} options={SPM_FORMAT_OPTIONS} onChange={(format) => set({ format })} />
      <FocusMark k="provider">
        <Choice label="Who creates this mix" value={mix.provider} options={SPM_PROVIDER_OPTIONS} onChange={(provider) => set({ provider })} hint={SPM_PROVIDER_HINT} />
      </FocusMark>
      {spmOffHouse(mix) ? (
        <FocusMark k="venueFeed">
          <Choice label="What is requested from the venue" value={mix.venueFeed} options={SPM_FEED_OPTIONS} onChange={(venueFeed) => set({ venueFeed })} hint={`${spmFeedWhy(mix.provider)}\n${SPM_FEED_HINT}`} />
        </FocusMark>
      ) : null}
      {mix.provider === 'personal-mixer' ? <Note>{SPM_PERSONAL_MIXER_NOTE}</Note> : null}
      <Choice label="How it is delivered" value={mix.delivery} options={SPM_DELIVERY_OPTIONS} onChange={(delivery) => set({ delivery })} hint={SPM_DELIVERY_HINT} />

      {/* (round 2) THE STAGE BOX RETURN this mix comes back on */}
      {retBoxes.length || mix.ret || mix.fromConsole ? (
        <FocusMark k="ret">
          <View style={styles.block}>
            <Choice
              label="Stage box return (where the mix comes back to the stage)"
              value={mix.ret ? mix.ret.boxId : mix.fromConsole ? SPM_FROM_CONSOLE : ''}
              options={[{ value: '', label: 'No return yet' }, ...retChoices.map((b) => ({ value: b.id, label: `${spBoxName(b)} (has ${b.returns ?? 0} return${b.returns === 1 ? '' : 's'})` })), { value: SPM_FROM_CONSOLE, label: 'From the console' }]}
              onChange={(v) => {
                if (v === (mix.ret ? mix.ret.boxId : mix.fromConsole ? SPM_FROM_CONSOLE : '')) return;
                if (v === SPM_FROM_CONSOLE) ed.apply((cur) => spSetFromConsole(cur, id, true));
                else if (!v) ed.apply((cur) => spSetFromConsole(spAssignReturn(cur, id, null), id, false));
                else {
                  // the lowest unused return (two side by side for a stereo mix) of that box, chosen by hand
                  const s = spmFreeReturn(p, v, mix.format === 'stereo' ? 2 : 1, id) ?? 1;
                  ed.apply((cur) => spAssignReturn(cur, id, { boxId: v, ret: s }));
                }
              }}
              hint={SPM_RETURN_HINT}
            />
            {mix.ret && retBox ? (
              <>
                <NumberField
                  label={stereo ? (mix.retR ? `L (left) return on ${spBoxName(retBox)}` : `First of its two returns on ${spBoxName(retBox)}`) : `Return on ${spBoxName(retBox)}`}
                  value={mix.ret.ret}
                  min={1}
                  max={Math.max(1, (retBox.returns ?? 1) - (stereo && !mix.retR ? 1 : 0))}
                  width="half"
                  onCommit={(n) => (n == null || n === mix.ret?.ret ? undefined : ed.apply((cur) => spAssignReturn(cur, id, { boxId: retBox.id, ret: n })))}
                  hint={`${spBoxName(retBox)} has ${retBox.returns ? `returns 1 to ${retBox.returns}` : 'no returns given'}.`}
                />
                {/* (round 3) a stereo mix's R (right) on its own return, on this box or another */}
                {/* only where its speakers can stand apart, or to take a split back (engineer review) */}
                {stereo && (spMixMaySplit(mix) || mix.retR) ? (
                  <Choice
                    label="R (right) side of this mix"
                    value={mix.retR ? mix.retR.boxId : ''}
                    options={[{ value: '', label: `Right after L (${spBoxName(retBox)} · return ${mix.ret.ret + 1})` }, ...rChoices.map((b) => ({ value: b.id, label: b.id === retBox.id ? `Another return on ${spBoxName(b)}` : `On ${spBoxName(b)}` }))]}
                    onChange={(v) => {
                      if (v === (mix.retR ? mix.retR.boxId : '')) return;
                      if (!v) ed.apply((cur) => spAssignReturnR(cur, id, null));
                      else {
                        const s = spmFreeReturn(p, v, 1) ?? 1;
                        ed.apply((cur) => spAssignReturnR(cur, id, { boxId: v, ret: s }));
                      }
                    }}
                    hint={SPM_RETURN_R_HINT}
                  />
                ) : null}
                {stereo && mix.retR && rBox ? (
                  <NumberField
                    label={`R (right) return on ${spBoxName(rBox)}`}
                    value={mix.retR.ret}
                    min={1}
                    max={Math.max(1, rBox.returns ?? 1)}
                    width="half"
                    onCommit={(n) => (n == null || n === mix.retR?.ret ? undefined : ed.apply((cur) => spAssignReturnR(cur, id, { boxId: rBox.id, ret: n })))}
                    hint={`${spBoxName(rBox)} has ${rBox.returns ? `returns 1 to ${rBox.returns}` : 'no returns given'}.`}
                  />
                ) : null}
                <Line tone="dim">{`${stereo ? `This stereo mix takes ${spReturnWordsOn(p, mix)}. ` : ''}${mix.ret.byHand ? 'Chosen by you: AUTO-ASSIGN RETURNS never moves it.' : 'Chosen by AUTO-ASSIGN RETURNS. Type a return to choose it yourself.'}`}</Line>
                {sameRet.length ? <Note tone="warning">{`${sameRet.map((m) => `${m.code} is also on ${spmSharedWords(p, mix, m)}`).join('; ')}. One return carries one mix: give each its own.`}</Note> : null}
                {pastSpots.length ? <Note tone="warning">{`${pastSpots.map((s) => { const b = spBox(p, s.boxId); return `${b ? spBoxName(b) : 'The box'} has ${b?.returns ? `${b.returns} returns` : 'no returns given'}, so its return ${s.ret} does not exist`; }).join('; ')}. Choose another return, or correct the box’s number of returns.`}</Note> : null}
              </>
            ) : null}
            {/* (round 3) a mix the band makes itself that keeps its return: the review's question answered */}
            {spmOffHouse(mix) && mix.ret ? <Switch label="It still uses this return" value={mix.retKeep === true} onChange={(v) => ed.apply((cur) => spSetReturnKeep(cur, id, v))} hint="Turn this on when the venue’s return lines carry this mix from your band’s own mixer to the stage. If it does not need a return, choose No return yet above." /> : null}
            {mix.delivery === 'wireless-iem' && !mix.fromConsole && !mix.ret ? <Line tone="dim">An in-ear mix goes to its transmitter, not to the performer. If the transmitter sits with a monitor console beside the stage, choose From the console. If it is in a rack at the side of the stage, give it the return of the box nearest that rack.</Line> : null}
          </View>
        </FocusMark>
      ) : null}

      <View style={styles.block}>
        <SubHeading>DEVICES ON THIS MIX</SubHeading>
        {devices.length ? (
          devices.map((d) => <Button key={d.id} label={`EDIT ${spmDeviceTitle(d).toUpperCase()}`} onPress={() => onOpenDevice(d.id)} a11yLabel={`Edit the device ${spmDeviceTitle(d)}`} />)
        ) : (
          <>
            <Line>No device is on this mix yet.</Line>
            {usual.length ? (
              <>
                <Line tone="dim">{`The usual devices for this delivery. ${SPM_USUAL_NOTE[mix.delivery]}`}</Line>
                <ProposedDevices rows={usual} off={off} onToggle={(key) => setOff((list) => toggleId(list, key))} />
                <Button label="ADD THE DEVICES MARKED" tone="primary" onPress={addUsual} disabled={!keptUsual.length} disabledReason="No device is marked." a11yLabel={`Add the devices marked to ${title}`} />
              </>
            ) : null}
          </>
        )}
        {spmNeedsTransmitter(p, mix) ? (
          <>
            <Note tone="warning">This mix is wireless in-ear, and no transmitter is listed for it. A receiver pack needs a transmitter.</Note>
            <Button label="ADD A TRANSMITTER" onPress={() => ed.apply((cur) => (cur.mixes.some((x) => x.id === id && spmNeedsTransmitter(cur, x)) ? spmAddDevice(cur, 'iem-tx', id).p : cur))} a11yLabel={`Add a wireless in-ear transmitter to ${title}`} />
          </>
        ) : null}
        {share ? <Note>{shareOpen ? `${share} ${SPM_SHARE_WHERE_POPUP}` : share}</Note> : null}
        {spmOwnRig(mix) && devices.some((d) => !d.selfContained) ? <Line tone="dim">If a device here needs nothing from the house system, open it and mark it as part of the band monitor rig.</Line> : null}
        <Line tone="dim">Adding a device does not add a mix or an audio channel.</Line>
        <Button label="ADD A DEVICE TO THIS MIX" onPress={() => onAddDevice(id)} a11yLabel={`Add a device to ${title}`} />
      </View>

      {clickNotes.map((text) => (
        <Note key={text} tone="warning">
          {text}
        </Note>
      ))}
      <Button label="WHAT THIS MIX NEEDS TO HEAR" onPress={() => onNeeds(id)} a11yLabel={`Choose what ${title} needs to hear`} />

      <MoreDetails initiallyOpen={shareOpen} focusKeys={['outputs']}>
        <FocusMark k="outputs">
          <TextField
            label="Requested output channels or sockets"
            value={mix.outputs}
            onCommit={(outputs) => set({ outputs })}
            placeholder="Only if you know them"
            hint="In your own words. This is separate from the mix label. It is also where you say how the feed reaches several devices."
          />
        </FocusMark>
        <View style={styles.field}>
          <FieldLabel>Short instructions</FieldLabel>
          <ChipRow>
            {SP_MIX_INSTRUCTIONS.map((word) => {
              const on = mix.instructions.includes(word);
              return <ToggleChip key={word} label={word} selected={on} onPress={() => change((now) => ({ instructions: spmToggleInstruction(now.instructions, word) }))} a11yLabel={on ? `Remove the instruction ${word}` : `Add the instruction ${word}`} />;
            })}
          </ChipRow>
          {own.length ? (
            <ChipRow>
              {own.map((word) => (
                <ToggleChip key={word} label={word} selected onPress={() => change((now) => ({ instructions: now.instructions.filter((x) => x !== word) }))} a11yLabel={`Remove your instruction ${word}`} />
              ))}
            </ChipRow>
          ) : null}
          <Line tone="dim">Instructions are preferences you give before the show. They do not promise a finished monitor mix.</Line>
        </View>
        <TextField label="Add your own instruction" value="" onCommit={(text) => (text ? change((now) => ({ instructions: spmAddOwnInstruction(now.instructions, text) })) : undefined)} placeholder="In your own words" />
        <TextField label="Notes" value={mix.notes} onCommit={(notes) => set({ notes })} multiline />
      </MoreDetails>

      <Button label="DONE" tone="primary" onPress={onClose} a11yLabel={`Close ${title}`} />
      <RemoveStep
        label="REMOVE THIS MIX"
        question={`${title} is removed from the monitor plan.${left}`}
        yes="YES, REMOVE THIS MIX"
        onRemove={() => {
          ed.apply((cur) => spRemoveMix(cur, id));
          onClose();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: 14 },
  block: { gap: 8 },
  field: { gap: 6 },
});
