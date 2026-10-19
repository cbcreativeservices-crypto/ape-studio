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
import { MIXER_PARTS, MixerTop, mixerPartBox } from '../art/MixerTop';
import { PLAYER_PARTS, PlayerTop, playerPartBox } from '../art/PlayerTop';
import { ARM_AT_REST, TT_PARTS, TurntableTop, turntablePartBox } from '../art/TurntableTop';
import { CTRL_D, CTRL_OUT, CTRL_USB, CTRL_W, ControllerTop, Headphones, IFACE_D, IFACE_REAR, IFACE_W, InterfaceRear, InterfaceTop, LAPTOP_H, LAPTOP_USB, LAPTOP_W, Laptop, PHONES_H, PHONES_W, PowerSpeaker, RearPlugTop, SPEAKER_H, SPEAKER_REAR, SPEAKER_REAR_H, SPEAKER_REAR_W, SPEAKER_W, SpeakerRear, UsbAPlugTop } from '../art/gear';
import { Cable, PlugFace } from '../art/parts';
import { MIXER, MIXER_D, MIXER_W, PLAYER, PLAYER_D, PLAYER_W, STRIP_X, TT, TT_D, TT_W, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey } from '../dock';
import { useScreenSetup } from '../booth/setup';
import { builtBooth, freshDeck, type Booth } from '../model/djModel';
import { useBoothKit } from './shared';

type Item = 'turntable' | 'player' | 'mixer' | 'controller' | 'standalone' | 'interface' | 'headphones' | 'speaker';
type System = 'vinyl' | 'laptop' | 'standalone' | 'modular';

const ITEMS: { id: Item; label: string; short: string; blurb: string }[] = [
  { id: 'turntable', label: 'TURNTABLE', short: 'TURNTABLE', blurb: 'Plays vinyl records. A motor turns the platter at 33⅓ or 45 rpm and the stylus reads the groove. Its signal is very small and needs a special PHONO input (Screen 3), unless it has its own built-in booster.' },
  { id: 'player', label: 'MEDIA PLAYER', short: 'PLAYER', blurb: 'Plays digital files from a USB stick or SD card (or a linked computer). Jog wheel, tempo fader, cue, loops — its AUDIO OUT is line level.' },
  { id: 'mixer', label: 'MIXER', short: 'MIXER', blurb: 'Takes two or more sources, sets their gain, tone and level, blends them, and feeds the PA, the booth and your headphones.' },
  { id: 'controller', label: 'CONTROLLER + LAPTOP', short: 'CTRL+LAPTOP', blurb: 'A control surface for DJ software. The music plays in the laptop; this one also has a built-in audio interface that makes the outputs.' },
  { id: 'standalone', label: 'STANDALONE SYSTEM', short: 'STANDALONE', blurb: 'Players and a mixer in one unit with its own screen and media slots: it plays with no laptop at all (and some can also act as a controller).' },
  { id: 'interface', label: 'AUDIO INTERFACE', short: 'INTERFACE', blurb: 'Turns a computer’s digital audio into analog outputs (and inputs). Some controllers and mixers have one built in.' },
  { id: 'headphones', label: 'HEADPHONES', short: 'PHONES', blurb: 'Closed-back so you can hear the next track over a loud room. One stereo plug carries both ears — often 3.5 mm, with a 6.35 mm adapter for the mixer.' },
  { id: 'speaker', label: 'POWERED SPEAKER', short: 'SPEAKER', blurb: 'A speaker with its amplifier built in: line-level input, its own level control and its own mains power.' },
];
const SYSTEMS: { id: System; label: string; blurb: string }[] = [
  { id: 'vinyl', label: 'VINYL', blurb: 'Two turntables and a mixer. The question: is the mixer giving each turntable’s tiny signal its own PHONO input?' },
  { id: 'laptop', label: 'LAPTOP + CONTROLLER', blurb: 'Software plays the music; the controller sends control data over USB and its interface makes the audio. The question: where is the audio made, and which device has the outputs?' },
  { id: 'standalone', label: 'STANDALONE', blurb: 'Everything in one unit, music from USB or SD. The question: which functions still work with no laptop and no internet?' },
  { id: 'modular', label: 'MODULAR PLAYERS', blurb: 'Separate players into a separate mixer — the club layout this lab’s booth uses. The question: which cables carry the audio, and which only link the players?' },
];

