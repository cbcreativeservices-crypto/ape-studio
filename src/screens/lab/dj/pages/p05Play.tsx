/**
 * Screen 5 — Load and play music (research DJ08 + DJ10): track selection,
 * loading, play/pause, the transport CUE, the jog (search), identifying the
 * active deck, playlists and preparing media. The camera follows the deck you
 * are operating; the bezel says which deck the crowd is hearing. The fault: a
 * new track loaded onto the deck that was on air.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Group, RoundedRect } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { BOOTH_LAYOUT, PLAYER } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRACKS, TRACK_IDS, trackSeconds, type TrackId } from '../engine/djMusic';
import { cue, load, seek } from '../model/djDeck';
import type { Booth, DeckId } from '../model/djModel';
import { deckOnAir, loadVerdict } from './s1Guards';
import { PITCH_RANGE_PCT, formatClock, pitchFor, playedBpm } from '../model/djTime';
import { INK } from '../art/ink';
import { SceneText } from '../art/sceneText';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'Load', def: 'Put a track onto a deck. Depending on the player, loading onto a playing deck stops it or jumps straight into the new track — on air, either is a disaster (some players have a load-lock that refuses it). Load only onto the deck the crowd is not hearing.' },
  { term: 'Transport CUE', def: 'The player’s CUE button: a place in the track you come back to. Paused, it sets the point; playing, it jumps back there and stops. On most players you can also HOLD CUE to hear from the cue point — let go and it snaps back; press PLAY while holding to let it run. Not the same as the mixer’s headphone CUE.' },
  { term: 'On air', def: 'A deck the audience is hearing right now: playing, with its channel fader up and the crossfader letting it through.' },
  { term: 'Jog wheel', def: 'Turn it while paused to move through the track finely; push or drag its outer ring while playing to nudge the track a little. In VINYL mode, pressing the top plate grabs the track like a record — never rest your hand on it.' },
] as const;

export const GOALS_PLAY = ['Put deck A on air', 'Load a track deck A can tempo-match', 'Play and pause it', 'Set a cue point', 'Jump back with CUE', 'Search the track', 'Recover the stopped music', 'Pass the check'] as const;

/** Can this track be tempo-matched to deck A (inside the ±8 % fader)? */
function matchable(b: Booth, t: TrackId): { ok: boolean; why: string } {
  const A = b.decks.A;
  if (!A.track) return { ok: true, why: '' };
  if (t === A.track) return { ok: false, why: `${TRACKS[t].title} is the track already playing on deck A — choose a different one.` };
  const p = pitchFor(TRACKS[t].bpm, playedBpm(TRACKS[A.track].bpm, A.pitch));
  if (Math.abs(p) <= PITCH_RANGE_PCT) return { ok: true, why: `${TRACKS[t].title} (${TRACKS[t].bpm} BPM) sits ${Math.abs(p).toFixed(1)} % from deck A’s ${TRACKS[A.track].bpm} — inside the ±8 % tempo fader.` };
  return { ok: false, why: `${TRACKS[t].title} is ${TRACKS[t].bpm} BPM, ${Math.abs(p).toFixed(0)} % away from deck A’s ${TRACKS[A.track].bpm}: this lab’s tempo fader only reaches ±8 %, so it cannot be matched. Read the BPM in the crate before you load.` };
}

/** The OTHER deck's on-air state, at the glass edge (learning review p05 #2):
 *  the camera follows one deck, so this says which deck the crowd hears. */
function OnAirMarker({ w, k, other, air }: { w: number; k: number; other: DeckId; air: boolean }) {
  const fs = 10 * Math.sqrt(k);
  const text = `DECK ${other}: ${air ? 'ON AIR' : 'OFF AIR'}`;
  const tw = text.length * fs * 0.56 + 14;
  return (
    <Group>
      <RoundedRect x={w - tw - 6} y={6} width={tw} height={fs * 1.7} r={5} color="rgba(0,0,0,0.72)" />
      <RoundedRect x={w - tw - 6} y={6} width={tw} height={fs * 1.7} r={5} style="stroke" strokeWidth={1} color={air ? INK.peak : '#3a3d44'} />
      <SceneText x={w - 6 - tw / 2} y={6 + fs * 1.18} size={fs} text={text} color={air ? '#ff8a7e' : INK.printDim} face="label" align="center" minPt={9.5} />
    </Group>
  );
}

