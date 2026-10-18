/**
 * Screen 2 — Meet the DJ equipment (research DJ01 + DJ02): turntables, media
 * players, controllers, mixers, interfaces, headphones and speakers; vinyl,
 * laptop, standalone and modular systems compared. Each piece is drawn as
 * the real object with its main parts named on it; each system shows what it
 * is made of and the one question it raises.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { MixerTop } from '../art/MixerTop';
import { PlayerTop } from '../art/PlayerTop';
import { TurntableTop } from '../art/TurntableTop';
import { CTRL_D, CTRL_W, ControllerTop, Headphones, IFACE_D, IFACE_W, InterfaceTop, LAPTOP_H, LAPTOP_W, Laptop, PHONES_H, PHONES_W, PowerSpeaker, SPEAKER_H, SPEAKER_REAR, SPEAKER_REAR_H, SPEAKER_REAR_W, SPEAKER_W, SpeakerRear } from '../art/gear';
import { Cable } from '../art/parts';
import { MIXER, MIXER_D, MIXER_W, PLAYER, PLAYER_D, PLAYER_W, STRIP_X, TT, TT_D, TT_W, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey } from '../dock';
import { useScreenSetup } from '../booth/setup';
import { builtBooth, freshDeck, type Booth } from '../model/djModel';
import { useBoothKit } from './shared';

type Item = 'turntable' | 'player' | 'mixer' | 'controller' | 'standalone' | 'interface' | 'headphones' | 'speaker';
type System = 'vinyl' | 'laptop' | 'standalone' | 'modular';

const ITEMS: { id: Item; label: string; blurb: string }[] = [
  { id: 'turntable', label: 'TURNTABLE', blurb: 'Plays vinyl records. A motor turns the platter at 33⅓ or 45 rpm; the stylus reads the groove; its signal is phono level unless it has a built-in preamp.' },
  { id: 'player', label: 'MEDIA PLAYER', blurb: 'Plays digital files from a USB stick or SD card (or a linked computer). Jog wheel, tempo fader, cue, loops — its AUDIO OUT is line level.' },
  { id: 'mixer', label: 'MIXER', blurb: 'Takes two or more sources, sets their gain, tone and level, blends them, and feeds the PA, the booth and your headphones.' },
  { id: 'controller', label: 'CONTROLLER + LAPTOP', blurb: 'A control surface for DJ software. The music plays in the laptop; this one also has a built-in audio interface that makes the outputs.' },
  { id: 'standalone', label: 'STANDALONE SYSTEM', blurb: 'Players and a mixer in one unit with its own screen and media slots: it plays with no laptop at all (and some can also act as a controller).' },
  { id: 'interface', label: 'AUDIO INTERFACE', blurb: 'Turns a computer’s digital audio into analog outputs (and inputs). Some controllers and mixers have one built in.' },
  { id: 'headphones', label: 'HEADPHONES', blurb: 'Closed-back so you can hear the next track over a loud room. One 6.35 mm stereo plug carries both ears.' },
  { id: 'speaker', label: 'POWERED SPEAKER', blurb: 'A speaker with its amplifier built in: line-level input, its own level control and its own mains power.' },
];
const SYSTEMS: { id: System; label: string; blurb: string }[] = [
  { id: 'vinyl', label: 'VINYL', blurb: 'Two turntables and a mixer. The question: is the cartridge getting the right gain and the RIAA curve (a PHONO input)?' },
  { id: 'laptop', label: 'LAPTOP + CONTROLLER', blurb: 'Software plays the music; the controller sends control data over USB and its interface makes the audio. The question: where is the audio made, and which device has the outputs?' },
  { id: 'standalone', label: 'STANDALONE', blurb: 'Everything in one unit, music from USB or SD. The question: which functions still work with no laptop and no internet?' },
  { id: 'modular', label: 'MODULAR PLAYERS', blurb: 'Separate players into a separate mixer — the club layout this lab’s booth uses. The question: which cables carry the audio, and which only link the players?' },
];

const TERMS = [
  { term: 'Controller', def: 'A control surface: knobs, faders and jogs that send control data (often MIDI or HID over USB) to software. Whether it also makes audio depends on the model.' },
  { term: 'Audio interface', def: 'The part that turns digital audio into the analog outputs you plug into a mixer or speakers (and back). It can be its own box or built in.' },
  { term: 'Standalone', def: 'Plays music without a computer, from its own media slots or storage.' },
  { term: 'Booth monitor', def: 'A speaker aimed at the DJ, fed from the mixer’s BOOTH output, so you can hear the mix without the PA blasting the booth.' },
] as const;

/** Where the DJ software sends its audio (the laptop + controller fault). */
type SoftwareOut = 'CONTROLLER' | 'LAPTOP';
const SOFTWARE_OUTS: { id: SoftwareOut; label: string; blurb: string }[] = [
  { id: 'CONTROLLER', label: 'CONTROLLER OUTPUTS', blurb: 'The controller’s built-in audio interface: its MASTER OUT feeds the speakers and its PHONES jack feeds your headphones.' },
  { id: 'LAPTOP', label: 'LAPTOP’S OWN AUDIO', blurb: 'The computer’s built-in speakers or headphone jack. The controller’s outputs stay silent.' },
];

