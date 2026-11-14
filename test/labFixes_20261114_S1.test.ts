/**
 * Lab fix round 2026-11-14 · group S1: arrival order, tap-swallowing, Sound
 * Safety, the screen-guide hint, and three term cards.
 *
 * Owner approval (2026-11-14): "Begin fixing all bugs found and do obvious
 * (my decision is not required) fixes as you suggestted in the report", then
 * the report's suggested order: 2. arrival order and tap-swallowing
 * (section 3, row 1); 3. Sound Safety behaviour (row 2); quick wins 1, 2, 5, 9.
 *
 * Owner decision, 2026-11-14, on WHEN the Sound Safety sheet appears:
 * "Once per session (Recommended)": asked on the first sound lab of a
 * session; KEEP SOUND OFF is honoured until the app is closed; a new app
 * launch asks again. "This warning appears once." becomes "...appears once
 * each time you open the app."
 *
 * Every test below fails on the code as it was before this round.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'ape-s1:async-storage', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'ape-s1:async-storage') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const m = new Map(); export default {
          async getItem(k) { return m.has(k) ? m.get(k) : null; },
          async setItem(k, v) { m.set(k, String(v)); },
          async removeItem(k) { m.delete(k); },
          async getAllKeys() { return [...m.keys()]; },
          async multiRemove(ks) { for (const k of ks) m.delete(k); },
        };`,
      };
    }
    return nextLoad(url, context);
  },
});

const ack = await import('../src/features/audio/soundSafetyAck.ts');
const text = await import('../src/features/audio/soundSafetyText.ts');
const SI = await import('../src/features/intro/screenIntros.ts');
const L = await import('../src/features/intro/labTermIntros.ts');
const DATA = await import('../src/features/intro/labTermIntroData.ts');
const SHG = await import('../src/features/startHere/startHereGlossary.ts');

const src = (p: string) =>
  readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments blanked, so a regex never matches a comment. */
const code = (p: string) =>
  src(p)
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
/** One top-level function's text, from its signature to the next top-level declaration. */
const block = (s: string, start: string) => {
  const i = s.indexOf(start);
  if (i < 0) return '';
  const rest = s.slice(i + start.length);
  const j = rest.search(/\n(?:export )?(?:function|const|let|type) /);
  return start + (j < 0 ? rest : rest.slice(0, j));
};

// ───────────────────────────────────────────────────────── Sound Safety (row 2) ──

