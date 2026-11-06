/**
 * Batch 4 G5 S3 (2026-11-05): a dock toggle had no locked state, so two keys
 * promised something they could not deliver. Foundations Module 7's PROBE,
 * FREEZE and FREQ stayed live behind the TIME or SPACE cover, and Room Design's
 * ADD FIRST did nothing at all with no item.
 *
 * Driven for real: the dock renderer, M7Rack and the treatment toggle are cut
 * from their sources, transpiled with the repo's TypeScript and run against a
 * stub createElement, then their keys are pressed as a finger would.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const blob: any = new Proxy(function () {}, {
  get: (_t, k) => (typeof k === 'symbol' ? undefined : blob),
  apply: () => blob,
});

type El = { type: unknown; props: any };
const React = {
  createElement: (type: unknown, props: any, ...children: unknown[]): El => ({ type, props: { ...props, children } }),
  Fragment: 'Fragment',
};

/** Every element in a tree, depth first. A DockStrip's keys are its render prop's. */
function walk(n: any, out: El[] = []): El[] {
  if (Array.isArray(n)) n.forEach((c) => walk(c, out));
  else if (n && typeof n === 'object' && 'props' in n) {
    out.push(n);
    walk(n.type === 'DockStrip' ? n.props.children[0](() => undefined) : n.props.children, out);
  }
  return out;
}
/** The visible words under an element. */
const words = (n: any): string =>
  Array.isArray(n) ? n.map(words).join('') : n && typeof n === 'object' ? words(n.props?.children) : n == null || n === false ? '' : String(n);

/** Run cut source: a name the code does not get here falls to a global, then to the blob. */
function run(js: string, own: Record<string, unknown>, result: string) {
  const scope = new Proxy(own, {
    has: () => true,
    get: (t, k) => (typeof k === 'symbol' ? undefined : k in t ? t[k as string] : k in globalThis ? (globalThis as any)[k] : blob),
  });
  return new Function('scope', `with (scope) { ${js}; return ${result}; }`)(scope);
}
const compile = (src: string) =>
  ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;

function cut(src: string, from: string, to: string) {
  const a = src.indexOf(from);
  assert.ok(a >= 0, `found: ${from}`);
  const b = src.indexOf(to, a);
  assert.ok(b >= 0, `found: ${to}`);
  return src.slice(a, b);
}

const rackSrc = read('rack/RackUnit.tsx');
const dockJs = compile(cut(rackSrc, 'const shownIn = (inFull: boolean) =>', '\n  const closeTray'));
const boundJs = compile(cut(rackSrc, 'const effBoundId = ', '\n  const bound = '));

/** One rack dock: the renderer run as RackUnit runs it, with its note state held here. */
function dock(params: any[], inFull = false) {
  let note: string | null = null;
  const DockButton = 'DockButton';
  const render = () =>
    run(dockJs, {
      React, DockButton, DockStrip: 'DockStrip', isLabelOnly: () => false, params, lockedNoteId: note, bound: null, trayParam: null, openTrayId: null, effBoundId: '', styles: blob,
      setLockedNoteId: (v: any) => { note = typeof v === 'function' ? v(note) : v; },
    }, 'dockFor')(inFull);
  return {
    keys: () => walk(render()).filter((e) => e.type === DockButton),
    key: (id: string) => walk(render()).find((e) => e.type === DockButton && e.props.key === id),
    note: () => {
      const hit = walk(render()).find((e) => e.props.style === blob && /locked:/.test(words(e.props.children)) && e.props.accessibilityLiveRegion);
      return hit ? words(hit.props.children) : null;
    },
  };
}

describe('RackUnit: a locked toggle', () => {
  const toggle = (locked?: string) => {
    let flips = 0;
    return { p: { kind: 'toggle', id: 't', label: 'FREEZE', value: false, onToggle: () => { flips += 1; }, locked }, flips: () => flips };
  };

  for (const inFull of [false, true]) {
    const where = inFull ? 'full-screen dock' : 'inline dock';

    it(`${where}: shows LOCKED, dimmed, and a tap never flips it but prints the reason`, () => {
      const t = toggle('call it first');
      const d = dock([t.p], inFull);
      const k = d.key('t')!;
      assert.equal(k.props.value, 'LOCKED');
      assert.equal(k.props.dim, true);
      assert.equal(k.props.led, undefined, 'no LED: a locked key is neither on nor off');
      assert.match(k.props.a11y, /locked — call it first/);
      assert.equal(d.note(), null);
      k.props.onPress();
      assert.equal(t.flips(), 0);
      assert.equal(d.note(), 'FREEZE — locked: call it first');
      d.key('t')!.props.onPress();
      assert.equal(d.note(), null, 'a second tap puts the reason away, as on a locked options key');
      assert.equal(t.flips(), 0);
    });

    it(`${where}: unlocked it still flips, with its LED`, () => {
      const t = toggle();
      const k = dock([t.p], inFull).key('t')!;
      assert.equal(k.props.led, false);
      k.props.onPress();
      assert.equal(t.flips(), 1);
    });
  }

  it('hideInFull still wins over locked', () => {
    const t = { ...toggle('x').p, hideInFull: true };
    assert.equal(dock([t], true).keys().length, 0);
    assert.equal(dock([t], false).keys().length, 1);
  });

  it('a reason left over from before the unlock prints nothing', () => {
    const p: any = toggle('x').p;
    const d = dock([p]);
    d.key('t')!.props.onPress();
    p.locked = undefined;
    assert.equal(d.note(), null);
  });
});

