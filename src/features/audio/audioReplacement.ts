/**
 * audioReplacement — "We're updating our audio" before the first sound a
 * learner plays in a lab whose recordings are being replaced (owner
 * 2026-10-28, must-do D28).
 *
 * THE LIST is the recording-engineer brief v2 (sent 2026-10-01; source and
 * item data in docs/recording_brief/rb2_items*.py, "usedin" per item), minus
 * what the engineer has already uploaded (2026-10-27, must-do D16). Each lab
 * area below names the brief items that will replace its sounds. The SERVER
 * holds the live list (owner's pick): `audio_replacement_pending()` answers the
 * brief item ids still owed, and Comp A clears an item when its files land, so
 * a lab stops warning with no app update. Until that read answers (offline,
 * or before Comp A creates the function) the app uses DEFAULT_PENDING_ITEMS.
 *
 * WHEN (owner): before the FIRST sound press in a listed lab, once per lab per
 * app session. One button, PLAY; the sound starts only from PLAY. The scrim or
 * Android BACK closes it without playing, and the next press asks again.
 *
 * WHERE it runs: every sound start goes through `runAfterNotice` (sync starts)
 * or `noticeGate` (async starts: startFenced calls it first). Which lab is
 * open comes from the current route (navigationRef), so no lab screen needs
 * its own hook.
 */
import { supabase } from '../../lib/supabase';
import { navigationRef } from '../../navigation/navigationRef';
import { showAppDialog } from '../../components/AppDialog';
import { setBeforeSoundStart } from './audioOutputStore';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';

/** Owner-approved wording (2026-10-28). */
export const REPLACEMENT_NOTICE_TITLE = 'We’re updating our audio';
export const REPLACEMENT_NOTICE_BODY =
  'As we launch in November 2026, we are replacing many of our audio files with new recordings. ' +
  'You can listen to this one now, but it is not our final version. ' +
  'We expect every audio file to be replaced and updated by January 1, 2027.';
export const REPLACEMENT_NOTICE_BUTTON = 'PLAY';

/** Lab area → the brief items that will replace its sounds. */
export const AREA_ITEMS: Readonly<Record<string, readonly string[]>> = {
  mixing: ['MIX-01', 'MIX-02', 'MIX-03'],
  mastering: ['MST-01', 'MST-02'],
  micPrinciples: ['MPR-01', 'MPR-02', 'MPR-03', 'MPR-04a', 'MPR-04b', 'MPR-05a', 'MPR-05b', 'MPR-06', 'MPR-07'],
  speakerCoverage: ['SPK-01'],
  micSelection: ['MSL-01', 'MSL-02'],
  speech: ['SPC-01', 'SPC-02', 'SPC-03', 'SPC-04', 'SPC-05'],
  deEsser: ['DES-01'],
  envelope: ['ENV-01', 'ENV-02', 'ENV-03'],
  eq: ['EQ-01a', 'EQ-01b', 'EQ-01c', 'EQ-01d', 'EQ-01e', 'EQ-02'],
  fx: ['FX-01', 'FX-02', 'FX-03', 'FX-04', 'FX-05', 'FX-06'],
  meter: ['MTR-01', 'MTR-02'],
  gain: ['GAN-01'],
  wave: ['WAV-01', 'WAV-02', 'WAV-03', 'WAV-04', 'SPK-01'],
  digital: ['DIG-01'],
  foundations: ['FND-01'],
  startHere: ['STH-01'],
  noise: ['NOI-01a', 'NOI-01b'],
  earTraining: ['EAR-01', 'EAR-02', 'EAR-03', 'EAR-04', 'EAR-05', 'EAR-06', 'WAV-02'],
  tuning: ['TUN-01', 'TUN-02'],
  soundSystems: ['SS-01', 'SS-02E', 'SS-02A', 'SS-03a', 'SS-03b', 'SS-03c', 'SS-04'],
  amp: ['AMP-01'],
  tube: ['TUBE-01'],
  cables: ['CAB-01', 'CAB-02', 'CAB-03', 'CAB-04', 'CAB-05'],
  patchbay: ['PATCH-01'],
  postProduction: ['PROD-01', 'PROD-02', 'PROD-03', 'PROD-04a', 'PROD-04b'],
  roomDesign: ['RD-01'],
  toolRt60: ['TL-01'],
  toolSpectrogram: ['TL-02'],
  toolSpl: ['TL-03'],
  toolTuner: ['TL-04'],
  toolMeter: ['TL-05'],
  fm: ['FM-01'],
  autotune: ['AUT-01'],
  signalChain: ['SC-01'],
  scenarios: ['SCN-01'],
  glossary: ['GLO-01'],
};

