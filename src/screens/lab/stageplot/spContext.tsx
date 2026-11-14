/**
 * spContext — THE EDITOR of one open Stage Plot project (must-do D60). Every
 * work area (Setup, Stage, Inputs, Monitors, Export) reads the project from
 * here and changes it through `apply`, so the five areas are five views of
 * one object and can never disagree.
 *
 * What the editor guarantees:
 *   • ONE WAY TO EDIT. `apply` takes a function made of spModel edits:
 *         ed.apply((p) => spUpdateInput(p, id, { stand: 'tall-boom' }))
 *     The change runs IMMEDIATELY (before `apply` returns), is recorded for
 *     UNDO, and is saved by itself a moment later. Nothing else writes.
 *   • UNDO / REDO by the rules of features/stageplot/spHistory: only a real
 *     change is a step, sharing a revision is not a step, and a shared
 *     revision number is never used again.
 *   • AUTOSAVE. A short timer after the last change, flushed when the editor
 *     closes. `saveState` says, in one word the screen spells out, where the
 *     work stands: 'saved' comes only from a write the device accepted.
 *   • NO STALE SELECTION. A selected row that an edit or an UNDO removed
 *     reads as no selection.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { spCanRedo, spCanUndo, spHistoryApply, spHistoryRedo, spHistoryStart, spHistoryUndo, type SpHistory } from '../../../features/stageplot/spHistory';
import { spReview, type SpIssue } from '../../../features/stageplot/spReview';
import { getSpProject, getSpSaveMode, saveSpProject, spStoreGeneration, type SpSaveMode } from '../../../features/stageplot/spStore';
import type { SpProject } from '../../../features/stageplot/spTypes';

export type SpAreaId = 'setup' | 'stage' | 'inputs' | 'monitors' | 'export';
export type SpSelection = { kind: 'object' | 'input' | 'source' | 'performer' | 'mix' | 'device' | 'di' | 'extra'; id: string } | null;
export type SpSaveState = 'saved' | 'saving' | 'session-only' | 'failed';
export type SpEditor = {
  project: SpProject;
  /** Make an edit with spModel functions; it is saved automatically and can be undone.
   *  ed.apply((p) => spUpdateInput(p, id, { stand: 'tall-boom' })) */
  apply: (change: (p: SpProject) => SpProject) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selection: SpSelection;
  select: (s: SpSelection) => void;
  area: SpAreaId;
  /** Switch work area, optionally selecting a row there ("Locate on stage"). */
  goTo: (area: SpAreaId, select?: SpSelection) => void;
  /** The review list for the current project (memoized). */
  issues: SpIssue[];
  /** 'session-only' = a guest or a preview: the work is kept for this session and not saved. */
  saveState: SpSaveState;
  /** A packet was made from this revision (the Export area calls it; the guided task reads it). */
  markExported: () => void;
  exported: boolean;
  /** Save what is on screen NOW, without waiting for the autosave timer (the
   *  Export area calls it before it takes its snapshot). */
  flush: () => void;
};

/** The five work areas, in the order of the tab bar. Not a forced sequence. */
export const SP_AREAS: readonly { id: SpAreaId; label: string }[] = [
  { id: 'setup', label: 'SETUP' },
  { id: 'stage', label: 'STAGE' },
  { id: 'inputs', label: 'INPUTS' },
  { id: 'monitors', label: 'MONITORS' },
  { id: 'export', label: 'EXPORT' },
];

/** How long after the last change the project is saved. */
export const SP_AUTOSAVE_MS = 450;

const Ctx = createContext<SpEditor | null>(null);

export function useSpEditor(): SpEditor {
  const ed = useContext(Ctx);
  if (!ed) throw new Error('useSpEditor: no Stage Plot project is open (SpEditorProvider is missing above this component).');
  return ed;
}

/** Does the row a selection points at still exist? */
function selectionAlive(p: SpProject, s: NonNullable<SpSelection>): boolean {
  const has = (list: readonly { id: string }[]) => list.some((x) => x.id === s.id);
  switch (s.kind) {
    case 'object':
      return has(p.objects);
    case 'input':
      return has(p.inputs);
    case 'source':
      return has(p.sources);
    case 'performer':
      return has(p.performers);
    case 'mix':
      return has(p.mixes);
    case 'device':
      return has(p.devices);
    case 'di':
      return has(p.diDevices);
    case 'extra':
      return has(p.extras);
  }
}

