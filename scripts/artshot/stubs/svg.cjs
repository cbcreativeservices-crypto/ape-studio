// 'react-native-svg' for artshot: the SVG elements the app draws, re-drawn
// with Skia. Supported: Svg (viewBox → scale; width "100%" = the parent's
// width), G (transform/x/y, inherited presentation props), Rect, Circle,
// Ellipse, Line, Path, Polygon, Polyline, Text/TSpan; fill, stroke,
// strokeWidth, strokeDasharray, strokeLinecap/Linejoin, opacity, fillOpacity,
// strokeOpacity, fontSize, fontFamily, textAnchor. Defs / gradients / clip /
// mask / patterns are ignored (drawn without them).
const React = require('react');
const S = require('@shopify/react-native-skia/lib/commonjs/headless');
const { Skia } = S.getSkiaExports();
const fonts = require('./fonts.cjs');
const h = React.createElement;
const vec = (x, y) => Skia.Point(x, y);

const Inherit = React.createContext({ fill: '#000' });
const INHERITED = ['fill', 'stroke', 'strokeWidth', 'strokeDasharray', 'strokeLinecap', 'strokeLinejoin', 'fillOpacity', 'strokeOpacity', 'fontSize', 'fontFamily', 'fontWeight', 'textAnchor', 'letterSpacing', 'fillRule'];
function merged(parent, props) {
  const o = { ...parent };
  for (const k of INHERITED) if (props[k] !== undefined) o[k] = props[k];
  return o;
}
const num = (v, d = 0) => (v == null ? d : typeof v === 'number' ? v : parseFloat(v));
function dash(v) {
  if (!v || v === 'none') return null;
  const a = (Array.isArray(v) ? v : String(v).split(/[\s,]+/)).map(Number).filter((n) => !isNaN(n));
  if (!a.length) return null;
  return a.length % 2 ? [...a, ...a] : a;
}
function parseTransform(t) {
  if (!t) return [];
  if (Array.isArray(t)) return t;
  const out = [];
  const re = /(\w+)\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(String(t)))) {
    const a = m[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (m[1] === 'translate') out.push({ translateX: a[0] }, { translateY: a[1] ?? 0 });
    else if (m[1] === 'scale') out.push({ scaleX: a[0] }, { scaleY: a[1] ?? a[0] });
    else if (m[1] === 'rotate') {
      if (a.length === 3) out.push({ translateX: a[1] }, { translateY: a[2] }, { rotate: (a[0] * Math.PI) / 180 }, { translateX: -a[1] }, { translateY: -a[2] });
      else out.push({ rotate: (a[0] * Math.PI) / 180 });
    } else if (m[1] === 'matrix') out.push({ matrix: [a[0], a[2], a[4], a[1], a[3], a[5], 0, 0, 1] });
  }
  return out;
}
function propTransform(p) {
  const out = [...parseTransform(p.transform)];
  if (p.x != null && p.isG) out.unshift({ translateX: num(p.x) }, { translateY: num(p.y) });
  if (p.rotation || p.rotate) {
    const ox = num(p.originX ?? (p.origin ? String(p.origin).split(/[\s,]+/)[0] : 0));
    const oy = num(p.originY ?? (p.origin ? String(p.origin).split(/[\s,]+/)[1] : 0));
    out.push({ translateX: ox }, { translateY: oy }, { rotate: (num(p.rotation ?? p.rotate) * Math.PI) / 180 }, { translateX: -ox }, { translateY: -oy });
  }
  if (p.scale != null) out.push({ scale: num(p.scale) });
  return out;
}
const isPaint = (c) => c && c !== 'none' && c !== 'transparent' && !String(c).startsWith('url(');

// Draws a path (SkPath) with SVG semantics: fill first, then stroke.
function Shape({ props, path }) {
  const inh = React.useContext(Inherit);
  const p = merged(inh, props);
  const op = props.opacity != null ? num(props.opacity, 1) : undefined;
  const parts = [];
  if (isPaint(p.fill)) {
    parts.push(h(S.Path, { key: 'f', path, color: p.fill, fillType: p.fillRule === 'evenodd' ? 'evenOdd' : undefined, opacity: p.fillOpacity != null ? num(p.fillOpacity, 1) : undefined }));
  }
  if (isPaint(p.stroke) && num(p.strokeWidth, 1) > 0) {
    const d = dash(p.strokeDasharray);
    parts.push(
      h(
        S.Path,
        { key: 's', path, color: p.stroke, style: 'stroke', strokeWidth: num(p.strokeWidth, 1), strokeCap: p.strokeLinecap ?? 'butt', strokeJoin: p.strokeLinejoin ?? 'miter', opacity: p.strokeOpacity != null ? num(p.strokeOpacity, 1) : undefined },
        d ? h(S.DashPathEffect, { intervals: d }) : null,
      ),
    );
  }
  const tr = propTransform(props);
  return h(S.Group, { opacity: op, transform: tr.length ? tr : undefined }, ...parts);
}

