/**
 * Cable Dressing & Installation Lab — COMMON MISTAKES LIBRARY (spec §46).
 *
 * Reusable defect objects shared by the module find-the-problems exercises and
 * the final inspection. Feedback follows the three-level rhythm: shortFeedback
 * (immediate), the linked rule's whyText (WHY), and the rule's sources
 * (SOURCE). Severity drives the score engine's critical-weighting.
 */
import { type CiSeverity, ruleById } from './rules';

export type CiMistakeCategory =
  | 'safety'
  | 'support'
  | 'routing'
  | 'mechanical'
  | 'signal'
  | 'fire'
  | 'labeling'
  | 'serviceability';

export type CiMistake = {
  id: string;
  name: string;
  category: CiMistakeCategory;
  severity: CiSeverity;
  shortFeedback: string;
  correction: string;
  /** Rule carrying the WHY + sources. */
  ruleId: string;
};

export const CI_MISTAKES: CiMistake[] = [
  { id: 'unsupported-span', name: 'Unsupported cable span', category: 'support', severity: 'major', shortFeedback: 'This run is carrying itself — no support over the span.', correction: 'Add approved supports per the support system\'s criteria.', ruleId: 'ceil-span-sag' },
  { id: 'on-ceiling-tile', name: 'Cable lying on ceiling tile', category: 'support', severity: 'critical', shortFeedback: 'Cable is resting on the tile — tiles are a finish, not a pathway.', correction: 'Lift onto independent approved supports.', ruleId: 'sup-no-ceiling-tile' },
  { id: 'foreign-support', name: 'Supported by unrelated utility', category: 'support', severity: 'critical', shortFeedback: 'That pipe/duct/conduit belongs to another system — it is not a cable support.', correction: 'Move to purpose-built supports anchored to structure.', ruleId: 'sup-purpose-built' },
  { id: 'sharp-bend', name: 'Excessive bend', category: 'mechanical', severity: 'major', shortFeedback: 'This bend is tighter than the cable\'s specified minimum radius.', correction: 'Ease the bend or re-form the route to meet the spec.', ruleId: 'mech-bend-radius' },
  { id: 'crushed-by-tie', name: 'Restraint crushing the bundle', category: 'mechanical', severity: 'major', shortFeedback: 'The restraint has deformed the bundle — it\'s supporting nothing and damaging everything.', correction: 'Re-restrain at supporting (not crushing) tension.', ruleId: 'mech-restraint-tension' },
  { id: 'door-pinch', name: 'Cable pinched in doorway', category: 'safety', severity: 'major', shortFeedback: 'The door is closing on this cable.', correction: 'Reroute via a pathway, or protect a temporary threshold crossing properly.', ruleId: 'wall-doorway' },
  { id: 'connector-strain', name: 'Connector carrying cable weight', category: 'mechanical', severity: 'major', shortFeedback: 'The termination is the support here — weight hangs on the connector.', correction: 'Support the cable ahead of the termination; dress strain-free slack.', ruleId: 'mech-strain-relief' },
  { id: 'bad-floor-crossing', name: 'Poor floor crossing', category: 'safety', severity: 'critical', shortFeedback: 'This run crosses a walking route unprotected.', correction: 'Reroute around traffic, or protect the crossing suitably — egress/accessibility still apply.', ruleId: 'floor-walkways' },
  { id: 'traffic-exposure', name: 'Unprotected traffic exposure', category: 'safety', severity: 'major', shortFeedback: 'Casters/carts roll straight over this cable.', correction: 'Protect the crossing for the actual loads, or reroute.', ruleId: 'floor-ramp-not-magic' },
  { id: 'slack-pile', name: 'Excessive unmanaged slack', category: 'serviceability', severity: 'minor', shortFeedback: 'That\'s not a service loop, it\'s a pile.', correction: 'Store intentional slack, dressed and accessible.', ruleId: 'slack-intentional' },
  { id: 'slack-none', name: 'No service slack', category: 'serviceability', severity: 'minor', shortFeedback: 'Zero slack — this can never be re-terminated in place.', correction: 'Provide accessible slack sized to the service need.', ruleId: 'slack-intentional' },
  { id: 'blocked-access', name: 'Blocked rack/service access', category: 'serviceability', severity: 'major', shortFeedback: 'The dressing blocks the very access a technician needs.', correction: 'Re-route to preserve device removal and connector access.', ruleId: 'rack-service-access' },
  { id: 'blocked-vent', name: 'Blocked ventilation', category: 'mechanical', severity: 'major', shortFeedback: 'This bundle crosses a cooling path.', correction: 'Re-route the bundle clear of intakes/exhausts.', ruleId: 'rack-airflow' },
  { id: 'unlabeled', name: 'Unlabeled cable', category: 'labeling', severity: 'major', shortFeedback: 'No identity — this cable cannot be traced or safely disconnected.', correction: 'Label both ends with the project scheme; match the records.', ruleId: 'label-both-ends' },
  { id: 'label-mismatch', name: 'Inconsistent label', category: 'labeling', severity: 'minor', shortFeedback: 'The two ends disagree — worse than no label.', correction: 'Correct to one identity, both ends + records.', ruleId: 'label-scheme-consistent' },
  { id: 'undocumented', name: 'Documentation mismatch', category: 'labeling', severity: 'major', shortFeedback: 'The schedule doesn\'t match what\'s installed.', correction: 'Update the records to reality (or fix the install to the records).', ruleId: 'label-docs-match' },
  { id: 'bad-penetration', name: 'Unapproved penetration', category: 'fire', severity: 'critical', shortFeedback: 'A rated assembly was penetrated without a listed system.', correction: 'Install the tested/listed firestop system matching this assembly.', ruleId: 'fire-system-not-sealant' },
  { id: 'unverified-wall', name: 'Unverified assembly', category: 'fire', severity: 'critical', shortFeedback: 'Nobody verified what this wall is before routing through it.', correction: 'Stop and verify the assembly before penetrating.', ruleId: 'wall-verify-assembly' },
  { id: 'wrong-space-cable', name: 'Wrong cable for the space', category: 'fire', severity: 'critical', shortFeedback: 'This cable isn\'t rated for the space it passes through.', correction: 'Use cable listed for the space, or reroute.', ruleId: 'plan-environment' },
  { id: 'overfilled-pathway', name: 'Overfilled pathway', category: 'routing', severity: 'major', shortFeedback: 'This pathway is stuffed past its capacity.', correction: 'Relieve into additional pathway capacity per the applicable limits.', ruleId: 'plan-capacity' },
  { id: 'bad-transition', name: 'Poor pathway transition', category: 'routing', severity: 'minor', shortFeedback: 'The route leaves the pathway over a raw edge / hard corner.', correction: 'Use proper fittings and gentle transitions.', ruleId: 'wall-bushings' },
  { id: 'power-signal-mess', name: 'Unplanned power/signal routing', category: 'signal', severity: 'major', shortFeedback: 'Power and low-level signal are interleaved with no plan.', correction: 'Separate the classes; keep parallel exposure short, cross steeply.', ruleId: 'rack-power-signal-plan' },
  { id: 'jacket-damage', name: 'Damaged jacket', category: 'mechanical', severity: 'major', shortFeedback: 'The jacket is cut/abraded — the damage inside is unknown.', correction: 'Replace or professionally remediate; fix the cause (edge, pinch).', ruleId: 'mech-edges' },
  { id: 'over-pull', name: 'Pulled past tension', category: 'mechanical', severity: 'major', shortFeedback: 'This run was forced through resistance.', correction: 'Verify performance; re-pull correctly if degraded.', ruleId: 'mech-pull-tension' },
  { id: 'bad-rack-entry', name: 'Poor cable entry into rack', category: 'routing', severity: 'minor', shortFeedback: 'Cables dive into the rack over an edge with no management.', correction: 'Enter via the intended entry, protected and dressed.', ruleId: 'wall-bushings' },
  { id: 'hidden-loop', name: 'Inaccessible service loop', category: 'serviceability', severity: 'minor', shortFeedback: 'The slack exists — sealed where no one can ever reach it.', correction: 'Store slack at a serviceable location.', ruleId: 'slack-intentional' },
  { id: 'cord-as-permanent', name: 'Flexible cord used as permanent wiring', category: 'safety', severity: 'critical', shortFeedback: 'A temporary cord is doing a permanent cable\'s job.', correction: 'Replace with approved permanent wiring installed by qualified personnel.', ruleId: 'safety-qualified-electrical' },
];

export const mistakeById = (id: string) => CI_MISTAKES.find((m) => m.id === id);
export const mistakeRule = (m: CiMistake) => ruleById(m.ruleId)!;

export const CI_CATEGORY_META: Record<CiMistakeCategory, { label: string; icon: string }> = {
  safety: { label: 'Safety', icon: '⚠' },
  support: { label: 'Support', icon: '🪝' },
  routing: { label: 'Routing', icon: '↦' },
  mechanical: { label: 'Mechanical', icon: '⚙' },
  signal: { label: 'Signal', icon: '〜' },
  fire: { label: 'Fire / Building', icon: '🔥' },
  labeling: { label: 'Labeling', icon: '🏷' },
  serviceability: { label: 'Serviceability', icon: '🔧' },
};
