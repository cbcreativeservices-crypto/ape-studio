/**
 * Sound Systems Lab — ROUTE mode: eight console exercises (chapter 4 in
 * depth), on the Rack Unit (owner 2026-09-25). The console's BUSES are the
 * display — a meter bridge on the glass showing who hears what — and the
 * console itself is worked from the dock: the teaching control on the lane
 * (a fader, a send, a DCA), the desk in a CONSOLE tray over the well while
 * the buses stay live above it. Every verdict is computed by
 * features/soundsystems/console.ts — the page never says a bus hears
 * something the engine would not.
 */
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme/tokens';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Card, Eyebrow, Lead, Prompt } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { bandConsole, hears, lin2db, ROUTING_TOOLS, routingTool, setChannel, setDca, setMuteGroup, setSend, WHICH_TOOL, type ConsoleState, type RoutingToolId } from '../../../features/soundsystems/console';
import { markRouteDone } from '../../../features/soundsystems/progress';
import type { DockParam } from '../rack/rackTypes';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, useVisitGoals, VerdictLine } from './bits';
import { auxHears, BusBank, ConsolePanel, DcaStrip, mainHears, MatrixStrip, matrixHears, subgroupHears, SubgroupStrip } from './art/ConsolePanel';
import { ChannelStrip, PATCH_H, PatchPanel, STRIP_H, type PatchSocket, type StripStation } from './art/diagrams';
import { dbFader, fmtDb } from './consoleDock';
import { flipFader, SoundSystemsRackLayout, type SsPageDef } from './rackLayout';
import { StageFit } from '../rack/StageFit';