/** Is this deck reaching the crowd? */
export const onAir = deckOnAir;

function BrowseTray({ deck, setDeck, onLoaded, note }: { deck: DeckId; setDeck: (d: DeckId) => void; onLoaded: (d: DeckId, t: TrackId, before: Booth) => void; note: { ok: boolean; text: string } | null }) {
  const b = getBooth();
  return (
    <View style={styles.tray}>
      {note ? <Text style={[styles.meta, { color: note.ok ? colors.green : '#ff8a7e' }]}>{note.text}</Text> : null}
      <Text style={styles.head}>OPERATE WHICH DECK?</Text>
      <View style={styles.row}>
        {(['A', 'B'] as const).map((d) => (
          <LabChip key={d} label={`DECK ${d}${onAir(b, d) ? ' · ON AIR' : ''}`} selected={deck === d} onPress={() => setDeck(d)} />
        ))}
      </View>
      <Text style={styles.head}>{`PRACTICE CRATE · LOAD TO DECK ${deck}`}</Text>
      {TRACK_IDS.map((t) => {
        const def = TRACKS[t];
        return (
          <View key={t} style={styles.trackRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.track}>{def.title}</Text>
              <Text style={styles.meta}>{`${def.style} · ${def.bpm} BPM · ${def.key} · ${formatClock(trackSeconds(t) - 1)}`}</Text>
            </View>
            <LabChip
              label={`LOAD ${deck}`}
              selected={b.decks[deck].track === t}
              onPress={() => {
                // judged on the booth BEFORE the load: a load stops the deck
                const before = getBooth();
                updateBooth((x, tt) => load(x, tt, deck, t));
                onLoaded(deck, t, before);
              }}
              compact
            />
          </View>
        );
      })}
    </View>
  );
}

