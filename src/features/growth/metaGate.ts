/**
 * Meta measurement, the decisions (1.0.1 plan, owner-approved 2026-11-05).
 *
 * IMPORT-FREE and fully tested: everything that decides whether the Meta SDK
 * may run, when the Apple prompt may appear and what an event may carry lives
 * here, and metaMeasurement.ts only hands it the real device. A fake device
 * drives the same engine in test/metaMeasurement_20261105.test.ts.
 *
 * THE RULES:
 *  • OFF BY DEFAULT. On only with the native values in this build, a device
 *    region of US, CA or AU, and on a phone. Anything unknown is off.
 *  • Only three things reach Meta: activate/app open, and a purchase with the
 *    store's price and currency. No user id, no email, no Advanced Matching,
 *    no learning data. `buildPurchaseEvent` is an allowlist.
 *  • Automatic logging stays off.
 *  • iOS asks once, at a calm moment after the first run, and only if iOS has
 *    never been asked. No feature ever reads the answer: "denied" just means
 *    no IDFA, and the same events go out with limited data.
 *  • Nothing starts while a member gate is unsettled or a popup is up.
 */

export const META_REGIONS: readonly string[] = ['US', 'CA', 'AU'];

/** Meta's own standard name for an app activation (Android
 *  AppEventsConstants.EVENT_NAME_ACTIVATED_APP, iOS AppEvents.Name.activatedApp).
 *  The library has no activateApp call, and that native call would also start
 *  session tracking, so this is sent as a plain event. */
export const META_ACTIVATE_EVENT = 'fb_mobile_activate_app';

/** Meta's session rule of thumb: a return within a minute is the same open. */
export const OPEN_GAP_MS = 60_000;
/** How long the screen must stay quiet before the Apple prompt appears: long
 *  enough for a welcome popup or a reminder that was about to open. */
export const CALM_DWELL_MS = 20_000;
export const CALM_CHECK_MS = 5_000;
/** Ten minutes of checks, then the next app open tries again. */
export const MAX_CALM_CHECKS = 120;
export const START_RETRY_MS = 2_000;
export const MAX_START_CHECKS = 150;
/** The Apple prompt never appears on the first app open. */
export const FIRST_ASK_SESSION = 2;
/** Purchases held for a start still under way. */
export const MAX_QUEUED_PURCHASES = 3;

export type GateFacts = {
  platform: string;
  region: string | null | undefined;
  nativeValuesPresent: boolean;
  telemetryEnabled: boolean;
};

export function regionAllowed(region: string | null | undefined): boolean {
  return typeof region === 'string' && META_REGIONS.includes(region.trim().toUpperCase());
}

export function metaAllowed(f: GateFacts): boolean {
  return (
    f.telemetryEnabled === true &&
    (f.platform === 'ios' || f.platform === 'android') &&
    f.nativeValuesPresent === true &&
    regionAllowed(f.region)
  );
}

/** useMemberGate()'s four states; repeated so this file stays import-free. */
export type MemberGateState = 'open' | 'locked' | 'checking' | 'unconfirmed';

/** A popup or a closing popup: rootModalHoldMs and every DimModal on screen. */
export type ModalFacts = {
  modalsPresented: number;
  modalHoldMs: number;
};

/** Nothing starts during a member gate: 'checking' and 'unconfirmed' are both
 *  a person being told something about their account. */
export function memberGateSettled(gate: MemberGateState | null): boolean {
  return gate === 'open' || gate === 'locked';
}

export function canStartNow(gate: MemberGateState | null, m: ModalFacts): boolean {
  return memberGateSettled(gate) && m.modalsPresented === 0 && m.modalHoldMs === 0;
}

export type CalmFacts = ModalFacts & {
  appActive: boolean;
  /** Home tab, top of the stack: never a lab, an intro video or a paywall. */
  onHome: boolean;
  labPreviewOpen: boolean;
  micActive: boolean;
  overlaysSuppressed: boolean;
};

export function isCalmNow(gate: MemberGateState | null, f: CalmFacts): boolean {
  return (
    canStartNow(gate, f) &&
    f.appActive &&
    f.onHome &&
    !f.labPreviewOpen &&
    !f.micActive &&
    !f.overlaysSuppressed
  );
}

