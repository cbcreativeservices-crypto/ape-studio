/**
 * trays — the DJ Systems Lab's dock sheets for connecting and powering the
 * booth. TAP-TO-CONNECT (house rule: never drag-only): pick a cable by its
 * fixed end, then tap the jack its free end goes into — only the jacks in
 * its `fits` list are offered (anything else is refused by the model, never
 * drawn; not every physical fit is offered yet — model/djModel PlugDef).
 * POWER lists each device's switch; the order is the lesson.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { LabChip } from '../LabShell';
import { getBooth, updateBooth } from './booth/boothStore';
import { connect, deviceLive, hotPatchSpeakers, JACK_NAMES, PLUGS, powerThump, type Booth, type DeviceId, type JackId, type PlugId, type SpeakerId } from './model/djModel';

/**
 * PATCH: pick a cable, then where its free end goes. A move of a LIVE audio
 * cable — into or out of a powered speaker that is on, or on a channel that
 * is up — raises a HOT-PATCH warning here, like THUMP (audio review
 * 2026-10-18 #3), and `onHot` lets the page flash the speakers that would
 * have heard it. The lab never plays the bang.
 */
export function PatchTray({ plugs, onPatched, onSelect, onHot, initial }: {
  plugs: readonly PlugId[];
  onPatched?: (p: PlugId, j: JackId | null) => void;
  /** The cable picked in step 1 (the map shows its label flag). */
  onSelect?: (p: PlugId) => void;
  onHot?: (speakers: readonly SpeakerId[], p: PlugId) => void;
  initial?: PlugId;
}) {
  const booth = getBooth();
  const [sel, setSel] = useState<PlugId>(initial && plugs.includes(initial) ? initial : plugs[0]);
  const [hot, setHot] = useState<PlugId | null>(null);
  const def = PLUGS[sel];
  const at = booth.plugs[sel];
  const patch = (j: JackId | null) => {
    const spk = hotPatchSpeakers(getBooth(), sel, j);
    setHot(spk.length ? sel : null);
    if (spk.length) onHot?.(spk, sel);
    updateBooth((b) => connect(b, sel, j));
    onPatched?.(sel, j);
  };
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>1 · PICK A CABLE (its other end is already in its source)</Text>
      <View style={styles.row}>
        {plugs.map((p) => (
          <LabChip
            key={p}
            label={`${PLUGS[p].short}${booth.plugs[p] ? ' ✓' : ''}`}
            selected={sel === p}
            onPress={() => {
              setSel(p);
              onSelect?.(p);
            }}
            compact
          />
        ))}
      </View>
      <Text style={styles.note}>{`${def.from} → ${at ? JACK_NAMES[at] : 'not plugged in'}`}</Text>
      <Text style={styles.head}>2 · TAP WHERE ITS LOOSE END GOES</Text>
      <View style={styles.row}>
        {def.fits.map((j) => (
          <LabChip
            key={j}
            label={JACK_NAMES[j].replace('Power strip ', 'OUTLET ').replace('PA speaker', 'PA').replace('Booth monitor', 'BOOTH').replace(' input', ' IN')}
            selected={at === j}
            onPress={() => patch(j)}
            compact
          />
        ))}
        <LabChip label="UNPLUG" selected={at == null} onPress={() => patch(null)} compact />
      </View>
      {hot ? <Text style={styles.warn}>{`HOT-PATCH — ${PLUGS[hot].short} moved while it was live. The lab keeps it quiet; on a real system that pop or buzz goes straight through the speakers. Turn the MASTER (or that channel’s fader) down, or the speakers off, before you move an audio cable.`}</Text> : null}
    </View>
  );
}

const POWER_ORDER: { id: DeviceId; label: string }[] = [
  { id: 'playerA', label: 'DECK A' },
  { id: 'playerB', label: 'DECK B' },
  { id: 'mixer', label: 'MIXER' },
  { id: 'boothL', label: 'BOOTH L' },
  { id: 'boothR', label: 'BOOTH R' },
  { id: 'paL', label: 'PA L' },
  { id: 'paR', label: 'PA R' },
];

export type PowerEvent = { device: DeviceId; on: boolean; thump: boolean };

/** Flip a device's switch; reports whether it would thump a live speaker. */
export function flipPower(d: DeviceId): PowerEvent {
  const b = getBooth();
  const on = !b.power[d];
  const thump = powerThump(b, d);
  updateBooth((x) => ({ ...x, power: { ...x.power, [d]: on } }));
  return { device: d, on, thump };
}

export function PowerTray({ onEvent, lastEvent }: { onEvent: (e: PowerEvent) => void; lastEvent: PowerEvent | null }) {
  const booth: Booth = getBooth();
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>POWER SWITCHES (a device needs its cord in the strip too)</Text>
      {POWER_ORDER.map((p) => (
        <View key={p.id} style={styles.powerRow}>
          <Text style={[styles.dev, { color: deviceLive(booth, p.id) ? colors.green : colors.textSub }]}>{`${p.label}${booth.power[p.id] && !deviceLive(booth, p.id) ? ' (no power cord)' : ''}`}</Text>
          <LabChip label={booth.power[p.id] ? 'ON' : 'OFF'} selected={booth.power[p.id]} onPress={() => onEvent(flipPower(p.id))} compact />
        </View>
      ))}
      {lastEvent?.thump ? <Text style={styles.warn}>THUMP — a speaker was already on while that switched. In a real room that bang goes straight to the speakers (and to ears). Speakers on LAST, off FIRST, levels down.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  powerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dev: { fontFamily: fonts.oswaldMedium, fontSize: 13, letterSpacing: 0.8 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
});
