// artshot: a no-op stand-in for a native-only package. Any export is a function
// that returns undefined (components render nothing); hooks return undefined.
const React = require('react');
const fn = new Proxy(function stub() { return undefined; }, {
  get(t, k) {
    if (k === '__esModule') return true;
    if (k === 'default') return fn;
    if (k === Symbol.toPrimitive) return () => '';
    if (k === 'then') return undefined;
    return fn;
  },
  apply() { return undefined; },
  construct() { return {}; },
});
module.exports = fn;
