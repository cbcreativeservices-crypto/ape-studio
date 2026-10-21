// Lets the standalone lab validator scripts (written for tsx, with extension-
// less imports) run under plain node in the test suite: a relative import that
// fails to resolve is retried with .ts / .tsx / /index.ts. Used only by
// test/wiringRules_cableLabs_20261020.test.ts.
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(s, c, next) {
  try { return await next(s, c); } catch (e) {
    if ((s.startsWith('.') || s.startsWith('/')) && !/\\.[cm]?[jt]sx?$/.test(s)) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) { try { return await next(s + ext, c); } catch {} }
    }
    throw e;
  }
}`));
const script = process.argv[2];
await import(new URL(script, 'file://' + process.cwd() + '/'));
