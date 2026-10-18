/**
 * Screen 5 — Load and play music (research DJ08 + DJ10): track selection,
 * loading, play/pause, the transport CUE, the jog (search), identifying the
 * active deck, playlists and preparing media. The camera follows the deck you
 * are operating; the bezel says which deck the crowd is hearing. The fault: a
 * new track loaded onto the deck that was on air.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { faderGain, xfGainFor, type Booth, type DeckId } from '../model/djModel';
import { formatClock } from '../model/djTime';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'Load', def: 'Put a track onto a deck. On most players loading stops whatever that deck was playing — so you only load onto a deck the crowd is not hearing.' },
  { term: 'Transport CUE', def: 'The player’s CUE button: a place in the track you come back to. Paused, it sets the point; playing, it jumps back there and stops. Not the same as the mixer’s headphone CUE.' },
  { term: 'On air', def: 'A deck the audience is hearing right now: playing, with its channel fader up and the crossfader letting it through.' },
  { term: 'Jog wheel', def: 'Turn it while paused to search, finely; touch it while playing to push or hold the track a little (a nudge).' },
  { term: 'Playlist', def: 'Tracks you have gathered for a set, in an order that makes sense to you — prepared before the gig, not during it.' },
  { term: 'Analysis', def: 'DJ software or a player reads each track ahead of time for its tempo, its beats and its waveform. Analyse at home, not in the booth.' },
] as const;

/** Is this deck reaching the crowd? */
export function onAir(b: Booth, d: DeckId): boolean {
  const ch = d === 'A' ? 1 : 2;
  const c = b.ch[ch];
  return b.decks[d].playing && faderGain(c.fader) * xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve) > 0.01;
}

