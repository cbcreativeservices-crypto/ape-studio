// ape-dsp — ObjC facade over the portable C++ core (SpscRing + EngineHub +
// Generator). Swift talks to this; the C++ stays platform-free for the
// golden-vector tests (modules/ape-dsp/test) / Android later.
// Engine build 2026-07-23: weighting, FFT/banding, pitch, waveform envelope,
// Leq logging, and the Q4-capped signal generator — all logic in the tested
// C++ core; this facade only marshals.
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ApeDspCore : NSObject

/// The engine capability version JS gates features on — reads the C++
/// apedsp::kEngineVersion (EngineHub.hpp) so every iOS surface (getInfo,
/// frame) reports the same value as the core. Never hardcode it in Swift.
+ (uint32_t)engineVersion;

/// Spin up the analysis thread (drains the ring every ~50 ms). Idempotent.
- (void)start;
/// Stop the analysis thread and mark not-running. Idempotent.
- (void)stop;
/// Clear meters + ring (route change / interruption resume — stale EMAs must not bleed).
- (void)reset;
- (void)resetPeakHold;
/// Restart the Leq/logging accumulation window.
- (void)resetLeq;

/// Configure DSP for the ACTUAL session sample rate (capture start / route change).
- (void)configureSampleRate:(double)sampleRate;

/// Analysis configuration from JS: fftSize, fraction (1|3), spectrumEnabled,
/// pitchEnabled, waveformEnabled, bandAvgAlpha. Unknown keys ignored.
- (void)setEngineConfig:(NSDictionary<NSString *, id> *)config;

/// RT AUDIO THREAD ONLY: mix deinterleaved channels to mono into the ring.
/// Lock-free, allocation-free. Inner level _Nullable to match Swift's
/// UnsafePointer<UnsafePointer<Float>?> rebind (review 2026-07-23:
/// -Wnullability-completeness fires on the unannotated inner level, and inner
/// _Nonnull would break the existing Swift call site).
- (void)writeChannels:(const float *_Nullable const *_Nonnull)channels
         channelCount:(int)channelCount
           frameCount:(size_t)frameCount;

/// Legacy Spike-0 display frame (rmsDb = Z-weighted Fast) — keeps the existing
/// DspDebug screen working. Keys as before + engineVersion.
- (NSDictionary<NSString *, id> *)frame;

/// Engine-build frames (dictionary bridge — scalars + small arrays only,
/// polled ≤30 Hz per the spike bridge rules).
- (NSDictionary<NSString *, id> *)meterFrame;

/// Startup capture-health probe result (C1): { inputStuck, dcOffset, probeReady }.
- (NSDictionary<NSString *, id> *)healthProbe;
- (NSDictionary<NSString *, id> *)bandsFrame;       // ≤30 bands: NSArrays OK
- (NSDictionary<NSString *, id> *)pitchFrame;
- (NSDictionary<NSString *, id> *)spectrumMeta;
/// Fine spectrum bins as Float32 little-endian Data (typed-array path — the
/// dictionary bridge is NOT valid at spectrogram sizes per the spike report).
- (NSData *)spectrumData;
/// Waveform buckets as Float32 quads [min, max, rms, clipped(0/1)] × count.
- (NSData *)waveformData;

// ---- RT60 guided capture (spec §13; engine analysis in the tested C++ core) ----
/// Arm the decay capture: waits for a trigger (~−35 dBFS), records 3.5 s,
/// analyzes per octave band, lands in state 'done'.
- (void)rt60Arm;
- (void)rt60Cancel;
/// State + results: { state: 0 off | 1 armed | 2 recording | 3 done,
///   bands: [{bandHz, edtSec, t20Rt60Sec, t30Rt60Sec, r2, decayRangeDb, valid}],
///   curveDb: [Float], curveStepSec }
- (NSDictionary<NSString *, id> *)rt60Frame;

// ---- Generator (Q4 caps live in the C++ core) ----
- (void)genSetMode:(int)mode;
- (void)genSetFrequency:(double)hz;
- (void)genSetLevelDb:(double)db;
- (void)genSetSweepStart:(double)startHz end:(double)endHz seconds:(double)seconds repeat:(BOOL)repeat;
- (void)genSetClickBpm:(double)bpm;
- (void)genSetHpf:(double)hz;
- (void)genSetStereo:(BOOL)on freqL:(double)fL freqR:(double)fR;
/// ADDITIVE (HV-2): flat layout [f0, a1..a12, p1..p12] — 25 numbers. f0 in Hz,
/// amps relative 0..1, phases in DEGREES. Same ordering crosses every bridge
/// verbatim; the core validates/clamps and ramps toward the new targets
/// (slope-limited — a full-scale amp swing takes ~8 ms, smaller changes
/// finish faster), so this is safe to call at UI rate. Short arrays are
/// ignored.
- (void)genSetAdditive:(NSArray<NSNumber *> *)values;
- (void)genUnlockCap;
- (void)genRelockCap;
- (void)genStart;
- (void)genStop;
- (NSDictionary<NSString *, id> *)genStatus;
/// RT OUTPUT THREAD ONLY: render n mono frames from the generator.
- (void)genRender:(float *_Nonnull)buffer frames:(uint32_t)frames;
- (void)genRenderStereo:(float *_Nonnull)left right:(float *_Nonnull)right frames:(uint32_t)frames;
- (void)fxSet:(int)effectId param:(int)paramId value:(double)v;
- (void)fxReset;
- (NSArray<NSNumber *> *_Nonnull)fxGrStatus;

// ---- Wave-2 expansion voices (engineVersion 7) ----
/// FM voice targets (GenMode::Fm): modulator ratio, index (radians, ramped),
/// index decay seconds (0 = sustained). A genStart retrigger is the strike.
- (void)genSetFm:(double)ratio index:(double)index decay:(double)decaySec;
/// Binaural bus source i (0..2): type 0 sine · 1 white · 2 pink; azimuth in
/// degrees (−180..180, + = right); distance in meters (0.5–4). Safe at drag rate.
- (void)binSetSource:(int)i
                  on:(BOOL)on
                type:(int)type
                freq:(double)freqHz
             levelDb:(double)levelDb
                  az:(double)azDeg
                dist:(double)dist;
- (void)binStart;
- (void)binStop;
/// { running, busNorm } — busNorm < 1 = the Q4 sum bound is attenuating.
- (NSDictionary<NSString *, id> *)binStatus;
/// Modular voice scalar setter (modular::Param ids — keep lockstep w/ index.ts).
- (void)modSet:(int)param value:(double)v;
- (void)modStart;
- (void)modStop;
/// { running, envLevel, activeStep } — live env + sequencer step (honest UI).
- (NSDictionary<NSString *, id> *)modStatus;
/// TRUE while ANY output voice (generator, binaural, modular) is running —
/// the Swift layer's teardown guard for the shared output graph.
- (BOOL)anyOutputRunning;

@end

NS_ASSUME_NONNULL_END
