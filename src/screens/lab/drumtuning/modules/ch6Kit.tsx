/**
 * Chapter 6 — Tuning a kit. LEARN (read: a range per drum, separation,
 * context, rechecks) → ADJUST (rack: "Build the tom range" — rack and
 * floor tom, heard one after the other, the interval judged; the kit starts
 * UPSIDE DOWN so both faders have to be reasoned about) → PRACTICE (read:
 * save tuning notes — persisted through the host, guest rule applied) →
 * REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { confirmDialog } from '../../../../lib/confirm';
import { faderParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumStatus, Feedback, KeyButton, KeyTerms, Landing, Point, RecallCard, SectionTitle, YourRun, noteName } from '../kit';
import { DRUM_KEY_TERMS, type TuningNote } from '../drumContent';
import { DRUMS, renderStrike, tomInterval, type RenderResult, type StrikeParams } from '../drumEngine';
import { KIT_ASPECT, KitStage, type KitSounding } from '../stagesDrum';
import { useDrumPlayback } from '../useDrumPlayback';
import { RENDER_BADGE, headAtHz, syncOf, type ChapterProps } from './shared';

const RACK_FIRST_S = 1.2;
const GAP_S = 0.35;

/** Rack then floor, in one buffer: the two hits a fill would play. */
function renderBoth(rack: StrikeParams, floor: StrikeParams): RenderResult {
  const a = renderStrike(rack);
  const b = renderStrike(floor);
  const gap = Math.round(GAP_S * 48000);
  const n = Math.round(RACK_FIRST_S * 48000) + gap + b.mono.length;
  const out = new Float32Array(n);
  for (let i = 0; i < Math.min(a.mono.length, n); i++) out[i] = a.mono[i];
  const off = Math.round(RACK_FIRST_S * 48000) + gap;
  for (let i = 0; i < b.mono.length && off + i < n; i++) out[off + i] += b.mono[i];
  return { mono: out, partials: [...a.partials, ...b.partials], seconds: n / 48000, pitchTraces: [] };
}

