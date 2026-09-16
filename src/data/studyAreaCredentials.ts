/**
 * Study Area → credentials (owner feature 2026-09-16).
 *
 * Each Home-carousel SHOWCASE card ("Study Area") lists the certificates and
 * programs a learner could pursue in that area. EXPLORE on the card opens a
 * picker over this list (or goes straight to the one credential when the
 * list has a single entry). Slugs are the live v3 `certificates.slug` /
 * `programs.slug` values; a slug that is not active in the catalog is simply
 * skipped at runtime, so a stale entry can never break the card.
 *
 * CURATED (ccode draft, owner-reviewed 2026-09-16) — plain data, edit a line
 * to change an area's menu. Order = menu order: programs first (the broad
 * path), then the certificates from most central to most adjacent. Keys must
 * match SHOWCASE_CARDS names in CourseSelectionScreen exactly.
 *
 * Owner ruling: keep each area's menu TIGHT. The mixing / restoration /
 * acoustics-science credentials got their OWN cards (the last three entries)
 * rather than bloating the original areas. Credentials with no natural card
 * are simply not surfaced here (they remain on the Certificates / Programs
 * screens).
 */
export const STUDY_AREA_CREDENTIALS: Record<string, readonly string[]> = {
  'Live Sound Engineering': [
    'prog-live-sound-engineering-v3',
    'cert-live-sound-system-engineer-v3',
    'cert-foh-engineering-v3',
    'cert-monitor-engineering-iem-and-wedges-v3',
    'cert-live-mixing-specialist-v3',
    'cert-pa-loudspeaker-systems-v3',
    'cert-system-tuning-and-alignment-v3',
    'cert-live-wireless-mic-systems-v3',
    'cert-stage-patch-and-signal-distribution-v3',
  ],
  'Music Production': [
    'prog-music-production-v3',
    'prog-electronic-music-production-and-synthesis-v3',
    'cert-daw-power-user-v3',
    'cert-logic-pro-producer-v3',
    'cert-ableton-live-specialist-v3',
    'cert-beat-making-and-sampling-v3',
    'cert-sound-design-with-synthesis-v3',
    'cert-plugin-and-processing-power-user-v3',
    'cert-home-studio-starter-v3',
  ],
  'Recording Arts': [
    'prog-studio-recording-engineering-v3',
    'cert-studio-recording-engineer-v3',
    'cert-studio-miking-specialist-v3',
    'cert-band-tracking-specialist-v3',
    'cert-vocal-recording-and-production-v3',
    'cert-drum-recording-and-mixing-v3',
    'cert-guitar-tone-and-recording-v3',
    'cert-analog-console-recording-v3',
    'cert-session-editing-and-comping-v3',
    'cert-field-and-location-recording-v3',
    'cert-orchestral-recording-and-mixing-v3',
  ],
  'Worship Audio': [
    'prog-worship-audio-production-v3',
    'cert-worship-audio-v3',
  ],
  'DJ Production': [
    'prog-dj-and-club-audio-v3',
    'cert-dj-and-club-sound-v3',
    'cert-electronic-live-performance-v3',
  ],
  'Theatrical Sound Design': [
    'prog-theater-venue-and-entertainment-audio-v3',
    'cert-theatrical-sound-v3',
    'cert-show-control-and-cueing-v3',
    'cert-stagecraft-and-rigging-v3',
    'cert-live-wireless-mic-systems-v3',
  ],
  'Podcasting & Broadcast': [
    'prog-broadcast-podcast-and-streaming-audio-v3',
    'cert-podcast-production-v3',
    'cert-broadcast-engineer-v3',
    'cert-loudness-and-delivery-specialist-v3',
  ],
  'Sound for Film & Games': [
    'prog-post-production-audio-v3',
    'prog-game-and-interactive-audio-v3',
    'prog-film-scoring-and-music-production-v3',
    'cert-sound-design-and-sfx-v3',
    'cert-re-recording-mixer-v3',
    'cert-dialogue-editor-v3',
    'cert-adr-and-voice-recording-v3',
    'cert-foley-performance-and-recording-v3',
    'cert-localization-and-dubbing-v3',
    'cert-game-audio-v3',
    'cert-interactive-and-game-music-v3',
    'cert-film-scoring-v3',
    'cert-film-music-technology-v3',
  ],
  'Sound Reinforcement': [
    'prog-concert-and-festival-production-v3',
    'cert-pa-loudspeaker-systems-v3',
    'cert-live-sound-system-engineer-v3',
    'cert-system-tuning-and-alignment-v3',
    'cert-loudspeaker-systems-and-measurement-v3',
    'cert-amplifier-technology-v3',
  ],
  'System Design & Maintenance': [
    'prog-audio-acoustics-and-system-optimization-v3',
    'prog-audio-systems-engineering-v3',
    'cert-distributed-and-paging-systems-v3',
    'cert-audio-measurement-and-analysis-v3',
    'cert-test-and-calibration-technician-v3',
    'cert-audio-troubleshooting-specialist-v3',
    'cert-studio-wiring-and-infrastructure-v3',
    'cert-signal-flow-and-connections-v3',
  ],
  'Corporate & Event AV': [
    'prog-commercial-audio-and-av-systems-v3',
    'prog-audio-networking-and-infrastructure-v3',
    'cert-corporate-and-event-production-v3',
    'cert-av-over-ip-systems-v3',
    'cert-audio-networking-dante-and-av-v3',
    'cert-show-control-and-cueing-v3',
  ],
  'Architectural Acoustics': [
    'prog-acoustics-and-psychoacoustics-research-v3',
    'prog-environmental-noise-and-regulatory-acoustics-v3',
    'cert-room-acoustics-and-treatment-v3',
    'cert-how-sound-behaves-in-a-room-v3',
    'cert-noise-control-engineering-v3',
    'cert-noise-law-and-compliance-v3',
    'cert-archaeoacoustics-and-heritage-v3',
  ],
  'Commercial 70V Systems': [
    'prog-commercial-audio-and-av-systems-v3',
    'cert-distributed-and-paging-systems-v3',
    'cert-assisted-listening-and-accessibility-v3',
  ],
  'Assisted Listening': [
    'cert-assisted-listening-and-accessibility-v3',
  ],
  'Vehicle Audio': [
    'prog-vehicle-and-consumer-audio-systems-v3',
    'cert-car-audio-installation-v3',
  ],
  'HiFi & Consumer Audio': [
    'prog-vehicle-and-consumer-audio-systems-v3',
    'cert-consumer-and-home-audio-v3',
    'cert-home-theater-design-v3',
    'cert-tube-audio-equipment-specialist-v3',
  ],
  'Audio Electronics': [
    'prog-audio-electronics-service-and-repair-v3',
    'prog-transducer-and-audio-hardware-engineering-v3',
    'prog-analog-and-vintage-audio-engineering-v3',
    'cert-analog-electronics-for-audio-v3',
    'cert-electronics-repair-technician-v3',
    'cert-amplifier-technology-v3',
    'cert-preamp-and-converter-design-v3',
    'cert-effects-and-pedal-design-v3',
    'cert-tube-amp-building-v3',
    'cert-microphone-building-v3',
    'cert-loudspeaker-design-engineer-v3',
    'cert-pcb-and-assembly-technician-v3',
  ],
  'Audio Technician': [
    'prog-audio-electronics-service-and-repair-v3',
    'cert-audio-troubleshooting-specialist-v3',
    'cert-test-and-calibration-technician-v3',
    'cert-electronics-repair-technician-v3',
    'cert-signal-flow-and-connections-v3',
    'cert-gain-staging-and-signal-flow-v3',
  ],
  'Road Crew & Touring': [
    'prog-concert-and-festival-production-v3',
    'cert-touring-and-road-crew-v3',
    'cert-stagecraft-and-rigging-v3',
    'cert-stage-patch-and-signal-distribution-v3',
  ],
  'Career & Business': [
    'cert-audio-career-and-business-v3',
    'cert-music-business-and-industry-v3',
  ],
  // ── New cards (owner 2026-09-16) ─────────────────────────────────────────
  'Mixing & Mastering': [
    'prog-mixing-and-mastering-engineering-v3',
    'cert-mixing-engineer-v3',
    'cert-mastering-engineer-v3',
    'cert-mix-bus-and-automation-v3',
    'cert-eq-and-tonal-shaping-v3',
    'cert-compression-and-dynamics-v3',
    'cert-time-based-and-creative-fx-v3',
    'cert-vocal-mixing-specialist-v3',
    'cert-drum-mixing-v3',
    'cert-streaming-mastering-and-loudness-v3',
    'cert-vinyl-and-disc-mastering-v3',
  ],
  'Audio Restoration & Archiving': [
    'prog-audio-preservation-restoration-and-archival-science-v3',
    'cert-audio-archival-and-restoration-v3',
    'cert-source-separation-and-restoration-v3',
    'cert-tape-restoration-v3',
    'cert-analog-tape-engineering-v3',
    'cert-digital-archiving-v3',
    'cert-media-migration-and-metadata-v3',
  ],
  'Acoustics Science': [
    'prog-applied-and-physical-acoustics-science-v3',
    'prog-sound-visualization-and-acoustic-imaging-v3',
    'prog-bioacoustics-and-ecoacoustics-v3',
    'prog-earth-space-and-seismoacoustics-v3',
    'prog-ultrasonics-and-industrial-acoustics-v3',
    'cert-audio-foundations-v3',
    'cert-physical-and-molecular-acoustics-v3',
    'cert-underwater-and-sonar-acoustics-v3',
    'cert-seismoacoustics-and-infrasound-v3',
    'cert-space-and-earth-acoustics-v3',
    'cert-astroacoustics-and-sonification-v3',
    'cert-bioacoustics-and-ecoacoustics-v3',
    'cert-ultrasonics-and-ndt-v3',
    'cert-nearfield-acoustic-holography-v3',
    'cert-sound-visualization-and-imaging-v3',
    'cert-spectrogram-and-stft-analysis-v3',
    'cert-data-sonification-v3',
  ],
};
