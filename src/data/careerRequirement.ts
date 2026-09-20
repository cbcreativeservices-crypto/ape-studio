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
  | 'DEGREE_REGISTRATION'
  /**
   * Acoustical consulting. `careerIndex.json` flags 33 consulting titles
   * `pe: 1` and the app already gates `Noise Control Engineer` as
   * ENG_DEGREE — but the plain "consultant" spellings carried nothing, and
   * "consultant" reads as a shingle this app's certificate lets you hang out.
   * Wording matches the index's own `professionalEngineer` phrasing.
   */
  | 'PE_LICENSE'
  /**
   * Neither a degree, a licence nor a certificate: the gate is eligibility.
   * CTBTO/IMS and defence acoustics work turns on security clearance,
   * citizenship and medical eligibility, and NO certificate gets a civilian
   * into it — so tagging that family `CERT` was not merely incomplete, it was
   * wrong. `careerIndex.json` already encodes this as `prep: 16` on 26 rows.
   */
  | 'CLEARANCE';

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
  PE_LICENSE: 'Degree + PE licence may be required',
  CLEARANCE: 'Security clearance required',
};