describe('Sound Safety: once per session (owner 2026-11-14, "Once per session (Recommended)")', () => {
  it('the switch holds the owner’s choice: after KEEP SOUND OFF only a deliberate "turn sound on" may ask', () => {
    assert.deepEqual([...ack.SOUND_SAFETY_ASK_AFTER_DECLINE], ['deliberate']);
    // Before any decline: the first sound lab of a session asks, whatever the kind.
    for (const k of ['auto', 'play', 'deliberate'] as const) assert.equal(ack.soundSafetyMayAsk(k, false), true, k);
    // After a decline: honoured until the app is closed.
    assert.equal(ack.soundSafetyMayAsk('auto', true), false);
    assert.equal(ack.soundSafetyMayAsk('play', true), false);
    assert.equal(ack.soundSafetyMayAsk('deliberate', true), true);
    // The other answer is one word in the list: ▶ re-asks.
    assert.equal(ack.soundSafetyMayAsk('play', true, ['deliberate', 'play']), true);
  });

  it('decision: refused without a sheet after a decline; an arrival ask over work or a card is dropped, not refused', () => {
    const d = (o: Partial<Parameters<typeof ack.soundSafetyDecision>[0]>) =>
      ack.soundSafetyDecision({ kind: 'play', declined: false, workUnderway: false, cardOwed: false, ...o });
    assert.equal(d({}), 'show');
    assert.equal(d({ declined: true }), 'refuse');
    assert.equal(d({ declined: true, kind: 'deliberate' }), 'show');
    assert.equal(d({ kind: 'auto', workUnderway: true }), 'drop', 'never over an open tray');
    assert.equal(d({ kind: 'auto', cardOwed: true }), 'drop', 'never over an intro card');
    // A ▶ the learner tapped is answered even mid-work (that tap IS the work).
    assert.equal(d({ kind: 'play', workUnderway: true }), 'show');
  });

  it('a session: asked once, then KEEP SOUND OFF is honoured; a deliberate act asks again; a new person is asked', () => {
    ack.clearSoundSafetySession();
    const env = { workUnderway: false, cardOwed: false };
    assert.equal(ack.decideSoundSafetyOpen(env), 'show');
    // Sticky while it is up (a re-render, the gate's re-present): never re-decided.
    assert.equal(ack.decideSoundSafetyOpen({ workUnderway: true, cardOwed: true }), 'show');
    ack.noteSoundSafetyDeclined();
    assert.equal(ack.isSoundSafetyDeclinedThisSession(), true);
    assert.equal(ack.decideSoundSafetyOpen(env), 'refuse', 'the next lab does not ask again');
    ack.clearSoundAsk();
    ack.markSoundAsk('deliberate');
    assert.equal(ack.decideSoundSafetyOpen(env), 'show', 'Profile › AUDIO OUTPUT still asks');
    ack.clearSoundAsk();
    // The account wipe (resetSoundSafetyAck) forgets the decline: the safe side.
    ack.resetSoundSafetyAck();
    assert.equal(ack.isSoundSafetyDeclinedThisSession(), false);
    ack.clearSoundSafetySession();
  });

  it('a mark names only the request right after it, and a joined tap keeps the stronger mark', () => {
    ack.clearSoundSafetySession();
    ack.markSoundAsk('auto', 1000);
    assert.equal(ack.pendingSoundAskKind(1100), 'auto');
    assert.equal(ack.pendingSoundAskKind(1000 + ack.SOUND_ASK_MARK_MS + 1), 'play', 'a stale mark never re-labels a later ▶');
    ack.markSoundAsk('deliberate', 2000);
    ack.markSoundAsk('auto', 2010);
    assert.equal(ack.pendingSoundAskKind(2020), 'deliberate');
    ack.clearSoundSafetySession();
  });

  it('the footnote says when it really appears, and is not part of the agreed text (no version bump)', () => {
    assert.match(text.SOUND_SAFETY_FOOTNOTE, /appears once each time you open the app/);
    assert.doesNotMatch(text.SOUND_SAFETY_FOOTNOTE, /^This warning appears once\./);
    assert.ok(!text.soundSafetyFullText().includes(text.SOUND_SAFETY_FOOTNOTE));
    const w = code('features/audio/SoundSafetyWarning.tsx');
    assert.match(w, /\{SOUND_SAFETY_FOOTNOTE\}/);
    assert.doesNotMatch(src('features/audio/SoundSafetyWarning.tsx'), /This warning appears once\. The Pro Audio/);
  });

  it('SN2: Profile › AUDIO OUTPUT hold is the deliberate act, so it still asks after a KEEP SOUND OFF', () => {
    const row = code('features/audio/AudioOutputRow.tsx');
    assert.match(row, /import \{ isAcknowledged, markSoundAsk \} from '\.\/soundSafetyAck';/);
    assert.match(row, /markSoundAsk\('deliberate'\);\s*void requestAudioOutput\(\)\.then\(/);
    // …and that mark really does reopen the sheet after a decline.
    ack.clearSoundSafetySession();
    ack.noteSoundSafetyDeclined();
    assert.equal(ack.decideSoundSafetyOpen({ workUnderway: false, cardOwed: false }), 'refuse');
    ack.markSoundAsk('deliberate');
    assert.equal(ack.decideSoundSafetyOpen({ workUnderway: false, cardOwed: false }), 'show');
    ack.clearSoundSafetySession();
  });

  it('SN3: Android BACK on the HOSTED sheet is KEEP SOUND OFF too (remembered for the session)', () => {
    const gate = code('features/audio/AudioOutputGate.tsx');
    assert.match(gate, /const onHostedBack = \(\) => \{\s*if \(phaseRef\.current === 'safety'\) noteSoundSafetyDeclined\(\);\s*settle\(false\);\s*\};/);
    assert.match(gate, /setHostedOverlay\(hostedBody \? \{ node: hostedBody, onBack: onHostedBack \} : null\);/);
  });
});

describe('Sound Safety: the sheet itself (row 2: pinned, never vanishing, never see-through, never mid-tap)', () => {
  const w = code('features/audio/SoundSafetyWarning.tsx');
  it('KEEP SOUND OFF and ENABLE SOUND sit BELOW the scroll (always visible); the checkbox stays at the end of the text', () => {
    const scrollEnd = w.indexOf('</ScrollView>');
    assert.ok(scrollEnd > 0);
    assert.ok(w.indexOf('onPress={accept}') > scrollEnd, 'ENABLE SOUND is pinned below the scroll');
    assert.ok(w.indexOf('onPress={decline}') > scrollEnd, 'KEEP SOUND OFF is pinned below the scroll');
    assert.ok(w.indexOf('accessibilityRole="checkbox"') < scrollEnd, 'the box is still reached by passing the text');
    assert.match(w, /scroll: \{ flexGrow: 0, flexShrink: 1 \}/, 'the text shrinks first, the footer keeps its room');
  });
  it('a tap on the dim does nothing (it never "vanishes on its own"); BACK and KEEP SOUND OFF decline and are remembered', () => {
    assert.match(w, /<Pressable style=\{StyleSheet\.absoluteFill\} onPress=\{\(\) => \{\}\} accessible=\{false\} \/>/);
    assert.doesNotMatch(w, /onPress=\{close\}/);
    assert.match(w, /onRequestClose=\{decline\}/);
    assert.match(block(w, 'export function SoundSafetyWarning('), /const decline = useCallback\(\(\) => \{\s*if \(arming\(\)\) return;\s*noteSoundSafetyDeclined\(\);\s*close\(\);/);
  });
  it('opaque from the first frame: no fade, a near-opaque dim', () => {
    assert.match(w, /animationType="none"/);
    assert.doesNotMatch(w, /animationType="fade"/);
    assert.match(w, /backgroundColor: 'rgba\(8,8,10,0\.94\)'/);
  });
  it('ignores taps in its first moment, and answers a refused or dropped request with no sheet', () => {
    assert.match(w, /const arming = useCallback\(\(\) => popupArming\(shownAt\.current, Date\.now\(\)\), \[\]\);/);
    assert.match(w, /if \(arming\(\)\) return;\s*clearSoundAsk\(\);\s*onAccept\(\);/);
    assert.match(w, /decideSoundSafetyOpen\(\{ workUnderway: isScreenWorkUnderway\(\), cardOwed: isIntroCardOwed\(\) \}\)/);
    assert.match(w, /visible=\{shown\}/);
    assert.match(w, /if \(embedded\) return shown \? body : null;/);
  });
  it('the checkbox resets on a NEW request, not on the gate’s close-and-reopen of the same one', () => {
    assert.match(w, /const openId = soundAskOpenId\(\);\s*useEffect\(\(\) => \{\s*setChecked\(false\);\s*\}, \[openId\]\);/);
    assert.doesNotMatch(w, /if \(visible\) setChecked\(false\);/);
  });
});

// ───────────────────────────────────────────────── arrival order (row 1) ──

describe('arrival: one popup at a time', () => {
  it('"owed" covers the intro card too, so ProNote, the guest reminder, LabShell’s arrival ask and the hint wait for it', () => {
    const id = SI.labTermSignalId();
    assert.equal(SI.isLabTermIntroOwed(), false);
    SI.setIntroCardOwed(id, true);
    assert.equal(SI.isLabTermIntroOwed(), true);
    assert.equal(SI.isLabTermOnlyOwed(), false, 'the card never waits on its own entry');
    assert.equal(SI.isIntroCardOwed(), true);
    SI.setIntroCardOwed(id, false);
    assert.equal(SI.isLabTermIntroOwed(), false);
  });

  it('work under way is app-wide (a tray open anywhere holds the term popup and the arrival ask)', () => {
    const id = SI.labTermSignalId();
    SI.setScreenWork(id, true);
    assert.equal(SI.isScreenWorkUnderway(), true);
    SI.setScreenWork(id, false);
    assert.equal(SI.isScreenWorkUnderway(), false);
  });

  it('CARRY: a ready carrier wins over a pending one; a blurred lab withdrawing late never clears the focused lab’s offer', () => {
    const a = SI.labTermSignalId();
    const b = SI.labTermSignalId();
    assert.equal(SI.labTermCarrierState(), 'none');
    SI.setLabTermCarrier(a, 'pending');
    assert.equal(SI.labTermCarrierState(), 'pending');
    SI.setLabTermCarrier(b, 'ready');
    assert.equal(SI.labTermCarrierState(), 'ready');
    SI.setLabTermCarrier(a, 'none');
    SI.setLabTermCarrier(b, 'none');
    assert.equal(SI.labTermCarrierState(), 'none');
    const t = { key: 'NoiseLab', title: 'Noise', plainEnglish: 'x' };
    SI.offerLabTermToCard(b, t);
    SI.offerLabTermToCard(a, null); // another lab's late withdrawal
    let got: string | null = null;
    const off = SI.onCarriedLabTermDone((k) => (got = k));
    SI.finishCarriedLabTerm('NoiseLab');
    off();
    assert.equal(got, 'NoiseLab');
    SI.offerLabTermToCard(b, null);
  });

  it('a popup ignores taps for its first moment (quick win 1)', () => {
    assert.equal(SI.POPUP_ARM_MS, 350);
    assert.equal(SI.popupArming(1000, 1200), true);
    assert.equal(SI.popupArming(1000, 1000 + SI.POPUP_ARM_MS), false);
    assert.equal(SI.popupArming(null, 5), false);
  });

  const CLEAR: Parameters<typeof L.labTermIntroState>[0] = {
    wired: true, freeLab: true, gate: 'open', previewActive: false, seen: false, dismissed: false, focused: true,
    suppressed: false, held: false, pushSettled: true, otherModalOpen: false, holdMs: 0, presented: false,
  };
  it('the term popup draws nothing of its own while an intro card carries it, and stays owed until that card closes', () => {
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, carrier: 'ready' }), { owed: true, show: false });
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, carrier: 'pending' }), { owed: true, show: false }, 'waits while the card’s flag is read');
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, carrier: 'none' }), { owed: true, show: true }, 'no card: its own sheet, as before');
    assert.deepEqual(L.labTermIntroState({ ...CLEAR }), { owed: true, show: true });
    assert.deepEqual(L.labTermIntroExtras({ ...CLEAR }), { drop: false, offer: true });
    // The Amplitude orientation owns the screen: never carried into ITS card.
    assert.deepEqual(L.labTermIntroExtras({ ...CLEAR, held: true }), { drop: false, offer: false });
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, held: true, carrier: 'ready' }), { owed: true, show: false });
    // The carrying card is on screen (it counts as "the screen is busy"): the
    // term is NOT dropped, it stays owed and offered until the card closes.
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, carrier: 'ready', workUnderway: true }), { owed: true, show: false });
    assert.deepEqual(L.labTermIntroExtras({ ...CLEAR, carrier: 'ready', workUnderway: true }), { drop: false, offer: true });
  });

  it('while membership is still being checked the term is owed, so the intro card never goes first and gets the term on top', () => {
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, freeLab: false, gate: 'checking' }), { owed: true, show: false });
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, freeLab: false, gate: 'unconfirmed' }), { owed: false, show: false });
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, freeLab: false, gate: 'checking', seen: true }), { owed: false, show: false });
  });

  it('the host stays the carrier while its card shows the term, and in-screen cards count as the screen being busy', () => {
    const SG = code('features/lab/screenGuide/ScreenGuide.tsx');
    const host = block(SG, 'export function ScreenGuideHost(');
    assert.match(host, /const carryingNow = shown\?\.term != null && hostFocused;/);
    assert.match(host, /setLabTermCarrier\(carryId, carryingNow \? 'ready' : 'none'\)/);
    assert.match(block(SG, 'function ScreenIntroOverlay('), /useCoversScreen\(\);/);
  });

  it('never over an open tray: work before it shows drops it for this visit (never marked seen)', () => {
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, workUnderway: true }), { owed: false, show: false });
    assert.deepEqual(L.labTermIntroExtras({ ...CLEAR, workUnderway: true }), { drop: true, offer: false });
    // Already on screen: it stays (it is the learner's card now).
    assert.deepEqual(L.labTermIntroState({ ...CLEAR, presented: true, workUnderway: true }), { owed: true, show: true });
    const lti = code('features/intro/LabTermIntro.tsx');
    assert.match(lti, /if \(drop\) setDismissed\(true\);/);
    assert.doesNotMatch(block(lti, 'function LabTermIntro(').match(/useEffect\(\(\) => \{\s*if \(drop\)[^}]*\}/)?.[0] ?? '', /markLabTermSeen/);
  });

  it('the term popup: offered to the card, finished by it, a web push wait of a beat, and CONTINUE armed', () => {
    const lti = code('features/intro/LabTermIntro.tsx');
    assert.match(lti, /const PUSH_FALLBACK_MS = Platform\.OS === 'web' \? 150 : 900;/);
    assert.match(lti, /offerLabTermToCard\(id, offer \? \{ key: term\.key, title, plainEnglish: term\.plainEnglish \} : null\)/);
    assert.match(lti, /onCarriedLabTermDone\(\(k\) => \{\s*if \(k === term\.key\) onContinue\(\);/);
    assert.match(lti, /onPress=\{tapContinue\}/);
    assert.match(lti, /if \(popupArming\(shownAt\.current, Date\.now\(\)\)\) return;\s*onContinue\(\);/);
  });
});

