/**
 * Pattern P9 — double tap / re-entrancy (2026-10-02).
 *
 * The class: a guard kept in React state (`if (busy) return; setBusy(true)`,
 * or `disabled={busy}` alone) cannot stop a second tap in the same frame —
 * both see the old value. The house idiom is a synchronous ref claimed first
 * and released in `finally`; src/lib/latch.ts is that idiom once.
 *
 * 1. Behaviour of createInFlightLatch (what useInFlightLatch / useLatchedPress
 *    hold). R2: with a latch that claims after an await, or never releases on
 *    a throw, these fail.
 * 2. Why `navigate()` presses are not on the worklist and `push()` presses
 *    are: RN7's own StackRouter, run here.
 * 3. The sites fixed on 2026-10-02 stay on the latch.
 * 4. RATCHET over src/: an async handler wired to a press prop that awaits
 *    work must carry a latch idiom (or go through useLatchedPress). Existing
 *    exceptions are listed with a reason; the list may only shrink.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { createInFlightLatch } = await import('../src/lib/latch.ts');
const { StackRouter, CommonActions, StackActions } = await import('@react-navigation/routers');

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

// ── 1. behaviour ─────────────────────────────────────────────────────────────

describe('createInFlightLatch', () => {
  it('a second tap in the same frame is refused — the task runs once', async () => {
    const latch = createInFlightLatch();
    let runs = 0;
    const task = async () => {
      runs++;
      await tick();
      return 'shared';
    };
    // Both "taps" land before anything has awaited: the same-frame double tap.
    const a = latch.run(task);
    const b = latch.run(task);
    assert.equal(latch.busy(), true);
    assert.equal(await a, 'shared');
    assert.equal(await b, undefined, 'the refused tap resolves undefined');
    assert.equal(runs, 1);
    assert.equal(latch.busy(), false);
  });

  it('releases when the work settles, so the next deliberate tap runs', async () => {
    const latch = createInFlightLatch();
    let runs = 0;
    await latch.run(async () => {
      runs++;
      await tick();
    });
    await latch.run(async () => {
      runs++;
    });
    assert.equal(runs, 2);
  });

  it('a task that throws still releases (no button left dead), and the error reaches the caller', async () => {
    const latch = createInFlightLatch();
    await assert.rejects(
      latch.run(async () => {
        await tick();
        throw new Error('share sheet refused');
      }),
      /share sheet refused/,
    );
    assert.equal(latch.busy(), false);
    let ran = false;
    await latch.run(() => {
      ran = true;
    });
    assert.equal(ran, true);
  });
});

describe('useLatchedPress (source): latest fn, stable handler, rejection swallowed like useSending', () => {
  const src = readFileSync('src/lib/latch.ts', 'utf8');
  it('runs fnRef.current through the latch', () => {
    assert.match(src, /fnRef\.current = fn;/);
    assert.match(src, /void use\.run\(\(\) => fnRef\.current\(\.\.\.args\)\)\.catch\(\(\) => \{\}\);/);
    assert.match(src, /\[use\],\s*\);/);
  });
});

// ── 2. navigate vs push, in RN7's own router ─────────────────────────────────

describe('RN7 StackRouter: which presses can stack two screens', () => {
  const opts = { routeNames: ['Home', 'Lab'], routeParamList: {}, routeGetIdList: {} };
  const router = StackRouter({});
  const start = router.getInitialState(opts);

  it('navigate() to the route already in front pushes nothing — a doubled navigate press is one screen', () => {
    const once = router.getStateForAction(start, CommonActions.navigate('Lab'), opts)!;
    const twice = router.getStateForAction(once, CommonActions.navigate('Lab'), opts)!;
    assert.equal(once.routes.length, 2);
    assert.equal(twice.routes.length, 2);
  });

  it('push() stacks every time — a push press needs its own window (Mod8Apply, ToolsHub openOnce)', () => {
    const once = router.getStateForAction(start, StackActions.push('Lab'), opts)!;
    const twice = router.getStateForAction(once, StackActions.push('Lab'), opts)!;
    assert.equal(twice.routes.length, 3);
  });
});

// ── 3. the sites fixed on 2026-10-02 ─────────────────────────────────────────

const read = (p: string) => readFileSync(p, 'utf8');

describe('fixed sites stay latched', () => {
  for (const f of ['src/screens/lab/calc/CalcResultsScreen.tsx', 'src/screens/lab/calc/CalcWorkflowRunScreen.tsx']) {
    it(`${f}: SHARE AS IMAGE is one share sheet per tap (no false "isn't available" notice)`, () => {
      assert.match(read(f), /const shareAsImage = useLatchedPress\(async \(\) => \{\s*const ok = await shareImage\.captureAndShare\(/);
    });
  }

  it('CredentialShareRow: COPY / SHARE LINK / SHARE QR share ONE latch', () => {
    const s = read('src/features/credentials/CredentialShareRow.tsx');
    assert.match(s, /const shareLatch = useInFlightLatch\(\);/);
    assert.match(s, /const copy = useLatchedPress\(copyNow, shareLatch\);/);
    assert.match(s, /const link = useLatchedPress\(linkNow, shareLatch\);/);
    assert.match(s, /const qr = useLatchedPress\(qrNow, shareLatch\);/);
  });

  it('ShareTermSheet: text and image shares claim the same ref latch before setBusy', () => {
    const s = read('src/components/ShareTermSheet.tsx');
    const text = s.slice(s.indexOf('const doShareText'), s.indexOf('const doShareImage'));
    const image = s.slice(s.indexOf('const doShareImage'), s.indexOf('const doCopy'));
    assert.match(text, /void shareLatch\.run\(\(\) => \{\s*setBusy\(true\);\s*return Share\.share\(/);
    assert.match(image, /void shareLatch\.run\(\(\) => \{\s*setBusy\(true\);\s*return shareImage\s*\.captureAndShare\(/);
  });

  it('MultiMeter: ADD PHOTO launches one camera, TAG LOCATION takes one fix', () => {
    const s = read('src/screens/tools/MultiMeterScreen.tsx');
    assert.match(s, /const onAddPhoto = useLatchedPress\(addPhotoNow\);/);
    assert.match(s, /const onTagLocation = useLatchedPress\(tagLocationNow\);/);
  });
});

// ── 4. ratchet ───────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const walk = (d: string, out: string[] = []): string[] => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e)) out.push(p);
  }
  return out;
};

/** The latch vocabulary in use: a ref claim/check, the auth begin(), a
 *  save latch, a latch/useSending run, a serial chain, a newest-wins ticket. */