export type PlanName = 'monthly' | 'annual' | 'lifetime';

/** What the purchase flow hands over. */
export type PurchaseNote = {
  plan: PlanName;
  amount: number;
  currency: string;
};

export type PurchaseEvent = {
  amount: number;
  currency: string;
  parameters: { fb_content_id: PlanName };
};

/** The ONE shape that reaches Meta: built field by field, so anything else on
 *  the object stays behind. Null when the store gave no usable price. */
export function buildPurchaseEvent(note: PurchaseNote): PurchaseEvent | null {
  const plan = note.plan;
  if (plan !== 'monthly' && plan !== 'annual' && plan !== 'lifetime') return null;
  if (typeof note.amount !== 'number' || !Number.isFinite(note.amount) || note.amount <= 0) return null;
  if (typeof note.currency !== 'string' || !/^[A-Z]{3}$/.test(note.currency)) return null;
  return { amount: note.amount, currency: note.currency, parameters: { fb_content_id: plan } };
}

/** Library surface in use: react-native-fbsdk-next 13.4.3, FBSettings. */
export type FbSettings = {
  initializeSDK(): void;
  setAutoLogAppEventsEnabled(enabled: boolean): void;
  setAdvertiserIDCollectionEnabled(enabled: boolean): void;
  setAdvertiserTrackingEnabled(enabled: boolean): Promise<boolean>;
};

/** Library surface in use: FBAppEventsLogger. Deliberately no setUserID,
 *  setUserData or logProductItem. */
export type FbLogger = {
  logEvent(name: string): void;
  logPurchase(amount: number, currency: string, parameters: Record<string, string>): void;
  flush(): void;
};

/** expo-tracking-transparency 57. */
export type TrackingAnswer = { granted: boolean; status: string };
export type TrackingApi = {
  isAvailable(): boolean;
  getTrackingPermissionsAsync(): Promise<TrackingAnswer>;
  requestTrackingPermissionsAsync(): Promise<TrackingAnswer>;
};

export type MetaDevice = {
  gateFacts(): GateFacts;
  modalFacts(): ModalFacts;
  calmFacts(): CalmFacts;
  /** Android: runs FacebookSdk.sdkInitialize (see modules/ape-meta-init).
   *  iOS: nothing to do, Settings.initializeSDK does the real work. */
  initNative(): Promise<boolean>;
  loadSettings(): FbSettings | null;
  /** Evaluating the library's logger creates its native module, so this comes
   *  only after the SDK is initialized (Android throws otherwise). */
  loadLogger(): FbLogger | null;
  loadTracking(): TrackingApi | null;
  /** App opens on this device, this one included. Null: storage unreadable. */
  appSessions(): Promise<number | null>;
  now(): number;
  after(ms: number, run: () => void): void;
};

export type MetaPhase = 'idle' | 'waiting' | 'starting' | 'on' | 'off';

export type MetaEngine = {
  noteMemberGate(gate: MemberGateState): void;
  noteAppOpen(): void;
  notePurchase(note: PurchaseNote): void;
  phase(): MetaPhase;
};

