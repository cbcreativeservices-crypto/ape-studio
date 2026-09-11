/**
 * Advanced Mixing — pages 1–5 (owner brief 2026-09-11; gate + sections:
 * Advanced Mix Planning · Complex Session Management · Groups, Subgroups &
 * VCAs · Advanced Auxiliary Routing). ALL COPY IS NEW — owner ratification
 * pending (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { loadPagedProgress } from '../../../features/lab/pagedProgress';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, OpenLabLink, useMixPlayback, useMixPriorities, useVisitGoals, type MixVariant } from './kit';
import type { MixSettings } from './audio/mixAudio.ts';

/* ════ 1 · BEFORE YOU BEGIN (the prerequisite gate) ═══════════════════════ */

const BML_PAGE_COUNT = 16;

function PageGate({ ctx }: { ctx: PageCtx }) {
  const [bmlDone, setBmlDone] = useState<boolean | null>(null);
  const [passed, setPassed] = useState(0);
  useEffect(() => {
    let alive = true;
    void loadPagedProgress('mixing-beg').then((p) => {
      if (alive) setBmlDone(p.completed.length >= BML_PAGE_COUNT);
    });
    return () => {
      alive = false;
    };
  }, []);
  const unlocked = bmlDone === true || passed >= 3;
  const goals = [{ label: bmlDone ? 'Beginning Mixing complete' : 'Prove the foundations (3 checks)', hit: unlocked }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>This lab assumes the Beginning lab’s foundations: the channel path, level-matched judgment, the six routing terms. The boundary rule: Beginning asked “can you make a clear, balanced stereo mix?” — Advanced asks “can you manage, refine, troubleshoot and DELIVER a complex one?” The five dimensions still rule — balance, clarity, depth, movement, focus — Advanced pursues the same five at scale.</Lead>
      {bmlDone === true ? (
        <Card tone="ok">
          <Eyebrow>PREREQUISITE MET</Eyebrow>
          <Body>Your Beginning Mixing lab is complete on this device — carry on.</Body>
        </Card>
      ) : (
        <>
          <Card tone="note">
            <Eyebrow>TWO WAYS IN</Eyebrow>
            <Body>Finish the Beginning Mixing lab (recommended — this lab leans on it constantly), or prove the foundations right here with three checks.</Body>
            <OpenLabLink route="BeginningMixingLab" label="OPEN BEGINNING MIXING" />
          </Card>
          <UnderstandingCheck
            question="A post-fader send to a reverb: what happens to the reverb when you pull the channel fader down?"
            options={['Nothing — sends are independent of faders', 'It falls with the fader — post-fader copies follow the mix', 'It gets louder to compensate automatically', 'The reverb switches itself to the next channel']}
            correct={1}
            explain="Post-fader means tapped AFTER the fader — the copy follows every mix move. That is why effects ride post and cue feeds ride pre."
            wrong={[
              'So muting a channel would leave its reverb blasting — mix one show and this theory dies fast.',
              undefined,
              'No console volunteers gain. Nothing in a send path compensates for anything.',
              'Signals do not migrate between channels — routing only goes where it is patched.',
            ]}
            onCorrect={() => setPassed((n) => n + 1)}
          />
          <UnderstandingCheck
            question="Comparing a processed mix against bypass, the processed one is 2 dB louder. The comparison is…"
            options={['Fine — the processing earned the level', 'Invalid until the two are level-matched', 'Fine if the processing is subtle', 'Better done on headphones']}
            correct={1}
            explain="Louder reads as better in everyone, every time. Match the loudness, then judge — the foundation rule this whole lab stands on."
            wrong={[
              'Louder always grades better — that is the bias at work, not a verdict.',
              undefined,
              'Subtle processing is exactly where the loudness bias does the most damage.',
              'Headphones change the speakers, not the bias.',
            ]}
            onCorrect={() => setPassed((n) => n + 1)}
          />
          <UnderstandingCheck
            question="One compressor should squeeze the whole drum kit as a unit. You need…"
            options={['A VCA controlling all the drum channels', 'A subgroup the drums’ audio sums through', 'A control group linking the drum faders', 'Higher ratios on each drum’s own compressor']}
            correct={1}
            explain="Shared processing needs a shared AUDIO path — a subgroup. VCAs and control groups move controls; no summed signal exists for a compressor to grab."
            wrong={[
              'That moves the faders together — but what would the one compressor be inserted ON?',
              undefined,
              'Linked CONTROLS are not merged AUDIO.',
              'Three private compressors can never share one envelope.',
            ]}
            onCorrect={() => setPassed((n) => n + 1)}
          />
        </>
      )}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 2 · ADVANCED MIX PLANNING ══════════════════════════════════════════ */

const PLANNING = [
  { id: 'priorities', name: 'Priorities first', blurb: 'Write the three things THIS mix must do before touching a fader — everything else negotiates around them.' },
  { id: 'refs', name: 'Reference analysis', blurb: 'Two references, studied: where does their vocal sit? How wide? How much low end? Steal decisions, not sounds.' },
  { id: 'genre', name: 'Genre expectations', blurb: 'A drill mix and a folk mix are different CONTRACTS with the listener. Know which one you signed.' },
  { id: 'strategy', name: 'Processing strategy', blurb: 'Decide bus architecture and shared spaces BEFORE the session sprawls — retrofitting routing mid-mix breeds errors.' },
  { id: 'revisions', name: 'Revision planning', blurb: 'Mixes get notes. Version names, saved snapshots, and a recall path are part of the mix, not an afterthought.' },
] as const;

export const PRIORITY_CHOICES = [
  { id: 'vocalForward', name: 'Vocal-forward' },
  { id: 'grooveFirst', name: 'Groove first' },
  { id: 'wideAndDeep', name: 'Wide & deep' },
  { id: 'punchTight', name: 'Punchy & tight' },
  { id: 'warmVintage', name: 'Warm & unhurried' },
  { id: 'translation', name: 'Translates everywhere' },
] as const;

function PagePlanning({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const [priorities, togglePriority] = useMixPriorities();
  const goals = [
    { label: 'Open every planning move', hit: seen.size >= PLANNING.length },
    { label: 'Commit to three priorities', hit: priorities.length >= 3 },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Amateur mixes start at the kick drum. Professional mixes start at a DECISION LIST — because on a 60-track session, taste without a plan is just wandering.</Lead>
      <Card>
        <Eyebrow>THE PLAN, BEFORE THE FADERS</Eyebrow>
        <ConceptList items={PLANNING.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <Card>
        <Eyebrow>COMMIT — YOUR THREE PRIORITIES</Eyebrow>
        <Prompt>Not a quiz: a contract with yourself. Pick the THREE things this lab’s session must do — the final page will hold you to them.</Prompt>
        <Row>
          {PRIORITY_CHOICES.map((p) => {
            const on = priorities.includes(p.id);
            return <Btn key={p.id} label={on ? `✓ ${p.name}` : p.name} tone={on ? 'primary' : 'plain'} selected={on} onPress={() => togglePriority(p.id)} a11y={`${on ? 'Remove' : 'Choose'} priority ${p.name}`} />;
          })}
        </Row>
        <Body>{priorities.length === 3 ? '✓ Three named. Every decision from here negotiates around these.' : `${priorities.length}/3 chosen — a priority list longer than three is a wish list.`}</Body>
      </Card>
      <UnderstandingCheck
        question="Halfway through a dense mix you realise the drums, percussion and two loops all need the same treatment. The planning lesson:"
        options={['Copy the same plugin to all nine tracks now', 'Bus architecture decided up front would have given them one shared path — build it now, carefully', 'Mix the nine tracks quieter to avoid the issue', 'Bounce everything and start a new session']}
        correct={1}
        explain="Nine copies of one plugin is nine chances to drift apart. The shared-path decision belongs at the planning stage — and when you missed it, the fix is still routing, retrofitted deliberately."
        wrong={[
          'Nine copies drift: one gets tweaked, eight don’t. The problem is architecture, not plugin count.',
          undefined,
          'Quieter drums are still nine unlinked treatments — and now they’re also quiet.',
          'A restart costs the whole session to fix one missing bus — there is a cheaper repair.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 3 · COMPLEX SESSION MANAGEMENT ═════════════════════════════════════ */

const SESSION_MGMT = [
  { id: 'templates', name: 'Templates', blurb: 'Your routing, buses, shared effects and naming — pre-built. Every mix starts at minute twenty, not minute zero.' },
  { id: 'folders', name: 'Folders & visibility', blurb: 'Drums folded into one lane until they need attention. What you cannot see cannot distract you.' },
  { id: 'maps', name: 'Routing maps', blurb: 'On big sessions, write the signal flow down. The map catches the double-route your ears will miss at 1 a.m.' },
  { id: 'order', name: 'Processing order', blurb: 'Know WHY each insert sits where it sits — EQ into compressor and compressor into EQ are different sounds.' },
  { id: 'cpu', name: 'Resource management', blurb: 'Freeze, commit or bounce heavy chains. A stuttering session makes bad listening decisions for you.' },
] as const;

function PageSessionMgmt({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open every practice', hit: seen.size >= SESSION_MGMT.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>A complex session is an instrument of its own. The mixes that survive 80 tracks are the ones where the SESSION was mixed first: organised, mapped, and light enough to run.</Lead>
      <Card>
        <Eyebrow>THE PRACTICES</Eyebrow>
        <ConceptList items={SESSION_MGMT.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <Card>
        <Eyebrow>THIS SESSION’S ROUTING MAP</Eyebrow>
        <Body>The map for the 8-track session you will repair in the final — channels into family buses, buses into the mix. On a real 80-track session this drawing is the difference between routing and archaeology.</Body>
        <RoutingMap />
      </Card>
      <UnderstandingCheck
        question="EQ before the compressor, or after? The advanced answer:"
        options={['Always EQ first — that is the professional standard', 'Always compressor first — it protects the EQ from peaks', 'It depends: EQ first changes what the compressor reacts to; after, it shapes the result', 'The insert order makes no audible difference at all']}
        correct={2}
        explain="A cut before the compressor removes energy from its detector — the low rumble stops pumping it. The same cut after only reshapes the output. Both are legitimate; the ORDER is a decision, and knowing why is the advanced skill."
        wrong={[
          '“Always” is the tell — no insert order is a law. What decides it?',
          'Same tell, other direction. There is no protected order — there are two different results.',
          undefined,
          'It is one of the most audible order decisions in a chain — feed a compressor rumble and listen.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/** The session's routing map, drawn (design pass P2-5): eight channels into
 *  three family buses into the mix — the architecture the final repairs. */
function RoutingMap() {
  const box = (x: number, y: number, w: number, label: string, tone: string) => (
    <G key={label}>
      <Rect x={x} y={y} width={w} height={24} rx={5} fill="#101013" stroke={tone} strokeWidth={1.2} />
      <SvgText x={x + w / 2} y={y + 16} fill={tone} fontSize={10} fontWeight="600" textAnchor="middle" fontFamily="sans-serif" letterSpacing={1}>
        {label}
      </SvgText>
    </G>
  );
  const wire = (x1: number, y1: number, x2: number, y2: number) => (
    <Path key={`${x1}${y1}${x2}${y2}`} d={`M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`} stroke="#3a4354" strokeWidth={1.4} fill="none" />
  );
  const chans = ['KICK', 'SNARE', 'PERC', 'BASS', 'GTR', 'KEYS', 'LEAD', 'BGV'];
  const cw = 40;
  const gap = 4;
  const chanX = (i: number) => 6 + i * (cw + gap);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Routing map: kick, snare, percussion and bass feed the rhythm bus; guitar and keys feed the music bus; lead and backing feed the vocal bus; all three buses feed the mix bus, then the output. A shared effects return also feeds the mix.">
      <Svg width="100%" height={150} viewBox="0 0 360 150">
        {chans.map((c, i) => box(chanX(i), 4, cw, c, '#8b93a3'))}
        {wire(chanX(0) + cw / 2, 28, 60, 58)}
        {wire(chanX(1) + cw / 2, 28, 60, 58)}
        {wire(chanX(2) + cw / 2, 28, 60, 58)}
        {wire(chanX(3) + cw / 2, 28, 60, 58)}
        {wire(chanX(4) + cw / 2, 28, 180, 58)}
        {wire(chanX(5) + cw / 2, 28, 180, 58)}
        {wire(chanX(6) + cw / 2, 28, 292, 58)}
        {wire(chanX(7) + cw / 2, 28, 292, 58)}
        {box(24, 58, 72, 'RHYTHM BUS', '#ffc64d')}
        {box(144, 58, 72, 'MUSIC BUS', '#ffc64d')}
        {box(256, 58, 72, 'VOCAL BUS', '#ffc64d')}
        {wire(60, 82, 180, 108)}
        {wire(180, 82, 180, 108)}
        {wire(292, 82, 180, 108)}
        {box(60, 88, 60, 'FX RET', '#5fd9c4')}
        {wire(90, 112, 180, 108)}
        {box(140, 108, 80, 'MIX BUS', '#37e05f')}
        {wire(180, 132, 180, 136)}
        {box(150, 128, 60, 'OUT', '#8b93a3')}
      </Svg>
    </View>
  );
}

/* ════ 4 · GROUPS, SUBGROUPS & VCAs — WHAT CARRIES AUDIO ══════════════════ */

const DRUMS_ONLY: MixSettings = { bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true } };

function PageGroupsDeep({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  // The comparison the six-terms page could only DESCRIBE, now heard: one
  // LINKED compressor across the summed kit (bus glue — shared envelope: the
  // kick's hit ducks the hat with it) vs the same compressor duplicated on
  // each drum separately (three private envelopes, no glue).
  const busVariants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'dry', label: 'KIT, NO COMP', settings: DRUMS_ONLY },
      { id: 'bus', label: 'ONE BUS COMP', settings: DRUMS_ONLY, busComp: { thresholdDb: -22, ratio: 4, attackMs: 8, releaseMs: 140 }, matchTo: 'dry' },
      { id: 'each', label: 'PER-TRACK COMP', settings: { ...DRUMS_ONLY, kick: { comp: { thresholdDb: -24, ratio: 4, attackMs: 8, releaseMs: 140 } }, snare: { comp: { thresholdDb: -24, ratio: 4, attackMs: 8, releaseMs: 140 } }, perc: { comp: { thresholdDb: -24, ratio: 4, attackMs: 8, releaseMs: 140 } } }, matchTo: 'dry' },
    ],
    [],
  );
  const pb = useMixPlayback(busVariants);
  const heardAll = ['dry', 'bus', 'each'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Hear dry, bus comp, per-track comp', hit: heardAll },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>You met the six terms. Now hear the one difference that decides real routing: SHARED processing needs a shared audio path — and a compressor across a summed kit behaves unlike the same compressor cloned onto each drum.</Lead>
      <Card>
        <Eyebrow>GLUE, HEARD</Eyebrow>
        <Prompt>Drums only, three ways, level-matched. In ONE BUS COMP the whole kit breathes as a unit — the kick’s hit pulls the hat down with it (one shared envelope). In PER-TRACK COMP each drum is squeezed privately: controlled, but never glued.</Prompt>
        <AbPlayer pb={pb} variants={busVariants} note="This is why 'drum subgroup + one compressor' is a sound, and 'the same compressor on every drum' is only a setting." />
      </Card>
      <Card tone="note">
        <Eyebrow>WHEN EACH TOOL WINS</Eyebrow>
        <Body>SUBGROUP: shared processing — the summed audio passes the bus inserts, then one fader trims the processed result (drive INTO those inserts is set by the channel faders feeding it). VCA/DCA: one fader for many channels with NO summed path — perfect for level control that must not touch processing (and it also scales the channels’ post-fader sends, which a subgroup fader does not). CONTROL GROUP: linked controls for editing convenience. Advanced mixes use all three, on purpose.</Body>
      </Card>
      <UnderstandingCheck
        question="You pull a VCA down 6 dB versus pulling a drum subgroup’s fader down 6 dB. One difference that matters:"
        options={['They are identical in every audible way', 'The VCA also drops each channel’s post-fader sends; the subgroup fader drops the summed path after its inserts', 'The subgroup version is always cleaner', 'The VCA version changes the drums’ tone']}
        correct={1}
        explain="A VCA turns the CHANNELS down — so everything post-fader on each channel, sends included, follows. A subgroup fader turns down the summed result AFTER the subgroup’s processing — the channels (and their sends) keep feeding as before."
        wrong={[
          'Route a reverb send through both setups and listen — identical is not what you will hear.',
          undefined,
          '“Cleaner” is not the axis — WHERE the gain happens is.',
          'A VCA is pure gain; tone changes only happen where audio passes through processing.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 5 · ADVANCED AUXILIARY ROUTING ═════════════════════════════════════ */

const AUX_TOPICS = [
  { id: 'returns', name: 'Multiple returns', blurb: 'Separate reverbs for drums and vocals; a tempo delay; a parallel path — each its own return, each mixable and mutable alone.' },
  { id: 'cue', name: 'Cue mixes', blurb: 'Pre-fader feeds per performer. Your mix moves never reach their ears; their balance never limits yours.' },
  { id: 'sidechain', name: 'Sidechain feeds', blurb: 'A send can feed a DETECTOR instead of an effect — the kick telling the bass compressor when to duck.' },
  { id: 'solosafe', name: 'Solo-safe returns', blurb: 'Solo a track and its reverb return stays audible — returns marked solo-safe are exempt from the solo cut.' },
  { id: 'feedback', name: 'Feedback prevention', blurb: 'A return that sends back into a path feeding itself will howl or explode. Returns send NOWHERE by default; break the loop before it exists.' },
] as const;

function PageAuxAdvanced({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open every routing tool', hit: seen.size >= AUX_TOPICS.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>The aux system is the mixer’s nervous system: copies of anything, sent anywhere, at any level. Advanced mixing is largely knowing which copies exist and where every one of them ends up.</Lead>
      <Card>
        <Eyebrow>THE TOOLS</Eyebrow>
        <ConceptList items={AUX_TOPICS.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="You solo the lead vocal and its lush reverb vanishes with everything else. The professional fix:"
        options={['Mix with everything un-soloed forever', 'Mark the reverb RETURN solo-safe, so soloing the vocal keeps its space audible', 'Print the reverb onto the vocal track', 'Turn the reverb into an insert on the vocal']}
        correct={1}
        explain="Solo-safe exempts the return from the solo cut — solo the vocal and you hear vocal + its space, which is the sound you are actually mixing."
        wrong={[
          'Solo is too useful to abandon — the fix is one flag on the return.',
          undefined,
          'Printing commits you to today’s reverb forever. The routing flag costs nothing.',
          'An insert processes the WHOLE vocal and abandons the shared-space architecture for everyone else.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

export const MIXING_ADV_PAGES_A: PageDef[] = [
  { title: 'Before You Begin', short: 'GATE', Component: PageGate, manualDone: true },
  { title: 'Advanced Mix Planning', short: 'PLAN', Component: PagePlanning, manualDone: true },
  { title: 'Complex Session Management', short: 'SESSION', Component: PageSessionMgmt, manualDone: true },
  { title: 'Groups, Subgroups & VCAs', short: 'GROUPS', Component: PageGroupsDeep, manualDone: true },
  { title: 'Advanced Auxiliary Routing', short: 'AUX', Component: PageAuxAdvanced, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
});
