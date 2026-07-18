// ape-dsp — ObjC facade over the portable C++ core (SpscRing + DspEngine).
// Swift talks to this; the C++ stays platform-free for CI tests / Android later.
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ApeDspCore : NSObject

/// Spin up the analysis thread (drains the ring every ~50 ms). Idempotent.
- (void)start;
/// Stop the analysis thread and mark not-running. Idempotent.
- (void)stop;
/// Clear meters + ring (route change / interruption resume — stale EMAs must not bleed).
- (void)reset;
- (void)resetPeakHold;

/// RT AUDIO THREAD ONLY: mix deinterleaved channels to mono into the ring.
/// Lock-free, allocation-free.
- (void)writeChannels:(const float *const *_Nonnull)channels
         channelCount:(int)channelCount
           frameCount:(size_t)frameCount;

/// Latest display frame (analysis-thread product) + liveness metadata.
/// Keys: version, sequence, settingsEpoch, rmsDb, peakDb, peakHoldDb,
///       droppedFrames, running, captureStalled.
- (NSDictionary<NSString *, id> *)frame;

@end

NS_ASSUME_NONNULL_END
