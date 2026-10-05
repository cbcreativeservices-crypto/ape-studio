/**
 * HAND-DRUM FAMILY — lesson ART by id: each lesson's drawings, plus the
 * family's own pages for the ids where a hand drum differs from the kick
 * (no pedal, no front head, no kit plan). The microphone, troubleshooting
 * and practice pages are the shared ones. Appended to data/lessonArt.ts.
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { CongaArt, congaHitTest, congaLabels } from '../../m04aCongas/art';
import { CongaStrike } from '../../m04aCongas/soundArt';
import { BongoArt, bongoHitTest, bongoLabels } from '../../m04bBongos/art';
import { BongoStrike } from '../../m04bBongos/soundArt';
import { TimbaleArt, timbaleHitTest, timbaleLabels } from '../../m04cTimbales/art';
import { TimbaleStrike } from '../../m04cTimbales/soundArt';
import { DjembeArt, djembeHitTest, djembeLabels } from '../../m05Djembe/art';
import { DjembeStrike } from '../../m05Djembe/soundArt';
import { HInstrument } from './pages/HInstrument';
import { HSound } from './pages/HSound';
import { HSetting } from './pages/HSetting';
import { HPlacement } from './pages/HPlacement';
import { HContext } from './pages/HContext';
import { HTwoMic } from './pages/HTwoMic';

/** The family's pages (the rest are the shared pages/). */
export const HAND_PAGES: NonNullable<LessonArt['pages']> = {
  instrument: HInstrument as never,
  sound: HSound as never,
  setting: HSetting as never,
  placement: HPlacement as never,
  context: HContext as never,
  twoMic: HTwoMic as never,
};

export const HAND_DRUM_ART: Record<string, LessonArt> = {
  M04a: { Instrument: CongaArt, labels: congaLabels, hitTest: congaHitTest, StrikeSequence: CongaStrike, pages: HAND_PAGES },
  M04b: { Instrument: BongoArt, labels: bongoLabels, hitTest: bongoHitTest, StrikeSequence: BongoStrike, pages: HAND_PAGES },
  M04c: { Instrument: TimbaleArt, labels: timbaleLabels, hitTest: timbaleHitTest, StrikeSequence: TimbaleStrike, pages: HAND_PAGES },
  M05: { Instrument: DjembeArt, labels: djembeLabels, hitTest: djembeHitTest, StrikeSequence: DjembeStrike, pages: HAND_PAGES },
};