const TERMS = [
  { term: 'Controller', def: 'A control surface: knobs, faders and jogs that send control messages over USB to software. Whether it also makes audio depends on the model.' },
  { term: 'Audio interface', def: 'The part that turns digital audio into the analog outputs you plug into a mixer or speakers (and back). It can be its own box or built in.' },
  { term: 'Standalone', def: 'Plays music without a computer, from its own media slots or storage.' },
  { term: 'Booth monitor', def: 'A speaker aimed at the DJ, fed from the mixer’s BOOTH output, so you can hear the mix without the PA blasting the booth.' },
] as const;

/** The four jobs every setup does — the find-the-gear task (learning review
 *  p02 #3): each job is met by picking a piece that really does it. */
const JOBS: { bezel: string; ask: string; fits: readonly Item[]; why: string }[] = [
  { bezel: 'ROOM HEARS', ask: 'lets the ROOM hear the mix', fits: ['speaker'], why: 'The powered speakers (the PA) are what the room hears.' },
  { bezel: 'YOU PREVIEW', ask: 'lets YOU hear the next track privately', fits: ['headphones'], why: 'Headphones carry the cue — the next track — to you alone.' },
  { bezel: 'MIXES', ask: 'MIXES two tracks together', fits: ['mixer', 'controller', 'standalone'], why: 'A mixer blends the sources; a controller or a standalone unit has a mixer section built in.' },
  { bezel: 'PLAYS', ask: 'PLAYS the music', fits: ['turntable', 'player', 'controller', 'standalone'], why: 'Turntables and media players play; with a controller the laptop’s software plays; a standalone unit plays from its own slots.' },
];

export const GOALS_GEAR = ['Find the gear for all four jobs', 'Pass the interface check', 'Pick a system for a gig', 'Fix the silent laptop set'] as const;

/** Where the DJ software sends its audio (the laptop + controller fault). */
type SoftwareOut = 'CONTROLLER' | 'LAPTOP';
const SOFTWARE_OUTS: { id: SoftwareOut; label: string; blurb: string }[] = [
  { id: 'CONTROLLER', label: 'CONTROLLER OUTPUTS', blurb: 'The controller’s built-in audio interface: its MASTER OUT feeds the speakers and its PHONES jack feeds your headphones.' },
  { id: 'LAPTOP', label: 'LAPTOP’S OWN AUDIO', blurb: 'The computer’s built-in speakers or headphone jack. The controller’s outputs stay silent.' },
];

const lab = (id: string, text: string, x: number, y: number, dx: number, dy: number, tone?: Callout['tone']): Callout => ({ id, text, at: { x, y }, dx, dy, tone });
const circBox = (cx: number, cy: number, d: number): Box => ({ x: cx - d / 2, y: cy - d / 2, w: d, h: d });

type ItemScene = { frame: Box; body: ReactNode; callouts: Callout[]; a11y: string; obstacles: Box[] };

/** The laptop above the controller, joined by a real USB cable: a USB-A
 *  plug in the laptop's left port, the cable dressed down and across, a
 *  USB-B plug into the controller's rear edge; the controller's MASTER OUT
 *  plugs on its rear edge with their cables leaving toward the speakers. */
