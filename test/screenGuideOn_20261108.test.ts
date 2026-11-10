/**
 * Lab help back ON + the INTRO CARD (owner 2026-11-08, HOLD 2 = YES, must-do
 * D52). Replaces screenGuideOffForLaunch_20261105 (the off switch).
 *
 * The owner opened Wave Physics module 1 and found "no real intro to what is
 * going on or being learned … no instruction or guidance". Every ScreenGuide
 * may now carry `intro: { learning, start }`; a screen whose guide has one
 * gets a card when it opens — once per device per intro — with no per-screen
 * wiring (the ⓘ key offers it to its host).
 *
 *   1. the switch is on; the ⓘ key and the hint still obey it;
 *   2. the intro's seen id is a stable hash of its words;
 *   3. placement: the dock the "start" line names stays bright and live, the
 *      card centred above it; with no room or no dock, centred on the whole
 *      screen over the dim (and then one tap closes it);
 *   4. the seen list: createLocalStore under `ape:intro:*`, survives both
 *      wipes, replayed by "Reset onboarding hints"; a failed read is
 *      UNREADABLE and never overwritten; nothing saved until a card shows;
 *   5. the gates and the wiring, pinned in the source.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// ── a fake AsyncStorage (reads can fail) — the screenGuide_20261031 harness ──
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__SI_AS__ = AS;
g.__SI_FAIL_READS__ = false;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(`
    const s = globalThis.__SI_AS__;
    export default {
      async getItem(k) { if (globalThis.__SI_FAIL_READS__) throw new Error('read failed'); return s.has(k) ? s.get(k) : null; },
      async setItem(k, v) { s.set(k, String(v)); },
      async removeItem(k) { s.delete(k); },
      async getAllKeys() { return [...s.keys()]; },
      async multiRemove(ks) { for (const k of ks) s.delete(k); },
    };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const T = await import('../src/features/lab/screenGuide/types.ts');
const P = await import('../src/features/lab/screenGuide/placement.ts');
const S = await import('../src/features/lab/screenGuide/screenIntroCardStore.ts');
const intros = await import('../src/features/intro/screenIntros.ts');

const SG = code('src/features/lab/screenGuide/ScreenGuide.tsx');
/** One top-level function's source: from its declaration to the next one. */
const block = (src: string, decl: string) => {
  const at = src.indexOf(decl);
  if (at < 0) return '';
  const rest = src.slice(at + decl.length);
  const next = rest.search(/\n(export )?function |\nconst styles = |\nlet |\ntype /);
  return decl + (next < 0 ? rest : rest.slice(0, next));
};

describe('1. lab help is on', () => {
  it('the switch is on', () => {
    assert.equal(T.SCREEN_GUIDES_ON, true);
  });
  it('the key still obeys the switch (draws nothing if it is ever turned off)', () => {
    assert.match(SG, /return SCREEN_GUIDES_ON \? <LiveScreenGuideKey title=\{title\} guide=\{guide\} introId=\{introId\} \/> : null;/);
  });
  it('the one-time hint still obeys the switch', () => {
    assert.match(SG, /useScreenGuideHintVisible\(\) && !off && SCREEN_GUIDES_ON/);
  });
  it('the hint’s words and the key’s label are unchanged', () => {
    assert.equal(T.SCREEN_GUIDE_HINT_TEXT, 'New: tap ⓘ to have this screen explained');
    assert.equal(T.SCREEN_GUIDE_KEY_LABEL, 'Explain this screen');
  });
});

describe('2. the intro’s seen id', () => {
  const a = { learning: 'How sound reflects off a wall.', start: 'Drag ANGLE and watch the WAVE FIELD.' };
  it('stable, short, and changes when the words change', () => {
    assert.equal(T.screenIntroId(a), T.screenIntroId({ ...a }));
    assert.match(T.screenIntroId(a), /^i[0-9a-z]{1,7}$/);
    assert.notEqual(T.screenIntroId(a), T.screenIntroId({ ...a, start: a.start + ' ' }));
    assert.notEqual(T.screenIntroId(a), T.screenIntroId({ learning: a.start, start: a.learning }));
  });
  it('the card’s words, student voice', () => {
    assert.deepEqual(
      { ...T.SCREEN_INTRO_TEXT },
      { learning: 'WHAT YOU’RE LEARNING', start: 'WHERE TO START', explain: 'EXPLAIN THIS SCREEN', dismiss: 'GOT IT', reopen: '‹ INTRO' },
    );
    assert.deepEqual({ ...T.SCREEN_INTRO_WORDS }, { learning: 30, start: 40 });
  });
});

