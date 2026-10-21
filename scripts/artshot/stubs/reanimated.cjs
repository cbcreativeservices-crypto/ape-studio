// 'react-native-reanimated' for artshot: every animation lands at its target;
// shared values are plain {value} boxes; worklets run on the JS thread.
const React = require('react');
const sv = (v) => ({ _isReanimatedSharedValue: true, value: v, get: () => v, set(n) { this.value = typeof n === 'function' ? n(this.value) : n; }, addListener() {}, removeListener() {}, modify(fn) { this.value = fn(this.value); } });
const id = (x) => x;
const noop = () => {};
const easingFn = () => id;
const Easing = new Proxy({ linear: id, ease: id, quad: id, cubic: id, sin: id, circle: id, exp: id, bounce: id }, { get: (t, k) => (k in t ? t[k] : easingFn) });
['in', 'out', 'inOut', 'bezier', 'bezierFn', 'poly', 'elastic', 'back', 'steps'].forEach((k) => (Easing[k] = easingFn));
Easing.bezier = () => ({ factory: () => id });

const passthrough = React.forwardRef(function Animated(props, ref) {
  return props.children ?? null;
});
const rn = () => require('./react-native.cjs');
const Animated = new Proxy(
  { createAnimatedComponent: (C) => C },
  {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'View' || k === 'Text' || k === 'ScrollView' || k === 'Image') return rn()[k];
      return passthrough;
    },
  },
);

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  Easing,
  useSharedValue: (v) => React.useMemo(() => sv(v), []), // eslint-disable-line
  makeMutable: sv,
  useDerivedValue: (fn) => sv(fn()),
  useAnimatedStyle: (fn) => fn(),
  useAnimatedProps: (fn) => fn(),
  useAnimatedReaction: noop,
  useAnimatedRef: () => React.useRef(null),
  useFrameCallback: noop,
  useReducedMotion: () => true,
  useEvent: () => noop,
  useHandler: () => ({ context: {}, doDependenciesDiffer: false }),
  useAnimatedScrollHandler: () => noop,
  withTiming: (to) => to,
  withSpring: (to) => to,
  withDecay: () => 0,
  withDelay: (_d, a) => a,
  withRepeat: (a) => a,
  withSequence: (...a) => a[a.length - 1],
  withClamp: (_c, a) => a,
  cancelAnimation: noop,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  scheduleOnRN: (fn, ...a) => fn(...a),
  scheduleOnUI: (fn, ...a) => fn(...a),
  interpolate: (v, i, o) => require('./skia.cjs').interpolate(v, i, o),
  interpolateColor: (_v, _i, o) => o[0],
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  measure: () => null,
  isSharedValue: (v) => !!v && typeof v === 'object' && 'value' in v,
  FadeIn: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },
  Layout: {},
  LinearTransition: {},
};