const LX = (CTRL_W - LAPTOP_W) / 2;
const CY = LAPTOP_H + 60;
function LaptopAndController({ out }: { out: SoftwareOut }) {
  const usbStart: [number, number] = [LX + LAPTOP_USB.L.x - 34, LAPTOP_USB.L.y];
  const usbPts: [number, number][] = [usbStart, [LX - 56, LAPTOP_USB.L.y], [LX - 56, CY - 44], [CTRL_USB.x, CY - 44], [CTRL_USB.x, CY - 22]];
  const outs = [CTRL_OUT.x - 14, CTRL_OUT.x + 14];
  return (
    <>
      <Laptop x={LX} y={0} />
      <Cable pts={usbPts} style={{ colour: '#2a2c31', width: 4, pattern: 'plain' }} />
      <UsbAPlugTop x={LX + LAPTOP_USB.L.x} y={LAPTOP_USB.L.y} dir={-1} />
      <ControllerTop x={0} y={CY} />
      <RearPlugTop x={CTRL_USB.x} y={CY + 2} kind="usb" />
      {outs.map((ox, i) => (
        <Group key={ox}>
          <Cable pts={[[ox, CY - 30], [ox, CY - 52 - i * 9], [CTRL_W + 30, CY - 52 - i * 9]]} style={{ colour: '#3d4046', width: 4.6, pattern: i ? 'dash' : 'stripe' }} glow={out === 'CONTROLLER' ? '#6fa8ff' : null} />
          <RearPlugTop x={ox} y={CY + 2} kind="xlr" />
        </Group>
      ))}
    </>
  );
}