/** Brief items whose files are ALL uploaded (D16, 2026-10-27). MTR-02 (birdsong)
 *  and TL-04 (the sung A4) are only partly delivered, so they stay owed. */
export const DELIVERED_ITEMS: readonly string[] = ['GAN-01', 'MSL-02', 'MPR-04a'];

export const DEFAULT_PENDING_ITEMS: readonly string[] = [
  ...new Set(Object.values(AREA_ITEMS).flat()),
].filter((id) => !DELIVERED_ITEMS.includes(id));

const FX_ROUTES = ['CompressionLab', 'GateLab', 'LimiterLab', 'DistortionLab', 'ReverbLab', 'DelayLab', 'ChorusLab', 'FlangerLab', 'PhaserLab', 'StereoLab', 'PhaseLab'];
const ROUTE_AREA: Readonly<Record<string, string>> = {
  BeginningMixingLab: 'mixing',
  AdvancedMixingLab: 'mixing',
  MasteringLab: 'mastering',
  MicLab: 'micPrinciples',
  SpeakerLab: 'speakerCoverage',
  MicSelectLab: 'micSelection',
  SpeechLab: 'speech',
  DeEsserLab: 'deEsser',
  SmartProcessorsLab: 'deEsser',
  EnvelopeLab: 'envelope',
  EqLabHome: 'eq',
  EqModule: 'eq',
  ...Object.fromEntries(FX_ROUTES.map((r) => [r, 'fx'])),
  MeterLab: 'meter',
  MeterModule: 'meter',
  GainLabHome: 'gain',
  GainModule: 'gain',
  WaveLab: 'wave',
  WaveModule: 'wave',
  DigitalLab: 'digital',
  DigitalModule: 'digital',
  FoundationsCourse: 'foundations',
  FoundationsPlayground: 'foundations',
  HarmonicLab: 'foundations',
  OscillatorLab: 'foundations',
  StartHere: 'startHere',
  NoiseLab: 'noise',
  EarTrainingLab: 'earTraining',
  EarModule: 'earTraining',
  TuningLab: 'tuning',
  SoundSystemsLab: 'soundSystems',
  SoundSystemsBuild: 'soundSystems',
  SoundSystemsLearn: 'soundSystems',
  SoundSystemsOperate: 'soundSystems',
  SoundSystemsRoute: 'soundSystems',
  SoundSystemsTroubleshoot: 'soundSystems',
  AmpLab: 'amp',
  AmpModule: 'amp',
  TubeLab: 'tube',
  CableLab: 'cables',
  CableInstallLab: 'cables',
  ConnectorSelectLab: 'cables',
  PatchbayLab: 'patchbay',
  PostProdLab: 'postProduction',
  RoomDesignLab: 'roomDesign',
  Rt60Live: 'toolRt60',
  SpectrogramLive: 'toolSpectrogram',
  SplMeter: 'toolSpl',
  FrequencyCounter: 'toolTuner',
  MultiMeter: 'toolMeter',
  FmLab: 'fm',
  AutotuneLab: 'autotune',
  SignalChainLab: 'signalChain',
  Scenarios: 'scenarios',
  // Glossary (GLO-01, optional): its only sound is the phone's spoken voice, not a
  // file, so it never asks.
};
const TOOL_DEMO_AREA: Readonly<Record<string, string>> = {
  rt60: 'toolRt60',
  spectrogram: 'toolSpectrogram',
  spl: 'toolSpl',
  hzcounter: 'toolTuner',
  multimeter: 'toolMeter',
};

