/**
 * "Show the big picture" — the Profile screen's opt-in for whole-catalogue
 * progress.
 *
 * Owner 2026-09-22: "do not show progress across all certs, all programs, or
 * the entire curriculum, unless the user chooses to show them (they are
 * intimidating and discouraging since they fill so slowly)."
 *
 * A learner who has finished four topics does not need a bar telling them they
 * are at 2% of 166, or a list of 124 certificates each reading "0 of 3
 * complete". Those numbers are accurate and useless: the denominator is the
 * whole academy, so the bar barely moves however much work goes in. What DOES
 * move is the certificate or program they actually enrolled in, and those stay
 * visible unconditionally — this preference never hides the learner's own
 * goals, only the academy-wide totals measured against them.
 *
 * ⛔ DEFAULT OFF, AND IT MUST STAY OFF. The point is that nobody meets these
 * numbers without asking for them. A default of "on" would restore exactly the
 * discouragement this exists to remove.
 *
 * DEVICE-LOCAL on purpose. It is a display preference, not a fact about the
 * account: there is nothing here worth a server round-trip, a migration, or a
 * row that has to be RLS-scoped. A read that fails simply returns the default,
 * which is the safe direction.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ape:profile:showBigPicture';

/** False unless the learner has explicitly turned it on. */
export async function loadShowBigPicture(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    // A storage failure must not reveal the numbers the owner asked us to hide.
    return false;
  }
}

export async function saveShowBigPicture(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // Non-fatal: the toggle still works for this session.
  }
}
