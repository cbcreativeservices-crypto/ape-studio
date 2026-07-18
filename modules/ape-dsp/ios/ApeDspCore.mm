// ape-dsp — ObjC++ implementation: owns the SPSC ring, the analysis thread,
// and the proof engine. Threading model per tech spec §1.1:
//   RT thread  → writeChannels (ring write only)
//   analysis   → drain ring every ~50 ms → DspEngine::processChunk
//   bridge     → frame (mutex-guarded snapshot; never touches the RT thread)
#import "ApeDspCore.h"

#include <atomic>
#include <chrono>
#include <thread>

#include "core/DspEngine.hpp"
#include "core/SpscRing.hpp"

namespace {
constexpr size_t kRingCapacity = 1 << 18;  // 262144 frames ≈ 5.5 s @ 48 kHz (≥2 s spec)
constexpr size_t kScratchSize = 8192;
constexpr double kStallSeconds = 0.5;  // tech spec §2.2 watchdog

double nowSeconds() {
  using namespace std::chrono;
  return duration<double>(steady_clock::now().time_since_epoch()).count();
}
}  // namespace

@implementation ApeDspCore {
  apedsp::SpscRing *_ring;
  apedsp::DspEngine *_engine;
  std::thread _analysisThread;
  std::atomic<bool> _running;
  std::atomic<double> _lastWriteAt;
  float *_scratch;
}

- (instancetype)init {
  if (self = [super init]) {
    _ring = new apedsp::SpscRing(kRingCapacity);
    _engine = new apedsp::DspEngine();
    _scratch = new float[kScratchSize];
    _running.store(false);
    _lastWriteAt.store(0.0);
  }
  return self;
}

- (void)dealloc {
  [self stop];
  delete _ring;
  delete _engine;
  delete[] _scratch;
}

- (void)start {
  if (_running.exchange(true)) return;
  _lastWriteAt.store(nowSeconds());
  apedsp::SpscRing *ring = _ring;
  apedsp::DspEngine *engine = _engine;
  float *scratch = _scratch;
  std::atomic<bool> *running = &_running;
  _analysisThread = std::thread([ring, engine, scratch, running]() {
    while (running->load(std::memory_order_relaxed)) {
      size_t total = 0;
      size_t n;
      // Drain everything available this tick, folding chunk-by-chunk.
      while ((n = ring->read(scratch, kScratchSize)) > 0) {
        engine->processChunk(scratch, n, ring->dropped(), true);
        total += n;
        if (total > kRingCapacity) break;  // paranoia bound
      }
      if (total == 0) {
        engine->processChunk(nullptr, 0, ring->dropped(), true);
      }
      std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
  });
}

- (void)stop {
  if (!_running.exchange(false)) return;
  if (_analysisThread.joinable()) _analysisThread.join();
  _engine->processChunk(nullptr, 0, _ring->dropped(), false);
}

- (void)reset {
  _ring->clear();
  _engine->reset();
  _lastWriteAt.store(nowSeconds());
}

- (void)resetPeakHold {
  _engine->resetPeakHold();
}

- (void)writeChannels:(const float *const *)channels
         channelCount:(int)channelCount
           frameCount:(size_t)frameCount {
  _ring->writeChannels(channels, channelCount, frameCount);
  _lastWriteAt.store(nowSeconds(), std::memory_order_relaxed);
}

- (NSDictionary<NSString *, id> *)frame {
  const apedsp::FrameData f = _engine->snapshot();
  const bool running = _running.load(std::memory_order_relaxed);
  const bool stalled = running && (nowSeconds() - _lastWriteAt.load(std::memory_order_relaxed)) > kStallSeconds;
  return @{
    @"version" : @(f.version),
    @"sequence" : @(f.sequence),
    @"settingsEpoch" : @(f.settingsEpoch),
    @"rmsDb" : @(f.rmsDb),
    @"peakDb" : @(f.peakDb),
    @"peakHoldDb" : @(f.peakHoldDb),
    @"droppedFrames" : @(f.droppedFrames),
    @"running" : @(running),
    @"captureStalled" : @(stalled),
  };
}

@end
