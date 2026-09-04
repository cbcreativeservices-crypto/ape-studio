/**
 * Audio Career Finder — the 42 career families (owner brief 2026-09-03).
 *
 * Each family names its three dominant activity dimensions in weight order
 * (primary 0.50, secondary 0.30, tertiary 0.20) and three representative
 * careers. `id` is the stable slug shared with src/data/careerFamilies.json
 * and careerIndex.json (the build script matches on `name`, so a rename here
 * must be made there too — it fails loudly, not silently).
 *
 * Dimensions and examples were corrected by the industry-accuracy review of
 * 2026-09-04 (Theatre MS-first, Stagecraft BM-first, Instrument Building
 * BM/CP/PC, Acoustic Construction BM/AR/SD; invented or non-credential
 * example titles replaced with index titles). Everything else is the brief.
 *
 * `description` is NEW COPY (2026-09-04): one neutral sentence per family
 * describing the WORK, never the worth of the person doing it — no prestige,
 * no promises. Ratification sheet: docs/APE_CAREER_FINDER_COPY_2026_09_04.md.
 *
 * Pure data: no React, no React Native, no JSON import — imported by the tests.
 */
import type { DimensionCode } from './dimensions';

export type CareerFamily = {
  id: string;
  name: string;
  /** [primary, secondary, tertiary] */
  dimensions: readonly [DimensionCode, DimensionCode, DimensionCode];
  examples: readonly [string, string, string];
  description: string;
};

