/**
 * DimModal — a drop-in replacement for react-native's `Modal` that keeps
 * Low-Light Production Mode's promise.
 *
 * WHY THIS EXISTS. A React Native `Modal` renders in its OWN native container,
 * above everything the app's view tree paints — so the low-light dim wash never
 * reaches inside one. The mode promises "the display stays dim and steady, so
 * nothing flashes during a show", and every un-washed modal breaks it: tap a
 * glossary term or open a colour picker mid-show and the screen jumps to full
 * brightness.
 *
 * Three modals (ShareTermSheet, StudyFsOverlay, TrophyModal) had already hit
 * this and each hand-mounted `<LowLightDim />` inside itself. Twenty-six others
 * had not — which is the real problem: remembering is not a mechanism. Import
 * `Modal` from here and the wash comes with it.
 *
 * Everything else is untouched: props pass straight through, and `LowLightDim`
 * renders null whenever the mode is off (or while the activation notice is
 * still being read), so this costs nothing in the normal case.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Modal as RNModal, StyleSheet, View, type ModalProps } from 'react-native';
import { LowLightDim } from '../features/settings/LowLightLayer';
import { ALL_ORIENTATIONS } from './modalOrientations';

/**
 * ⛔ iOS CRASHES A MODAL THAT CANNOT FACE THE WAY THE APP IS FACING.
 *
 * `supportedOrientations` defaults to `['portrait']`. Present a Modal while the
 * interface is locked LANDSCAPE and UIKit raises
 * `UIApplicationInvalidInterfaceOrientation` — "supported orientations has no
 * common orientation with the application" — which is a hard native crash, not
 * a JS error anything can catch.
 *
 * CRASH, reported 2026-09-23: SPL Meter → fullscreen → colour wheel. The
 * fullscreen VU/Gauge sets `orientation: 'landscape'`
 * (SplMeterScreen.tsx:883), and the colour wheel opens LedColorPicker, which is
 * one of these. The lesson was already known and written down — in
 * `HarmonographViewer.tsx:15`, as "MODAL RULES (SplMeter lessons): ONE native
 * Modal, both-orientation supportedOrientations for iOS" — but it was recorded
 * in the file that LEARNED it rather than enforced anywhere, so the SPL Meter's
 * own picker never got it. That is this file's whole argument, already made
 * above for the low-light wash: remembering is not a mechanism.
 *
 * Allowing every orientation does NOT let a modal spin freely on a locked
 * screen. react-native-screens owns the lock and the modal follows the
 * interface; this only stops UIKit refusing to present it at all. A caller that
 * genuinely needs to pin a modal can still pass its own value.
 */

/**
 * ⛔ A SECOND MODAL CANNOT OPEN OVER THE FIRST (bug hunt 2026-09-29).
 *
 * The audio-output gate, the Sound Safety Warning and the app's dialogs are
 * mounted at the app root. Ask one of them for a popup while another Modal is
 * already up — a lab's FULL SCREEN view, a sheet, a guided lesson — and:
 *
 *   • iOS presents a root-level Modal from the root view controller, which is
 *     already presenting the open one. UIKit refuses ("already presenting")
 *     and NOTHING appears;
 *   • Android attaches it to the activity window, BELOW the open Dialog, so
 *     it is drawn behind the sheet that asked for it.
 *
 * Either way the caller is left awaiting a popup nobody can see or touch —
 * `requestAudioOutput()` never settles, and every ▶ that asks for sound reads
 * as dead. That is the owner's open iPhone report ("▶ in the Bass lab does
 * nothing", 2026-09-27).
 *
 * THE MECHANISM, so no caller has to remember it: every visible DimModal
 * registers here as a HOST. A root-level surface that knows it may be asked
 * for while a Modal is open (see `useModalHostOpen`) publishes its card with
 * `setHostedOverlay` instead of opening its own Modal, and the TOPMOST open
 * host draws it as an in-tree overlay — the `embedded` pattern of
 * PrePaywallPrompt, applied generically. Topmost = deepest nesting, then the
 * most recently opened — counting only hosts whose `onShow` has fired when
 * there are any, because a Modal that iOS itself refused to present (the very
 * failure above) is `visible` but not on screen, and a card drawn inside it
 * would be just as invisible.
 *
 * Android BACK arrives at the host's onRequestClose; while it carries an
 * overlay, BACK goes to the overlay's own `onBack` instead, so it dismisses
 * the popup and not the sheet underneath it.
 */
type HostedOverlay = { node: ReactNode; onBack: () => void };

/**
 * More than one root surface publishes (bug hunt 2026-09-30): the audio gate
 * AND the app's confirm/notice dialogs (AppDialog). One shared slot let each
 * wipe the other — the gate re-publishes (null when closed) on every render —
 * so overlays are KEYED. They draw in publish order, the latest on top, and
 * Android BACK goes to the topmost.
 */
const hosted = new Map<string, HostedOverlay>();
const NO_OVERLAYS: (HostedOverlay & { key: string })[] = [];
let hostedList: (HostedOverlay & { key: string })[] = NO_OVERLAYS;

