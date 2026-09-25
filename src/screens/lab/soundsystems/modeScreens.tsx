/**
 * Sound Systems Lab — the five mode screens. Each is a PagedLab with its own
 * labId (own page persistence), so a learner's place in BUILD survives a
 * detour into TROUBLESHOOT. The understanding check rides on LEARN.
 *
 * Every mode dev-checks its page count against units.ts, which the hub reads
 * without importing these page arrays (they pull in SVG and React).
 */
import { PagedLab } from '../kit/PagedLab';
import { SS_BUILD_ID, SS_LEARN_ID, SS_OPERATE_ID, SS_PAGE_COUNTS, SS_ROUTE_ID, SS_TROUBLESHOOT_ID } from './units';
import { SS_LEARN_PAGES_A } from './pagesLearnA';
import { SS_LEARN_PAGES_B } from './pagesLearnB';
import { SS_LEARN_PAGES_C } from './pagesLearnC';
import { SS_BUILD_PAGES } from './pagesBuild';
import { SS_ROUTE_PAGES } from './pagesRoute';
import { SS_OPERATE_PAGES } from './pagesOperate';
import { SS_TROUBLESHOOT_PAGES } from './pagesTroubleshoot';

const LEARN_PAGES = [...SS_LEARN_PAGES_A, ...SS_LEARN_PAGES_B, ...SS_LEARN_PAGES_C];

if (__DEV__) {
  const check = (name: keyof typeof SS_PAGE_COUNTS, n: number) => {
    if (n !== SS_PAGE_COUNTS[name]) {
      throw new Error(`Sound Systems ${name} page count drifted: pages has ${n}, units.ts says ${SS_PAGE_COUNTS[name]}. Update SS_PAGE_COUNTS in src/screens/lab/soundsystems/units.ts.`);
    }
  };
  check('learn', LEARN_PAGES.length);
  check('build', SS_BUILD_PAGES.length);
  check('route', SS_ROUTE_PAGES.length);
  check('operate', SS_OPERATE_PAGES.length);
  check('troubleshoot', SS_TROUBLESHOOT_PAGES.length);
}

export function SoundSystemsLearnScreen() {
  return (
    <PagedLab
      labId={SS_LEARN_ID}
      title="Sound Systems · Learn"
      subtitle="Fourteen chapters of live sound reinforcement: the complete system, its kinds, its outputs, its routing, subwoofers, monitors, wiring, amplification, deployment, gain, coverage, tuning, feedback and fault-finding. Every page is free to move through; the check at the end earns the credit."
      pages={LEARN_PAGES}
    />
  );
}

export function SoundSystemsBuildScreen() {
  return (
    <PagedLab
      labId={SS_BUILD_ID}
      title="Sound Systems · Build"
      subtitle="An empty venue and a parts bin. Place the gear, connect it — every link checked for level and safety — then ten capstone systems, graded live as you work."
      pages={SS_BUILD_PAGES}
    />
  );
}

export function SoundSystemsRouteScreen() {
  return (
    <PagedLab
      labId={SS_ROUTE_ID}
      title="Sound Systems · Route"
      subtitle="The console under your fingers: pre and post-fader sends, subgroups, DCAs, mute groups, matrices and the output patch — with every bus showing who hears what."
      pages={SS_ROUTE_PAGES}
    />
  );
}

export function SoundSystemsOperateScreen() {
  return (
    <PagedLab
      labId={SS_OPERATE_ID}
      title="Sound Systems · Operate"
      subtitle="Power-up in order, line check, gain structure from microphone to loudspeaker, soundcheck and ring-out, shutdown and documentation."
      pages={SS_OPERATE_PAGES}
    />
  );
}

export function SoundSystemsTroubleshootScreen() {
  return (
    <PagedLab
      labId={SS_TROUBLESHOOT_ID}
      title="Sound Systems · Troubleshoot"
      subtitle="Twenty-two faults on the bench. Probe from the source forward, read every station, name the fault — graded on the answer and on the walk."
      pages={SS_TROUBLESHOOT_PAGES}
    />
  );
}
