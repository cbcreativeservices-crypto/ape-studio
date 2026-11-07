/**
 * MUST-DO E3 (owner "Build an app screen", 2026-11-07): the instructor's
 * class in the app — the student list and one student's progress.
 *
 * Pinned against the LIVE server (definitions read with SELECT only,
 * 2026-11-07, project yjgolswjggmlpeowvtxr):
 *   instructor_my_code() → text, null unless an ACTIVE instructor.
 *   instructor_students() → (share_id, student_name, granted_at,
 *       topics_started, topics_complete, labs_complete, labs_total,
 *       last_activity).
 *   instructor_student_progress(p_share_id) → jsonb { student, topics, labs
 *       { complete, total, list, other_completed }, final_exams, credentials };
 *       raises "this student has not shared their progress with you".
 *   quiz_attempts.score is a COUNT of right answers (0–29 live); two test
 *       accounts hold seeded best_genuine_score = 100.
 *
 * The pure rules run for real; the screens load React Native, so they are
 * pinned by source text in the house style.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  bestScoreText,
  classFromRows,
  CLASS_COPY,
  dayText,
  finalExamScore,
  isShareGone,
  labsByArea,
  lastActiveText,
  pctOf,
  progressFromJson,
  quizScoreText,
  recencyOf,
  SCHOOL_DATA_STATEMENT_DRAFT,
  studentReadouts,
  topicFaceOf,
  topicsByFace,
} from '../src/features/instructor/classRules.ts';
import {
  INSTRUCTOR_SAMPLE_STATES,
  sampleClassOn,
  setSampleClass,
  takeSampleOpen,
} from '../src/features/instructor/sampleClass.ts';

const ROOT = new URL('..', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const progressJson = {
  student: { name: 'Ina S', shared_since: '2026-10-27T10:00:00Z' },
  topics: [
    {
      topic_id: 't1',
      name: 'Zeta Topic',
      field: 'F',
      subject: 'S',
      status: 'complete',
      completed_at: '2026-09-01T10:00:00Z',
      best_score: 29,
      study_pct: 100,
      methods: [{ key: 'flashcards', name: 'Flashcards', completion_pct: 100, last_studied: null }],
      quiz_attempts: [{ number: 1, score: 29, practice: false, submitted_at: '2026-09-01T10:00:00Z' }],
    },
    {
      topic_id: 't2',
      name: 'Alpha Topic',
      status: 'in_progress',
      completed_at: '2026-09-01T10:00:00Z',
      best_score: null,
      study_pct: 0,
      methods: [{ key: 'matching', name: 'Matching', completion_pct: 0 }],
      quiz_attempts: [],
    },
    { topic_id: 't3', name: 'Beta Topic', status: 'in_progress', study_pct: 40, methods: [], quiz_attempts: [] },
    { name: 'no id, dropped' },
  ],
  labs: {
    complete: 1,
    total: 3,
    list: [
      { name: 'Phase Lab', area: 'training', completed_at: '2026-10-01T00:00:00Z' },
      { name: 'Foundations of Sound', area: 'audio_fundamentals', completed_at: null },
      { name: 'Gain Staging', area: 'audio_fundamentals', completed_at: '2026-10-02T00:00:00Z' },
    ],
    other_completed: [
      { name: 'Miking: Banjo', area: 'miking', completed_at: '2026-10-03T00:00:00Z' },
      { name: 'never finished', area: 'miking', completed_at: null },
    ],
  },
  final_exams: [{ number: 1, score: 46, out_of: 50, passed: true, submitted_at: '2026-10-05T00:00:00Z' }],
  credentials: [{ type: 'certificate', name: 'Audio Measurement & Analysis', earned_at: '2026-10-05T00:00:00Z' }],
};

describe('1. reading the server’s answers', () => {
  it('a class list that is not a list is a failed read (null), never "no students"', () => {
    assert.equal(classFromRows(null), null);
    assert.equal(classFromRows({ error: 'x' }), null);
    assert.deepEqual(classFromRows([]), []);
  });

  it('rows map field by field; a row without a share id cannot be opened and is dropped', () => {
    const rows = classFromRows([
      {
        share_id: 's1',
        student_name: 'Ina S',
        granted_at: '2026-10-27T10:00:00Z',
        topics_started: 5,
        topics_complete: 2,
        labs_complete: 7,
        labs_total: 59,
        last_activity: null,
      },
      { student_name: 'no share id' },
    ]);
    assert.deepEqual(rows, [
      {
        shareId: 's1',
        name: 'Ina S',
        sharedSince: '2026-10-27T10:00:00Z',
        topicsStarted: 5,
        topicsComplete: 2,
        labsComplete: 7,
        lastActivity: null,
      },
    ]);
    // labs_total is not even carried: it can never be printed as a denominator.
    assert.equal('labsTotal' in rows![0], false);
  });

  it('progress parses; anything but the server’s object is a failed read', () => {
    assert.equal(progressFromJson(null), null);
    assert.equal(progressFromJson([]), null);
    assert.equal(progressFromJson({ topics: [] }), null, 'no student block');
    const p = progressFromJson(progressJson)!;
    assert.equal(p.name, 'Ina S');
    assert.equal(p.topics.length, 3, 'the row without a topic id is dropped');
    assert.equal(p.labsComplete, 2, 'counted from the list itself');
    assert.deepEqual(
      p.otherLabs.map((l) => l.name),
      ['Miking: Banjo'],
      'only FINISHED other labs are listed',
    );
    assert.equal(p.finalExams[0].outOf, 50);
    assert.equal(p.credentials[0].type, 'certificate');
  });

  it('an in-progress topic never carries a completion date', () => {
    const p = progressFromJson(progressJson)!;
    assert.equal(p.topics.find((t) => t.id === 't2')!.completedAt, null);
  });

  it('the server’s "not shared" refusal is the GONE face; anything else is a failed read', () => {
    assert.equal(isShareGone('this student has not shared their progress with you'), true);
    assert.equal(isShareGone('FetchError: network'), false);
    assert.equal(isShareGone(undefined), false);
  });
});

describe('2. topic status', () => {
  it('complete / studying / enrolled-not-started', () => {
    assert.equal(topicFaceOf('complete', 0, 0), 'complete');
    assert.equal(topicFaceOf('in_progress', 10, 0), 'studying');
    assert.equal(topicFaceOf('in_progress', 0, 1), 'studying', 'a quiz taken counts as started');
    assert.equal(topicFaceOf('in_progress', 0, 0), 'not_started');
  });

  it('groups read studying → completed → not started, by name inside a group', () => {
    const p = progressFromJson(progressJson)!;
    assert.deepEqual(
      topicsByFace(p.topics).map((g) => [g.face, g.topics.map((t) => t.name)]),
      [
        ['studying', ['Beta Topic']],
        ['complete', ['Zeta Topic']],
        ['not_started', ['Alpha Topic']],
      ],
    );
  });

  it('a percent for a meter is whole and 0–100', () => {
    assert.equal(pctOf(105), 100);
    assert.equal(pctOf(-3), 0);
    assert.equal(pctOf('12.6'), 13);
    assert.equal(pctOf(undefined), 0);
  });
});

describe('3. scores are counts of right answers, never a percent or an invented total', () => {
  it('a quiz score prints alone', () => {
    assert.equal(quizScoreText(29), '29 right');
    assert.equal(quizScoreText(0), '0 right');
    assert.equal(quizScoreText(null), null);
  });

  it('an impossible score (above the largest quiz, or negative) is refused, not printed (D53)', () => {
    assert.equal(quizScoreText(100), null);
    assert.equal(quizScoreText(31), null);
    assert.equal(quizScoreText(-1), null);
    assert.equal(bestScoreText({ bestScore: 100, attempts: [], face: 'complete' }), 'No quiz score on record');
  });

  it('the best-score line', () => {
    assert.equal(
      bestScoreText({ bestScore: 24, attempts: [{ number: 1, score: 24, practice: false, submittedAt: null }], face: 'studying' }),
      'Best quiz: 24 right',
    );
    assert.equal(
      bestScoreText({ bestScore: null, attempts: [{ number: 1, score: 18, practice: true, submittedAt: null }], face: 'studying' }),
      'Practice quizzes only',
    );
    assert.equal(bestScoreText({ bestScore: null, attempts: [], face: 'not_started' }), 'No quiz taken yet');
  });

  it('a final exam is a SCORE and keeps its total (D41)', () => {
    assert.equal(finalExamScore({ number: 1, score: 46, outOf: 50, passed: true, submittedAt: null }), '46 / 50');
  });
});

describe('4. never "N of total" (owner 2026-10-29)', () => {
  it('the list readouts are what was done, by count, and nothing is "of" anything', () => {
    const r = studentReadouts({ topicsStarted: 5, topicsComplete: 2, labsComplete: 7 });
    assert.deepEqual(r, [
      { value: 2, label: 'TOPICS DONE' },
      { value: 3, label: 'IN PROGRESS' },
      { value: 7, label: 'LABS DONE' },
    ]);
    assert.deepEqual(
      studentReadouts({ topicsStarted: 1, topicsComplete: 1, labsComplete: 1 }).map((x) => x.label),
      ['TOPIC DONE', 'IN PROGRESS', 'LAB DONE'],
    );
  });

  it('no copy and no screen prints a progress denominator', () => {
    const words = JSON.stringify(CLASS_COPY);
    assert.doesNotMatch(words, /\bof \d|\d+ ?\/ ?\d+|out of/i);
    for (const f of [
      'src/screens/instructor/InstructorStudentsScreen.tsx',
      'src/screens/instructor/InstructorStudentScreen.tsx',
      'src/screens/instructor/instructorBits.tsx',
    ]) {
      const src = code(f);
      assert.doesNotMatch(src, /labs_total|labsTotal|\.total\b|topicsStarted\}/, `${f} reads a total`);
      assert.doesNotMatch(src, /\}\s*of\s*\$?\{/, `${f} prints "x of y"`);
    }
  });
});

describe('5. labs: Audio Fundamentals first, finished first inside an area', () => {
  it('groups by area in the order a teacher reads them', () => {
    const p = progressFromJson(progressJson)!;
    const g = labsByArea(p.labs);
    assert.deepEqual(
      g.map((x) => [x.name, x.done.map((l) => l.name), x.notYet.map((l) => l.name)]),
      [
        ['Audio Fundamentals', ['Gain Staging'], ['Foundations of Sound']],
        ['Training', ['Phase Lab'], []],
      ],
    );
  });
});

describe('6. dates and activity words', () => {
  const now = Date.parse('2026-11-07T18:00:00Z');
  it('recency', () => {
    assert.equal(recencyOf(null, now), 'none');
    assert.equal(recencyOf('garbage', now), 'none');
    assert.equal(recencyOf('2026-11-07T15:00:00Z', now), 'today');
    assert.equal(recencyOf('2026-11-03T15:00:00Z', now), 'week');
    assert.equal(recencyOf('2026-10-20T15:00:00Z', now), 'month');
    assert.equal(recencyOf('2026-08-01T15:00:00Z', now), 'quiet');
  });
  it('words', () => {
    assert.equal(lastActiveText(null, now), 'No study recorded yet');
    assert.equal(lastActiveText('2026-11-07T15:00:00Z', now), 'Studied today');
    assert.match(lastActiveText('2026-10-20T15:00:00Z', now), /^Last studied Oct 2\d, 2026$/);
    assert.equal(dayText(null), '—');
    assert.equal(dayText('nope'), '—');
  });
});

describe('7. the dev sample never reaches a release build', () => {
  it('off unless __DEV__, even when a state was set', () => {
    const g = globalThis as Record<string, unknown>;
    const had = g.__DEV__;
    try {
      g.__DEV__ = false;
      setSampleClass(INSTRUCTOR_SAMPLE_STATES[1]);
      assert.equal(sampleClassOn(), false);
      assert.equal(takeSampleOpen(), null);
      g.__DEV__ = true;
      assert.equal(sampleClassOn(), true);
      assert.equal(typeof takeSampleOpen(), 'string', 'the student opens once');
      assert.equal(takeSampleOpen(), null, '…and only once');
    } finally {
      setSampleClass(null);
      g.__DEV__ = had;
    }
  });

  it('the sample data is only ever required behind the switch', () => {
    const api = code('src/features/instructor/classApi.ts');
    assert.doesNotMatch(api, /^import [^;]*sampleClassData/m);
    assert.match(api, /const s = sampleClassState\(\);\s*if \(s\)/);
  });

  it('there is a state for every face: loading, unreadable, empty, gone', () => {
    const faces = new Set(INSTRUCTOR_SAMPLE_STATES.flatMap((s) => [`class:${s.face}`, `student:${s.student}`]));
    for (const f of ['class:loading', 'class:unreadable', 'class:empty', 'class:ok', 'student:loading', 'student:unreadable', 'student:gone']) {
      assert.ok(faces.has(f), f);
    }
  });

  it('reachable from the Dev Visual Index and #instructorpreview', () => {
    assert.match(code('src/features/dev/DevVisualIndex.tsx'), /INSTRUCTOR_SAMPLE_STATES\.map[\s\S]*?setSampleClass\(state\);\s*n\.navigate\('InstructorStudents'\)/);
    assert.match(code('src/dev/webPreviews.tsx'), /hash === '#instructorpreview'/);
  });

  it('the school data statement is a DRAFT drawn only on the sample', () => {
    const bits = code('src/screens/instructor/instructorBits.tsx');
    assert.match(bits, /export function SchoolStatementDraft\(\) \{\s*if \(!sampleClassOn\(\)\) return null;/);
    assert.match(bits, /DRAFT · NOT APPROVED/);
    assert.match(SCHOOL_DATA_STATEMENT_DRAFT.head, /DRAFT/);
  });
});

describe('8. the way in, and the way out', () => {
  it('YOUR STUDENTS draws only once the server confirmed an active instructor (the code loaded)', () => {
    const row = code('src/screens/profile/InstructorCodeRow.tsx');
    const loaded = row.indexOf("code === 'error' ?");
    const entry = row.indexOf("navigation.navigate('InstructorStudents')");
    assert.ok(loaded > 0 && entry > loaded, 'the entry sits in the code-loaded branch');
    assert.match(row, /if \(code === null\) return null;/);
    // The row itself is drawn only for a verified instructor.
    assert.match(code('src/screens/profile/EmployerSection.tsx'), /verified && verifierKind === 'instructor' \? <InstructorCodeRow \/> : null/);
  });

  it('both screens are lazy, and NOT in the iPhone swipe-back set (that is the owner’s call)', () => {
    const nav = code('src/navigation/RootNavigator.tsx');
    assert.match(nav, /InstructorStudents: lazyScreen\(\(\) => require\('\.\.\/screens\/instructor\/InstructorStudentsScreen'\)/);
    assert.match(nav, /<Stack\.Screen name="InstructorStudents" getComponent=\{Lazy\.InstructorStudents\} \/>/);
    assert.match(nav, /<Stack\.Screen name="InstructorStudent" getComponent=\{Lazy\.InstructorStudent\} \/>/);
  });

  it('leaving uses safeGoBack through the shared HOME-or-‹ key', () => {
    const bits = code('src/screens/instructor/instructorBits.tsx');
    assert.match(bits, /<HomeOrBackKey onPress=\{\(\) => safeGoBack\(navigation\)\}/);
  });

  it('a failed read is never the empty face', () => {
    const list = code('src/screens/instructor/InstructorStudentsScreen.tsx');
    assert.match(list, /read\.state === 'error' \? \(\s*<FailedFace text=\{CLASS_COPY\.classFailed\}/);
    const api = code('src/features/instructor/classApi.ts');
    assert.match(api, /if \(timedOut\) return \{ state: 'error' \};/);
    assert.match(api, /return students \? \{ state: 'ready', code: code\.data, students \} : \{ state: 'error' \};/);
  });

  it('the instructor’s "never shown" agrees with what the student is told', () => {
    assert.match(CLASS_COPY.never, /Answers to any question/);
    assert.match(CLASS_COPY.never, /notes/);
    assert.match(CLASS_COPY.never, /email address/);
    assert.match(CLASS_COPY.never, /private user name/);
    const student = read('src/features/instructor/shareRules.ts');
    assert.match(student, /'Your answers to any question\.'/);
    assert.match(student, /'Your notes, your full email address, and the private user name you set in Profile\.'/);
  });
});
