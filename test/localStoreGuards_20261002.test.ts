/**
 * G1 (pattern catalog 2026-10-02, rank-1 class P1): NO NEW storage read whose
 * failure becomes an empty value that the next save writes over the real one.
 *
 * Every file under src/ that both READS storage (`AsyncStorage.getItem` or
 * `AsyncStorage.multiGet`) and WRITES it must, FOR EVERY READ,
 *   • be on the shared safe store (features/storage/localStore.ts) — then it
 *     has no direct read at all and this test never sees it — or
 *   • handle that read's failure with a house idiom IN CODE, on the read's own
 *     failure path (see FAILED_READ_IDIOMS below), or
 *   • be listed in SAFE_ON_FAILED_READ (one read site, `file#function`) or
 *     STILL_HAND_ROLLED (a whole file), with a one-line reason.
 *
 * TIGHTENED (G1 tightening, 2026-10-02 evening). The first version matched an
 * idiom WORD anywhere in the file, so it was satisfied by accident three ways:
 *   1. by COMMENTS — GlossaryScreen, glossaryCap and publicProfile passed on a
 *      comment that said "unreadable" or "read failed";
 *   2. by UNRELATED CODE — attractStore passed on the `hydrating = null` in
 *      resetLocal(), nowhere near its read;
 *   3. by missing `multiGet` — Cable Install's score wipe went straight past.
 * The check is now structural, on the TypeScript syntax tree: comments are not
 * code, only the read's OWN catch / `.catch` / rejection path counts, and every
 * read is judged on its own.
 *
 * The lists may only SHRINK: an entry whose read site no longer exists, or now
 * carries a real idiom, fails the ratchet until it is removed.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const HELPER = 'features/storage/localStore.ts';

const READ_METHOD = /^(getItem|multiGet)$/;
const WRITE_METHOD = /^(setItem|multiSet|removeItem|multiRemove|mergeItem)$/;
/** A variable / ref / set whose NAME says "the read failed". */
const FLAG_NAME = /readFailed|ReadFailed|[uU]nreadable|loadFailed|LoadFailed|readError|readBlocked|blockedLoad|blockedRead/;

/**
 * The accepted idioms — each one a thing the read's own failure path DOES:
 *   marks-unreadable     sets a failed-read flag (`readFailed = true`,
 *                        `unreadable.add(s)`, `readRef.current = 'failed'`,
 *                        `setXUnreadable(true)`) that the writers check;
 *   stays-unhydrated     `hydrating = null` / `loading = null` without marking
 *                        itself hydrated — the next action reads again;
 *   reads-again          the failure path reads once more;
 *   throws / propagates  the failure rejects out of the function (an awaited
 *                        read with no local catch) — nothing after it runs;
 *   failure-sentinel     returns a value that NAMES the failure ('unreadable',
 *                        READ_FAILED, `{ ok: false }`);
 *   null-means-unread    returns null from a function typed `… | null` whose
 *                        other returns never produce null — "we do not know";
 *   refuses-the-write    leaves the function before a write that follows the
 *                        try, or nulls the value a later `if (x)` write needs;
 *   skips-the-write      the write sits in the same try, after the read, and
 *                        the failure path writes nothing;
 *   only-success-clears  the flag starts set and only a SUCCESSFUL read clears
 *                        it (`readFailed = false` / `unreadable.delete(id)`
 *                        after the read in the try) — the retry-loop idiom;
 *   read-only-key        the key is a file-private constant this file only
 *                        ever reads — there is no write here to protect.
 */
type Judged = { line: number; site: string; idioms: string[] };

function nameOf(e: ts.Node): string {
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return `${nameOf(e.expression)}.${e.name.text}`;
  return '';
}
function storageCall(n: ts.Node, method: RegExp): n is ts.CallExpression {
  return (
    ts.isCallExpression(n) &&
    ts.isPropertyAccessExpression(n.expression) &&
    ts.isIdentifier(n.expression.expression) &&
    n.expression.expression.text === 'AsyncStorage' &&
    method.test(n.expression.name.text)
  );
}
const isRead = (n: ts.Node) => storageCall(n, READ_METHOD);
const isWrite = (n: ts.Node) => storageCall(n, WRITE_METHOD);
const isAssign = (n: ts.Node): n is ts.BinaryExpression =>
  ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken;