const lab = (id: string, text: string, x: number, y: number, dx: number, dy: number): Callout => ({ id, text, at: { x, y }, dx, dy });

function useItemScene(item: Item, booth: Booth): { frame: Box; body: ReactNode; callouts: Callout[]; a11y: string } {
  const still = useMemo(() => freshDeck('nightFerry'), []);
  return useMemo(() => {
    switch (item) {
      case 'turntable':
        return {
          frame: { x: -14, y: -16, w: TT_W + 28, h: TT_D + 32 },
          body: <TurntableTop x={0} y={0} d={still} playing={false} />,
          callouts: [lab('pl', 'PLATTER', TT.platter.cx - 150, TT.platter.cy + 70, 6, 40), lab('rec', 'RECORD', TT.platter.cx - 70, TT.platter.cy - 90, -24, -22), lab('arm', 'TONEARM', 352, 150, 30, -10), lab('hs', 'HEADSHELL', TT.armRest.x - 6, TT.armRest.y + 4, -30, 34), lab('cw', 'COUNTERWEIGHT', TT.counterweight.x, TT.counterweight.y - 12, -20, -18), lab('ss', 'START/STOP', TT.startStop.x + 20, TT.startStop.y + 30, 8, 18), lab('pt', 'PITCH', TT.pitch.x, TT.pitch.top + TT.pitch.len, -10, 34)],
          a11y: 'A DJ turntable from above: the platter and record, the tonearm with its headshell and counterweight, start/stop and the pitch fader.',
        };
      case 'player':
        return {
          frame: { x: -12, y: -14, w: PLAYER_W + 24, h: PLAYER_D + 28 },
          body: <PlayerTop x={0} y={0} deck="A" d={booth.decks.A} />,
          callouts: [lab('sc', 'SCREEN', PLAYER.screen.x + 10, PLAYER.screen.y + 20, -40, -18), lab('jg', 'JOG WHEEL', PLAYER.jog.cx + 70, PLAYER.jog.cy + 70, 20, 30), lab('hc', 'HOT CUES', PLAYER.hotCues.xs[3] + 40, PLAYER.hotCues.y + 9, 22, -8), lab('cue', 'CUE', PLAYER.cue.cx - 14, PLAYER.cue.cy, -24, -10), lab('pl', 'PLAY', PLAYER.play.cx - 14, PLAYER.play.cy, -24, 10), lab('tp', 'TEMPO', PLAYER.tempo.x + 8, PLAYER.tempo.top + 90, 18, 30), lab('usb', 'USB / SD', PLAYER.slots.usb.x + 13, PLAYER.slots.usb.y, 4, -18)],
          a11y: 'A media player from above: its screen, the jog wheel, hot cue pads, CUE and PLAY, and the tempo fader.',
        };
      case 'mixer':
        return {
          frame: { x: -12, y: -14, w: MIXER_W + 24, h: MIXER_D + 26 },
          body: <MixerTop x={0} y={0} booth={booth} />,
          callouts: [lab('tr', 'TRIM', STRIP_X[1] - 9, MIXER.trim.y, -34, -8), lab('eq', 'EQ', STRIP_X[1] - 10, MIXER.mid.y, -36, 0), lab('fl', 'FILTER', STRIP_X[1] - 10, MIXER.filter.y, -38, 6), lab('fd', 'CH FADER', STRIP_X[1] - 8, MIXER.fader.top + 30, -46, 10), lab('xf', 'CROSSFADER', MIXER.xfader.left + 23, MIXER.xfader.y + 8, 0, 26), lab('mt', 'METERS', 135, MIXER.meters.y + 12, 74, -20), lab('ms', 'MASTER · BOOTH', MIXER.booth.x + 10, MIXER.booth.y, 30, 4), lab('ph', 'PHONES', MIXER.phones.x + 9, MIXER.phones.y, 30, 16)],
          a11y: 'A two-channel DJ mixer from above: trims, EQ, filters, channel faders, the crossfader, the meters, master, booth and headphone controls.',
        };
      case 'controller':
      case 'standalone': {
        const sa = item === 'standalone';
        return {
          frame: sa ? { x: -14, y: -16, w: CTRL_W + 28, h: CTRL_D + 32 } : { x: -14, y: -16, w: CTRL_W + 28, h: CTRL_D + LAPTOP_H + 50 },
          body: sa ? (
            <ControllerTop x={0} y={0} standalone />
          ) : (
            <>
              <Laptop x={(CTRL_W - LAPTOP_W) / 2} y={0} />
              <Cable pts={[[CTRL_W / 2 + 40, LAPTOP_H - 2], [CTRL_W / 2 + 40, LAPTOP_H + 22], [CTRL_W / 2 + 10, LAPTOP_H + 30]]} style={{ colour: '#8e939b', width: 3, dash: [4, 3] }} />
              <ControllerTop x={0} y={LAPTOP_H + 30} />
            </>
          ),
          callouts: sa
            ? [lab('sc', 'BUILT-IN SCREEN', CTRL_W / 2, 20, 0, -16), lab('jg', 'JOG', 122, 194, -10, 100), lab('mx', 'MIXER SECTION', CTRL_W / 2, 200, 0, 92), lab('sl', 'MEDIA SLOT', 409, 18, 30, -12)]
            : [lab('lp', 'LAPTOP: THE SOFTWARE PLAYS', CTRL_W / 2, 40, 0, -20), lab('usb', 'USB: CONTROL + AUDIO', CTRL_W / 2 + 40, LAPTOP_H + 14, 54, 0), lab('jg', 'JOG', 122, LAPTOP_H + 30 + 194, -10, 90), lab('mx', 'MIXER SECTION', CTRL_W / 2, LAPTOP_H + 30 + 220, 0, 80)],
          a11y: sa ? 'A standalone DJ system: two decks and a mixer in one unit with its own screen and media slot.' : 'A laptop running DJ software connected by USB to a two-deck controller.',
        };
      }
      case 'interface':
        return {
          frame: { x: -20, y: -20, w: LAPTOP_W + 40, h: LAPTOP_H + IFACE_D + 90 },
          body: (
            <>
              <Laptop x={0} y={0} />
              <Cable pts={[[LAPTOP_W - 30, LAPTOP_H - 4], [LAPTOP_W - 30, LAPTOP_H + 30], [IFACE_W + 100, LAPTOP_H + 60]]} style={{ colour: '#8e939b', width: 3, dash: [4, 3] }} />
              <InterfaceTop x={(LAPTOP_W - IFACE_W) / 2} y={LAPTOP_H + 50} />
            </>
          ),
          callouts: [lab('if', 'AUDIO INTERFACE', LAPTOP_W / 2, LAPTOP_H + 50 + IFACE_D, 0, 16), lab('usb', 'USB (DATA)', LAPTOP_W - 30, LAPTOP_H + 24, 22, 0), lab('lp', 'COMPUTER', LAPTOP_W / 2, 40, 0, -20)],
          a11y: 'A laptop connected by USB to a small audio interface.',
        };
      case 'headphones':
        return {
          frame: { x: -20, y: -16, w: PHONES_W + 40, h: PHONES_H + 46 },
          body: <Headphones x={0} y={0} />,
          callouts: [lab('l', 'LEFT CUP', 20, 120, -10, 0), lab('r', 'RIGHT CUP', 170, 120, 10, 0), lab('c', 'COILED CABLE', 64, 200, -20, 10), lab('p', '6.35 mm STEREO (TRS) PLUG', 84, 262, 0, 14)],
          a11y: 'Closed-back DJ headphones from the front, with a coiled cable and a 6.35 millimetre stereo plug.',
        };
      case 'speaker':
        return {
          frame: { x: -14, y: -16, w: SPEAKER_W + SPEAKER_REAR_W + 52, h: SPEAKER_H + 32 },
          body: (
            <>
              <PowerSpeaker x={0} y={0} on={false} />
              <SpeakerRear x={SPEAKER_W + 24} y={(SPEAKER_H - SPEAKER_REAR_H) / 2} on={false} />
            </>
          ),
          callouts: [lab('hn', 'HORN (HIGHS)', SPEAKER_W / 2, 100, 0, -24), lab('wf', 'WOOFER (LOWS)', SPEAKER_W / 2, 390, 0, 30), lab('in', 'INPUT (XLR/TRS)', SPEAKER_W + 24 + SPEAKER_REAR.input.x, (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.input.y - 16, 0, -26), lab('lv', 'LEVEL', SPEAKER_W + 24 + SPEAKER_REAR.level.x + 14, (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.level.y, 30, 0), lab('ac', 'POWER IN', SPEAKER_W + 24 + SPEAKER_REAR.ac.x, (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.ac.y + 14, 0, 26)],
          a11y: 'A powered PA speaker: the front with its grille, horn and woofer, and its rear amplifier panel with the input, level knob and power inlet.',
        };
    }
  }, [item, booth, still]);
}

function useSystemScene(sys: System, booth: Booth, swOut: SoftwareOut): { frame: Box; body: ReactNode; callouts: Callout[]; a11y: string } {
  const still = useMemo(() => freshDeck('nightFerry'), []);
  return useMemo(() => {
    switch (sys) {
      case 'vinyl': {
        const s = 0.62;
        const tw = TT_W * s;
        return {
          frame: { x: -12, y: -20, w: tw * 2 + MIXER_W * s + 56, h: Math.max(TT_D, MIXER_D) * s + 40 },
          body: (
            <>
              <Scaled s={s} x={0} y={20}><TurntableTop x={0} y={0} d={still} playing={false} /></Scaled>
              <Scaled s={s} x={tw + 16} y={0}><MixerTop x={0} y={0} booth={booth} /></Scaled>
              <Scaled s={s} x={tw + 32 + MIXER_W * s} y={20}><TurntableTop x={0} y={0} d={still} playing={false} /></Scaled>
            </>
          ),
          callouts: [lab('a', 'TURNTABLE', tw / 2, 20, 0, -14), lab('m', 'MIXER (PHONO INPUTS)', tw + 16 + (MIXER_W * s) / 2, 0, 0, -14), lab('b', 'TURNTABLE', tw * 1.5 + 32 + MIXER_W * s, 20, 0, -14)],
          a11y: 'A vinyl system: two turntables either side of a mixer.',
        };
      }
      case 'laptop':
        return {
          frame: { x: -14, y: -20, w: CTRL_W + 28, h: CTRL_D + LAPTOP_H + 56 },
          body: (
            <>
              <Laptop x={(CTRL_W - LAPTOP_W) / 2} y={0} />
              <Cable pts={[[CTRL_W / 2 + 40, LAPTOP_H - 2], [CTRL_W / 2 + 40, LAPTOP_H + 22], [CTRL_W / 2 + 10, LAPTOP_H + 30]]} style={{ colour: '#8e939b', width: 3, dash: [4, 3] }} />
              <ControllerTop x={0} y={LAPTOP_H + 30} />
            </>
          ),
          callouts:
            swOut === 'CONTROLLER'
              ? [lab('lp', 'MUSIC PLAYS HERE', CTRL_W / 2, 40, 0, -18), lab('c', 'BUILT-IN INTERFACE: OUTPUTS', CTRL_W / 2, LAPTOP_H + 30 + CTRL_D, 0, 16)]
              : [
                  { ...lab('lp', 'AUDIO → LAPTOP SPEAKERS', CTRL_W / 2, 40, 0, -18), tone: 'red' },
                  { ...lab('c', 'CONTROLLER OUTPUTS: SILENT', CTRL_W / 2, LAPTOP_H + 30 + CTRL_D, 0, 16), tone: 'red' },
                ],
          a11y: `A laptop and controller system. The software sends its audio to ${swOut === 'CONTROLLER' ? 'the controller’s outputs' : 'the laptop’s own speakers, so the controller’s outputs are silent'}.`,
        };
      case 'standalone':
        return {
          frame: { x: -14, y: -20, w: CTRL_W + 28, h: CTRL_D + 46 },
          body: <ControllerTop x={0} y={0} standalone />,
          callouts: [lab('s', 'NO LAPTOP: MUSIC FROM USB / SD', CTRL_W / 2, 0, 0, -14)],
          a11y: 'A standalone system.',
        };
      case 'modular': {
        const s = 0.5;
        return {
          frame: { x: -12, y: -22, w: (PLAYER_W * 2 + MIXER_W) * s + 40, h: PLAYER_D * s + 44 },
          body: (
            <>
              <Scaled s={s} x={0} y={0}><PlayerTop x={0} y={0} deck="A" d={booth.decks.A} /></Scaled>
              <Scaled s={s} x={PLAYER_W * s + 8} y={5}><MixerTop x={0} y={0} booth={booth} /></Scaled>
              <Scaled s={s} x={(PLAYER_W + MIXER_W) * s + 16} y={0}><PlayerTop x={0} y={0} deck="B" d={booth.decks.B} /></Scaled>
            </>
          ),
          callouts: [lab('a', 'PLAYER', (PLAYER_W * s) / 2, 0, 0, -14), lab('m', 'MIXER', PLAYER_W * s + 8 + (MIXER_W * s) / 2, 5, 0, -14), lab('b', 'PLAYER', (PLAYER_W * 1.5 + MIXER_W) * s + 16, 0, 0, -14)],
          a11y: 'A modular system: two media players either side of a separate mixer.',
        };
      }
    }
  }, [sys, booth, still, swOut]);
}

function Scaled({ s, x, y, children }: { s: number; x: number; y: number; children: ReactNode }) {
  return <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>{children}</Group>;
}

function PageGear({ ctx }: { ctx: PageCtx }) {
  const { booth, tr, motion } = useBoothKit();
  useScreenSetup((b) => b, false);
  const [mode, setMode] = useState<'item' | 'system'>('item');
  const [item, setItem] = useState<Item>('player');
  const [sys, setSys] = useState<System>('modular');
  const [seenI, setSeenI] = useState<Set<Item>>(() => new Set(['player']));
  const [seenS, setSeenS] = useState<Set<System>>(() => new Set());
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [swOut, setSwOut] = useState<SoftwareOut>('CONTROLLER');
  const [faultFixed, setFaultFixed] = useState(false);
  const display = booth.decks.A.track ? booth : builtBooth();
  const itemScene = useItemScene(item, display);
  const sysScene = useSystemScene(sys, display, swOut);
  const scene = mode === 'item' ? itemScene : sysScene;
  const goals = [
    { label: 'Open all eight pieces', hit: seenI.size >= ITEMS.length },
    { label: 'Compare all four systems', hit: seenS.size >= SYSTEMS.length },
    { label: 'Match a job to its gear', hit: c1 },
    { label: 'Pick a system for a gig', hit: c2 },
    { label: 'Fix the silent laptop set', hit: faultFixed },
  ];
  const latched = useVisitGoals(ctx, goals);
  const itemDef = ITEMS.find((i) => i.id === item)!;
  const sysDef = SYSTEMS.find((s) => s.id === sys)!;
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene w={w} h={h} frame={scene.frame} motion={motion} callouts={scene.callouts} a11y={scene.a11y}>
            {scene.body}
          </Scene>
        ),
        bezel: [
          { k: mode === 'item' ? 'EQUIPMENT' : 'SYSTEM', v: mode === 'item' ? itemDef.label : sysDef.label, tint: colors.amber, flex: 2 },
          { k: 'SEEN', v: `${seenI.size}/8 · ${seenS.size}/4`, tint: colors.textPrimary },
          { k: 'SENDS TO', v: swOut, tint: swOut === 'CONTROLLER' ? colors.green : '#ff8a7e', flex: 1.3 },
        ],
        params: [
          {
            kind: 'options',
            id: 'item',
            label: 'EQUIPMENT',
            valueLabel: itemDef.label.split(' ')[0],
            valueA11y: itemDef.label,
            options: ITEMS.map((i) => ({ id: i.id, label: i.label, blurb: i.blurb })),
            selectedId: mode === 'item' ? item : null,
            sticky: true,
            onSelect: (id) => {
              setMode('item');
              setItem(id as Item);
              setSeenI((p) => new Set(p).add(id as Item));
            },
          },
          {
            kind: 'options',
            id: 'system',
            label: 'SYSTEM',
            valueLabel: sysDef.label.split(' ')[0],
            valueA11y: sysDef.label,
            options: SYSTEMS.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
            selectedId: mode === 'system' ? sys : null,
            sticky: true,
            onSelect: (id) => {
              setMode('system');
              setSys(id as System);
              setSeenS((p) => new Set(p).add(id as System));
            },
          },
          {
            kind: 'options',
            id: 'swout',
            label: 'OUTPUT',
            valueLabel: swOut === 'CONTROLLER' ? 'CTRL' : 'LAPTOP',
            valueA11y: SOFTWARE_OUTS.find((o) => o.id === swOut)!.label,
            options: SOFTWARE_OUTS,
            selectedId: swOut,
            onSelect: (id) => setSwOut(id as SoftwareOut),
          },
          stopKey(tr),
        ],
        initialParam: 'item',
      }}
    >
      <Step n={1}>
        <P>Every DJ setup does the same four jobs: something PLAYS the music, something MIXES it, something lets YOU hear the next track privately, and something lets the ROOM hear the mix. Different gear splits those jobs differently.</P>
        <P>A controller is a control surface; whether it also contains an audio interface or a mixer depends on the model. A standalone unit plays without a laptop, and some can also act as a controller. These are not tidy, separate boxes — check what each one actually does.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open EQUIPMENT and step through all eight pieces. The parts on each drawing are named; the tray says what each piece is for.</Do>
      </Step>
      <Step n={3}>
        <Do>Open SYSTEM and compare the four ways to put them together. Each one asks its own question — read it on the tray.</Do>
        <P>{mode === 'item' ? itemDef.blurb : sysDef.blurb}</P>
      </Step>
      <Step n={4}>
        <P>Pick gear for the job, not the other way round: what has to play, what has to be heard, what happens if the laptop or the internet fails?</P>
        <GoalChips goals={goals.slice(0, 2)} latched={latched.slice(0, 2)} />
        <Note tone="try">There is no single right setup. Many DJs start on a controller, play out on whatever the venue provides, and keep a USB stick that works on the club’s players as a backup.</Note>
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Which piece of gear makes the analog signal that a laptop DJ’s speakers receive?"
          options={['The audio interface (built into the controller or separate)', 'The laptop’s DJ software alone', 'The headphones', 'The jog wheel']}
          correct={0}
          explain="The software plays the music digitally; an audio interface — often built into the controller — turns it into the analog line outputs that go to a mixer or the speakers."
          wrong={[undefined, 'The software makes digital audio; something still has to turn it into an analog output.', 'Headphones only listen.', 'The jog wheel sends control data, not audio.']}
          onCorrect={() => setC1(true)}
        />
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="A small private event: no reliable internet, and you would rather not depend on a laptop. Which system fits best?"
          options={['A standalone system with tracks on a USB stick (and a spare stick)', 'A laptop playing from a streaming service', 'Two turntables with no records', 'A controller with no computer']}
          correct={0}
          explain="A standalone unit plays from local media with no laptop and no internet. A tested spare stick covers a failed one. A streaming service may need a connection, and a controller needs its computer."
          wrong={[undefined, 'A streaming service may need a working connection — the one thing you do not have.', 'Turntables need records to play.', 'Most controllers do nothing without their computer and software.']}
          onCorrect={() => setC2(true)}
        />
        <FaultCard
          title="THE SOFTWARE PLAYS, THE ROOM IS SILENT"
          symptom="A laptop + controller set: the track is moving on the laptop screen and the controller’s lights respond, but nothing comes out of the speakers plugged into the controller."
          start={() => {
            setMode('system');
            setSys('laptop');
            setSeenS((p) => new Set(p).add('laptop'));
            setSwOut('LAPTOP');
          }}
          fixed={swOut === 'CONTROLLER'}
          hints={['The music is made in the laptop. Where is the software SENDING it?', 'Look at SENDS TO on the readout strip.', 'Open OUTPUT and send the audio to the controller’s outputs.']}
          why="The software was sending its audio to the laptop’s own speakers, so the controller’s built-in interface had nothing to play. In DJ software this is the audio device (or audio output) setting; check it whenever you connect a controller or change computers."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(2)} latched={latched.slice(2)} />
      </Step>
    </DjRack>
  );
}

export const P02: PageDef = { title: 'Meet the DJ equipment', short: 'GEAR', Component: PageGear, manualDone: true, rack: true };
