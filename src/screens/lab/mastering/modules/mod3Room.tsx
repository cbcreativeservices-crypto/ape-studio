/**
 * Module 3 — The mastering room and monitoring system. Room before gear:
 * LEARN (read: acoustics, mains + secondary checks) → LEARN (rack: monitoring
 * level and listening habits — hearing-safe) → EXPLORE (rack: build a
 * monitoring path, Sound Systems gear art) → PRACTICE → REVIEW.
 */
import { useMemo, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { splColorForDba } from '../../../../features/tools/levelColor';
import { faderParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, KeyTerms, Point, ScenarioCard, SectionTitle } from '../kit';
import { KEY_TERMS, ROOM_SCENARIOS } from '../masteringContent';
import { PATH_DEVICE_NAMES, checkMonitorPath, monitoringAdvice, perceivedBalanceShift, type PathDevice } from '../masteringEngine';
import { MONITOR_ASPECT, MonitorLevelStage, PATH_ASPECT, MonitorPathStage } from '../stages';
import { MODEL_BADGE, type ModuleProps } from './shared';

const DEVICES: readonly { key: PathDevice; label: string; short: string; blurb: string }[] = [
  { key: 'daw', label: PATH_DEVICE_NAMES.daw, short: 'DAW', blurb: 'The playback software reads the file. Every chain starts here.' },
  { key: 'dac', label: PATH_DEVICE_NAMES.dac, short: 'DAC', blurb: 'Digital to analog. Many interfaces and some monitor controllers convert internally.' },
  { key: 'monitorCtl', label: PATH_DEVICE_NAMES.monitorCtl, short: 'MON CTL', blurb: 'Source selection and a repeatable, often calibrated, listening level.' },
  { key: 'amp', label: PATH_DEVICE_NAMES.amp, short: 'AMP', blurb: 'Only for PASSIVE loudspeakers. An active monitor already has its own.' },
  { key: 'passive', label: PATH_DEVICE_NAMES.passive, short: 'PASSIVE', blurb: 'Needs a power amplifier before it.' },
  { key: 'active', label: PATH_DEVICE_NAMES.active, short: 'ACTIVE', blurb: 'Amplifiers built in: a line-level feed from the controller is all it takes.' },
];

export function Mod3Room({ onAnswered }: ModuleProps) {
  const [level, setLevel] = useState(83);
  const [chain, setChain] = useState<PathDevice[]>([]);
  const [next, setNext] = useState<PathDevice>('daw');
  const verdict = useMemo(() => checkMonitorPath(chain), [chain]);
  const advice = monitoringAdvice(level);
  const shift = perceivedBalanceShift(level);
  const add = () => setChain((c) => (c.length >= 5 || c.includes(next) ? c : [...c, next]));

  return (
    <ModuleSteps
      steps={[
        {
          key: 'room', title: 'Room and listening environment', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <Body>The room comes before the gear list. A mastering judgement is a judgement about what reached the ears, and the room is the last stage of that chain.</Body>
              <SectionTitle>ROOM DESIGN AND ACOUSTIC CONTROL</SectionTitle>
              <Card>
                <Point title="Room noise">Fans, traffic, HVAC: a low noise floor is what lets quiet detail, fades and tails be heard at a moderate level.</Point>
                <Point title="Reflections">Early reflections from nearby surfaces smear the direct sound; treatment at the first-reflection points keeps the stereo image honest.</Point>
                <Point title="Low-frequency behaviour">Room modes and boundary effects set the bass at the listening position. This is the hardest part to get right and the one most likely to mislead a tonal decision.</Point>
                <Point title="Listening position">Symmetrical, away from the walls, with the monitors and the listener forming the triangle the monitors were designed for.</Point>
                <Point title="Avoiding misleading coloration">Everything above is about ONE thing: hearing the programme, not the room, so that what you fix is in the file.</Point>
              </Card>
              <SectionTitle>MAIN MONITORS AND SECONDARY CHECKS</SectionTitle>
              <Card>
                <Point title="Accurate full-range monitoring">The main pair (with a subwoofer if the room allows it) is where decisions are made.</Point>
                <Point title="More than one playback system">A second, smaller pair or a deliberately ordinary speaker tells you how the decision travels.</Point>
                <Point title="Headphones">A valuable supplement for detail, clicks and edits — they do not replace the main room for image, bass or level.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'level', title: 'Monitoring level and listening habits', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <MonitorLevelStage width={w} height={h} levelDb={level} />,
            aspect: MONITOR_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LEVEL', v: `${Math.round(level)} dB SPL`, tint: splColorForDba(level), flex: 1.3 },
              { k: 'BASS READS', v: `${shift.bassDb > 0 ? '+' : ''}${shift.bassDb.toFixed(1)}`, flex: 1.1 },
              { k: 'TREBLE', v: `${shift.trebleDb > 0 ? '+' : ''}${shift.trebleDb.toFixed(1)}` },
              { k: 'READING', v: advice.tone.toUpperCase(), tint: advice.tone === 'sensible' ? colors.green : advice.tone === 'low' ? colors.cyan : advice.tone === 'hot' ? colors.orange : colors.red, flex: 1.2 },
            ],
            params: [
              faderParam({ id: 'level', label: 'MONITOR', value: level, min: 55, max: 100, step: 1, format: (v) => `${Math.round(v)} dB SPL`, formatShort: (v) => `${Math.round(v)} dB`, onChange: setLevel, home: 83, tint: splColorForDba(level) }),
            ],
            initialParam: 'level',
          },
          well: (
            <>
              <Body>Ride MONITOR. The curve is a model of the equal-loudness picture: as the level drops, the ear's sensitivity to the bass (and a little of the treble) falls away faster than at 1 kHz, so a quiet listen reads thin and a loud one reads full — the same file. A tonal decision made at a different level from the last one is a decision about the level.</Body>
              <Card tone={advice.tone === 'sensible' ? 'accent' : advice.tone === 'low' ? 'plain' : 'warn'}>
                <Point title={advice.tone === 'sensible' ? 'A sensible level' : advice.tone === 'low' ? 'Quiet' : advice.tone === 'hot' ? 'Hot' : 'Unsafe'}>{advice.note}</Point>
              </Card>
              <Card>
                <Point title="Consistent, sensible monitoring levels">Pick one moderate working level and return to it. Comparisons mean something only when the level is the same each time; fatigue stays manageable; hearing is protected. The lab never suggests turning up to "hear it better".</Point>
                <Point title="Listening fatigue">Judgement drifts with time and level. Short breaks, the same level, and the room's silence in between are part of the method.</Point>
                <Point title="Hearing safety">The scale on the display is tied to hearing-safety guidance: the orange band begins where a working day's exposure limit is approached. Mastering never needs the red.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'path', title: 'Build a monitoring path', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <MonitorPathStage width={w} height={h} chain={chain} ok={verdict.ok} notes={verdict.notes} />,
            aspect: PATH_ASPECT,
            badge: 'DIAGRAM · real systems vary',
            bezel: [
              { k: 'STAGES', v: `${chain.length} / 5` },
              { k: 'NEXT', v: DEVICES.find((d) => d.key === next)?.short ?? '—', flex: 1.2 },
              { k: 'PATH', v: verdict.ok ? 'COMPLETE' : chain.length ? 'CHECK' : 'EMPTY', tint: verdict.ok ? colors.green : chain.length ? colors.amber : colors.textMuted, flex: 1.3 },
            ],
            params: [
              {
                kind: 'options', id: 'device', label: 'DEVICE', valueLabel: DEVICES.find((d) => d.key === next)?.short ?? '—',
                options: DEVICES.map((d) => ({ id: d.key, label: d.label, blurb: d.blurb })), selectedId: next,
                onSelect: (id) => setNext(id as PathDevice), sticky: false,
              },
              { kind: 'action', id: 'add', label: '+ CONNECT', onPress: add, tint: colors.green },
              { kind: 'action', id: 'undo', label: '‹ UNDO', onPress: () => setChain((c) => c.slice(0, -1)) },
              { kind: 'action', id: 'clear', label: 'CLEAR', onPress: () => setChain([]) },
            ],
            initialParam: 'device',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Choose a DEVICE, then + CONNECT it to the next free slot. Build the complete monitoring path: playback software → conversion → monitor control → power amplifier (if the loudspeakers need one) → loudspeakers. The display checks the order and the pairing.</Body>
              <Card tone={verdict.ok ? 'accent' : 'plain'}>
                {verdict.notes.length ? verdict.notes.map((n) => <Body key={n}>• {n}</Body>) : <Body>Every stage in order. Try the other loudspeaker type: a passive pair needs the amplifier, an active pair makes it a mistake.</Body>}
              </Card>
              <Card>
                <Point title="Real systems vary">A monitor controller may contain the converter; an audio interface may be both; active monitors contain their amplifiers; some rooms run a subwoofer and bass management after the controller. The ORDER of the jobs is what stays the same.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Room and monitoring decisions', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              {ROOM_SCENARIOS.map((s) => (
                <ScenarioCard key={s.id} s={s} onAnswered={(ok) => onAnswered(s.id, ok)} />
              ))}
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• The room is the last stage of the monitoring chain and the first thing to get right.</Body>
                <Body>• Accurate main monitors make the decisions; a second system and headphones check them.</Body>
                <Body>• One moderate, repeatable monitoring level: for comparisons, for fatigue, for hearing.</Body>
                <Body>• The path is an order of jobs — playback, conversion, level, amplification, air — and real systems vary in how the boxes share them.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.room} />
            </>
          ),
        },
      ]}
    />
  );
}