/** Visit `root` and its descendants, not descending into nested functions. */
function visitOwn(root: ts.Node, fn: (n: ts.Node) => void): void {
  (function v(n: ts.Node) {
    if (n !== root && ts.isFunctionLike(n)) return;
    fn(n);
    ts.forEachChild(n, v);
  })(root);
}
const within = (outer: ts.Node, inner: ts.Node) => inner.pos >= outer.pos && inner.end <= outer.end;
function enclosingFunction(n: ts.Node): ts.SignatureDeclaration | undefined {
  for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return p;
  return undefined;
}
/** `file#name`: the nearest NAMED function (or const = arrow) around a read. */
function siteName(n: ts.Node): string {
  for (let p = n.parent; p; p = p.parent) {
    if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name) return p.name.getText();
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && p.initializer && ts.isFunctionLike(p.initializer))
      return p.name.text;
  }
  return '(module)';
}

type FailurePath =
  | { kind: 'catch'; handler: ts.Node | undefined }
  | { kind: 'try'; handler: ts.Block; tryStmt: ts.TryStatement }
  | { kind: 'propagates'; awaited: boolean };

/** Where a rejection of this read goes: a `.catch` / `.then(_, onErr)` on its
 *  own promise chain, the catch of the nearest try around it (inside the same
 *  function), or out of the function. */
function failurePath(call: ts.CallExpression): FailurePath {
  let cur: ts.Node = call;
  for (;;) {
    const p = cur.parent;
    if (ts.isParenthesizedExpression(p)) {
      cur = p;
      continue;
    }
    if (ts.isPropertyAccessExpression(p) && p.expression === cur && ts.isCallExpression(p.parent) && p.parent.expression === p) {
      const c = p.parent;
      if (p.name.text === 'catch') return { kind: 'catch', handler: c.arguments[0] };
      if (p.name.text === 'then' && c.arguments[1]) return { kind: 'catch', handler: c.arguments[1] };
      cur = c;
      continue;
    }
    break;
  }
  let n: ts.Node = call;
  while (n.parent) {
    const p: ts.Node = n.parent;
    if (ts.isTryStatement(p) && p.tryBlock === n && p.catchClause) return { kind: 'try', handler: p.catchClause.block, tryStmt: p };
    if (ts.isFunctionLike(p)) break;
    n = p;
  }
  let q: ts.Node = call.parent;
  while (ts.isParenthesizedExpression(q) || ts.isAsExpression(q)) q = q.parent;
  return { kind: 'propagates', awaited: ts.isAwaitExpression(q) };
}

/** An empty / default value — what a failed read is wrongly taken to mean. */
const STAND_IN =
  /^(\[\]|\{\}|null|undefined|false|true|0|''|""|new (Set|Map)(<[^>]*>)?\(\)|\w*(EMPTY|DEFAULT)\w*|empty\w*\(\)|fresh\w*\([^)]*\)|\{\s*\.\.\.\w*(EMPTY|DEFAULT)\w*[^}]*\})$/;

/** Module-level `let` / `var` names: the store's in-memory state. */
const moduleLetCache = new WeakMap<ts.SourceFile, Set<string>>();
function moduleLets(sf: ts.SourceFile): Set<string> {
  let out = moduleLetCache.get(sf);
  if (!out) {
    out = new Set<string>();
    for (const st of sf.statements)
      if (ts.isVariableStatement(st) && !(st.declarationList.flags & ts.NodeFlags.Const))
        for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) out.add(d.name.text);
    moduleLetCache.set(sf, out);
  }
  return out;
}

