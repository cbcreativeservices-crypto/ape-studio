/**
 * THE ONE SPORTS SAFETY CARD (Lab 7 part 2; correction R-09 — every lesson
 * B13–B17 repeats the lightning rule and the rain-jacket caution: kept, as ONE
 * card worded once). Built by group 2 (lab7-g5); group 3 imports it. Pure.
 *
 * Safety-critical words are exact and plain (BUILD_PROMPTS_lab7b.md, owner
 * rules): never into play, run-off or medical routes; approval before any
 * mount or body fit; never alter protective equipment; no mic on a horse, its
 * tack or its rider; wet-area electrics by a qualified person; lightning —
 * shelter, wait 30 minutes after the last thunder, dugouts and rain shelters
 * are not safe; start the headphone level low; never provoke feedback.
 * The 30 minutes is the outdoor-safety rule the field lessons already use
 * (shared/field/location.ts LIGHTNING, NWS-LTG — internal record only).
 */
import { LIGHTNING } from '../field/location.ts';

export type SafetyRow = { id: string; title: string; text: string };

export const SPORTS_SAFETY: Readonly<Record<'approval' | 'play' | 'protective' | 'animals' | 'lightning' | 'weather' | 'electrics' | 'hearing' | 'feedback' | 'withdraw', SafetyRow>> = {
  approval: { id: 'approval', title: 'APPROVAL FIRST', text: 'Get approval for every position, mount, cable route and body fit — from the event, the venue and the rights holder. A credential does not approve a mount, and a rule still applies even if someone at the venue likes the spot.' },
  play: { id: 'play', title: 'NEVER INTO PLAY', text: 'No mic, stand, cable or operator in the playing area, the run-off, a medical route, a bench area or an exit. A stoppage does not open the field to crew.' },
  protective: { id: 'protective', title: 'PROTECTIVE EQUIPMENT', text: 'Never alter padding, nets, glass, boards or anyone’s protective equipment to fit a mic.' },
  animals: { id: 'animals', title: 'ANIMALS', text: 'No mic on a horse, its tack or its rider.' },
  lightning: { id: 'lightning', title: 'LIGHTNING', text: `If you hear thunder or see lightning, stop and get into a safe shelter at once — a substantial building or a hard-topped vehicle. Dugouts and open rain shelters are not safe. Leave the equipment. Wait ${LIGHTNING.waitMin} minutes after the last thunder before going back out, and only under the event’s plan.` },
  weather: { id: 'weather', title: 'WIND AND RAIN', text: 'A windscreen is not waterproofing, and a rain cover meant for between takes is not for recording. Check every component’s ratings; keep connectors protected and out of water and traffic.' },
  electrics: { id: 'electrics', title: 'WET-AREA ELECTRICS', text: 'Temporary power and connections near water, ice or rain are set up and approved by a qualified person — never improvised.' },
  hearing: { id: 'hearing', title: 'HEARING', text: 'Start the headphone level low and keep aware of what is around you — a dish or a shotgun can make a distant peak loud in the headphones.' },
  feedback: { id: 'feedback', title: 'FEEDBACK', text: 'Keep effects mics out of the venue PA unless a feed is truly needed; never provoke feedback to test a system.' },
  withdraw: { id: 'withdraw', title: 'WITHDRAW', text: 'Name who can order a mic withdrawn. If it is struck or moved, mute it; inspect it only in authorized safe access.' },
};

/** The rows a field or court lesson shows on its "before any mic" step. */
export const OUTDOOR_ROWS: readonly SafetyRow[] = [SPORTS_SAFETY.approval, SPORTS_SAFETY.play, SPORTS_SAFETY.protective, SPORTS_SAFETY.lightning, SPORTS_SAFETY.weather, SPORTS_SAFETY.electrics, SPORTS_SAFETY.hearing, SPORTS_SAFETY.feedback];
export const INDOOR_ROWS: readonly SafetyRow[] = [SPORTS_SAFETY.approval, SPORTS_SAFETY.play, SPORTS_SAFETY.protective, SPORTS_SAFETY.electrics, SPORTS_SAFETY.hearing, SPORTS_SAFETY.feedback, SPORTS_SAFETY.withdraw];

/** The practice itself (B13 L116, B14 L178–L181, B12 L49): an inactive,
 *  authorized area, consenting adults, nothing hazardous staged. */
export const PRACTICE_RULES = 'Practise only in an inactive, authorized area with consenting adults and a named safety observer who can stop it. No real match, contact, bat swings, hard balls, thrown objects, skating, rackets, collisions or loud whistle tests — gentle claps and ordinary speech are enough.';