let hostSeq = 0;
/** `publisher`: the Modal of a surface that itself publishes into hosts when
 *  another Modal is open (AppDialog). It still HOSTS, but it must not count as
 *  "another Modal" to its own publisher, or it would flip itself in and out. */
let openHosts: { id: number; depth: number; shown: boolean; publisher: boolean }[] = [];
/** When the last host closed — its dismissal is still animating for a while. */
let lastHostClosedAt = 0;
/**
 * iOS will not present a Modal from a view controller whose previous Modal is
 * still animating away: the request is refused and NOTHING appears (the
 * audio gate learned this first — its `rootHold`). A root surface that is
 * asked for just as a host closes waits this long before presenting its own.
 */
export const HOST_DISMISS_MS = 450;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of Array.from(listeners)) l();
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function topHostId(): number | null {
  const shown = openHosts.filter((h) => h.shown);
  let top: { id: number; depth: number } | null = null;
  for (const h of shown.length ? shown : openHosts) {
    if (!top || h.depth >= top.depth) top = h; // later wins a tie
  }
  return top?.id ?? null;
}
function markShown(id: number): void {
  if (!openHosts.some((h) => h.id === id && !h.shown)) return;
  openHosts = openHosts.map((h) => (h.id === id ? { ...h, shown: true } : h));
  emit();
}
function openHostCount(): number {
  return openHosts.length;
}
function openNonPublisherCount(): number {
  return openHosts.filter((h) => !h.publisher).length;
}
function hostedNow(): (HostedOverlay & { key: string })[] {
  return hostedList;
}

/** True while any DimModal is on screen — a root popup must then be hosted.
 *  `exceptPublishers`: ignore publisher Modals (AppDialog asking about others). */
export function useModalHostOpen(exceptPublishers = false): boolean {
  const count = exceptPublishers ? openNonPublisherCount : openHostCount;
  return useSyncExternalStore(subscribe, count, count) > 0;
}

/** Milliseconds a root Modal should still wait for a closing host to finish
 *  animating away (0 = present now). See HOST_DISMISS_MS. */
export function rootModalHoldMs(now = Date.now()): number {
  return Math.max(0, lastHostClosedAt + HOST_DISMISS_MS - now);
}

/** Hand a card to the topmost open DimModal (or clear it with null). `key`
 *  names the publisher, so two publishers never overwrite each other. */
export function setHostedOverlay(overlay: HostedOverlay | null, key = 'gate'): void {
  if (overlay === (hosted.get(key) ?? null)) return;
  if (overlay) hosted.set(key, overlay);
  else hosted.delete(key);
  hostedList = hosted.size ? Array.from(hosted, ([k, o]) => ({ ...o, key: k })) : NO_OVERLAYS;
  emit();
}

/** Nesting depth, so a Modal opened inside another's tree ranks above it. */
const HostDepth = createContext(0);

export function Modal({
  children,
  supportedOrientations = ALL_ORIENTATIONS,
  hostsOverlays = true,
  overlayPublisher = false,
  ...rest
}: ModalProps & {
  children?: ReactNode;
  /** false for the root surfaces that PUBLISH overlays (the audio gate), so
   *  their own Modal is never mistaken for a host. */
  hostsOverlays?: boolean;
  /** The Modal of a surface that publishes when OTHER Modals are open but can
   *  host the audio gate itself (AppDialog) — see `useModalHostOpen`. */
  overlayPublisher?: boolean;
}) {
  const depth = useContext(HostDepth) + 1;
  const [id] = useState(() => ++hostSeq);
  const registered = hostsOverlays && !!rest.visible;

  // Layout effect: registered before any native onShow can arrive for it.
  useLayoutEffect(() => {
    if (!registered) return;
    openHosts = [...openHosts, { id, depth, shown: false, publisher: overlayPublisher }];
    emit();
    return () => {
      openHosts = openHosts.filter((h) => h.id !== id);
      lastHostClosedAt = Date.now();
      emit();
    };
  }, [registered, id, depth, overlayPublisher]);

  // Only the topmost open host ever sees the overlays; every other DimModal's
  // snapshot stays empty, so publishing re-renders nothing but that one.
  const mine = useSyncExternalStore(
    subscribe,
    () => (registered && topHostId() === id ? hostedNow() : NO_OVERLAYS),
    () => NO_OVERLAYS,
  );
  const topOverlay = mine.length ? mine[mine.length - 1] : null;

  const { onRequestClose, onShow } = rest;
  return (
    <RNModal supportedOrientations={supportedOrientations}
      {...rest}
      onRequestClose={(e) => {
        if (topOverlay) topOverlay.onBack();
        else onRequestClose?.(e);
      }}
      onShow={(e) => {
        markShown(id);
        onShow?.(e);
      }}
    >
      <HostDepth.Provider value={depth}>
        {children}
        {mine.map((o) => (
          <View key={o.key} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {o.node}
          </View>
        ))}
      </HostDepth.Provider>
      {/* Last child, so it washes over the modal's own content. It is
          pointerEvents="none", so nothing below it loses a touch. */}
      <LowLightDim />
    </RNModal>
  );
}

export type { ModalProps };
