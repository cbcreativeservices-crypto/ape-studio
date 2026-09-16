# CCODE — PURGE the remaining v1 `public_courses` residue (2026-09-16, owner order)

Owner wants EVERY v1 trace gone — it keeps resurfacing and costing him. Do this in ONE pass.

**Already handled by Computer A (do not redo):** all v1 DB tables + backups DROPPED (verified 0 left); the v1 course-list deleted from Cowork memory; `src/data/publicCourses.ts` + `src/data/public_courses_seed.json` already gone.

**Remaining = client code below.**

## 1. Retired v2 matrix — repoint, then delete
- Files: `src/data/courseTopicMatrix.ts` + `src/data/course_topic_matrix_v2.json` (exports `MATRIX_SUBJECTS`).
- Consumers to repoint to the v3 source (`fetchV3Curriculum` / `flattenV3` in `src/data/v3Curriculum.ts`):
  - `src/screens/awards/AwardsScreen.tsx:35` — `import { MATRIX_SUBJECTS } from '../../data/courseTopicMatrix'`
  - `src/screens/enrollment/HomeSetupSheet.tsx:31` — same import
- After repointing, DELETE both `courseTopicMatrix.ts` and `course_topic_matrix_v2.json`.

## 2. Hardcoded v1 course names — `src/screens/courses/CourseSelectionScreen.tsx`
- `SPECIALIZED_CERTIFICATES` array (~L180–199) and `CARD_IMAGE` map (~L235–300) carry v1 course names, institutional course codes (`MUSI###`), and `pub1..pub9` catalog keys — e.g. `'Sound Reinforcement Systems'`, `'Music Production'` as a *course*.
- **You own** which entries are dead-v1 vs current field/showcase art. Remove the v1 / public_courses ones (course names, `MUSI###`, `pub#` keys); keep the current field/topic showcase entries.

## 3. Dead comments (no logic — optional cleanup)
`src/data/v3Curriculum.ts:3` · `src/screens/dashboard/DashboardScreen.tsx:755` · `src/screens/courses/CourseSelectionScreen.tsx:289 & 1124–1128`.

## Done-when
`tsc` clean · `npm test` · and this returns **nothing**:
`git grep -nE 'publicCourses|public_courses|course_topic_matrix|getPublicCatalog|Sound Reinforcement Systems' src/`
