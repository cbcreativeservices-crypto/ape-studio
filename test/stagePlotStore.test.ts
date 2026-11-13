/**
 * Stage Plot and Channel Designer — saving, undo and the review answers
 * (builder G2: src/features/stageplot/spStore.ts, spHistory.ts and
 * src/screens/lab/stageplot/spIssueActions.ts), proven with no device.
 *
 * What a band relies on, and what these tests would catch:
 *   • a project comes back after a restart exactly as it was, and a gig copy
 *     never changes its master (handoff §12, check 5);
 *   • a device that could not be READ is never treated as empty, and nothing
 *     is written over it;
 *   • a guest's work is kept for the session and never written;
 *   • UNDO can never bring back a revision number that was already shared;
 *   • every answer in the review list does what its words say.
 * AsyncStorage is an in-memory stub whose reads and writes can be made to fail.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ASYNC_STORAGE = '@react-native-async-storage/async-storage';
const STUB_URL = 'ape-test:async-storage-stageplot';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === ASYNC_STORAGE) return { url: STUB_URL, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STUB_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          const flags = { failReads: false, failWrites: false };
          globalThis.__apeStagePlotStorage = { mem, flags };
          export default {
            async getItem(k) { if (flags.failReads) throw new Error('unreadable'); return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { if (flags.failWrites) throw new Error('disk full'); mem.set(k, v); },
            async removeItem(k) { if (flags.failWrites) throw new Error('disk full'); mem.delete(k); },
          };
        `,
      };
    }
    return next(url, context);
  },
});

const store = await import('../src/features/stageplot/spStore.ts');
const hist = await import('../src/features/stageplot/spHistory.ts');
const model = await import('../src/features/stageplot/spModel.ts');
const review = await import('../src/features/stageplot/spReview.ts');
const derive = await import('../src/features/stageplot/spDerive.ts');
const { spFromTemplate } = await import('../src/features/stageplot/spTemplates.ts');
const actions = await import('../src/screens/lab/stageplot/spIssueActions.ts');
const carry = await import('../src/features/lab/sessionCarry.ts');
const { SP_GUIDE_LIBRARY } = await import('../src/screens/lab/stageplot/guides/library.ts');
const { SP_GUIDE_SETUP } = await import('../src/screens/lab/stageplot/guides/setup.ts');
type SpProject = import('../src/features/stageplot/spTypes.ts').SpProject;
type SpIssue = import('../src/features/stageplot/spReview.ts').SpIssue;
type SpIssueAction = import('../src/features/stageplot/spReview.ts').SpIssueAction;
type ScreenGuide = import('../src/features/lab/screenGuide/types.ts').ScreenGuide;

const disk = () => (globalThis as unknown as { __apeStagePlotStorage: { mem: Map<string, string>; flags: { failReads: boolean; failWrites: boolean } } }).__apeStagePlotStorage;
const KEY = store.SP_STORE_KEY;
const NOW = 1_800_000_000_000;
const four = (id = 'p-four', now = NOW): SpProject => spFromTemplate('four-piece', { id, now, band: 'The Example Four' });
const stored = () => JSON.parse(disk().mem.get(KEY) ?? 'null') as { v: number; projects: SpProject[]; later: unknown[] } | null;
const tick = () => new Promise<void>((r) => setTimeout(r, 2));
const settle = async () => {
  for (let i = 0; i < 4; i++) await tick();
};
/** A relaunch: memory is dropped, the device keeps what it has. */
async function restart(): Promise<void> {
  store.resetLocal();
  store.getSpProjects();
  await settle();
}
async function fresh(mode: 'write' | 'hold' | 'drop' = 'write'): Promise<void> {
  disk().flags.failReads = false;
  disk().flags.failWrites = false;
  disk().mem.clear();
  carry.__resetSessionCarryForTests();
  store.setSpSaveMode(mode);
  store.resetLocal();
  await settle();
}
const note = (p: SpProject, text: string): SpProject => model.spEdit(p, (d) => void (d.notes = text));

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');

/* ── undo and redo ──────────────────────────────────────────────────────── */

