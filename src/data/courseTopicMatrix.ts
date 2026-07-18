/**
 * Course / Topic Matrix — v2 working SSoT (approved & locked, Prof. Booth
 * 2026-07-18). Subject → topic assignment for the v2-draft curriculum:
 * 26 subjects · 203 topics, gs canonical (100–2040). Source of truth for the
 * CURRICULUM VIEW's organization (the app catalog/dashboard still read the
 * live public catalog). gs is the stable join key to term assignment + the DB
 * curriculum; this file is display structure only.
 *
 * Loaded from the matrix editor's JSON export (course_topic_matrix_v2.json);
 * replace that file with a newer dated export to update.
 */
import matrix from './course_topic_matrix_v2.json';

export type MatrixTopic = { gs: number; order: number; name: string; is_new?: boolean };
export type MatrixSubject = { order: number; name: string; topics: MatrixTopic[] };

const RAW = matrix as {
  schema: string;
  version: string;
  subject_count: number;
  topic_count: number;
  subjects: MatrixSubject[];
};

/** Subjects in matrix order, each with its topics in topic order. */
export const MATRIX_SUBJECTS: MatrixSubject[] = RAW.subjects
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((s) => ({ ...s, topics: s.topics.slice().sort((a, b) => a.order - b.order) }));

export const MATRIX_VERSION = RAW.version;
export const MATRIX_SUBJECT_COUNT = MATRIX_SUBJECTS.length;
export const MATRIX_TOPIC_COUNT = MATRIX_SUBJECTS.reduce((n, s) => n + s.topics.length, 0);