/** The lab area a route belongs to, or null (pure, for tests). */
export function areaForRoute(name: string | undefined, params?: unknown): string | null {
  if (!name) return null;
  const p = (params ?? {}) as { lab?: string; toolKey?: string };
  if (name === 'ProductionStage') return p.lab === 'postprod' ? 'postProduction' : null;
  if (name === 'ToolDemo') return (p.toolKey && TOOL_DEMO_AREA[p.toolKey]) || null;
  return ROUTE_AREA[name] ?? null;
}

/** Does this area still owe recordings, given the pending item ids? (pure) */
export function areaPending(area: string | null, pendingItems: readonly string[]): boolean {
  if (!area) return false;
  const items = AREA_ITEMS[area];
  return !!items && items.some((id) => pendingItems.includes(id));
}

// ── session state ────────────────────────────────────────────────────────────
let serverPending: string[] | null = null;
let serverAsked = false;
const acknowledged = new Set<string>();
let showing = false;

const SERVER_WAIT_MS = 4000;

/** Read the live list once per app session. A failure keeps the default. */
function askServer(): void {
  if (serverAsked) return;
  serverAsked = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  void Promise.race([
    supabase.rpc('audio_replacement_pending'),
    new Promise<null>((r) => {
      timer = setTimeout(() => r(null), SERVER_WAIT_MS);
    }),
  ])
    .then((res) => {
      clearTimeout(timer);
      const data = (res as { data?: unknown; error?: unknown } | null)?.data;
      if (!(res as { error?: unknown } | null)?.error && Array.isArray(data)) {
        serverPending = data.filter((x): x is string => typeof x === 'string');
      } else serverAsked = false; // try again on the next press
    })
    .catch(() => {
      clearTimeout(timer);
      serverAsked = false;
    });
}

function currentArea(): string | null {
  if (!navigationRef.isReady()) return null;
  const r = navigationRef.getCurrentRoute();
  return areaForRoute(r?.name, r?.params);
}

/** Would a sound started now be preceded by the notice? */
function needsNotice(): string | null {
  const area = currentArea();
  if (!area || acknowledged.has(area)) return null;
  askServer(); // only inside a listed lab
  return areaPending(area, serverPending ?? DEFAULT_PENDING_ITEMS) ? area : null;
}

/**
 * Run a SYNCHRONOUS sound start, after the notice when this lab still owes
 * recordings and the learner has not seen it this session. Without a notice
 * `start` runs at once, exactly as before. `declined` runs when the notice is
 * closed without PLAY, or when a notice is already up (nothing may sound).
 */
export function runAfterNotice(start: () => void, declined?: () => void): void {
  const area = needsNotice();
  if (!area) {
    start();
    return;
  }
  if (showing) {
    declined?.();
    return;
  }
  showing = true;
  showAppDialog({
    title: REPLACEMENT_NOTICE_TITLE,
    body: REPLACEMENT_NOTICE_BODY,
    confirmText: REPLACEMENT_NOTICE_BUTTON,
    hideCancel: true,
    onConfirm: () => {
      showing = false;
      acknowledged.add(area);
      start();
    },
    onCancel: () => {
      showing = false; // closed without PLAY: nothing sounds, and the next press asks again
      declined?.();
    },
  });
}

/** The same notice for an ASYNCHRONOUS start: resolves true to go ahead,
 *  false when the learner closed it without PLAY (nothing may sound). */
export function noticeGate(): Promise<boolean> {
  if (!needsNotice()) return Promise.resolve(true);
  return new Promise((resolve) => runAfterNotice(() => resolve(true), () => resolve(false)));
}

/** Called once at app start: every startFenced() start asks noticeGate first. */
export function installAudioReplacementNotice(): void {
  setBeforeSoundStart(noticeGate);
}

/** Tests / account wipe: forget this session's answers and the server read.
 *  The next person on this phone sees the notice afresh. */
export function resetAudioReplacementNotice(): void {
  serverPending = null;
  serverAsked = false;
  acknowledged.clear();
  showing = false;
}
// Self-registered with the account wipe (guard G2; keeps this module out of
// the app-start graph — see clearLocalAccountData resetAllLocalStores).
registerLocalStoreReset(resetAudioReplacementNotice);
