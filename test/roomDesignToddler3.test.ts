/**
 * Room Design & Monitoring Lab — toddler + cat bug pass 3 of 3 (the final
 * pass, 2026-10-01). Each block is the receipt for one fix (or one
 * correction of a pass-2 fix): written first, it failed against the pass-2
 * sources and passes now — model behaviour where the bug lives in the model,
 * a source guard where it lives in a view the node runner cannot mount.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

type Model = typeof import('../src/screens/lab/roomdesign/roomModel.ts');
type RoomDesign = import('../src/screens/lab/roomdesign/roomModel.ts').RoomDesign;
const M = (await import('../src/screens/lab/roomdesign/roomModel.ts')) as Record<string, unknown> & Model;
const C = (await import('../src/screens/lab/roomdesign/labCtx.ts')) as Record<string, unknown>;
const { bounds, defaultDesign, polygonIsValidRoom, repairDesign, resizeDesign, ROOM_MAX_M } = M;

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const LAB = 'src/screens/lab/roomdesign/';
const fn = <T>(name: string, from: Record<string, unknown> = M): T => {
  assert.equal(typeof from[name], 'function', `${name} exists`);
  return from[name] as T;
};

/* ─────────────────────────── corrections of pass 2 ─────────────────────────── */

describe('CORRECTION (resizeDesign): WIDTH / LENGTH at 15 m land ON 15 m, not a hair past it', () => {
  // Pass 2 slid the plan back so the far wall sits at 15 m — but the scale
  // (15 / width) × width is 15.000000000000002 for some widths, and every
  // check is a strict "≤ 15": corner drags were refused and a SAVE of the
  // room vanished from SAVED DESIGNS (repairDesign drops it) while the lab
  // said "Saved on this device".
  it('a 3.6, 7.1, 7.3 or 13.3 m room ridden to 15 m stays a valid, saveable plan', () => {
    for (const w0 of [3.6, 7.1, 7.3, 13.3]) {
      for (const [w, l] of [[15, 5], [5, 15]] as const) {
        const start = w === 15 ? resizeDesign(defaultDesign(), w0, 5) : resizeDesign(defaultDesign(), 4, w0);
        const big = resizeDesign(start, w, l);
        const b = bounds(big.room);
        assert.ok(b.maxX <= ROOM_MAX_M && b.maxY <= ROOM_MAX_M, `${w0} → far corner ${b.maxX}, ${b.maxY}`);
        assert.ok(polygonIsValidRoom(big.room.vertices), `${w0} → corner drags still accepted`);
        assert.ok(repairDesign(JSON.parse(JSON.stringify(big))), `${w0} → a SAVE still lists under SAVED DESIGNS`);
      }
    }
  });
  it('every lane step from 2 m to 15 m, ridden to the top, stays valid', () => {
    let bad = 0;
    for (let i = 0; i <= 260; i++) {
      const w0 = Math.round((2 + i * 0.05) / 0.05) * 0.05;
      const big = resizeDesign(resizeDesign(defaultDesign(), w0, 5), 15, 5);
      if (!polygonIsValidRoom(big.room.vertices)) bad++;
    }
    assert.equal(bad, 0);
  });
});

/* ─────────────────────────────── new findings ─────────────────────────────── */

describe('a "Saved" line never survives the delete of that save', () => {
  it('REVIEW: SAVE, then DELETE on the "(this one)" row — the caption still said "Saved … on this device."', () => {
    const saveLine = fn<(m: { text: string; ok: boolean; at: unknown } | null, d: unknown, kept?: boolean) => string | null>('saveLine', C);
    const d = { id: 'x' };
    const msg = { text: 'Saved "My room" on this device.', ok: true, at: d };
    assert.equal(saveLine(msg, d, true), msg.text);
    const gone = saveLine(msg, d, false)!;
    assert.notEqual(gone, msg.text);
    assert.doesNotMatch(gone, /^Saved/);
    assert.match(gone, /deleted/i);
    assert.equal(saveLine({ text: 'Not saved — x', ok: false, at: d }, d, false), 'Not saved — x', 'a failure stays as it was');
  });
  it('EXPLORE and REVIEW pass whether the design is still in the library', () => {
    assert.match(strip(read(`${LAB}modules/modReview.tsx`)), /const savedLine = saveLine\(savedMsg, design, saved\.some\(\(d\) => d\.id === design\.id\)\);/);
    assert.match(strip(read(`${LAB}modules/modExplore.tsx`)), /const line = saveLine\(msg, design, saved\.some\(\(d\) => d\.id === design\.id\)\);/);
  });
});