function useRouteCredit(id: string, done: boolean, ctx: PageCtx) {
  useEffect(() => {
    if (done) {
      markRouteDone(id);
      if (!ctx.isDone) ctx.markDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
}

const WEDGE_NAMES = { aux1: 'SINGER', aux2: 'GUITAR', aux3: 'BASS', aux4: 'DRUMS', aux5: 'REVERB', aux6: 'SUBS', aux7: 'LOBBY' } as const;
const BUS_BADGE = 'BUS METERS — COMPUTED · who hears what, from the console engine';

/** The bus a channel contributes to, in dB — or OFF. */
function heardDb(list: ReturnType<typeof mainHears>, channelId: string): string {
  const h = hears(list).find((x) => x.channelId === channelId);
  return h ? `${fmtDb(Math.round(lin2db(h.gain)))}${lin2db(h.gain) > -60 ? ' dB' : ''}` : 'OFF';
}

/* ── 1 · Anatomy of a channel ───────────────────────────────────────────── */

const STATIONS: readonly { id: StripStation; name: string; what: string; kind: string }[] = [
  { id: 'input', name: 'Input and preamp gain', kind: 'THROUGH', what: 'The physical input (or the digital patch that chooses one) and the preamp that raises mic level to line level — 40 to 60 dB of gain for a vocal microphone. Gain is set here, once, for the source; everything after it works at line level.' },
  { id: 'hpf', name: 'High-pass filter', kind: 'THROUGH', what: 'Removes what the source has no business carrying below its cut-off: stage rumble, handling noise, plosives. Around 80–120 Hz for a vocal, higher for overheads and acoustic guitar, lower or off for kick, bass and keys — the sources that live down there.' },
  { id: 'eq', name: 'Channel EQ', kind: 'THROUGH', what: 'Shapes ONE source for the mix. Not the place to fix the room — that is the system EQ in the processor, applied once to the whole output.' },
  { id: 'insert', name: 'Insert', kind: 'THROUGH', what: 'A processor placed IN the path — a compressor, a gate — so the whole channel passes through it. Nothing is copied; everything goes through. On a digital console it is a block in the strip; on an analog one, a send-and-return jack.' },
  { id: 'fader', name: 'Fader, pan and mute', kind: 'THROUGH', what: 'The channel’s level in the main mix and its position between left and right. Post-fader sends follow the fader; pre-fader sends do not. On this console the MUTE also silences the pre-fader sends — the common digital-console default; the classic analog rule left them running. A DCA or a mute group acts here too — a hand on the fader, with no audio of its own.' },
  { id: 'sends', name: 'Aux sends', kind: 'A COPY', what: 'Adjustable COPIES of the channel to other buses. PRE-fader for monitors, so the house fader cannot move a wedge; POST-fader for effects — the reverb here — and aux-fed subs, so the wet and the low end stay in proportion to the fader.' },
  { id: 'assign', name: 'Assignment', kind: 'THE PATH', what: 'Where the channel’s main path goes: direct to the L/R main bus, or into a subgroup that then goes to main — one or the other, never both; both is the double-routing fault. A DCA and mute groups are controls over the channel, not paths for it.' },
  { id: 'direct', name: 'Direct output', kind: 'A COPY', what: 'The channel by itself on its own output, usually for a multitrack recorder — pre- or post-fader by setting, and on a digital console a patch like any other.' },
];

function PageChannel({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<StripStation>('input');
  const [seen, setSeen] = useState<Set<string>>(new Set(['input']));
  const done = seen.size >= 6;
  useRouteCredit('channel', done, ctx);
  const goals = [{ label: 'Open six stations of the channel', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const st = STATIONS.find((s) => s.id === sel)!;
  const cs = useMemo(() => setSend(setSend(bandConsole(), 'vox', 'aux1', { db: 0, tap: 'pre' }), 'vox', 'aux5', { db: -6, tap: 'post' }), []);
  const pick = (s: string) => {
    setSel(s as StripStation);
    setSeen((v) => new Set(v).add(s));
  };
  const params: DockParam[] = [
    flipFader({
      id: 'station',
      label: 'STATION',
      title: 'THE CHANNEL, TOP TO BOTTOM',
      items: STATIONS,
      selectedId: sel,
      onSelect: pick,
      name: (s) => s.name,
      short: (s) => s.name.split(/[ ,]/)[0],
      blurb: (s) => s.what,
      sticky: true,
    }),
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: 'CHANNEL STRIP — ILLUSTRATIVE · one channel in signal order',
        initialParam: 'station',
        hideDragTag: true,
        bezel: [
          { k: 'STATION', v: st.name.toUpperCase(), tint: colors.cyanBright, flex: 2.2 },
          { k: 'AUDIO', v: st.kind, flex: 1 },
          { k: 'SEEN', v: `${seen.size}/${STATIONS.length}`, flex: 0.7 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={354 / STRIP_H}>
            <ChannelStrip selected={sel} onTap={pick} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride STATION down the strip in signal order — or tap a block on it. The sends leave as copies at the PRE and POST tap points; the main path ends at the assignment."
      wellTop={
        <Card tone="math">
          <Eyebrow>{st.name.toUpperCase()}</Eyebrow>
          <Body>{st.what}</Body>
        </Card>
      }
    >
      <ChapterTag n={4}>ANATOMY OF A CHANNEL</ChapterTag>
      <Body>One channel strip, top to bottom in signal order, the way it is printed on the console. The sends leave as copies at the PRE and POST tap points; the main path ends at the assignment.</Body>
      <Prompt>Tap each block of the strip.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Body>The same channel on the console model, read-only: the vocal with a pre-fader wedge send and a post-fader reverb send — the two sends that behave differently for a reason.</Body>
      <ConsolePanel cs={cs} onChange={() => {}} channels={['vox']} columns={['fader', 'mute', 'main', 'send:aux1', 'send:aux5']} readonly sendNames={WEDGE_NAMES} />
      <KeyFact>Insert = through. Send = copy. Assignment = where the main path goes. DCA and mute group = controls over the channel, with no audio in them. Four words that end most routing confusion.</KeyFact>
    </SoundSystemsRackLayout>
  );
}

/* ── 2 · Pre-fader vs post-fader ────────────────────────────────────────── */

const TAP_OPTIONS = [
  { id: 'pre', label: 'PRE-fader', blurb: 'The send takes its copy BEFORE the fader: the house fader cannot move it. For monitors.' },
  { id: 'post', label: 'POST-fader', blurb: 'The send takes its copy AFTER the fader: it follows every fader move. For effects and aux-fed subs.' },
];

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
  const tapParam = (auxId: 'aux1' | 'aux5', label: string): DockParam => ({
    kind: 'options',
    id: `tap-${auxId}`,
    label,
    valueLabel: (vox.sends[auxId]?.tap ?? 'post').toUpperCase(),
    options: TAP_OPTIONS,
    selectedId: vox.sends[auxId]?.tap ?? 'post',
    onSelect: (id) => setCs((s) => setSend(s, 'vox', auxId, { db: vox.sends[auxId]?.db ?? 0, tap: id as 'pre' | 'post' })),
    sticky: true,
  });
  const params: DockParam[] = [
    dbFader({ id: 'fader', label: 'VOX FADER', db: vox.faderDb, min: -60, max: 10, onChange: (db) => setCs((s) => setChannel(s, 'vox', { faderDb: db })), home: 0, level: true, of: 'on the lead vocal' }),
    tapParam('aux1', 'WEDGE TAP'),
    tapParam('aux5', 'FX TAP'),
    {
      kind: 'group',
      id: 'console',
      label: 'CONSOLE',
      valueLabel: vox.mute ? 'MUTED' : 'Open',
      render: () => (
        <View style={{ gap: 10 }}>
          <Body>The vocal channel: its fader, MUTE, and the two sends with their PRE switches. The buses above keep reading while you work here.</Body>
          <ConsolePanel cs={cs} onChange={setCs} channels={['vox']} columns={['fader', 'mute', 'send:aux1', 'send:aux5']} sendNames={WEDGE_NAMES} />
        </View>
      ),
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        // View-built bus columns: their text does not grow with the box, so no full-screen zoom.
        fullScreen: false,
        badge: BUS_BADGE,
        initialParam: 'fader',
        hideDragTag: true,
        bezel: [
          { k: 'FADER', v: `${fmtDb(vox.faderDb)}${vox.faderDb > -60 ? ' dB' : ''}`, tint: colors.amber },
          { k: 'WEDGE HEARS', v: heardDb(auxHears(cs, 'aux1'), 'vox'), tint: monitorIndependent ? colors.green : undefined, flex: 1.2 },
          { k: 'REVERB HEARS', v: heardDb(auxHears(cs, 'aux5'), 'vox'), tint: reverbFollows ? colors.green : undefined, flex: 1.2 },
          { k: 'MAIN', v: heardDb(mainHears(cs), 'vox') },
        ],
        stage: (w, h) => (
          <BusBank
            w={w}
            h={h}
            buses={[
              { id: 'aux1', title: 'AUX 1 · SINGER’S WEDGE', list: auxHears(cs, 'aux1') },
              { id: 'aux5', title: 'AUX 5 · REVERB', list: auxHears(cs, 'aux5') },
              { id: 'main', title: 'MAIN MIX', list: mainHears(cs) },
            ]}
          />
        ),
        params,
      }}
      caption="Set WEDGE TAP to PRE and FX TAP to POST, then ride the VOX FADER down to −20 or below and watch which bus moves."
    >
      <ChapterTag n={4}>PRE-FADER AND POST-FADER SENDS</ChapterTag>
      <Body>The vocal channel with its two sends, both currently tapped the WRONG way round: the wedge follows the house fader, the reverb ignores it.</Body>
      <Prompt>Tap PRE under each send to set it right, then step the fader down to −20 or below and watch which bus moves.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>THE TWO SENDS</Eyebrow>
        <Body>AUX 1 · the singer’s wedge — a monitor send must not follow the house fader: pre-fader.</Body>
        <Body>AUX 5 · the reverb — an effect send should follow the fader so the wet stays in proportion: post-fader.</Body>
      </Card>
      <Card>
        <Eyebrow>ON THIS CONSOLE</Eyebrow>
        <Body>A pre-fader send ignores the FADER. On this console — like most digital consoles by default — the channel MUTE silences its pre-fader sends as well, so a muted vocal leaves the wedge too. The classic analog rule was different: a pre-fader send ignored the mute and kept feeding the wedge. Know which yours does, because a monitor engineer will ask before the first song.</Body>
      </Card>
    </SoundSystemsRackLayout>
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
      <GoalChips goals={goals} latched={latched} />
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
    </View>
  );
}

/* ── 4 · Four monitor mixes ─────────────────────────────────────────────── */

const WEDGE_AUXES = ['aux1', 'aux2', 'aux3', 'aux4'] as const;

function PageMonitorMixes({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(bandConsole);
  const [chId, setChId] = useState('vox');
  const [auxId, setAuxId] = useState<string>('aux1');
  const auxes = [...WEDGE_AUXES];
  const each = auxes.map((a) => hears(auxHears(cs, a)).length);
  const allPre = cs.channels.every((c) => auxes.every((a) => !c.sends[a] || c.sends[a].tap === 'pre'));
  const done = each.every((n) => n >= 2) && allPre;
  useRouteCredit('monitors', done, ctx);
  const goals = [{ label: 'Every wedge hears at least two channels', hit: each.every((n) => n >= 2) }, { label: 'Every monitor send is PRE-fader', hit: allPre && each.some((n) => n > 0) }];
  const latched = useVisitGoals(ctx, goals);
  const ch = cs.channels.find((c) => c.id === chId)!;
  const send = ch.sends[auxId];
  const sendDb = send?.db ?? -90;
  const tap = send?.tap ?? 'post';
  // Possessive: DRUMS’ WEDGE, BASS’ WEDGE — not "DRUMS’S".
  const wedgeName = (a: string) => {
    const n = WEDGE_NAMES[a as keyof typeof WEDGE_NAMES];
    return `${n}${n.endsWith('S') ? '’' : '’S'} WEDGE`;
  };
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'channel',
      label: 'CHANNEL',
      valueLabel: ch.name.split(' ')[0],
      options: cs.channels.map((c) => ({ id: c.id, label: c.name })),
      selectedId: chId,
      onSelect: setChId,
      sticky: true,
    },
    dbFader({
      id: 'send',
      label: 'SEND',
      db: sendDb,
      min: -60,
      max: 6,
      onChange: (db) => setCs((s) => setSend(s, chId, auxId, { db, tap })),
      home: 0,
      level: true,
      of: `${ch.name} → ${wedgeName(auxId).toLowerCase()}`,
      chooser: {
        title: 'TO WHICH WEDGE',
        options: auxes.map((a, i) => ({ id: a, label: `Aux ${i + 1} · ${wedgeName(a)}`, blurb: `${ch.name} → ${wedgeName(a).toLowerCase()}: ${fmtDb(ch.sends[a]?.db ?? -90)}${ch.sends[a] ? ` dB, ${ch.sends[a].tap}-fader` : ''}` })),
        selectedId: auxId,
        onSelect: setAuxId,
      },
    }),
    { kind: 'toggle', id: 'pre', label: 'PRE', value: tap === 'pre', onToggle: () => setCs((s) => setSend(s, chId, auxId, { db: sendDb <= -60 ? -90 : sendDb, tap: tap === 'pre' ? 'post' : 'pre' })) },
    {
      kind: 'group',
      id: 'console',
      label: 'CONSOLE',
      // "ALL PRE" is a claim about sends that exist: with none yet it was
      // vacuously true and the key read ALL PRE on an empty desk.
      valueLabel: allPre && each.some((n) => n > 0) ? 'ALL PRE' : 'Open',
      render: () => (
        <View style={{ gap: 10 }}>
          <Body>Every channel, four wedge sends each. ▲/▼ step a send; PRE lights the pre-fader tap; ALL PRE at the top of a column sets the whole column. The wedges above fill as you go.</Body>
          <ConsolePanel cs={cs} onChange={setCs} columns={['send:aux1', 'send:aux2', 'send:aux3', 'send:aux4']} sendNames={WEDGE_NAMES} />
        </View>
      ),
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        // View-built bus columns: their text does not grow with the box, so no full-screen zoom.
        fullScreen: false,
        badge: BUS_BADGE,
        initialParam: 'send',
        hideDragTag: true,
        bezel: [
          { k: 'CHANNEL', v: ch.name.toUpperCase(), tint: colors.cyanBright, flex: 1.4 },
          { k: 'SEND', v: `${fmtDb(sendDb)}${sendDb > -60 ? ' dB' : ''}`, tint: colors.amber },
          { k: 'TAP', v: send ? tap.toUpperCase() : '—', tint: tap === 'pre' && send ? colors.greenBright : undefined, flex: 0.8 },
          { k: 'WEDGES ≥2', v: `${each.filter((n) => n >= 2).length}/4`, tint: each.every((n) => n >= 2) ? colors.green : undefined },
        ],
        stage: (w, h) => (
          <BusBank
            w={w}
            h={h}
            buses={auxes.map((a, i) => ({ id: a, title: `W${i + 1} · ${WEDGE_NAMES[a as keyof typeof WEDGE_NAMES]}`, list: auxHears(cs, a) }))}
          />
        ),
        params,
      }}
      caption="Pick a CHANNEL, tap SEND to pick its wedge, ride the lane up and set PRE — or open CONSOLE for the whole desk. Watch the wedges fill above."
    >
      <ChapterTag n={4}>FOUR INDEPENDENT MONITOR MIXES</ChapterTag>
      <Body>Four aux sends, one per wedge, on every channel. Wedge 1 is the singer’s: vocal and a little keys. Wedge 2 the guitarist’s: guitar, vocal, kick. Wedge 3 the bassist’s: bass, kick, vocal. Wedge 4 the drummer’s: kick, bass, vocal.</Body>
      <Prompt>Step each send up and set it PRE — or use ALL PRE at the top of a column. Watch the wedges fill.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <KeyFact>Each aux is one performer’s world. The house engineer’s faders must not reach into it — which is what PRE means. Each aux output then feeds one wedge amplifier channel (or one powered wedge, or one in-ear transmitter).</KeyFact>
    </SoundSystemsRackLayout>
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
  const group = cs.subgroups.find((s) => s.id === 'sub-drums')!;
  const params: DockParam[] = [
    dbFader({ id: 'dca', label: 'BAND DCA', db: dca.levelDb, min: -60, max: 10, onChange: (db) => setCs((s) => setDca(s, 'dca-band', { levelDb: db })), home: 0, level: true, of: 'on the BAND DCA' }),
    {
      kind: 'group',
      id: 'console',
      label: 'CONSOLE',
      valueLabel: subgrouped ? 'GROUPED' : 'Open',
      render: () => (
        <View style={{ gap: 10 }}>
          <Body>Three drum channels and the bass: their L/R assignment, their GROUP cell, their DCA cell, and the drummer’s pre-fader wedge send. Tap GROUP to cycle a channel into DRUMS and take it OFF L/R; tap DCA to hang it on BAND.</Body>
          <ConsolePanel cs={cs} onChange={setCs} channels={['kick', 'snare', 'oh', 'bass']} columns={['main', 'sub', 'dca', 'send:aux4']} sendNames={WEDGE_NAMES} />
          <SubgroupStrip cs={cs} onChange={setCs} ids={['sub-drums']} />
          <DcaStrip cs={cs} onChange={setCs} />
        </View>
      ),
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        // View-built bus columns: their text does not grow with the box, so no full-screen zoom.
        fullScreen: false,
        badge: BUS_BADGE,
        initialParam: 'dca',
        hideDragTag: true,
        bezel: [
          { k: 'KICK → MAIN', v: heardDb(mainHears(cs), 'kick'), flex: 1.2 },
          { k: 'KICK → WEDGE', v: heardDb(auxHears(cs, 'aux4'), 'kick'), tint: colors.greenBright, flex: 1.2 },
          { k: 'BAND DCA', v: `${fmtDb(dca.levelDb)}${dca.levelDb > -60 ? ' dB' : ''}`, tint: colors.amber },
          { k: 'DRUMS GRP', v: subgrouped ? (group.toMain ? '→ L/R' : 'NOT → L/R') : `${drums.filter((d) => cs.channels.find((c) => c.id === d)?.subgroup === 'sub-drums').length}/3`, tint: subgrouped && group.toMain ? colors.green : undefined },
        ],
        stage: (w, h) => (
          <BusBank
            w={w}
            h={h}
            buses={[
              { id: 'sub', title: 'DRUMS SUBGROUP', list: subgroupHears(cs, 'sub-drums') },
              { id: 'main', title: 'MAIN MIX', list: mainHears(cs) },
              { id: 'aux4', title: 'AUX 4 · DRUMMER', list: auxHears(cs, 'aux4') },
            ]}
          />
        ),
        params,
      }}
      caption="Open CONSOLE: route the three drum channels into the DRUMS subgroup and take them OFF direct L/R, and hang the kick on the BAND DCA. Then ride BAND DCA down to −10: the main mix drops, the drummer’s wedge does not."
    >
      <ChapterTag n={4}>SUBGROUPS AND DCAs — THE DIFFERENCE, PROVEN</ChapterTag>
      <Body>Three drum channels and the bass, with their L/R assignment, their GROUP cell, their DCA cell, and the drummer’s pre-fader wedge send.</Body>
      <Prompt>Route the three drum channels into the DRUMS subgroup and take them OFF direct L/R. Then hang the kick on the BAND DCA and pull the DCA down to −10: the main mix drops, the drummer’s wedge does not.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>THE THREE BUSES ABOVE</Eyebrow>
        <Body>DRUMS SUBGROUP · audio sums here — one fader, one insert point for a drum compressor.</Body>
        <Body>AUX 4 · the drummer’s wedge, pre-fader: neither the subgroup fader nor the DCA touches this.</Body>
      </Card>
      <KeyFact>A subgroup carries audio: the channels sum in it, and the group fader scales the sum. A DCA carries none: it is a remote hand on each member’s fader — so anything tapped before the fader never meets it. A channel in a subgroup that is ALSO assigned to L/R arrives twice: the double-routing fault, flagged with △ on the strip.</KeyFact>
    </SoundSystemsRackLayout>
  );
}

/* ── 6 · Mute groups, solo, direct outs ─────────────────────────────────── */

function PageMutes({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(() => {
    let s = bandConsole();
    // BAND MUTE holds every band channel; ALL MICS holds every microphone
    // (the DIs and playback are not microphones). Without members the ALL
    // MICS key changed nothing on the glass (bug-hunt 2026-09-25).
    s = {
      ...s,
      channels: s.channels.map((c) => {
        const band = c.family !== 'speech' && c.family !== 'playback';
        const mic = c.family === 'drums' || c.family === 'guitar' || c.family === 'vocal' || c.family === 'speech';
        const groups = [...(band ? ['mg-band'] : []), ...(mic ? ['mg-mics'] : [])];
        return groups.length ? { ...c, muteGroups: groups } : c;
      }),
    };
    return s;
  });
  const [solved, setSolved] = useState(false);
  const bandMuted = cs.muteGroups.find((m) => m.id === 'mg-band')?.active === true;
  const mainHeard = hears(mainHears(cs));
  // BOTH the announce mic and playback, and nothing else — with ALL MICS on as
  // well only playback is left, and that is not 'MC · PB'.
  const onlyMcPb = bandMuted && mainHeard.length === 2 && mainHeard.every((h) => h.channelId === 'mc' || h.channelId === 'pb');
  const done = onlyMcPb && solved;
  useRouteCredit('mutes', done, ctx);
  const goals = [{ label: 'Mute the band with one button; announce mic and playback stay', hit: onlyMcPb }, { label: 'Answer the PFL/AFL check', hit: solved }];
  const latched = useVisitGoals(ctx, goals);
  const params: DockParam[] = cs.muteGroups.map((m) => ({ kind: 'toggle', id: m.id, label: m.name, value: m.active, onToggle: () => setCs((s) => setMuteGroup(s, m.id, !m.active)) }));
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        // View-built bus columns: their text does not grow with the box, so no full-screen zoom.
        fullScreen: false,
        badge: BUS_BADGE,
        initialParam: 'mg-band',
        bezel: [
          { k: 'BAND MUTE', v: bandMuted ? 'ON' : 'OFF', tint: bandMuted ? colors.red : undefined },
          { k: 'MAIN HEARS', v: `${mainHeard.length} CH`, tint: onlyMcPb ? colors.green : undefined, flex: 1.1 },
          { k: 'STILL LIVE', v: onlyMcPb ? 'MC · PB' : mainHeard.length === cs.channels.length ? 'ALL' : 'CHECK', tint: onlyMcPb ? colors.green : undefined, flex: 1.1 },
          { k: 'CHECK', v: solved ? '✓' : '—', tint: solved ? colors.green : undefined, flex: 0.7 },
        ],
        stage: (w, h) => <BusBank w={w} h={h} buses={[{ id: 'main', title: 'MAIN MIX — WHO IS STILL LIVE', list: mainHears(cs) }]} />,
        params,
      }}
      caption="Press BAND MUTE and read what the main mix still hears."
    >
      <ChapterTag n={4}>MUTE GROUPS, SOLO, INSERTS AND DIRECT OUTPUTS</ChapterTag>
      <Body>Between songs the band must vanish and come back exactly as set, while the announcement microphone and walk-in music stay live. Every band channel is already assigned to the BAND MUTE group.</Body>
      <Prompt>Press BAND MUTE and read what the main mix still hears.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card>
        <Eyebrow>SOLO · PFL · AFL</Eyebrow>
        <Body>Solo sends a channel to the engineer’s headphones or the control-room output WITHOUT changing the house — unless it is a destructive solo-in-place, which mutes everything else; never press that on a show. PFL listens BEFORE the fader, in mono: for checking a source before it is in the mix, or one that is muted. AFL listens AFTER the fader and pan, in stereo: the channel as the mix hears it. Both land on the control-room and monitor outputs, never on the main bus.</Body>
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
    </SoundSystemsRackLayout>
  );
}

/* ── 7 · Matrices ───────────────────────────────────────────────────────── */

function PageMatrices({ ctx }: { ctx: PageCtx }) {
  const [cs, setCs] = useState<ConsoleState>(bandConsole);
  const fills = cs.matrices.find((m) => m.id === 'mx-fills')!;
  const lobby = cs.matrices.find((m) => m.id === 'mx-lobby')!;
  const rec = cs.matrices.find((m) => m.id === 'mx-rec')!;
  const fillsOk = 'main' in fills.inputs && hears(matrixHears(cs, 'mx-fills')).length > 0;
  const lobbyOk = 'main' in lobby.inputs && 'aux7' in lobby.inputs && hears(auxHears(cs, 'aux7')).some((h) => h.channelId === 'mc');
  const recOk = 'main' in rec.inputs && hears(matrixHears(cs, 'mx-rec')).length > 0;
  const done = fillsOk && lobbyOk && recOk;
  useRouteCredit('matrices', done, ctx);
  const goals = [
    { label: 'Front fills: Matrix 2 takes MAIN', hit: fillsOk },
    { label: 'Lobby: Matrix 3 takes MAIN and AUX 7, with the announce mic sent to Aux 7', hit: lobbyOk },
    { label: 'Recording: Matrix 4 takes MAIN', hit: recOk },
  ];
  const latched = useVisitGoals(ctx, goals);
  const src = [{ id: 'main', label: 'MAIN' }, { id: 'aux7', label: 'AUX 7' }];
  const mc = cs.channels.find((c) => c.id === 'mc')!;
  const mcSend = mc.sends.aux7;
  const takes = (m: typeof fills) => Object.keys(m.inputs).map((k) => k.toUpperCase().replace('AUX7', 'AUX 7')).join(' + ') || '—';
  const params: DockParam[] = [
    dbFader({ id: 'mc7', label: 'MC → AUX 7', db: mcSend?.db ?? -90, min: -60, max: 6, onChange: (db) => setCs((s) => setSend(s, 'mc', 'aux7', { db, tap: mcSend?.tap ?? 'post' })), home: 0, level: true, of: 'announce mic to Aux 7' }),
    {
      kind: 'group',
      id: 'matrix',
      label: 'MATRICES',
      valueLabel: `${[fillsOk, lobbyOk, recOk].filter(Boolean).length}/3`,
      render: () => (
        <View style={{ gap: 10 }}>
          <Body>Three matrices and the buses they can take. Tap a crosspoint to cycle it: off → 0 dB → −6 dB. The matrices above fill as you go.</Body>
          <MatrixStrip cs={cs} onChange={setCs} matrixId="mx-fills" sources={src} />
          <MatrixStrip cs={cs} onChange={setCs} matrixId="mx-lobby" sources={src} />
          <MatrixStrip cs={cs} onChange={setCs} matrixId="mx-rec" sources={src} />
        </View>
      ),
    },
    {
      kind: 'group',
      id: 'console',
      label: 'CONSOLE',
      valueLabel: 'Open',
      render: () => (
        <View style={{ gap: 10 }}>
          <Body>The announce mic, the vocal and the kick: their L/R assignment and their Aux 7 send.</Body>
          <ConsolePanel cs={cs} onChange={setCs} channels={['mc', 'vox', 'kick']} columns={['main', 'send:aux7']} sendNames={WEDGE_NAMES} />
        </View>
      ),
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        // View-built bus columns: their text does not grow with the box, so no full-screen zoom.
        fullScreen: false,
        badge: BUS_BADGE,
        initialParam: 'mc7',
        hideDragTag: true,
        bezel: [
          { k: 'FILLS TAKE', v: takes(fills), tint: fillsOk ? colors.green : undefined, flex: 1.2 },
          { k: 'LOBBY TAKES', v: takes(lobby), tint: lobbyOk ? colors.green : undefined, flex: 1.4 },
          { k: 'REC TAKES', v: takes(rec), tint: recOk ? colors.green : undefined, flex: 1.1 },
          { k: 'MC → AUX 7', v: `${fmtDb(mcSend?.db ?? -90)}${mcSend && mcSend.db > -60 ? ' dB' : ''}`, tint: colors.amber, flex: 1.1 },
        ],
        stage: (w, h) => (
          <BusBank
            w={w}
            h={h}
            buses={[
              { id: 'mx-fills', title: 'MX 2 · FRONT FILLS', list: matrixHears(cs, 'mx-fills') },
              { id: 'mx-lobby', title: 'MX 3 · LOBBY', list: matrixHears(cs, 'mx-lobby') },
              { id: 'mx-rec', title: 'MX 4 · RECORDING', list: matrixHears(cs, 'mx-rec') },
            ]}
          />
        ),
        params,
      }}
      caption="Open MATRICES and give the fills and the recorder MAIN. The lobby wants MAIN plus more announce mic: ride MC → AUX 7 up (an aux kept for exactly that, so no wedge hears it) and let Matrix 3 take AUX 7."
    >
      <ChapterTag n={4}>MATRIX OUTPUTS</ChapterTag>
      <Body>Three matrices and the buses they can take. A matrix mixes finished BUSES — the main mix, an aux, a subgroup — into a further output with its own level, EQ and delay.</Body>
      <Prompt>The front fills want the main mix. The lobby wants the main mix PLUS more announce mic — send the mic to Aux 7 (an aux kept for exactly that, so no wedge hears it) and let the matrix take Aux 7. The recorder wants the main mix.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>THE LOBBY</Eyebrow>
        <Body>The announce mic should arrive louder than everything else — it comes in twice: inside MAIN and by its own route on AUX 7.</Body>
      </Card>
      <KeyFact>A matrix is the post-main tool. Whatever the house engineer does to the mix, the fills, the lobby and the recorder follow it — and each can still be shaped on its own. On a smaller console without matrices the same feeds come from spare aux outputs, at the cost of building each one channel by channel.</KeyFact>
    </SoundSystemsRackLayout>
  );
}

/* ── 8 · The output patch ───────────────────────────────────────────────── */

const BUSES = ['Main L', 'Main R', 'Aux 1', 'Aux 2', 'Aux 6', 'Matrix 2', 'Matrix 3'] as const;
type Bus = (typeof BUSES)[number];

const DESTINATIONS: readonly { id: string; name: string; short: string; needs: Bus; why: string }[] = [
  { id: 'procL', name: 'Processor input 1 → mains left', short: 'PROC 1 · L', needs: 'Main L', why: 'The mains take the main mix, left side.' },
  { id: 'procR', name: 'Processor input 2 → mains right', short: 'PROC 2 · R', needs: 'Main R', why: 'The mains take the main mix, right side.' },
  { id: 'wedge1', name: 'Wedge 1 amplifier', short: 'WEDGE 1', needs: 'Aux 1', why: 'A wedge takes its own aux — never a main output (the fault on the bench).' },
  { id: 'wedge2', name: 'Wedge 2 amplifier', short: 'WEDGE 2', needs: 'Aux 2', why: 'Its own aux, its own mix.' },
  { id: 'subs', name: 'Processor input 4 → subwoofers (aux-fed)', short: 'PROC 4 · SUB', needs: 'Aux 6', why: 'Aux-fed subs take the sub aux, not the main mix.' },
  { id: 'fills', name: 'Processor input 3 → front fills', short: 'PROC 3 · FILL', needs: 'Matrix 2', why: 'Fills are matrix-fed so they can be delayed and equalised on their own.' },
  { id: 'lobby', name: 'Lobby amplifier', short: 'LOBBY', needs: 'Matrix 3', why: 'The lobby is a matrix: main plus announce, at its own level.' },
];

function PagePatch({ ctx }: { ctx: PageCtx }) {
  const [patch, setPatch] = useState<Record<string, Bus | null>>({});
  const [active, setActive] = useState<string>(DESTINATIONS[0].id);
  const correct = DESTINATIONS.filter((d) => patch[d.id] === d.needs).length;
  const done = correct >= DESTINATIONS.length;
  useRouteCredit('patch', done, ctx);
  const goals = [{ label: 'Patch every destination from the right bus', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const sockets: PatchSocket[] = DESTINATIONS.map((d) => ({ id: d.id, name: d.name, short: d.short, bus: patch[d.id] ?? null, ok: patch[d.id] == null ? null : patch[d.id] === d.needs }));
  const act = DESTINATIONS.find((d) => d.id === active)!;
  const actBus = patch[act.id] ?? null;
  const wrong = DESTINATIONS.filter((d) => patch[d.id] && patch[d.id] !== d.needs);
  const params: DockParam[] = [
    flipFader({
      id: 'socket',
      label: 'SOCKET',
      title: 'THE STAGEBOX’S LINE OUTPUTS',
      items: DESTINATIONS,
      selectedId: active,
      onSelect: setActive,
      name: (d) => `OUT ${DESTINATIONS.indexOf(d) + 1} · ${d.name}`,
      short: (d) => `OUT ${DESTINATIONS.indexOf(d) + 1}`,
      blurb: (d) => (patch[d.id] ? `Patched from ${patch[d.id]}${patch[d.id] === d.needs ? ' — correct.' : `. ${d.why}`}` : 'Unpatched. Tap BUS to feed it.'),
    }),
    {
      kind: 'options',
      id: 'bus',
      label: 'BUS',
      valueLabel: actBus ?? '—',
      options: BUSES.map((b) => ({ id: b, label: b })),
      selectedId: actBus,
      onSelect: (id) => setPatch((p) => ({ ...p, [act.id]: id as Bus })),
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        badge: 'OUTPUT PATCH — ILLUSTRATIVE · a wrong patch is silent at best',
        initialParam: 'socket',
        hideDragTag: true,
        bezel: [
          { k: 'SOCKET', v: act.short, tint: colors.cyanBright, flex: 1.3 },
          { k: 'FED FROM', v: actBus ?? 'UNPATCHED', tint: actBus ? (actBus === act.needs ? colors.green : colors.red) : undefined, flex: 1.3 },
          { k: 'PATCHED', v: `${correct}/${DESTINATIONS.length}`, tint: done ? colors.green : undefined },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={354 / PATCH_H}>
            <PatchPanel sockets={sockets} active={active} onTap={setActive} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride SOCKET along the stagebox’s outputs (or tap one on the panel), then tap BUS and pick what it needs. A wrong patch is silent at best — a main output into a wedge amplifier puts the house mix in the singer’s wedge."
      wellTop={
        <>
          {wrong.map((d) => (
            <VerdictLine key={d.id} ok={false}>{d.name}: patched from {patch[d.id]}. {d.why}</VerdictLine>
          ))}
          <VerdictLine ok={done} warn={!done && correct > 0}>{done ? 'Every output leaves the right socket. Document it — the patch list is what the next person rebuilds from.' : `${correct} of ${DESTINATIONS.length} patched correctly.`}</VerdictLine>
        </>
      }
    >
      <ChapterTag n={4}>OUTPUT PATCHING</ChapterTag>
      <Body>The stagebox’s seven line outputs, the bus tape above each socket, and the destination its cable runs to. Nothing is patched yet.</Body>
      <Prompt>Tap a socket, then the bus it needs.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <DeeperRow>
        <LabLink route="PatchbayLab" label="Patchbay Signal Flow & Normalling" />
        <LabLink route="SoundSystemsBuild" label="BUILD mode — wire a whole venue" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

export const SS_ROUTE_PAGES: SsPageDef[] = [
  { title: 'Anatomy of a channel', short: 'CHANNEL', Component: PageChannel, manualDone: true, rack: true },
  { title: 'Pre-fader and post-fader', short: 'PRE/POST', Component: PagePrePost, manualDone: true, rack: true },
  { title: 'Subgroup, aux, matrix or DCA?', short: 'WHICH', Component: PageWhichTool, manualDone: true },
  { title: 'Four monitor mixes', short: 'MONITORS', Component: PageMonitorMixes, manualDone: true, rack: true },
  { title: 'Subgroups and DCAs', short: 'GROUPS', Component: PageGroups, manualDone: true, rack: true },
  { title: 'Mute groups, solo and direct outs', short: 'MUTES', Component: PageMutes, manualDone: true, rack: true },
  { title: 'Matrix outputs', short: 'MATRIX', Component: PageMatrices, manualDone: true, rack: true },
  { title: 'Output patching', short: 'PATCH', Component: PagePatch, manualDone: true, rack: true },
];
