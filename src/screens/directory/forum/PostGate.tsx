/**
 * Who may post, on EVERY post control (Comp A brief 2026-11-09 rev 2, §4a/§4b;
 * owner-approved 2026-11-10).
 *
 * The 2026-11-09 deadlock: the community rules popup was reached only by
 * posting, and posting was off until the rules were agreed, so no new member
 * could ever post. Now a post control is never left dead:
 *  - rules not agreed: the tap opens the rules popup; I AGREE records it, reads
 *    forum_me again and goes straight on to what was tapped (the composer);
 *    NOT NOW posts nothing.
 *  - any other reason: a short popup says why, with one button to the fix.
 *    Back from that fix, the standing is read again and the next blocker (if
 *    any) is shown, so the member is led one step at a time.
 *
 * One decision (rules.ts postStep), one wording table (rules.ts blockSheet),
 * one host (this file), for START A TOPIC, ASK, a reply, SHARE AN IDEA and
 * Discuss this lab. None of it is enforcement: the server still refuses.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useAfterModalsClose } from '../../../components/DimModal';
import { notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { fetchPostStanding, type PostStanding } from '../../../features/forum/api';
import { useForumFlags } from '../../../features/forum/forumFlags';
import {
  RULES_NOT_SAVED,
  blockSheet,
  followUpStep,
  postStep,
  refusalStep,
  type BlockDest,
  type PostAction,
  type PostStep,
} from '../../../features/forum/rules';
import { sampleFix } from '../../../features/forum/sampleSwitch';
import { registerLocalStoreReset } from '../../../features/storage/localStoreRegistry';
import { openMyProfile } from './forumBits';
import { BlockedPopup, RulesPopup } from './forumPopups';

/** Which control: its category (null for a lab thread) and start or reply. */
export type GateWhere = { slug: string | null; action: PostAction };
/** Where the composer is, for going on from another screen (back from a fix). */
export type GateIntent = { route: string; params?: Record<string, unknown> };

type SheetStep = Extract<PostStep, { kind: 'sheet' }>;
type Shown =
  | { kind: 'rules'; where: GateWhere; go: (() => void) | null; intent: GateIntent | null }
  | { kind: 'sheet'; step: SheetStep; mutedUntil: string | null; where: GateWhere; intent: GateIntent | null };

/**
 * The member followed a popup's button to My Profile. Kept here, not on the
 * screen: MY PROFILE pops back to the Audio Community screen, so the screen
 * that sent them is gone. The next forum screen in front reads the standing
 * again and shows what is left. An hour later it is forgotten.
 */
let pendingFix: {
  code: string | null;
  where: GateWhere;
  intent: GateIntent | null;
  at: number;
  /** A forum screen has been out of the front since: only then is the member
   *  "back". The Audio Community screen can be in front for a moment before
   *  its MY PROFILE tab opens, and asking then would ask too soon. */
  away: boolean;
} | null = null;
const PENDING_MS = 60 * 60 * 1000;

/** The account wipe: nothing carried to the next account. */
export function clearPendingFix(): void {
  pendingFix = null;
}
registerLocalStoreReset(clearPendingFix);

const decide = (s: PostStanding | null | undefined, where: GateWhere): PostStep =>
  postStep(s?.me ?? null, where.slug ? (s?.rights?.find((r) => r.slug === where.slug) ?? null) : null, where.action);

export type PostGate = {
  /**
   * A post control was tapped. `known` is what the screen already read
   * (undefined: nothing, so it is read now); `go` opens the composer.
   */
  press: (where: GateWhere, known: PostStanding | null | undefined, go: () => void, intent?: GateIntent | null) => void;
  /** A post call was refused: true when the refusal is about who may post and
   *  its popup is now showing (the same popup as a tap would show). */
  refused: (code: string | null | undefined, where: GateWhere) => boolean;
  /** The standing is being read after a tap. */
  checking: boolean;
  /** The popups. Render once, anywhere in the screen. */
  host: ReactNode;
};

