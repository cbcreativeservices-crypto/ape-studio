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
 *    region of US, CA or AU, on a phone, AND this person's own yes on this
 *    device (owner 2026-11-05). Anything unknown is off. Until that yes, the
 *    SDK is not started and the Apple prompt does not appear.
 *  • ONE QUESTION, asked once, inside the region gate, at the same calm moment
 *    the Apple prompt waits for. No is kept and never asked again. Closing the
 *    popup without choosing saves nothing and is not asked again this launch;
 *    a later launch may ask. Settings carries the same question.
 *  • OFF MEANS OFF AT ONCE. Neither platform's SDK can be shut down once it
 *    has started, so `stopNow` is what stops it: nothing more is logged, auto
 *    flushing is turned off so a queued event stays on the phone, ad id
 *    collection goes off, and the next launch does not start the SDK.
 *  • A KNOWN GUEST NEVER OPTS IN (owner 2026-11-11). Consent belongs to a
 *    person and goes in the account wipe, and a guest is wiped at every launch:
 *    a guest's No could not be kept, so asking would re-ask it for ever. So a
 *    known guest is never asked, not at the calm moment and not from Settings
 *    (the row is hidden for a guest, and `offerConsent` asks nothing for one),
 *    a yes that lands after the session became a known guest is not kept, and
 *    a stored yes never starts Meta for a guest. An UNKNOWN session is not a
 *    guest: it is simply not settled, so nothing starts until it is.
 *  • Only these reach Meta: Meta's install report, the app open with iOS's
 *    session length (`realActivateReportsOpen`), and a purchase with the
 *    store's price and currency. No user id, no email, no Advanced Matching,
 *    no learning data. `buildPurchaseEvent` is an allowlist.
 *  • Automatic logging stays off. On Android that flag is also what keeps the
 *    SDK's session tracker quiet: it cannot be stopped once started, and every
 *    event it makes is dropped while the flag is off, so it cannot count an
 *    open twice or log one after a turn-off.
 *  • After a yes, iOS asks once, at a calm moment after the first run, and only
 *    if iOS has never been asked. After a no, it never asks. "Denied" just
 *    means no IDFA, and the same events go out with limited data.
 *  • Nothing starts while a member gate is unsettled or a popup is up.
 *
 * No feature reads the answer: the only way out of this file is the phase, and
 * the Settings row (growth/metaConsentStore.ts) is the only screen that shows it.
 */

export const META_REGIONS: readonly string[] = ['US', 'CA', 'AU'];

/** The question, word for word as the owner approved it (2026-11-05). The same
 *  popup in both places: the calm moment and the Settings switch. */
export const META_CONSENT_TITLE = 'Help us measure our ads?';
export const META_CONSENT_BODY =
  'If you are 18 or older, you can let us tell Meta when the app is opened or a membership is bought, so we can see which ads work. Your lesson progress and study data are not included. You can change this any time in Settings.';
export const META_CONSENT_YES = "I'm 18+ and agree";
export const META_CONSENT_NO = 'No thanks';
export const META_CONSENT_ROW_LABEL = 'Ad measurement';
export const META_CONSENT_ROW_HINT = 'Lets us tell Meta when the app is opened or a membership is bought.';
export const META_CONSENT_ROW_UNREADABLE = 'This setting could not be read on this phone, so it stays off.';

/** Meta's own standard name for an app activation (Android
 *  AppEventsConstants.EVENT_NAME_ACTIVATED_APP, iOS AppEvents.Name.activatedApp). */
export const META_ACTIVATE_EVENT = 'fb_mobile_activate_app';

/**
 * Does Meta's real activate call report the open by itself? (Read from Meta's
 * source: Android 18.3.0, the version withMetaGuards.js pins, iOS 18.0 to 18.1.1.)
 *
 * The call runs on both platforms, and both send the install report, once ever.
 * Only iOS also reports the open and the session length, through the public
 * logger (FBSDKTimeSpentData). Android's go through InternalAppEventsLogger,
 * which drops them while automatic logging is off. So on Android the plain
 * event is the only open there is, and sending it counts nothing twice.
 */
export function realActivateReportsOpen(platform: string): boolean {
  return platform === 'ios';
}

/** Meta's session rule of thumb: a return within a minute is the same open. */
export const OPEN_GAP_MS = 60_000;
/** How long the screen must stay quiet before either question appears: long
 *  enough for a welcome popup or a reminder that was about to open. */
export const CALM_DWELL_MS = 20_000;
export const CALM_CHECK_MS = 5_000;
/** Ten minutes of checks, then the next app open tries again. */
export const MAX_CALM_CHECKS = 120;
export const START_RETRY_MS = 2_000;
export const MAX_START_CHECKS = 150;
/** Neither question appears on the first app open. */
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
  setFlushBehavior(behavior: 'auto' | 'explicit_only'): void;
};

/** expo-tracking-transparency 57. */
export type TrackingAnswer = { granted: boolean; status: string };
export type TrackingApi = {
  isAvailable(): boolean;
  getTrackingPermissionsAsync(): Promise<TrackingAnswer>;
  requestTrackingPermissionsAsync(): Promise<TrackingAnswer>;
};

