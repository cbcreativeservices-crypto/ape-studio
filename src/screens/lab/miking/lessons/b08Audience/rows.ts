/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — the safety rows of "before any
 * mic", worded once and plain (pure data: the tests read them). The approval
 * and weather rows are the one sports safety card's (shared/sports/safety.ts).
 */
import { SPORTS_SAFETY, type SafetyRow } from '../shared/sports/safety.ts';

/** The safety rows of "before any mic" (worded once, plain). */
export const B08_ROWS: readonly SafetyRow[] = [
  SPORTS_SAFETY.approval,
  { id: 'exits', title: 'EXITS AND AISLES', text: 'Stands and cables go outside exits, aisles and walkways; any floor crossing is protected. Confirm the camera and lighting clearance and the audience’s access.' },
  { id: 'rigging', title: 'NOTHING OVER PEOPLE', text: 'Do not fly or hang anything above people without a qualified rigger and approved hardware. A mic over the seats is rigged by them, not improvised.' },
  { id: 'paRoute', title: 'NOT INTO THE PA', text: 'Crowd mics go to the broadcast and the recording, on their own paths — never into the main PA. Never open an audience mic into the PA to make feedback.' },
  SPORTS_SAFETY.weather,
  { id: 'headroom', title: 'HEADROOM AND HEARING', text: 'Leave room for a sudden cheer or a clap right under the mic. Start the headphone level low before the loudest moment of the event.' },
];

