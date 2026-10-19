/**
 * Screen 12 — Cue points, loops and samples (research DJ18): transport cue
 * versus headphone cue, hot cues, loop creation and length, loop exit, beat
 * jump and sample playback with a visible deck and bus assignment. The
 * sampler lives in a player's software, so its pads come out of THAT player's
 * channel: preview them with the channel cued and its fader down. The last
 * screen of Stage 1 closes with what this lab has given you. The fault: a
 * sample fired straight into the crowd.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { WaveLane } from '../art/plots';
import { CUE_COLOURS, INK } from '../art/ink';
import { LedColumn } from '../art/parts';
import { useTapDb } from '../art/motion';
import { SceneText } from '../art/sceneText';
import { BOOTH_LAYOUT, PLAYER } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { SAMPLE_IDS, SAMPLE_NAMES, type SampleId } from '../engine/djMusic';
import { analysedGrid, beatJump, clearHotCue, hotCue, loopExit, loopIn } from '../model/djDeck';
import { LOOP_BEATS, beatAt, timeOfBeat } from '../model/djTime';
import { faderGain, xfGainFor, type Booth, type DeckId } from '../model/djModel';
import type { BoothAudio } from '../booth/useBoothAudio';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'Hot cue', def: 'A saved place in a track on its own pad. Empty pad: press to store where you are. Stored pad: press to jump there and play.' },
  { term: 'Loop', def: 'A stretch of the track that repeats, counted in beats of the grid — 1, 2, 4, 8, 16. EXIT leaves it and the track plays on from there, in time.' },
  { term: 'Beat jump', def: 'Moves the playhead forward or back by a set number of beats, in time with the grid. On this player a jump leaves a running loop; on many players a beat jump inside a loop MOVES the loop instead.' },
  { term: 'Sampler', def: 'Pads that play short sounds. Where a sampler plays out depends on the system: in some it follows a deck’s channel (as here — deck B’s fader, CUE and crossfader side); in many it goes straight to the master with its own level and headphone-cue button. Check before you fire a pad on a live system.' },
] as const;

export const GOALS_LOOPS = ['Store a hot cue', 'Jump back to it', 'Loop, then exit', 'Beat jump', 'Preview a sample privately', 'Keep the sample off the crowd', 'Pass the check'] as const;

/** What the lab covers, screen by screen — ticked only for a screen that is
 *  really done (learning review p12 #2). */
const COVERS = [
  'Work safely: low levels first, STOP within reach, speakers on last and off first.',
  'Name the gear of any DJ system and say what each piece does.',
  'Read a socket — direction, connector, signal, level, channels — and patch a stereo source without losing a side.',
  'Build a complete system and follow the music from the players to the crowd.',
  'Load, cue and play on the spare deck without stopping the dance floor.',
  'Set gain by average level with headroom, read the meters, and find the stage that clipped.',
  'Cue privately, use split cue, and set the booth without touching the crowd.',
  'Choose crossfader curves and assignments; blend and cut.',
  'Use isolators and filters to manage two bass lines.',
  'Beatmatch with your ears and the displays, tell drift from offset, and start on a phrase.',
  'Check and fix a beatgrid before trusting SYNC.',
  'Use hot cues, loops, beat jumps and samples in time.',
] as const;

const LOOK = 'You are looking at deck B’s waveform with its cue points and any loop marked, two small meters (what reaches your headphones, and what reaches the crowd), and below, deck B’s hot cue pads, loop and beat-jump keys and its transport CUE.';

/** Two small meters beside the lane: where a sampler hit LANDS — in your
 *  headphones, the crowd, or both (the render's own taps). */
