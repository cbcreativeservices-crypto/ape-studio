/**
 * stageplot/inputs/DiPanel — DI DEVICES as their own list, apart from the DI
 * channels they carry.
 *
 * A DI channel is an input. A DI device is a box: a mono one carries one
 * channel, a stereo one carries two. The panel says both numbers, and the
 * sentence from spDiTotals never claims a box count nobody gave ("3 DI audio
 * channels with no DI device (DI box) yet"). Passive or active is asked, with
 * "not known" as a real answer; nothing here decides phantom power.
 */
import { View } from 'react-native';
import { SP_SUPPLIER_WORD } from '../../../../features/stageplot/spCatalog';
import { spDiTotals } from '../../../../features/stageplot/spDerive';
import { spAddDiDevice, spRemoveDiDevice, spUpdateDiDevice } from '../../../../features/stageplot/spModel';
import type { SpDiDevice, SpId, SpSupplier } from '../../../../features/stageplot/spTypes';
import { useSpEditor } from '../spContext';
import { Button, Choice, Count, Note, RowCard, Section, TextField } from '../spForm';
import { RemoveStep, SheetBody, Small, SubTitle, TickRow, bitStyles } from './bits';
import { SP_DI_KIND_WORD, SP_SUPPLIERS, SP_TBC_PRINTED, spDiChannelRows, spDiDeviceLine, spDiToggle } from './inputsLogic';

const SUPPLIER: { value: SpSupplier; label: string }[] = SP_SUPPLIERS.map((value) => ({ value, label: SP_SUPPLIER_WORD[value] }));
type Channels = '1' | '2';
const CHANNELS: { value: Channels; label: string }[] = [
  { value: '1', label: 'Mono: 1 channel' },
  { value: '2', label: 'Stereo: 2 channels' },
];
const KIND: { value: SpDiDevice['kind']; label: string }[] = (['passive', 'active', 'unknown'] as const).map((value) => ({ value, label: SP_DI_KIND_WORD[value] }));

export function DiPanel({ selectedId, onOpen }: { selectedId: SpId | null; onOpen: (deviceId: SpId) => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const totals = spDiTotals(p);

  const add = (channels: 1 | 2) => {
    const made = spAddDiDevice(p, { channels });
    ed.apply((q) => spAddDiDevice(q, { channels }).p);
    onOpen(made.id);
  };

  return (
    <Section title="DI DEVICES" hint="The DI devices, listed apart from the DI channels they carry. A mono device carries one DI channel, a stereo device two.">
      {totals.channels || totals.devices ? (
        <View style={bitStyles.counts}>
          {totals.channels ? <Count value={totals.channels} label={totals.channels === 1 ? 'DI channel' : 'DI channels'} /> : null}
          {totals.devices ? <Count value={totals.devices} label={totals.devices === 1 ? 'DI device' : 'DI devices'} /> : null}
        </View>
      ) : null}
      <Note tone={totals.unassignedChannels || totals.overloaded.length ? 'warning' : 'plain'}>{totals.summary}</Note>
      {totals.overloaded.map((o) => (
        <Note key={o.label} tone="warning">
          {o.label} has {o.channels === 1 ? '1 channel' : `${o.channels} channels`} and is asked to carry {o.used}.
        </Note>
      ))}
      {p.diDevices.map((d) => (
        <RowCard
          key={d.id}
          title={d.label}
          subtitle={[spDiDeviceLine(p, d), d.model.trim() ? `Model: ${d.model.trim()}` : ''].filter(Boolean).join(' · ')}
          selected={selectedId === d.id}
          onPress={() => onOpen(d.id)}
          a11yLabel={`${d.label}. ${spDiDeviceLine(p, d).replace(/ · /g, ', ')}. Opens this DI device to edit it.`}
        />
      ))}
      <Button label="ADD A MONO DI DEVICE" onPress={() => add(1)} />
      <Button label="ADD A STEREO DI DEVICE" tone="plain" onPress={() => add(2)} />
    </Section>
  );
}

export function DiEditor({ deviceId, onClose }: { deviceId: SpId; onClose: () => void }) {
  const ed = useSpEditor();
  const p = ed.project;
  const d = p.diDevices.find((x) => x.id === deviceId);
  if (!d) {
    return (
      <SheetBody>
        <Note>This DI device is no longer in the list.</Note>
        <Button label="CLOSE" onPress={onClose} />
      </SheetBody>
    );
  }
  const rows = spDiChannelRows(p, deviceId);
  const used = rows.filter((r) => r.on).length;
  const set = (patch: Partial<Omit<SpDiDevice, 'id'>>) => ed.apply((q) => spUpdateDiDevice(q, deviceId, patch));

  return (
    <SheetBody>
      <TextField label="Name of this DI device" value={d.label} onCommit={(t) => (t && t !== d.label ? set({ label: t }) : undefined)} placeholder="Bass DI, Keys stereo DI" />
      <Choice<Channels> label="Mono or stereo" value={d.channels === 2 ? '2' : '1'} options={CHANNELS} onChange={(v) => (Number(v) === d.channels ? undefined : set({ channels: v === '2' ? 2 : 1 }))} hint="A mono device carries one DI channel. A stereo device carries two." />
      <Choice<SpDiDevice['kind']> label="Passive or active" value={d.kind} options={KIND} onChange={(kind) => (kind === d.kind ? undefined : set({ kind }))} hint={`To be confirmed is a real answer, never guessed. ${SP_TBC_PRINTED}`} />
      <Choice<SpSupplier> label="Who brings it" value={d.supplier} options={SUPPLIER} onChange={(supplier) => (supplier === d.supplier ? undefined : set({ supplier }))} hint="This is also the answer for every DI channel on this device." />
      <TextField label="Model, if it matters" value={d.model} onCommit={(t) => (t === d.model ? undefined : set({ model: t }))} hint="Type it yourself. Leave it empty for any suitable DI." />

      <View style={bitStyles.gap}>
        <SubTitle>DI channels on this device</SubTitle>
        {rows.length ? (
          rows.map((r) => (
            <TickRow
              key={r.inputId}
              title={r.label}
              sub={r.on ? 'On this device' : r.elsewhere ? `On ${r.elsewhere} now. Ticking moves it here.` : 'No DI device (DI box) yet'}
              checked={r.on}
              onPress={() => ed.apply((q) => spDiToggle(q, deviceId, r.inputId))}
              a11yLabel={`${r.label}. ${r.on ? `On ${d.label}. Press to take it off.` : r.elsewhere ? `On ${r.elsewhere} now. Press to move it to ${d.label}.` : `No device yet. Press to put it on ${d.label}.`}`}
            />
          ))
        ) : (
          <Small>No input is captured through a DI yet. Set “How it is captured” to DI on an input, and it appears here.</Small>
        )}
        {used > d.channels ? (
          <Note tone="warning">
            This device has {d.channels === 1 ? '1 channel' : '2 channels'} and is asked to carry {used}. {d.channels === 1 ? 'Take a channel off, or make the device stereo if it is a stereo device.' : 'Take a channel off, or add another DI device.'}
          </Note>
        ) : null}
      </View>

      <RemoveStep
        label="REMOVE THIS DI DEVICE"
        question={`Remove ${d.label}?${used ? ` Its ${used === 1 ? 'DI channel stays' : `${used} DI channels stay`} in the input list, with no DI device (DI box) yet.` : ''}`}
        yes="YES, REMOVE IT"
        onRemove={() => {
          ed.apply((q) => spRemoveDiDevice(q, deviceId));
          onClose();
        }}
      />
    </SheetBody>
  );
}
