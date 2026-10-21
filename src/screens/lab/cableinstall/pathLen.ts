/**
 * Length of an SVG path `d`, in its own units — for the dash-reveal draws
 * (wiring grade R3-CI-05, 2026-10-21: a hand-typed `len` shorter than its
 * path left the drawn cable stopping short of its plug, in mid-air).
 *
 * Handles M L H V C S Q T A Z, absolute and relative. Curves are measured by
 * sampling; an arc is measured on its true ellipse. The result is a hair
 * long rather than short (rounded up), which is the safe side for a reveal.
 * Pure TS, no React Native: the tests import it directly.
 */
type Pt = [number, number];

const TOKEN = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;

function bezierLen(pts: Pt[], steps = 24): number {
  const at = (t: number): Pt => {
    // de Casteljau for any order
    let p = pts.map((q) => [q[0], q[1]] as Pt);
    while (p.length > 1) {
      const n: Pt[] = [];
      for (let i = 0; i < p.length - 1; i++) n.push([p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t]);
      p = n;
    }
    return p[0];
  };
  let len = 0;
  let prev = pts[0];
  for (let s = 1; s <= steps; s++) {
    const q = at(s / steps);
    len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
    prev = q;
  }
  return len;
}

/** SVG arc (endpoint form) → its length, via the centre parameterisation. */
function arcLen(p0: Pt, rx: number, ry: number, phiDeg: number, large: boolean, sweep: boolean, p1: Pt): number {
  if (rx === 0 || ry === 0) return Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2;
  const dy = (p0[1] - p1[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx1 = (k * rx * y1) / ry;
  const cy1 = (-k * ry * x1) / rx;
  const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= Math.PI * 2;
  if (sweep && dt < 0) dt += Math.PI * 2;
  const steps = Math.max(8, Math.ceil(Math.abs(dt) / (Math.PI / 24)));
  let len = 0;
  let px = rx * Math.cos(t1);
  let py = ry * Math.sin(t1);
  for (let s = 1; s <= steps; s++) {
    const t = t1 + (dt * s) / steps;
    const qx = rx * Math.cos(t);
    const qy = ry * Math.sin(t);
    len += Math.hypot(qx - px, qy - py);
    px = qx;
    py = qy;
  }
  return len;
}

export function pathLen(d: string): number {
  const toks = d.match(TOKEN) ?? [];
  let i = 0;
  let cmd = '';
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  let lastCtrl: Pt | null = null;
  let lastCmd = '';
  let total = 0;
  const num = () => Number(toks[i++]);
  const isNum = () => i < toks.length && !/^[A-Za-z]$/.test(toks[i]);
  while (i < toks.length) {
    if (/^[A-Za-z]$/.test(toks[i])) cmd = toks[i++];
    else if (!cmd) {
      i++;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cur[0] : 0;
    const oy = rel ? cur[1] : 0;
    if (C === 'Z') {
      total += Math.hypot(start[0] - cur[0], start[1] - cur[1]);
      cur = [start[0], start[1]];
      lastCtrl = null;
      lastCmd = 'Z';
      cmd = '';
      continue;
    }
    if (!isNum()) {
      cmd = '';
      continue;
    }
    if (C === 'M') {
      cur = [ox + num(), oy + num()];
      start = [cur[0], cur[1]];
      cmd = rel ? 'l' : 'L'; // implicit lineto after the first pair
      lastCtrl = null;
    } else if (C === 'L') {
      const p: Pt = [ox + num(), oy + num()];
      total += Math.hypot(p[0] - cur[0], p[1] - cur[1]);
      cur = p;
      lastCtrl = null;
    } else if (C === 'H') {
      const x = (rel ? cur[0] : 0) + num();
      total += Math.abs(x - cur[0]);
      cur = [x, cur[1]];
      lastCtrl = null;
    } else if (C === 'V') {
      const y = (rel ? cur[1] : 0) + num();
      total += Math.abs(y - cur[1]);
      cur = [cur[0], y];
      lastCtrl = null;
    } else if (C === 'C' || C === 'S') {
      let c1: Pt;
      if (C === 'C') c1 = [ox + num(), oy + num()];
      else c1 = lastCtrl && /[CS]/i.test(lastCmd) ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : [cur[0], cur[1]];
      const c2: Pt = [ox + num(), oy + num()];
      const p: Pt = [ox + num(), oy + num()];
      total += bezierLen([cur, c1, c2, p]);
      lastCtrl = c2;
      cur = p;
    } else if (C === 'Q' || C === 'T') {
      let c1: Pt;
      if (C === 'Q') c1 = [ox + num(), oy + num()];
      else c1 = lastCtrl && /[QT]/i.test(lastCmd) ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : [cur[0], cur[1]];
      const p: Pt = [ox + num(), oy + num()];
      total += bezierLen([cur, c1, p]);
      lastCtrl = c1;
      cur = p;
    } else if (C === 'A') {
      const rx = num();
      const ry = num();
      const phi = num();
      const large = num() !== 0;
      const sweep = num() !== 0;
      const p: Pt = [ox + num(), oy + num()];
      total += arcLen(cur, rx, ry, phi, large, sweep, p);
      cur = p;
      lastCtrl = null;
    } else {
      i++;
    }
    lastCmd = C;
  }
  return Math.ceil(total);
}
