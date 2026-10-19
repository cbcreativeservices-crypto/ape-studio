/**
 * Screen 15 — Stems and source separation (research DJ20, second half):
 * drums, bass, chords and melody played as separate parts, stem mixing, and
 * ORIGINAL stems (this lab's music is built from parts — the real
 * multitrack) against SEPARATED audio — here a clearly labelled SIMULATION of
 * typical separation errors (engine/djStems: leakage and a warbling
 * artifact), never presented as an algorithm's output. The lanes are each
 * part's real waveform. The fault: a stem left muted after a transition.
 */
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { runSoon } from '../../../../lib/afterInteractions';
import { Scene } from '../art/Scene';
import { StemLanes, STEM_COLOUR, type StemColumn } from '../art/stemArt';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, channelFaderKey, stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, trimPos, type Booth, type DeckId, type StemGains } from '../model/djModel';
import { STEM_IDS, type StemId } from '../engine/djMusic';
import { ALL_STEMS, STEM_WORDS, melodyGhostDb, stemOverview, stemOverviewCached, type StemOverview } from '../engine/djStems';
import { alignPhase } from '../model/djDeck';
import { useBoothKit } from './shared';
import { Choices, EvidenceCheck, TrayNote, s2Of, s2styles } from './s2kit';
import { SkipOptional } from './skipOptional';

const TERMS = [
  { term: 'Stem', def: 'One part of a track on its own — drums, bass, chords, melody (or vocals) — that the player can mute or turn down while the rest plays.' },
  { term: 'Original stems', def: 'Parts that were recorded or made separately (the multitrack). In this lab they add up to exactly the track; real stem files come very close. One muted is truly gone.' },
  { term: 'Separation', def: 'Software that guesses the parts from the finished mix. Fast and handy — but where parts overlap it guesses wrong.' },
  { term: 'Leakage', def: 'Pieces of one part left in another: a ghost of the melody after you mute it, hi-hats inside the melody stem.' },
] as const;

export const GOALS_STEMS = ['Mute the melody (original)', 'Hear the ghost (separated)', 'Swap drums and bass: A out, B in', 'A bed of drums and bass', 'Fix the thin mix', 'Find where a muted melody is gone'] as const;

const gainsOf = (b: Booth, d: DeckId): StemGains => b.decks[d].stems ?? ALL_STEMS;
/** A deck's stems in WORDS (learning review 2, p15 #2): "ALL 4", the one
 *  part that is off ("NO BASS"), or "2 OFF" with the parts named under it. */
function stemsWords(g: StemGains): { v: string; sub?: string; a11y: string } {
  const off = STEM_IDS.filter((s) => !(g[s] > 0));
  const names = off.map((s) => STEM_WORDS[s]);
  if (!off.length) return { v: 'ALL 4', a11y: 'all four stems playing' };
  if (off.length === 1) return { v: `NO ${names[0]}`, a11y: `${names[0].toLowerCase()} muted` };
  if (off.length === 4) return { v: 'ALL OFF', a11y: 'every stem muted' };
  return { v: `${off.length} OFF`, sub: names.join(' + '), a11y: `${names.join(' and ').toLowerCase()} muted` };
}
const onCount = (g: StemGains) => STEM_IDS.filter((s) => g[s] > 0).length;

function setStems(d: DeckId, f: (g: StemGains, src: 'ORIGINAL' | 'SEPARATED') => { stems?: StemGains; stemFrom?: 'ORIGINAL' | 'SEPARATED' }) {
  updateBooth((b, t) => {
    const deck = b.decks[d];
    const next = { ...b, decks: { ...b.decks, [d]: { ...deck, ...f(deck.stems ?? ALL_STEMS, deck.stemFrom ?? 'ORIGINAL') } } };
    return b.decks.A.playing && b.decks.B.playing ? alignPhase(next, t, 'B') : next;
  });
}