describe('3. placement: the controls the "start" line names stay usable', () => {
  // A 375 × 812 phone under a Rack Unit, as measured (relative to the overlay root).
  const PHONE = {
    rootW: 375,
    rootH: 812,
    insetTop: 47,
    insetBottom: 34,
    display: { x: 10, y: 167, w: 355, h: 292 },
    dock: { x: 0, y: 640, w: 375, h: 138 },
  };
  it('Rack Unit: the dock stays bright and live; the card is centred above it', () => {
    const p = P.placeIntroCard(PHONE);
    assert.deepEqual(p.keep, PHONE.dock);
    assert.equal(p.coversDock, false);
    assert.equal(p.slot.top, PHONE.insetTop + P.GUIDE_GAP);
    assert.ok(p.slot.top + p.slot.height <= PHONE.dock.y, 'the card slot reaches into the dock');
    assert.ok(p.slot.height >= P.INTRO_MIN_SLOT);
  });
  it('no room above the dock: centred on the whole screen, and it says it covers the dock', () => {
    const p = P.placeIntroCard({ ...PHONE, dock: { x: 0, y: 250, w: 375, h: 520 } });
    assert.equal(p.keep, null);
    assert.equal(p.coversDock, true);
    assert.equal(p.slot.top, PHONE.insetTop + P.GUIDE_GAP);
    assert.equal(p.slot.top + p.slot.height, PHONE.rootH - PHONE.insetBottom - P.GUIDE_GAP);
  });
  it('no dock (a menu, the lab home): centred on the whole screen', () => {
    const p = P.placeIntroCard({ ...PHONE, display: null, dock: null });
    assert.equal(p.keep, null);
    assert.equal(p.coversDock, false);
    assert.equal(p.slot.top + p.slot.height, PHONE.rootH - PHONE.insetBottom - P.GUIDE_GAP);
  });
  it('when it does cover the controls, one tap closes it: the dim, ✕, GOT IT, BACK', () => {
    const overlay = block(SG, 'function ScreenIntroOverlay(');
    assert.ok(overlay, 'overlay found');
    assert.match(overlay, /<Pressable\s+key=\{k\}\s+style=\{\[styles\.pane, style\]\}\s+onPress=\{onClose\}/);
    assert.match(overlay, /pane\(StyleSheet\.absoluteFill, 'all'\)/);
    assert.match(overlay, /useBackWhileFocused\(true, back\)/);
    const card = block(SG, 'function IntroCard(');
    assert.match(card, /<Pressable onPress=\{onClose\}[^>]*accessibilityLabel="Close the intro">\s*<Text style=\{styles\.closeXText\}>✕<\/Text>/);
    assert.match(card, /<Pressable onPress=\{onClose\} style=\{\[styles\.navBtn, styles\.navPrimary\]\}[^>]*>\s*<Text[^>]*>\{SCREEN_INTRO_TEXT\.dismiss\}<\/Text>/);
  });
  it('the dock is MEASURED from the Rack Unit in the overlay’s own window, never guessed', () => {
    const overlay = block(SG, 'function ScreenIntroOverlay(');
    assert.match(overlay, /const root = await measureView\(rootRef\);/);
    assert.match(overlay, /measureGuideRegion\('dock'\)/);
    assert.match(overlay, /placeIntroCard\(layout\)/);
    assert.doesNotMatch(overlay, /<Modal/, 'in the screen’s tree, never Modal-on-Modal');
  });
});

