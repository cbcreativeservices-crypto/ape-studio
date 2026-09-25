/**
 * The gain-structure chain on the Rack Unit — shared by LEARN chapter 10 and
 * OPERATE's "establish gain structure", which set the same six controls on
 * the same chain of meters.
 *
 * ONE key does chooser-then-slider (owner 2026-08-30): STAGE opens the list
 * of adjustable stages; picking one closes the list and binds the lane to
 * that stage's control, in its own range, with its unity as the double-tap
 * home. The meter under the learner's thumb wears an amber underline on the
 * glass, so cause and effect are one gesture apart.
 */
import { colors } from '../../../theme/tokens';
import { GAIN_STAGES, type GainNode, type GainSettings, type GainStageId, type GainVerdict } from '../../../features/soundsystems/operate';
import { levelColorForDb } from '../../../features/tools/levelColor';
import type { BezelItem, DockParam } from '../rack/rackTypes';
import { lanePos, laneVal } from './rackLayout';

const STAGE_BLURB: Record<GainStageId, string> = {
  source: '',
  preamp: 'The one control that adds gain to a mic-level signal. Set here, once, for the source — starved, and every later stage amplifies its hiss; cranked, and every later stage inherits its clipping.',
  fader: 'The channel’s level in the mix. Near unity when the preamp is right; a fader far from 0 is a preamp set wrong.',
  main: 'The main bus level. Unity: it passes what the channels sum to.',
  procIn: 'The processor’s input trim. Nominal +4 dBu in; anything else is making up for a mistake upstream.',
  procOut: 'The processor’s output trim, feeding the amplifier. Unity — the limiter is set here, from the cabinet’s ratings.',
  amp: 'The amplifier’s input attenuator. Set so the amplifier is the LAST stage to clip — around −12 for a chain that peaks at +20.',
  speaker: '',
};

export const ADJUSTABLE_STAGES = GAIN_STAGES.filter((s) => s.min != null && s.max != null);

/** The STAGE key: a fader-with-chooser bound to `stage`'s control. */
export function gainStageParam(settings: GainSettings, setSettings: (fn: (s: GainSettings) => GainSettings) => void, stage: GainStageId, setStage: (id: GainStageId) => void): DockParam {
  const spec = GAIN_STAGES.find((s) => s.id === stage) ?? ADJUSTABLE_STAGES[0];
  const min = spec.min ?? 0;
  const max = spec.max ?? 0;
  const v = settings[spec.id] ?? spec.unity;
  const short = (db: number) => `${db > 0 ? '+' : ''}${db}`;
  return {
    kind: 'fader',
    id: 'stage',
    label: spec.id === 'preamp' ? 'PREAMP' : spec.id === 'fader' ? 'FADER' : spec.id === 'main' ? 'MAIN' : spec.id === 'procIn' ? 'PROC IN' : spec.id === 'procOut' ? 'PROC OUT' : 'AMP',
    value: lanePos(v, min, max),
    onChange: (p) => {
      const db = laneVal(p, min, max, 1);
      setSettings((s) => (s[spec.id] === db ? s : { ...s, [spec.id]: db }));
    },
    format: (p) => `${short(laneVal(p, min, max, 1))} dB · ${spec.label}${laneVal(p, min, max, 1) === spec.unity ? ' · unity' : ''}`,
    formatShort: (p) => `${short(laneVal(p, min, max, 1))} dB`,
    home: lanePos(spec.unity, min, max),
    chooser: {
      title: 'WHICH STAGE',
      options: ADJUSTABLE_STAGES.map((s) => ({ id: s.id, label: `${s.label} · ${short(settings[s.id] ?? s.unity)} dB`, blurb: STAGE_BLURB[s.id] })),
      selectedId: spec.id,
      onSelect: (id) => setStage(id as GainStageId),
    },
  };
}

/** The chain's four bezel readouts. */
export function gainBezel(chain: GainNode[], verdict: GainVerdict, extra?: BezelItem): BezelItem[] {
  const last = chain[chain.length - 1];
  const least = Math.round(Math.min(...chain.map((n) => n.headroomDb)));
  const vTint = verdict === 'ok' ? colors.green : verdict === 'clipping' ? colors.red : colors.orange;
  return [
    { k: 'AT SPEAKER', v: `${Math.round(last.levelDbu)} dBu`, tint: levelColorForDb(last.levelDbu, -40, 20), flex: 1.1 },
    extra ?? { k: 'ABOVE NOISE', v: `${Math.round(last.snrDb)} dB`, tint: last.snrDb < 70 ? colors.orange : colors.green, flex: 1.1 },
    { k: 'HEADROOM', v: chain.some((n) => n.clipped) ? 'CLIP' : `${least} dB`, tint: chain.some((n) => n.clipped) ? colors.red : least >= 12 ? colors.green : colors.orange },
    { k: 'VERDICT', v: verdict.toUpperCase(), tint: vTint },
  ];
}
