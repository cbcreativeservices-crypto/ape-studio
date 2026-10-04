/**
 * LABS B — hunt 12 (2026-10-04). Receipts.
 *
 * 1. Mastering: the quiet pre-render on a LISTEN step kept grinding the DSP
 *    after a sibling screen was pushed over the lab (blur). Like Drum's
 *    preload (never off-screen), a quiet render with nothing queued is now
 *    cancelled on blur.
 * 2. Cymatics Gallery: loadArt treated an UNREADABLE artwork list (the
 *    loadList stand-in) as "no colourings" — it emptied the map, so the
 *    thumbnails, the open preview and the export went out uncoloured without
 *    a word. It now keeps the map and says so.
 * 3. Meter lab, Signal Detective (modMeterC): hydrateSolved had no generation
 *    check — a read still out when the account wipe ran cached the departing
 *    user's solved set for the next person.
 * 4. Cymatics ExportPanel: a SHARE that failed (capture or share threw) said
 *    "Sharing as an image isn't available on this device" — on a button that
 *    is only pressable where it IS available (K6).
 * 5. Cymatics gallery: a guest's saved patterns and colourings were deleted
 *    by their first sign-in's `ape:*` wipe — the owner's guest-carry ruling
 *    (2026-10-01) carried the lab's ticks and Room Design's designs, never the
 *    gallery. They are now held by the shared ledger (guestOnly) and written
 *    back after the wipe.
 * 6. Room Design parseRoomNumber: "1 2,5" read 12.5 and "5'2,5" 52.5 (lead
 *    note, the hunt-11 parseQuantity grouping rule); now refused.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** Comments out, so a receipt reads code only. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('Mastering: blur cancels a quiet pre-render with nothing queued (a queued ▶ is left alone)', () => {
  const s = code(read('src/screens/lab/mastering/useMasterPlayback.ts'));
  const i = s.indexOf('const focusedRef = useRef(true);');
  assert.ok(i > 0);
  const focus = s.slice(i, s.indexOf('useEffect(', i));
  const cleanup = focus.slice(focus.indexOf('return () => {'));
  assert.match(cleanup, /focusedRef\.current = false;/);
  assert.match(cleanup, /if \(renderingSigRef\.current !== null && pendingRef\.current == null\) \{[\s\S]*renderSeqRef\.current\+\+;[\s\S]*renderingSigRef\.current = null;/, 'the blur cleanup retires the quiet render');
});

test('Cymatics Gallery: an unreadable artwork list never empties the map, and is said', () => {
  const s = code(read('src/screens/lab/cymatics/GalleryScreen.tsx'));
  const la = s.slice(s.indexOf('const loadArt = useCallback'), s.indexOf('useFocusEffect('));
  const guard = la.indexOf('if (patternsUnreadable(list))');
  assert.ok(guard > 0, 'loadArt checks the unreadable stand-in');
  assert.ok(guard < la.indexOf('setArtworks('), 'before the map is replaced');
  assert.match(la, /if \(patternsUnreadable\(list\)\) \{\s*setArtUnreadable\(true\);\s*return;/);
  assert.match(s, /\{artUnreadable \? <Text style=\{styles\.caption\}>\{ART_UNREADABLE\}<\/Text> : null\}/, 'the grid says so');
});

test('Signal Detective: hydrateSolved drops a read that a wipe overtook (generation check)', () => {
  const s = code(read('src/screens/lab/meter/modules/modMeterC.tsx'));
  const h = s.slice(s.indexOf('async function hydrateSolved'), s.indexOf('function persistSolved'));
  const g = h.indexOf('const gen = solvedGen;');
  const r = h.indexOf('await readSolved()');
  const chk = h.indexOf('if (gen !== solvedGen) return new Set();');
  const cache = h.indexOf('solvedCache = new Set(stored)');
  assert.ok(g > 0 && g < r, 'the generation is taken before the read');
  assert.ok(chk > r && chk < cache, 'and checked before anything is cached');
});

test('Cymatics ExportPanel: a failed SHARE is not called "not available"', () => {
  const s = code(read('src/screens/lab/cymatics/ExportPanel.tsx'));
  const share = s.slice(s.indexOf('const doShare = '), s.indexOf('const doSave = '));
  assert.match(share, /ok \? 'Shared ✓' : avail\.share \? "Sharing didn't complete — try again\." : /);
});

test('Cymatics gallery: a guest save is held for the sign-in, and the writer puts it back after the wipe', async () => {
  const carry = await import('../src/features/lab/sessionCarry.ts');
  const store = await import('../src/features/cymatics/patternStore.ts');
  const { DEFAULT_PLATE } = await import('../src/features/cymatics/plateModes.ts');
  carry.__resetSessionCarryForTests();
  carry.noteSessionIdentity(''); // a guest launch
  const guestDevice = store.createPatternStore(store.memoryStore());
  const p = store.newPattern({ studio: 'plate', spec: DEFAULT_PLATE, hz: 440, amplitude: 0.3, view: 'particles', multi: 'off', sandCount: 3000, sandSize: 0.45, friction: 0.4 } as never, 'SIMULATION', 'Guest plate');
  assert.equal(await guestDevice.upsertPattern(p), true);
  const art = { ...store.blankArtwork(p.id, 40), fills: [{ region: 1, color: '#ff0000' }] } as never;
  assert.equal(await guestDevice.saveArtwork(art), true);
  const held = carry.peekSessionWork<{ patterns: { id: string }[]; artwork: { patternId: string }[] }>('cymatics:gallery');
  assert.ok(held, 'the guest save is held by the ledger');
  assert.deepEqual(held!.patterns.map((x) => x.id), [p.id]);
  assert.deepEqual(held!.artwork.map((x) => x.patternId), [p.id]);
  // The sign-in's wipe leaves an empty device; the writer fills it back in.
  const wiped = store.createPatternStore(store.memoryStore());
  assert.equal(await wiped.carryIn(held as never), true);
  const back = await wiped.loadPatterns();
  assert.deepEqual(back.map((x) => x.id), [p.id]);
  assert.equal((await wiped.loadArtworks()).length, 1);
  // A pattern deleted again in the session is let go of.
  assert.equal(await guestDevice.deletePattern(p.id), true);
  const after = carry.peekSessionWork<{ patterns: unknown[]; artwork: unknown[] }>('cymatics:gallery');
  assert.equal(after!.patterns.length, 0);
  assert.equal(after!.artwork.length, 0);
  // An account's own saves are not held (guestOnly).
  carry.__resetSessionCarryForTests();
  carry.noteSessionIdentity('uid-1');
  await carry.settleSessionCarry();
  assert.equal(await guestDevice.upsertPattern(store.newPattern(p.state, 'SIMULATION', 'Member plate')), true);
  assert.equal(carry.peekSessionWork('cymatics:gallery'), undefined);
});

test('Room Design parseRoomNumber: a stray separator never glues digits (the parseQuantity grouping rule)', async () => {
  const { parseRoomNumber } = await import('../src/screens/lab/roomdesign/roomParse.ts');
  assert.equal(parseRoomNumber('1 2,5'), null);
  assert.equal(parseRoomNumber("5'2,5"), null);
  assert.equal(parseRoomNumber('1 2.5'), null);
  // Real grouping and the decimal-pad comma still read.
  assert.equal(parseRoomNumber('1 234,5'), 1234.5);
  assert.equal(parseRoomNumber('3,5'), 3.5);
  assert.equal(parseRoomNumber(' 3,5 '), 3.5);
  assert.equal(parseRoomNumber('12,000'), null);
});
