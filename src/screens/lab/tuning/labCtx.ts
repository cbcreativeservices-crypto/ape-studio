/**
 * The context every chapter receives from the shell (spec Stage 5 §3): the
 * shared root, the Basic View / See the Math state, motion preference, the
 * one audio player, and completion. High-frequency drag values stay local
 * to the chapter that owns them.
 */
import type { JSX } from 'react';
import type { TuningPlayer } from '../../../features/tuning/tuningAudio';

export type LabCtx = {
  rootHz: number;
  setRootHz: (hz: number) => void;
  mathView: boolean;
  reduceMotion: boolean;
  player: TuningPlayer;
  /** Called by a chapter when its primary interaction is complete. */
  markDone: () => void;
  isDone: boolean;
};

export type ChapterProps = { ctx: LabCtx };

export type ChapterDef = {
  index: number;
  title: string;
  short: string;
  Component: (props: ChapterProps) => JSX.Element;
};
