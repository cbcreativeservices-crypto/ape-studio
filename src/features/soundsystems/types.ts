/**
 * Sound Systems Lab — the shared vocabulary (owner brief 2026-09-25).
 *
 * Live sound reinforcement modelled as PURE DATA: gear kinds with the signal
 * level they accept and emit, a venue plot of named slots, a system as placed
 * gear plus validated links, and the nine stations a technician probes when a
 * system is silent. Nothing in this folder imports React, Skia, audio or
 * navigation — every mode of the lab (LEARN · BUILD · ROUTE · OPERATE ·
 * TROUBLESHOOT) renders from these truths and test/soundSystemsEngine.test.ts
 * pins them, so a page can never claim what the system would not do.
 */

/** The electrical (or acoustic) nature of a signal at a port. The lab's first
 *  safety lesson lives here: a connector's shape never says which of these it
 *  carries, and a mismatch is either silence or damage. */
export type SignalLevel = 'acoustic' | 'mic' | 'instrument' | 'line' | 'speaker' | 'digital' | 'wireless';

export type GearKind =
  | 'vocalMic'
  | 'instrumentMic'
  | 'di'
  | 'playback'
  | 'wirelessRx'
  | 'snake'
  | 'stagebox'
  | 'console'
  | 'processor'
  | 'amp'
  | 'poweredSpeaker'
  | 'passiveSpeaker'
  | 'poweredSub'
  | 'passiveSub'
  | 'wedge'
  | 'poweredWedge'
  | 'iemTx'
  | 'iemPack'
  | 'powerDistro';

/** Where on the plot a piece of gear may stand. Slots are grouped by role so
 *  a loudspeaker can only be placed where a loudspeaker makes sense — the
 *  builder teaches system layout, not free-form drawing. */
export type SlotRole = 'stageSource' | 'stageInfra' | 'monitor' | 'main' | 'sub' | 'fill' | 'delay' | 'foh' | 'ampRack';

export type SlotId =
  | 'stageL'
  | 'stageC'
  | 'stageR'
  | 'riserL'
  | 'riserC'
  | 'riserR'
  | 'wingL'
  | 'wingR'
  | 'stageBox'
  | 'distro'
  | 'mon1'
  | 'mon2'
  | 'mon3'
  | 'mon4'
  | 'sideFillL'
  | 'sideFillR'
  | 'drumFill'
  | 'mainL'
  | 'mainR'
  | 'mainC'
  | 'subL'
  | 'subR'
  | 'subC'
  | 'subC2'
  | 'frontFillL'
  | 'frontFillR'
  | 'delayL'
  | 'delayR'
  | 'foh'
  | 'rack1'
  | 'rack2'
  | 'rack3'
  | 'rack4';

export type Placed = {
  /** Unique within the system (the builder mints `${kind}-${n}`). */
  id: string;
  kind: GearKind;
  slot: SlotId;
};

/** A console OUTPUT (finding WF-SS-02, owner go 2026-10-20): the main pair
 *  and its mono sum, the eight auxes and the four matrices. A cable from the
 *  console carries ONE of these into a loudspeaker — which one is what lets
 *  the lab check that a wedge is fed from an aux and that stereo is wired
 *  L/R. outputs.ts names them. */
export type ConsoleOut =
  | 'mainL'
  | 'mainR'
  | 'mainMono'
  | 'aux1'
  | 'aux2'
  | 'aux3'
  | 'aux4'
  | 'aux5'
  | 'aux6'
  | 'aux7'
  | 'aux8'
  | 'mtx1'
  | 'mtx2'
  | 'mtx3'
  | 'mtx4';

export type Link = {
  from: string;
  to: string;
  /** The level the two ports agreed on when the link was validated. */
  level: SignalLevel;
  /** The console output this cable carries, chosen where the signal enters a
   *  loudspeaker (or at a stagebox return / pass-through hop). Absent = not
   *  chosen: the cable passes on everything that reaches it, and a
   *  loudspeaker that receives more than one output reads "OUT ?". The input
   *  side of the console ignores it. */
  out?: ConsoleOut;
};

export type SoundSystem = {
  placed: Placed[];
  links: Link[];
};

/** The stations of the source-forward troubleshooting walk, in signal order.
 *  A fault lives at exactly one; every reading before it is healthy. */
export type Station =
  | 'source'
  | 'cable'
  | 'stagebox'
  | 'consoleIn'
  | 'consoleOut'
  | 'processor'
  | 'amp'
  | 'speaker'
  | 'listener';

export const STATION_ORDER: readonly Station[] = [
  'source',
  'cable',
  'stagebox',
  'consoleIn',
  'consoleOut',
  'processor',
  'amp',
  'speaker',
  'listener',
];

export const STATION_LABEL: Record<Station, string> = {
  source: 'Source',
  cable: 'Cable',
  stagebox: 'Stage input',
  consoleIn: 'Console input',
  consoleOut: 'Console output',
  processor: 'Processor',
  amp: 'Amplifier',
  speaker: 'Loudspeaker',
  listener: 'Listener',
};
