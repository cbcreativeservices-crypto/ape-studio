/**
 * Advanced Mixing — pages 15–20 (owner brief 2026-09-11; sections:
 * Translation & Quality Control · Stems & Alternate Mixes · Stem
 * Reconstruction · Professional Delivery · Mix Diagnosis · the flawed-mix
 * FINAL). ALL COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, MiniConsole, MixMantra, useMixPlayback, useMixPriorities, useVisitGoals, type MixVariant } from './kit';
import { PRIORITY_CHOICES } from './pagesAdvA';
import { loudnessLufsEstimate, nullResidueDb, sumStereo, truePeakDbEstimate } from './engine/advanced.ts';
import { renderMix, type MixSettings } from './audio/mixAudio.ts';
import { TRACK_IDS, type TrackId } from './engine/mixModel.ts';

/* ════ 15 · TRANSLATION & QUALITY CONTROL ═════════════════════════════════ */

type Measured = { lufs: number; tp: number; masterDb: number };

/** A PANNED session for the QC pages — an all-centred mix folds to itself
 *  (cognition audit round 2 caught the fold A/B playing identical audio). */
const QC_PANS: MixSettings = { gtr: { pan: -45 }, keys: { pan: 45 }, perc: { pan: 30 }, bgv: { pan: -30 } };