describe('spHistory — undo, redo and the revision that was shared', () => {
  it('an edit is a step: undo goes back, redo comes forward, and a new edit ends the redo line', () => {
    const a = four();
    let h = hist.spHistoryStart(a);
    assert.equal(hist.spCanUndo(h), false);
    h = hist.spHistoryApply(h, note(h.present, 'one'));
    h = hist.spHistoryApply(h, note(h.present, 'two'));
    assert.equal(h.present.notes, 'two');
    h = hist.spHistoryUndo(h);
    assert.equal(h.present.notes, 'one');
    assert.equal(hist.spCanRedo(h), true);
    h = hist.spHistoryRedo(h);
    assert.equal(h.present.notes, 'two');
    h = hist.spHistoryUndo(h);
    h = hist.spHistoryApply(h, note(h.present, 'three'));
    assert.equal(hist.spCanRedo(h), false, 'a new edit starts a new line of history');
    h = hist.spHistoryUndo(hist.spHistoryUndo(h));
    assert.deepEqual(h.present, a, 'undo to the start gives back the project as it was opened');
    assert.equal(hist.spHistoryUndo(h), h, 'nothing earlier: undo does nothing');
  });

  it(`keeps the last ${hist.SP_HISTORY_CAP} states and no more`, () => {
    let h = hist.spHistoryStart(four());
    for (let k = 1; k <= 75; k++) h = hist.spHistoryApply(h, note(h.present, `n${k}`));
    assert.equal(h.past.length, hist.SP_HISTORY_CAP);
    for (let k = 0; k < 200; k++) h = hist.spHistoryUndo(h);
    assert.equal(h.present.notes, 'n15', 'the oldest state still reachable is 60 edits back');
  });

  it('an edit that changes nothing is not a step and never moves a shared revision', () => {
    const sharedDoc = model.spFreeze(four());
    assert.equal(sharedDoc.revision, 1);
    const h = hist.spHistoryStart(sharedDoc);
    // Tapping into a field and out again: the same text is "set" once more.
    const same = model.spEdit(sharedDoc, (d) => void (d.band = sharedDoc.band));
    assert.equal(same.revision, 2, 'the model moves the revision on for any edit of a shared document…');
    assert.equal(hist.spHistoryApply(h, same), h, '…so the editor refuses the empty edit: revision 1 stays revision 1');
    // The same on a document marked "Ready to advance": it stays ready.
    const ready = model.spMarkReady(four());
    const hr = hist.spHistoryStart(ready);
    const kept = hist.spHistoryApply(hr, model.spEdit(ready, (d) => void (d.band = ready.band)));
    assert.equal(kept, hr);
    assert.equal(kept.present.status, 'ready');
    // A real edit does move it on.
    const real = hist.spHistoryApply(h, note(sharedDoc, 'changed'));
    assert.equal(real.present.revision, 2);
    assert.equal(real.present.status, 'draft');
  });

  it('sharing is not a step: undo after an export never un-shares, and never reuses the shared number', () => {
    let h = hist.spHistoryStart(four()); // A: revision 1, never shared
    h = hist.spHistoryApply(h, note(h.present, 'for the venue')); // B
    h = hist.spHistoryApply(h, model.spFreeze(h.present)); // exported at revision 1
    assert.equal(h.past.length, 1, 'the export did not add a step');
    assert.equal(h.present.frozenRevision, 1);

    h = hist.spHistoryUndo(h); // back to A's rows
    assert.equal(h.present.notes, '');
    assert.equal(h.present.frozenRevision, 1, 'what was shared stays shared');
    assert.equal(h.present.revision, 2, 'rows that differ from the shared document take the next number');
    assert.equal(h.present.status, 'draft');

    h = hist.spHistoryRedo(h); // forward to the shared document itself
    assert.equal(h.present.notes, 'for the venue');
    assert.equal(h.present.revision, 1, 'the shared document keeps its own number');
    assert.equal(h.present.frozenRevision, 1);
  });

  it('an export that finished after an edit: the shared number is frozen and the screen moves to the next one', async () => {
    const { spAfterExport, spBuildSnapshot } = await import('../src/features/stageplot/spPacket.ts');
    let h = hist.spHistoryStart(four());
    const snap = spBuildSnapshot(h.present, { paper: 'letter', packet: 'full' }, NOW);
    h = hist.spHistoryApply(h, note(h.present, 'typed while the PDF was being made'));
    const after = spAfterExport(h.present, snap);
    assert.equal(after.revision, 2, 'what is on screen is not what went out');
    const steps = h.past.length;
    h = hist.spHistoryApply(h, after);
    assert.equal(h.present.revision, 2, 'the editor takes the move in one apply');
    assert.equal(h.present.frozenRevision, 1, 'revision 1 is the one that was shared');
    assert.equal(h.present.notes, 'typed while the PDF was being made');
    assert.equal(h.past.length, steps, 'and it is not an undo step');
    // The plain case is unchanged: nothing edited meanwhile, only a freeze.
    let g = hist.spHistoryStart(four());
    const snap2 = spBuildSnapshot(g.present, { paper: 'a4', packet: 'plot' }, NOW);
    g = hist.spHistoryApply(g, spAfterExport(g.present, snap2));
    assert.equal(g.present.revision, 1);
    assert.equal(g.present.frozenRevision, 1);
  });

  it('"Ready to advance" and back to Draft are kept but are not undo steps', () => {
    let h = hist.spHistoryStart(four());
    h = hist.spHistoryApply(h, note(h.present, 'x'));
    h = hist.spHistoryApply(h, model.spMarkReady(h.present));
    assert.equal(h.present.status, 'ready');
    assert.equal(h.past.length, 1);
    h = hist.spHistoryApply(h, model.spSetVenueConfirmed(h.present, true));
    assert.equal(h.present.venueConfirmed, true);
    h = hist.spHistoryApply(h, model.spMarkDraft(h.present));
    assert.equal(h.present.status, 'draft');
    assert.equal(h.past.length, 1);
  });
});

/* ── the library, pure ──────────────────────────────────────────────────── */