describe('arrival: the intro card carries the term, comes WITH the page, and is armed', () => {
  const SG = code('features/lab/screenGuide/ScreenGuide.tsx');
  const ctl = block(SG, 'function IntroCardController(');
  it('no 1.5 s quiet wait and no closing-fade wait: it presents with the page', () => {
    assert.match(SG, /export const SCREEN_INTRO_SETTLE_MS = 0;/);
    assert.match(ctl, /\}, SCREEN_INTRO_SETTLE_MS\);/);
    assert.doesNotMatch(ctl, /rootModalHoldMs\(\)/);
  });
  it('it carries the term: registers as a carrier, waits on the term only when not carrying it, hands the term to the card', () => {
    assert.match(ctl, /setLabTermCarrier\(carrierId, carrierState\)/);
    assert.match(ctl, /const carrying = carry && offered != null;/);
    assert.match(ctl, /const labTermFirst = termOwed && !carrying;/);
    assert.match(ctl, /const clear = seen === false && focused && !suppressed && !labTermFirst && !hold && \(inModal \|\| !modalUp\);/);
    assert.match(ctl, /presentRef\.current\(offeredRef\.current\)/);
    const host = block(SG, 'export function ScreenGuideHost(');
    assert.match(host, /carry=\{backRef == null\}/);
    assert.match(host, /mode: 'intro', claim: offer\.id, term: term \?\? undefined/);
    assert.match(host, /if \(t\) finishCarriedLabTerm\(t\.key\);\s*setShown\(null\);/, 'closing the card reads the term');
    assert.match(host, /if \(shown\.term\) finishCarriedLabTerm\(shown\.term\.key\);/, 'EXPLAIN THIS SCREEN reads it too');
    const card = block(SG, 'function IntroCard(');
    assert.match(card, /\{term \? \(/);
    assert.match(card, /\{term\.plainEnglish\}/);
  });
  it('every first-open popup waits for it: owed and on-screen cards publish setIntroCardOwed (not in Low-Light)', () => {
    assert.match(block(SG, 'function useIntroBusy('), /setIntroCardOwed\(cardId, card\)/);
    assert.match(ctl, /useIntroBusy\(owed && focused, owed && focused && !suppressed\);/);
    assert.match(block(SG, 'function ScreenIntroOverlay('), /useIntroBusy\(true\);/);
  });
  it('taps in its first moment are ignored (the dim, ✕, GOT IT, EXPLAIN); BACK closes at once', () => {
    const ov = block(SG, 'function ScreenIntroOverlay(');
    assert.match(ov, /const guard = useArmGuard\(\);/);
    assert.match(ov, /const onClose = useMemo\(\(\) => guard\(closeNow\), \[guard, closeNow\]\);/);
    assert.match(ov, /const back = useCallback\(\(\) => \{\s*closeNow\(\);/);
    assert.match(block(SG, 'export function ScreenGuidePopup('), /onPress=\{tapOff\}/);
  });
  it('work under way inside the host is published app-wide', () => {
    assert.match(block(SG, 'export function ScreenGuideHost('), /setScreenWork\(workId, working\);/);
  });
});

// ───────────────────────────────────────────── the ⓘ hint (quick win 5) ──

describe('the "New: tap ⓘ" hint', () => {
  const SG = code('features/lab/screenGuide/ScreenGuide.tsx');
  const hint = block(SG, 'export function useScreenGuideHintVisible(');
  it('never on a visit where another popup came (at most two before the first touch)', () => {
    assert.match(hint, /const busyNow = !!labTermFirst \|\| introFirst \|\| modalUp;/);
    assert.match(hint, /if \(!focused\) setCrowded\(false\);\s*else if \(busyNow\) setCrowded\(true\);/);
    assert.match(hint, /&& !crowded;/);
  });
  it('retires once used in ANY way (the key, EXPLAIN THIS SCREEN), and after 8 s on screen', () => {
    assert.equal((SG.match(/void markScreenGuideHintSeen\(\)/g) ?? []).length >= 5, true);
    assert.match(block(SG, 'export function ScreenGuideHost('), /void markScreenGuideHintSeen\(\);\s*setShown\(\{ title, guide, mode: 'guide' \}\);/);
    assert.match(block(SG, 'export function ScreenGuidePopup('), /void markScreenGuideHintSeen\(\);\s*setStep\(0\);/);
    assert.match(SG, /export const SCREEN_GUIDE_HINT_LIFE_MS = 8000;/);
    assert.match(hint, /setTimeout\(\(\) => void markScreenGuideHintSeen\(\), SCREEN_GUIDE_HINT_LIFE_MS\)/);
  });
  it('lets taps through to what is under it (NEXT ›); only its ✕ is a target', () => {
    const anchor = block(SG, 'export function ScreenGuideHintAnchor(');
    assert.match(anchor, /<View style=\{styles\.hint\} pointerEvents="box-none">/);
    assert.match(anchor, /<View pointerEvents="none" style=\{styles\.hintTextWrap\}>/);
    assert.equal((anchor.match(/<Pressable/g) ?? []).length, 1, 'one target: the ✕');
  });
});

describe('the screen-guide kit speaks neutrally (TRY THIS is not always an experiment)', () => {
  it('the strip’s arrows are "thing to try", never "experiment"', () => {
    const SG = code('features/lab/screenGuide/ScreenGuide.tsx');
    assert.match(SG, /accessibilityLabel="Previous thing to try"/);
    assert.match(SG, /accessibilityLabel="Next thing to try"/);
    assert.doesNotMatch(SG, /accessibilityLabel="[^"]*experiment/i);
  });
});

// ──────────────────────────────────────── term cards that contradicted their labs ──

describe('term cards agree with their labs (quick win 9)', () => {
  const E = DATA.LAB_TERM_ENTRIES as Record<string, { status: string; plainEnglish?: string }>;
  const pe = (k: string) => E[k]?.plainEnglish ?? '';
  it('Connector: the shape says what fits, not what it carries', () => {
    assert.doesNotMatch(pe('ConnectorSelectLab'), /carries its own kind of signal/);
    assert.match(pe('ConnectorSelectLab'), /Its shape tells you what it fits, not what it carries/);
  });
  it('Cable dressing: not just neat', () => {
    assert.doesNotMatch(pe('CableInstallLab'), /neat and tidy/);
    assert.match(pe('CableInstallLab'), /not just making them look neat/);
  });
  it('Noise: the lab opens on the glossary row it teaches ("noise color", verbatim), not "unwanted signal"', () => {
    const e = E.NoiseLab as { term?: string; glossaryId?: string; plainEnglish?: string };
    assert.equal(e.term, 'noise color');
    assert.equal(e.glossaryId, 'c4bfb4c2-1bd8-45fc-aebd-33b35b3890de');
    assert.doesNotMatch(pe('NoiseLab'), /didn't want/);
    assert.equal(
      pe('NoiseLab'),
      'Noise color tells you how a noise spreads its energy across pitches. White noise sounds hissy, while pink noise sounds fuller and more balanced.',
    );
    assert.equal(L.labTermTitle(e.term ?? ''), 'Noise color');
    // The general glossary meaning of "Noise" stays verbatim in Start Here.
    assert.match(SHG.STARTER_GLOSSARY.noise.plain_english, /^Noise is everything you didn't want in the signal/);
  });
  it('plain words: US spelling, no dashes standing in for punctuation', () => {
    for (const k of ['ConnectorSelectLab', 'CableInstallLab']) {
      assert.doesNotMatch(pe(k), / - |colour|labelled|centre/, k);
      assert.ok(pe(k).split(/\s+/).length <= 70, `${k}: short enough for the card`);
    }
  });
});
