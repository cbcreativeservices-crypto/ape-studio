#!/usr/bin/env node
// The commit gate: run the whole suite and exit 0 ONLY when nothing failed AND
// the whole suite actually ran. Use:  node scripts/suite-gate.mjs && git commit …
//
// Why (2026-10-27 night): a suite run stopped after 42 s at 8,300 of ~15,100
// tests and still printed "# fail 0" — the old gate (grep "# fail 0") would
// have passed it. A run counts only when its test count is at least the FLOOR.
// Raise the floor when the suite grows; never lower it to make a run pass.
import { spawnSync } from 'node:child_process';

const FLOOR = 15000; // 15,100 on 2026-10-27 (ota-after-approval-39-23)

const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-timeout=120000', 'test/**/*.test.ts'], {
  encoding: 'utf8',
  maxBuffer: 1 << 30,
});
const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
const num = (k) => {
  const m = out.match(new RegExp(`^# ${k} (\\d+)$`, 'm'));
  return m ? Number(m[1]) : NaN;
};
const tests = num('tests');
const fail = num('fail');
const cancelled = num('cancelled');
const failing = out.split('\n').filter((l) => /^not ok/.test(l)).slice(0, 20);
console.log(`suite-gate: tests=${tests} fail=${fail} cancelled=${cancelled} floor=${FLOOR}`);
if (failing.length) console.log(failing.join('\n'));
if (fail === 0 && cancelled === 0 && tests >= FLOOR) {
  console.log('suite-gate: GREEN — ok to commit');
} else {
  console.error(
    tests < FLOOR || Number.isNaN(tests)
      ? `suite-gate: ⛔ only ${tests} tests ran (floor ${FLOOR}) — the run did not finish. NOT committing.`
      : 'suite-gate: ⛔ failures — NOT committing.',
  );
  process.exitCode = 1;
}
