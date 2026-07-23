/**
 * Audio Tools — Learn-mode content types (Phase 1, spec of record
 * docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §4/§15, user ruling 2026-07-23:
 * Learn mode is Academy-gated; tools themselves stay free to open).
 *
 * Content files (one per tool + concepts.ts) are data-only modules assembled
 * by ./index.ts — same registry pattern as learningIntros.ts.
 */
import type { ToolKey } from '../../../screens/tools/toolsData';

/** One teaching section: an eyebrow heading + body paragraph(s). */
export type LearnSection = { head: string; body: string };

/** A common student misunderstanding: the claim, and the corrected truth. */
export type Misconception = { claim: string; truth: string };

/** A warning the tool surfaces, with WHY it matters (spec §5/§6 plain-language rule). */
export type ToolWarning = { text: string; why: string };

export type ToolLearnContent = {
  tool: ToolKey;
  /** Ordered teaching sections (what it shows · how to read it · limits · …). */
  sections: LearnSection[];
  /** "Common student misunderstandings" — claim vs corrected truth (spec per-tool lists). */
  misconceptions: Misconception[];
  /** The tool's required warnings, each explained in plain language. */
  warnings: ToolWarning[];
  /** Glossary terms this tool demonstrates (tool-depth rule, Booth 2026-07-18). */
  glossaryTerms: string[];
  /** Keys into CONCEPT_MODULES for the related Smaart-concept modules. */
  relatedConcepts: string[];
};

/** Stable keys for the professional-measurement concept modules (spec §15). */
export type ConceptKey =
  | 'rta-vs-magnitude'
  | 'coherence'
  | 'why-delay-matters'
  | 'impulse-response-basics'
  | 'rt60-t20-t30-edt'
  | 'spectrogram-interpretation'
  | 'spl-logging-vs-instant'
  | 'measurement-integrity';

export type ConceptModule = {
  key: ConceptKey;
  num: number;
  title: string;
  /** One-paragraph framing: why this concept exists and who uses it. */
  intro: string;
  sections: LearnSection[];
  /** The spec's learning points, distilled to memorable one-liners. */
  keyPoints: string[];
  /** Tools whose Learn mode links here. */
  relatedTools: ToolKey[];
};