function judgeRead(call: ts.CallExpression): string[] {
  const fp = failurePath(call);
  if (fp.kind === 'propagates') return fp.awaited ? ['propagates'] : [];
  const h = fp.handler;
  if (!h) return [];
  const body: ts.Node = ts.isArrowFunction(h) || ts.isFunctionExpression(h) ? h.body : h;
  const found = new Set<string>();
  let marksHydrated = false;
  let unhydrated = false;
  const nulled = new Set<string>();
  /** The failure path puts a STAND-IN (an empty / default value) into module
   *  state — what a later save writes — so "this function's own write was
   *  skipped or refused" proves nothing. */
  let fillsModuleState = false;
  const sentinel = (e: ts.Expression) => {
    const t = e.getText();
    if (/^['"`]\w*(unreadable|failed)\w*['"`]$/i.test(t) || /^\w*(READ_FAILED|UNREADABLE)\w*$/.test(t)) found.add('failure-sentinel');
    if (ts.isObjectLiteralExpression(e) && /\bok:\s*false\b/.test(t)) found.add('failure-sentinel');
  };
  visitOwn(body, (n) => {
    if (ts.isThrowStatement(n)) found.add('throws');
    if (isAssign(n)) {
      const nm = nameOf(n.left);
      const rhs = n.right.getText();
      if (FLAG_NAME.test(nm) && !/^(false|null|undefined)$/.test(rhs)) found.add('marks-unreadable');
      if (/(^|\.)(readRef|readState)\w*\.current$/.test(nm) && /failed|unreadable/i.test(rhs)) found.add('marks-unreadable');
      if (/^(hydrating|loading)$/.test(nm) && rhs === 'null') unhydrated = true;
      if (/^hydrated$/.test(nm) && rhs === 'true') marksHydrated = true;
      if (ts.isIdentifier(n.left) && /^(null|false)$/.test(rhs)) nulled.add(n.left.text);
      if (ts.isIdentifier(n.left) && moduleLets(call.getSourceFile()).has(n.left.text) && STAND_IN.test(rhs)) fillsModuleState = true;
    }
    if (ts.isCallExpression(n)) {
      if (ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'add' && FLAG_NAME.test(nameOf(n.expression.expression)))
        found.add('marks-unreadable');
      if (/^set\w*Unreadable$|^markUnreadable$/.test(nameOf(n.expression)) && n.arguments[0]?.getText() !== 'false')
        found.add('marks-unreadable');
      if (isRead(n)) found.add('reads-again');
    }
    if (ts.isReturnStatement(n) && n.expression) sentinel(n.expression);
  });
  if (!ts.isBlock(body) && ts.isExpression(body)) sentinel(body);
  if (unhydrated && !marksHydrated) found.add('stays-unhydrated');

  if (fp.kind === 'try') {
    const t = fp.tryStmt;
    const fn = enclosingFunction(t);
    const fnBody = fn && 'body' in fn ? (fn.body as ts.Node | undefined) : undefined;
    let exits = false;
    let writesInHandler = false;
    let returnsNull = false;
    visitOwn(body, (n) => {
      if (ts.isReturnStatement(n) || ts.isThrowStatement(n)) exits = true;
      if (ts.isReturnStatement(n) && n.expression?.kind === ts.SyntaxKind.NullKeyword) returnsNull = true;
      if (isWrite(n)) writesInHandler = true;
    });
    let writeAfter = false;
    let guardedWriteAfter = false;
    let writeInTry = false;
    let successClears = false;
    let otherReturnsNull = false;
    if (fnBody) {
      visitOwn(fnBody, (n) => {
        if (isWrite(n) && n.pos >= t.end) {
          writeAfter = true;
          for (let p: ts.Node | undefined = n.parent; p && p !== fnBody; p = p.parent)
            if (ts.isIfStatement(p) && [...nulled].some((v) => new RegExp(`\\b${v}\\b`).test(p.expression.getText())))
              guardedWriteAfter = true;
        }
        if (ts.isReturnStatement(n) && !within(body, n) && (!n.expression || /\bnull\b/.test(n.expression.getText())))
          otherReturnsNull = true;
      });
    }
    visitOwn(t.tryBlock, (n) => {
      if (n.pos < call.end) return;
      if (isWrite(n)) writeInTry = true;
      if (isAssign(n) && FLAG_NAME.test(nameOf(n.left)) && n.right.getText() === 'false') successClears = true;
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        n.expression.name.text === 'delete' &&
        FLAG_NAME.test(nameOf(n.expression.expression))
      )
        successClears = true;
    });
    const quiet = !writesInHandler && !fillsModuleState;
    if (quiet && ((exits && writeAfter) || guardedWriteAfter)) found.add('refuses-the-write');
    if (quiet && writeInTry) found.add('skips-the-write');
    if (successClears) found.add('only-success-clears');
    const declared = fn && 'type' in fn && fn.type ? fn.type.getText() : '';
    if (returnsNull && /\|\s*null\b/.test(declared) && !otherReturnsNull) found.add('null-means-unread');
  }
  return [...found];
}

/** The key is a file-private constant (not exported) that appears nowhere but
 *  inside read calls in this file — the file never writes it. */
function readOnlyKey(call: ts.CallExpression, sf: ts.SourceFile): boolean {
  const arg = call.arguments[0];
  if (!arg || !ts.isIdentifier(arg)) return false;
  const name = arg.text;
  let declaredHere = false;
  let exported = false;
  let otherUse = false;
  (function v(n: ts.Node) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name) {
      declaredHere = true;
      const stmt = n.parent?.parent;
      if (stmt && ts.isVariableStatement(stmt) && stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) exported = true;
    } else if (ts.isIdentifier(n) && n.text === name && !(ts.isVariableDeclaration(n.parent) && n.parent.name === n)) {
      const inRead = (() => {
        for (let p: ts.Node | undefined = n.parent; p; p = p.parent) if (isRead(p)) return within(p.arguments[0] ?? p, n);
        return false;
      })();
      if (!inRead) otherUse = true;
    } else if (ts.isExportSpecifier(n) && n.getText().includes(name)) exported = true;
    ts.forEachChild(n, v);
  })(sf);
  return declaredHere && !exported && !otherUse;
}

