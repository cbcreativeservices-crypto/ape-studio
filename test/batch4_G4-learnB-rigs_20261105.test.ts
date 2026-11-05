/**
 * Sound Systems Learn, batch 4 G4, 2026-11-05: two controls that promised
 * something the student could not see on the glass.
 *
 * Power and headroom, LISTENER: the caption says to move the listener and
 * watch the SPL fall, but only the fourth bezel cell answered. The band now
 * carries a distance line with the listener on it and the SPL beside it.
 *
 * Amplifier loads, BRIDGED: the wiring ignored it and the unsafe label read
 * AMP · PROTECT either way. BRIDGED now stays in the label in every state and
 * a link joins a second output, apart from every cable.
 *
 * Runs the real pages through a small hook runner, presses their real
 * controls and reads the drawing they hand the rack.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { SS_LEARN_PAGES_B } = R(await import('../src/screens/lab/soundsystems/pagesLearnB.tsx'));
const { predictedSpl } = R(await import('../src/features/soundsystems/loads.ts'));
const { colors } = R(await import('../src/theme/tokens.ts'));

type El = { type: unknown; props: Record<string, unknown> };
type Rack = {
  stage: (w: number, h: number) => unknown;
  params: { id: string; onChange?: (p: number) => void; onSelect?: (id: string) => void; onToggle?: () => void }[];
  bezel: { k: string; v: string }[];
};
const INTERNALS = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

/** Runs a page as React would: useState and useRef keep their cells between runs. */
function runner(title: string): () => Rack {
  const page = SS_LEARN_PAGES_B.find((p: { title: string }) => p.title === title);
  assert.ok(page, `no page ${title}`);
  const ctx = { isDone: false, markDone: () => {} };
  const cells: unknown[] = [];
  let i = 0;
  const cell = (init: unknown) => {
    const k = i++;
    if (!(k in cells)) cells[k] = typeof init === 'function' ? (init as () => unknown)() : init;
    return k;
  };
  const dispatcher = {
    useState(init: unknown) {
      const k = cell(init);
      return [cells[k], (v: unknown) => { cells[k] = typeof v === 'function' ? (v as (q: unknown) => unknown)(cells[k]) : v; }];
    },
    useRef(init: unknown) {
      const k = cell(() => ({ current: init }));
      return cells[k];
    },
    useEffect: () => {},
    useLayoutEffect: () => {},
    useCallback: (f: unknown) => f,
    useMemo: (f: () => unknown) => f(),
  };
  return () => {
    let el: El | null = null;
    // A setState during render is a re-render, as on a phone: the page settles.
    for (let pass = 0; pass < 4; pass++) {
      i = 0;
      const prev = INTERNALS.H;
      INTERNALS.H = dispatcher;
      try {
        el = (page.Component as (p: unknown) => El)({ ctx });
      } finally {
        INTERNALS.H = prev;
      }
    }
    return el!.props.rack as Rack;
  };
}

function walk(n: unknown, out: El[] = []): El[] {
  if (Array.isArray(n)) n.forEach((c) => walk(c, out));
  else if (React.isValidElement(n)) {
    out.push(n as El);
    walk((n.props as { children?: unknown }).children, out);
  }
  return out;
}
const words = (n: unknown): string[] => {
  if (typeof n === 'string' || typeof n === 'number') return [String(n)];
  if (Array.isArray(n)) return n.flatMap(words);
  if (React.isValidElement(n)) {
    const kids = (n.props as { children?: unknown }).children;
    // One text element with mixed children is one string on the screen.
    if (Array.isArray(kids) && kids.every((k) => typeof k === 'string' || typeof k === 'number')) return [kids.join('')];
    return words(kids);
  }
  return [];
};
const param = (rack: Rack, id: string) => {
  const p = rack.params.find((q) => q.id === id);
  assert.ok(p, `no control ${id}`);
  return p;
};
/** The stage as a phone draws it: the drawing component opened one level. */
function glass(rack: Rack, prop: string): unknown {
  const top = rack.stage(355, 160);
  const drawing = walk(top).find((e) => prop in e.props);
  assert.ok(drawing, `the stage draws a component with ${prop}`);
  return (drawing.type as (p: unknown) => unknown)(drawing.props);
}