function BrowseTray({ deck, setDeck, onLoaded }: { deck: DeckId; setDeck: (d: DeckId) => void; onLoaded: (d: DeckId, t: TrackId) => void }) {
  const b = getBooth();
  return (
    <View style={styles.tray}>
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
                updateBooth((x, tt) => load(x, tt, deck, t));
                onLoaded(deck, t);
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
  useScreenSetup((b) => {
    const x = cueAtBar(b, 'A', 'nightFerry', 17);
    return { ...x, decks: { ...x.decks, B: { ...x.decks.B, track: null, playing: false } }, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU' }, 2: { ...x.ch[2], fader: 0, xf: 'THRU' } }, perspective: 'CROWD' };
  });
  const [deck, setDeck] = useState<DeckId>('B');
  const [loadedFree, setLoadedFree] = useState(false);
  const [playedB, setPlayedB] = useState(false);
  const [cueSet, setCueSet] = useState(false);
  const [cueBack, setCueBack] = useState(false);
  const [searched, setSearched] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const d = booth.decks[deck];
  const onLoaded = (dk: DeckId, _t: TrackId) => {
    const b = getBooth();
    const other: DeckId = dk === 'A' ? 'B' : 'A';
    if (onAir(b, other) || !onAir(b, dk)) setLoadedFree(true);
  };
  if (booth.decks.B.playing && booth.decks.B.track && !playedB) setPlayedB(true);
  const goals = [
    { label: 'Load a track on the free deck', hit: loadedFree },
    { label: 'Play and pause it', hit: playedB && !booth.decks.B.playing },
    { label: 'Set a cue point', hit: cueSet },
    { label: 'Jump back with CUE', hit: cueBack },
    { label: 'Search with the jog', hit: searched },
    { label: 'Recover the stopped music', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const total = d.track ? trackSeconds(d.track) - 1 : 1;
  const airA = onAir(booth, 'A');
  const airB = onAir(booth, 'B');
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
                { id: 'op', text: `OPERATING DECK ${deck}`, at: { x: BOOTH_LAYOUT[deck].x + 160, y: 0 }, dx: 0, dy: -4, tone: onAir(booth, deck) ? 'red' : 'green' },
                { id: 'pl', text: 'PLAY', at: { x: BOOTH_LAYOUT[deck].x + PLAYER.play.cx + 18, y: PLAYER.play.cy }, dx: 26, dy: 4 },
                { id: 'cu', text: 'CUE', at: { x: BOOTH_LAYOUT[deck].x + PLAYER.cue.cx + 18, y: PLAYER.cue.cy }, dx: 26, dy: -4 },
              ],
              a11y: `Deck ${deck} from above: its screen, jog wheel, CUE and PLAY.`,
            }}
          />
        ),
        bezel: [
          { k: 'ON AIR', v: airA && airB ? 'A + B' : airA ? 'DECK A' : airB ? 'DECK B' : 'NOTHING', tint: airA || airB ? '#ff8a7e' : colors.textSub },
          { k: `DECK ${deck}`, v: d.track ? TRACKS[d.track].title.toUpperCase() : 'EMPTY', tint: colors.amber, flex: 1.6 },
          { k: 'STATE', v: !d.track ? '—' : d.playing ? 'PLAYING' : Math.abs(d.posSec - d.cueSec) < 0.01 ? 'AT CUE' : 'PAUSED', tint: d.playing ? colors.green : colors.textPrimary },
        ],
        params: [
          { kind: 'group', id: 'browse', label: 'BROWSE', valueLabel: `DECK ${deck}`, render: () => <BrowseTray deck={deck} setDeck={setDeck} onLoaded={onLoaded} /> },
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
            label: `JOG ${deck}`,
            value: d.posSec / total,
            locked: d.track ? undefined : 'load a track first',
            onChange: (v) => {
              updateBooth((b, t) => seek(b, t, deck, v * total));
              if (!getBooth().decks[deck].playing) setSearched(true);
            },
            format: (v) => `JOG ${deck} · ${formatClock(v * total)} of ${formatClock(total)}`,
            formatShort: (v) => formatClock(v * total),
            nudges: [
              { label: '‹ 1 s', onPress: () => updateBooth((b, t) => seek(b, t, deck, b.decks[deck].posSec - 1)), a11y: 'Search back one second' },
              { label: '1 s ›', onPress: () => updateBooth((b, t) => seek(b, t, deck, b.decks[deck].posSec + 1)), a11y: 'Search forward one second' },
            ],
          },
          stopKey(tr),
        ],
        initialParam: 'browse',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at deck ${deck} from above: its screen, jog wheel, CUE and PLAY.`}</Look>
        <P>Picture a set in progress: deck A plays to the crowd — it is ON AIR (start it from BROWSE → DECK A → PLAY A if you want to hear it). Deck B is free. You prepare the next track on the free deck: load it, find where it should start, and set a cue point there, all while the crowd keeps hearing deck A.</P>
        <P>The transport CUE on a player is a place in the track. It is not the mixer’s headphone CUE (Screen 7) — same word, different job.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open BROWSE, make sure you are operating DECK B, and LOAD a track. Then PLAY and pause it, and use JOG to search.</Do>
        <P>The camera follows the deck you are operating; the readout strip always says which deck is ON AIR. Glance at that before you press anything.</P>
      </Step>
      <Step n={3}>
        <P>A loaded track starts at its first beat. Pause, search a little with JOG, then press CUE: that is your new cue point. Press PLAY, then CUE again — the deck jumps back and stops, ready.</P>
        <Note>Deck B’s channel fader is down, so the crowd never hears it while you prepare. Screen 7 shows how you hear it privately in your headphones first.</Note>
      </Step>
      <Step n={4}>
        <Do>Load the free deck, play and pause it, set a cue point, jump back to it with CUE, and search with the jog.</Do>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
        <Note tone="try">Before a gig: organise and analyse your files at home, set cue points, build playlists, export them to a USB stick — and carry a second, tested stick. A streaming service may need an internet connection and may limit what you can do, so keep a tested set of local files as your backup.</Note>
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Deck A is playing with its fader up. Deck B is paused with its fader down. Where do you load the next track?"
          options={['Deck B — the deck the crowd is not hearing', 'Deck A — it is the one already playing', 'Either — loading never stops a deck', 'Neither — stop deck A first']}
          correct={0}
          explain="Loading usually stops the deck it lands on. Deck A is on air, so loading there would stop the crowd’s music. Deck B is free: load, prepare and cue it there."
          wrong={[undefined, 'That stops the crowd’s music mid-track.', 'On most players a load stops the deck. Some have a lock, but the habit is what protects the dance floor.', 'Stopping the music is exactly what you are avoiding.']}
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
          hints={['Which deck was on air before the load? Look at the faders.', 'The load landed on deck A — the deck the crowd was hearing — and stopped it.', 'Get music back: PLAY deck A again (or bring up the deck that has music ready).']}
          why="The new track was loaded onto the deck that was on air, and loading stopped it. Recover first (play something the crowd can hear), then load the next track on the FREE deck."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(5)} latched={latched.slice(5)} />
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
