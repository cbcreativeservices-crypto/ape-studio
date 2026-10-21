/**
 * Digital Lab — Module 8 (Errors & Limits) · CLOCKING card (owner go
 * 2026-10-21). The module blurb once promised "clocking" while only jitter
 * was taught; this card teaches it. Pure strings (no React Native) so the
 * ratchet test reads the exact learner text: test/digitalClockCard_20261021.
 *
 * Standard: docs/wiring/WIRING_RULEBOOK_DRAFT_2026_10_20.md (APPROVED v1)
 *   S5  exactly one clock master; every other device follows it, at the same
 *       sample rate.
 *   C9  word clock 75 Ω coax on BNC · AES3 110 Ω on XLR (a mic cable is not
 *       a correct AES3 cable over distance) · S/PDIF 75 Ω on RCA or optical
 *       TOSLINK · AES3id 75 Ω on BNC.
 *   C12 Dante/AES67 over Ethernet (the network clock is PTP).
 *
 * Learner text: plain words, reading grade ≤ 9, "most/usually" for
 * conventions, no gear maker names. Text only — the module's pictures are
 * Skia scenes behind skiaGate, and a clock diagram would not fit them cleanly.
 */

export const CLOCKING_CARD = {
  title: 'CLOCKING — ONE MASTER, THE REST FOLLOW',
  helpKey: 'clocking',
  intro:
    'A digital device takes each sample on the tick of its clock. When devices pass digital audio to each other, their clocks must tick together. So a digital system has one clock master. Every other device follows that master, at the same sample rate. Most of the time the master is the main audio interface or a stand-alone clock box.',
  ways: [
    {
      label: 'WORD CLOCK',
      text:
        'A cable that carries only the clock. It is 75 Ω coax with BNC plugs. Many devices pass it on to the next one. The last device on the line usually needs a 75 Ω end, called termination. The manual says how.',
    },
    {
      label: 'CLOCK INSIDE THE AUDIO',
      text:
        'A digital audio stream carries its own clock, so the device that gets it can follow it. AES3 uses 110 Ω cable with XLR plugs. A plain mic cable is the wrong cable for AES3 over long runs. S/PDIF uses 75 Ω coax with RCA plugs, or light through an optical (TOSLINK) cable. AES3id uses 75 Ω coax with BNC plugs.',
    },
    {
      label: 'OVER A NETWORK',
      text:
        'Dante and AES67 send audio over Ethernet. The devices keep time with a network clock, called PTP. One device leads, and the rest follow it.',
    },
  ],
  wrongLabel: 'WHEN IT GOES WRONG',
  wrong:
    'With two masters, or a device set to the wrong sample rate, the clocks drift apart. Samples get dropped or repeated. You usually hear clicks, pops or short dropouts, and some devices mute. That is a bigger fault than jitter, the tiny timing wobble shown above.',
} as const;

/** The card's one knowledge check — same shape as foundations/bits CheckSpec. */
export const CLOCKING_CHECK: {
  question: string;
  options: string[];
  correctIdx: number;
  reveal: string;
  wrongHint: string;
} = {
  question: 'Two linked digital devices are both set to be the clock master. What will you most likely hear?',
  options: [
    'A cleaner sound, since each device keeps its own time',
    'Clicks, pops or short dropouts',
    'Nothing different — the cable sorts it out',
  ],
  correctIdx: 1,
  reveal:
    'Two masters means two clocks that slowly drift apart. Samples get dropped or repeated, so you hear clicks, pops or dropouts. Pick one master, and set every other device to follow it at the same sample rate.',
  wrongHint: 'Think of two clocks that never quite agree. What happens to the samples passed between them?',
};

/** Every line of learner text on the card, in reading order (for the grade check). */
export function clockingCardText(): string {
  return [
    CLOCKING_CARD.intro,
    ...CLOCKING_CARD.ways.map((w) => w.text),
    CLOCKING_CARD.wrong,
    CLOCKING_CHECK.question,
    CLOCKING_CHECK.reveal,
  ].join(' ');
}