function LandingMeters({ x, y, h, k }: { x: number; y: number; h: number; k: number }) {
  const ph = useTapDb('phonesL');
  const phh = useTapDb('phonesL', 'hold');
  const cr = useTapDb('crowd');
  const crh = useTapDb('crowd', 'hold');
  const fs = 9.5 * k;
  const colH = h - fs * 1.5;
  return (
    <Group>
      <LedColumn x={x + 15 * k} y={y} w={7} h={colH} level={ph} hold={phh} />
      <LedColumn x={x + 53 * k} y={y} w={7} h={colH} level={cr} hold={crh} />
      <SceneText x={x + 15 * k + 3.5} y={y + h} size={fs} text="PHONES" color={INK.amber} face="label" align="center" minPt={9} />
      <SceneText x={x + 53 * k + 3.5} y={y + h} size={fs} text="CROWD" color={INK.print} face="label" align="center" minPt={9} />
    </Group>
  );
}

/** Is this deck's channel reaching the crowd? */
function chOnAir(b: Booth, d: DeckId): boolean {
  const ch = d === 'A' ? 1 : 2;
  const c = b.ch[ch];
  return faderGain(c.fader) * xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve) > 0.01;
}

function HotCueTray({ onSet, onJump }: { onSet: () => void; onJump: () => void }) {
  const b = getBooth();
  const d = b.decks.B;
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>DECK B HOT CUES (empty = store · stored = jump and play)</Text>
      <View style={styles.row}>
        {[0, 1, 2, 3].map((i) => (
          <LabChip
            key={i}
            label={`${i + 1}${d.hotCues[i] != null ? ' ●' : ' ○'}`}
            selected={d.hotCues[i] != null}
            onPress={() => {
              const was = getBooth().decks.B.hotCues[i];
              updateBooth((x, t) => hotCue(x, t, 'B', i));
              if (was == null) onSet();
              else onJump();
            }}
          />
        ))}
        <LabChip label="CLEAR ALL" selected={false} onPress={() => updateBooth((x, t) => [0, 1, 2, 3].reduce((y, i) => clearHotCue(y, t, 'B', i), x))} compact />
      </View>
      <Text style={styles.note}>{`Pad colours: ${['red', 'amber', 'green', 'blue'].join(', ')} — the same colours mark them on the waveform.`}</Text>
      <View style={styles.row}>
        {CUE_COLOURS.map((c, i) => (
          <View key={c} style={[styles.swatch, { backgroundColor: c, opacity: d.hotCues[i] != null ? 1 : 0.3 }]} />
        ))}
      </View>
    </View>
  );
}

function LoopTray({ onLoop, onExit, onJump }: { onLoop: () => void; onExit: () => void; onJump: () => void }) {
  const d = getBooth().decks.B;
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>DECK B LOOP (starts on the beat with QUANTIZE)</Text>
      <View style={styles.row}>
        {LOOP_BEATS.map((n) => (
          <LabChip
            key={n}
            label={`${n}`}
            selected={!!d.loop && Math.abs(d.loop.lengthSec - (n * 60) / (analysedGrid(d)?.bpm ?? 126)) < 0.001}
            onPress={() => {
              updateBooth((x, t) => loopIn(x, t, 'B', n));
              onLoop();
            }}
            compact
          />
        ))}
        <LabChip
          label="EXIT"
          selected={false}
          onPress={() => {
            if (getBooth().decks.B.loop) onExit();
            updateBooth((x, t) => loopExit(x, t, 'B'));
          }}
          compact
        />
      </View>
      <Text style={styles.head}>BEAT JUMP</Text>
      <View style={styles.row}>
        {[-16, -4, 4, 16].map((n) => (
          <LabChip
            key={n}
            label={n < 0 ? `◀ ${-n}` : `${n} ▶`}
            selected={false}
            onPress={() => {
              updateBooth((x, t) => beatJump(x, t, 'B', n));
              onJump();
            }}
            compact
          />
        ))}
      </View>
    </View>
  );
}

