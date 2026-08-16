/**
 * Lesson body registry for the Cable & Connector Fundamentals Lab.
 * One component per lesson, keyed by CableLessonId — the stepped shell mounts
 * ONLY the active lesson (Foundations/MicSelect per-step mount rule).
 *
 * BUILD STATE (2026-08-15): all 12 lessons interactive and unit-wired.
 * Connector ARTWORK is owner-supplied (ruling 2026-08-15) — lessons carry
 * ART SLOT mount points and render no connector imagery until it lands.
 */
import type { CableLessonId } from '../cableTypes';
import { Lesson01Body } from './lesson01';
import { Lesson02Body } from './lesson02';
import { Lesson03Body } from './lesson03';
import { Lesson04Body } from './lesson04';
import { Lesson05Body } from './lesson05';
import { Lesson06Body } from './lesson06';
import { Lesson07Body } from './lesson07';
import { Lesson08Body } from './lesson08';
import { Lesson09Body } from './lesson09';
import { Lesson10Body } from './lesson10';
import { Lesson11Body } from './lesson11';
import { Lesson12Body } from './lesson12';

export const LESSON_BODIES: Record<CableLessonId, () => React.JSX.Element> = {
  l01_what_travels: () => <Lesson01Body />,
  l02_anatomy: () => <Lesson02Body />,
  l03_analog: () => <Lesson03Body />,
  l04_same_plug: () => <Lesson04Body />,
  l05_loudspeaker: () => <Lesson05Body />,
  l06_digital: () => <Lesson06Body />,
  l07_power: () => <Lesson07Body />,
  l08_selection: () => <Lesson08Body />,
  l09_handling: () => <Lesson09Body />,
  l10_tester: () => <Lesson10Body />,
  l11_challenge: () => <Lesson11Body />,
  l12_final: () => <Lesson12Body />,
};