function StemTray({ sel, onSel }: { sel: DeckId; onSel: (d: DeckId) => void }) {
  const b = getBooth();
  const g = gainsOf(b, sel);
  const src = b.decks[sel].stemFrom ?? 'ORIGINAL';
  return (
    <View style={s2styles.tray}>
      <Choices head="WHICH DECK’S STEMS (and lanes)" value={sel} items={[{ id: 'A' as DeckId, label: 'DECK A' }, { id: 'B' as DeckId, label: 'DECK B' }]} onPick={(d) => onSel(d as DeckId)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {STEM_IDS.map((s) => (
          <LabChip key={s} label={`${g[s] > 0 ? '●' : '○'} ${STEM_WORDS[s]}`} selected={g[s] > 0} onPress={() => setStems(sel, (x) => ({ stems: { ...x, [s]: x[s] > 0 ? 0 : 1 } }))} />
        ))}
        <LabChip label="ALL ON" selected={false} onPress={() => setStems(sel, () => ({ stems: { ...ALL_STEMS } }))} compact />
      </View>
      <TrayNote>{`Deck ${sel}’s stems come from: ${src === 'ORIGINAL' ? 'ORIGINAL' : 'SEPARATED (SIMULATED)'} — change it on the SOURCE key.`}</TrayNote>
      <TrayNote>Our practice tracks have no vocals; the MELODY stem holds the part a vocal stem usually would.</TrayNote>
    </View>
  );
}

function PageStems({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit({ lockPhase: true });
  const { ready } = useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 41);
    x = preMatched(cueAtBar(x, 'B', 'glassHarbour', 41));
    const flat = { hi: 0.5, mid: 0.5, lo: 0.5 };
    return {
      ...x,
      decks: { A: { ...x.decks.A, stems: { ...ALL_STEMS }, stemFrom: 'ORIGINAL' }, B: { ...x.decks.B, stems: { ...ALL_STEMS }, stemFrom: 'ORIGINAL' } },
      ch: { 1: { ...x.ch[1], trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', eq: flat, filter: 0, cue: false }, 2: { ...x.ch[2], trim: trimPos(-11), fader: 0, xf: 'THRU', eq: flat, filter: 0, cue: true } },
      perspective: 'CROWD',
    };
  });
  const [sel, setSel] = useState<DeckId>('A');
  const [ovs, setOvs] = useState<Record<string, StemOverview>>({});
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const h = useRef({ mute: false, ghost: false, swap: false, bed: false, sepSeen: false, check: false });
  // measure the parts off the render path (each part's real min/max)
  useEffect(() => {
    let live = true;
    // a real macrotask between chunks of the measuring (the house helper)
    const breath = () => new Promise<void>((r) => void runSoon(r));
    const jobs: [string, () => Promise<StemOverview>][] = [
      ['nightFerry:ORIGINAL', () => stemOverview('nightFerry', 'ORIGINAL', breath)],
      ['glassHarbour:ORIGINAL', () => stemOverview('glassHarbour', 'ORIGINAL', breath)],
      ['nightFerry:SEPARATED', () => stemOverview('nightFerry', 'SEPARATED', breath)],
      ['glassHarbour:SEPARATED', () => stemOverview('glassHarbour', 'SEPARATED', breath)],
    ];
    const h0 = runSoon(() => {
      void (async () => {
        for (const [k, run] of jobs) {
          const o = await run();
          if (!live) return;
          setOvs((m) => ({ ...m, [k]: o }));
        }
      })();
    });
    return () => {
      live = false;
      h0.cancel();
    };
  }, []);
  const d = booth.decks[sel];
  const src = d.stemFrom ?? 'ORIGINAL';
  const gA = gainsOf(booth, 'A');
  const gB = gainsOf(booth, 'B');
  const A = booth.decks.A;
  const B = booth.decks.B;
  const s2 = s2Of(audio.last);
  // the ghost the separation leaves (the render's reading; the model's own while stopped)
  const sepMuted = (booth.decks[sel].stemFrom ?? 'ORIGINAL') === 'SEPARATED' && gainsOf(booth, sel).lead === 0;
  const ghostSel = s2?.ghostDb[sel] ?? (sepMuted ? melodyGhostDb(gainsOf(booth, sel), booth.decks[sel].posSec, 48000 * 2) : undefined);
  const playing = booth.decks[sel].playing;
  const g = gainsOf(booth, sel);
  if (ready && playing && g.lead === 0 && src === 'ORIGINAL') h.current.mute = true;
  if (ready && playing && g.lead === 0 && src === 'SEPARATED' && ghostSel != null && ghostSel > -40) h.current.ghost = true;
  // the swap takes the BASS with the drums, so two bass lines never stack
  // (audio review 2 #1)
  if (ready && A.playing && B.playing && gA.drums === 0 && gA.bass === 0 && gB.drums > 0 && gB.bass > 0 && booth.ch[1].fader >= 0.5 && booth.ch[2].fader >= 0.5) h.current.swap = true;
  if (ready && A.playing && gA.drums > 0 && gA.bass > 0 && gA.chords === 0 && gA.lead === 0 && booth.ch[1].fader >= 0.5) h.current.bed = true;
  // CHECK YOURSELF, from evidence: deck B's muted melody on SEPARATED leaves
  // a ghost (read MELODY LEFT); then find the SOURCE where it is truly gone
  if (ready && check && B.playing && (B.stemFrom ?? 'ORIGINAL') === 'SEPARATED' && gB.lead === 0) h.current.sepSeen = true;
  if (ready && check && h.current.sepSeen && B.playing && (B.stemFrom ?? 'ORIGINAL') === 'ORIGINAL' && gB.lead === 0) h.current.check = true;
  const hits = [h.current.mute, h.current.ghost, h.current.swap, h.current.bed, faultFixed, h.current.check];
  const goals = GOALS_STEMS.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'STEMS', ready);
  // all four parts at full level add up to the track; a muted melody is gone
  // from the original stems and leaves a ghost in the separated ones
  const leftWord = g.lead > 0 ? '= TRACK' : src === 'ORIGINAL' ? 'NONE' : ghostSel != null ? `${ghostSel.toFixed(0)} dB` : '…';
  // both decks playing (a blend) → both decks' stems, side by side, each with
  // its channel's level to the mix; otherwise the selected deck, full width
  const column = (dk: DeckId): StemColumn => {
    const dd = booth.decks[dk];
    const sc = dd.stemFrom ?? 'ORIGINAL';
    const gg = gainsOf(booth, dk);
    const sep = sc === 'SEPARATED' && gg.lead === 0;
    return {
      deck: dk,
      d: dd,
      ov: dd.track ? (ovs[`${dd.track}:${sc}`] ?? stemOverviewCached(dd.track, sc)) : null,
      gains: gg,
      source: sc,
      ghostDb: sep ? (s2?.ghostDb[dk] ?? melodyGhostDb(gg, dd.posSec, 48000 * 2)) : null,
      level: booth.ch[dk === 'A' ? 1 : 2].fader,
    };
  };
  const cols: StemColumn[] = A.playing && B.playing ? [column('A'), column('B')] : [column(sel)];
  const wA = stemsWords(gA);
  const wB = stemsWords(gB);
  const wSel = sel === 'A' ? wA : wB;
  return (
    <DjRack
      spec={{
        render: (w, hh) => (
          <Scene
            w={w}
            h={hh}
            frame={{ x: 0, y: 0, w: 10, h: 10 }}
            motion={motion}
            aspect={false}
            screenOverlay={(W, H, _xf, k) => <StemLanes b={{ x: 6, y: 4, w: W - 12, h: H - 8 }} cols={cols} k={Math.sqrt(k)} />}
            a11y={`You are looking at ${cols.length > 1 ? 'both decks’' : `deck ${sel}’s`} four stems as their own waveforms — drums, bass, chords and melody — each with its pad lit while it plays, a muted one hatched. ${cols.map((c) => `Deck ${c.deck} ${c.source === 'ORIGINAL' ? 'original' : 'separated (simulated)'}: ${STEM_IDS.filter((s) => c.gains[s] > 0).map((s) => STEM_WORDS[s].toLowerCase()).join(', ') || 'no stems'}`).join('. ')}.`}
          >
            {null}
          </Scene>
        ),
        bezel: [
          { k: 'A STEMS', v: wA.v, sub: wA.sub, vA11y: wA.a11y, tint: colors.textPrimary },
          { k: 'B STEMS', v: wB.v, sub: wB.sub, vA11y: wB.a11y, tint: colors.textPrimary },
          { k: `${sel} FROM`, v: src === 'ORIGINAL' ? 'ORIGINAL' : 'SEPARATED', sub: src === 'SEPARATED' ? 'SIMULATED' : undefined, tint: src === 'ORIGINAL' ? colors.green : '#ff8a7e' },
          { k: g.lead > 0 ? 'ALL PARTS' : 'MELODY LEFT', v: leftWord, tint: g.lead === 0 && src === 'SEPARATED' ? '#ff8a7e' : STEM_COLOUR.lead },
        ],
        params: [
          { kind: 'group', id: 'stems', label: 'STEMS', valueLabel: `${sel} ${onCount(g)}/4`, valueA11y: `deck ${sel}: ${wSel.a11y}`, render: () => <StemTray sel={sel} onSel={setSel} /> },
          {
            kind: 'options',
            id: 'src',
            label: 'SOURCE',
            // the dock value box holds 7 mono characters at 390: abbreviated, the full
            // words on the bezel (A FROM) and in the chooser
            valueLabel: src === 'ORIGINAL' ? 'ORIG.' : 'SEP.',
            valueA11y: src === 'ORIGINAL' ? 'original stems' : 'separated, simulated',
            options: [
              { id: 'ORIGINAL', label: 'ORIGINAL STEMS', blurb: 'The track’s own parts, exactly as they were made: they add up to the track, and a muted part is truly gone.' },
              { id: 'SEPARATED', label: 'SEPARATED (SIMULATED)', blurb: 'A prepared imitation of what separation from a finished mix often sounds like: leakage between the parts and a watery edge. Not a real algorithm.' },
            ],
            selectedId: src,
            sticky: true,
            onSelect: (id) => setStems(sel, () => ({ stemFrom: id as 'ORIGINAL' | 'SEPARATED' })),
          },
          channelFaderKey(booth, 2, 'FADER 2'),
          boothKey(booth, tr),
          stopKey(tr),
        ],
        initialParam: 'stems',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at ${A.playing && B.playing ? 'both decks’ stems side by side' : `deck ${sel}’s four stems`}, each part as its own waveform — drums, bass, chords and melody — under one playhead, with each part’s pad lit while it plays and a muted part hatched.`}</Look>
        <P>A stem player mutes or turns down one part of a track while the rest plays. ORIGINAL stems are the real parts; SEPARATED stems are software’s guess from the finished mix (here, a labelled simulation).</P>
        <P>While both decks play, both decks’ stems show, each with its channel’s level going to the mix.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play deck A (it is in the drop — the busiest, fullest part: every part playing). Open STEMS and tap MELODY off: the green lane is hatched MUTED and the hook (the catchy melody) is gone.</Do>
        <P>Bring it back, then try DRUMS off: the groove disappears and the chords and bass carry on, in time.</P>
      </Step>
      <Step n={3}>
        <P>Now switch SOURCE to SEPARATED (SIMULATED) and mute the MELODY again. A ghost of it stays — drawn as a bright thin trace with its level, LEFT IN, and read on MELODY LEFT — and the hi-hats lose a little sparkle, because some of them had been put in the melody stem. Unmute it and look at the melody lane: you can see hats leaking into it.</P>
        <Note>Separated stems are a great tool; the lesson is to listen before you trust a muted part to be truly gone. Supported stem controls vary from player to player.</Note>
      </Step>
      <Step n={4}>
        <Do>Mute the melody on the ORIGINAL stems, then hear the ghost on SEPARATED. Then a stem blend: play both decks and bring deck B in (FADER 2 up, it is matched in tempo) with deck A’s DRUMS and BASS off and deck B’s drums and bass on — A’s chords and melody over B’s groove.</Do>
        <P>Swap the bass together with the drums: two bass lines at once clash (Screen 9). Swapping drums and bass between two tracks is one way to blend with stems; there are many. Starting points, not rules.</P>
        <GoalChips goals={goals.slice(0, 3)} latched={latched.slice(0, 3)} />
        <Note>Deck B’s tempo has been matched to deck A for you, with key lock on — Screens 10 and 14 show how.</Note>
      </Step>
      <Step n={5}>
        <Do>On your own: turn deck A into a bed of just drums and bass.</Do>
        <EvidenceCheck
          task="Deck B on SEPARATED, its MELODY muted: read MELODY LEFT — a ghost stays. Now find the SOURCE where a muted melody is truly gone, with deck B still playing and its melody still muted."
          onSetup={() => {
            void audio.requestSound();
            h.current.sepSeen = false;
            h.current.check = false;
            setCheck(true);
            setSel('B');
            updateBooth((b, t) => ({ ...b, decks: { A: { ...b.decks.A, playing: false }, B: { ...b.decks.B, playing: true, at: t, stems: { ...ALL_STEMS, lead: 0 }, stemFrom: 'SEPARATED' } }, ch: { 1: { ...b.ch[1], fader: 0 }, 2: { ...b.ch[2], fader: 0.85 } }, perspective: 'CROWD' }));
          }}
          armed={check}
          done={latched[5]}
          hint="Read MELODY LEFT and look at the melody lane: a bright trace is what the separation left in. Then open SOURCE."
          explain="On ORIGINAL stems the melody lane is empty and MELODY LEFT reads NONE: the parts were made separately, so a muted part is truly gone. A separator has to guess from the finished mix, and where parts overlap it leaves some behind — leakage."
        />
        <FaultCard
          title="THE MIX SOUNDS THIN"
          symptom="After a blend, deck A is playing alone on the floor and it sounds thin and weak — the kick is there, but the low end has gone."
          start={() => {
            void audio.requestSound();
            setSel('A');
            updateBooth((b, t) => ({
              ...b,
              decks: { A: { ...b.decks.A, playing: true, at: t, stems: { drums: 1, bass: 0, chords: 1, lead: 1 }, stemFrom: 'ORIGINAL' }, B: { ...b.decks.B, playing: false } },
              ch: { 1: { ...b.ch[1], fader: 0.85 }, 2: { ...b.ch[2], fader: 0 } },
              perspective: 'CROWD',
            }));
          }}
          fixed={A.playing && gA.bass > 0}
          hints={['Read A STEMS on the readout strip.', 'One of deck A’s stems was left muted after the blend.', 'Open STEMS, pick deck A and bring the BASS back.']}
          why="Deck A’s BASS stem was still muted from the blend. A stem left off is easy to miss — the track still plays, so check the stems (and their pads) as part of every transition."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(3)} latched={latched.slice(3)} />
        <SkipOptional ctx={ctx} here={15} />
      </Step>
    </DjRack>
  );
}

export const P15: PageDef = { title: 'Stems and source separation', short: 'STEMS', Component: PageStems, manualDone: true, rack: true };
