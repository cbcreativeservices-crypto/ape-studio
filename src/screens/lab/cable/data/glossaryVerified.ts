/**
 * glossaryVerified — connector/cable glossary term names VERIFIED to exist in
 * the live `glossary` table (read-only SELECT sweep, 2026-08-15; frozen
 * backend untouched). The lab LINKS these — it never authors duplicate
 * definitions (owner mandate; ~200-term connector corpus already lives in
 * gs160/170/180/580).
 *
 * RULES (audit 2026-08-15):
 * - GlossaryTermPopup matches by EXACT case-folded name (`ilike`, no
 *   wildcards) — these strings must stay byte-identical to the DB terms.
 * - Multi-word/punctuated names are poor auto-link keys → surface via the
 *   per-lesson "IN THE GLOSSARY" chip rows, not LINK_TERMS auto-linking.
 * - NOT in the live DB (checked 2026-08-15): 'Neutrik powerCON TRUE1
 *   Connector' (archive-only name — use 'powerCON'), bare 'TOSLINK' (use
 *   'TOSLINK (Optical)').
 */

/** Connector-name terms, grouped by lab family. */
export const GLOSSARY_CONNECTORS = {
  analog: [
    'XLR Connector',
    'XLR Cable',
    'XLRF',
    'XLRM',
    '1/4-inch TS',
    '1/4-inch TRS',
    'TS Connector (Tip-Sleeve)',
    'TRS Connector (Tip-Ring-Sleeve)',
    'TRRS Connector',
    '3.5mm Connector',
    'RCA',
    'RCA jack',
    'Combo Jack',
  ],
  speaker: [
    'Speakon',
    'SpeakON Connector',
    'Speakon Cable',
    'NL4 (Speakon)',
    'Binding Post',
    'Banana Plug',
    'Banana jack',
    'Speaker cable',
    'Speaker Wire Gauge (AWG)',
  ],
  digital: [
    'USB',
    'USB-B',
    'USB-C',
    'USB audio',
    'USB MIDI',
    'RJ-45',
    'Ethernet',
    'Cat5e Cable',
    'Cat6 Cable',
    'etherCON',
    'EtherCON Connector',
    'BNC',
    'BNC Connector (Bayonet Neill-Concelman)',
    'TOSLINK (Optical)',
    'HDMI',
    'HDMI ARC',
    'HDMI eARC',
    'MIDI DIN (5-Pin)',
    '5-Pin DIN (MIDI)',
  ],
  power: [
    'IEC Connector',
    'Edison Plug',
    'NEMA Connector',
    'powerCON',
    'PowerCON Connector',
    'Barrel Connector',
    'PoE',
    'Power over Ethernet',
    'Twist-Lock Connector',
  ],
  recognition: [
    'TT/Bantam (Tiny Telephone)',
    'bantam jack',
    'DB25 (D-sub)',
    'EDAC / Elco Connector',
    'Euroblock',
    'Phoenix connector',
    'Mini-XLR (TA3/TA4)',
    'Multipin Connector',
    'Camlock',
    'Socapex fanout',
    'opticalCON',
    'Patch bay',
  ],
} as const;

/** Concept terms the lessons link (construction, safety, signals, testing). */
export const GLOSSARY_CONCEPTS = {
  signals: [
    'Balanced signaling',
    'Unbalanced signaling',
    'Balanced Connection',
    'Unbalanced Connection',
    'Phantom Power',
    'Phantom Power (+48V)',
    'Word Clock',
    'S/PDIF (Sony/Philips Digital Interface)',
    'ADAT (Lightpipe)',
    'AES3',
    'AES3 / AES-EBU',
    'AES50',
    'Dante',
    'DMX512-A',
    'Impedance',
  ],
  construction: [
    'Instrument Cable',
    'Coaxial Cable',
    '110-Ohm Cable',
    '75-Ohm Cable',
    'shielded twisted pair',
    'unshielded twisted pair',
    'Star-Quad Cable',
    'Braided Shield',
    'Foil Shield',
    'Cable Jacket',
    'Strain Relief',
    'AWG',
    'Gender (Connector)',
    'Locking Connector',
    'Insert Cable',
    'Snake',
  ],
  safety: [
    'Equipment Ground',
    'Safety ground',
    'Never lift safety earth',
    'Ground-Lift Adapter',
    'Lifted Ground Hazard',
    'Ground loop',
    'Ground Fault',
    'Equipment Grounding Conductor',
    'Neutral Conductor',
    'protective earth conductor',
  ],
  testing: [
    'Cable Tester',
    'Cable Inspection',
    'Cable-continuity testing',
    'Reversed-polarity cable',
    'Broken Connector',
    'Cable Ramp',
    'Cable Tie',
    'Cable Strain Relief',
    'Cable Label',
  ],
} as const;