describe('4. the seen list', () => {
  const STORE = code('src/features/lab/screenGuide/screenIntroCardStore.ts');
  it('createLocalStore under the intro family; no hand-rolled storage (D47)', () => {
    assert.match(STORE, /createLocalStore<readonly string\[\]>\(\{/);
    assert.equal(S.SCREEN_INTRO_CARD_KEY, 'ape:intro:screenIntroCards');
    assert.match(STORE, /onScreenIntrosReset\(\(\) => store\.reset\(\)\)/);
    assert.doesNotMatch(STORE, /AsyncStorage/);
  });
  it('the intro family survives both wipes (clearLocalAccountData keeps ape:intro:*)', () => {
    assert.match(code('src/features/account/clearLocalAccountData.ts'), /k\.startsWith\('ape:intro:'\)/);
  });
  it('really persists: nothing saved → shown → listed → "Reset onboarding hints" brings it back', async () => {
    AS.clear();
    await S.screenIntroHydrate();
    assert.equal(S.screenIntroSeenNow('iabc'), false);
    assert.equal(AS.has(S.SCREEN_INTRO_CARD_KEY), false, 'nothing saved before a card shows');
    assert.equal(await S.markScreenIntroSeen('iabc'), true);
    assert.equal(await S.markScreenIntroSeen('idef'), true);
    assert.equal(await S.markScreenIntroSeen('iabc'), true, 'a second mark is a no-op');
    assert.deepEqual(JSON.parse(AS.get(S.SCREEN_INTRO_CARD_KEY) as string), ['iabc', 'idef']);
    assert.equal(S.screenIntroSeenNow('idef'), true);
    await intros.resetScreenIntros();
    await S.screenIntroHydrate();
    assert.equal(AS.has(S.SCREEN_INTRO_CARD_KEY), false);
    assert.equal(S.screenIntroSeenNow('iabc'), false, 'the card comes back after a reset');
  });
  it('a failed read is UNREADABLE: the stored list is never written over', async () => {
    AS.clear();
    await intros.resetScreenIntros(); // drop memory
    AS.set(S.SCREEN_INTRO_CARD_KEY, JSON.stringify(['iold1', 'iold2']));
    g.__SI_FAIL_READS__ = true;
    try {
      await S.screenIntroHydrate();
      assert.equal(S.screenIntroUnreadable(), true);
      assert.equal(await S.markScreenIntroSeen('inew'), false, 'not written while unreadable');
      assert.deepEqual(JSON.parse(AS.get(S.SCREEN_INTRO_CARD_KEY) as string), ['iold1', 'iold2'], 'stored list untouched');
    } finally {
      g.__SI_FAIL_READS__ = false;
    }
    // The next good read applies the queued mark ON TOP of the stored list.
    await S.screenIntroHydrate();
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(S.screenIntroUnreadable(), false);
    assert.deepEqual(JSON.parse(AS.get(S.SCREEN_INTRO_CARD_KEY) as string), ['iold1', 'iold2', 'inew']);
  });
  it('a damaged blob (not a list) is set aside, not trusted', async () => {
    AS.clear();
    await intros.resetScreenIntros();
    AS.set(S.SCREEN_INTRO_CARD_KEY, '{"x":1}');
    await S.screenIntroHydrate();
    assert.equal(S.screenIntroSeenNow('ix'), false);
    assert.equal(S.screenIntroUnreadable(), false);
  });
  it('the busy signal: the hint waits while any focused card is owed or up', () => {
    const a = S.screenIntroBusyId();
    const b = S.screenIntroBusyId();
    assert.equal(S.isScreenIntroCardBusy(), false);
    S.setScreenIntroCardBusy(a, true);
    S.setScreenIntroCardBusy(b, true);
    S.setScreenIntroCardBusy(a, false);
    assert.equal(S.isScreenIntroCardBusy(), true);
    S.setScreenIntroCardBusy(b, false);
    assert.equal(S.isScreenIntroCardBusy(), false);
  });
});

describe('5. when it shows, and the wiring', () => {
  const ctl = block(SG, 'function IntroCardController(');
  it('gated like the hint: Low-Light / kill switch, focus, the lab term popup, any open DimModal and its closing fade, the host’s hold', () => {
    assert.ok(ctl, 'controller found');
    for (const re of [/useOverlaysSuppressed\(\)/, /useIsFocused\(\)/, /useLabTermIntroOwed\(\)/, /useModalHostOpen\(\)/, /rootModalHoldMs\(\)/]) {
      assert.match(ctl, re);
    }
    assert.match(ctl, /const clear = seen === false && focused && !suppressed && !labTermFirst && !hold && \(inModal \|\| !modalUp\);/);
    // Low-Light re-checked at the moment it would present.
    assert.match(ctl, /if \(areOverlaysSuppressed\(\)\) return;/);
    assert.match(ctl, /SCREEN_INTRO_SETTLE_MS \+ rootModalHoldMs\(\)/);
  });
  it('once per device: a read still out keeps it owed; UNREADABLE shows nothing; written when the student CLOSES it', () => {
    assert.match(ctl, /const owed = seen === 'loading' \|\| seen === false;/);
    // Presenting writes nothing: a card the screen lost before it was read
    // (left, rebuilt) comes back next time.
    assert.doesNotMatch(ctl, /markScreenIntroSeen/);
    const host = block(SG, 'export function ScreenGuideHost(');
    assert.match(host, /setShown\(\{ title: offer\.title, guide: offer\.guide, mode: 'intro', claim: offer\.id \}\);/);
    // Every way out claims it: close (✕, GOT IT, the dim, BACK), EXPLAIN, the end-layer BACK.
    assert.match(host, /const close = useCallback\(\(\) => \{\s*claimIntro\(claimRef\.current\);\s*setShown\(null\);/);
    assert.match(host, /onExplain=\{\(\) => \{\s*claimIntro\(shown\.claim\);/);
    assert.match(host, /backRef\.current = \(\) => \{[\s\S]*?claimIntro\(claimRef\.current\);/);
    // The dev bypass mirrors useScreenIntro: every visit, nothing persisted.
    assert.match(ctl, /const bypass = devBypass\('alwaysShowIntros'\);/);
    assert.match(SG, /function claimIntro\(id: string \| undefined\): void \{\s*if \(id && !devBypass\('alwaysShowIntros'\)\) void markScreenIntroSeen\(id\);/);
  });
  it('the hint waits for the card', () => {
    const hint = block(SG, 'export function useScreenGuideHintVisible(');
    assert.match(hint, /const introFirst = useScreenIntroCardBusy\(\);\s*const owed = seen === false && !introFirst;/);
  });
  it('no per-screen wiring: the ⓘ key offers its guide’s intro to the host; the host presents it', () => {
    const key = block(SG, 'function LiveScreenGuideKey(');
    assert.match(key, /const id = intro \? introId \?\? screenIntroId\(intro\) : null;/);
    assert.match(key, /host\.offerIntro\(\{ owner, id, title, guide, intro \}\);\s*return \(\) => host\.withdrawIntro\(owner\);/);
    const host = block(SG, 'export function ScreenGuideHost(');
    assert.match(host, /offer && !handled\.has\(offer\.id\) \? \(\s*<IntroCardController/);
    assert.match(host, /hold=\{hold \|\| shown != null\}/);
    assert.match(host, /<ScreenIntroOverlay/);
    // No intro, nothing: the key offers only when the guide has one.
    assert.match(key, /if \(!host \|\| !intro \|\| !id\) return;/);
  });
  it('re-openable: EXPLAIN THIS SCREEN goes into the guide; the guide’s first step leads back with ‹ INTRO', () => {
    const host = block(SG, 'export function ScreenGuideHost(');
    assert.match(host, /setShown\(\{ title: shown\.title, guide: shown\.guide, mode: 'guide' \}\);/);
    assert.match(host, /onIntro=\{shown\.guide\.intro \? \(\) => setShown\(\{ title: shown\.title, guide: shown\.guide, mode: 'intro' \}\) : undefined\}/);
    const card = block(SG, 'function GuideCard(');
    assert.match(card, /\{step === 0 && onIntro \? \(\s*<Pressable onPress=\{onIntro\}/);
    assert.match(card, /\{SCREEN_INTRO_TEXT\.reopen\}/);
  });
  it('the ⓘ key used first makes the card moot on this visit (it counts as shown)', () => {
    const host = block(SG, 'export function ScreenGuideHost(');
    assert.match(host, /if \(o\) \{\s*claimIntro\(o\.id\);\s*handle\(o\.id\);/);
  });
  it('the card: two labelled parts, ✕, GOT IT, EXPLAIN THIS SCREEN', () => {
    const card = block(SG, 'function IntroCard(');
    assert.match(card, /\{SCREEN_INTRO_TEXT\.learning\}<\/Text>\s*<Text style=\{styles\.introLearning\}>\{intro\.learning\}<\/Text>/);
    assert.match(card, /\{SCREEN_INTRO_TEXT\.start\}<\/Text>\s*<Text style=\{styles\.introStart\}>\{intro\.start\}<\/Text>/);
    assert.match(card, /ⓘ \{SCREEN_INTRO_TEXT\.explain\}/);
  });
  it('no host: the key presents the card itself, intro and guide sharing ONE DimModal (never close-then-present)', () => {
    const popup = block(SG, 'export function ScreenGuidePopup(');
    assert.equal((popup.match(/<Modal /g) ?? []).length, 1);
    assert.match(popup, /<IntroCard/);
    assert.match(popup, /<GuideCard/);
    assert.match(SG, /import \{ Modal, rootModalHoldMs, useModalHostOpen \} from '\.\.\/\.\.\/\.\.\/components\/DimModal';/);
    assert.doesNotMatch(SG, /\bAlert\b/);
  });
  it('every text on the card is at least 9 pt (owner rule), the reading text 14.5 pt', () => {
    const styles = SG.slice(SG.indexOf('const styles = StyleSheet.create('));
    const sizes = [...styles.matchAll(/fontSize: ([\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(sizes.length > 10);
    for (const s of sizes) assert.ok(s >= 9, `fontSize ${s} < 9`);
    assert.match(styles, /introLearning: \{[^}]*fontSize: 14\.5/);
    assert.match(styles, /introStart: \{[^}]*fontSize: 14\.5/);
  });
});