const LATCH =
  /\.current\s*\)\s*return|\.current\s*=\s*true|\bbegin\(\)|\.claim\(\)|\.run\(|runSend\(|serialWrite\(|saveChain\.current|\+\+\w+\.current|InFlight\w*\.current|inFlight/;

function bodyOf(s: string, at: number): string {
  const i = s.indexOf('{', at);
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}' && --d === 0) return s.slice(i, j + 1);
  }
  return s.slice(i);
}

function unlatched(): string[] {
  const out: string[] = [];
  for (const p of walk(join(ROOT, 'src'))) {
    const s = readFileSync(p, 'utf8');
    const defs = new Map<string, number>();
    const re = /(?:const|let)\s+(\w+)\s*=\s*(?:useCallback\(\s*)?async\s*\([^)]*\)[^{]*\{|async\s+function\s+(\w+)\s*\([^)]*\)[^{]*\{/g;
    for (const m of s.matchAll(re)) defs.set(m[1] || m[2], m.index!);
    const used = new Set<string>();
    for (const m of s.matchAll(/\bon[A-Z]\w*=\{\s*(?:\(\)\s*=>\s*(?:void\s+)?)?(\w+)\s*[(}]/g)) if (defs.has(m[1])) used.add(m[1]);
    for (const n of used) {
      if (new RegExp(`useLatchedPress\\(\\s*${n}\\b`).test(s)) continue;
      const body = bodyOf(s, defs.get(n)!);
      if (!/\bawait\b|\.then\(/.test(body)) continue;
      if (LATCH.test(body)) continue;
      out.push(`${relative(ROOT, p).split(sep).join('/')}#${n}`);
    }
  }
  return out.sort();
}

/** Reviewed 2026-10-02. Not a double write / submit / charge / push. May only shrink. */
const ALLOW: Record<string, string> = {
  'src/features/dev/DevVisualIndex.tsx#resetIntros': 'dev-only harness',
  'src/features/permissions/PermissionPrompt.tsx#onAllow':
    'the OS de-duplicates a permission request; the caller awaits ONE resolve of the pending promise',
  'src/features/permissions/PermissionPrompt.tsx#onDecline': 'resolves the pending request as cancelled; a second resolve is a no-op',
  'src/screens/awards/AwardProgressScreen.tsx#onRefresh': 'read-only reload (overlap is P2, newest-wins)',
  'src/screens/courses/CourseSelectionScreen.tsx#load': 'read-only RETRY load (P2)',
  'src/screens/curriculum/CurriculumScreen.tsx#loadCurriculum': 'read-only RETRY load (P2)',
  'src/screens/directory/ExploreView.tsx#loadTax': 'read-only RETRY load (P2)',
  'src/screens/glossary/GlossaryScreen.tsx#reloadCorpus': 'read-only reload (P2)',
  'src/screens/glossary/GlossaryScreen.tsx#shareTerm':
    'the metered read is de-duplicated by gatewayInFlightRef; the share sheet is one state slot',
  'src/screens/lab/calc/CalcWorkflowRunScreen.tsx#persist': 'saveRun upserts by run id — a second tap rewrites the same draft',
  'src/screens/lab/calc/CalcWorkflowRunScreen.tsx#saveResult': 'saveResult upserts by summary id — one record either way',
  'src/screens/lab/drumtuning/DrumTuningLabScreen.tsx#onDeleteNote': 'callback prop; the module (ch6Kit) latches its buttons',
  'src/screens/lab/drumtuning/DrumTuningLabScreen.tsx#onSaveNote': 'callback prop; ch6Kit save() is latched on saving.current',
  'src/screens/lab/production/AcceptConditionSheet.tsx#record': 'acceptCondition replaces by ruleId — one accepted condition either way',
  'src/screens/lab/production/ProductionLabScreen.tsx#acceptCondition': 'idempotent by ruleId (projectStore.acceptCondition)',
  'src/screens/settings/SettingsScreen.tsx#reloadPrefs': 'read-only RETRY load (P2)',
  'src/screens/tools/DspDebugScreen.tsx#stop': 'dev diagnostics screen; stop is idempotent',
  'src/screens/tools/FrequencyCounterScreen.tsx#onStart': 'mic start (P20 lifecycle / start fence own it)',
};

describe('P9 ratchet — async press handlers carry a latch', () => {
  const found = unlatched();

  it('no NEW async press handler without a latch', () => {
    const fresh = found.filter((k) => !(k in ALLOW));
    assert.deepEqual(
      fresh,
      [],
      'Wrap it: const onX = useLatchedPress(async () => …) (src/lib/latch.ts), or claim a ref first and release it in finally.',
    );
  });

  it('the allowlist only shrinks: every entry is still a live, unlatched handler', () => {
    const stale = Object.keys(ALLOW).filter((k) => !found.includes(k));
    assert.deepEqual(stale, [], 'fixed or gone — remove it from ALLOW');
  });
});
