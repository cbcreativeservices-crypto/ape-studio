// '@shopify/react-native-skia' for artshot: the package's headless build (all
// components + types), plus the pieces the app imports that headless does not
// export: Skia, vec/point/rect/rrect, loadData, the font/image/data hooks,
// matchFont, and Canvas (draws its children in place).
const fs = require('node:fs');
const React = require('react');
const headless = require('@shopify/react-native-skia/lib/commonjs/headless');
const { Skia } = headless.getSkiaExports();
const fonts = require('./fonts.cjs');

function readSource(source) {
  // an asset require() is its absolute path (hooks.mjs); also accept {uri}, file:// and Uint8Array
  if (source == null) return null;
  if (source instanceof Uint8Array) return source;
  let p = typeof source === 'object' && source.uri ? source.uri : source;
  if (typeof p === 'number') throw new Error(`artshot: numeric asset id ${p} (expected a path)`);
  if (typeof p === 'string' && p.startsWith('file://')) p = new URL(p).pathname;
  return new Uint8Array(fs.readFileSync(p));
}
function loadData(source, factory, onError) {
  try {
    const bytes = readSource(source);
    if (!bytes) return Promise.resolve(null);
    const v = factory(Skia.Data.fromBytes(bytes));
    return Promise.resolve(v);
  } catch (e) {
    if (onError) onError(e);
    return Promise.reject(e);
  }
}
// The hooks resolve SYNCHRONOUSLY in artshot (one frame, no async round trip).
function useSync(source, factory) {
  return React.useMemo(() => {
    try {
      const b = readSource(source);
      return b ? factory(Skia.Data.fromBytes(b)) : null;
    } catch (e) {
      console.warn('[artshot] asset load failed:', e.message);
      return null;
    }
  }, [source]); // eslint-disable-line
}
const useTypeface = (source) => useSync(source, (d) => Skia.Typeface.MakeFreeTypeFaceFromData(d));
const useFont = (source, size = 14) => {
  const tf = useTypeface(source);
  return React.useMemo(() => (tf ? Skia.Font(tf, size) : null), [tf, size]);
};
const useImage = (source) => useSync(source, (d) => Skia.Image.MakeImageFromEncoded(d));
const useData = (source) => useSync(source, (d) => d);
const useSVG = (source) => useSync(source, (d) => Skia.SVG.MakeFromData(d));
const useFonts = () => fonts.provider();

function matchFont(style = {}) {
  const fam = fonts.typeface(style.fontFamily || 'Oswald_500Medium');
  return Skia.Font(fam, style.fontSize ?? 14);
}

const vec = (x = 0, y) => Skia.Point(x, y ?? x);
const point = vec;
const rect = (x, y, width, height) => Skia.XYWHRect(x, y, width, height);
const rrect = (r, rx, ry) => Skia.RRectXY(r, rx, ry);
const bounds = (rects) => {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return rect(x, y, Math.max(...rects.map((r) => r.x + r.width)) - x, Math.max(...rects.map((r) => r.y + r.height)) - y);
};
const interpolate = (v, input, output) => {
  if (v <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (v <= input[i]) return output[i - 1] + ((v - input[i - 1]) / (input[i] - input[i - 1])) * (output[i] - output[i - 1]);
  }
  return output[output.length - 1];
};

// <Canvas> inside a headless tree: just its children (size/style ignored).
function Canvas({ children }) {
  return React.createElement(headless.Group, null, children);
}

const extra = {
  Skia,
  loadData,
  useTypeface,
  useFont,
  useFonts,
  useImage,
  useData,
  useRawData: useData,
  useSVG,
  matchFont,
  vec,
  point,
  rect,
  rrect,
  bounds,
  interpolate,
  Canvas,
  useCanvasRef: () => React.useRef(null),
  usePathValue: (cb, init) => {
    const p = init ? init.copy() : Skia.Path.Make();
    cb(p);
    return { value: p };
  },
  useClock: () => ({ value: 0 }),
  useRectBuffer: (n, fn) => ({ value: Array.from({ length: n }, (_, i) => { const r = Skia.XYWHRect(0, 0, 0, 0); fn && fn(r, i); return r; }) }),
  useRSXformBuffer: (n, fn) => ({ value: Array.from({ length: n }, (_, i) => { const r = Skia.RSXform(1, 0, 0, 0); fn && fn(r, i); return r; }) }),
};

module.exports = new Proxy(
  { __esModule: true },
  {
    get(t, k) {
      if (k in extra) return extra[k];
      if (k === '__esModule') return true;
      if (k === 'default') return module.exports;
      return headless[k];
    },
    has(t, k) {
      return k in extra || k in headless;
    },
  },
);
