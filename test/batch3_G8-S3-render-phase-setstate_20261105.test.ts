/**
 * Batch 3 G8 S3 (2026-11-05): the seven Context pages credited 'liveChecks'
 * from inside the setGot updater. React runs updaters while rendering, so the
 * parent's setState fired mid-render: "Cannot update a component while
 * rendering a different component" (LessonHost from B08Context).
 *
 * Driven for real: each Context component is cut from its pages.tsx, transpiled
 * with the repo's TypeScript and run on a tiny hooks runtime that, like React,
 * applies queued updaters DURING render and effects AFTER it. The step hooks are
 * stubs; their callbacks are pressed exactly as the steps press them.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

// Each lesson's own condition: every id here must be earned before the credit.
const LESSONS: [string, string, string[]][] = [
  ['b08Audience', 'B08Context', ['pa']],
  ['b12Parabolic', 'B12Context', ['handoff', 'headroomChain']],
  ['b13FieldDiamond', 'B13Context', ['coverageMap', 'headroomChain']],
  ['b14CourtIce', 'B14Context', ['boundaryHeights', 'plantCompared', 'headroomChain']],
  ['b15TrackGymCombat', 'B15Context', ['coverageMap', 'plantCompared', 'headroomChain']],
  ['b16MotorHorseWater', 'B16Context', ['coverageMap', 'headroomChain']],
  ['b17CrowdComplete', 'B17Context', ['coveragePlan', 'downmix']],
];

const source = (dir: string) =>
  readFileSync(new URL(`../src/screens/lab/miking/lessons/${dir}/pages.tsx`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

function compile(dir: string, name: string) {
  const src = source(dir);
  const a = src.indexOf(`function ${name}(p: PageProps) {`);
  assert.ok(a >= 0, `${name} found`);
  const b = src.indexOf('\n}\n', a) + 2;
  const js = ts.transpileModule(src.slice(a, b), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  return new Function('scope', `with (scope) { ${js}; return ${name}; }`);
}

// Anything the page builds that this test does not care about.
const blob: any = new Proxy(function () {}, {
  get: (_t, k) => (typeof k === 'symbol' ? undefined : blob),
  apply: () => blob,
  construct: () => blob,
});

function mount(dir: string, name: string, doneAtStart: string[] = []) {
  const rt = { slots: [] as any[], effects: [] as any[], i: 0, e: 0, rendering: false, dirty: false };
  const credits: { id: string; duringRender: boolean }[] = [];
  let steps: any[] = [];
  const pending: (() => void)[] = [];
  const hooks: Record<string, unknown> = {
    useState(init: unknown) {
      const slot = (rt.slots[rt.i++] ??= {
        value: typeof init === 'function' ? (init as () => unknown)() : init,
        queue: [] as unknown[],
        set(v: unknown) { slot.queue.push(v); rt.dirty = true; },
      });
      // Same as React: updaters run here, in the render phase.
      for (const u of slot.queue.splice(0)) slot.value = typeof u === 'function' ? (u as (x: unknown) => unknown)(slot.value) : u;
      return [slot.value, slot.set];
    },
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useRef: (current: unknown) => ({ current }),
    useEffect(fn: () => void, deps?: unknown[]) {
      const e = rt.e++;
      const prev = rt.effects[e];
      if (!prev || !deps || deps.some((d, i) => d !== prev[i])) pending.push(fn);
      rt.effects[e] = deps;
    },
  };
  const scope = new Proxy({} as Record<string, unknown>, {
    has: () => true,
    get(_t, k) {
      if (typeof k === 'symbol') return undefined;
      if (k in hooks) return hooks[k];
      if (/^use[A-Z]/.test(k)) return (args: unknown) => { steps.push(args); return blob; };
      return k in globalThis ? (globalThis as any)[k] : blob;
    },
  });
  const Page = compile(dir, name)(scope);

  let interactiveDone: ReadonlySet<string> = new Set(doneAtStart);
  const onInteractive = (id: string) => {
    credits.push({ id, duringRender: rt.rendering });
    // MikingLessonScreen: setLocalInteractive feeds a new interactiveDone back in.
    if (!interactiveDone.has(id)) { interactiveDone = new Set([...interactiveDone, id]); rt.dirty = true; }
  };
  const render = () => {
    for (let guard = 0; guard < 20; guard++) {
      rt.dirty = false; rt.i = 0; rt.e = 0; steps = [];
      rt.rendering = true;
      Page({ onInteractive, interactiveDone, lesson: blob });
      rt.rendering = false;
      for (const fn of pending.splice(0)) fn();
      if (!rt.dirty) return;
    }
    assert.fail('render never settled');
  };
  render();
  const press = (id: string) => {
    const s = steps.find((x) => x?.onInteractive !== undefined || x?.onDone !== undefined);
    assert.ok(s, 'a step takes the page callback');
    (s.onDone ?? s.onInteractive)(id);
    render();
  };
  return { press, credits, render };
}

describe('Context pages credit liveChecks after the commit, never during render', () => {
  for (const [dir, name, ids] of LESSONS) {
    it(`${name}: earned once, outside render, only when the whole condition holds`, () => {
      const page = mount(dir, name);
      assert.deepEqual(page.credits, [], 'nothing on open');
      for (const id of ids.slice(0, -1)) {
        page.press(id);
        assert.deepEqual(page.credits, [], `${id} alone earns nothing`);
      }
      page.press(ids[ids.length - 1]);
      assert.deepEqual(page.credits, [{ id: 'liveChecks', duringRender: false }]);
      page.press(ids[0]);
      page.render();
      assert.equal(page.credits.length, 1, 'the interactiveDone guard holds');
      assert.match(source(dir), /import \{[^}]*\buseEffect\b[^}]*\} from 'react'/, 'useEffect is really imported');
    });

    it(`${name}: a lesson already credited is never credited again`, () => {
      const page = mount(dir, name, ['liveChecks']);
      for (const id of ids) page.press(id);
      assert.deepEqual(page.credits, []);
    });
  }
});