export function Ch6Kit({ onInteractive, notes, onSaveNote, onDeleteNote, guest, preview }: ChapterProps) {
  // Starts UPSIDE DOWN on purpose (floor above rack): both faders have to be
  // reasoned about, and the three verdicts are all met on the way.
  const [rackHz, setRackHz] = useState(140);
  const [floorHz, setFloorHz] = useState(160);
  const [heardBoth, setHeardBoth] = useState(false);
  const [verdictsSeen, setVerdictsSeen] = useState<Set<string>>(() => new Set(['unbalanced']));
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const reported = useRef(false);

  const rackP = useMemo<StrikeParams>(() => ({ drum: 'rack', batter: headAtHz('rack', rackHz, 'batter'), reso: headAtHz('rack', rackHz, 'reso'), resoPresent: true, damping: 0, strike: 0.85, strikeR: 0.3, strikeTheta: 0 }), [rackHz]);
  const floorP = useMemo<StrikeParams>(() => ({ drum: 'floor', batter: headAtHz('floor', floorHz, 'batter'), reso: headAtHz('floor', floorHz, 'reso'), resoPresent: true, damping: 0, strike: 0.85, strikeR: 0.3, strikeTheta: 0 }), [floorHz]);
  const rack = useDrumPlayback(`rack:${rackHz}`, () => renderStrike(rackP), false);
  const floor = useDrumPlayback(`floor:${floorHz}`, () => renderStrike(floorP), false);
  const both = useDrumPlayback(`both:${rackHz}:${floorHz}`, () => renderBoth(rackP, floorP), false);
  const verdict = tomInterval(rackHz, floorHz);
  useEffect(() => {
    setVerdictsSeen((s) => (s.has(verdict.kind) ? s : new Set([...s, verdict.kind])));
  }, [verdict.kind]);

  useEffect(() => {
    if (both.playing) setHeardBoth(true);
  }, [both.playing]);
  useEffect(() => {
    if (verdict.kind === 'distinct' && heardBoth && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [verdict.kind, heardBoth, onInteractive]);

  const stopAll = () => {
    rack.stop();
    floor.stop();
    both.stop();
  };
  const sounding: KitSounding = both.playing || both.pending ? { which: 'both', switchAt: (RACK_FIRST_S + GAP_S) / (both.rendered?.result.seconds ?? 3.95) } : rack.playing || rack.pending ? { which: 'rack', switchAt: 1 } : floor.playing || floor.pending ? { which: 'floor', switchAt: 0 } : null;
  const sync = both.playing ? syncOf(both) : rack.playing ? syncOf(rack) : syncOf(floor);
  const save = () => {
    const n: TuningNote = {
      id: `n${Date.now().toString(36)}`,
      name: name.trim() || `Kit ${new Date().toLocaleDateString()}`,
      savedAt: Date.now(),
      // The batter pitches only: this step never set a resonant head, so it
      // records none rather than a number it did not measure.
      drums: [
        { drum: DRUMS.rack.name, batterHz: rackHz, note: '' },
        { drum: DRUMS.floor.name, batterHz: floorHz, note: '' },
      ],
    };
    if (note.trim()) n.drums[0].note = note.trim();
    onSaveNote(n);
    setSavedFlash(guest ? (preview ? 'Kept for this session only — a preview saves nothing.' : 'Kept for this session only — sign in to keep tuning notes on this device.') : `Saved "${n.name}" on this device.`);
    setName('');
    setNote('');
  };
  const load = (n: TuningNote) => {
    const r = n.drums.find((d) => d.drum === DRUMS.rack.name);
    const f = n.drums.find((d) => d.drum === DRUMS.floor.name);
    if (r) setRackHz(Math.round(r.batterHz));
    if (f) setFloorHz(Math.round(f.batterHz));
  };
  const remove = (n: TuningNote) => confirmDialog('Delete this tuning note?', `"${n.name}" is removed from this device. The drums keep their current tuning.`, 'Delete', () => onDeleteNote(n.id), { destructive: true });
  const sorted = [...notes].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <ChapterSteps
      steps={[
        {
          key: 'range', title: 'A range for every drum', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>TUNING AS A SET</SectionTitle>
              <Card>
                <Point title="A practical range for each drum">Start each drum in the band where it responds well (Chapter 2's starting bands), then nudge toward the sound you want. A drum fighting its range costs tone on every hit.</Point>
                <Point title="Separation between the toms">Toms tuned too close crowd together — a fill reads as one drum repeated. A clear step between neighbours (many players aim for about a third to a fifth; the drums decide) keeps every drum its own voice. Too wide, and the kit falls apart into unrelated drums.</Point>
                <Point title="Listen in the musical context">A tom that sounds perfect alone may sit under the bass guitar or on top of the vocal. Tune with the band's recordings playing, at the volume the drums will be played.</Point>
                <Point title="Recheck after moving or re-heading">Temperature, humidity, a van ride and a new head all move tuning. Walk the lugs again before the gig.</Point>
                <Point title="Write it down">The next steps build the tom range and save notes you can reproduce.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'toms', title: 'Build the tom range', kind: 'ADJUST', layout: 'rack',
          rack: {
            render: (w, h) => <KitStage width={w} height={h} rackHz={rackHz} floorHz={floorHz} verdict={verdict.kind} sounding={sounding} sync={sync} />,
            aspect: KIT_ASPECT,
            size: 'L',
            badge: 'MODEL · the ladder; the hits are SYNTHESIZED (additive membrane model, offline)',
            bezel: [
              { k: 'RACK', v: `${rackHz} Hz`, tint: colors.cyan },
              { k: 'FLOOR', v: `${floorHz} Hz`, tint: colors.green },
              { k: 'INTERVAL', v: `${verdict.semitones.toFixed(1)} st`, tint: colors.amber, flex: 1.2 },
              { k: 'VERDICT', v: verdict.kind.toUpperCase(), tint: verdict.kind === 'distinct' ? colors.green : verdict.kind === 'close' ? colors.amber : colors.red, flex: 1.4 },
            ],
            params: [
              faderParam({ id: 'rack', label: 'RACK TOM', value: rackHz, min: 100, max: 300, step: 1, format: (v) => `12" rack tom's own pitch ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setRackHz, home: 200 }),
              faderParam({ id: 'floor', label: 'FLOOR TOM', value: floorHz, min: 70, max: 220, step: 1, format: (v) => `16" floor tom's own pitch ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setFloorHz, home: 110 }),
              { kind: 'action', id: 'r', label: '▶ RACK', onPress: () => { stopAll(); rack.play(); } },
              { kind: 'action', id: 'f', label: '▶ FLOOR', onPress: () => { stopAll(); floor.play(); } },
              { kind: 'action', id: 'b', label: '▶ BOTH', onPress: () => { stopAll(); both.play(); } },
            ],
            initialParam: 'floor',
            onTap: () => {
              if (both.playing || rack.playing || floor.playing) stopAll();
              else {
                stopAll();
                both.play();
              }
            },
            tapLabel: 'Display: tap to hear both toms or stop',
          },
          well: (
            <>
              <Landing looking="the two toms and a ladder of their pitches; the kit starts upside down." prompt="Ride RACK TOM and FLOOR TOM until the bracket turns green, then ▶ BOTH." />
              <DrumStatus playing={rack.playing || floor.playing || both.playing} pending={rack.pending || floor.pending || both.pending} rendering={rack.status === 'rendering' || floor.status === 'rendering' || both.status === 'rendering'} idle="stopped · ride RACK TOM and FLOOR TOM, then ▶ BOTH" label={both.playing || both.pending ? 'rack then floor' : rack.playing || rack.pending ? 'the rack tom' : 'the floor tom'} />
              <Feedback tone={verdict.kind === 'distinct' ? 'ok' : 'warn'}>{verdict.message}</Feedback>
              <Card>
                <Point title="The verdicts">DISTINCT: about 2.5 to 9 semitones between neighbouring toms with both drums in their bands. TOO CLOSE: under that. UNBALANCED: a drum forced out of its band, the floor above the rack, or a gap so wide the pair stops reading as one kit. Teaching bands; your ears and your music set the real ones.</Point>
                <Point title="Credit">Reach DISTINCT and hear ▶ BOTH. With two toms placed, a third sits between or above; the snare and kick are tuned for their own jobs (Chapter 5).</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'notes', title: 'Save tuning notes', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <SectionTitle>TUNING NOTES</SectionTitle>
              <Body>A setup you can reproduce: the rack and floor tom pitches from the previous step, a name, and a line about the heads or the room. Saved on this device; LOAD puts a note's pitches back on the faders.</Body>
              <Card tone="accent">
                <Text style={styles.label}>NAME</Text>
                <TextInput value={name} onChangeText={setName} placeholder="e.g. Club set, coated heads" placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel="Name for this tuning note" />
                <Text style={styles.label}>NOTE</Text>
                <TextInput value={note} onChangeText={setNote} placeholder="heads, room, what worked" placeholderTextColor={colors.textMuted} style={[styles.input, { minHeight: 60 }]} multiline accessibilityLabel="Free note" />
                <Text style={styles.values}>{`rack tom ${rackHz} Hz (${noteName(rackHz)}) · floor tom ${floorHz} Hz (${noteName(floorHz)}) — batter pitches; the relationship is Chapter 4's choice`}</Text>
                <KeyButton label="SAVE THIS SETUP" onPress={save} tint={colors.green} />
                {savedFlash ? <Feedback tone={guest ? 'warn' : 'ok'}>{savedFlash}</Feedback> : null}
                {guest && !savedFlash ? <Body>{preview ? 'A members-only preview saves nothing; notes stay for this session.' : 'You are not signed in: notes stay for this session only.'}</Body> : null}
              </Card>
              {sorted.length ? (
                <View style={{ gap: 6 }}>
                  <SectionTitle>SAVED ON THIS DEVICE · {sorted.length}</SectionTitle>
                  {sorted.map((n) => (
                    <View key={n.id} style={styles.noteRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.noteName}>{n.name}</Text>
                        <Text style={styles.noteDetail}>{n.drums.map((d) => `${d.drum.split(' ').slice(0, 2).join(' ')} ${Math.round(d.batterHz)} Hz`).join(' · ')}{n.drums[0]?.note ? ` — ${n.drums[0].note}` : ''}</Text>
                      </View>
                      <Pressable onPress={() => load(n)} style={styles.small} accessibilityRole="button" accessibilityLabel={`Load ${n.name}`}><Text style={styles.smallText}>LOAD</Text></Pressable>
                      <Pressable onPress={() => remove(n)} style={styles.small} accessibilityRole="button" accessibilityLabel={`Delete ${n.name}`}><Text style={[styles.smallText, { color: colors.red }]}>DELETE</Text></Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Body>No notes saved yet.</Body>
              )}
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <YourRun lines={[
                `Rack ${rackHz} / floor ${floorHz} Hz — ${Math.abs(verdict.semitones).toFixed(1)} st, ${verdict.kind.toUpperCase()}${heardBoth ? ', both heard' : ', ▶ BOTH not heard yet'}.`,
                `Verdicts met on the way: ${[...verdictsSeen].map((v) => v.toUpperCase()).join(' → ')}.`,
                `Tuning notes on this device: ${notes.length}.`,
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="Two toms sound like one drum in a fill. What is wrong, and what do you change?" a="They are too close in pitch. Open the step between them — a third to a fifth is a common aim — keeping each drum inside the band where it responds." />
              <RecallCard q="Why recheck tuning after a van ride?" a="Temperature, humidity and a knock all move tuning; walk the lugs again before the gig." />
              <RecallCard q="What goes in a tuning note?" a="Each drum's pitch (and relationship), the heads, the room, and what worked — enough to get back to it." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Each drum in the band where it responds; clear steps between the toms.</Body>
                <Body>• Listen in the music, at playing volume, not only one drum at a time.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.kit} />
              <Body>TRY NEXT: find the widest interval that still reads as one kit, then the narrowest that still reads as two drums — your own bands, not the lab's.</Body>
            </>
          ),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  label: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, backgroundColor: '#101013' },
  values: { color: colors.cyanBright, fontFamily: fonts.mono, fontSize: 12.5 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  noteName: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 13.5 },
  noteDetail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16 },
  small: { minHeight: 44, minWidth: 56, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline },
  smallText: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2 },
});
