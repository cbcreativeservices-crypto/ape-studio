/**
 * Help hub content (Pillar C — docs/design/APE_ONBOARDING_HELP_PLAN_2026_09_07.md §4).
 *
 * The searchable FAQ: short, task-focused answers, each optionally carrying a
 * jump route into the relevant screen ("Open the Tools" — help that takes you
 * there, not a documentation dump). Grouped by the plan's six categories.
 *
 * COPY GOVERNANCE: every answer below is a DRAFT in the owner's voice until
 * ratified — the whole hub ships behind HELP_HUB_ENABLED so nothing here
 * reaches a real user before the owner reads it. Honesty rules apply
 * throughout (uncalibrated meters stay uncalibrated, limits are named, and
 * nothing promises a feature that is not in the app today).
 */

/** Flip to true when the owner ratifies the FAQ copy. Gates the Settings
 *  entry row and the Help route itself (the #helppreview harness ignores it). */
export const HELP_HUB_ENABLED = false;

export type HelpCategoryKey =
  | 'start'
  | 'account'
  | 'study'
  | 'tools'
  | 'trouble'
  | 'privacy';

export type HelpJump = {
  /** Button label, e.g. "Open Settings". */
  label: string;
  /** Root-stack route name (cast at the navigate call site). */
  route: string;
  params?: Record<string, unknown>;
};

export type HelpEntry = {
  id: string;
  q: string;
  a: string;
  jump?: HelpJump;
};