/** Judge every read in a source text. Exported shape for the fixtures below. */
function judgeSource(text: string, file = 'x.ts'): { reads: Judged[]; writes: number } {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const reads: Judged[] = [];
  let writes = 0;
  (function v(n: ts.Node) {
    if (isRead(n)) {
      const idioms = judgeRead(n as ts.CallExpression);
      if (idioms.length === 0 && readOnlyKey(n as ts.CallExpression, sf)) idioms.push('read-only-key');
      reads.push({ line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, site: siteName(n), idioms });
    }
    if (isWrite(n)) writes++;
    ts.forEachChild(n, v);
  })(sf);
  return { reads, writes };
}

/** Whole files still hand-rolled on purpose, each with why. */
const STILL_HAND_ROLLED: Record<string, string> = {
  // ── features/account ──────────────────────────────────────────────────
  'features/account/accountLocalSync.ts':
    'the ape:localUserId identity marker: read BEFORE the wipe, written AFTER; a failed read reads as "no marker" on purpose (a change of identity wipes); it is the wipe queue itself',
  // (wave 2, 2026-10-02: deviceIdentity / attemptDraft / quiz api /
  //  localProgress / scenarioQueue / paceStore / lastStudyLocation are done —
  //  scenarioQueue, paceStore and lastStudyLocation moved onto the safe store,
  //  the rest carry the failed-read rule in place; receipts in
  //  localStoreWave2Study_20261002.)
  // (wave 2, 2026-10-02: exposureMonitor and soundSafetyAck are done — the
  //  exposure settings moved onto the safe store, the day record and the
  //  acknowledgment carry the failed-read rule and a generation fence in
  //  place; receipts in localStoreWave2Audio_20261002.)
  // ── features/lab / soundsystems (lab records) ─────────────────────────
  // (wave 2, 2026-10-02: soundsystems/progress, the screens/lab step stores
  //  (Cable / Foundations / Mic Selection), the Cymatics experiment ticks and
  //  the Mixing priorities moved onto the safe store; calcUsage,
  //  amplitudeOrientation, drumProgress, the Mixing focal point and RackUnit
  //  carry the failed-read rule in place; receipts in
  //  localStoreWave2Labs_20261002.)
  // (wave 2, 2026-10-02: the celebration / curriculum / dashboard api /
  //  directory / settings / lowLight / permissions / profile / glossary /
  //  startHere / review / notifications / intro / StudyFsOverlay entries are
  //  done — celebrationSeen moved onto the safe store, the rest carry the
  //  failed-read rule in place; receipts in localStoreWave2Prefs_20261002.)
  // (wave 2, 2026-10-02: calibrationStore and the crowdsource queue in
  //  deviceProfile moved onto the safe store; deviceProfile's consent flag
  //  and the web measurementsBackend carry the failed-read rule in place;
  //  receipts in localStoreWave2Audio_20261002.)
  // ── lib ───────────────────────────────────────────────────────────────
  'lib/authStorage.native.ts': 'the Supabase auth session adapter: supabase-js owns its semantics; it must stay a plain adapter, never a store',
  // ── screens (lab progress kept in the screen) ─────────────────────────
  // (wave 2, 2026-10-02: the Flashcards / Awards / Dashboard / Auth screen
  //  entries are done — each carries the failed-read rule in place; receipts
  //  in localStoreWave2Study_20261002.)
  // (wave 2, 2026-10-02: CenterLockTuner's remembered presets moved onto the
  //  safe store; receipts in localStoreWave2Audio_20261002.)
};

/**
 * ONE read site each (`file#function`) where falling back to a default on a
 * failed read is the SAFE direction, with why (G1 tightening, 2026-10-02).
 *
 * Every one of these passed the first G1 by ACCIDENT — on a comment ("READ
 * failed (wave 2, confirmed) …", "unreadable → keep the default") or, for
 * calcPrefs / SplMeter, by reading with `multiGet`, which the old guard did
 * not see. Moving them here is tightening, not widening: the reason is now
 * written down per read site, and a NEW read in the same file is not covered.
 *
 * What makes a fallback safe: the key holds ONE value that is only ever
 * written WHOLE by the user's own explicit action (a toggle, a pick, a
 * dismissal) — never computed from what was read — or the read feeds nothing
 * that is written back (a cache replaced whole, a display-only read whose
 * writes do their own guarded read-merge).
 */