describe('spStore — reading a saved library', () => {
  it('every row goes through spMigrate: junk is dropped, an older row is completed, one row per id', () => {
    const good = four('keep');
    const old = { ...four('old') } as Record<string, unknown>;
    delete old.viewNote;
    delete old.extras;
    const newer = note({ ...four('keep'), modifiedAt: NOW + 5 }, 'the newer copy');
    const lib = store.spSanitizeLibrary({ v: 1, projects: [null, 7, 'x', { id: 'no-schema' }, good, old, newer] });
    assert.deepEqual(lib.projects.map((p) => p.id).sort(), ['keep', 'old']);
    const migrated = lib.projects.find((p) => p.id === 'old')!;
    assert.equal(migrated.viewNote, '');
    assert.deepEqual(migrated.extras, []);
    assert.equal(lib.projects.find((p) => p.id === 'keep')!.notes, 'the newer copy', 'of two rows with one id, the newer wins');
    assert.deepEqual(store.spSanitizeLibrary('nonsense').projects, []);
  });

  it('a row written by a NEWER version of the app is kept aside and written back untouched', async () => {
    await fresh();
    const future = { id: 'from-the-future', schema: 99, band: 'Later', somethingNew: [1, 2, 3] };
    disk().mem.set(KEY, JSON.stringify({ v: 1, projects: [four('mine'), future], later: [] }));
    await restart();
    assert.deepEqual(store.getSpProjects().map((p) => p.id), ['mine'], 'it is not shown as something it is not');
    assert.equal(await store.saveSpProject(note(four('mine'), 'edited')), 'saved');
    assert.deepEqual(stored()!.later, [future], 'and the next write did not drop it');
  });

  it('reads an event date as typed, in the usual forms, and refuses a day that does not exist', () => {
    assert.equal(store.spDayFromText(''), '');
    assert.equal(store.spDayFromText(' 2026-12-05 '), '2026-12-05');
    assert.equal(store.spDayFromText('2026/12/5'), '2026-12-05');
    // A date that two musicians read two ways is not read at all.
    assert.equal(store.spDayFromText('12/5/2026'), null, 'month first or day first? it is refused, never guessed');
    assert.equal(store.spDayFromText('5.12.2026'), null);
    assert.equal(store.spDayFromText('Dec 5, 2026'), '2026-12-05');
    assert.equal(store.spDayFromText('December 5th 2026'), '2026-12-05');
    assert.equal(store.spDayFromText('5 Dec 2026'), '2026-12-05');
    assert.equal(store.spDayFromText('2026-02-30'), null);
    assert.equal(store.spDayFromText('next Friday'), null);
    // …and the day that WAS read is said back in words nobody reads two ways.
    assert.equal(store.spDateWords('2026-12-05'), 'December 5, 2026');
    assert.equal(store.spDateWords(store.spDayFromText('5 Dec 2026') ?? ''), 'December 5, 2026');
    assert.equal(store.spDateWords(''), '');
    assert.equal(store.spDateWords('12/5/2026'), '');
  });

  it('names a project by its band, then its title; newest change first; full at the cap', () => {
    assert.equal(store.spProjectName({ band: 'Los Ejemplos', title: 'Club set' }), 'Los Ejemplos — Club set');
    assert.equal(store.spProjectName({ band: '', title: '  ' }), 'Untitled stage plot');
    const list = [four('a', NOW), four('b', NOW + 2), four('c', NOW + 1)];
    assert.deepEqual(store.spNewestFirst(list).map((p) => p.id), ['b', 'c', 'a']);
    assert.equal(store.spAtCap(Array.from({ length: store.SP_MAX_PROJECTS - 1 }, (_, i) => four(`p${i}`))), false);
    assert.equal(store.spAtCap(Array.from({ length: store.SP_MAX_PROJECTS }, (_, i) => four(`p${i}`))), true);
    assert.notEqual(store.spNewProjectId(NOW, 0.1), store.spNewProjectId(NOW, 0.2));
  });
});

/* ── the library, on a device ───────────────────────────────────────────── */

describe('spStore — saving on the device', () => {
  it('a saved project comes back after a restart exactly as it was', async () => {
    await fresh();
    const p = four();
    assert.equal(await store.saveSpProject(p), 'saved');
    assert.equal(store.spProjectSaveState(p.id), 'saved');
    await restart();
    assert.equal(store.spLibraryFace(), 'ready');
    assert.deepEqual(store.getSpProject(p.id), p);
    assert.equal(derive.spSummary(store.getSpProject(p.id)!).house.channels, 14, 'the worked example still has its 14 inputs');
  });

  it('handoff check 5: a gig copy is edited, the app restarts, and the master is untouched', async () => {
    await fresh();
    const master = four('master');
    await store.saveSpProject(master);
    let gig = model.spDuplicateProject(master, { id: 'gig', kind: 'gig', now: NOW + 10 });
    gig = model.spEdit(gig, (d) => {
      d.venue = 'The Blue Room';
      d.eventDate = '2026-12-05';
    });
    const kick = gig.inputs[0];
    gig = model.spUpdateInput(gig, kick.id, { label: 'Kick (venue microphone)' });
    gig = model.spRemoveInput(gig, gig.inputs[gig.inputs.length - 1].id);
    assert.equal(await store.saveSpProject(gig), 'saved');
    await restart();

    const m = store.getSpProject('master')!;
    const g = store.getSpProject('gig')!;
    assert.deepEqual(m, master, 'the master is exactly as it was saved');
    assert.equal(g.kind, 'gig');
    assert.equal(g.masterId, 'master', 'the copy remembers its master');
    assert.equal(g.venue, 'The Blue Room');
    assert.equal(g.inputs.length, master.inputs.length - 1);
    assert.equal(m.inputs.length, 14);
    assert.equal(g.inputs[0].label, 'Kick (venue microphone)');
    assert.equal(m.inputs[0].label, 'Kick');
    assert.deepEqual(model.spBrokenRefs(g), [], 'every link in the copy still resolves');
    assert.deepEqual(store.getSpProjects().map((p) => p.id), ['gig', 'master'], 'newest change first');
  });

  it('a device that cannot be READ is not an empty library: nothing is written over it, and the work joins it later', async () => {
    await fresh();
    await store.saveSpProject(four('on-disk'));
    const before = disk().mem.get(KEY);
    store.resetLocal();
    disk().flags.failReads = true;
    store.getSpProjects();
    await settle();
    assert.equal(store.spLibraryFace(), 'unreadable');

    const started = four('started-meanwhile', NOW + 50);
    assert.equal(await store.saveSpProject(started), 'failed', '"saved" is never said for a write that did not land');
    assert.equal(disk().mem.get(KEY), before, 'the stored library was not touched');
    assert.equal(store.spProjectSaveState('started-meanwhile'), 'failed');

    disk().flags.failReads = false;
    store.retrySpLibrary();
    await settle();
    assert.equal(store.spLibraryFace(), 'ready');
    assert.deepEqual(store.getSpProjects().map((p) => p.id), ['started-meanwhile', 'on-disk']);
    assert.deepEqual(stored()!.projects.map((p) => p.id).sort(), ['on-disk', 'started-meanwhile']);
  });

  it('a write the device refuses answers "failed", and the next one that lands answers "saved"', async () => {
    await fresh();
    disk().flags.failWrites = true;
    assert.equal(await store.saveSpProject(four('x')), 'failed');
    assert.equal(stored(), null);
    disk().flags.failWrites = false;
    assert.equal(await store.saveSpProject(four('x')), 'saved');
    assert.equal(stored()!.projects.length, 1);
  });

  it('delete removes one project, and the key itself when it was the last', async () => {
    await fresh();
    await store.saveSpProject(four('a'));
    await store.saveSpProject(four('b', NOW + 1));
    assert.equal(await store.deleteSpProject('a'), true);
    assert.deepEqual(stored()!.projects.map((p) => p.id), ['b']);
    assert.equal(await store.deleteSpProject('b'), true);
    assert.equal(disk().mem.has(KEY), false);
    assert.deepEqual(store.getSpProjects(), []);
  });
});

