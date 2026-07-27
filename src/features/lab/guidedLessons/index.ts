/**
 * Guided Lessons — the typed content layer + reusable renderer behind every
 * lab's Guided-Lesson stack (v4 MASTER §5). Author content in content.ts;
 * render it anywhere with GuidedLessonBody (inline) or GuidedLessonSheet (modal).
 */
export type { LabId, LabTier, ControlLesson, LabLesson, LessonContent } from './types';
export { LAB_LESSONS, LAB_LESSON_LIST, getLabLesson, getControlLesson } from './content';
export { GuidedLessonBody, GuidedLessonSheet } from './GuidedLessonSheet';
export { TOOL_LESSONS, getToolLesson, useToolHelp, HelpHead, DisplayGuideButton, readoutKey, type ToolId } from './toolHelp';
export { SOURCE_LESSON } from './sourceHelp';
