/**
 * Cable Dressing & Installation Lab — SOURCE REGISTRY.
 *
 * Citation/reference METADATA ONLY (owner content rule + copyright rule
 * 2026-08-24): no standards text, tables, or excerpts are stored anywhere in
 * this lab — every instructional sentence in data/rules.ts is an original
 * summary, and these entries exist so each rule can point the learner at the
 * real document it derives from.
 *
 * Jurisdiction honesty: U.S. regulatory material is labeled as such and the
 * lab states up front that local electrical/fire/building/workplace
 * regulations always govern. The registry carries jurisdiction so future
 * revisions can add CA/EU/UK/AU-NZ documents without reshaping the model.
 */

export type CableLabSourceType =
  | 'regulation'
  | 'code'
  | 'consensus_standard'
  | 'manufacturer'
  | 'professional_reference';

export type CableLabSource = {
  id: string;
  organization: string;
  document: string;
  sourceType: CableLabSourceType;
  /** Present only where the document is jurisdiction-bound. */
  jurisdiction?: string;
  notes?: string;
};

export const CI_SOURCES: CableLabSource[] = [
  {
    id: 'nec',
    organization: 'NFPA',
    document: 'NFPA 70 — National Electrical Code (as adopted by the local jurisdiction)',
    sourceType: 'code',
    jurisdiction: 'US (adopted state/locally; amendments vary)',
    notes: 'Governs electrical installations incl. cable types by space, support of wiring, and penetrations where adopted.',
  },
  {
    id: 'osha',
    organization: 'OSHA',
    document: '29 CFR 1910 — electrical & walking-working-surface requirements',
    sourceType: 'regulation',
    jurisdiction: 'US workplaces',
    notes: 'Workplace safety: walking surfaces, exposed cords, electrical work practices.',
  },
  {
    id: 'bldg_fire',
    organization: 'ICC / NFPA (as adopted)',
    document: 'Adopted building & fire codes (e.g. IBC/IFC, NFPA 1/101)',
    sourceType: 'code',
    jurisdiction: 'As adopted locally',
    notes: 'Rated assemblies, egress, and construction requirements that installations must respect.',
  },
  {
    id: 'ada',
    organization: 'U.S. DOJ / Access Board',
    document: 'ADA Standards for Accessible Design (accessible routes)',
    sourceType: 'regulation',
    jurisdiction: 'US',
    notes: 'Accessible-route implications for floor cable crossings and protectors in public paths.',
  },
  {
    id: 'tia568',
    organization: 'TIA',
    document: 'ANSI/TIA-568 series — balanced twisted-pair & optical cabling',
    sourceType: 'consensus_standard',
    notes: 'Component/channel requirements; installation-affecting parameters for structured cabling.',
  },
  {
    id: 'tia569',
    organization: 'TIA',
    document: 'ANSI/TIA-569-E — telecommunications pathways and spaces',
    sourceType: 'consensus_standard',
    notes: 'Pathway and space design guidance for telecom/ICT cabling.',
  },
  {
    id: 'tia606',
    organization: 'TIA',
    document: 'ANSI/TIA-606 — administration & labeling of telecommunications infrastructure',
    sourceType: 'consensus_standard',
    notes: 'Identification and record-keeping model for cabling administration.',
  },
  {
    id: 'tia607',
    organization: 'TIA',
    document: 'ANSI/TIA-607 — bonding and grounding for telecommunications',
    sourceType: 'consensus_standard',
  },
  {
    id: 'bicsi_n1',
    organization: 'BICSI',
    document: 'ANSI/BICSI N1 — installation practices for telecommunications & ICT cabling',
    sourceType: 'consensus_standard',
    notes: 'Consensus installation-practice requirements (supports, separation, workmanship).',
  },
  {
    id: 'bicsi_itsimm',
    organization: 'BICSI',
    document: 'Information Technology Systems Installation Methods Manual (ITSIMM)',
    sourceType: 'professional_reference',
    notes: 'Installer-level methods reference.',
  },
  {
    id: 'bicsi_tdmm',
    organization: 'BICSI',
    document: 'Telecommunications Distribution Methods Manual (TDMM)',
    sourceType: 'professional_reference',
    notes: 'Distribution design reference (pathways, spaces, firestopping awareness).',
  },
  {
    id: 'avixa_f502_01',
    organization: 'AVIXA',
    document: 'F502.01 — Rack Building for Audiovisual Systems',
    sourceType: 'consensus_standard',
    notes: 'AV rack assembly & dressing practices.',
  },
  {
    id: 'avixa_f502_02',
    organization: 'AVIXA',
    document: 'F502.02 — Rack Design for Audiovisual Systems',
    sourceType: 'consensus_standard',
    notes: 'AV rack layout/thermal/power-signal planning.',
  },
  {
    id: 'avixa_f501_01',
    organization: 'AVIXA',
    document: 'F501.01 — Cable Labeling for Audiovisual Systems',
    sourceType: 'consensus_standard',
  },
  {
    id: 'avixa_verify',
    organization: 'AVIXA',
    document: 'Audiovisual performance-verification standards (e.g. A102.01)',
    sourceType: 'consensus_standard',
    notes: 'Verification checklists that a finished installation is inspected against.',
  },
  {
    id: 'aes48',
    organization: 'AES',
    document: 'AES48 + AES grounding/interconnection practice papers',
    sourceType: 'consensus_standard',
    notes: 'Shield/ground interconnection practice for audio systems (pin 1, shields, EMC).',
  },
  {
    id: 'iso14763',
    organization: 'ISO/IEC',
    document: 'ISO/IEC 14763-2 — planning & installation of customer-premises cabling',
    sourceType: 'consensus_standard',
    jurisdiction: 'International',
  },
  {
    id: 'en50174',
    organization: 'CENELEC',
    document: 'EN 50174 series — IT cabling installation planning & practices',
    sourceType: 'consensus_standard',
    jurisdiction: 'EU/UK practice base',
  },
  {
    id: 'nema_tray',
    organization: 'NEMA / CSA',
    document: 'Cable tray standards (e.g. NEMA VE 2 installation guidance)',
    sourceType: 'consensus_standard',
    notes: 'Tray handling/installation guidance; fill & support per applicable code/manufacturer.',
  },
  {
    id: 'mfr_cable',
    organization: 'Cable manufacturer',
    document: 'Installed-cable datasheet / installation specification (bend radius, pull tension, temperature, use)',
    sourceType: 'manufacturer',
    notes: 'The governing numbers for a SPECIFIC cable always come from its manufacturer documentation.',
  },
  {
    id: 'mfr_support',
    organization: 'Support/pathway manufacturer',
    document: 'Support, J-hook, tray, raceway and protector installation instructions (spacing, capacity, loading)',
    sourceType: 'manufacturer',
  },
  {
    id: 'firestop_listed',
    organization: 'Firestop system manufacturer / listing agency',
    document: 'Tested & listed firestop SYSTEM documentation for the specific assembly',
    sourceType: 'manufacturer',
    notes: 'Firestopping is a listed system matched to the construction — never a generic sealant choice.',
  },
  {
    id: 'ufgs',
    organization: 'U.S. Federal (UFGS)',
    document: 'Unified Facilities Guide Specifications — division 27 communications sections',
    sourceType: 'professional_reference',
    jurisdiction: 'US federal projects',
  },
];

export const sourceById = (id: string): CableLabSource | undefined => CI_SOURCES.find((s) => s.id === id);