export const FAMILIES: readonly CareerFamily[] = [
  { id: 'recording-studios-and-music-production', name: 'Recording Studios & Music Production', dimensions: ['RC', 'ER', 'CP'], examples: ['Recording Engineer', 'Studio Engineer', 'Music Producer'],
    description: 'Capturing performances in studios and on location, then shaping the recordings into finished music.' },
  { id: 'mixing-and-mastering', name: 'Mixing & Mastering', dimensions: ['ER', 'AR', 'CP'], examples: ['Mix Engineer', 'Mastering Engineer', 'Assistant Mix Engineer'],
    description: 'Balancing recorded tracks into a mix, then preparing finished mixes so they sound consistent on different playback systems.' },
  { id: 'music-creation-daws-synthesis-and-sonic-art', name: 'Music Creation, DAWs, Synthesis & Sonic Art', dimensions: ['CP', 'DA', 'ER'], examples: ['Composer', 'Electronic Music Producer', 'Sound Artist'],
    description: 'Composing and producing original music and sound with software, synthesizers, samplers and creative tools.' },
  { id: 'live-sound-touring-and-festivals', name: 'Live Sound, Touring & Festivals', dimensions: ['LO', 'SD', 'BM'], examples: ['Front-of-House Engineer', 'Monitor Engineer', 'Live Systems Engineer'],
    description: 'Deploying, operating and troubleshooting sound systems for concerts, tours, festivals and events as they happen.' },
  { id: 'theatre-worship-venues-and-show-control', name: 'Theatre, Worship, Venues & Show Control', dimensions: ['MS', 'LO', 'SD'], examples: ['Theatrical Sound Designer', 'Theatre A1', 'Worship Audio Director'],
    description: 'Designing and running sound for staged productions, services and permanent venues, cue by cue.' },
  { id: 'film-television-and-post-production-audio', name: 'Film, Television & Post-Production Audio', dimensions: ['MS', 'ER', 'RC'], examples: ['Supervising Sound Editor', 'Dialogue Editor', 'Foley Recordist'],
    description: 'Recording, editing, designing and mixing every sound that accompanies moving pictures.' },
  { id: 'game-interactive-xr-and-immersive-audio', name: 'Game, Interactive, XR & Immersive Audio', dimensions: ['MS', 'DA', 'CP'], examples: ['Game Audio Designer', 'Technical Sound Designer', 'XR Audio Engineer'],
    description: 'Creating sound that responds to a player or a space, in games, virtual worlds and immersive formats.' },
  { id: 'broadcast-radio-sports-and-streaming', name: 'Broadcast, Radio, Sports & Streaming', dimensions: ['LO', 'MS', 'SD'], examples: ['Broadcast Audio Engineer', 'Broadcast A1', 'Radio Broadcast Engineer'],
    description: 'Mixing and delivering live and produced audio for radio, television, sports and streaming audiences.' },
  { id: 'podcast-audiobook-voice-and-spoken-word-production', name: 'Podcast, Audiobook, Voice & Spoken-Word Production', dimensions: ['RC', 'ER', 'MS'], examples: ['Podcast Producer', 'Audiobook Engineer', 'Voiceover Recording Engineer'],
    description: 'Recording, editing and producing the spoken voice for podcasts, audiobooks, narration and voiceover.' },
  { id: 'installed-av-integration-and-institutional-systems', name: 'Installed AV, Integration & Institutional Systems', dimensions: ['SD', 'BM', 'GS'], examples: ['AV Systems Designer', 'AV Installation Technician', 'Commissioning Technician'],
    description: 'Designing, installing and commissioning permanent audio and AV systems in buildings people use every day.' },
  { id: 'architectural-acoustics-noise-and-vibration', name: 'Architectural Acoustics, Noise & Vibration', dimensions: ['AR', 'SD', 'BM'], examples: ['Acoustical Consultant', 'Noise-Control Engineer', 'Vibration Consultant'],
    description: 'Measuring, predicting and controlling how sound and vibration behave in rooms, buildings and the environment.' },
  { id: 'scientific-environmental-and-applied-acoustics', name: 'Scientific, Environmental & Applied Acoustics', dimensions: ['AR', 'DA', 'RC'], examples: ['Acoustics Research Scientist', 'Bioacoustician', 'Acoustic Oceanographer'],
    description: 'Studying sound as a physical phenomenon, from animal calls and ocean noise to seismic and atmospheric acoustics.' },
  { id: 'hearing-audiology-psychoacoustics-and-accessibility', name: 'Hearing, Audiology, Psychoacoustics & Accessibility', dimensions: ['HC', 'AR', 'TE'], examples: ['Audiologist', 'Hearing Instrument Specialist', 'Psychoacoustician'],
    description: 'Assessing and managing hearing and balance, protecting hearing, fitting hearing technology, and studying how people perceive sound.' },
  { id: 'medical-ultrasound-and-therapeutic-acoustics', name: 'Medical Ultrasound & Therapeutic Acoustics', dimensions: ['HC', 'AR', 'SD'], examples: ['Diagnostic Medical Sonographer', 'Ultrasound Transducer Engineer', 'Ultrasound Imaging Scientist'],
    description: 'Imaging the body with ultrasound, and engineering and researching the ultrasound systems used for diagnosis and therapy.' },
  { id: 'audio-hardware-transducers-and-electronics-engineering', name: 'Audio Hardware, Transducers & Electronics Engineering', dimensions: ['BM', 'SD', 'AR'], examples: ['Audio Electronics Engineer', 'Loudspeaker Engineer', 'Microphone Design Engineer'],
    description: 'Engineering the circuits, microphones, loudspeakers and devices that turn sound into signals and back again.' },
  { id: 'audio-software-dsp-ai-and-machine-learning', name: 'Audio Software, DSP, AI & Machine Learning', dimensions: ['DA', 'AR', 'SD'], examples: ['Audio DSP Engineer', 'Audio Machine-Learning Engineer', 'Audio Plugin Developer'],
    description: 'Writing the software, signal processing and learning systems that analyze, transform and generate audio.' },
  { id: 'manufacturing-quality-calibration-and-repair', name: 'Manufacturing, Quality, Calibration & Repair', dimensions: ['BM', 'AR', 'GS'], examples: ['Audio Repair Technician', 'Calibration Technician', 'Audio QA Test Engineer'],
    description: 'Building, testing, calibrating and repairing audio equipment so it performs to specification.' },
  { id: 'audio-archiving-preservation-and-restoration', name: 'Audio Archiving, Preservation & Restoration', dimensions: ['PC', 'ER', 'AR'], examples: ['Audio Archivist', 'Preservation Engineer', 'Audio Restoration Engineer'],
    description: 'Transferring recordings from aging carriers, restoring their sound and keeping them accessible for the future.' },
  { id: 'forensic-surveillance-security-and-public-safety-audio', name: 'Forensic, Surveillance, Security & Public-Safety Audio', dimensions: ['GS', 'AR', 'ER'], examples: ['Forensic Audio Examiner', 'Surveillance Audio Analyst', 'Public-Safety Audio Technician'],
    description: 'Examining, enhancing and authenticating recordings for investigations, courts and public safety.' },
  { id: 'technical-standards-regulation-law-and-rights', name: 'Technical Standards, Regulation, Law & Rights', dimensions: ['GS', 'TE', 'BO'], examples: ['Audio Standards Engineer', 'Music Licensing Specialist', 'Broadcast Loudness Compliance Specialist'],
    description: 'Writing and applying the standards, rules, licenses and rights that govern how audio is made, shared and measured.' },
  { id: 'education-research-training-and-technical-communication', name: 'Education, Research, Training & Technical Communication', dimensions: ['TE', 'AR', 'MS'], examples: ['Audio Instructor', 'Audio Curriculum Designer', 'Audio Technical Writer'],
    description: 'Teaching audio, designing courses, and explaining technical ideas clearly in classrooms, manuals and media.' },
  { id: 'audio-business-product-sales-and-operations', name: 'Audio Business, Product, Sales & Operations', dimensions: ['BO', 'TE', 'SD'], examples: ['Audio Product Manager', 'Pro Audio Sales Engineer', 'Studio Manager'],
    description: 'Selling, planning, managing and running the studios, companies, products and teams that professional audio depends on.' },
  { id: 'consumer-home-vehicle-and-personal-audio', name: 'Consumer, Home, Vehicle & Personal Audio', dimensions: ['SD', 'BM', 'AR'], examples: ['Automotive Audio Installer', 'Home Theater Designer', 'Consumer Audio Product Specialist'],
    description: 'Designing, installing and supporting the audio people live with, in homes, vehicles and personal devices.' },
  { id: 'dj-club-and-event-performance-technology', name: 'DJ, Club & Event Performance Technology', dimensions: ['CP', 'LO', 'SD'], examples: ['Club DJ', 'Mobile DJ', 'DJ Equipment Technician'],
    description: 'Performing with recorded music and the technology that drives clubs, events and dance floors.' },
  { id: 'sonic-branding-ux-exhibits-and-experience-design', name: 'Sonic Branding, UX, Exhibits & Experience Design', dimensions: ['MS', 'CP', 'SD'], examples: ['Sonic Branding Designer', 'UX Sound Designer', 'Exhibit Audio Designer'],
    description: 'Designing the sound of brands, products, interfaces, exhibits and public experiences.' },
  { id: 'music-for-picture-scoring-and-editorial', name: 'Music for Picture, Scoring & Editorial', dimensions: ['CP', 'MS', 'ER'], examples: ['Film Composer', 'Music Editor', 'Orchestrator'],
    description: 'Composing, arranging and editing music that serves film, television, trailers and advertising.' },
  { id: 'audio-networks-cloud-and-technical-infrastructure', name: 'Audio Networks, Cloud & Technical Infrastructure', dimensions: ['SD', 'DA', 'GS'], examples: ['Audio Network Engineer', 'Broadcast Infrastructure Engineer', 'Cloud Audio Engineer'],
    description: 'Building and running the networks, timing and cloud systems that move audio reliably between many places.' },
  { id: 'audio-measurement-system-tuning-and-instrumentation', name: 'Audio Measurement, System Tuning & Instrumentation', dimensions: ['AR', 'SD', 'LO'], examples: ['Sound-System Alignment Engineer', 'Electroacoustic Measurement Engineer', 'Audio Measurement Technician'],
    description: 'Measuring sound systems and spaces with instruments, then tuning them until they perform as intended.' },
  { id: 'stagecraft-rigging-power-and-production-support', name: 'Stagecraft, Rigging, Power & Production Support', dimensions: ['BM', 'LO', 'SD'], examples: ['Entertainment Rigger', 'Audio Stagehand', 'Power Distribution Technician — Events'],
    description: 'Rigging, powering and supporting the physical production that live audio depends on, safely and on schedule.' },
  { id: 'session-performance-voice-and-musical-direction', name: 'Session Performance, Voice & Musical Direction', dimensions: ['CP', 'RC', 'TE'], examples: ['Session Musician', 'Vocal Producer', 'Music Director'],
    description: 'Performing and directing music and voice in recording sessions, from the first take to the final one.' },
  { id: 'music-performance-conducting-and-live-musical-direction', name: 'Music Performance, Conducting & Live Musical Direction', dimensions: ['CP', 'LO', 'TE'], examples: ['Performing Musician', 'Orchestra Conductor', 'Bandleader'],
    description: 'Performing, conducting and leading music in front of audiences, in halls, clubs, worship and touring.' },
  { id: 'musical-instrument-building-tuning-and-repair', name: 'Musical Instrument Building, Tuning & Repair', dimensions: ['BM', 'CP', 'PC'], examples: ['Luthier', 'Piano Technician', 'Organ Builder'],
    description: 'Building, tuning, restoring and repairing the instruments musicians play.' },
  { id: 'music-education-lessons-and-musicianship-coaching', name: 'Music Education, Lessons & Musicianship Coaching', dimensions: ['TE', 'CP', 'HC'], examples: ['Music Teacher', 'Vocal Coach', 'Ear-Training Instructor'],
    description: 'Teaching music, voice and listening, and coaching players as their abilities grow.' },
  { id: 'music-therapy-speech-and-clinical-voice', name: 'Music Therapy, Speech & Clinical Voice', dimensions: ['HC', 'CP', 'TE'], examples: ['Music Therapist', 'Speech-Language Pathologist', 'Clinical Voice Specialist'],
    description: 'Clinical work with music, speech and voice — music therapy, speech-language pathology and voice rehabilitation — for people with communication, developmental or health needs.' },
  { id: 'phonetics-linguistics-and-speech-science', name: 'Phonetics, Linguistics & Speech Science', dimensions: ['AR', 'HC', 'DA'], examples: ['Phonetician', 'Speech Scientist', 'Linguistics Laboratory Technician'],
    description: 'Analyzing, recording and modeling the sounds of human speech and language.' },
  { id: 'telecom-voice-quality-and-communications-audio', name: 'Telecom, Voice Quality & Communications Audio', dimensions: ['SD', 'AR', 'DA'], examples: ['Voice-Quality Engineer', 'Telecommunications Audio Engineer', 'Speech Codec Engineer'],
    description: 'Making transmitted voice clear and intelligible across phones, conferencing, radios and networks.' },
  { id: 'acoustic-construction-and-noise-control-trades', name: 'Acoustic Construction & Noise-Control Trades', dimensions: ['BM', 'AR', 'SD'], examples: ['Acoustic Installer', 'Soundproofing Contractor', 'Noise-Control Technician'],
    description: 'Building and installing the treatments, partitions and enclosures that control sound in real spaces.' },
  { id: 'music-curation-repertoire-libraries-and-editorial', name: 'Music Curation, Repertoire, Libraries & Editorial', dimensions: ['PC', 'MS', 'CP'], examples: ['Music Supervisor', 'Music Librarian', 'Playlist Curator'],
    description: 'Selecting, organizing and licensing music for productions, platforms, collections and audiences.' },
  { id: 'defense-sonar-and-acoustic-intelligence', name: 'Defense, Sonar & Acoustic Intelligence', dimensions: ['AR', 'SD', 'GS'], examples: ['Sonar Technician', 'Acoustic Intelligence Analyst', 'Underwater Acoustics Engineer'],
    description: 'Detecting, tracking and interpreting sound underwater and in the field for defense and security, often in military or government service.' },
  { id: 'accessible-media-and-audio-description', name: 'Accessible Media & Audio Description', dimensions: ['HC', 'MS', 'ER'], examples: ['Audio Description Writer', 'Audio Description Narrator', 'Accessibility Audio Producer'],
    description: 'Writing, voicing and producing audio that makes film, television, theatre and museums accessible to blind and low-vision audiences and others who need it.' },
  { id: 'music-retail-rental-and-instrument-services', name: 'Music Retail, Rental & Instrument Services', dimensions: ['BO', 'BM', 'TE'], examples: ['Pro Audio Retail Specialist', 'Instrument Rental Technician', 'Backline Technician'],
    description: 'Advising, supplying, renting and servicing the instruments and equipment musicians and productions rely on.' },
  { id: 'field-recording-sound-libraries-and-sonic-heritage', name: 'Field Recording, Sound Libraries & Sonic Heritage', dimensions: ['RC', 'PC', 'AR'], examples: ['Wildlife Sound Recordist', 'Sound Library Producer', 'Sonic Heritage Specialist'],
    description: 'Recording the sounds of places, nature and cultures, and building the libraries that preserve them.' },
];

export const FAMILY_COUNT = FAMILIES.length;
const BY_ID = new Map(FAMILIES.map((f) => [f.id, f] as const));
export const familyById = (id: string): CareerFamily | undefined => BY_ID.get(id);
