/**
 * C08 ELECTRIC BASS — the technical truth (charter §2 layer 1). The starting
 * points live in shared/speakers/ampZones.ts (BASS_ZONES); this file names the
 * lesson's choices. Sources: docs/labs/miking/electric_bass_amp/SOURCES.md
 * (S-BASSREC, S-PGA27, S-RHYTHM, AMP-VEN, RAD-J48, PHYS-ET, OSHA).
 * Corrections applied: CORRECTIONS_LOG.md BA-01 … BA-08.
 */
/** A low-frequency-capable dynamic first; the condenser for a farther mic. */
export const C08_MICS = ['kickDynCard', 'instDynCard', 'sdcCard'] as const;
export const C08_WORKED = 'bass.boundary';
export const C08_PLACE_START = 'bass.breathing';
/** The DI's low-cut, as its maker documents it: about −6 dB at 80 Hz. */
export const DI_LOWCUT = { hz: 80, db: -6, src: 'RAD-J48' } as const;