const SAFE_ON_FAILED_READ: Record<string, string> = {
  // ── per-key device preferences: one value, written whole by the user ──
  'features/glossary/autoOfflinePref.ts#autoOfflineEnabled':
    'one switch, written whole only by the member’s own toggle; a failed read answers ON (the documented safe side) and writes nothing',
  'features/glossary/linksPref.ts#useGlossaryLinksPref':
    'one switch, written whole only by the user’s own toggle; a failed read keeps the default and writes nothing',
  'features/tools/colorModePref.ts#useColorModePref':
    'one switch, written whole only by the user’s own toggle; a failed read keeps the default and writes nothing',
  'features/tools/waveColorPref.ts#useToolColorPref':
    'one colour per tool, written whole only by the user’s own pick; a failed read keeps the default and writes nothing',
  'features/profile/bigPicturePref.ts#loadShowBigPicture':
    'one switch, written whole only by the learner’s toggle; a failed read answers OFF (hides the numbers, the owner’s safe side) and writes nothing',
  'features/permissions/permissionStore.ts#getAskMode':
    'one ask-mode per capability, written whole only by the user’s choice; a failed read answers "ask" (consent-safe), caches nothing and writes nothing',
  'features/tools/measure/deviceProfile.ts#hasCrowdsourceConsent':
    'the opt-in flag, written whole only by the user’s answer; a failed read answers "not opted in" (nothing is queued or uploaded) and writes nothing',
  'features/tools/measure/deviceProfile.ts#crowdsourceDeclined':
    'the same opt-in flag; a failed read answers "not declined", so a calibration asks again — and only the user’s answer writes',
  'features/glossary/deviceKey.ts#readConsent':
    'the device-key consent, written whole only by the user’s grant; a failed read answers "no consent" (the cheap dialog shows) and writes nothing',
  'features/dev/popupSuppressStore.ts#hydrate':
    'a dev-only switch written whole only by its own toggle; a failed read keeps OFF and writes nothing',
  'screens/lab/calc/calcPrefs.ts#useCalcSectionOpen':
    'three open/closed switches, each key written whole only by the user’s own tap on THAT section; a failed read shows them open (the default) and writes nothing',
  'screens/tools/SplMeterScreen.tsx#SplMeterScreen':
    'the full-screen dimmer level + red latch, written whole only when the user lets go of the slider; a failed read opens at full brightness and writes nothing',
  'screens/lab/rack/RackUnit.tsx#RackUnit':
    'the "hide the display" switch, written whole only by the learner’s toggle; a failed read leaves the cache empty so the next module reads again, and writes nothing',
  'screens/glossary/GlossaryScreen.tsx#GlossaryScreen':
    'the TTS-mode switch (written whole only by its toggle) and the one-shot return-to-term hand-off (written whole by the lock view, removed after use); a failed read keeps the default / reopens nothing, and writes nothing',
  'screens/awards/AwardsScreen.tsx#AwardsScreen':
    'the specialization / program-path picks: one name per key, written whole only from the learner’s own pick; a failed read leaves the pick unset, which writes nothing',
  'screens/study/FlashcardsScreen.tsx#FlashcardsScreen':
    'the section / media / links display switches (each written whole only by its own toggle) and the two tutorial-seen flags (only ever written "1"); a failed read keeps the defaults or re-offers a tutorial, never writes over a stored value',
  // ── first-use flags: failure fails to "already seen", or the only write is "1" ──
  'components/StudyFsOverlay.tsx#StudyFsOverlay':
    'the full-screen guide counter: a failed read counts the guide as RETIRED (guideCount = 2), so nothing shows and nothing is written; the next mount reads again',
  'lib/coachMark.ts#useCoachMark':
    'the coach-mark retire counter: a failed read treats the hint as retired — it never shows, so registerAction (which needs it visible) never writes',
  'features/intro/TopicWelcomeSheet.tsx#TopicWelcomeSheet':
    'the topic-welcome seen flag: a failed read treats it as SEEN (seen = true); only an explicit dismiss writes',
  'features/directory/legacyMigration.ts#alreadyMigrated':
    'the carry-over-done flag, only ever written "1" by markMigrated; a failed read offers the (declinable) carry-over again and writes nothing',
  // ── caches and hand-offs replaced whole; display-only reads ──
  'features/commercial/lastTierCache.ts#loadLastTier':
    'a cache of the last confirmed tier, replaced whole by the next server answer; a failed read starts where the app always started (no cache)',
  'features/curriculum/academyStats.ts#useAcademyStats':
    'an instant-paint cache replaced WHOLE by the fresh server row; a failed read only skips the instant paint',
  'features/dashboard/api.ts#getLastTopic':
    'a resume convenience: one value replaced whole by the next move; a failed read resumes nowhere and writes nothing',
  'features/notifications/localSchedule.ts#getTermBatch':
    'a 12-hour cache of glossary rows, replaced whole by a refetch; a failed read refetches',
  'features/celebration/useCredentialCelebration.ts#readKnown':
    'deliberate (comment in place): a failed read is treated as ABSENT and re-seeds silently — the alternative celebrates everything already held; the cost is a missed celebration, never lost credit',
  'features/audio/exposureMonitor.ts#getExposureHistory':
    'the history LIST for display; it writes nothing, and the day / index writers do their own guarded reads (persistDay, pruneOldDays)',
  'features/study/localProgress.ts#loadLocalMethodStates':
    'a display / resume read; every save (saveLocalMethodStates) re-reads the row itself, refuses on a failed read and MERGES, so nothing read here is ever written back whole',
  'features/study/localProgress.ts#loadAllLocalMethodStates':
    'the Dashboard merge read, display only; the same guarded read-merge in saveLocalMethodStates protects every write',
  'screens/dashboard/DashboardScreen.tsx#DashboardScreen':
    'the learn-intros-seen set for display; persistIntroSeen re-reads it itself, refuses on a failed read and writes the UNION',
  // ── dev-only web preview ──
  'features/commercial/EntitlementProvider.tsx#EntitlementProvider':
    'the DEV web-preview tier (__DEV__ && web only): a failed read restores no pinned tier; release builds and devices never run it',
  'screens/auth/AuthScreen.tsx#AuthScreen':
    'the DEV web-preview tier kept across the auto-guest wipe: a failed read restores no tier (dev + web only)',
  'screens/auth/AuthScreen.tsx#enterGuest':
    'the Career Finder record read BEFORE the guest wipe: a failed read rejects into enterGuest’s own catch, which stops Guest Mode before anything is wiped (wave 2) — the rejection path is the refusal',
};