export function SpEditorProvider({
  initial,
  initialSaveState,
  mode,
  initialArea = 'setup',
  children,
}: {
  /** The project as opened from the library. */
  initial: SpProject;
  /** Where it stood when it was opened (from the write that made it, or the store). */
  initialSaveState: SpSaveState;
  /** Who is saved, from useTier(): a change of it saves the project again. */
  mode: SpSaveMode;
  initialArea?: SpAreaId;
  children: ReactNode;
}) {
  const histRef = useRef<SpHistory | null>(null);
  if (histRef.current === null) histRef.current = spHistoryStart(initial);
  const [hist, setHist] = useState<SpHistory>(histRef.current);
  const [selection, setSelection] = useState<SpSelection>(null);
  const [area, setArea] = useState<SpAreaId>(initialArea);
  const [saveState, setSaveState] = useState<SpSaveState>(initialSaveState);
  const [exportedRev, setExportedRev] = useState<number | null>(null);

  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const saveSeq = useRef(0);
  const openedGen = useRef(spStoreGeneration());

  /** Write what is on screen now. The newest save's answer is the one shown. */
  const saveNow = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const h = histRef.current;
    if (!dirty.current || !h) return;
    // The account changed under the open editor (a wipe ran). The project is
    // saved again only once it is in THIS account's library: a guest's work
    // carried over by a sign-in is; the last person's open project is not.
    const gen = spStoreGeneration();
    if (gen !== openedGen.current) {
      if (!getSpProject(h.present.id)) {
        if (alive.current) setSaveState('session-only');
        return;
      }
      openedGen.current = gen;
    }
    dirty.current = false;
    const seq = ++saveSeq.current;
    void saveSpProject(h.present).then((result) => {
      if (seq !== saveSeq.current) return;
      // A write the device refused is still owed: the next change, FLUSH, or
      // closing the editor tries it again.
      if (result === 'failed') dirty.current = true;
      if (alive.current) setSaveState(result);
    });
  }, []);

  const commit = useCallback(
    (next: SpHistory) => {
      const was = histRef.current;
      if (!was || next === was) return;
      // The time of the last change is stamped here, not by the model, and
      // only for a change of what the document SAYS: sharing a revision or
      // changing its status is not a change to the document (it keeps `past`).
      const stamped: SpHistory = next.past === was.past ? next : { ...next, present: { ...next.present, modifiedAt: Date.now() } };
      histRef.current = stamped;
      setHist(stamped);
      dirty.current = true;
      setSaveState(getSpSaveMode() === 'write' ? 'saving' : 'session-only');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(saveNow, SP_AUTOSAVE_MS);
    },
    [saveNow],
  );

  const apply = useCallback(
    (change: (p: SpProject) => SpProject) => {
      const h = histRef.current;
      if (!h) return;
      let next: SpProject;
      try {
        next = change(h.present);
      } catch (e) {
        // An edit that throws changes nothing; the project on screen stands.
        console.warn('[stageplot] an edit failed and was not applied:', e);
        return;
      }
      if (!next) return;
      commit(spHistoryApply(h, next));
    },
    [commit],
  );
  const undo = useCallback(() => {
    if (histRef.current) commit(spHistoryUndo(histRef.current));
  }, [commit]);
  const redo = useCallback(() => {
    if (histRef.current) commit(spHistoryRedo(histRef.current));
  }, [commit]);

  // Closing the editor (or leaving the lab) saves what the timer still held.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      saveNow();
    };
  }, [saveNow]);

  // Who is saved changed. An account check that finished, or a sign-in: the
  // work kept for the session is written now. The other way (a sign-out):
  // nothing is saved for anyone; the words change, and the project stays in
  // this editor only.
  const lastMode = useRef(mode);
  useEffect(() => {
    if (lastMode.current === mode) return;
    lastMode.current = mode;
    if (mode === 'write') {
      dirty.current = true;
      saveNow();
    } else {
      setSaveState((s) => (s === 'saving' ? s : 'session-only'));
    }
  }, [mode, saveNow]);

  const project = hist.present;
  const issues = useMemo(() => spReview(project), [project]);
  const liveSelection = useMemo(() => (selection && selectionAlive(project, selection) ? selection : null), [project, selection]);
  const goTo = useCallback((next: SpAreaId, select?: SpSelection) => {
    setArea(next);
    if (select !== undefined) setSelection(select);
  }, []);
  const markExported = useCallback(() => {
    if (histRef.current) setExportedRev(histRef.current.present.revision);
  }, []);

  const value = useMemo<SpEditor>(
    () => ({
      project,
      apply,
      undo,
      redo,
      canUndo: spCanUndo(hist),
      canRedo: spCanRedo(hist),
      selection: liveSelection,
      select: setSelection,
      area,
      goTo,
      issues,
      saveState,
      markExported,
      // Only a REAL packet (DOWNLOAD PDF, SHARE, PRINT) of this revision, and
      // also after a restart (the project records it). "Ready" and COPY
      // TECHNICAL SUMMARY freeze a revision but make no packet (R2-SP1-01).
      exported: exportedRev === project.revision || project.packetRevision >= project.revision,
      flush: saveNow,
    }),
    [project, apply, undo, redo, hist, liveSelection, area, goTo, issues, saveState, markExported, exportedRev, saveNow],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
