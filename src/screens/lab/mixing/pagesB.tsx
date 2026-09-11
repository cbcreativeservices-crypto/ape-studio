/**
 * Beginning Mixing — pages 5–7 (owner brief 2026-09-11; sections: Build a
 * Static Mix · Subtractive Mixing · Panning & Stereo Placement).
 * ALL COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, MiniConsole, countTouched, useFocalChoice, useMixPlayback, useVisitGoals, type MixVariant } from './kit';
import { SESSION_TRACKS, SUBTRACTIVE_MOVES, TRACK_IDS, panRisk, track, type TrackId } from './engine/mixModel.ts';
import type { MixSettings } from './audio/mixAudio.ts';

/* ════ 5 · BUILD A STATIC MIX ═════════════════════════════════════════════ */

const ANCHOR_FOR_FOCAL: Record<string, TrackId> = { vocal: 'lead', groove: 'kick', instrument: 'gtr', atmosphere: 'keys' };

function PageStaticMix({ ctx }: { ctx: PageCtx }) {
  const [focal] = useFocalChoice();
  const suggested = ANCHOR_FOR_FOCAL[focal ?? 'vocal'] ?? 'lead';
  const [anchor, setAnchor] = useState<TrackId | null>(null);
  const [mix, setMix] = useState<MixSettings>({});
  const touched = countTouched(mix, TRACK_IDS);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'wall', label: 'THE WALL', settings: {} },
      { id: 'mine', label: 'MY MIX', settings: mix, matchTo: 'wall' },
    ],
    [mix],
  );
  const pb = useMixPlayback(variants);
  const goals = [
    { label: 'Hear the unmixed wall', hit: pb.heard.includes('wall') },
    { label: 'Commit to an anchor', hit: anchor != null },
    { label: 'Shape at least five tracks', hit: touched >= 5 },
    { label: 'Compare against the wall', hit: touched >= 3 && pb.heard.includes('mine') },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>This is the BALANCE dimension, answered directly: faders, pan, mute, polarity — before any plugin exists. If a mix cannot stand on those four, no processor will save it.</Lead>
      <Card>
        <Eyebrow>STEP 1 — HEAR THE PROBLEM</Eyebrow>
        <Prompt>Every track at the same level is not a mix — it is a wall. Play it and notice you can hear everything and listen to nothing.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="MY MIX is level-matched to the wall, so any improvement you hear is decisions — not loudness." />
      </Card>
      <Card>
        <Eyebrow>STEP 2 — COMMIT TO AN ANCHOR</Eyebrow>
        <Body>
          Your focal point was {focal ? `“${focal}”` : 'not chosen yet (page 1)'} — that suggests {track(suggested).name} as the anchor, but the commitment is yours.
        </Body>
        <Row>
          {SESSION_TRACKS.map((t) => (
            <Btn key={t.id} label={anchor === t.id ? `✓ ${t.name}` : t.name} tone={anchor === t.id ? 'primary' : 'plain'} selected={anchor === t.id} onPress={() => setAnchor(t.id)} a11y={`Anchor ${t.name}`} />
          ))}
        </Row>
      </Card>
      <Card>
        <Eyebrow>STEP 3 — BUILD AROUND IT</Eyebrow>
        <Body>Set the anchor where it feels strong, then add the others in order of importance — each one placed relative to what is already there. Mute anything the song does not need yet.</Body>
        <MiniConsole tracks={TRACK_IDS} value={mix} onChange={setMix} show={{ fader: true, pan: true, mute: true, pol: true }} />
        <Text style={styles.consoleNote}>LEAD and BGV are synth stand-ins for the vocal parts of this session — real stems swap in identically.</Text>
        <Btn label="RESET MIX" disabled={touched === 0} onPress={() => setMix({})} a11y="Reset every channel to flat" />
      </Card>
      <Card tone="note">
        <Eyebrow>CHECK IT LIKE A MIXER</Eyebrow>
        <Body>Two habits, from today onward: compare against where you started (play THE WALL again), and check your balance at LOW volume — if the anchor still leads when the mix is quiet, the balance is real.</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 6 · SUBTRACTIVE MIXING ═════════════════════════════════════════════ */

type MoveVerdict = { ok: boolean; note: string };

const SCENARIO: {
  title: string;
  problem: string;
  verdicts: Record<string, MoveVerdict>;
} = {
  title: 'The crowded chorus',
  problem:
    'In the chorus, keys, guitar and backing pad all sustain at once. The lead is still the loudest thing — but the section feels smeared and the lead feels buried anyway.',
  verdicts: {
    arrangement: { ok: true, note: 'Muting one sustaining layer for the chorus instantly opens space — often the single strongest move.' },
    level: { ok: true, note: 'Lowering the competitors keeps their colour and clears the lead — without pushing the lead into the ceiling.' },
    frequency: { ok: true, note: 'A cut where the pads overlap the lead clears the collision while everything keeps playing.' },
    processing: { ok: false, note: 'Nothing here says a plugin is misbehaving — this smear is arrangement and balance, not processing.' },
    space: { ok: true, note: 'If those sustains carry reverb, drying them tightens the section noticeably.' },
    automation: { ok: false, note: 'Removing an element to make its RETURN hit harder is a movement trick — it does not un-crowd this chorus while it plays.' },
  },
};

function PageSubtractive({ ctx }: { ctx: PageCtx }) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open all six moves', hit: opened.size >= SUBTRACTIVE_MOVES.length },
    { label: 'Try three moves on the chorus', hit: tried.size >= 3 },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>When a mix fights you, the strongest question is rarely “what do I ADD?” It is “what can I take away?” Subtraction is a decision philosophy — and each move works on one of the five dimensions: level on balance, frequency on frequency, space on depth, automation on movement.</Lead>
      <Card>
        <Eyebrow>SIX WAYS TO SUBTRACT</Eyebrow>
        <ConceptList
          items={SUBTRACTIVE_MOVES.map((m) => ({ id: m.id, name: m.name, blurb: m.blurb }))}
          opened={opened}
          onOpen={(id) => setOpened((s) => new Set(s).add(id))}
        />
      </Card>
      <Card>
        <Eyebrow>DECIDE — {SCENARIO.title.toUpperCase()}</Eyebrow>
        <Prompt>{SCENARIO.problem}</Prompt>
        <Body>Try any move to see how it lands here. Several are legitimate — mixing decisions usually have more than one professional answer.</Body>
        {SUBTRACTIVE_MOVES.map((m) => {
          const v = SCENARIO.verdicts[m.id];
          const wasTried = tried.has(m.id);
          return (
            <View key={m.id} style={styles.moveRow}>
              <Btn label={wasTried ? (v.ok ? `✓ ${m.name}` : `— ${m.name}`) : m.name} tone={wasTried ? (v.ok ? 'primary' : 'plain') : 'plain'} selected={wasTried} onPress={() => setTried((s) => new Set(s).add(m.id))} a11y={`Try ${m.name} on the crowded chorus`} />
              {wasTried ? <Text style={[styles.verdict, { color: v.ok ? colors.green : colors.textMuted }]}>{v.note}</Text> : null}
            </View>
          );
        })}
      </Card>
      <Card tone="note">
        <Eyebrow>THE HONEST CORRECTION</Eyebrow>
        <Body>Subtractive EQ is NOT automatically better than additive EQ — both are legitimate tools. The discipline is the order: identify the actual problem first, then make the SMALLEST change that solves it. Sometimes that is a cut. Sometimes it is a boost. Often it is a fader.</Body>
      </Card>
      <UnderstandingCheck
        question="The vocal feels buried. You have already raised it twice this hour. The subtractive instinct says:"
        options={['Raise it a third time, a little more', 'Lower what competes with it instead', 'Add a brighter EQ boost so it cuts', 'Compress it harder so it stays on top']}
        correct={1}
        explain="Raising the focal sound again and again is how mixes spiral upward into the ceiling. Lowering the competition clears the same space — headroom untouched, colour intact."
        wrong={[
          'A third raise buys the same three dB the first two bought — briefly. The spiral is the tell.',
          undefined,
          'Brightness can help a vocal cut, but it treats a balance problem as a tone problem — and the crowd is still there.',
          'Harder compression changes the vocal’s shape, not the crowd around it. The crowd is the problem.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 7 · PANNING & STEREO PLACEMENT ═════════════════════════════════════ */

function PagePanning({ ctx }: { ctx: PageCtx }) {
  const [mix, setMix] = useState<MixSettings>({});
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'stereo', label: 'STEREO', settings: mix },
      { id: 'mono', label: 'MONO FOLD', settings: mix, mono: true, matchTo: 'stereo' },
    ],
    [mix],
  );
  const pb = useMixPlayback(variants);
  const risks = TRACK_IDS.map((id) => ({ id, risk: panRisk(track(id), mix[id]?.pan ?? 0) }));
  const offCentre = risks.filter((r) => (mix[r.id]?.pan ?? 0) !== 0).length;
  const badRisks = risks.filter((r) => r.risk === 'lowEndOffCentre' || r.risk === 'focalOffCentre');
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Place three supports off-centre', hit: offCentre >= 3 && badRisks.length === 0 },
    { label: 'Hear the mono fold', hit: pb.heard.includes('mono') },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Pan answers one of the five questions: WHERE does each sound live? The stereo field is real estate — spend the sides on supporting parts, and keep the mix’s spine at centre.</Lead>
      <Card>
        <Eyebrow>PLACE THE SESSION</Eyebrow>
        <Body>Convention, not law — but a strong default: kick, bass and the focal element live at or near centre; supporting parts earn the sides. Mirror-place similar parts (guitar left, keys right) for balance.</Body>
        <MiniConsole tracks={TRACK_IDS} value={mix} onChange={setMix} show={{ fader: false, pan: true, mute: true }} />
        {badRisks.length > 0 ? (
          <Text style={styles.riskLine} accessibilityLiveRegion="polite">
            {badRisks
              .map((r) =>
                r.risk === 'lowEndOffCentre'
                  ? `${track(r.id).name}: low frequencies far off-centre unbalance the sides, and its level shifts when the mix folds to mono.`
                  : `${track(r.id).name}: the focal anchor drifting off-centre destabilises the whole image.`,
              )
              .join(' ')}
          </Text>
        ) : null}
      </Card>
      <Card>
        <Eyebrow>THE MONO TEST</Eyebrow>
        <Prompt>Clubs, phones, corridor speakers: much of the world hears your mix in mono. Fold your placement down — does anything vanish or collapse?</Prompt>
        <AbPlayer pb={pb} variants={variants} note="The fold is level-matched. Wide placement should survive it: if a part disappears in mono, its width was doing load-bearing work." />
      </Card>
      <UnderstandingCheck
        question="Why do kick and bass conventionally sit at (or very near) centre?"
        options={['Tradition — old consoles could not pan low end this way', 'Low end carries most of the energy — split it and the image tilts', 'Low frequencies cannot be panned at all by a pan pot', 'Because the lead vocal needs the sides kept free']}
        correct={1}
        explain="Low frequencies carry most of a mix’s energy. Push that energy to one side and the whole image leans; fold to mono and off-centre low end shifts level. Centre keeps the spine stable everywhere."
        wrong={[
          'Some old consoles were odd, but the reason survives every modern DAW — it is physics and playback, not nostalgia.',
          undefined,
          'They CAN be panned — pan is just level between speakers. It is a bad idea for the spine, not an impossibility.',
          'The vocal sits at centre WITH them — the sides are for supports, not for the spine.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

// Every page completes via its GOALS (useVisitGoals), never by mere visit.
export const MIXING_PAGES_B: PageDef[] = [
  { title: 'Build a Static Mix', short: 'STATIC', Component: PageStaticMix, manualDone: true },
  { title: 'Subtractive Mixing', short: 'SUBTRACT', Component: PageSubtractive, manualDone: true },
  { title: 'Panning & Stereo Placement', short: 'PAN', Component: PagePanning, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
  consoleNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
  moveRow: { gap: 4 },
  verdict: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  riskLine: { color: colors.gold, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