describe('spStore — a guest, a preview, and the account wipe', () => {
  for (const mode of ['hold', 'drop'] as const) {
    it(`mode "${mode}": the work is kept for the session and never written`, async () => {
      await fresh(mode);
      const p = four('guest-work');
      assert.equal(await store.saveSpProject(p), 'session-only');
      await settle();
      assert.equal(disk().mem.has(KEY), false, 'nothing reached the device');
      assert.deepEqual(store.getSpProjects().map((x) => x.id), ['guest-work'], 'it is in the list for this session');
      assert.equal(store.spProjectSaveState('guest-work'), 'session-only');
      const held = carry.peekSessionWork<SpProject[]>('stageplot');
      if (mode === 'hold') assert.deepEqual(held?.map((x) => x.id), ['guest-work'], 'held for a sign-in later this session');
      else assert.equal(held, undefined, 'a preview is held for nobody');

      assert.equal(await store.deleteSpProject('guest-work'), true);
      assert.deepEqual(store.getSpProjects(), []);
      assert.deepEqual(carry.peekSessionWork<SpProject[]>('stageplot') ?? [], [], 'a deleted project is let go by the ledger too');
    });
  }

  it('an account whose check finishes gets the session copy written, once', async () => {
    await fresh('hold');
    const p = four('mine');
    await store.saveSpProject(p);
    store.setSpSaveMode('write');
    assert.equal(await store.saveSpProject(note(p, 'now signed in')), 'saved');
    assert.equal(store.spProjectSaveState('mine'), 'saved');
    assert.deepEqual(store.getSpProjects().map((x) => x.notes), ['now signed in']);
    assert.equal(stored()!.projects.length, 1);
  });

  it('the account wipe takes the session copies with it', async () => {
    await fresh('hold');
    await store.saveSpProject(four('theirs'));
    assert.equal(store.getSpProjects().length, 1);
    store.resetLocal();
    await settle();
    assert.deepEqual(store.getSpProjects(), [], 'the next person does not see the last person’s stage plot');
  });
});

/* ── the review answers ─────────────────────────────────────────────────── */

type Went = [area: string, selection: unknown];
function standIn(p: SpProject) {
  const ed = {
    project: p,
    edits: 0,
    went: [] as Went[],
    apply(change: (q: SpProject) => SpProject) {
      ed.project = change(ed.project);
      ed.edits += 1;
    },
    goTo(area: string, selection?: unknown) {
      ed.went.push([area, selection]);
    },
  };
  return ed;
}
const issueOf = (p: SpProject, rule: string): SpIssue => {
  const i = review.spReview(p).find((x) => x.rule === rule);
  assert.ok(i, `the project has a "${rule}" issue`);
  return i;
};
const has = (p: SpProject, rule: string) => review.spReview(p).some((x) => x.rule === rule);