function Svg(props) {
  const env = globalThis.__ARTSHOT__ ?? { width: 390 };
  const vb = props.viewBox ? String(props.viewBox).split(/[\s,]+/).map(Number) : null;
  let w = typeof props.width === 'number' ? props.width : typeof props.width === 'string' && props.width.endsWith('%') ? (parseFloat(props.width) / 100) * env.width : typeof props.width === 'string' ? parseFloat(props.width) : vb ? vb[2] : env.width;
  let hh = typeof props.height === 'number' ? props.height : typeof props.height === 'string' && !props.height.endsWith('%') ? parseFloat(props.height) : vb ? (w * vb[3]) / vb[2] : w;
  const tr = vb ? [{ scaleX: w / vb[2] }, { scaleY: hh / vb[3] }, { translateX: -vb[0] }, { translateY: -vb[1] }] : [];
  return h(Inherit.Provider, { value: merged({ fill: '#000' }, props) }, h(S.Group, { transform: tr }, props.children));
}
function G(props) {
  const inh = React.useContext(Inherit);
  const tr = propTransform({ ...props, isG: true });
  return h(Inherit.Provider, { value: merged(inh, props) }, h(S.Group, { opacity: props.opacity != null ? num(props.opacity, 1) : undefined, transform: tr.length ? tr : undefined }, props.children));
}
function Rect(props) {
  const x = num(props.x), y = num(props.y), w = num(props.width), hh = num(props.height);
  const rx = num(props.rx ?? props.ry), ry = num(props.ry ?? props.rx);
  const b = Skia.PathBuilder.Make();
  if (rx || ry) b.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, hh), rx, ry));
  else b.addRect(Skia.XYWHRect(x, y, w, hh));
  return h(Shape, { props, path: b.detach() });
}
function Circle(props) {
  const b = Skia.PathBuilder.Make();
  b.addCircle(num(props.cx), num(props.cy), num(props.r));
  return h(Shape, { props, path: b.detach() });
}
function Ellipse(props) {
  const b = Skia.PathBuilder.Make();
  const rx = num(props.rx), ry = num(props.ry);
  b.addOval(Skia.XYWHRect(num(props.cx) - rx, num(props.cy) - ry, 2 * rx, 2 * ry));
  return h(Shape, { props, path: b.detach() });
}
function Line(props) {
  const b = Skia.PathBuilder.Make();
  b.moveTo(num(props.x1), num(props.y1));
  b.lineTo(num(props.x2), num(props.y2));
  return h(Shape, { props: { ...props, fill: 'none' }, path: b.detach() });
}
function Path(props) {
  const path = (props.d && Skia.Path.MakeFromSVGString(String(props.d))) || Skia.PathBuilder.Make().detach();
  return h(Shape, { props, path });
}
function poly(props, close) {
  const n = String(props.points ?? '').trim().split(/[\s,]+/).map(Number);
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i + 1 < n.length; i += 2) (i ? b.lineTo(n[i], n[i + 1]) : b.moveTo(n[i], n[i + 1]));
  if (close) b.close();
  return h(Shape, { props: close ? props : { fill: 'none', ...props }, path: b.detach() });
}
const Polygon = (props) => poly(props, true);
const Polyline = (props) => poly(props, false);

function textOf(children) {
  let out = '';
  React.Children.forEach(children, (c) => {
    if (c == null || typeof c === 'boolean') return;
    if (typeof c === 'string' || typeof c === 'number') out += String(c);
    else if (c.props) out += textOf(c.props.children);
  });
  return out;
}
function family(p) {
  if (p.fontFamily && /_\d00/.test(p.fontFamily)) return p.fontFamily;
  const bold = p.fontWeight === 'bold' || num(p.fontWeight, 400) >= 600;
  return bold ? 'Barlow_600SemiBold' : 'Barlow_400Regular';
}
function SvgText(props) {
  const inh = React.useContext(Inherit);
  const p = merged(inh, props);
  const str = textOf(props.children);
  if (!str) return null;
  const size = num(p.fontSize, 12);
  const font = fonts.font(family(p), size);
  const ls = num(p.letterSpacing, 0);
  const tw = font.getTextWidth(str) + ls * Math.max(0, [...str].length - 1);
  const x0 = num(Array.isArray(props.x) ? props.x[0] : props.x) + num(props.dx);
  const y = num(Array.isArray(props.y) ? props.y[0] : props.y) + num(props.dy);
  const x = p.textAnchor === 'middle' ? x0 - tw / 2 : p.textAnchor === 'end' ? x0 - tw : x0;
  const color = isPaint(p.fill) ? p.fill : '#000';
  const tr = propTransform(props);
  const op = props.opacity != null ? num(props.opacity, 1) : undefined;
  let body;
  if (!ls) body = h(S.Text, { x, y, text: str, font, color, opacity: p.fillOpacity != null ? num(p.fillOpacity, 1) : undefined });
  else {
    // letter-spacing: the shaped glyph advances, plus `ls` after each glyph
    const ids = font.getGlyphIDs(str);
    const adv = font.getGlyphWidths(ids);
    let cx = x;
    const glyphs = ids.map((id, i) => {
      const g = { id, pos: vec(cx, y) };
      cx += adv[i] + ls;
      return g;
    });
    body = h(S.Glyphs, { font, glyphs, color });
  }
  return h(S.Group, { opacity: op, transform: tr.length ? tr : undefined }, body);
}
const Nothing = () => null;
const Defs = Nothing;

module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  G,
  Rect,
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Polyline,
  Text: SvgText,
  TSpan: SvgText,
  TextPath: Nothing,
  Defs,
  LinearGradient: Nothing,
  RadialGradient: Nothing,
  Stop: Nothing,
  ClipPath: Nothing,
  Mask: Nothing,
  Pattern: Nothing,
  Use: Nothing,
  Symbol: Nothing,
  Image: Nothing,
  ForeignObject: Nothing,
};