describe('Power and headroom: the LISTENER is seen on the glass', () => {
  const look = (rack: Rack) => {
    const tree = glass(rack, 'match');
    const mark = walk(tree).find((e) => e.props.testID === 'ss-listener-mark');
    assert.ok(mark, 'the band draws the listener');
    const style = [mark.props.style].flat() as { left?: string }[];
    return { text: words(tree), left: parseFloat(style.find((s) => typeof s?.left === 'string')?.left ?? 'NaN') };
  };

  it('the marker moves out along the line and the SPL on the glass falls with it', () => {
    const run = runner('Power and headroom');
    const seen = [2, 10, 30].map((d) => {
      param(run(), 'dist').onSelect!(`${d}`);
      const rack = run();
      const l = look(rack);
      const spl = `${predictedSpl(97, 500, d, 6).toFixed(1)} dB`;
      assert.ok(l.text.join(' ').includes(spl), `the glass shows ${spl} at ${d} m (saw ${l.text.join(' | ')})`);
      assert.equal(rack.bezel.at(-1)?.v, spl, 'the glass and the bezel agree');
      return { d, left: l.left, spl: predictedSpl(97, 500, d, 6) };
    });
    assert.ok(seen[0].left < seen[1].left && seen[1].left < seen[2].left, 'farther is farther along the line');
    assert.ok(seen[0].spl > seen[1].spl && seen[1].spl > seen[2].spl, 'farther is quieter');
    // The line is to scale: 10 m is five times as far out as 2 m.
    assert.ok(Math.abs(seen[1].left / seen[0].left - 5) < 1e-6);
    assert.ok(seen[2].left <= 100, 'the marker stays on the line');
  });

  it('all three distances are named on the line', () => {
    const run = runner('Power and headroom');
    const text = look(run()).text;
    for (const d of ['2 m', '10 m', '30 m']) assert.ok(text.includes(d), `${d} is on the line`);
  });
});

describe('Amplifier loads: BRIDGED is seen in the wiring and the label', () => {
  type Drawn = { texts: string; cables: string[]; links: El[]; ports: number[] };
  const look = (rack: Rack): Drawn => {
    const els = walk(glass(rack, 'verdict'));
    const paths = els.filter((e) => typeof e.props.d === 'string');
    return {
      texts: words(els.filter((e) => typeof e.props.children === 'string' || Array.isArray(e.props.children))).join(' | '),
      cables: paths.filter((e) => e.props.stroke !== colors.cyanBright).map((e) => e.props.d as string),
      links: paths.filter((e) => e.props.stroke === colors.cyanBright),
      ports: els.filter((e) => typeof e.props.cy === 'number').map((e) => e.props.cy as number),
    };
  };
  const set = (run: () => Rack, count: number, ohms: number) => {
    param(run(), 'count').onChange!((count - 1) / 3);
    param(run(), 'ohms').onSelect!(`${ohms}`);
  };
  const bridge = (run: () => Rack) => param(run(), 'bridged').onToggle!();

  it('the label keeps BRIDGED in the safe and the unsafe state', () => {
    const run = runner('Amplifier loads');
    set(run, 1, 16);
    assert.ok(/AMP · CH A/.test(look(run()).texts), 'a channel, not bridged');
    bridge(run);
    assert.equal(run().bezel.at(-1)?.v, 'SAFE');
    assert.ok(/AMP · BRIDGED/.test(look(run()).texts));
    set(run, 3, 8);
    assert.equal(run().bezel.at(-1)?.v, 'UNSAFE');
    const unsafe = look(run()).texts;
    assert.ok(/AMP · BRIDGED · PROTECT/.test(unsafe), `both words stay (saw ${unsafe})`);
    bridge(run);
    set(run, 4, 4);
    assert.equal(run().bezel.at(-1)?.v, 'UNSAFE');
    const plain = look(run()).texts;
    assert.ok(/AMP · CH A · PROTECT/.test(plain) && !/BRIDGED/.test(plain), `the switch reads off too (saw ${plain})`);
  });

  it('bridging draws a link to a second output, and unbridging takes it away', () => {
    const run = runner('Amplifier loads');
    set(run, 2, 16);
    const off = look(run());
    assert.equal(off.links.length, 0, 'no link on one channel');
    bridge(run);
    const on = look(run());
    assert.equal(on.links.length, 1, 'one link');
    assert.equal(on.ports.length, off.ports.length + 1, 'the second output appears');
    assert.ok(/CH B/.test(on.texts), 'and is named');
    assert.ok(!/CH B/.test(off.texts));
  });

  it('at every cabinet count the link touches no cable and each cable stays its own line', () => {
    for (const count of [1, 2, 3, 4]) {
      const run = runner('Amplifier loads');
      set(run, count, 16);
      bridge(run);
      const d = look(run());
      assert.equal(d.cables.length, count * 2, `${count}: a cable (and its highlight) per cabinet`);
      assert.equal(new Set(d.cables).size, count, `${count}: no two cables share a route`);
      assert.equal(new Set(d.ports).size, count + 1, `${count}: every output its own port`);
      const link = (d.links[0].props.d as string).match(/-?\d+(\.\d+)?/g)!.map(Number);
      const xs = link.filter((_, i) => i % 2 === 0);
      const ys = link.filter((_, i) => i % 2 === 1);
      assert.ok(Math.max(...xs) <= 78, 'the link stays behind the ports; every cable leaves them forwards');
      assert.ok(d.ports.includes(ys[0]) && d.ports.includes(ys.at(-1)!), 'it runs from port to port');
      assert.ok(ys[0] !== ys.at(-1), 'between two different ports');
    }
  });
});
