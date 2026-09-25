/**
 * Sound Systems Lab — ROUTE mode: eight console exercises (chapter 4 in
 * depth). Every verdict is computed by features/soundsystems/console.ts —
 * the page never says a bus hears something the engine would not.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { bandConsole, hears, lin2db, ROUTING_TOOLS, routingTool, setSend, WHICH_TOOL, type ConsoleState, type RoutingToolId } from '../../../features/soundsystems/console';
import { markRouteDone } from '../../../features/soundsystems/progress';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, useVisitGoals, VerdictLine } from './bits';
import { auxHears, BusHears, ConsolePanel, DcaStrip, mainHears, MatrixStrip, matrixHears, MuteGroupStrip, subgroupHears, SubgroupStrip } from './art/ConsolePanel';

function useRouteCredit(id: string, done: boolean, ctx: PageCtx) {
  useEffect(() => {
    if (done) {
      markRouteDone(id);
      if (!ctx.isDone) ctx.markDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
}

/* ── 1 · Anatomy of a channel ───────────────────────────────────────────── */

const STATIONS: readonly { id: string; name: string; what: string }[] = [
  { id: 'input', name: 'Input and preamp gain', what: 'The physical input (or the digital patch that chooses one) and the preamp that raises mic level to line level. Gain is set here, once, for the source.' },
  { id: 'hpf', name: 'High-pass filter', what: 'Removes what the source has no business carrying below 80–120 Hz: stage rumble, handling noise, plosives. On by default for everything but kick, bass and keys.' },
  { id: 'eq', name: 'Channel EQ', what: 'Shapes ONE source for the mix. Not the place to fix the room — that is the system EQ in the processor.' },
  { id: 'insert', name: 'Insert', what: 'A processor placed IN the path — a compressor, a gate — so the whole channel passes through it. Nothing is copied; everything goes through.' },
  { id: 'fader', name: 'Fader and pan', what: 'The channel’s level in the main mix and its position between left and right. Post-fader sends follow this; pre-fader sends do not.' },
  { id: 'sends', name: 'Aux sends', what: 'Adjustable COPIES of the channel to other destinations. Pre-fader for monitors, post-fader for effects and aux-fed subs.' },
  { id: 'assign', name: 'Assignment', what: 'Where the channel’s main path goes: direct to the L/R main bus, or into a subgroup that then goes to main. Also a DCA and mute groups — controls, not paths.' },
  { id: 'direct', name: 'Direct output', what: 'The channel by itself on its own output, usually for a multitrack recorder — pre- or post-fader by setting.' },
];