/** What the phone holds. Only 'yes' lets Meta run, and only 'unset' may be
 *  asked: 'unreadable' might be a No nobody can see. */
export type ConsentRead = 'yes' | 'no' | 'unset' | 'unreadable';
export type ConsentAnswer = 'yes' | 'no';
/** 'dismissed': the popup was closed without a choice. */
export type ConsentChoice = ConsentAnswer | 'dismissed';

export type MetaDevice = {
  gateFacts(): GateFacts;
  modalFacts(): ModalFacts;
  calmFacts(): CalmFacts;
  /** Android: runs FacebookSdk.sdkInitialize (see modules/ape-meta-init).
   *  iOS: nothing to do, Settings.initializeSDK does the real work. */
  initNative(): Promise<boolean>;
  /** Meta's real activate call (see realActivateReportsOpen). False when this
   *  build has no such call. */
  activateApp(): boolean;
  loadSettings(): FbSettings | null;
  /** Evaluating the library's logger creates its native module, so this comes
   *  only after the SDK is initialized (Android throws otherwise). */
  loadLogger(): FbLogger | null;
  loadTracking(): TrackingApi | null;
  /** App opens on this device, this one included. Null: storage unreadable. */
  appSessions(): Promise<number | null>;
  /** This person's answer on this device. */
  readConsent(): Promise<ConsentRead>;
  /** True only when the phone kept it. */
  saveConsent(answer: ConsentAnswer): Promise<boolean>;
  /** The house popup. `done` runs once, or never if the dialog is cleared. */
  askConsent(done: (choice: ConsentChoice) => void): void;
  now(): number;
  after(ms: number, run: () => void): void;
};

export type MetaPhase = 'idle' | 'waiting' | 'starting' | 'on' | 'off';

export type MetaEngine = {
  /** `knownGuest`: a session CONFIRMED to have no account, never an unknown one. */
  noteMemberGate(gate: MemberGateState, knownGuest?: boolean): void;
  noteAppOpen(): void;
  notePurchase(note: PurchaseNote): void;
  /** Settings, switching on: the same popup. Asks nothing for a known guest. */
  offerConsent(): void;
  /** Settings, switching off. */
  withdrawConsent(): void;
  /** The account wipe took the answer with it. */
  noteConsentWiped(): void;
  phase(): MetaPhase;
};