describe('Foundations Module 7: the keys wait for the TIME or SPACE call', () => {
  const src = read('foundations/FoundationsCourseScreen.tsx');
  const m7 = compile(`${cut(src, 'function M7Rack(', '\n}\n')}\n}`);

  const mount = (m7Predicted: null | 'time' | 'space', onM7Predict: (v: string) => void = () => {}) => {
    const RackUnit = 'RackUnit';
    const useState = (v: unknown) => [v, () => {}];
    const fn = run(m7, { React, RackUnit, useState, styles: blob, playKey: () => ({ kind: 'action', id: 'play', label: 'PLAY', onPress() {} }) }, 'M7Rack');
    const tone = { engineReady: true, set() {}, play() {} };
    return fn({ viz: blob, tone, focused: true, help() {}, wellTop: null, wellBottom: null, m7Predicted, onM7Predict }) as El;
  };
  const byId = (el: El) => Object.fromEntries(el.props.params.map((p: any) => [p.id, p]));

  it('all three are locked with one reason while the cover is up; PLAY is not', () => {
    const p = byId(mount(null));
    for (const id of ['probe', 'freeze', 'freq']) assert.match(p[id].locked ?? '', /call it on the display first: TIME or SPACE/i, id);
    assert.equal(p.play.locked, undefined);
  });

  it('a tap on locked FREEZE in the real dock changes nothing and says why', () => {
    const d = dock(mount(null).props.params);
    d.key('freeze')!.props.onPress();
    assert.equal(d.note(), 'FREEZE — locked: call it on the display first: TIME or SPACE');
  });

  it('the cover buttons make the call; after it nothing is locked', () => {
    let called: string | null = null;
    const el = mount(null, (v) => { called = v; });
    const cover = walk(el.props.stage.render(320, 240));
    cover.find((e) => /^Answer: time/.test(e.props.accessibilityLabel ?? ''))!.props.onPress();
    assert.equal(called, 'time');
    for (const answer of ['time', 'space'] as const) {
      const p = byId(mount(answer));
      for (const id of ['probe', 'freeze', 'freq']) assert.equal(p[id].locked, undefined, `${id} after ${answer}`);
    }
  });

  it('the lane lands on PROBE after the call, though it mounted with nothing to bind', () => {
    const before = mount(null);
    const after = mount('time');
    assert.equal(before.props.initialParam, 'probe');
    assert.equal(byId(after).probe.autoBind, true);
    // RackUnit's reconcile, run on the state a locked mount leaves behind.
    const faders = (el: El) => el.props.params.filter((p: any) => p.kind === 'fader' && !p.locked);
    assert.equal(faders(before).length, 0);
    const bind = (el: El) => run(boundJs, { faders: faders(el), boundId: '', initialParam: 'probe', validInitial: faders(el).some((f: any) => f.id === 'probe') }, 'effBoundId');
    assert.equal(bind(before), '');
    assert.equal(bind(after), 'probe');
  });
});

describe('Room Design: the item key with nothing in the room', () => {
  const src = read('roomdesign/modules/modTreatment.tsx');
  const js = compile(`const key = ${cut(src, "{\n      kind: 'toggle',\n      id: 'ab',", "\n    },\n    {\n      kind: 'group',\n      id: 'items',")}\n    };`);
  const NO_ITEM_SWITCH = 'nothing here';
  const build = (sel: unknown, setItems: unknown = () => {}) =>
    new Function('sel', 'setItems', 'NO_ITEM_SWITCH', `${js}; return key;`)(sel, setItems, NO_ITEM_SWITCH);

  it('ADD FIRST is locked with its own reason, and says so in the dock', () => {
    const p = build(null);
    assert.equal(p.label, 'ADD FIRST');
    assert.equal(p.locked, NO_ITEM_SWITCH);
    const d = dock([p]);
    assert.equal(d.key('ab')!.props.value, 'LOCKED');
    d.key('ab')!.props.onPress();
    assert.equal(d.note(), `ADD FIRST — locked: ${NO_ITEM_SWITCH}`);
  });

  it('with an item selected the key is live and switches that item', () => {
    let items = [{ id: 'a', enabled: true }, { id: 'b', enabled: true }];
    const p = build(items[0], (f: (t: typeof items) => typeof items) => { items = f(items); });
    assert.equal(p.locked, undefined);
    assert.equal(p.label, 'ITEM ON');
    dock([p]).key('ab')!.props.onPress();
    assert.deepEqual(items.map((t) => t.enabled), [false, true]);
  });
});
