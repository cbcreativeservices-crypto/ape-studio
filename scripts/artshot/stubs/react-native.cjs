// 'react-native' for artshot. Platform/StyleSheet/PixelRatio/Dimensions and
// friends are plain stubs. View / Text / Pressable are EMULATED in Skia so an
// RN overlay (absolute-positioned labels over a canvas) still shows in the PNG:
//  * View: left/top offset its children; backgroundColor (+ borderRadius,
//    borderWidth/borderColor) fills its width × height; opacity; transform.
//  * Text: one line, the app's font family (src/theme/tokens names), fontSize,
//    color, textAlign inside `width`, a soft textShadow. No flexbox, no wrapping.
const React = require('react');
const S = require('@shopify/react-native-skia/lib/commonjs/headless');
const { Skia } = S.getSkiaExports();
const fonts = require('./fonts.cjs');
const h = React.createElement;

const env = () => globalThis.__ARTSHOT__ ?? { width: 390, height: 844, scale: 3 };
const noop = () => {};

function flatten(style) {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return typeof style === 'object' ? style : {};
}
const Layout = React.createContext(null);
function dim(v, of) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.endsWith('%')) return (parseFloat(v) / 100) * of;
  return undefined;
}
function angle(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return String(v).endsWith('deg') ? (n * Math.PI) / 180 : n;
}
function rnTransform(list, w, hgt) {
  if (!Array.isArray(list) || !list.length) return [];
  const out = [{ translateX: w / 2 }, { translateY: hgt / 2 }];
  for (const t of list) {
    const [k, v] = Object.entries(t)[0];
    if (k === 'rotate' || k === 'rotateZ') out.push({ rotate: angle(v) });
    else if (k === 'translateX' || k === 'translateY' || k === 'scale' || k === 'scaleX' || k === 'scaleY') out.push({ [k]: v });
  }
  out.push({ translateX: -w / 2 }, { translateY: -hgt / 2 });
  return out;
}

function View(props) {
  const s = flatten(props.style);
  const parent = React.useContext(Layout) ?? { w: env().width, h: env().height };
  const w = dim(s.width, parent.w) ?? (s.left != null && s.right != null ? parent.w - dim(s.left, parent.w) - dim(s.right, parent.w) : parent.w);
  const hgt = dim(s.height, parent.h) ?? (s.aspectRatio ? w / s.aspectRatio : s.top != null && s.bottom != null ? parent.h - dim(s.top, parent.h) - dim(s.bottom, parent.h) : parent.h);
  const left = dim(s.left, parent.w) ?? (s.right != null && s.width != null ? parent.w - dim(s.right, parent.w) - w : 0);
  const top = dim(s.top, parent.h) ?? (s.bottom != null && s.height != null ? parent.h - dim(s.bottom, parent.h) - hgt : 0);
  const r = s.borderRadius ?? 0;
  const kids = [];
  const sized = s.width != null || s.height != null || s.position === 'absolute';
  if (s.backgroundColor && s.backgroundColor !== 'transparent' && sized) kids.push(h(S.RoundedRect, { key: '__bg', x: 0, y: 0, width: w, height: hgt, r, color: s.backgroundColor }));
  if (s.borderWidth && s.borderColor && sized) kids.push(h(S.RoundedRect, { key: '__bd', x: s.borderWidth / 2, y: s.borderWidth / 2, width: w - s.borderWidth, height: hgt - s.borderWidth, r, color: s.borderColor, style: 'stroke', strokeWidth: s.borderWidth }));
  const transform = [{ translateX: left }, { translateY: top }, ...rnTransform(s.transform, w, hgt)];
  return h(Layout.Provider, { value: { w, h: hgt } }, h(S.Group, { transform, opacity: s.opacity }, ...kids, props.children));
}