export function usePostGate(opts: {
  /** False while the screen is there but not in front (a hidden tab). */
  active?: boolean;
  /** Another popup has the screen (the first-visit welcome): wait for it. */
  hold?: boolean;
  /** How this screen opens My Profile (the forum home switches its own tab). */
  onOpenProfile?: () => void;
} = {}): PostGate {
  const navigation = useNavigation() as unknown as { navigate: (route: string, params?: object) => void };
  const focused = useIsFocused();
  const flags = useForumFlags();
  // One popup goes before the next comes, and nothing opens while one is still
  // fading (iOS refuses to present then): the house hand-off.
  const afterClose = useAfterModalsClose();
  const [shown, setShown] = useState<Shown | null>(null);
  const [checking, setChecking] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const show = useCallback(
    (step: PostStep, standing: PostStanding | null | undefined, where: GateWhere, go: (() => void) | null, intent: GateIntent | null) => {
      if (step.kind === 'rules') setShown({ kind: 'rules', where, go, intent });
      else if (step.kind === 'sheet') {
        setShown({ kind: 'sheet', step, mutedUntil: standing?.me?.mutedUntil ?? null, where, intent });
      }
    },
    [],
  );

  const press = useLatchedPress(
    async (where: GateWhere, known: PostStanding | null | undefined, go: () => void, intent: GateIntent | null = null) => {
      // What the screen read says the member may post: straight on. The post
      // call still answers, and a refusal there opens the same popup.
      const first = known === undefined ? null : decide(known, where);
      if (first?.kind === 'open') {
        go();
        return;
      }
      // Blocked, or nothing read yet: ask again now (the fix may just be done).
      setChecking(true);
      const fresh = await fetchPostStanding();
      if (!mounted.current) return;
      setChecking(false);
      const standing = fresh.ok ? fresh.value : known;
      const step = fresh.ok ? decide(fresh.value, where) : (first ?? { kind: 'open' as const });
      if (step.kind === 'open') {
        go();
        return;
      }
      show(step, standing, where, go, intent);
    },
  );

  const refused = useCallback(
    (code: string | null | undefined, where: GateWhere) => {
      const step = refusalStep(code);
      if (!step || step.kind === 'open') return false;
      afterClose(() => show(step, null, where, null, null));
      return true;
    },
    [afterClose, show],
  );

  /** Goes on to what was tapped, on this screen or (back from a fix) another. */
  const goOn = useCallback(
    (go: (() => void) | null, intent: GateIntent | null) => {
      if (go) go();
      else if (intent) navigation.navigate(intent.route, intent.params);
    },
    [navigation],
  );

  /* ── I AGREE ─────────────────────────────────────────────────────── */
  const agree = useLatchedPress(async () => {
    const now = shown;
    if (!now || now.kind !== 'rules') return;
    setAgreeing(true);
    // On the phone AND on the account (forum_rules_accept); true only when a
    // write kept it.
    const ok = await flags.acceptRules();
    const fresh = ok ? await fetchPostStanding() : null;
    if (!mounted.current) return;
    setAgreeing(false);
    setShown(null);
    if (!ok) {
      afterClose(() => notify('Not saved', RULES_NOT_SAVED));
      return;
    }
    // A failed read: go on, and let the post call answer.
    const step: PostStep = fresh?.ok ? decide(fresh.value, now.where) : { kind: 'open' };
    if (step.kind === 'open') {
      afterClose(() => goOn(now.go, now.intent));
      return;
    }
    // The server still has no agreement: it was not recorded there.
    if (step.kind === 'rules') {
      afterClose(() => notify('Not saved', RULES_NOT_SAVED));
      return;
    }
    // Another blocker is left: say so next.
    afterClose(() => show(step, fresh?.ok ? fresh.value : null, now.where, now.go, now.intent));
  });

  /* ── A popup's one button ────────────────────────────────────────── */
  const goTo = useCallback(
    (dest: BlockDest, code: string | null) => {
      if (dest === 'profile') {
        if (opts.onOpenProfile) opts.onOpenProfile();
        else openMyProfile(navigation);
      } else if (dest === 'credentials') {
        navigation.navigate('Awards', { category: 'specialization' });
      } else {
        // The app's one way to reach support: the mail composer, filled in.
        const { sendFeedback } = require('../../../lib/feedback') as typeof import('../../../lib/feedback');
        sendFeedback('question', 'Forum: I cannot post', { forumReason: code });
      }
    },
    [navigation, opts.onOpenProfile],
  );

  const sheetNow = shown?.kind === 'sheet' ? shown : null;
  const words = sheetNow ? blockSheet(sheetNow.step.sheet, sheetNow.step.code, { mutedUntil: sheetNow.mutedUntil }) : null;

  const follow = useCallback(() => {
    if (!sheetNow || !words?.button) return;
    const { dest } = words.button;
    const code = sheetNow.step.code;
    setShown(null);
    if (dest === 'profile') {
      pendingFix = { code, where: sheetNow.where, intent: sheetNow.intent, at: Date.now(), away: false };
    }
    afterClose(() => goTo(dest, code));
  }, [afterClose, goTo, sheetNow, words]);

  /* ── Back from a fix ─────────────────────────────────────────────── */
  const live = focused && (opts.active ?? true) && !opts.hold;
  useEffect(() => {
    const p = pendingFix;
    if (!p) return undefined;
    if (!live) {
      p.away = true;
      return undefined;
    }
    if (!p.away || shown) return undefined;
    if (Date.now() - p.at > PENDING_MS) {
      pendingFix = null;
      return undefined;
    }
    // Dev sample only: stands in for the member having fixed it there.
    sampleFix(p.code);
    let alive = true;
    void fetchPostStanding().then((r) => {
      if (!alive || !mounted.current || !r.ok || pendingFix !== p) return;
      const fresh = decide(r.value, p.where);
      const next = followUpStep(p.code, fresh);
      // Nothing left: done. The same blocker still there: they came back
      // without fixing it, and are not asked again until they tap.
      if (fresh.kind === 'open') pendingFix = null;
      if (!next) return;
      pendingFix = null;
      afterClose(() => show(next, r.value, p.where, null, p.intent));
    });
    return () => {
      alive = false;
    };
    // Each time this screen comes to the front, and each time its focus or
    // tab changes behind (MY PROFILE can open its tab before or after the
    // screen's focus returns: either order marks the member away).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, focused, opts.active]);

  const host = (
    <>
      <RulesPopup
        visible={shown?.kind === 'rules'}
        onAccept={agree}
        onClose={() => setShown(null)}
        busy={agreeing}
      />
      <BlockedPopup sheet={words} onFollow={follow} onClose={() => setShown(null)} />
    </>
  );

  return { press, refused, checking, host };
}

/**
 * For a control that lives outside the forum (Discuss this lab, on a lab's end
 * screen): mounted on the first tap only, so the lab carries none of the forum
 * until then, and kept mounted after so a hand-off is never cut off. Each new
 * `request` is one press.
 */
export function PostGateOnce({
  request,
}: {
  request: { where: GateWhere; known: PostStanding | null | undefined; go: () => void; intent: GateIntent | null };
}) {
  const gate = usePostGate();
  const press = gate.press;
  useEffect(() => {
    press(request.where, request.known, request.go, request.intent);
  }, [press, request]);
  return <>{gate.host}</>;
}
