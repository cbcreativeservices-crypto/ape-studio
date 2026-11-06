/**
 * Meta measurement, the device side (1.0.1). The decisions are in metaGate.ts.
 *
 * ⛔ LOADED ON DEMAND ONLY: `require('../growth/metaMeasurement')` inside a
 * function, never a static import. The app-start graph is at its cap of 260
 * modules (test/perfStartTrim_20261004), and this file reaches the Meta
 * library. Nothing here runs on web, or on a device the gate turns away.
 *
 * Library load order matters. Evaluating FBAppEventsLogger creates its native
 * module, and on Android that throws until the SDK is initialized. So the
 * sub-paths are required one by one, never the package root: the root would
 * evaluate every module (login, share, graph) at once.
 */
import { AppState, Platform, type AppStateStatus } from 'react-native';
import Constants from 'expo-constants';

import { initializeMetaSdkAndroid } from '../../../modules/ape-meta-init';
import { presentedModalCount, rootModalHoldMs } from '../../components/DimModal';
import { TELEMETRY_ENABLED } from '../../config/telemetry';
import { confirmDialog } from '../../lib/confirm';
import { navigationRef } from '../../navigation/navigationRef';
import { isMicActive } from '../audio/audioOutputStore';
import { areOverlaysSuppressed } from '../dev/popupSuppressStore';
import { getLabPreview } from '../lab/labPreviewStore';
import { appSessionCount } from '../review/reviewPrompt';
import { optionalModule } from '../tools/capture/optionalModule';
import { noteMetaConsentWipe, readMetaConsent, saveMetaConsent } from './metaConsentStore';
import {
  META_CONSENT_BODY,
  META_CONSENT_NO,
  META_CONSENT_TITLE,
  META_CONSENT_YES,
  createMetaEngine,
  metaAllowed,
  type FbLogger,
  type FbSettings,
  type MemberGateState,
  type MetaDevice,
  type PurchaseNote,
  type TrackingApi,
} from './metaGate';

/** The Region setting (Language & Region on iOS, Region on Android), which the
 *  expo-localization docs name for this; not the store country or the SIM. */
function deviceRegion(): string | null {
  const lib = optionalModule<{ getLocales(): { regionCode: string | null }[] }>('expo-localization');
  return lib?.getLocales()?.[0]?.regionCode ?? null;
}

function nativeValuesPresent(): boolean {
  const extra = Constants.expoConfig?.extra as { metaMeasurement?: { nativeValuesPresent?: unknown } } | undefined;
  return extra?.metaMeasurement?.nativeValuesPresent === true;
}

function onHomeTab(): boolean {
  if (!navigationRef.isReady()) return false;
  const root = navigationRef.getRootState();
  const top = root?.routes?.[root.index ?? 0];
  return top?.name === 'Main' && navigationRef.getCurrentRoute()?.name === 'Home';
}

function libDefault<T>(path: string): T | null {
  return optionalModule<{ default: T }>(path)?.default ?? null;
}

let waiting: ReturnType<typeof setTimeout> | null = null;

const modalFacts = () => ({ modalsPresented: presentedModalCount(), modalHoldMs: rootModalHoldMs() });

const device: MetaDevice = {
  gateFacts: () => ({
    platform: Platform.OS,
    region: Platform.OS === 'web' ? null : deviceRegion(),
    nativeValuesPresent: nativeValuesPresent(),
    telemetryEnabled: TELEMETRY_ENABLED,
  }),
  modalFacts,
  calmFacts: () => ({
    ...modalFacts(),
    appActive: AppState.currentState === 'active',
    onHome: onHomeTab(),
    labPreviewOpen: getLabPreview().active,
    micActive: isMicActive(),
    overlaysSuppressed: areOverlaysSuppressed(),
  }),
  initNative: () => (Platform.OS === 'android' ? initializeMetaSdkAndroid() : Promise.resolve(true)),
  loadSettings: () => libDefault<FbSettings>('react-native-fbsdk-next/lib/commonjs/FBSettings'),
  loadLogger: () => libDefault<FbLogger>('react-native-fbsdk-next/lib/commonjs/FBAppEventsLogger'),
  loadTracking: () => optionalModule<TrackingApi>('expo-tracking-transparency'),
  appSessions: appSessionCount,
  readConsent: readMetaConsent,
  saveConsent: saveMetaConsent,
  askConsent: (done) =>
    confirmDialog(META_CONSENT_TITLE, META_CONSENT_BODY, META_CONSENT_YES, () => done('yes'), {
      cancelText: META_CONSENT_NO,
      onCancel: () => done('no'),
      // The scrim and Android BACK are not a No: nothing is saved (metaGate.ts).
      onDismiss: () => done('dismissed'),
    }),
  now: () => Date.now(),
  // One wait at a time: the engine's checks run one after another.
  after: (ms, run) => {
    if (waiting) clearTimeout(waiting);
    waiting = setTimeout(run, ms);
  },
};

const engine = createMetaEngine(device);

// Consent belongs to a person: an account wipe stops this session too, or the
// next person's purchase would go out on the last person's yes.
noteMetaConsentWipe(() => engine.noteConsentWiped());

let watchingAppState = false;
function watchAppOpens(): void {
  if (watchingAppState) return;
  watchingAppState = true;
  let last: AppStateStatus = AppState.currentState;
  AppState.addEventListener('change', (next) => {
    if (last === 'background' && next === 'active') engine.noteAppOpen();
    last = next;
  });
}

/** From PurchaseListenerRoot, on each change of useMemberGate()'s answer. */
export function noteMemberGate(gate: MemberGateState, knownGuest: boolean): void {
  if (Platform.OS === 'web') return;
  engine.noteMemberGate(gate, knownGuest);
  if (engine.phase() !== 'off') watchAppOpens();
}

/** From the purchase path, once the server has verified a new purchase. */
export function noteMetaPurchase(note: PurchaseNote): void {
  if (Platform.OS === 'web') return;
  engine.notePurchase(note);
}

/** Settings: the row exists only where Meta could really run. Never on web. */
export function adMeasurementAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return metaAllowed(device.gateFacts());
  } catch {
    return false;
  }
}

/** Settings, switching on: the same popup, so the same 18+ statement. */
export function askAdMeasurement(): void {
  if (Platform.OS === 'web') return;
  engine.offerConsent();
}

/** Settings, switching off: stops logging now, then saves the no. */
export function stopAdMeasurement(): void {
  if (Platform.OS === 'web') return;
  engine.withdrawConsent();
}