describe('every saved design was "My room": a SAVE numbers a clashing name', () => {
  const lib = (names: string[]): RoomDesign[] => names.map((name) => ({ ...defaultDesign(), name }));
  it('uniqueDesignName: "My room" → "My room 2" → "My room 3"; its own record never clashes', () => {
    const uniqueDesignName = fn<(name: string, saved: readonly Pick<RoomDesign, 'id' | 'name'>[], id: string) => string>('uniqueDesignName');
    const me = defaultDesign();
    assert.equal(uniqueDesignName('My room', [], me.id), 'My room');
    assert.equal(uniqueDesignName('My room', lib(['My room']), me.id), 'My room 2');
    assert.equal(uniqueDesignName('My room', lib(['My room', 'My room 2']), me.id), 'My room 3');
    assert.equal(uniqueDesignName('My room 2', lib(['My room', 'My room 2']), me.id), 'My room 3', 'NEW ROOM keeps the old name; the next save numbers on');
    assert.equal(uniqueDesignName('My room', [{ id: me.id, name: 'My room' }], me.id), 'My room', 're-saving the same design keeps its name');
    assert.equal(uniqueDesignName('Studio', lib(['My room']), me.id), 'Studio');
  });
  it('the host saves under the numbered name, shows it on screen, and hands the saved design back', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    const save = host.slice(host.indexOf('saveCurrent:'), host.indexOf('loadSaved:'));
    assert.match(save, /uniqueDesignName\(name \?\? design\.name, rawSaved, design\.id\)/);
    assert.match(save, /return saveRoomDesign\(d\)\.then\(\(ok\) => \(\{ ok, at: d \}\)\);/);
    for (const m of ['modReview', 'modExplore']) {
      const s = strip(read(`${LAB}modules/${m}.tsx`));
      assert.match(s, /void saveCurrent\(\)\.then\(\(\{ ok, at \}\) =>/, m);
      assert.match(s, /Saved "\$\{at\.name\}" on this device\./, m);
    }
  });
});

describe('TREATMENT: THICK is never a dead control on a rug', () => {
  it('the rug is modelled at one thickness — every THICK position gave the same α and the same picture', () => {
    const alpha = M.treatmentAlpha as (t: { kind: 'rug'; thickness: number }, b: number) => number;
    for (let b = 0; b < 6; b++) assert.equal(alpha({ kind: 'rug', thickness: 0.025 }, b), alpha({ kind: 'rug', thickness: 0.4 }, b));
  });
  it('a selected rug has SIZE but no THICK key, and the lane binds SIZE for it', () => {
    const s = strip(read(`${LAB}modules/modTreatment.tsx`));
    assert.match(s, /const rugSel = sel\?\.kind === 'rug';/);
    assert.match(s, /\.\.\.\(rugSel \? \[\] : \[thickParam\]\)/);
    assert.match(s, /initialParam: rugSel \? 'size' : 'thick'/);
    assert.doesNotMatch(s.slice(s.indexOf('const thickParam'), s.indexOf("id: 'size'")), /sel\.kind === 'rug'/, 'no rug branch left in THICK');
  });
});

describe('REVIEW: a long value never squeezes its label to nothing (Larger Text, a long treatment list)', () => {
  // Yoga gives a Text no flex-shrink and no min-content floor: a value
  // measured at the full card width ("2 × absorber panel, 4 × bass trap,
  // 1 × ceiling cloud") left the label ("Treatment") a zero-width column.
  it('the KV label keeps up to half the row and the value wraps in the rest', () => {
    const bits = read(`${LAB}bits.tsx`);
    assert.match(bits, /kvK: \{[^}]*flexShrink: 0[^}]*maxWidth: '50%'/);
    assert.match(bits, /kvV: \{[^}]*flexShrink: 1/);
  });
});

/* ───────────── lab follow-ups to the lead's store change (S1, S2) ───────────── */

describe('REVIEW: a DELETE the device refused says so (store S1: the row comes back)', () => {
  it('the words: it was not deleted and the design is still saved', () => {
    assert.equal(C.DELETE_FAILED, 'Could not delete — this device could not be written. The design is still saved.');
  });
  it('the host hands back the store promise; REVIEW shows DELETE_FAILED when it resolves false', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    assert.match(host, /deleteSaved: \(id: string\) => deleteRoomDesign\(id\),/);
    const s = strip(read(`${LAB}modules/modReview.tsx`));
    assert.match(s, /deleteSaved: removeFromStore,/);
    assert.match(s, /const deleteSaved = \(id: string\) => \{\s*setDeleteMsg\(null\);\s*void removeFromStore\(id\)\.then\(\(ok\) => setDeleteMsg\(ok \? null : DELETE_FAILED\)\);/);
    assert.match(s, /\{deleteMsg \? <Caption>\{deleteMsg\}<\/Caption> : null\}/);
    assert.doesNotMatch(s, /void removeFromStore\(id\);/, 'never fire-and-forget');
  });
});

describe('REVIEW: an unreadable library is never "No saved designs on this device yet." (store S2)', () => {
  it('the words: not lost, nothing overwritten, and what to do — never "not signed in"', () => {
    const t = C.STORE_UNREADABLE as string;
    assert.equal(typeof t, 'string');
    assert.match(t, /could not be read/);
    assert.match(t, /not lost/);
    assert.doesNotMatch(t, /not signed in|No saved designs/i);
  });
  it('the host reads isRoomDesignStoreUnreadable() and REVIEW switches the empty-list line on it', () => {
    const host = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
    assert.match(host, /const unreadable = isRoomDesignStoreUnreadable\(\);/);
    assert.match(host, /unreadable,\s*\}\),\s*\[[^\]]*unreadable\]/);
    const s = strip(read(`${LAB}modules/modReview.tsx`));
    assert.match(s, /\{saved\.length === 0 \? <Caption>\{unreadable \? STORE_UNREADABLE : 'No saved designs on this device yet\.'\}<\/Caption> : null\}/);
    // EXPLORE lists no designs, so it has no empty-list line to correct.
    assert.doesNotMatch(strip(read(`${LAB}modules/modExplore.tsx`)), /No saved designs/);
  });
});
