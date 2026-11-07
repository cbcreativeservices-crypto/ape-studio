/**
 * The instructor view's SAMPLE switch: a development-only preview of the
 * class list and one student's progress, on made-up students. The live server
 * has no verified instructor (2026-11-07), so the real calls have nothing to
 * show.
 *
 * The DEV · VISUAL INDEX and `#instructorpreview` pick one state below and
 * open "Your Students"; leaving that screen turns the sample off. While it is
 * on, every call in classApi.ts answers from sampleClassData.ts, so nothing is
 * read from or written to the live database. Every person there is made up.
 *
 * Off in any release build: `sampleClassOn()` needs __DEV__, and classApi.ts
 * only requires sampleClassData.ts behind it.
 *
 * LEAF, no value imports: the dev index reads it.
 */

declare const __DEV__: boolean | undefined;

export type SampleClassFace = 'ok' | 'loading' | 'unreadable' | 'empty' | 'not-instructor';
export type SampleStudentFace = 'ok' | 'loading' | 'unreadable' | 'gone';

export type InstructorSampleState = {
  id: string;
  label: string;
  /** What the class list read answers with. */
  face: SampleClassFace;
  /** What a student's progress read answers with. */
  student: SampleStudentFace;
  /** A student to open on top of the list, once. */
  open?: string;
};

/** The made-up students' share ids, by the name the states use. */
export const SAMPLE_SHARE = {
  maya: '00000000-0000-4000-8000-0000000e3001',
  dev: '00000000-0000-4000-8000-0000000e3002',
  rosa: '00000000-0000-4000-8000-0000000e3003',
  jonah: '00000000-0000-4000-8000-0000000e3004',
} as const;

export const INSTRUCTOR_SAMPLE_STATES: InstructorSampleState[] = [
  { id: 'class', label: 'Your students: four sharing', face: 'ok', student: 'ok' },
  { id: 'student', label: 'One student: topics, labs, exams, credentials', face: 'ok', student: 'ok', open: SAMPLE_SHARE.maya },
  { id: 'student-new', label: 'One student: just enrolled, nothing done yet', face: 'ok', student: 'ok', open: SAMPLE_SHARE.jonah },
  { id: 'class-empty', label: 'Your students: nobody sharing yet', face: 'empty', student: 'ok' },
  { id: 'class-loading', label: 'Your students: loading', face: 'loading', student: 'ok' },
  { id: 'class-unreadable', label: 'Your students: could not be read', face: 'unreadable', student: 'ok' },
  { id: 'class-not-instructor', label: 'Your students: not a verified instructor', face: 'not-instructor', student: 'ok' },
  { id: 'student-loading', label: 'One student: loading', face: 'ok', student: 'loading', open: SAMPLE_SHARE.maya },
  { id: 'student-unreadable', label: 'One student: could not be read', face: 'ok', student: 'unreadable', open: SAMPLE_SHARE.maya },
  { id: 'student-gone', label: 'One student: stopped sharing', face: 'ok', student: 'gone', open: SAMPLE_SHARE.dev },
];

let state: InstructorSampleState | null = null;
let openPending = false;

export function setSampleClass(next: InstructorSampleState | null): void {
  state = next;
  openPending = !!next?.open;
}

export function sampleClassOn(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true && state !== null;
}

export function sampleClassState(): InstructorSampleState | null {
  return sampleClassOn() ? state : null;
}

/** The student a state opens on top of the list, once. */
export function takeSampleOpen(): string | null {
  if (!sampleClassOn() || !openPending) return null;
  openPending = false;
  return state?.open ?? null;
}
