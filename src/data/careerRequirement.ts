/**
 * careerRequirement — the shared vocabulary for disclosing when a career listed
 * in the app needs education BEYOND finishing a PATA credential (a college
 * degree, a state license, or a recognized external certification).
 *
 * HARD RULE (owner, 2026-09-15): "we must be clear when other education —
 * degrees, certifications, etc. — is required for careers. always. every time."
 * So a Career is a name plus an OPTIONAL `requires` code; the detail views show
 * the full career ladder and label every gated role with what it needs, rather
 * than hiding it. Codes were assigned by a domain classification of every
 * unique title in the credential + topic copy (see credentialCopy / topicCopy).
 */
export type RequireKind =
  | 'DEGREE'
  | 'ENG_DEGREE'
  | 'LICENSE'
  | 'DOCTORATE_LICENSE'
  | 'CERT'
  | 'NDT_CERT'
  | 'DEGREE_REGISTRATION';

/** A career/role. `requires` is set only when the role needs further education. */
export type Career = { name: string; requires?: RequireKind };

/** Short, plain label shown beneath a gated career's name. */
export const REQUIRES_LABEL: Record<RequireKind, string> = {
  DEGREE: 'College degree required',
  ENG_DEGREE: 'Engineering degree required',
  LICENSE: 'State license required',
  DOCTORATE_LICENSE: 'Doctorate + license required',
  CERT: 'Certification required',
  NDT_CERT: 'NDT certification required',
  DEGREE_REGISTRATION: 'Degree + registration required',
};