describe('spIssueActions — each answer does what its words say', () => {
  it('every answer has words, and "Go to" opens the issue’s own area on its row', () => {
    const all: SpIssueAction[] = ['locate', 'mark-offstage', 'mark-acoustic', 'mark-self-contained', 'add-inputs', 'mark-visual', 'link-source', 'pair-restore', 'pair-mono', 'assign-mix', 'mark-self-contained-device', 'add-mix', 'mark-no-monitor', 'object-offstage-ok', 'renumber', 'cue-audience-ok', 'edit'];
    for (const a of all) {
      const label = actions.spIssueActionLabel(a);
      assert.ok(label.length > 4, a);
      assert.equal(label, label.toUpperCase(), `${a}: a button is typed in capitals`);
      assert.doesNotMatch(label, /\bKEY\b/, 'a button is a button; Keys is an instrument');
    }
    // "Locate" only for what is on the stage; a row with no object is "placed".
    const unplaced = { rule: 'source-unplaced' } as SpIssue;
    assert.equal(actions.spIssueActionLabel('locate', unplaced), 'PLACE ON THE STAGE');
    assert.equal(actions.spIssueActionLabel('locate', { rule: 'object-offstage' } as SpIssue), 'LOCATE ON THE STAGE');
    let p = four();
    p = model.spSetNumber(p, 'house', p.inputs[1].id, 1);
    const dup = issueOf(p, 'duplicate-channel');
    const ed = standIn(p);
    actions.goToIssue(ed, dup);
    assert.deepEqual(ed.went, [['inputs', { kind: 'input', id: dup.target.id }]]);
    assert.equal(ed.edits, 0, 'going to a row changes nothing');
  });

  it('a stereo pair that lost one side: "make it mono" and "put it back" both end the question', () => {
    const base = four();
    // A pair of microphones: nothing else to decide, so the answer is the edit.
    const ohR = base.inputs.find((i) => i.label === 'Overhead R')!;
    const broken = model.spRemoveInput(base, ohR.id);
    const issue = issueOf(broken, 'pair-broken');

    const mono = standIn(broken);
    actions.runIssueAction(mono, issue, 'pair-mono');
    assert.equal(has(mono.project, 'pair-broken'), false);
    assert.ok(mono.project.inputs.some((i) => i.label === 'Overhead' && i.side === null));
    assert.equal(derive.spSummary(mono.project).house.channels, 13);

    const back = standIn(broken);
    actions.runIssueAction(back, issue, 'pair-restore');
    assert.equal(has(back.project, 'pair-broken'), false);
    assert.equal(derive.spSummary(back.project).house.channels, 14);
  });

  it('…but a side left on a STEREO DI device is not made mono from the list: the row opens, where the device is asked about (handoff §11)', () => {
    const base = four();
    const keysR = base.inputs.find((i) => i.label === 'Keys R')!;
    const keysL = base.inputs.find((i) => i.label === 'Keys L')!;
    assert.equal(base.diDevices.find((d) => d.id === keysL.diDeviceId)?.channels, 2, 'the example keys are on a stereo DI device');
    const broken = model.spRemoveInput(base, keysR.id);
    const ed = standIn(broken);
    actions.runIssueAction(ed, issueOf(broken, 'pair-broken'), 'pair-mono');
    assert.equal(ed.edits, 0, 'nothing was decided for the band');
    assert.deepEqual(ed.went, [['inputs', { kind: 'input', id: keysL.id }]]);
    assert.equal(has(ed.project, 'pair-broken'), true, 'the question stays until the band answers it in the row');
  });

  it('a click sent to the audience on purpose: the answer closes the question and changes no routing', () => {
    let p = four();
    const click = p.inputs.find((i) => i.cue)!;
    p = model.spUpdateInput(p, click.id, { audience: 'audience' });
    const issue = issueOf(p, 'cue-to-audience');
    assert.ok(issue.actions.includes('cue-audience-ok'));
    const ed = standIn(p);
    actions.runIssueAction(ed, issue, 'cue-audience-ok');
    assert.equal(has(ed.project, 'cue-to-audience'), false);
    const after = ed.project.inputs.find((i) => i.id === click.id)!;
    assert.equal(after.audience, 'audience');
    assert.equal(after.cue, true);
  });

  it('every "to be confirmed" card goes to its own row, in its own area', () => {
    const open = review.spReview(four()).filter((i) => i.level === 'open');
    assert.ok(open.length > 0, 'the example leaves details to be confirmed on purpose');
    for (const issue of open) {
      const ed = standIn(four());
      actions.goToIssue(ed, issue);
      const [area, sel] = ed.went[0] as [string, { kind: string; id: string } | null];
      assert.ok(sel && sel.id, `"${issue.text}" opens a row`);
      assert.equal(area, sel.kind === 'mix' || sel.kind === 'device' ? 'monitors' : 'inputs');
    }
    // An item of the listed equipment is a selection the editor can hold.
    const ex = model.spAddExtra(four(), { kind: 'stage-box', label: 'Stage box' });
    const about = review.spReview(ex.p).find((i) => i.target.kind === 'extra' && i.target.id === ex.id);
    assert.ok(about, 'an extra with no supplier is asked about on its own row');
    assert.deepEqual(actions.spIssueSelection(about), { kind: 'extra', id: ex.id });
  });

  it('a source not on the stage: "locate" only jumps, "off the stage on purpose" answers it', () => {
    let p = four();
    const src = p.sources.find((s) => p.objects.some((o) => o.sourceId === s.id))!;
    p = model.spRemoveObjects(p, p.objects.filter((o) => o.sourceId === src.id || o.performerId === src.performerId).map((o) => o.id));
    const issue = review.spReview(p).find((x) => x.rule === 'source-unplaced' && x.target.id === src.id);
    assert.ok(issue, 'the source is now reported as not on the stage');
    const ed = standIn(p);
    actions.runIssueAction(ed, issue, 'locate');
    assert.deepEqual(ed.went, [['stage', { kind: 'source', id: src.id }]]);
    assert.equal(ed.edits, 0);
    actions.runIssueAction(ed, issue, 'mark-offstage');
    assert.equal(review.spReview(ed.project).some((x) => x.rule === 'source-unplaced' && x.target.id === src.id), false);
  });

  it('a source with no input: acoustic or self-contained, in the band’s own words', () => {
    const a = model.spAddSource(four(), { label: 'Cajón', category: 'percussion' });
    const issue = issueOf(a.p, 'source-no-input');
    for (const [action, reason] of [
      ['mark-acoustic', 'acoustic'],
      ['mark-self-contained', 'self-contained'],
    ] as const) {
      const ed = standIn(a.p);
      actions.runIssueAction(ed, issue, action);
      const s = ed.project.sources.find((x) => x.id === a.id)!;
      assert.equal(s.connection, 'none');
      assert.equal(s.noneReason, reason);
      assert.equal(has(ed.project, 'source-no-input'), false);
      assert.equal(derive.spSummary(ed.project).house.channels, 14, 'no input was added for it');
    }
    const ed = standIn(a.p);
    actions.runIssueAction(ed, issue, 'add-inputs');
    assert.deepEqual(ed.went, [['inputs', { kind: 'source', id: a.id }]]);
  });

  it('a performer with no monitor: "no monitor is intended" or a new mix with them on it', () => {
    const a = model.spAddPerformer(four(), { name: 'Sam', role: 'Trumpet' });
    const issue = review.spReview(a.p).find((x) => x.rule === 'performer-no-monitor' && x.target.id === a.id)!;
    const none = standIn(a.p);
    actions.runIssueAction(none, issue, 'mark-no-monitor');
    assert.equal(none.project.performers.find((x) => x.id === a.id)!.noMonitor, true);
    assert.equal(has(none.project, 'performer-no-monitor'), false);

    // "Add a monitor mix" is the same door as the ADD A MIX button: Monitors
    // opens for this performer and proposes the mix WITH its devices. Nothing
    // is added from the review list, and nothing about the mix is guessed.
    const mix = standIn(a.p);
    actions.runIssueAction(mix, issue, 'add-mix');
    assert.equal(mix.edits, 0);
    assert.equal(mix.project.mixes.length, a.p.mixes.length, 'distinct mixes did not change');
    assert.deepEqual(mix.went, [['monitors', { kind: 'performer', id: a.id }]]);
  });

  it('renumbering a revision that was already shared asks first; a draft is renumbered directly', () => {
    let p = four();
    p = model.spSetNumber(p, 'house', p.inputs[1].id, 1);
    const asked: { title: string; body: string; yes: () => void }[] = [];
    actions.setSpIssueAsk((title, body, _yesText, yes) => asked.push({ title, body, yes }));
    try {
      // a draft that was never shared: no question
      const draft = standIn(p);
      actions.runIssueAction(draft, issueOf(p, 'duplicate-channel'), 'renumber');
      assert.equal(asked.length, 0);
      assert.equal(has(draft.project, 'duplicate-channel'), false);

      // shared: nothing changes until the band says yes
      const sharedDoc = model.spFreeze(p);
      assert.equal(actions.spRevisionShared(sharedDoc), true);
      const ed = standIn(sharedDoc);
      actions.runIssueAction(ed, issueOf(sharedDoc, 'duplicate-channel'), 'renumber');
      assert.equal(asked.length, 1);
      assert.equal(ed.edits, 0, 'not renumbered silently (handoff §4)');
      assert.match(asked[0].body, /Revision 1 .* already shared/);
      assert.match(asked[0].body, /revision 2/);
      asked[0].yes();
      assert.equal(has(ed.project, 'duplicate-channel'), false);
      assert.equal(ed.project.revision, 2, 'the changed list carries the next revision number');
    } finally {
      actions.setSpIssueAsk(null);
    }
  });

  it('a duplicate channel number: "renumber" clears it in that patch only; a device and an icon keep their own answers', () => {
    let p = four();
    p = model.spSetNumber(p, 'house', p.inputs[1].id, 1);
    const ed = standIn(p);
    actions.runIssueAction(ed, issueOf(p, 'duplicate-channel'), 'renumber');
    assert.equal(has(ed.project, 'duplicate-channel'), false);
    assert.deepEqual(derive.spPatchRows(ed.project, 'house').map((r) => r.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

    const d = model.spAddDevice(four(), { type: 'wedge', label: 'Spare wedge' });
    const dev = standIn(d.p);
    actions.runIssueAction(dev, issueOf(d.p, 'device-no-mix'), 'assign-mix');
    assert.deepEqual(dev.went, [['monitors', { kind: 'device', id: d.id }]]);
    actions.runIssueAction(dev, issueOf(d.p, 'device-no-mix'), 'mark-self-contained-device');
    assert.equal(has(dev.project, 'device-no-mix'), false);

    const o = model.spAddObject(four(), 'piano', { x: 1.2, y: 0.5 });
    const obj = standIn(o.p);
    actions.runIssueAction(obj, issueOf(o.p, 'icon-no-input'), 'mark-visual');
    actions.runIssueAction(obj, issueOf(o.p, 'object-offstage'), 'object-offstage-ok');
    assert.equal(has(obj.project, 'icon-no-input'), false);
    assert.equal(has(obj.project, 'object-offstage'), false);
    assert.equal(derive.spSummary(obj.project).house.channels, 14, 'a drawing never added an input');
  });
});

/* ── the two guides and the wiring ──────────────────────────────────────── */

const words = (s: string) => s.trim().split(/\s+/).length;
function checkGuide(name: string, g: ScreenGuide, sources: string): void {
  assert.ok(g.intro, `${name}: an intro`);
  assert.ok(words(g.intro.learning) <= 30, `${name}: learning is ${words(g.intro.learning)} words`);
  assert.ok(words(g.intro.start) <= 40, `${name}: start is ${words(g.intro.start)} words`);
  for (const key of ['seeing', 'control', 'changes', 'teaches'] as const) {
    assert.ok(g[key].length >= 1 && g[key].length <= 5, `${name}.${key}: 1 to 5 lines`);
    for (const line of g[key]) assert.ok(line.length > 20, `${name}.${key}: "${line}" is too short`);
    assert.ok(g[key].join('\n').length <= (key === 'control' ? 700 : 410), `${name}.${key}: ${g[key].join('\n').length} characters`);
  }
  assert.ok(g.tryThis.length >= 2 && g.tryThis.length <= 3, `${name}.tryThis: 2 or 3`);
  for (const t of g.tryThis) assert.ok(t.length <= 200, `${name}.tryThis: ${t.length} characters`);
  const all = [g.intro.learning, g.intro.start, ...g.seeing, ...g.control, ...g.changes, ...g.teaches, ...g.tryThis].join('\n');
  assert.doesNotMatch(all, /colour|behaviour|centre|programme|\bgrey\b|organis|recognis/i, `${name}: US spelling`);
  assert.doesNotMatch(all, /you(’|')ll (master|build|mix)|you will be able to|at once|research shows|studies show/i, `${name}: knowledge, not promises`);
  assert.doesNotMatch(g.teaches.join('\n'), /this screen (shows|lists|contains)/i);
  // Every word in capitals that `control` quotes is a real label on the screen.
  for (const line of g.control) {
    for (const phrase of line.match(/\b[A-Z]{2,}(?: [A-Z]+)*\b/g) ?? []) {
      assert.ok(sources.includes(phrase), `${name}.control quotes "${phrase}", which is not a label in the screen's source`);
    }
  }
}

describe('the Library and Setup screen guides', () => {
  it('keep the house guide shape, speak to the user, and quote only real labels', () => {
    checkGuide('library', SP_GUIDE_LIBRARY, read('src/screens/lab/stageplot/ProjectLibrary.tsx'));
    // Setup is drawn by three files: the area, the guided task inside it, and
    // the bar above every area (UNDO, REDO, ALL PLOTS).
    checkGuide('setup', SP_GUIDE_SETUP, read('src/screens/lab/stageplot/SetupArea.tsx') + read('src/screens/lab/stageplot/GuidedTask.tsx') + read('src/screens/lab/stageplot/StagePlotLabScreen.tsx'));
    for (const g of [SP_GUIDE_LIBRARY, SP_GUIDE_SETUP]) {
      const text = [g.intro?.learning, g.intro?.start, ...g.seeing, ...g.control, ...g.changes, ...g.teaches, ...g.tryThis].join('\n');
      assert.doesNotMatch(text, /\bkeys?\b|band member|\bproject\b|\bsession\b|\bchips?\b/i, 'one name per thing: button, performer, stage plot');
    }
    const lines = (g: ScreenGuide) => [...g.seeing, ...g.control, ...g.changes, ...g.teaches, ...g.tryThis];
    const shared = lines(SP_GUIDE_LIBRARY).filter((l) => lines(SP_GUIDE_SETUP).includes(l));
    assert.deepEqual(shared, [], 'no two screens share a guide line');
  });
});

describe('the shell is wired as the builders’ contract says', () => {
  const ctx = read('src/screens/lab/stageplot/spContext.tsx');
  const form = read('src/screens/lab/stageplot/spForm.tsx');
  const screen = read('src/screens/lab/stageplot/StagePlotLabScreen.tsx');

  it('spContext exports the editor contract, word for word', () => {
    for (const piece of [
      "export type SpAreaId = 'setup' | 'stage' | 'inputs' | 'monitors' | 'export';",
      "export type SpSelection = { kind: 'object' | 'input' | 'source' | 'performer' | 'mix' | 'device' | 'di' | 'extra'; id: string } | null;",
      'flush: () => void;',
      "export type SpSaveState = 'saved' | 'saving' | 'session-only' | 'failed';",
      'apply: (change: (p: SpProject) => SpProject) => void;',
      'goTo: (area: SpAreaId, select?: SpSelection) => void;',
      'issues: SpIssue[];',
      'markExported: () => void;',
      'exported: boolean;',
      'export function useSpEditor(): SpEditor',
    ])
      assert.ok(ctx.includes(piece), `spContext.tsx lost: ${piece}`);
  });

  it('spForm exports the whole kit, and a one-line text always shrinks instead of being cut', () => {
    for (const name of ['Section', 'TextField', 'NumberField', 'Choice', 'Switch', 'MoreDetails', 'RowCard', 'Button', 'Note', 'Count', 'HelpTip', 'IssueList', 'Sheet']) {
      assert.match(form, new RegExp(`export function ${name}\\b`), `spForm.tsx exports ${name}`);
    }
    for (const src of [form, screen, read('src/screens/lab/stageplot/SetupArea.tsx'), read('src/screens/lab/stageplot/ProjectLibrary.tsx'), read('src/screens/lab/stageplot/GuidedTask.tsx')]) {
      assert.doesNotMatch(src, /numberOfLines=\{1\}/, 'use {...fitValue(fontSize)}');
      assert.doesNotMatch(src, /Alert\.alert|\.goBack\(|InteractionManager/);
      const sizes = [...src.matchAll(/fontSize:\s*([\d.]+)/g)].map((m) => Number(m[1]));
      assert.deepEqual(sizes.filter((s) => s < 9), [], 'nothing under 9 pt');
    }
  });

  it('the screen: the shared header and guide host, five tabs in order that are not a sequence, and the preview row', () => {
    assert.match(screen, /<LabHeader\b/);
    assert.match(screen, /<ScreenGuideHost\b/);
    // AGENTS.md: a guest is told work is not saved through the house reminder
    // (one popup per activity per session). The lab's own words about STAGE
    // PLOTS are beside it: the note on the list, the line in the bar.
    assert.match(screen, /<GuestStartReminder activity=\{`lab:\$\{STAGE_PLOT_LAB_KEY\}`\} kind="progress"/);
    assert.match(screen, /would need a new kind in the shared rules file, which is the owner's call \[MD:D60\]/);
    assert.match(screen, /'session-only': 'Not saved: kept only until you close the app'/);
    assert.match(screen, /Rev \{p\.revision\} · \{statusWord\}/, 'the revision and status are on screen in every area');
    assert.match(screen, /aria-selected=\{on\}/, 'the chosen tab is said on the web too');
    assert.match(screen, /setSpIssueAsk\(\(title, body, yesText, yes\) => confirmDialog\(title, body, yesText, yes\)\);/);
    assert.deepEqual([...ctx.matchAll(/\{ id: '(\w+)', label: '([A-Z]+)' \}/g)].map((m) => m[2]), ['SETUP', 'STAGE', 'INPUTS', 'MONITORS', 'EXPORT']);
    assert.match(screen, /onPress=\{\(\) => ed\.goTo\(a\.id\)\}/, 'any tab opens from any tab');
    assert.doesNotMatch(screen, /accessibilityRole="tab"[^>]*disabled/, 'no tab is ever locked');
    assert.match(screen, /persistAllowed\(tier\) \? 'write' : holdAllowed\(tier\) \? 'hold' : 'drop'/, 'who is saved comes from the tier, never a guess');
    assert.match(screen, /useBackWhileFocused\(open != null, backToLibrary\)/);
    const previews = read('src/dev/webPreviews.tsx');
    assert.match(previews, /import \{ StagePlotLabScreen \} from '\.\.\/screens\/lab\/stageplot\/StagePlotLabScreen';/);
    assert.match(previews, /StagePlotLab: StagePlotLabScreen as ComponentType,/);
  });

  it('"not signed in" is said only to a known guest: the account branch comes first, a preview has its own words', () => {
    const lib = read('src/screens/lab/stageplot/ProjectLibrary.tsx');
    const line = lib.slice(lib.indexOf('export function spNotSavedLine'), lib.indexOf('const CAP_LINE'));
    assert.match(line, /if \(persistAllowed\(tier\)\) return null;/);
    const preview = line.indexOf("tier === 'preview'");
    const account = line.indexOf('if (!wording.guest) return `${accountWhy(wording.account ?? \'checking\')}');
    const guest = line.indexOf('You are not signed in');
    assert.ok(preview > 0 && account > preview && guest > account, 'preview, then the account still being checked, then a known guest');
    assert.match(lib, /const wording = useGuestWording\(\);/);
    assert.doesNotMatch(lib + screen, /entitlement === 'anonymous'/);
    assert.doesNotMatch(lib + screen + form, /\bfree\b|membership|upgrade|subscri/i, 'the tool never talks about payment or plans');
  });

  it('one area that throws does not take the lab or the stage plot with it', () => {
    assert.match(screen, /class AreaBoundary extends Component</);
    assert.match(screen, /static getDerivedStateFromError\(error: Error\)/);
    assert.match(screen, /captureError\(error, \{ boundary: 'stageplot-area', area: this\.props\.what \}\);/, 'a contained crash is still reported');
    // around the area only: the bar and the tabs are outside it, and stay
    const bar = screen.indexOf('<View style={styles.bar}>');
    const tabs = screen.indexOf('accessibilityRole="tablist"');
    const boundary = screen.indexOf('<AreaBoundary key={area} what={area} onCaught={ed.flush}');
    assert.ok(bar > 0 && tabs > bar && boundary > tabs, 'bar, then tabs, then the boundary around the area in view');
    assert.match(screen, /This part could not be shown\. Your stage plot is kept\./);
    assert.match(screen, /TRY AGAIN/);
    assert.match(screen, /<AreaBoundary what="library"/);
  });

  it('typed text cannot be lost: a field also commits after a pause and when the app leaves the foreground', () => {
    assert.match(form, /export const SP_FIELD_IDLE_MS = 1500;/);
    assert.match(form, /idle\.current = setTimeout\(pause, SP_FIELD_IDLE_MS\);/);
    assert.match(form, /AppState\.addEventListener\('change', \(state\) => \{\n\s*if \(state !== 'active'\) pauseRef\.current\(\);/);
    assert.match(form, /return \(\) => sub\.remove\(\);/, 'the listener is removed');
    assert.match(form, /if \(idle\.current\) clearTimeout\(idle\.current\);/, 'the timer is cleared on every key and on unmount');
    // what is chosen, on or open reaches a screen reader on the web as well
    // …each with a role the state belongs to: switch + checked, radio in a
    // radiogroup + checked, button + expanded, tab in a tablist + selected.
    for (const pair of [
      /accessibilityRole="switch"\n\s*accessibilityState=\{\{ checked: p\.value \}\}\n\s*aria-checked=\{p\.value\}/,
      /accessibilityRole="radio"\n\s*accessibilityState=\{\{ selected: on, checked: on \}\}\n\s*aria-checked=\{on\}/,
      /accessibilityRole="radiogroup" aria-label=\{p\.label\}/,
      /accessibilityRole="button" accessibilityState=\{\{ expanded: open \}\} aria-expanded=\{open\}/,
      /aria-disabled=\{off\}/,
    ])
      assert.match(form, pair);
    assert.match(screen, /accessibilityRole="tablist"/);
    assert.match(screen, /accessibilityRole="tab"\n\s*accessibilityState=\{\{ selected: on \}\}\n\s*aria-selected=\{on\}/);
    assert.match(form, /\$\{p\.value \? 'on' : 'off'\}/, 'a switch also says its state in its label');
    assert.match(form, /badgeText: \{[^}]*fontSize: 12[^}]*textTransform: 'uppercase'/, 'a badge is 12 pt and in capitals');
    // a refused save is owed, and the editor can be told to save now
    assert.match(ctx, /if \(result === 'failed'\) dirty\.current = true;/);
    assert.match(ctx, /flush: saveNow,/);
  });

  it('the remove-performer sheet lists what spPerformerLinks names and promises nothing is left behind', () => {
    const setup = read('src/screens/lab/stageplot/SetupArea.tsx');
    assert.match(setup, /const links = leaving \? spPerformerLinks\(p, leaving\.id\) : null;/);
    assert.doesNotMatch(setup, /leftDrawings|leftDevices|Left on the stage|with no mix\./);
    // the model removes all of it with the first choice, so the words can say so
    let p = four();
    const drummer = p.performers.find((x) => p.mixes.some((m) => m.recipients.length === 1 && m.recipients[0] === x.id) && p.sources.some((src) => src.performerId === x.id))!;
    const links = model.spPerformerLinks(p, drummer.id);
    assert.ok(links.devices.length > 0 && links.objects.length > 1, 'the example performer has devices and drawings of their own');
    p = model.spRemovePerformer(p, drummer.id, { withSources: true });
    for (const d of links.devices) assert.equal(p.devices.some((x) => x.id === d.id), false, `${d.label} went with them`);
    for (const o of links.objects) assert.equal(p.objects.some((x) => x.id === o.id), false, `${o.label} went with them`);
    assert.equal(review.spReview(p).some((i) => i.rule === 'device-no-mix' || i.rule === 'icon-no-input' || i.rule === 'icon-no-device'), false, 'no new question about something left standing');
  });

  it('the store is on the shared safe store, under one swept key, and exports no stray reset', () => {
    const s = read('src/features/stageplot/spStore.ts');
    assert.match(s, /from '\.\.\/storage\/localStore'/);
    assert.match(s, /export const SP_STORE_KEY = 'ape:stageplot:v1';/);
    assert.doesNotMatch(s, /AsyncStorage/);
    assert.match(s, /export function resetLocal\(\): void \{\n\s*store\.reset\(\);\n\}/);
  });
});
