/**
 * Audio Career Finder — the 28 activity-preference questions, Version 1
 * (owner brief 2026-09-03). IDs are STABLE: saved answers are keyed on them
 * and a future question bank must keep them or migrate the record.
 *
 * Order is deliberate: the two questions of one dimension never sit
 * together, and the sequence opens on the most recognisable activities.
 * Every question is positively scored toward its dimension — no reverse-
 * scored wording in the mobile experience.
 *
 * Pure data: no React, no React Native — imported by the scoring tests.
 */
import type { DimensionCode } from './dimensions';

export type QuestionId =
  | 'CP01' | 'SD01' | 'HC01' | 'ER01' | 'BO01' | 'AR01' | 'RC01' | 'TE01' | 'LO01' | 'DA01' | 'PC01' | 'BM01' | 'MS01' | 'GS01'
  | 'RC02' | 'CP02' | 'AR02' | 'BO02' | 'MS02' | 'BM02' | 'TE02' | 'GS02' | 'DA02' | 'LO02' | 'ER02' | 'PC02' | 'SD02' | 'HC02';

export type Question = { id: QuestionId; dimension: DimensionCode; text: string };

export const QUESTIONS: readonly Question[] = [
  { id: 'CP01', dimension: 'CP', text: 'How would you feel about creating original music or sound starting with a blank project?' },
  { id: 'SD01', dimension: 'SD', text: 'How would you feel about designing an audio system for a venue, school, business or public space?' },
  { id: 'HC01', dimension: 'HC', text: 'How would you feel about helping someone improve their hearing through testing, technology or rehabilitation?' },
  { id: 'ER01', dimension: 'ER', text: 'How would you feel about carefully removing noise, clicks, mistakes or unwanted sounds from a recording?' },
  { id: 'BO01', dimension: 'BO', text: 'How would you feel about managing an audio team, department, studio or production?' },
  { id: 'AR01', dimension: 'AR', text: 'How would you feel about measuring noise, reverberation or vibration and interpreting the results?' },
  { id: 'RC01', dimension: 'RC', text: 'How would you feel about selecting and positioning microphones to capture the best sound?' },
  { id: 'TE01', dimension: 'TE', text: 'How would you feel about teaching beginners how sound, signal flow and audio equipment work?' },
  { id: 'LO01', dimension: 'LO', text: 'How would you feel about mixing sound during a concert, broadcast or live event?' },
  { id: 'DA01', dimension: 'DA', text: 'How would you feel about programming an audio plugin, application or digital instrument?' },
  { id: 'PC01', dimension: 'PC', text: 'How would you feel about cataloging recordings and creating accurate descriptions and metadata?' },
  { id: 'BM01', dimension: 'BM', text: 'How would you feel about opening malfunctioning audio equipment and finding the component that failed?' },
  { id: 'MS01', dimension: 'MS', text: 'How would you feel about designing sound that strengthens the emotion and meaning of a film scene?' },
  { id: 'GS01', dimension: 'GS', text: 'How would you feel about interpreting technical standards and checking whether audio systems comply with them?' },
  { id: 'RC02', dimension: 'RC', text: 'How would you feel about running a recording session and managing takes, files and performers?' },
  { id: 'CP02', dimension: 'CP', text: 'How would you feel about performing music, voice or sound for an audience or recording?' },
  { id: 'AR02', dimension: 'AR', text: 'How would you feel about designing experiments to understand how sound behaves or how people perceive it?' },
  { id: 'BO02', dimension: 'BO', text: 'How would you feel about recommending and selling audio products based on a customer’s needs?' },
  { id: 'MS02', dimension: 'MS', text: 'How would you feel about creating sounds that change in response to a player’s actions in a game or virtual environment?' },
  { id: 'BM02', dimension: 'BM', text: 'How would you feel about soldering and assembling electronic circuits or audio devices?' },
  { id: 'TE02', dimension: 'TE', text: 'How would you feel about coaching musicians, singers or students as they develop their abilities?' },
  { id: 'GS02', dimension: 'GS', text: 'How would you feel about examining a recording to determine whether it was altered or is authentic?' },
  { id: 'DA02', dimension: 'DA', text: 'How would you feel about creating algorithms that modify, analyze or generate sound in real time?' },
  { id: 'LO02', dimension: 'LO', text: 'How would you feel about diagnosing and fixing an audio failure while an event is still happening?' },
  { id: 'ER02', dimension: 'ER', text: 'How would you feel about balancing many tracks until the sound feels clear, powerful and emotionally right?' },
  { id: 'PC02', dimension: 'PC', text: 'How would you feel about selecting music or sounds for a collection, program, production or audience?' },
  { id: 'SD02', dimension: 'SD', text: 'How would you feel about configuring computers and network equipment to carry audio between many locations?' },
  { id: 'HC02', dimension: 'HC', text: 'How would you feel about helping someone improve their speech, voice or communication?' },
];

/** The six answers. `null` is "I don’t know enough about this" — missing
 *  evidence, never a score, never converted to zero. */
export type Response = 0 | 1 | 2 | 3 | 4 | null;

export const ANSWERS: readonly { value: Response; label: string; short: string }[] = [
  { value: 0, label: 'Strongly dislike', short: 'Strongly dislike' },
  { value: 1, label: 'Dislike', short: 'Dislike' },
  { value: 2, label: 'Neutral', short: 'Neutral' },
  { value: 3, label: 'Like', short: 'Like' },
  { value: 4, label: 'Strongly like', short: 'Strongly like' },
  { value: null, label: 'I don’t know enough about this', short: 'Not sure' },
];

export const QUESTION_COUNT = QUESTIONS.length;
export const questionById = (id: QuestionId): Question | undefined => QUESTIONS.find((q) => q.id === id);
