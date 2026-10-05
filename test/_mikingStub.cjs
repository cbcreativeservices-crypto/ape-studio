/**
 * A do-nothing stand-in for the native UI modules (react-native, Skia,
 * Reanimated, …) so a Node test can import a lesson's ART module and call its
 * pure parts — the part labels and the hit test — without a device. Every
 * property, call and `new` returns the same stand-in; it reads as 0 / '' in
 * arithmetic and text. Used only by test/_mikingTsxLoader.ts.
 */
'use strict';
const target = function stub() {};
const stub = new Proxy(target, {
  get(_t, key) {
    if (key === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
    if (key === Symbol.iterator) return function* () {};
    if (key === 'then') return () => stub; // a promise that never settles: its callbacks never run
    if (key === '__esModule') return true;
    if (key === 'prototype') return target.prototype;
    return stub;
  },
  apply() {
    return stub;
  },
  construct() {
    return stub;
  },
});
module.exports = stub;