export function createMetaEngine(device: MetaDevice): MetaEngine {
  let phase: MetaPhase = 'idle';
  let gate: MemberGateState | null = null;
  let knownGuest = false;
  let settings: FbSettings | null = null;
  let logger: FbLogger | null = null;
  let lastOpenAt: number | null = null;
  let activateReportsOpen = false;
  let startChecks = 0;
  let queued: PurchaseNote[] = [];
  /** Null until read. A change made meanwhile outranks a read still out. */
  let consent: ConsentRead | null = null;
  let readingConsent = false;
  /** One question per launch, whatever the answer. */
  let consentAsked = false;
  /** Bumped by every stop and every change of answer: work that began before
   *  one lands nowhere. */
  let startRun = 0;
  let trackingRun = 0;
  let consentRun = 0;

  const turnOff = () => {
    phase = 'off';
    queued = [];
  };

  /** A yes never applies to a known guest, stored or said (the rules above). */
  const consentGiven = () => consent === 'yes' && !knownGuest;

  /** Not a device fact, so unlike turnOff this can be undone by a later yes.
   *  Neither SDK has a shutdown call, so this is everything there is. */
  const stopNow = () => {
    queued = [];
    startRun += 1;
    trackingRun += 1;
    if (phase === 'off' || phase === 'idle') return;
    phase = 'idle';
    try {
      // A queued event stays on the phone: the timer, the event threshold and
      // iOS's persisted-event send all stand down in explicit mode, and only
      // `flush` sends, which nothing here calls while stopped.
      logger?.setFlushBehavior('explicit_only');
      settings?.setAdvertiserIDCollectionEnabled(false);
      void settings?.setAdvertiserTrackingEnabled(false).catch(() => {});
    } catch {
      // Nothing above is what stops our events: the phase is.
    }
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
    if (!settings || phase !== 'on') return;
    settings.setAdvertiserIDCollectionEnabled(granted);
    // Only iOS 16 still reads this flag: from iOS 17 FBSDK 17+ takes the
    // answer from ATTrackingManager itself.
    void settings.setAdvertiserTrackingEnabled(granted).catch(() => {});
  };

  /** The quiet spell both questions wait for. */
  const whenCalm = (wanted: () => boolean, run: () => void) => {
    let checks = 0;
    let quietSince: number | null = null;
    const check = () => {
      if (!wanted()) return;
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
        run();
        return;
      }
      device.after(CALM_CHECK_MS, check);
    };
    device.after(CALM_CHECK_MS, check);
  };

  const startTracking = async () => {
    const run = trackingRun;
    const tracking = device.loadTracking();
    if (!tracking || !tracking.isAvailable()) return;
    const current = await tracking.getTrackingPermissionsAsync();
    applyTrackingAnswer(current.granted === true && current.status === 'granted');
    // iOS itself remembers the answer: asked once, ever.
    if (current.status !== 'undetermined') return;
    const opens = await device.appSessions();
    if (opens === null || opens < FIRST_ASK_SESSION) return; // the first run stays free of it
    whenCalm(
      () => phase === 'on' && run === trackingRun,
      () => {
        tracking
          .requestTrackingPermissionsAsync()
          .then((answer) => applyTrackingAnswer(answer.granted === true))
          .catch(() => {});
      },
    );
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
    let activated = false;
    try {
      activated = device.activateApp();
    } catch {
      activated = false;
    }
    if (!activated || !activateReportsOpen) logger?.logEvent(META_ACTIVATE_EVENT);
  };

  const begin = async () => {
    startRun += 1;
    const run = startRun;
    phase = 'starting';
    try {
      const { platform } = device.gateFacts();
      activateReportsOpen = realActivateReportsOpen(platform);
      // Off and on again in one launch: the SDK is still up, so it is not
      // started twice, it is only told to send again.
      const resuming = settings !== null && logger !== null;
      if (!resuming) {
        const ready = await device.initNative();
        if (run !== startRun) return;
        if (!ready) return turnOff();
        settings = device.loadSettings();
        if (!settings) return turnOff();
        if (platform === 'ios') settings.initializeSDK();
        settings.setAutoLogAppEventsEnabled(false);
      }
      // iOS collects nothing until the Apple answer says it may (startTracking).
      if (platform === 'android') settings?.setAdvertiserIDCollectionEnabled(true);
      if (resuming) logger?.setFlushBehavior('auto');
      else logger = device.loadLogger();
      if (!logger) return turnOff();
      phase = 'on';
      logOpen();
      const held = queued;
      queued = [];
      held.forEach(send);
      if (platform === 'ios') await startTracking();
    } catch {
      // A failed start is the same as off: the app never hears about it.
      if (run === startRun && phase !== 'on') turnOff();
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

  const withdraw = () => {
    consentRun += 1;
    stopNow(); // first, and in this tick: logging stops before anything is saved
    consent = 'no';
    void device.saveConsent('no').catch(() => false);
  };

  const takeAnswer = async (choice: ConsentChoice) => {
    if (choice === 'dismissed') return; // nothing chosen, nothing saved
    if (choice === 'no') {
      withdraw();
      return;
    }
    // The popup may have opened before the session settled as a known guest.
    if (knownGuest) return;
    consentRun += 1;
    const run = consentRun;
    let saved = false;
    try {
      saved = await device.saveConsent('yes');
    } catch {
      saved = false;
    }
    if (!saved || run !== consentRun) return; // a yes the phone could not keep starts nothing
    consent = 'yes';
    decide();
  };

  /** Every question goes through here, so a known guest is never asked. */
  const ask = () => {
    if (knownGuest) return;
    consentAsked = true;
    try {
      device.askConsent((choice) => void takeAnswer(choice));
    } catch {
      // No popup means no answer, and no answer means off.
    }
  };

  const askWhenCalm = async () => {
    if (consentAsked) return;
    consentAsked = true;
    let opens: number | null = null;
    try {
      opens = await device.appSessions();
    } catch {
      opens = null;
    }
    if (opens === null || opens < FIRST_ASK_SESSION) return; // the first run stays free of it
    whenCalm(() => consent === 'unset' && !knownGuest && phase !== 'off', ask);
  };

  /** Every change of gate or answer comes here. */
  function decide(): void {
    if (phase === 'off') return;
    if (consentGiven()) {
      tryStart();
      return;
    }
    stopNow(); // a purchase from before a yes is never sent after it
    if (consent === 'unset' && !knownGuest) void askWhenCalm();
  }

  const loadConsent = async () => {
    if (readingConsent) return;
    readingConsent = true;
    let read: ConsentRead = 'unreadable';
    try {
      read = await device.readConsent();
    } catch {
      read = 'unreadable';
    }
    readingConsent = false;
    if (consent === null) consent = read;
    decide();
  };

  return {
    noteMemberGate(next, guest = false) {
      gate = next;
      knownGuest = guest;
      if (!allowedOrOff()) return;
      if (consent === null) void loadConsent();
      else decide();
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
      // Held only for a yes, or for the read that will say whether there is one.
      if (consent !== null && !consentGiven()) return;
      if (queued.length < MAX_QUEUED_PURCHASES) queued.push(note);
      if (consent === null) void loadConsent();
      else tryStart();
    },
    offerConsent() {
      // Defence in depth: Settings hides the row for a guest (owner 2026-11-11).
      if (knownGuest) return;
      ask();
    },
    withdrawConsent() {
      withdraw();
    },
    noteConsentWiped() {
      consentRun += 1;
      stopNow();
      consent = 'unset';
      // The next person is asked on a later launch, not over this one's end.
      consentAsked = true;
    },
    phase: () => phase,
  };
}