/** Files migrated onto the shared safe store on 2026-10-02 — a ratchet
 *  against a quiet return to a hand-rolled read. */
const ON_SAFE_STORE = [
  'features/celebration/celebrationSeen.ts',
  'features/dashboard/deckOrderStore.ts',
  'features/enrollment/enrolledBundlesStore.ts',
  'features/enrollment/enrollmentStore.ts',
  'features/flags/flaggedStore.ts',
  'features/glossary/recentTerms.ts',
  'features/home/homeCardsStore.ts',
  'features/soundsystems/progress.ts',
  'features/study/lastStudyLocation.ts',
  'features/study/paceStore.ts',
  'features/study/scenarioExempt.ts',
  'features/study/scenarioQueue.ts',
  'features/study/termsExempt.ts',
  'features/tools/measure/calibrationStore.ts',
  'screens/lab/cable/CableLabScreen.tsx',
  'screens/lab/cymatics/ExperimentWell.tsx',
  'screens/lab/foundations/FoundationsCourseScreen.tsx',
  'screens/lab/micselect/MicSelectLabScreen.tsx',
  'screens/tools/CenterLockTuner.tsx',
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('G1: no failed storage read may become an empty value that the next save writes over', () => {
  const files = walk(SRC)
    .map((p) => ({ rel: relative(SRC, p).split(sep).join('/'), s: readFileSync(p, 'utf8') }))
    .filter(({ s }) => s.includes('AsyncStorage'))
    .map((f) => ({ ...f, ...judgeSource(f.s, f.rel) }));
  const direct = files.filter(({ rel, reads, writes }) => rel !== HELPER && reads.length > 0 && writes > 0);
  const open = direct.flatMap((f) => f.reads.filter((r) => r.idioms.length === 0).map((r) => ({ rel: f.rel, ...r })));

  it('the scan actually found the hand-rolled stores, multiGet readers included', () => {
    assert.ok(direct.length > 30, `expected many direct reader+writers, got ${direct.length}`);
    assert.ok(direct.some((f) => f.rel === 'features/lab/labCompletion.ts'), 'labCompletion should be in the scanned set');
    assert.ok(
      direct.some((f) => f.rel === 'screens/lab/cableinstall/CableInstallLabScreen.tsx'),
      'Cable Install reads with multiGet — it must be in the scanned set',
    );
  });

  it('every read in a direct reader+writer handles its own failure in code, or is listed with a reason', () => {
    const unlisted = open
      .filter((r) => !STILL_HAND_ROLLED[r.rel] && !SAFE_ON_FAILED_READ[`${r.rel}#${r.site}`])
      .map((r) => `${r.rel}#${r.site} (line ${r.line})`);
    assert.deepEqual(
      unlisted,
      [],
      'these read AND write storage, and the read’s own failure path carries no failed-read idiom — a read that throws becomes "empty", and the next save writes that over the real data.\n' +
        'Put the key on createLocalStore (src/features/storage/localStore.ts), give the read’s catch a real idiom (mark it unreadable, stay unhydrated, refuse the write), ' +
        'or — only where a default is the SAFE direction — add the read site to SAFE_ON_FAILED_READ with a reason:\n  ' +
        unlisted.join('\n  '),
    );
  });

  it('the lists only shrink: every entry still names an open read, and carries a reason', () => {
    for (const [rel, why] of Object.entries(STILL_HAND_ROLLED)) {
      assert.ok(why.length > 20, `${rel} needs a real reason`);
      assert.ok(direct.some((d) => d.rel === rel), `${rel} no longer reads+writes storage directly — remove it from STILL_HAND_ROLLED`);
      assert.ok(open.some((r) => r.rel === rel), `${rel} now handles every failed read in code — remove it from STILL_HAND_ROLLED`);
    }
    for (const [site, why] of Object.entries(SAFE_ON_FAILED_READ)) {
      assert.ok(why.length > 40, `${site} needs a real reason`);
      assert.ok(
        open.some((r) => `${r.rel}#${r.site}` === site),
        `${site} has no open read any more (fixed, moved or renamed) — remove it from SAFE_ON_FAILED_READ`,
      );
    }
  });

  it('the migrated stores stay on the shared safe store (no direct read or write came back)', () => {
    for (const rel of ON_SAFE_STORE) {
      const f = files.find((d) => d.rel === rel) ?? { rel, s: readFileSync(join(SRC, rel), 'utf8'), reads: [], writes: 0 };
      assert.match(f.s, /from '[^']*storage\/localStore'/, `${rel} left the shared safe store`);
      assert.equal(f.writes, 0, `${rel} writes storage directly again`);
      // flaggedStore keeps ONE direct read: listBookmarkContexts, a read-only
      // scan of ape:bm:* that writes nothing (a key it cannot read is skipped).
      if (rel !== 'features/flags/flaggedStore.ts') assert.equal(f.reads.length, 0, `${rel} reads storage directly again`);
    }
  });

  it('the helper itself keeps the rules (read failure stays unhydrated; damaged is set aside; writes are fenced)', () => {
    const s = readFileSync(join(SRC, HELPER), 'utf8');
    assert.match(s, /unreadable = true;\s*hydrating = null;/, 'a failed read must leave the store unhydrated');
    assert.match(s, /`\$\{key\}:damaged`/, 'a damaged blob must be set aside');
    assert.match(s, /if \(gen !== generation\) return false;/, 'a write must be generation-fenced');
    assert.match(s, /registerLocalStoreReset\(reset\);/, 'every store must self-register its reset');
  });
});

/**
 * The three holes, as fixtures: each was accepted by the first G1 and must
 * now be OPEN; each real idiom must still be accepted.
 */
describe('G1 tightening: comments, unrelated code and multiGet no longer satisfy the guard', () => {
  const idiomsOf = (src: string) => judgeSource(src).reads.map((r) => r.idioms);

  it('hole 1 — an idiom word in a COMMENT is not an idiom', () => {
    const src = `
      import AsyncStorage from '@react-native-async-storage/async-storage';
      let list: string[] = [];
      export async function load() {
        try {
          list = JSON.parse((await AsyncStorage.getItem('ape:k')) ?? '[]');
        } catch {
          // READ failed: unreadable, readFailed, hydrating = null — just words
        }
      }
      export function add(x: string) { list = [...list, x]; void AsyncStorage.setItem('ape:k', JSON.stringify(list)); }`;
    assert.deepEqual(idiomsOf(src), [[]]);
  });

  it('hole 2 — `hydrating = null` in resetLocal() is not the read’s failure path', () => {
    const src = `
      import AsyncStorage from '@react-native-async-storage/async-storage';
      let hydrating: Promise<void> | null = null;
      let hydrated = false;
      let state = {};
      function hydrate() {
        hydrating = (async () => {
          try { state = JSON.parse((await AsyncStorage.getItem('ape:k')) ?? '{}'); } catch { /* defaults */ }
          hydrated = true;
        })();
        return hydrating;
      }
      export function resetLocal() { hydrated = false; hydrating = null; }
      export function save() { void AsyncStorage.setItem('ape:k', JSON.stringify(state)); }`;
    assert.deepEqual(idiomsOf(src), [[]]);
  });

  it('hole 3 — a multiGet read is seen, and an empty catch on it is open', () => {
    const src = `
      import AsyncStorage from '@react-native-async-storage/async-storage';
      let score = 0;
      export function load() {
        AsyncStorage.multiGet(['ape:a', 'ape:b']).then((rows) => { score = Number(rows[0][1]) || 0; }).catch(() => {});
      }
      export function bump() { score++; void AsyncStorage.multiSet([['ape:a', String(score)]]); }`;
    const r = judgeSource(src);
    assert.equal(r.reads.length, 1, 'multiGet must count as a READ');
    assert.deepEqual(r.reads[0].idioms, []);
  });

  it('a catch that falls back to a default and then lets the caller write is open', () => {
    const src = `
      import AsyncStorage from '@react-native-async-storage/async-storage';
      export async function load(): Promise<string[]> {
        try { return JSON.parse((await AsyncStorage.getItem('ape:k')) ?? '[]'); } catch { return []; }
      }
      export async function save(l: string[]) { await AsyncStorage.setItem('ape:k', JSON.stringify(l)); }`;
    assert.deepEqual(idiomsOf(src), [[]]);
  });

  it('a skipped write is no proof when the failure path puts an EMPTY stand-in into module state', () => {
    const src = `
      import AsyncStorage from '@react-native-async-storage/async-storage';
      let list: string[] = [];
      export async function load() {
        try {
          list = JSON.parse((await AsyncStorage.getItem('ape:k')) ?? '[]');
          await AsyncStorage.setItem('ape:k:seen', '1');
        } catch {
          list = [];
        }
      }
      export function add(x: string) { list = [...list, x]; void AsyncStorage.setItem('ape:k', JSON.stringify(list)); }`;
    assert.deepEqual(idiomsOf(src), [[]]);
  });

  it('the real idioms are still accepted', () => {
    const cases: [string, string][] = [
      ['marks-unreadable', `try { raw = await AsyncStorage.getItem(K); } catch { readFailed = true; }`],
      ['marks-unreadable', `AsyncStorage.getItem(K).catch(() => { unreadable.add(s); })`],
      ['stays-unhydrated', `try { raw = await AsyncStorage.getItem(K); } catch { hydrating = null; return; }`],
      ['failure-sentinel', `try { raw = await AsyncStorage.getItem(K); } catch { return 'unreadable'; }`],
      ['failure-sentinel', `try { raw = await AsyncStorage.getItem(K); } catch { return { state: s, ok: false }; }`],
      ['throws', `try { raw = await AsyncStorage.getItem(K); } catch (e) { throw e; }`],
      ['propagates', `raw = await AsyncStorage.getItem(K);`],
      ['refuses-the-write', `try { raw = await AsyncStorage.getItem(K); } catch { return; } await AsyncStorage.setItem(K, v);`],
      ['skips-the-write', `try { raw = await AsyncStorage.getItem(K); await AsyncStorage.setItem(K, raw + v); } catch { /* best-effort */ }`],
    ];
    for (const [idiom, body] of cases) {
      const src = `import AsyncStorage from 'x'; const K = 'ape:k'; export async function f() { let raw; ${body} } export const w = () => AsyncStorage.setItem(K, '');`;
      const got = judgeSource(src).reads[0]?.idioms ?? [];
      assert.ok(got.includes(idiom), `${idiom} not accepted for: ${body} (got ${got.join(',') || 'nothing'})`);
    }
    const sentinelNull = `
      import AsyncStorage from 'x';
      async function readIds(key: string): Promise<string[] | null> {
        let raw: string | null;
        try { raw = await AsyncStorage.getItem(key); } catch { return null; }
        return raw ? JSON.parse(raw) : [];
      }
      export const w = (k: string) => AsyncStorage.setItem(k, '');`;
    assert.deepEqual(judgeSource(sentinelNull).reads[0].idioms, ['null-means-unread']);
    const ambiguousNull = sentinelNull.replace("return raw ? JSON.parse(raw) : [];", 'return raw ? JSON.parse(raw) : null;');
    assert.deepEqual(judgeSource(ambiguousNull).reads[0].idioms, [], 'null that ALSO means "nothing saved" is not a sentinel');
  });
});