function PageTranslation({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const [measuring, setMeasuring] = useState(false);
  const [measured, setMeasured] = useState<Measured | null>(null);
  const [masterDb, setMasterDb] = useState(0);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'stereo', label: 'THE MIX', settings: QC_PANS },
      { id: 'mono', label: 'MONO', settings: QC_PANS, mono: true, matchTo: 'stereo' },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const measure = () => {
    setMeasuring(true);
    setTimeout(() => {
      const m = renderMix(QC_PANS, masterDb);
      const lufs = loudnessLufsEstimate(m.stereo);
      const tp = truePeakDbEstimate(m.stereo);
      setMeasured({ lufs, tp, masterDb });
      setMeasuring(false);
      // iOS VoiceOver never hears LiveRegion lines — announce (design P1-4).
      AccessibilityInfo.announceForAccessibility?.(`Loudness ${lufs.toFixed(1)} LUFS. True peak ${tp.toFixed(1)} dB true peak.`);
    }, 30);
  };
  const goals = [
    { label: 'Measure the mix', hit: measured != null },
    { label: 'Run the mono fold', hit: pb.heard.includes('mono') },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Translation is the only verdict that counts: does the mix survive OTHER systems, other volumes, other formats? Measurement is part of it — LUFS and true peak are the delivery world’s shared ruler, not an artistic target.</Lead>
      <Card>
        <Eyebrow>MEASURE — BS.1770-STYLE ESTIMATES</Eyebrow>
        <Prompt>Set a master trim, then measure the session’s integrated loudness and true peak. (On-device estimates of the ITU-R BS.1770 procedure — teaching numbers, not certified metering.)</Prompt>
        <Row>
          {[-6, -3, 0].map((db) => (
            <Btn key={db} label={`TRIM ${db === 0 ? '0' : db} dB`} tone={masterDb === db ? 'primary' : 'plain'} selected={masterDb === db} onPress={() => setMasterDb(db)} a11y={`Master trim ${db} dB`} />
          ))}
        </Row>
        <Btn label={measuring ? 'MEASURING…' : 'MEASURE'} tone="primary" onPress={measure} disabled={measuring} a11y={measuring ? 'Measuring, please wait' : 'Measure loudness and true peak'} />
        {measured ? (
          <View style={styles.statRow}>
            <View style={styles.statTile} accessible accessibilityLabel={`Loudness ${measured.lufs.toFixed(1)} LUFS at ${measured.masterDb} dB trim`}>
              <Text style={styles.statEyebrow}>LOUDNESS</Text>
              <Text style={styles.statValue}>{measured.lufs.toFixed(1)}</Text>
              <Text style={styles.statUnit}>LUFS · @ {measured.masterDb === 0 ? '0' : measured.masterDb} dB</Text>
            </View>
            <View style={styles.statTile} accessible accessibilityLabel={`True peak ${measured.tp.toFixed(1)} dB true peak${measured.tp <= -1 ? ', within the common ceiling' : ', hot'}`}>
              <Text style={styles.statEyebrow}>TRUE PEAK</Text>
              <Text style={[styles.statValue, { color: measured.tp <= -1 ? colors.green : colors.gold }]}>{measured.tp.toFixed(1)}</Text>
              <Text style={styles.statUnit}>dBTP {measured.tp <= -1 ? '· clear of −1' : '· above −1'}</Text>
            </View>
          </View>
        ) : null}
        {measured ? <Body>Move the trim and re-measure: loudness follows the gain one-for-one — which is exactly why a NUMBER is not a mix decision. On normalized playback, platforms turn loud masters DOWN to their level; what survives is the mix, not the number.</Body> : null}
      </Card>
      <Card>
        <Eyebrow>THE TRANSLATION CHECKS</Eyebrow>
        <Body>Multiple systems (each lies differently — truth is the overlap) · LOW volume (balance shows itself) · mono (below) · low-end on small speakers (does the bass line survive as pitch, not just weight?) · a lossy-codec audition before release (bright, wide mixes fizz first).</Body>
        <AbPlayer pb={pb} variants={variants} note="The fold, matched — the QC habit from the Beginning lab, now one check among several." />
      </Card>
      <UnderstandingCheck
        question="A client demands the mix “hit −8 LUFS because streaming”. The professionally honest answer:"
        options={['Comply — platform numbers are hard requirements for mixes', 'Explain that platforms normalize playback — deliver dynamics, plus a loud reference if they insist', 'Refuse to discuss loudness targets with clients at all', 'Quietly deliver whatever loudness you personally prefer']}
        correct={1}
        explain="On normalized playback, streaming services turn masters down to their own loudness — a crushed −8 LUFS master plays at the SAME volume as a dynamic one, minus the life. Measurement informs; it does not conduct."
        wrong={[
          'Check what the platforms actually do to delivered masters before treating a number as a spec.',
          undefined,
          'Loudness is worth discussing — with the facts on the table.',
          'Silent disobedience burns trust. The facts are persuasive enough on their own.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 16 · STEMS & ALTERNATE MIXES ═══════════════════════════════════════ */

const DELIVERABLES = [
  { id: 'tracks', name: 'Tracks vs multitracks vs stems', blurb: 'Tracks: the raw recordings. Multitracks: all of them, delivered. STEMS: rendered SUBMIXES (drums, music, vocals…) that sum back to the mix.' },
  { id: 'alts', name: 'Alternate mixes', blurb: 'Instrumental · a cappella · TV mix (everything minus lead vocal) · clean (no explicit lyrics) · performance mix. Same mix, planned subtractions.' },
  { id: 'sets', name: 'Standard stem sets', blurb: 'A common ask: drums · bass · music · vocals · FX. Agree on the SET before bouncing — “stems” without a list is a guaranteed redo.' },
  { id: 'align', name: 'Identical starts & lengths', blurb: 'Every stem and alternate starts at the same timestamp and runs the same length — drop them on a timeline and they line up, no questions.' },
  { id: 'naming', name: 'Names & versions', blurb: 'Song_StemName_v3_2026-09-11.wav. The filename answers what, which version, when — forever.' },
] as const;

function PageStems({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open all five cards', hit: seen.size >= DELIVERABLES.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>After “the mix is approved” comes the real product: the deliverables. Stems, alternates, and files whose names still make sense in five years — this is where professional and almost-professional part ways.</Lead>
      <Card>
        <Eyebrow>THE DELIVERABLES VOCABULARY</Eyebrow>
        <ConceptList items={DELIVERABLES.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="The label asks for “the stems”. Before bouncing anything, the professional question is:"
        options={['Which DAW should the bounces come from', 'WHICH stem set — how many, split how, with or without the bus processing and FX?', 'What loudness the stems should each hit', 'Whether MP3 stems are acceptable']}
        correct={1}
        explain="“Stems” names a CATEGORY, not a list. Five music-video stems, eight remix stems, and a TV-mix split are all “stems” — bounce before agreeing the set and you will bounce twice."
        wrong={[
          'The DAW is invisible in a WAV — and this answer still leaves you not knowing what to bounce.',
          undefined,
          'Stems match the MIX’s level story — per-stem loudness targets would break their sum.',
          'Delivery format matters, but it is question two, not question one.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 17 · STEM RECONSTRUCTION (the live null test) ══════════════════════ */

const RHYTHM: readonly TrackId[] = ['kick', 'snare', 'perc', 'bass'];

function stemSettings(keep: readonly TrackId[]): MixSettings {
  const out: MixSettings = {};
  for (const id of TRACK_IDS) if (!keep.includes(id)) out[id] = { mute: true };
  return out;
}

function PageReconstruction({ ctx }: { ctx: PageCtx }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ linear: number; withBus: number } | null>(null);
  const [checkDone, setCheckDone] = useState(false);
  const runNull = () => {
    setRunning(true);
    setTimeout(() => {
      const full = renderMix({});
      const rhythm = renderMix(stemSettings(RHYTHM));
      const music = renderMix(stemSettings(TRACK_IDS.filter((t) => !RHYTHM.includes(t))));
      const summed = sumStereo([rhythm.stereo, music.stereo]);
      const linear = nullResidueDb(summed, full.stereo);
      const fullBus = renderMix({}, 0, { busComp: { thresholdDb: -18, ratio: 4, attackMs: 10, releaseMs: 150 } });
      const withBus = nullResidueDb(summed, fullBus.stereo);
      setResult({ linear, withBus });
      setRunning(false);
      AccessibilityInfo.announceForAccessibility?.(
        `Clean bus residue ${linear.toFixed(0)} dB — the stems null. With the bus compressor, residue ${withBus.toFixed(0)} dB — reconstruction broken.`,
      );
    }, 30);
  };
  const goals = [
    { label: 'Run the null test', hit: result != null },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>The stem contract: summed back together, the stems must REBUILD the approved mix. The proof is a null test — flip one side, sum, and listen to (or measure) what refuses to disappear.</Lead>
      <Card>
        <Eyebrow>RUN IT — REAL MATH ON THE REAL SESSION</Eyebrow>
        <Prompt>Two stems (rhythm · music) are rendered and summed, then measured against the full mix — first with a clean mix bus, then with a bus compressor on the FULL mix only.</Prompt>
        <Btn label={running ? 'RENDERING & MEASURING…' : 'RUN THE NULL TEST'} tone="primary" disabled={running} onPress={runNull} a11y="Run the stem null test" />
        {result ? (
          <View style={styles.nullRows}>
            <View style={styles.nullRow}>
              <Text style={styles.nullLabel}>CLEAN BUS</Text>
              <Text style={styles.statValue}>{result.linear.toFixed(0)} dB</Text>
              <View style={[styles.verdictChip, result.linear < -60 ? styles.chipPass : styles.chipFail]}>
                <Text style={[styles.verdictText, { color: result.linear < -60 ? colors.green : colors.gold }]}>{result.linear < -60 ? 'NULLS ✓' : 'NO NULL'}</Text>
              </View>
            </View>
            <View style={styles.nullRow}>
              <Text style={styles.nullLabel}>BUS COMP ON FULL MIX</Text>
              <Text style={styles.statValue}>{result.withBus.toFixed(0)} dB</Text>
              <View style={[styles.verdictChip, styles.chipFail]}>
                <Text style={[styles.verdictText, { color: colors.gold }]}>BROKEN ✗</Text>
              </View>
            </View>
          </View>
        ) : null}
        {result ? (
          <Body>The linear sum nulls to silence: stems + summing = the mix, exactly. Add ONE nonlinear stage (the bus compressor) to the full mix and the stems can no longer rebuild it — the compressor reacted to the WHOLE mix, something no separate stem experienced. This is why stem specs must state what happens with mix-bus processing: printed onto each stem (compromise), delivered separately, or documented as unreconstructable.</Body>
        ) : null}
      </Card>
      <UnderstandingCheck
        question="Your stems sum back 1.5 dB louder and “thicker” than the approved mix. The most likely cause:"
        options={['WAV files simply gain a little level when copied around', 'The mix bus had processing the stems each re-passed — per-stem it compresses less', 'Stems always sound a bit different; nobody expects a null', 'The sample rate silently changed during the stem bounce']}
        correct={1}
        explain="Bounce each stem through the bus chain and every stem meets the compressor alone — less level across the same threshold, less gain reduction — so the stems sum hotter and denser than the mix that was compressed as a whole. Decide the policy, write it in the delivery notes."
        wrong={[
          'Digital copies are bit-identical — files do not grow level.',
          undefined,
          'The null IS the professional expectation for linear paths — that is the stem contract.',
          'A rate change breaks timing, not summed loudness by 1.5 dB with added thickness.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 18 · PROFESSIONAL DELIVERY ═════════════════════════════════════════ */

const DELIVERY = [
  { id: 'versions', name: 'Version control', blurb: 'v1, v2, v3 — never “final”. The approved one gets tagged APPROVED and frozen; notes ride in a text file beside it.' },
  { id: 'metadata', name: 'Metadata & documentation', blurb: 'Sample rate, bit depth, tempo, key, what the bus chain was, who to call. The session six months from now is a stranger — write to them.' },
  { id: 'archive', name: 'Archive & recall', blurb: 'The full session, its samples, and a rendered safety of everything — stored so a recall in a year is an open, not an archaeology dig.' },
] as const;

/** The checklist ENACTED (design pass P2-5): "ticked, not remembered" — so
 *  the page renders it as an actual tickable list, not more reading. */
const DELIVERY_TICKS = [
  { id: 'set', label: 'Stem set agreed in writing' },
  { id: 'formats', label: 'Formats confirmed (rate, depth, file type)' },
  { id: 'starts', label: 'Every file starts at the same timestamp' },
  { id: 'inspected', label: 'Every bounce opened and inspected' },
  { id: 'names', label: 'Names consistent, versioned, dated' },
  { id: 'notes', label: 'Delivery notes included (chain, contacts)' },
] as const;

function PageDelivery({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open all three practices', hit: seen.size >= DELIVERY.length },
    { label: 'Tick the whole checklist', hit: ticked.size >= DELIVERY_TICKS.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Delivery is a craft with its own failure modes — and its own reputation. The engineer whose files are named right, aligned right, and documented right gets called again.</Lead>
      <Card>
        <Eyebrow>THE PRACTICES</Eyebrow>
        <ConceptList items={DELIVERY.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <Card>
        <Eyebrow>THE DELIVERY CHECKLIST — TICKED, NOT REMEMBERED</Eyebrow>
        <Prompt>Run it like the real thing: tick each line as if this were your delivery.</Prompt>
        {DELIVERY_TICKS.map((t) => {
          const on = ticked.has(t.id);
          return (
            <Btn
              key={t.id}
              label={`${on ? '☑' : '☐'} ${t.label}`}
              tone={on ? 'primary' : 'plain'}
              selected={on}
              onPress={() => setTicked((s) => new Set(s).add(t.id))}
              a11y={`${t.label}: ${on ? 'ticked' : 'not ticked'}`}
            />
          );
        })}
      </Card>
      <UnderstandingCheck
        question="A year later: “small lyric change, can you recall the mix?” What decided, a year AGO, whether this is an hour or a disaster?"
        options={['How good the mix itself was', 'The archive: session + samples + documented chain, stored complete', 'Which DAW version was fashionable', 'Whether the label paid on time']}
        correct={1}
        explain="Recalls are won at delivery time. A complete archive — session, every sample it references, the notes that explain it — turns “a year later” into “open, change, bounce”."
        wrong={[
          'A great mix in a lost session is a great memory.',
          undefined,
          'DAW fashion is not what strands old sessions — think about what a session file points AT.',
          'Payment history opens no session files.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 19 · MIX DIAGNOSIS ═════════════════════════════════════════════════ */

const CASES: { id: string; name: string; symptom: string; flawed: MixSettings; fixed: MixSettings; options: string[]; correct: number; explain: string; wrong: (string | undefined)[] }[] = [
  {
    id: 'muddy',
    name: 'CASE 1 — “IT’S MUDDY”',
    symptom: 'Everything feels thick and undefined; turning things up makes it worse.',
    flawed: { keys: { eq: { hz: 240, gainDb: 5, q: 0.9 } }, gtr: { eq: { hz: 220, gainDb: 4, q: 0.9 } }, bgv: { eq: { hz: 260, gainDb: 4, q: 0.9 } } },
    fixed: { keys: { hpHz: 220 }, gtr: { hpHz: 200 }, bgv: { hpHz: 240 } },
    options: ['Too much treble stacking up everywhere at once', 'Low-mid buildup — several parts stacking energy near 250 Hz', 'The whole mix is simply too quiet and needs level', 'Not enough reverb to smooth the rough edges over'],
    correct: 1,
    explain: 'Mud is almost always ACCUMULATED low-mids — each part harmless alone, oppressive summed. The repair: high-pass the non-bass parts and carve the buildup, not “more of anything”.',
    wrong: ['Treble is the one range NOT crowded here — listen low.', undefined, 'Level changes move the mud with everything else.', 'Reverb ADDS energy to the crowd — the opposite direction.'],
  },
  {
    id: 'harsh',
    name: 'CASE 2 — “IT’S HARSH”',
    symptom: 'Loud playback hurts; everything fights to be bright.',
    flawed: { lead: { eq: { hz: 3200, gainDb: 6, q: 1.2 } }, gtr: { eq: { hz: 3000, gainDb: 5, q: 1.2 } }, perc: { faderDb: 4 } },
    fixed: { lead: { eq: { hz: 3200, gainDb: 1, q: 1.2 } }, gtr: { eq: { hz: 3000, gainDb: 0, q: 1.2 } }, perc: { faderDb: -2 } },
    options: ['Presence-range pileup — several parts boosted into the same 2–4 kHz shelf', 'The mix needs more low end to balance it', 'The sample rate is too low', 'The room’s acoustics are harsh, not the mix'],
    correct: 0,
    explain: 'Harshness concentrates where the ear is most sensitive (2–4 kHz). Three parts each “given presence” is a pileup — undo the stacked boosts; brightness returns as clarity instead of pain.',
    wrong: [undefined, 'Adding low end just makes a harsh mix LOUD and harsh.', 'Harshness is spectral balance, not resolution.', 'A real possibility in life — but here the boosts are printed in the session.'],
  },
  {
    id: 'buried',
    name: 'CASE 3 — “THE VOCAL IS BURIED”',
    symptom: 'The lead is technically loud enough on the meter, yet you cannot follow it.',
    flawed: { gtr: { faderDb: 5 }, keys: { faderDb: 4 }, lead: { verbSendDb: 0 } },
    fixed: { gtr: { faderDb: -1 }, keys: { faderDb: -2 }, lead: { verbSendDb: -14 } },
    options: ['The vocal fader simply needs another +6 dB, done', 'Competitors at full level in its range, plus heavy reverb setting it back', 'The vocalist needs to re-record the take louder', 'Add a vocal widener so it stands out from the band'],
    correct: 1,
    explain: 'A buried vocal is usually a CROWD problem plus a DEPTH problem: the space around it is occupied, and drowning it in reverb pushes it behind the band. Lower the competitors, dry the voice forward.',
    wrong: ['The meter already says it is loud enough — the fader was never the story.', undefined, 'The recording is fine; the mix seated it badly.', 'Width moves it sideways, not FORWARD — and costs mono.'],
  },
];

function PageDiagnosis({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Set<string>>(new Set());
  // Headroom trims (cognition round 2): without them the harsh/buried flawed
  // renders CLIP full-scale — an unlabeled extra flaw contaminating the
  // diagnosis. The matchTo pairs follow the trims automatically.
  const caseVariants = useMemo<readonly MixVariant[]>(
    () =>
      CASES.flatMap((c) => [
        { id: `${c.id}-bad`, label: `${c.id.toUpperCase()} FLAWED`, settings: c.flawed, masterDb: c.id === 'harsh' ? -4 : c.id === 'buried' ? -3 : 0, ...(c.id === 'buried' ? { sharedVerb: { space: 'hall' as const, returnDb: 2 } } : {}) },
        { id: `${c.id}-fix`, label: `${c.id.toUpperCase()} REPAIRED`, settings: c.fixed, ...(c.id === 'buried' ? { sharedVerb: { space: 'room' as const, returnDb: -6 } } : {}), matchTo: `${c.id}-bad` },
      ]),
    [],
  );
  const pb = useMixPlayback(caseVariants);
  const goals = [{ label: 'Solve all three cases', hit: solved.size >= CASES.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Diagnosis is the skill that makes every other skill usable: hear a SYMPTOM, name the CAUSE, choose the smallest repair. Three classic complaints, each with the flawed audio and its repair.</Lead>
      {CASES.map((c) => (
        <Card key={c.id}>
          <Eyebrow>{c.name}</Eyebrow>
          <Prompt>{c.symptom}</Prompt>
          <AbPlayer pb={pb} variants={caseVariants.filter((v) => v.id.startsWith(c.id))} note="Flawed and repaired, level-matched — diagnose from the FLAWED one before peeking via the repair." />
          <UnderstandingCheck
            eyebrow={`${c.name} — THE DIAGNOSIS`}
            question="What is actually wrong?"
            options={c.options}
            correct={c.correct}
            explain={c.explain}
            wrong={c.wrong}
            onCorrect={() => setSolved((s) => new Set(s).add(c.id))}
          />
        </Card>
      ))}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 20 · THE FINAL — REPAIR A FLAWED MIX ═══════════════════════════════ */

/** The deliberately flawed handoff: buried lead, hot CENTRED guitar (that
 *  flaw is named in the copy), muddy keys, drowned space. Panned supports so
 *  the mono fold is honest, and headroom trimmed so clipping is not an
 *  unlabeled fifth flaw (cognition round 2). Every flaw is repairable with
 *  tools this lab taught. */
const FLAWED: MixSettings = {
  gtr: { faderDb: 5 },
  keys: { faderDb: 3, pan: 40, eq: { hz: 240, gainDb: 5, q: 0.9 } },
  perc: { pan: 30 },
  lead: { faderDb: -6, verbSendDb: 0 },
  bgv: { faderDb: -2, pan: -35, verbSendDb: -2 },
  snare: { verbSendDb: -4 },
};

const FINAL_ADV_STEPS = [
  { id: 'diagnose', name: '1 · Diagnose', blurb: 'Listen to the handoff and name its problems (check below).', verified: true },
  { id: 'balance', name: '2 · Rebuild the balance', blurb: 'Lead up, guitar tamed — at least four channels reshaped.', verified: true },
  { id: 'masking', name: '3 · Clear the mud', blurb: 'A high-pass or cut on the keys’ low-mid buildup.', verified: true },
  { id: 'space', name: '4 · Rescue the depth', blurb: 'Rein in the drowned sends (the repair render dries the space as you balance).', verified: true },
  { id: 'bus', name: '5 · Conservative bus', blurb: 'The repaired render carries gentle glue (2:1, slow) — hear that it holds hands without pumping.', verified: true },
  { id: 'translate', name: '6 · Translation check', blurb: 'Fold your repair to mono.', verified: true },
  { id: 'deliver', name: '7 · Deliver', blurb: 'Version name, aligned bounces, notes. (On your honor — your DAW, your files.)', verified: false },
] as const;

function PageAdvFinal({ ctx }: { ctx: PageCtx }) {
  const [mix, setMix] = useState<MixSettings>(FLAWED);
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [diagnosed, setDiagnosed] = useState(false);
  const [priorityIds] = useMixPriorities();
  const priorities = priorityIds.map((id) => PRIORITY_CHOICES.find((p) => p.id === id)?.name ?? id);
  const repaired = useMemo<MixSettings>(() => {
    // The learner's console state IS the repair; the render adds sane sends
    // in place of the drowned ones once they engage.
    const m: MixSettings = { ...mix };
    m.lead = { ...(m.lead ?? {}), verbSendDb: -12 };
    m.bgv = { ...(m.bgv ?? {}), verbSendDb: -12 };
    m.snare = { ...(m.snare ?? {}), verbSendDb: -12 };
    return m;
  }, [mix]);
  // Bus comp at −20 dB threshold ≈ 2.3 dB linked GR (measured) — real glue;
  // −14 was inert (cognition round 2). masterDb −3 keeps the flawed render
  // off the ceiling so clipping is not an unlabeled extra flaw.
  const BUS = { thresholdDb: -20, ratio: 2, attackMs: 30, releaseMs: 200 };
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'flawed', label: 'THE HANDOFF', settings: FLAWED, masterDb: -3, sharedVerb: { space: 'hall', returnDb: 2 } },
      { id: 'repair', label: 'YOUR REPAIR', settings: repaired, sharedVerb: { space: 'room', returnDb: -4 }, busComp: BUS, matchTo: 'flawed' },
      { id: 'mono', label: 'REPAIR, MONO', settings: repaired, sharedVerb: { space: 'room', returnDb: -4 }, busComp: BUS, mono: true, matchTo: 'flawed' },
    ],
    [repaired],
  );
  const pb = useMixPlayback(variants);
  const leadUp = (mix.lead?.faderDb ?? -6) >= -2;
  const gtrTamed = (mix.gtr?.faderDb ?? 5) <= 1;
  const changed = TRACK_IDS.filter((id) => JSON.stringify(mix[id] ?? {}) !== JSON.stringify(FLAWED[id] ?? {})).length;
  const mudCleared = !!(mix.keys?.hpHz || (mix.keys?.eq && mix.keys.eq.gainDb <= 0));
  const stepDone = (id: string): boolean => {
    switch (id) {
      case 'diagnose':
        return diagnosed;
      case 'balance':
        return leadUp && gtrTamed && changed >= 4;
      case 'masking':
        return mudCleared;
      case 'space':
      case 'bus':
        return pb.heard.includes('repair');
      case 'translate':
        return pb.heard.includes('mono');
      default:
        return tapped.has(id);
    }
  };
  const finished = FINAL_ADV_STEPS.every((s) => stepDone(s.id));
  const goals = [{ label: 'Complete all seven steps', hit: finished }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <MixMantra />
      <Lead>The handoff from hell: a mix someone else abandoned — vocal buried, guitar hot and centred, keys muddy, everything drowned. Repair it, check it, deliver it. This is the job.</Lead>
      <Card>
        <Eyebrow>STEP 1 — DIAGNOSE THE HANDOFF</Eyebrow>
        <AbPlayer pb={pb} variants={[variants[0]]} />
        <UnderstandingCheck
          eyebrow="THE HANDOFF — YOUR DIAGNOSIS"
          question="Name the handoff’s problems (pick the complete diagnosis):"
          options={['Harsh cymbals + over-wide keys + thin bass + a clicky kick', 'Buried lead + hot centred guitar + low-mid mud + drowned space', 'Dull top end + weak snare + drowned guitar + a hot lead', 'A clean mix that only needs mastering-stage loudness']}
          correct={1}
          explain="Four named problems, four repairs — that specificity IS the diagnosis. Everything else on this page executes it."
          wrong={[
            'Listen again — the cymbals and kick are among the few HEALTHY things here.',
            undefined,
            'Half-right lists are the diagnostic trap — check each claim against what you actually hear.',
            'Louder would make every one of its problems louder.',
          ]}
          onCorrect={() => setDiagnosed(true)}
        />
      </Card>
      <Card>
        <Eyebrow>THE REPAIR CONSOLE</Eyebrow>
        <Prompt>These faders ARE the flawed handoff — every number you see is someone else’s mistake. Fix them here.</Prompt>
        <MiniConsole tracks={TRACK_IDS} value={mix} onChange={setMix} show={{ fader: true, pan: true, mute: true, pol: true }} />
        <Btn
          label={mix.keys?.hpHz ? '✓ KEYS HIGH-PASSED (220 Hz)' : 'HIGH-PASS THE KEYS (220 Hz)'}
          tone={mix.keys?.hpHz ? 'primary' : 'plain'}
          selected={!!mix.keys?.hpHz}
          onPress={() => setMix((m) => ({ ...m, keys: { ...(m.keys ?? {}), hpHz: m.keys?.hpHz ? undefined : 220 } }))}
          a11y="Toggle a 220 hertz high-pass on the keys"
        />
        <Btn label="BACK TO THE FLAWED HANDOFF" onPress={() => setMix(FLAWED)} a11y="Reset the console to the flawed handoff" />
      </Card>
      <Card>
        <Eyebrow>LISTEN — HANDOFF VS YOUR REPAIR</Eyebrow>
        <AbPlayer pb={pb} variants={variants} note="Level-matched. YOUR REPAIR carries your console decisions, tamed sends, and a conservative bus chain (≈2 dB of linked glue); the fold is the last word." />
      </Card>
      <Card>
        <Eyebrow>THE STEPS — VERIFIED AS YOU WORK</Eyebrow>
        {FINAL_ADV_STEPS.map((s) => {
          const isDone = stepDone(s.id);
          // Verified steps are STATUS rows (goal-chip grammar), not disabled
          // buttons; only the honor step is a real control (design pass 9).
          return s.verified ? (
            <View key={s.id} style={styles.finalRow} accessible accessibilityLabel={`${s.name}: ${isDone ? 'done' : 'not yet'}. ${s.blurb}`}>
              <Text style={[styles.finalStatus, isDone && { color: colors.green }]}>
                {isDone ? '✓ ' : '○ '}
                {s.name}
              </Text>
              <Text style={styles.finalBlurb}>{s.blurb}</Text>
            </View>
          ) : (
            <View key={s.id} style={styles.finalRow}>
              <Btn label={isDone ? `✓ ${s.name}` : s.name} tone={isDone ? 'primary' : 'plain'} selected={isDone} onPress={() => setTapped((t) => new Set(t).add(s.id))} a11y={`${s.name}: ${s.blurb}${isDone ? '. Done.' : ''}`} />
              <Text style={styles.finalBlurb}>{s.blurb}</Text>
            </View>
          );
        })}
      </Card>
      {finished ? (
        <Card tone="ok">
          <Eyebrow>DELIVERED</Eyebrow>
          <Body>
            You diagnosed, repaired, glued, translated and shipped a mix you did not start — the advanced skill in one sentence.
            {priorities.length === 3 ? ` And your page-2 contract — ${priorities.join(', ')} — did the repair honour it? That question, asked at the end of every mix, is the habit that keeps improving you.` : ''}{' '}
            Both mixing labs are yours now; the deep-dive labs (EQ, dynamics, de-esser, ear training, analyzers) sharpen every edge you just used.
          </Body>
        </Card>
      ) : null}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

export const MIXING_ADV_PAGES_D: PageDef[] = [
  { title: 'Translation & Quality Control', short: 'QC', Component: PageTranslation, manualDone: true },
  { title: 'Stems & Alternate Mixes', short: 'STEMS', Component: PageStems, manualDone: true },
  { title: 'Stem Reconstruction', short: 'NULL', Component: PageReconstruction, manualDone: true },
  { title: 'Professional Delivery', short: 'DELIVER', Component: PageDelivery, manualDone: true },
  { title: 'Mix Diagnosis', short: 'DIAGNOSE', Component: PageDiagnosis, manualDone: true },
  { title: 'The Final Repair', short: 'FINAL', Component: PageAdvFinal, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
  measureLine: { color: colors.amber, fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 18 },
  finalRow: { gap: 4 },
  finalBlurb: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  finalStatus: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 0.8 },
  // The measurement payoffs (design pass 6): stat tiles + verdict chips.
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, minHeight: 76, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, gap: 3 },
  statEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6 },
  statValue: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 22 },
  statUnit: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5 },
  nullRows: { gap: 8 },
  nullRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10 },
  nullLabel: { flex: 1, color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  verdictChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  chipPass: { borderColor: colors.green, backgroundColor: '#0f2416' },
  chipFail: { borderColor: colors.gold, backgroundColor: '#241c0c' },
  verdictText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1 },
});