function PageChannel({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState('input');
  const [seen, setSeen] = useState<Set<string>>(new Set(['input']));
  const done = seen.size >= 6;
  useRouteCredit('channel', done, ctx);
  const goals = [{ label: 'Open six stations of the channel', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const st = STATIONS.find((s) => s.id === sel)!;
  const cs = useMemo(() => setSend(setSend(bandConsole(), 'vox', 'aux1', { db: 0, tap: 'pre' }), 'vox', 'aux5', { db: -6, tap: 'post' }), []);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>ANATOMY OF A CHANNEL</ChapterTag>
      <Lead>
        One channel strip, in signal order. Tap each station. The console model below is live: the same vocal channel with a pre-fader monitor send and a post-fader reverb send — the two sends that behave differently for a reason.
      </Lead>
      <View style={styles.stationRow}>
        {STATIONS.map((s, i) => (
          <Pressable key={s.id} onPress={() => { setSel(s.id); setSeen((v) => new Set(v).add(s.id)); }} style={[styles.station, sel === s.id && styles.stationOn]} accessibilityRole="button" accessibilityState={{ selected: sel === s.id }} aria-pressed={sel === s.id} accessibilityLabel={`${i + 1}, ${s.name}`}>
            <Text style={[styles.stationN, sel === s.id && { color: colors.cyanBright }]}>{i + 1}</Text>
            <Text style={[styles.stationName, sel === s.id && { color: colors.textPrimary }]} numberOfLines={2}>{s.name}</Text>
          </Pressable>
        ))}
      </View>
      <Card tone="math">
        <Eyebrow>{st.name.toUpperCase()}</Eyebrow>
        <Body>{st.what}</Body>
      </Card>
      <ConsolePanel cs={cs} onChange={() => {}} channels={['vox']} columns={['fader', 'mute', 'main', 'send:aux1', 'send:aux5']} readonly />
      <KeyFact>Insert = through. Send = copy. Assignment = where the main path goes. DCA and mute group = controls over the channel, with no audio in them. Four words that end most routing confusion.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 2 · Pre-fader vs post-fader ────────────────────────────────────────── */

function PagePrePost({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(() => setSend(setSend(bandConsole(), 'vox', 'aux1', { db: 0, tap: 'post' }), 'vox', 'aux5', { db: 0, tap: 'pre' }));
  const vox = cs.channels.find((c) => c.id === 'vox')!;
  const aux1 = hears(auxHears(cs, 'aux1')).find((h) => h.channelId === 'vox');
  const aux5 = hears(auxHears(cs, 'aux5')).find((h) => h.channelId === 'vox');
  const monitorIndependent = vox.sends.aux1?.tap === 'pre' && vox.faderDb <= -10 && !!aux1 && Math.round(lin2db(aux1.gain)) === Math.round(vox.sends.aux1.db);
  const reverbFollows = vox.sends.aux5?.tap === 'post' && vox.faderDb <= -10 && (!aux5 || lin2db(aux5.gain) < -9);
  const done = monitorIndependent && reverbFollows;
  useRouteCredit('prepost', done, ctx);
  const goals = [
    { label: 'Monitor send (Aux 1) PRE-fader, fader pulled down, wedge unchanged', hit: monitorIndependent },
    { label: 'Reverb send (Aux 5) POST-fader, following the fader down', hit: reverbFollows },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>PRE-FADER AND POST-FADER SENDS</ChapterTag>
      <Lead>
        The vocal has two sends — and both are currently tapped the WRONG way round. The wedge follows the house fader; the reverb ignores it. Fix the tap points, then pull the fader down and watch which bus moves.
      </Lead>
      <ConsolePanel cs={cs} onChange={setCs} channels={['vox']} columns={['fader', 'mute', 'send:aux1', 'send:aux5']} />
      <BusHears title="AUX 1 · THE SINGER’S WEDGE HEARS" list={auxHears(cs, 'aux1')} note="A monitor send must not follow the house fader — pre-fader." />
      <BusHears title="AUX 5 · THE REVERB HEARS" list={auxHears(cs, 'aux5')} note="An effect send should follow the fader so the wet stays in proportion — post-fader." />
      <BusHears title="MAIN MIX HEARS" list={mainHears(cs)} />
      <Prompt>Tap PRE/POST under each send, then step the fader down to −20 or below.</Prompt>
      <Card>
        <Eyebrow>ON THIS CONSOLE</Eyebrow>
        <Body>As in the mixing lab, a pre-fader send ignores the fader AND the mute — the classic analog rule. Many digital consoles let a channel mute silence its pre-fader sends as well; know which yours does, because a monitor engineer will ask.</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 3 · Which tool? ────────────────────────────────────────────────────── */

function PageWhichTool({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const count = WHICH_TOOL.filter((c) => solved[c.id]).length;
  const done = count >= WHICH_TOOL.length;
  useRouteCredit('whichtool', done, ctx);
  const goals = [{ label: `Choose the right tool in all ${WHICH_TOOL.length} cases`, hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const name = (id: RoutingToolId) => routingTool(id).name;
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>SUBGROUP, AUX, MATRIX OR DCA?</ChapterTag>
      <Lead>Eight situations from real shows. Each has one right tool; the wrong ones come with the reason they fail.</Lead>
      {WHICH_TOOL.map((c, i) => {
        const wrongIds = Object.keys(c.wrong) as RoutingToolId[];
        const others = ROUTING_TOOLS.map((t) => t.id).filter((id) => id !== c.correct && !wrongIds.includes(id));
        const options: RoutingToolId[] = [c.correct, ...wrongIds, ...others].slice(0, 4);
        return (
          <UnderstandingCheck
            key={c.id}
            eyebrow={`SITUATION ${i + 1} OF ${WHICH_TOOL.length}`}
            question={c.situation}
            options={options.map(name)}
            correct={0}
            explain={c.why}
            wrong={options.map((id) => c.wrong[id])}
            onCorrect={() => setSolved((s) => ({ ...s, [c.id]: true }))}
          />
        );
      })}
      <Body>{count} of {WHICH_TOOL.length} chosen.</Body>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 4 · Four monitor mixes ─────────────────────────────────────────────── */

function PageMonitorMixes({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(bandConsole);
  const auxes = ['aux1', 'aux2', 'aux3', 'aux4'];
  const each = auxes.map((a) => hears(auxHears(cs, a)).length);
  const allPre = cs.channels.every((c) => auxes.every((a) => !c.sends[a] || c.sends[a].tap === 'pre'));
  const done = each.every((n) => n >= 2) && allPre;
  useRouteCredit('monitors', done, ctx);
  const goals = [{ label: 'Every wedge hears at least two channels', hit: each.every((n) => n >= 2) }, { label: 'Every monitor send is PRE-fader', hit: allPre && each.some((n) => n > 0) }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>FOUR INDEPENDENT MONITOR MIXES</ChapterTag>
      <Lead>
        Wedge 1 is the singer’s: vocal and a little keys. Wedge 2 is the guitarist’s: guitar, vocal, kick. Wedge 3 the bassist’s: bass, kick, vocal. Wedge 4 the drummer’s: kick, bass, vocal. Build them — pre-fader, every send.
      </Lead>
      <ConsolePanel cs={cs} onChange={setCs} columns={['send:aux1', 'send:aux2', 'send:aux3', 'send:aux4']} />
      {auxes.map((a, i) => (
        <BusHears key={a} title={`AUX ${i + 1} · WEDGE ${i + 1} HEARS`} list={auxHears(cs, a)} />
      ))}
      <KeyFact>Each aux is one performer’s world. The house engineer’s faders must not reach into it — which is what PRE means.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 5 · Subgroups vs DCAs ──────────────────────────────────────────────── */

function PageGroups({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(() => setSend(bandConsole(), 'kick', 'aux4', { db: 0, tap: 'pre' }));
  const drums = ['kick', 'snare', 'oh'];
  const subgrouped = drums.every((d) => cs.channels.find((c) => c.id === d)?.subgroup === 'sub-drums');
  const inMain = drums.every((d) => hears(mainHears(cs)).some((h) => h.channelId === d));
  const dca = cs.dcas.find((d) => d.id === 'dca-band')!;
  const kickOnDca = cs.channels.find((c) => c.id === 'kick')?.dca === 'dca-band';
  const kickMain = hears(mainHears(cs)).find((h) => h.channelId === 'kick');
  const kickAux4 = hears(auxHears(cs, 'aux4')).find((h) => h.channelId === 'kick');
  const dcaProof = kickOnDca && dca.levelDb <= -10 && !!kickAux4 && Math.round(lin2db(kickAux4.gain)) === 0 && (!kickMain || lin2db(kickMain.gain) < -9);
  const done = subgrouped && inMain && dcaProof;
  useRouteCredit('groups', done, ctx);
  const goals = [
    { label: 'Kick, snare and overheads on the DRUMS subgroup, reaching the main mix', hit: subgrouped && inMain },
    { label: 'Kick on the BAND DCA at −10 or lower: main drops, the drummer’s pre-fader wedge send does not', hit: dcaProof },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>SUBGROUPS AND DCAs — THE DIFFERENCE, PROVEN</ChapterTag>
      <Lead>
        Route the three drum channels into the DRUMS subgroup (and make sure the subgroup reaches the main mix). Then hang the kick on the BAND DCA and pull the DCA down: the main mix drops, the drummer’s wedge does not — because a DCA carries no audio, and a pre-fader send never met it.
      </Lead>
      <ConsolePanel cs={cs} onChange={setCs} channels={['kick', 'snare', 'oh', 'bass']} columns={['main', 'sub', 'dca', 'send:aux4']} />
      <SubgroupStrip cs={cs} onChange={setCs} ids={['sub-drums']} />
      <DcaStrip cs={cs} onChange={setCs} />
      <BusHears title="DRUMS SUBGROUP HEARS" list={subgroupHears(cs, 'sub-drums')} note="Audio sums here — one fader, one insert point for a drum compressor." />
      <BusHears title="MAIN MIX HEARS" list={mainHears(cs)} />
      <BusHears title="AUX 4 · DRUMMER’S WEDGE HEARS" list={auxHears(cs, 'aux4')} note="Pre-fader: neither the subgroup fader nor the DCA touches this." />
      <Prompt>Tip: a channel in a subgroup should not ALSO be assigned direct to L/R — that is the double-routing fault.</Prompt>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 6 · Mute groups, solo, direct outs ─────────────────────────────────── */

function PageMutes({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(() => {
    let s = bandConsole();
    s = { ...s, channels: s.channels.map((c) => (c.family === 'speech' || c.family === 'playback' ? c : { ...c, muteGroups: ['mg-band'] })) };
    return s;
  });
  const [solved, setSolved] = useState(false);
  const bandMuted = cs.muteGroups.find((m) => m.id === 'mg-band')?.active === true;
  const mainHeard = hears(mainHears(cs));
  const onlyMcPb = bandMuted && mainHeard.every((h) => h.channelId === 'mc' || h.channelId === 'pb') && mainHeard.length > 0;
  const done = onlyMcPb && solved;
  useRouteCredit('mutes', done, ctx);
  const goals = [{ label: 'Mute the band with one button; announce mic and playback stay', hit: onlyMcPb }, { label: 'Answer the PFL/AFL check', hit: solved }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>MUTE GROUPS, SOLO, INSERTS AND DIRECT OUTPUTS</ChapterTag>
      <Lead>
        Between songs the band must vanish and come back exactly as set, while the announcement microphone and walk-in music stay live. Every band channel is already assigned to the BAND MUTE group. Press it.
      </Lead>
      <MuteGroupStrip cs={cs} onChange={setCs} />
      <BusHears title="MAIN MIX HEARS" list={mainHears(cs)} />
      <Card>
        <Eyebrow>SOLO · PFL · AFL</Eyebrow>
        <Body>Solo sends a channel to the engineer’s headphones or monitor output WITHOUT changing the house — unless it is a destructive solo-in-place, which mutes everything else; never press that on a show. PFL listens PRE-fader (for checking a source before it is in the mix); AFL listens AFTER the fader and pan (for hearing it as the mix does). The control-room and monitor outputs are where solo lands.</Body>
      </Card>
      <Card>
        <Eyebrow>INSERTS · DIRECT OUTPUTS · DIGITAL PATCHING</Eyebrow>
        <Body>An insert puts a processor IN the channel path. A direct output takes the channel alone to a recorder. On a digital console every input and output is a patch: which physical socket feeds which channel, and which bus leaves which socket — the setting behind two of the faults on the bench.</Body>
      </Card>
      <UnderstandingCheck
        question="You want to hear a channel in headphones exactly as it sits in the mix, with its fader and pan. Which solo?"
        options={['AFL — after-fader listen', 'PFL — pre-fader listen', 'Solo-in-place', 'The direct output']}
        correct={0}
        explain="AFL listens after the fader and pan: the channel as the mix hears it. PFL is for checking a source before you bring it up; solo-in-place mutes the rest of the show."
        onCorrect={() => setSolved(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 7 · Matrices ───────────────────────────────────────────────────────── */

function PageMatrices({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(bandConsole);
  const fills = cs.matrices.find((m) => m.id === 'mx-fills')!;
  const lobby = cs.matrices.find((m) => m.id === 'mx-lobby')!;
  const rec = cs.matrices.find((m) => m.id === 'mx-rec')!;
  const fillsOk = 'main' in fills.inputs && hears(matrixHears(cs, 'mx-fills')).length > 0;
  const lobbyOk = 'main' in lobby.inputs && 'aux2' in lobby.inputs && hears(auxHears(cs, 'aux2')).some((h) => h.channelId === 'mc');
  const recOk = 'main' in rec.inputs && hears(matrixHears(cs, 'mx-rec')).length > 0;
  const done = fillsOk && lobbyOk && recOk;
  useRouteCredit('matrices', done, ctx);
  const goals = [
    { label: 'Front fills: Matrix 2 takes MAIN', hit: fillsOk },
    { label: 'Lobby: Matrix 3 takes MAIN and AUX 2, with the announce mic sent to Aux 2', hit: lobbyOk },
    { label: 'Recording: Matrix 4 takes MAIN', hit: recOk },
  ];
  const latched = useVisitGoals(ctx, goals);
  const src = [{ id: 'main', label: 'MAIN' }, { id: 'aux2', label: 'AUX 2' }];
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>MATRIX OUTPUTS</ChapterTag>
      <Lead>
        A matrix mixes finished BUSES — the main mix, an aux, a subgroup — into a further output with its own level. The front fills want the main mix, delayed and equalised on their own. The lobby wants the main mix plus a little more announce mic. The recorder wants the main mix. Build all three.
      </Lead>
      <ConsolePanel cs={cs} onChange={setCs} channels={['mc', 'vox', 'kick']} columns={['main', 'send:aux2']} />
      <MatrixStrip cs={cs} onChange={setCs} matrixId="mx-fills" sources={src} />
      <MatrixStrip cs={cs} onChange={setCs} matrixId="mx-lobby" sources={src} />
      <MatrixStrip cs={cs} onChange={setCs} matrixId="mx-rec" sources={src} />
      <BusHears title="MATRIX 2 · FRONT FILLS HEAR" list={matrixHears(cs, 'mx-fills')} />
      <BusHears title="MATRIX 3 · LOBBY HEARS" list={matrixHears(cs, 'mx-lobby')} note="The announce mic should arrive louder than everything else — it comes in twice: inside MAIN and by its own route on AUX 2." />
      <BusHears title="MATRIX 4 · RECORDING HEARS" list={matrixHears(cs, 'mx-rec')} />
      <KeyFact>A matrix is the post-main tool. Whatever the house engineer does to the mix, the fills, the lobby and the recorder follow it — and each can still be shaped on its own.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 8 · The output patch ───────────────────────────────────────────────── */

const BUSES = ['Main L', 'Main R', 'Aux 1', 'Aux 2', 'Aux 6', 'Matrix 2', 'Matrix 3'] as const;
type Bus = (typeof BUSES)[number];

const DESTINATIONS: readonly { id: string; name: string; needs: Bus; why: string }[] = [
  { id: 'procL', name: 'Processor input L → mains left', needs: 'Main L', why: 'The mains take the main mix, left side.' },
  { id: 'procR', name: 'Processor input R → mains right', needs: 'Main R', why: 'The mains take the main mix, right side.' },
  { id: 'wedge1', name: 'Wedge 1 amplifier', needs: 'Aux 1', why: 'A wedge takes its own aux — never a main output (the fault on the bench).' },
  { id: 'wedge2', name: 'Wedge 2 amplifier', needs: 'Aux 2', why: 'Its own aux, its own mix.' },
  { id: 'subs', name: 'Processor LOW input → subwoofers', needs: 'Aux 6', why: 'Aux-fed subs take the sub aux, not the main mix.' },
  { id: 'fills', name: 'Front fill amplifier', needs: 'Matrix 2', why: 'Fills are matrix-fed so they can be delayed and equalised on their own.' },
  { id: 'lobby', name: 'Lobby amplifier', needs: 'Matrix 3', why: 'The lobby is a matrix: main plus announce, at its own level.' },
];

function PagePatch({ ctx }: { ctx: PageCtx }) {
  const [patch, setPatch] = useState<Record<string, Bus | null>>({});
  const [active, setActive] = useState<string | null>(null);
  const correct = DESTINATIONS.filter((d) => patch[d.id] === d.needs).length;
  const done = correct >= DESTINATIONS.length;
  useRouteCredit('patch', done, ctx);
  const goals = [{ label: 'Patch every destination from the right bus', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={4}>OUTPUT PATCHING</ChapterTag>
      <Lead>
        Seven destinations on the stagebox’s output sockets; seven buses that could feed them. Tap a destination, then the bus it needs. A wrong patch is silent at best — a main output into a wedge amplifier is the show in the singer’s ears.
      </Lead>
      {DESTINATIONS.map((d) => {
        const b = patch[d.id] ?? null;
        const ok = b === d.needs;
        return (
          <Pressable key={d.id} onPress={() => setActive(d.id)} style={[styles.dest, active === d.id && styles.destActive, b && (ok ? styles.destOk : styles.destBad)]} accessibilityRole="button" accessibilityState={{ selected: active === d.id }} aria-pressed={active === d.id} accessibilityLabel={`${d.name}: ${b ? `patched from ${b}${ok ? ', correct' : ', wrong'}` : 'unpatched'}`}>
            <Text style={styles.destName}>{d.name}</Text>
            <Text style={[styles.destBus, b ? { color: ok ? colors.green : colors.red } : null]}>{b ? `${ok ? '✓' : '✕'} ${b}` : '— tap to patch'}</Text>
            {b && !ok ? <Text style={styles.destWhy}>{d.why}</Text> : null}
          </Pressable>
        );
      })}
      {active ? (
        <Card tone="math">
          <Eyebrow>FEED “{DESTINATIONS.find((d) => d.id === active)!.name.toUpperCase()}” FROM</Eyebrow>
          <Row>
            {BUSES.map((bus) => (
              <Btn key={bus} label={bus} onPress={() => { setPatch((p) => ({ ...p, [active]: bus })); setActive(null); }} a11y={`Patch from ${bus}`} />
            ))}
          </Row>
        </Card>
      ) : null}
      <VerdictLine ok={done} warn={!done && correct > 0}>{done ? 'Every output leaves the right socket. Document it — the patch list is what the next person rebuilds from.' : `${correct} of ${DESTINATIONS.length} patched correctly.`}</VerdictLine>
      <DeeperRow>
        <LabLink route="PatchbayLab" label="Patchbay Signal Flow & Normalling" />
        <LabLink route="SoundSystemsBuild" label="BUILD mode — wire a whole venue" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const SS_ROUTE_PAGES: PageDef[] = [
  { title: 'Anatomy of a channel', short: 'CHANNEL', Component: PageChannel, manualDone: true },
  { title: 'Pre-fader and post-fader', short: 'PRE/POST', Component: PagePrePost, manualDone: true },
  { title: 'Subgroup, aux, matrix or DCA?', short: 'WHICH', Component: PageWhichTool, manualDone: true },
  { title: 'Four monitor mixes', short: 'MONITORS', Component: PageMonitorMixes, manualDone: true },
  { title: 'Subgroups and DCAs', short: 'GROUPS', Component: PageGroups, manualDone: true },
  { title: 'Mute groups, solo and direct outs', short: 'MUTES', Component: PageMutes, manualDone: true },
  { title: 'Matrix outputs', short: 'MATRIX', Component: PageMatrices, manualDone: true },
  { title: 'Output patching', short: 'PATCH', Component: PagePatch, manualDone: true },
];

const styles = StyleSheet.create({
  stationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  station: { width: '23%', minWidth: 76, minHeight: 56, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 7, gap: 2 },
  stationOn: { borderColor: colors.cyanBright, backgroundColor: '#0f1a22' },
  stationN: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 11 },
  stationName: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.5 },
  dest: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, gap: 3, minHeight: 48 },
  destActive: { borderColor: colors.cyanBright, backgroundColor: '#0f1a22' },
  destOk: { borderColor: colors.green },
  destBad: { borderColor: colors.red },
  destName: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  destBus: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 12 },
  destWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
