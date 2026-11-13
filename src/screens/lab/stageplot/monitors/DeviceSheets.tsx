/**
 * stageplot/monitors/DeviceSheets — what goes inside the popup that adds and
 * the popup that edits a MONITOR DEVICE: a wedge, a wireless in-ear
 * transmitter, a receiver pack, a wired headphone amplifier, a fill or a
 * personal mixer. (Bodies only: MonitorsArea owns the one popup.)
 *
 * A device is equipment. It plays or receives a mix; it is not one. Adding a
 * device never adds a mix and never changes the monitor feed audio channels:
 * several devices can share one mix. Both bodies say so where the choice is
 * made.
 *
 * Wireless is recorded as "agree radio frequencies with the venue", with
 * what that means in plain words. This tool never chooses a radio frequency. A transmitter is
 * wireless when it is added; a receiver pack is covered by its transmitter
 * and says so (one radio link is recorded once). A receiver pack is WORN:
 * with no symbol on the stage it says so, and offers DRAW IT ANYWAY, never
 * "not on the stage yet". A model name is the band's own words.
 */
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spRemoveDevice, spUpdateDevice } from '../../../../features/stageplot/spModel';
import type { SpDevice, SpDeviceType, SpId } from '../../../../features/stageplot/spTypes';
import { RemoveStep } from '../inputs/bits';
import { useSpEditor } from '../spContext';
import { Button, Choice, FocusMark, MoreDetails, Note, Switch, TextField } from '../spForm';
import { ButtonRow, Line, SubHeading } from './bits';
import { SPM_DEVICE_OPTIONS, SPM_PACK_NOTE, SPM_SUPPLIER_OPTIONS, SPM_WIRELESS_NOTE, spmAddDevice, spmDeviceStage, spmDeviceTitle, spmMixTitle, spmNewDeviceLabel, spmPerformerName } from './monitorPlan';

const NO_MIX = '';
const SHARE_HINT = 'Several devices can share one mix. Choosing a mix here does not add a mix or an audio channel.';

function mixOptions(mixes: readonly { id: SpId; code: string; name: string }[]): { value: string; label: string }[] {
  return [{ value: NO_MIX, label: 'No mix yet' }, ...mixes.map((m) => ({ value: m.id, label: spmMixTitle(m) }))];
}

export function NewDeviceBody({ mixId, onClose, onAdded }: { mixId: SpId | null; onClose: () => void; onAdded: (deviceId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const [type, setType] = useState<SpDeviceType>('wedge');
  const [mix, setMix] = useState<string>(mixId ?? NO_MIX);
  const label = spmNewDeviceLabel(p, type);

  /** Two presses in the same moment add one device. */
  const added = useRef(false);
  const add = () => {
    if (added.current) return;
    added.current = true;
    // the id the model gives the new device (ids are made from the project itself)
    const id = spmAddDevice(p, type, mix || null).id;
    ed.apply((cur) => spmAddDevice(cur, type, mix || null).p);
    onAdded(id);
  };

  return (
    <View style={styles.sheet}>
      <Line tone="dim">A monitor device is equipment that plays or receives a mix.</Line>
      <Choice label="What it is" value={type} options={SPM_DEVICE_OPTIONS} onChange={setType} />
      <Choice label="The mix it is on" value={mix} options={mixOptions(p.mixes)} onChange={setMix} hint={SHARE_HINT} />
      <Line>{`This adds 1 device${label ? `, named “${label}”` : ''}. The number of mixes and the monitor feed audio channels stay the same.`}</Line>
      <ButtonRow>
        <Button label="ADD THIS DEVICE" tone="primary" onPress={add} a11yLabel="Add this device to the device list" />
        <Button label="CANCEL" onPress={onClose} a11yLabel="Close without adding a device" />
      </ButtonRow>
    </View>
  );
}

/** `onDone`: finished with this device (back to the mix it was opened from,
 *  if any). `onLocate`: close the popup and show this device on the stage. */
export function DeviceBody({ device, onDone, onLocate }: { device: SpDevice; onDone: () => void; onLocate: () => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const id = device.id;
  const title = spmDeviceTitle(device);
  const set = (patch: Partial<Omit<SpDevice, 'id'>>) => ed.apply((cur) => spUpdateDevice(cur, id, patch));
  const stage = spmDeviceStage(p, id);
  const people = [{ value: '', label: 'Nobody in particular' }, ...p.performers.map((pf) => ({ value: pf.id, label: spmPerformerName(pf) }))];
  /** A transmitter or a pack is radio equipment: its wireless switch is in
   *  plain view, not under More details. */
  const radio = device.type === 'iem-tx' || device.type === 'iem-pack';
  const wireless = (
    <>
      <Switch label="Wireless" value={device.wireless} onChange={(on) => set({ wireless: on })} hint="On: the packet says radio frequency coordination is needed for this device." />
      {device.wireless ? <Note>{SPM_WIRELESS_NOTE}</Note> : device.type === 'iem-pack' ? <Note>{SPM_PACK_NOTE}</Note> : null}
    </>
  );

  return (
    <View style={styles.sheet}>
      <TextField label="Name in your stage plot" value={device.label} onCommit={(label) => set({ label })} placeholder="For example: Wedge 3" />
      <Choice label="What it is" value={device.type} options={SPM_DEVICE_OPTIONS} onChange={(type) => set({ type })} />
      <Choice label="The mix it is on" value={device.mixId ?? NO_MIX} options={mixOptions(p.mixes)} onChange={(v) => set({ mixId: v || null })} hint={SHARE_HINT} />
      <Switch label="Part of the band monitor rig" value={device.selfContained} onChange={(selfContained) => set({ selfContained })} hint="On: it needs nothing from the house system." />
      {!device.mixId && !device.selfContained ? <Note tone="warning">This device is not on any mix. Choose a mix, or mark it as part of the band monitor rig.</Note> : null}
      <Choice label="Who uses it" value={device.performerId ?? ''} options={people} onChange={(v) => set({ performerId: v || null })} hint="For a pack or a headphone amplifier that one person wears or uses." />
      <FocusMark k="supplier">
        <Choice label="Who brings it" value={device.supplier} options={SPM_SUPPLIER_OPTIONS} onChange={(supplier) => set({ supplier })} />
      </FocusMark>
      {radio ? wireless : null}

      <View style={styles.block}>
        <SubHeading>ON THE STAGE</SubHeading>
        <Line>{stage.objectId || stage.worn ? `${stage.line}.` : `${stage.line}. A device can be in the list with no symbol on the stage.`}</Line>
        <Button label={stage.button} onPress={onLocate} a11yLabel={stage.objectId ? `Show ${title} on the stage` : `Go to the Stage area to place ${title}`} />
      </View>

      <MoreDetails>
        <TextField label="Model, if it matters" value={device.model} onCommit={(model) => set({ model })} placeholder="In your own words" />
        {radio ? null : wireless}
        <TextField label="Notes" value={device.note} onCommit={(note) => set({ note })} multiline />
      </MoreDetails>

      <Button label="DONE" tone="primary" onPress={onDone} a11yLabel={`Finished with ${title}`} />
      <RemoveStep
        label="REMOVE THIS DEVICE"
        question={`${title} is removed from the device list.${stage.objectId ? ' Its symbol stays on the stage as only a drawing.' : ''} No mix is removed.`}
        yes="YES, REMOVE THIS DEVICE"
        onRemove={() => {
          ed.apply((cur) => spRemoveDevice(cur, id));
          onDone();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: 14 },
  block: { gap: 8 },
});