function useItemScene(item: Item, booth: Booth): ItemScene {
  const still = useMemo(() => freshDeck('nightFerry'), []);
  return useMemo((): ItemScene => {
    switch (item) {
      case 'turntable': {
        const A = ARM_AT_REST;
        return {
          frame: { x: -14, y: -16, w: TT_W + 28, h: TT_D + 32 },
          body: <TurntableTop x={0} y={0} d={still} playing={false} />,
          callouts: [
            lab('pl', 'PLATTER', TT.platter.cx - 150, TT.platter.cy + 80, -10, 24),
            lab('rec', 'RECORD', TT.platter.cx - 70, TT.platter.cy - 90, -24, -22),
            lab('arm', 'TONEARM', A.tube.x - 4, A.tube.y, -30, -6),
            lab('hs', 'HEADSHELL', A.headshell.x, A.headshell.y + 10, -26, 22),
            lab('cw', 'COUNTERWEIGHT', A.counterweight.x, A.counterweight.y - 14, -20, -16),
            lab('ss', 'START / STOP', TT.startStop.x + 4, TT.startStop.y + TT.startStop.h, -6, 18),
            lab('pt', 'PITCH', TT.pitch.x, TT.pitch.top + TT.pitch.len + 8, 10, 22),
            lab('sb', 'STROBE LAMP', TT.strobe.cx, TT.strobe.cy, -10, 0),
          ],
          a11y: 'A DJ turntable from above: the platter with its strobe dots and the record, the tonearm on its pivot with the headshell, the counterweight behind and the cue lever beside it, start/stop, 33/45 and the pitch fader.',
          obstacles: TT_PARTS.map((p) => turntablePartBox(p)),
        };
      }
      case 'player':
        return {
          frame: { x: -12, y: -14, w: PLAYER_W + 24, h: PLAYER_D + 28 },
          body: <PlayerTop x={0} y={0} deck="A" d={booth.decks.A} />,
          callouts: [
            lab('sc', 'SCREEN', PLAYER.screen.x + 10, PLAYER.screen.y + 10, -30, -18),
            lab('jg', 'JOG WHEEL', PLAYER.jog.cx + 70, PLAYER.jog.cy + 70, 20, 30),
            lab('hc', 'HOT CUES', PLAYER.hotCues.xs[0] + 6, PLAYER.hotCues.y + 9, -20, 0),
            lab('cue', 'CUE', PLAYER.cue.cx - 16, PLAYER.cue.cy, -20, 0),
            lab('pl', 'PLAY', PLAYER.play.cx - 16, PLAYER.play.cy, -20, 0),
            lab('tp', 'TEMPO', PLAYER.tempo.x + 10, PLAYER.tempo.top + 60, 18, 0),
            lab('usb', 'USB / SD', PLAYER.slots.usb.x + 13, PLAYER.slots.usb.y, 4, -18),
          ],
          a11y: 'A media player from above: its 7-inch screen with the waveform, the jog wheel, hot cue pads, loop keys, CUE and PLAY, SYNC and the tempo fader.',
          obstacles: PLAYER_PARTS.map((p) => playerPartBox(p)),
        };
      case 'mixer':
        return {
          frame: { x: -12, y: -14, w: MIXER_W + 24, h: MIXER_D + 26 },
          body: <MixerTop x={0} y={0} booth={booth} />,
          callouts: [
            lab('tr', 'TRIM', STRIP_X[1] - 10, MIXER.trim.y, -20, 0),
            lab('eq', 'EQ', STRIP_X[1] - 11, MIXER.mid.y, -20, 0),
            lab('fl', 'FILTER', STRIP_X[1] - 11, MIXER.filter.y, -20, 0),
            lab('fd', 'CH FADER', STRIP_X[1] - 8, MIXER.fader.top + 30, -20, 0),
            lab('xf', 'CROSSFADER', MIXER.xfader.left + 23, MIXER.xfader.y + 8, 0, 20),
            lab('mt', 'METERS', 135, MIXER.meters.y + 4, 0, -18),
            lab('ms', 'MASTER · BOOTH', MIXER.booth.x + 11, MIXER.booth.y, 20, 0),
            lab('ph', 'PHONES', MIXER.phones.x + 9, MIXER.phones.y, 20, 0),
          ],
          a11y: 'A two-channel DJ mixer from above: trims, EQ, filters, channel faders, the crossfader, the meters, master, booth and headphone controls.',
          obstacles: MIXER_PARTS.map((p) => mixerPartBox(p)),
        };
      case 'controller':
      case 'standalone': {
        const sa = item === 'standalone';
        return {
          frame: sa ? { x: -14, y: -16, w: CTRL_W + 28, h: CTRL_D + 32 } : { x: -70, y: -16, w: CTRL_W + 120, h: CY + CTRL_D + 30 },
          body: sa ? <ControllerTop x={0} y={0} standalone /> : <LaptopAndController out="CONTROLLER" />,
          callouts: sa
            ? [lab('sc', 'BUILT-IN SCREEN', CTRL_W / 2, 16, 0, -16), lab('jg', 'JOG', 112, 196, -10, 100), lab('mx', 'MIXER SECTION', CTRL_W / 2, 230, 0, 92), lab('sl', 'MEDIA SLOT', 409, 12, 30, -12)]
            : [lab('lp', 'LAPTOP: THE SOFTWARE PLAYS', CTRL_W / 2, 2, 0, -12), lab('usb', 'USB: CONTROL + AUDIO', LX - 56, 300, -10, 0), lab('jg', 'JOG', 112, CY + 196, -10, 90), lab('mx', 'MIXER SECTION', CTRL_W / 2, CY + 230, 0, 80), lab('out', 'MASTER OUT', CTRL_OUT.x, CY - 20, 20, -20)],
          a11y: sa ? 'A standalone DJ system: two decks and a mixer in one unit with its own screen and media slot.' : 'A laptop seen from above, joined by a USB cable to a two-deck controller whose master outputs leave from its back edge.',
          obstacles: [circBox(112, (sa ? 0 : CY) + 196, 166), circBox(438, (sa ? 0 : CY) + 196, 166), { x: 212, y: (sa ? 0 : CY) + 12, w: 126, h: 296 }, ...(sa ? [] : [{ x: LX, y: 0, w: LAPTOP_W, h: LAPTOP_H }])],
        };
      }
      case 'interface': {
        const IX = 85;
        const IY = 410;
        const RY = 548;
        const usb: [number, number][] = [[LAPTOP_USB.R.x + 34, LAPTOP_USB.R.y], [LAPTOP_W + 50, LAPTOP_USB.R.y], [LAPTOP_W + 50, RY + IFACE_REAR.usb.y], [IX + IFACE_REAR.usb.x, RY + IFACE_REAR.usb.y]];
        return {
          frame: { x: -20, y: -20, w: LAPTOP_W + 100, h: RY + IFACE_REAR.h + 90 },
          body: (
            <>
              <Laptop x={0} y={0} />
              <Cable pts={usb} style={{ colour: '#2a2c31', width: 4, pattern: 'plain' }} />
              <UsbAPlugTop x={LAPTOP_USB.R.x} y={LAPTOP_USB.R.y} dir={1} />
              <InterfaceTop x={IX} y={IY} />
              <InterfaceRear x={IX} y={RY} usbIn />
              {[IFACE_REAR.outL, IFACE_REAR.outR].map((o, i) => (
                <Group key={i}>
                  <Cable pts={[[IX + o.x, RY + o.y], [IX + o.x + (i ? 6 : -6), RY + o.y + 40], [IX + o.x + (i ? 14 : -14), RY + o.y + 70]]} style={{ colour: '#101113', width: 4.2, pattern: 'dots' }} />
                  <PlugFace cx={IX + o.x} cy={RY + o.y} kind="trs" colour="#2a2c31" />
                </Group>
              ))}
            </>
          ),
          callouts: [
            lab('if', 'AUDIO INTERFACE', IX + IFACE_W, IY + 40, 16, 0),
            lab('rr', 'ITS BACK: OUT L · OUT R · USB', IX + IFACE_REAR.w / 2, RY + IFACE_REAR.h, 0, 20),
            lab('usb', 'USB (DATA + AUDIO)', LAPTOP_W + 50, 420, 10, 0),
            lab('lp', 'COMPUTER', LAPTOP_W / 2, 2, 0, -12),
          ],
          a11y: 'A laptop seen from above, joined by a USB cable to the back of a small audio interface; the interface’s two balanced outputs carry the sound on.',
          obstacles: [{ x: IX, y: IY, w: IFACE_W, h: IFACE_D }, { x: IX, y: RY, w: IFACE_REAR.w, h: IFACE_REAR.h }, { x: 0, y: 0, w: LAPTOP_W, h: LAPTOP_H }],
        };
      }
      case 'headphones':
        return {
          frame: { x: -24, y: -16, w: PHONES_W + 48, h: PHONES_H + 26 },
          body: <Headphones x={0} y={0} />,
          callouts: [
            lab('l', 'LEFT CUP', 46 - 34, 162, -14, 0),
            lab('r', 'RIGHT CUP', 154 + 34, 162, 14, 0),
            lab('hb', 'PADDED HEADBAND', 100, 24, 0, -16),
            lab('c', 'COILED CABLE', 74, 226, -16, 10),
            lab('p', 'STEREO (TRS) PLUG', 100, 290, 0, 12),
          ],
          a11y: 'Closed-back DJ headphones from the front, drawn as you wear them (the left cup on your left): a padded headband, sliders into swivel yokes marked L and R, a coiled cable and a stereo plug.',
          obstacles: [{ x: 8, y: 110, w: 84, h: 104 }, { x: 108, y: 110, w: 84, h: 104 }],
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
          callouts: [
            lab('hd', 'HANDLE', SPEAKER_W / 2, 26, 0, -14),
            lab('hn', 'HORN (HIGHS)', SPEAKER_W / 2 + 80, 146, 20, 0),
            lab('wf', 'WOOFER (LOWS)', SPEAKER_W / 2, 393 + 150, 0, 16),
            lab('in', 'INPUT (XLR / TRS)', SPEAKER_W + 24 + SPEAKER_REAR.input.x, (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.input.y - 16, 0, -26),
            lab('lv', 'LEVEL', SPEAKER_W + 24 + SPEAKER_REAR.level.x + 14, (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.level.y, 30, 0),
            lab('ac', 'POWER IN', SPEAKER_W + 24 + SPEAKER_REAR.ac.x, (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.ac.y + 14, 0, 26),
          ],
          a11y: 'A powered PA speaker: the front with its handle, the waveguide horn and the 12-inch woofer behind the perforated grille, and its rear amplifier panel with the input, level knob and power inlet.',
          obstacles: [
            { x: SPEAKER_W + 24 + SPEAKER_REAR.input.x - 22, y: (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.input.y - 22, w: 44, h: 44 },
            { x: SPEAKER_W + 24 + SPEAKER_REAR.thru.x - 18, y: (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.thru.y - 18, w: 36, h: 36 },
            { x: SPEAKER_W + 24 + SPEAKER_REAR.level.x - 18, y: (SPEAKER_H - SPEAKER_REAR_H) / 2 + SPEAKER_REAR.level.y - 18, w: 36, h: 36 },
            { x: SPEAKER_W + 24 + 30, y: (SPEAKER_H - SPEAKER_REAR_H) / 2 + 190, w: 110, h: 50 },
          ],
        };
    }
  }, [item, booth, still]);
}

function useSystemScene(sys: System, booth: Booth, swOut: SoftwareOut): ItemScene {
  const still = useMemo(() => freshDeck('nightFerry'), []);
  return useMemo((): ItemScene => {
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
          obstacles: [],
        };
      }
      case 'laptop':
        return {
          frame: { x: -70, y: -20, w: CTRL_W + 120, h: CY + CTRL_D + 36 },
          body: <LaptopAndController out={swOut} />,
          callouts:
            swOut === 'CONTROLLER'
              ? [lab('lp', 'MUSIC PLAYS HERE', CTRL_W / 2, 2, 0, -12), lab('c', 'OUTPUTS HERE', CTRL_OUT.x, CY - 20, 20, -24)]
              : [lab('lp', 'AUDIO → LAPTOP SPEAKERS', CTRL_W / 2, 2, 0, -12, 'red'), lab('c', 'OUTPUTS: SILENT', CTRL_OUT.x, CY - 20, 20, -24, 'red')],
          a11y: `A laptop and controller system. The software sends its audio to ${swOut === 'CONTROLLER' ? 'the controller’s outputs' : 'the laptop’s own speakers, so the controller’s outputs are silent'}.`,
          obstacles: [circBox(112, CY + 196, 166), circBox(438, CY + 196, 166), { x: 212, y: CY + 12, w: 126, h: 296 }, { x: LX, y: 0, w: LAPTOP_W, h: LAPTOP_H }],
        };
      case 'standalone':
        return {
          frame: { x: -14, y: -20, w: CTRL_W + 28, h: CTRL_D + 46 },
          body: <ControllerTop x={0} y={0} standalone />,
          callouts: [lab('s', 'NO LAPTOP: MUSIC FROM USB / SD', CTRL_W / 2, 0, 0, -14)],
          a11y: 'A standalone system.',
          obstacles: [],
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
          obstacles: [],
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
  const [job, setJob] = useState(0);
  const [jobMsg, setJobMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [swOut, setSwOut] = useState<SoftwareOut>('CONTROLLER');
  const [faultFixed, setFaultFixed] = useState(false);
  const display = booth.decks.A.track ? booth : builtBooth();
  const itemScene = useItemScene(item, display);
  const sysScene = useSystemScene(sys, display, swOut);
  const scene = mode === 'item' ? itemScene : sysScene;
  const hits = [job >= JOBS.length, c1, c2, faultFixed];
  const goals = GOALS_GEAR.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'GEAR');
  const itemDef = ITEMS.find((i) => i.id === item)!;
  const sysDef = SYSTEMS.find((s) => s.id === sys)!;
  const laptopView = mode === 'system' && sys === 'laptop';
  const pickItem = (id: Item) => {
    if (job >= JOBS.length) return;
    const j = JOBS[job];
    const name = ITEMS.find((i) => i.id === id)!.label.toLowerCase();
    if (j.fits.includes(id)) {
      setJobMsg({ ok: true, text: `Yes — ${j.why}` });
      setJob((n) => n + 1);
    } else setJobMsg({ ok: false, text: `Not the ${name} — look for what ${j.ask}.` });
  };
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene w={w} h={h} frame={scene.frame} motion={motion} callouts={scene.callouts} obstacles={scene.obstacles} a11y={scene.a11y}>
            {scene.body}
          </Scene>
        ),
        bezel: [
          { k: mode === 'item' ? 'EQUIPMENT' : 'SYSTEM', v: mode === 'item' ? (itemDef.label.length > 14 ? itemDef.short : itemDef.label) : sysDef.label.replace('CONTROLLER', 'CTRL'), vA11y: mode === 'item' ? itemDef.label : sysDef.label, tint: colors.amber, flex: 2 },
          job < JOBS.length ? { k: `FIND ${job + 1}/4`, v: JOBS[job].bezel, tint: jobMsg && !jobMsg.ok ? '#ff8a7e' : colors.textPrimary, flex: 1.3 } : { k: 'JOBS', v: '4/4 FOUND', tint: colors.green },
          // the software's output is a laptop + controller setting: shown
          // only where it means something (visual review finding 24)
          ...(mode === 'system' && sys === 'laptop' ? [{ k: 'SENDS TO', v: swOut, tint: swOut === 'CONTROLLER' ? colors.green : '#ff8a7e', flex: 1.3 }] : []),
        ],
        params: [
          {
            kind: 'options',
            id: 'item',
            label: 'EQUIPMENT',
            valueLabel: itemDef.short,
            valueA11y: itemDef.label,
            options: ITEMS.map((i) => ({ id: i.id, label: i.label, blurb: i.blurb })),
            selectedId: mode === 'item' ? item : null,
            sticky: true,
            onSelect: (id) => {
              setMode('item');
              setItem(id as Item);
              pickItem(id as Item);
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
            },
          },
          {
            kind: 'options',
            id: 'swout',
            label: 'SENDS TO',
            valueLabel: swOut === 'CONTROLLER' ? 'CTRL' : 'LAPTOP',
            valueA11y: SOFTWARE_OUTS.find((o) => o.id === swOut)!.label,
            options: SOFTWARE_OUTS,
            selectedId: swOut,
            // the software's output means something only in the laptop view
            locked: laptopView ? undefined : 'Open SYSTEM → LAPTOP + CONTROLLER to see where the software sends its audio',
            onSelect: (id) => setSwOut(id as SoftwareOut),
          },
          stopKey(tr),
        ],
        initialParam: 'item',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at ${scene.a11y.charAt(0).toLowerCase()}${scene.a11y.slice(1)}`}</Look>
        <P>Every DJ setup does the same four jobs: something PLAYS the music, something MIXES it, something lets YOU hear the next track privately, and something lets the ROOM hear the mix.</P>
        <P>Different gear splits those jobs differently, and the boxes are not tidy — a controller may or may not contain an audio interface, and a standalone unit plays with no laptop at all.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>{job < JOBS.length ? `Find what ${JOBS[job].ask}: open EQUIPMENT and pick it. (${job + 1} of 4 — FIND on the readout strip.)` : 'All four jobs found. Step through the rest of EQUIPMENT for anything you have not met.'}</Do>
        {jobMsg ? <Note tone={jobMsg.ok ? 'try' : 'safety'}>{jobMsg.text}</Note> : null}
      </Step>
      <Step n={3}>
        <Do>Open SYSTEM: each system answers one question — which device makes the sound the room hears?</Do>
        <P>{mode === 'item' ? itemDef.blurb : sysDef.blurb}</P>
      </Step>
      <Step n={4}>
        <P>Pick gear for the job, not the other way round: what has to play, what has to be heard, what happens if the laptop or the internet fails?</P>
        <GoalChips goals={goals.slice(0, 1)} latched={latched.slice(0, 1)} />
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
            setSwOut('LAPTOP');
          }}
          fixed={swOut === 'CONTROLLER'}
          hints={['The music is made in the laptop. Where is the software SENDING it?', 'Look at SENDS TO on the readout strip.', 'Open SENDS TO and pick the controller’s outputs.']}
          why="The software was sending its audio to the laptop’s own speakers, so the controller’s built-in interface had nothing to play. In DJ software this is the audio device (or audio output) setting; check it whenever you connect a controller or change computers."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(1)} latched={latched.slice(1)} />
      </Step>
    </DjRack>
  );
}

export const P02: PageDef = { title: 'Meet the DJ equipment', short: 'GEAR', Component: PageGear, manualDone: true, rack: true };