function SamplerTray({ audio, onHit }: { audio: BoothAudio; onHit: (id: SampleId) => void }) {
  const b = getBooth();
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>{`SAMPLER (in DECK ${b.sampler.on}’s software → channel ${b.sampler.on === 'A' ? 1 : 2})`}</Text>
      <View style={styles.row}>
        {(['A', 'B'] as const).map((d) => (
          <LabChip key={d} label={`ON DECK ${d}`} selected={b.sampler.on === d} onPress={() => updateBooth((x) => ({ ...x, sampler: { ...x.sampler, on: d } }))} compact />
        ))}
      </View>
      <View style={styles.row}>
        {SAMPLE_IDS.map((s) => (
          <LabChip
            key={s}
            label={SAMPLE_NAMES[s]}
            selected={false}
            onPress={() => {
              void audio.requestSound();
              const now = boothNow();
              const at = now + audio.leadSec();
              updateBooth((x) => {
                // quantized to the host deck's next beat when it is playing
                const host = x.decks[x.sampler.on];
                const g = analysedGrid(host);
                let when = at;
                if (g && host.playing && host.quantize) {
                  const pos = host.posSec + (at - host.at) * (1 + host.pitch / 100);
                  const nb = Math.ceil(beatAt(g, pos) - 1e-6);
                  when = at + (timeOfBeat(g, nb) - pos) / (1 + host.pitch / 100);
                }
                const hits = [...x.sampler.hits.filter((h) => h.at > now - 4), { at: when, id: s }];
                return { ...x, sampler: { ...x.sampler, hits } };
              });
              onHit(s);
            }}
          />
        ))}
      </View>
      <Text style={styles.note}>In this booth the pads play out of their deck’s channel: with that channel CUED and its fader DOWN, only you hear them. Other systems send the sampler straight to the master — check before you fire a pad.</Text>
    </View>
  );
}