export function createMetaEngine(device: MetaDevice): MetaEngine {
  let phase: MetaPhase = 'idle';
  let gate: MemberGateState | null = null;
  let settings: FbSettings | null = null;
  let logger: FbLogger | null = null;
  let lastOpenAt: number | null = null;
  let startChecks = 0;
  let queued: PurchaseNote[] = [];

  const turnOff = () => {
    phase = 'off';
    queued = [];
  };

  /** No device fact can change inside a session, so "no" is final until the
   *  next app open. */
  const allowedOrOff = (): boolean => {
    if (phase === 'off') return false;
    let allowed = false;
    try {
      allowed = metaAllowed(device.gateFacts());
    } catch {
      allowed = false;
    }
    if (!allowed) turnOff();
    return allowed;
  };

  /** "Ask App Not to Track": no IDFA and limited data, the app unchanged. */
  const applyTrackingAnswer = (granted: boolean) => {
    if (!settings) return;
    settings.setAdvertiserIDCollectionEnabled(granted);
    // Only iOS 16 still reads this flag: from iOS 17 FBSDK 17+ takes the
    // answer from ATTrackingManager itself.
    void settings.setAdvertiserTrackingEnabled(granted).catch(() => {});
  };

  const askWhenCalm = (tracking: TrackingApi) => {
    let checks = 0;
    let quietSince: number | null = null;
    const check = () => {
      if (phase !== 'on') return;
      checks += 1;
      if (checks > MAX_CALM_CHECKS) return;
      let calm = false;
      try {
        calm = isCalmNow(gate, device.calmFacts());
      } catch {
        calm = false;
      }
      const now = device.now();
      if (!calm) quietSince = null;
      else if (quietSince === null) quietSince = now;
      if (calm && quietSince !== null && now - quietSince >= CALM_DWELL_MS) {
        tracking
          .requestTrackingPermissionsAsync()
          .then((answer) => applyTrackingAnswer(answer.granted === true))
          .catch(() => {});
        return;
      }
      device.after(CALM_CHECK_MS, check);
    };
    device.after(CALM_CHECK_MS, check);
  };

  const startTracking = async () => {
    const tracking = device.loadTracking();
    if (!tracking || !tracking.isAvailable()) return;
    const current = await tracking.getTrackingPermissionsAsync();
    applyTrackingAnswer(current.granted === true && current.status === 'granted');
    // iOS itself remembers the answer: asked once, ever.
    if (current.status !== 'undetermined') return;
    const opens = await device.appSessions();
    if (opens === null || opens < FIRST_ASK_SESSION) return; // the first run stays free of it
    askWhenCalm(tracking);
  };

  const send = (note: PurchaseNote) => {
    const event = buildPurchaseEvent(note);
    if (!event || !logger) return;
    logger.logPurchase(event.amount, event.currency, event.parameters);
    logger.flush();
  };

  const logOpen = () => {
    const now = device.now();
    if (lastOpenAt !== null && now - lastOpenAt < OPEN_GAP_MS) return;
    lastOpenAt = now;
    logger?.logEvent(META_ACTIVATE_EVENT);
  };

  const begin = async () => {
    phase = 'starting';
    try {
      const { platform } = device.gateFacts();
      if (!(await device.initNative())) return turnOff();
      settings = device.loadSettings();
      if (!settings) return turnOff();
      if (platform === 'ios') settings.initializeSDK();
      settings.setAutoLogAppEventsEnabled(false);
      // iOS collects nothing until the Apple answer says it may (startTracking).
      if (platform === 'android') settings.setAdvertiserIDCollectionEnabled(true);
      logger = device.loadLogger();
      if (!logger) return turnOff();
      phase = 'on';
      logOpen();
      const held = queued;
      queued = [];
      held.forEach(send);
      if (platform === 'ios') await startTracking();
    } catch {
      // A failed start is the same as off: the app never hears about it.
      if (phase !== 'on') turnOff();
    }
  };

  const tryStart = () => {
    if (phase !== 'idle' && phase !== 'waiting') return;
    if (!allowedOrOff()) return;
    let ready = false;
    try {
      ready = canStartNow(gate, device.modalFacts());
    } catch {
      ready = false;
    }
    if (ready) {
      void begin();
      return;
    }
    if (phase === 'waiting') return; // one retry chain at a time
    phase = 'waiting';
    const retry = () => {
      if (phase !== 'waiting') return;
      startChecks += 1;
      if (startChecks > MAX_START_CHECKS) return;
      let nowReady = false;
      try {
        nowReady = canStartNow(gate, device.modalFacts());
      } catch {
        nowReady = false;
      }
      if (nowReady) void begin();
      else device.after(START_RETRY_MS, retry);
    };
    device.after(START_RETRY_MS, retry);
  };

  return {
    noteMemberGate(next) {
      gate = next;
      tryStart();
    },
    noteAppOpen() {
      if (phase === 'on') logOpen();
    },
    notePurchase(note) {
      if (phase === 'on') {
        send(note);
        return;
      }
      if (!allowedOrOff()) return;
      if (queued.length < MAX_QUEUED_PURCHASES) queued.push(note);
      tryStart();
    },
    phase: () => phase,
  };
}