export type HelpCategory = {
  key: HelpCategoryKey;
  title: string;
  entries: HelpEntry[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    key: 'start',
    title: 'GETTING STARTED',
    entries: [
      {
        id: 'start-account',
        q: 'Do I need an account?',
        a: 'Not to look around — the Professional Audio Glossary is open without one. A free account saves your progress and enrollments; Academy membership unlocks every topic, lab, and tool feature.',
      },
      {
        id: 'start-guest',
        q: 'What is Guest Mode?',
        a: 'Guest Mode lets you use the app without creating an account. Guest data lives only on this phone and is cleared when you leave Guest Mode — create a free account when you want your progress to survive.',
      },
      {
        id: 'start-first-steps',
        q: 'How do I start studying?',
        a: 'Enroll in topics, then open the Dashboard. Each topic runs the same loop: work the study methods in order — each one unlocks the next — then take the Topic Quiz to bank the topic.',
      },
      {
        id: 'start-replay',
        q: 'Can I see the welcome screens and hints again?',
        a: 'Yes — use “Replay onboarding hints” at the bottom of this screen (also in Settings). Every intro and tip will show again on its next open.',
      },
    ],
  },
  {
    key: 'account',
    title: 'ACCOUNTS & MEMBERSHIP',
    entries: [
      {
        id: 'acct-includes',
        q: 'What does membership include?',
        a: 'One membership, everything included — every topic, lab, tool feature, and certificate path. What your membership includes stays included; there are no add-ons or surprise fees.',
        jump: { label: 'See membership', route: 'Paywall' },
      },
      {
        id: 'acct-code',
        q: 'I have an access or promo code.',
        a: 'Redeem it in Settings under MEMBERSHIP — it works for any signed-in account.',
        jump: { label: 'Open Settings', route: 'Settings' },
      },
      {
        id: 'acct-device',
        q: 'Can I use my account on two devices?',
        a: 'Your account is active on one device at a time. Signing in on a new device moves your session there — no support ticket needed.',
      },
      {
        id: 'acct-signout',
        q: 'How do I log out or switch accounts?',
        a: 'Settings → ACCOUNT → Log out. You can sign into a different account from the screen that follows.',
        jump: { label: 'Open Settings', route: 'Settings' },
      },
    ],
  },
  {
    key: 'study',
    title: 'STUDYING & CERTIFICATES',
    entries: [
      {
        id: 'study-order',
        q: 'Why are some study methods locked?',
        a: 'Methods unlock in order on purpose — each builds on the one before it. Finish the current method and the next opens; the Topic Quiz opens last.',
      },
      {
        id: 'study-quiz',
        q: 'What does passing a Topic Quiz do?',
        a: 'It banks that topic in your Trophy Case and counts it toward every certificate that requires it.',
      },
      {
        id: 'study-labs',
        q: 'Do labs count toward certificates?',
        a: 'Yes — certificates can require hands-on labs alongside their topics. A certificate’s own page lists exactly what it needs.',
      },
      {
        id: 'study-certs',
        q: 'Where are my certificates?',
        a: 'Progress → Trophy Case → CERTIFICATES. An earned certificate can be downloaded and carries a verification QR code, so anyone you show it to can confirm it is real.',
      },
      {
        id: 'study-resume',
        q: 'Will the app remember where I left off?',
        a: 'Yes — studying resumes from where you stopped, per topic and per method, on any signed-in account.',
      },
    ],
  },
  {
    key: 'tools',
    title: 'TOOLS & LABS',
    entries: [
      {
        id: 'tools-calibration',
        q: 'Are the meters calibrated?',
        a: 'No — and we say so on every tool. Phone microphones are uncalibrated, so read every level as RELATIVE, for training. For absolute measurements use a calibrated SPL meter or measurement mic.',
      },
      {
        id: 'tools-mic',
        q: 'Why does the app want the microphone?',
        a: 'The measurement tools listen to the room to show live level and frequency content. Audio is analyzed on your phone as it happens — it is not uploaded.',
      },
      {
        id: 'tools-no-mic',
        q: 'Can I use the app without giving mic access?',
        a: 'Yes. Everything except live measurement works without the mic: all study features, calculators, references, and the tool demos. The live meters simply can’t hear the room.',
      },
      {
        id: 'tools-saved',
        q: 'Where do saved measurements go?',
        a: 'The Measurement Library, stored on this phone — not in the cloud. Saving is an Academy feature.',
        jump: { label: 'Open the Tools', route: 'ToolsHub' },
      },
      {
        id: 'tools-limits',
        q: 'Why did a calculator or the glossary stop and ask me to wait?',
        a: 'The free tier has weekly limits — a set number of calculator results and glossary opens per rolling week. Academy membership removes the caps.',
      },
    ],
  },
  {
    key: 'trouble',
    title: 'TROUBLESHOOTING',
    entries: [
      {
        id: 'tr-lowsignal',
        q: 'A tool says LOW SIGNAL or shows no reading.',
        a: 'The mic isn’t hearing enough. Move closer to the source, raise the level, and check nothing is covering the microphone. Very quiet rooms sit near a phone mic’s noise floor — that limit is real, not a bug.',
      },
      {
        id: 'tr-bluetooth',
        q: 'Sound through Bluetooth behaves oddly.',
        a: 'Bluetooth adds delay and its own processing, and the tools will warn when they detect it. For labs and ear training, wired headphones or the phone speaker give the honest signal.',
      },
      {
        id: 'tr-stuck',
        q: 'A screen is stuck or something looks wrong.',
        a: 'Fully close the app and reopen it — that clears most one-off states. If it keeps happening, report it from this screen; the report carries the details we need to find it.',
      },
      {
        id: 'tr-progress',
        q: 'My progress didn’t save.',
        a: 'Check you are signed in (Guest Mode progress stays on the phone only). Work done offline syncs the next time the app is online.',
      },
    ],
  },
  {
    key: 'privacy',
    title: 'PRIVACY & DATA',
    entries: [
      {
        id: 'pv-leaves',
        q: 'What does the app send off my phone?',
        a: 'Your account’s study progress and enrollments sync so they survive a new phone. Audio from the tools is never uploaded, and saved measurements stay on the device.',
      },
      {
        id: 'pv-calibration',
        q: 'What is “contribute anonymized calibration data”?',
        a: 'Optional, off until you turn it on: after you calibrate, it shares only your offset and phone model — never audio, location, or anything identifying — so owners of the same phone start closer to accurate.',
      },
      {
        id: 'pv-registry',
        q: 'Is my profile public?',
        a: 'No. The Pro Registry is a separate, opt-in public listing for adults who choose it — nothing about you is published unless you explicitly publish it, and you can remove your listing.',
      },
      {
        id: 'pv-delete',
        q: 'How do I delete my account?',
        a: 'Email us from ASK A QUESTION below (or write to the support address) and we will delete your account and its data.',
      },
    ],
  },
];

/** Case-insensitive filter across question + answer text. Returns categories
 *  with only their matching entries; empty categories drop out. */
export function filterHelp(query: string): HelpCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_CATEGORIES;
  return HELP_CATEGORIES.map((c) => ({
    ...c,
    entries: c.entries.filter(
      (e) => e.q.toLowerCase().includes(q) || e.a.toLowerCase().includes(q),
    ),
  })).filter((c) => c.entries.length > 0);
}