function PageLoops({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 1);
    x = { ...x, decks: { A: x.decks.A, B: { ...x.decks.B, hotCues: [null, null, null, null], gridMode: 'TRUE', gridShiftBeats: 0, bpmFix: 1, quantize: true, pitch: 0 } } };
    return { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, xf: 'THRU', cue: true } }, mixer: { ...x.mixer, splitCue: false, cueMix: 0.5 }, sampler: { on: 'B', hits: [] }, perspective: 'PHONES' };
  });
  const s = useRef({ set: false, jumped: false, looped: false, exited: false, beatJumped: false, preview: false });
  // a sampler hit flashes its host deck's pads (from when it sounds)
  const [flash, setFlash] = useState<{ deck: DeckId; n: number } | null>(null);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 420);
    return () => clearTimeout(id);
  }, [flash]);
  const [, force] = useState(0);
  const bump = () => force((n) => n + 1);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const [faultOn, setFaultOn] = useState(false);
  const B = booth.decks.B;
  const onHit = () => {
    const b = getBooth();
    const host = b.sampler.on;
    setFlash({ deck: host, n: Date.now() });
    const ch = host === 'A' ? 1 : 2;
    if (!chOnAir(b, host) && b.ch[ch].cue) s.current.preview = true;
    if (faultOn && !chOnAir(b, host) && b.ch[ch].cue) setFaultFixed(true);
    bump();
  };
  const hits = [s.current.set, s.current.jumped, s.current.looped && s.current.exited, s.current.beatJumped, s.current.preview, faultFixed, check];
  const goals = GOALS_LOOPS.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'LOOPS');
  const lanesH = (h: number, k = 1) => Math.round(Math.min(104 * k, h * 0.34));
  const g = analysedGrid(B);
  const loopBeats = B.loop && g ? Math.round((B.loop.lengthSec * g.bpm) / 60) : 0;
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
              // the working half of deck B (pads, loop and jump keys, jog,
              // transport CUE) — its own screen is drawn large above as the lane
              view: { x: BOOTH_LAYOUT.B.x - 66, y: 110, w: 392, h: 284 },
              fit: (W, H, k) => ({ x: 0, y: lanesH(H, k), w: W, h: H - lanesH(H, k) }),
              highlight: { B: ['hotCues', 'loop', 'jump', 'cue'] },
              padFlash: flash ? { [flash.deck]: true } : undefined,
              callouts: [
                { id: 'hc', text: 'HOT CUES', at: { x: BOOTH_LAYOUT.B.x + PLAYER.hotCues.xs[3] + PLAYER.hotCues.w, y: PLAYER.hotCues.y + 9 }, dx: 16, dy: -12 },
                { id: 'lp', text: 'LOOP', at: { x: BOOTH_LAYOUT.B.x + PLAYER.loop.x, y: PLAYER.loop.y + 20 }, dx: -16, dy: 0 },
                { id: 'bj', text: 'JUMP', at: { x: BOOTH_LAYOUT.B.x + PLAYER.jump.x, y: PLAYER.jump.y + 12 }, dx: -16, dy: 0 },
                { id: 'tc', text: 'TRANSPORT CUE', at: { x: BOOTH_LAYOUT.B.x + PLAYER.cue.cx + 18, y: PLAYER.cue.cy }, dx: 24, dy: 0 },
              ],
              screenOverlay: (W, H, _xf, k) => {
                const kk = Math.sqrt(k);
                const mw = 76 * kk;
                return (
                  <Group>
                    <WaveLane b={{ x: 6, y: 4, w: W - 18 - mw, h: lanesH(H, k) - 10 }} d={B} marks spanSec={6} k={kk} label={`DECK B${loopBeats ? ` · LOOP ${loopBeats} BEATS` : ''}`} />
                    <LandingMeters x={W - 6 - mw} y={6} h={lanesH(H, k) - 14} k={kk} />
                  </Group>
                );
              },
              a11y: `${LOOK} ${loopBeats ? `A ${loopBeats}-beat loop is running.` : 'No loop.'}`,
            }}
          />
        ),
        bezel: [
          { k: 'HOT CUES', v: `${B.hotCues.filter((c) => c != null).length} / 4`, tint: colors.amber },
          { k: 'LOOP', v: loopBeats ? `${loopBeats} BEATS` : 'OFF', tint: loopBeats ? colors.green : colors.textSub },
          { k: 'SAMPLER →', v: `DECK ${booth.sampler.on} · ${chOnAir(booth, booth.sampler.on) ? 'ON AIR' : 'PRIVATE'}`, tint: chOnAir(booth, booth.sampler.on) ? '#ff8a7e' : colors.green, flex: 1.5 },
        ],
        params: [
          {
            kind: 'group',
            id: 'hot',
            label: 'HOT CUE',
            valueLabel: `${B.hotCues.filter((c) => c != null).length}/4`,
            render: () => (
              <HotCueTray
                onSet={() => {
                  s.current.set = true;
                  bump();
                }}
                onJump={() => {
                  s.current.jumped = true;
                  void audio.requestSound();
                  bump();
                }}
              />
            ),
          },
          {
            kind: 'group',
            id: 'loop',
            label: 'LOOP',
            valueLabel: loopBeats ? `${loopBeats}` : 'OFF',
            render: () => (
              <LoopTray
                onLoop={() => {
                  s.current.looped = true;
                  bump();
                }}
                onExit={() => {
                  s.current.exited = true;
                  bump();
                }}
                onJump={() => {
                  s.current.beatJumped = true;
                  bump();
                }}
              />
            ),
          },
          { kind: 'group', id: 'sampler', label: 'SAMPLER', valueLabel: `ON ${booth.sampler.on}`, render: () => <SamplerTray audio={audio} onHit={onHit} /> },
          boothKey(booth, tr),
          stopKey(tr),
        ],
        initialParam: 'hot',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>HOT CUES are saved places on pads, LOOPS repeat a few beats of the grid, and BEAT JUMP moves in time by a set number of beats.</P>
        <P>In this booth the SAMPLER lives in deck B’s software, so its sounds come out of channel 2 and obey its fader, CUE and crossfader side; and the player’s transport CUE (a place in the track) is not the mixer’s CUE (your headphones).</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play deck B (it is cued in your headphones, fader down). Store a hot cue on pad 1, let it play on, then press pad 1 again to jump back.</Do>
        <P>Pads and loops land on the beat because QUANTIZE is on for deck B — your press can be a little early or late.</P>
      </Step>
      <Step n={3}>
        <P>Open LOOP and press 4: four beats repeat, marked green on the waveform. Exit and the track carries on in time. Try a beat jump of 16 beats — four bars — forward and back.</P>
        <P>Open SAMPLER and fire a pad: you hear it in your headphones, the crowd does not — channel 2 is cued and its fader is down. Watch the two small meters by the waveform: PHONES moves, CROWD does not.</P>
      </Step>
      <Step n={4}>
        <Do>Store a hot cue and jump to it, run a loop and exit it, beat jump, and preview a sample privately.</Do>
        <P>A loop of 8 or 16 beats is a common way to stretch an intro while you finish a blend — one idea among many. Experimentation is encouraged.</P>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
        <Note tone="try">Try it: stretch an intro. Run an 8-beat loop on deck B and exit it so B’s next bar 1 lands on the start of one of deck A’s phrases (Screen 10’s A PHRASE count helps).</Note>
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You press the CUE button on the player while the track is playing. What happens?"
          options={['The deck jumps back to its cue point and stops', 'The track goes into your headphones', 'A hot cue is stored', 'The loop exits']}
          correct={0}
          explain="That is the TRANSPORT cue: playing, it returns to the cue point and pauses. Sending a channel to your headphones is the MIXER’s CUE button."
          wrong={[undefined, 'That is the mixer’s headphone CUE, on the channel strip.', 'Hot cues live on the numbered pads.', 'Loops exit with the loop EXIT key.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE SAMPLE HIT THE DANCE FLOOR"
          symptom="You meant to preview a sound in your headphones, but the whole room heard it."
          start={() => {
            setFaultOn(true);
            void audio.requestSound();
            updateBooth((x, t) => ({ ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } }, sampler: { on: 'A', hits: [{ at: boothNow() + audio.leadSec(), id: 'chordHit' }] }, perspective: 'CROWD' }));
          }}
          fixed={faultFixed}
          hints={['Which deck hosts the sampler? Look at SAMPLER → on the readout strip.', 'The sampler was on deck A — the deck the crowd is hearing.', 'Open SAMPLER, put it on deck B (cued, fader down) and fire a pad there.']}
          why="In this booth the sampler plays out of its host deck’s channel. On deck A — the deck on air — every pad went straight to the PA. On deck B, cued with its fader down, you hear it first and bring it in when you choose. On a system whose sampler goes straight to the master, use its own headphone-cue button and level instead."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(5)} latched={latched.slice(5)} />
      </Step>
      <View style={styles.summary}>
        <Text style={styles.sumHead}>WHAT THIS LAB COVERS</Text>
        <Text style={styles.sumFoot}>✓ marks a screen you have done; • one still to do.</Text>
        {COVERS.map((t, i) => {
          const done = i === 11 ? ctx.isDone || !!ctx.isPageDone?.(i) : !!ctx.isPageDone?.(i);
          return (
            <Text key={t} style={[styles.sumItem, done && { color: colors.textPrimary }]} accessibilityLabel={`Screen ${i + 1}: ${t} ${done ? 'Done.' : 'Not done yet.'}`}>
              {`${done ? '✓' : '•'}  ${t}`}
            </Text>
          );
        })}
        <Text style={styles.sumFoot}>FINISH › shows what is left in this lab, screen by screen. Every screen can be done again for practice — credit you have earned stays.</Text>
      </View>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  swatch: { width: 22, height: 10, borderRadius: 3 },
  summary: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(91,255,133,0.4)', backgroundColor: '#0d1a12', padding: 12, gap: 6 },
  sumHead: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4 },
  sumItem: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  sumFoot: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, marginTop: 4 },
});

export const P12: PageDef = { title: 'Cue points, loops and samples', short: 'LOOPS', Component: PageLoops, manualDone: true, rack: true };