function PagePlay({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  const { ready } = useScreenSetup((b) => {
    const x = cueAtBar(b, 'A', 'nightFerry', 17);
    return { ...x, decks: { ...x.decks, B: { ...x.decks.B, track: null, playing: false } }, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU' }, 2: { ...x.ch[2], fader: 0, xf: 'THRU' } }, perspective: 'CROWD' };
  });
  const [deck, setDeck] = useState<DeckId>('A');
  const [aOnAir, setAOnAir] = useState(false);
  const [loadedSpare, setLoadedSpare] = useState(false);
  const [loadMsg, setLoadMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [playedB, setPlayedB] = useState(false);
  const [cueSet, setCueSet] = useState(false);
  const [cueBack, setCueBack] = useState(false);
  const [searched, setSearched] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const d = booth.decks[deck];
  const onLoaded = (dk: DeckId, t: TrackId, before: Booth) => {
    // `before`: the booth as it was before the load (after it, the loaded
    // deck is always stopped, so "was it on air?" read false every time and
    // a load onto the on-air deck credited the spare-deck goal with no
    // warning — toddler test 2026-10-19)
    const m = dk === 'B' ? matchable(before, t) : { ok: true, why: '' };
    const v = loadVerdict(before, dk, m.ok);
    if (v.stoppedCrowd) {
      setLoadMsg({ ok: false, text: `That deck was ON AIR — the load stopped the crowd’s music. Load on the spare deck.` });
      return;
    }
    setLoadMsg(m.why ? { ok: m.ok, text: m.why } : null);
    if (v.credit) setLoadedSpare(true);
  };
  const airA = onAir(booth, 'A');
  const airB = onAir(booth, 'B');
  // judged only once this screen's setup is applied: the first render still
  // sees the last screen's booth (deck A on air, deck B playing), which ticked
  // "Put deck A on air" and "Play and pause it" on arrival
  if (ready && booth.decks.B.playing && booth.decks.B.track && !playedB) setPlayedB(true);
  if (ready && airA && !aOnAir) setAOnAir(true);
  const hits = [aOnAir, loadedSpare, playedB && !booth.decks.B.playing, cueSet, cueBack, searched, faultFixed, check];
  const goals = GOALS_PLAY.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'PLAY');
  const total = d.track ? trackSeconds(d.track) - 1 : 1;
  const beat = d.track ? 60 / TRACKS[d.track].bpm : 0.5;
  const other: DeckId = deck === 'A' ? 'B' : 'A';
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <BoothStage
            w={w}
            h={h}
            booth={booth}
            motion={motion}
            spec={{
              view: deck === 'A' ? 'deckA' : 'deckB',
              highlight: deck === 'A' ? { A: ['play', 'cue', 'jog'] } : { B: ['play', 'cue', 'jog'] },
              callouts: [
                { id: 'op', text: `OPERATING DECK ${deck}${onAir(booth, deck) ? ' · ON AIR' : ''}`, at: { x: BOOTH_LAYOUT[deck].x + 160, y: 0 }, dx: 0, dy: -4, tone: onAir(booth, deck) ? 'red' : 'green' },
                { id: 'pl', text: 'PLAY', at: { x: BOOTH_LAYOUT[deck].x + PLAYER.play.cx + 18, y: PLAYER.play.cy }, dx: 26, dy: 4 },
                { id: 'cu', text: 'CUE', at: { x: BOOTH_LAYOUT[deck].x + PLAYER.cue.cx + 18, y: PLAYER.cue.cy }, dx: 26, dy: -4 },
              ],
              screenOverlay: (W, _H, _xf, k) => <OnAirMarker w={W} k={k} other={other} air={onAir(booth, other)} />,
              a11y: `Deck ${deck} from above: its screen, jog wheel, CUE and PLAY. Deck ${other} is ${onAir(booth, other) ? 'on air' : 'not on air'}.`,
            }}
          />
        ),
        bezel: [
          { k: 'ON AIR', v: airA && airB ? 'A + B' : airA ? 'DECK A' : airB ? 'DECK B' : 'NOTHING', tint: airA || airB ? '#ff8a7e' : colors.textSub },
          { k: `DECK ${deck}`, v: d.track ? TRACKS[d.track].title.toUpperCase() : 'EMPTY', tint: colors.amber, flex: 1.6 },
          { k: 'STATE', v: !d.track ? '—' : d.playing ? 'PLAYING' : Math.abs(d.posSec - d.cueSec) < 0.01 ? 'AT CUE' : 'PAUSED', tint: d.playing ? colors.green : colors.textPrimary },
        ],
        params: [
          { kind: 'group', id: 'browse', label: 'BROWSE', valueLabel: `DECK ${deck}`, render: () => <BrowseTray deck={deck} setDeck={setDeck} onLoaded={onLoaded} note={loadMsg} /> },
          { kind: 'toggle', id: 'play', label: `PLAY ${deck}`, value: d.playing, onToggle: () => tr.toggle(deck) },
          {
            kind: 'action',
            id: 'cue',
            label: `CUE ${deck}`,
            onPress: () => {
              const was = getBooth().decks[deck];
              updateBooth((b, t) => cue(b, t, deck));
              if (was.track && !was.playing && Math.abs(was.posSec - was.cueSec) > 0.01) setCueSet(true);
              if (was.track && was.playing) setCueBack(true);
            },
          },
          {
            kind: 'fader',
            id: 'search',
            label: 'SEARCH',
            value: d.posSec / total,
            locked: d.track ? undefined : 'load a track first',
            onChange: (v) => {
              updateBooth((b, t) => seek(b, t, deck, v * total));
              if (!getBooth().decks[deck].playing) setSearched(true);
            },
            format: (v) => `SEARCH ${deck} · ${formatClock(v * total)} of ${formatClock(total)}`,
            formatShort: (v) => formatClock(v * total),
            // the strip searches the whole track; the JOG steps move one beat
            nudges: [
              { label: '‹ 1 s', onPress: () => (updateBooth((b, t) => seek(b, t, deck, b.decks[deck].posSec - 1)), setSearched(true)), a11y: 'Search back one second' },
              { label: '‹ JOG', onPress: () => (updateBooth((b, t) => seek(b, t, deck, b.decks[deck].posSec - beat)), setSearched(true)), a11y: 'Jog back one beat' },
              { label: 'JOG ›', onPress: () => (updateBooth((b, t) => seek(b, t, deck, b.decks[deck].posSec + beat)), setSearched(true)), a11y: 'Jog forward one beat' },
              { label: '1 s ›', onPress: () => (updateBooth((b, t) => seek(b, t, deck, b.decks[deck].posSec + 1)), setSearched(true)), a11y: 'Search forward one second' },
            ],
          },
          stopKey(tr),
        ],
        // the lane binds a FADER (BROWSE is a tray: the rack warned and bound SEARCH anyway)
        initialParam: 'search',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at deck ${deck} from above: its screen, jog wheel, CUE and PLAY.`}</Look>
        <P>A set in progress: deck A plays to the crowd (ON AIR), and you prepare the next track on the spare deck, deck B — load it, find where it should start and set a cue point — while the crowd keeps hearing deck A.</P>
        <P>The player’s transport CUE is a place in the track, not the mixer’s headphone CUE (Screen 7).</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>First put deck A on air: press PLAY A — ON AIR on the readout strip reads DECK A. Then open BROWSE, switch to operating DECK B, and LOAD a track deck A can tempo-match (read the BPM in the crate).</Do>
        <P>The camera follows the deck you operate; the marker at the glass’s corner and ON AIR on the readout strip always say which deck the crowd hears. Glance at them before you press anything.</P>
      </Step>
      <Step n={3}>
        <P>A loaded track starts at its first beat. PLAY and pause it, SEARCH a little (the strip moves through the whole track; the JOG steps move one beat), then press CUE: that is your new cue point. Press PLAY, then CUE again — the deck jumps back and stops, ready.</P>
        <Note>Deck B’s channel fader is down, so the crowd never hears it while you prepare. Screen 7 shows how you hear it privately in your headphones first.</Note>
      </Step>
      <Step n={4}>
        <Do>Put deck A on air, load the spare deck with a track that can match it, play and pause it, set a cue point, jump back to it with CUE, and search the track.</Do>
        {loadMsg ? <Note tone={loadMsg.ok ? 'try' : 'safety'}>{loadMsg.text}</Note> : null}
        <GoalChips goals={goals.slice(0, 6)} latched={latched.slice(0, 6)} />
        <Note tone="try">Before a gig: organize your files at home and let the software analyze them (it reads each track’s tempo, beats and waveform ahead of time), set cue points, build playlists (the tracks for a set, in an order that makes sense to you), export them to a USB stick — and carry a second, tested stick. A streaming service may need an internet connection and may limit what you can do, so keep a tested set of local files as your backup.</Note>
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Deck A is playing with its fader up. Deck B is paused with its fader down. Where do you load the next track?"
          options={['Deck B — the deck the crowd is not hearing', 'Deck A — it is the one already playing', 'Either — loading never changes a playing deck', 'Neither — stop deck A first']}
          correct={0}
          explain="Depending on the player, loading onto a playing deck stops it, jumps straight into the new track, or is refused by a load lock. Deck A is on air, so any of those would hit the crowd. Deck B is the spare deck: load, prepare and cue it there."
          wrong={[undefined, 'That deck is on air: the load would stop it, or jump the crowd straight into the new track.', 'Players differ — some stop, some jump into the new track, some refuse with a load lock — and on air every one of those is a problem. The habit protects the dance floor.', 'Stopping the music is exactly what you are avoiding.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE MUSIC JUST STOPPED"
          symptom="You meant to load the next track. The dance floor went silent."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              let x = cueAtBar(b, 'A', 'nightFerry', 17);
              x = { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU' }, 2: { ...x.ch[2], fader: 0, xf: 'THRU' } } };
              x = load(x, t, 'A', 'glassHarbour');
              return { ...x, decks: { ...x.decks, B: { ...x.decks.B, track: 'nightFerry', playing: false, posSec: 50, cueSec: 50 } } };
            });
            setDeck('A');
          }}
          fixed={(airA || airB) && !!audio.last && audio.last.rmsDb.crowd > -60}
          hints={['Look at ON AIR on the readout strip and at deck A’s screen: a new title, stopped at its first beat.', 'The load landed on deck A — the deck the crowd was hearing — and stopped it.', 'Get music back: PLAY deck A again (or bring up the deck that has music ready).']}
          why="The new track was loaded onto the deck that was on air, and on this player loading stops the deck (others jump straight into the new track, or refuse with a load lock). Recover first — play something the crowd can hear — then load the next track on the SPARE deck."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(6)} latched={latched.slice(6)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, borderWidth: 1, borderColor: '#26262c', padding: 8 },
  track: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14 },
  meta: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
});

export const P05: PageDef = { title: 'Load and play music', short: 'PLAY', Component: PagePlay, manualDone: true, rack: true };