function textOf(children) {
  let out = '';
  React.Children.forEach(children, (c) => {
    if (c == null || c === false || c === true) return;
    if (typeof c === 'string' || typeof c === 'number') out += String(c);
    else if (c.props) out += textOf(c.props.children);
  });
  return out;
}
function Text(props) {
  const s = flatten(props.style);
  const parent = React.useContext(Layout) ?? { w: env().width, h: env().height };
  const str = textOf(props.children);
  if (!str) return null;
  const size = s.fontSize ?? 14;
  const font = fonts.font(s.fontFamily ?? 'Barlow_400Regular', size);
  const m = font.getMetrics();
  const lineH = s.lineHeight ?? m.descent - m.ascent;
  const left = dim(s.left, parent.w) ?? 0;
  const top = dim(s.top, parent.h) ?? 0;
  const boxW = dim(s.width, parent.w);
  const ls = s.letterSpacing ?? 0;
  const ids = font.getGlyphIDs(str);
  const adv = font.getGlyphWidths(ids);
  const tw = adv.reduce((a, b) => a + b, 0) + ls * ids.length;
  let x = left;
  if (boxW != null && s.textAlign === 'center') x = left + (boxW - tw) / 2;
  else if (boxW != null && s.textAlign === 'right') x = left + boxW - tw;
  const y = top + (lineH - (m.descent - m.ascent)) / 2 - m.ascent;
  const color = s.color ?? '#000';
  // glyph runs (RN letterSpacing = extra advance after every glyph)
  const run = (ox, oy) => {
    let cx = x + ox;
    return ids.map((id, i) => {
      const g = { id, pos: Skia.Point(cx, y + oy) };
      cx += adv[i] + ls;
      return g;
    });
  };
  const shadow = s.textShadowColor && (s.textShadowRadius ?? 0) > 0
    ? h(S.Glyphs, { font, glyphs: run(s.textShadowOffset?.width ?? 0, s.textShadowOffset?.height ?? 0), color: s.textShadowColor }, h(S.BlurMask, { blur: s.textShadowRadius / 2, style: 'normal' }))
    : null;
  return h(S.Group, { opacity: s.opacity }, shadow, h(S.Glyphs, { font, glyphs: run(0, 0), color }));
}

const Passthrough = (props) => h(View, props, props.children);
const Nothing = () => null;

const StyleSheet = {
  create: (o) => o,
  flatten,
  compose: (a, b) => [a, b],
  absoluteFill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  hairlineWidth: 1 / 3,
};

class AnimatedValue {
  constructor(v) { this._v = v; }
  setValue(v) { this._v = v; }
  interpolate() { return this; }
  addListener() { return ''; }
  removeAllListeners() {}
  stopAnimation() {}
}
const anim = () => ({ start: (cb) => cb && cb({ finished: true }), stop: noop, reset: noop });
const Animated = {
  View, Text, ScrollView: Passthrough, Image: Nothing,
  Value: AnimatedValue, ValueXY: AnimatedValue,
  timing: anim, spring: anim, decay: anim, loop: anim, sequence: anim, parallel: anim, stagger: anim, delay: anim,
  event: () => noop, createAnimatedComponent: (C) => C,
};

module.exports = {
  __esModule: true,
  Platform: { OS: 'ios', Version: '18.0', isPad: false, isTV: false, select: (o) => ('ios' in o ? o.ios : o.native ?? o.default) },
  StyleSheet,
  PixelRatio: { get: () => env().scale, getFontScale: () => 1, roundToNearestPixel: (n) => Math.round(n * env().scale) / env().scale, getPixelSizeForLayoutSize: (n) => Math.round(n * env().scale) },
  Dimensions: { get: () => ({ width: env().width, height: env().height, scale: env().scale, fontScale: 1 }), addEventListener: () => ({ remove: noop }) },
  useWindowDimensions: () => ({ width: env().width, height: env().height, scale: env().scale, fontScale: 1 }),
  useColorScheme: () => 'dark',
  Appearance: { getColorScheme: () => 'dark', addChangeListener: () => ({ remove: noop }) },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    isScreenReaderEnabled: () => Promise.resolve(false),
    isBoldTextEnabled: () => Promise.resolve(false),
    announceForAccessibility: noop,
    announceForAccessibilityWithOptions: noop,
    setAccessibilityFocus: noop,
    addEventListener: () => ({ remove: noop }),
  },
  AppState: { currentState: 'active', addEventListener: () => ({ remove: noop }) },
  Keyboard: { dismiss: noop, addListener: () => ({ remove: noop }) },
  BackHandler: { addEventListener: () => ({ remove: noop }), exitApp: noop },
  Linking: { openURL: () => Promise.resolve(), addEventListener: () => ({ remove: noop }) },
  Alert: { alert: noop },
  Vibration: { vibrate: noop, cancel: noop },
  I18nManager: { isRTL: false },
  NativeModules: {},
  TurboModuleRegistry: { get: () => null, getEnforcing: () => ({}) },
  NativeEventEmitter: class { addListener() { return { remove: noop }; } removeAllListeners() {} },
  findNodeHandle: () => null,
  processColor: (c) => c,
  Animated,
  Easing: require('./reanimated.cjs').Easing,
  View,
  Text,
  Pressable: Passthrough,
  TouchableOpacity: Passthrough,
  TouchableWithoutFeedback: Passthrough,
  TouchableHighlight: Passthrough,
  ScrollView: Passthrough,
  SafeAreaView: Passthrough,
  KeyboardAvoidingView: Passthrough,
  Image: Nothing,
  ImageBackground: Passthrough,
  TextInput: Nothing,
  ActivityIndicator: Nothing,
  Switch: Nothing,
  Modal: Nothing,
  FlatList: Nothing,
  SectionList: Nothing,
  StatusBar: Nothing,
};
