// ape-dsp — Spike-0 proof engine (tech spec §5.1 unweighted path only):
// per-chunk RMS + peak (dBFS) with full-rate peak-hold, published as a
// versioned display frame. Pure C++17, header-only, no platform deps.
// Numerical rules honored (tech spec §3.1): log floor 1e-12; power-domain
// math; dB conversion last; float32 audio path.
#pragma once

#include <cmath>
#include <cstdint>
#include <mutex>

namespace apedsp {

struct FrameData {
  uint32_t version = 1;       // frame schema version (tech spec §4.1)
  uint64_t sequence = 0;      // increments per published analysis frame
  uint32_t settingsEpoch = 0; // bumps whenever configuration changes
  float rmsDb = -120.0f;
  float peakDb = -120.0f;
  float peakHoldDb = -120.0f;
  uint64_t droppedFrames = 0;
  bool running = false;
};

class DspEngine {
 public:
  void reset() {
    std::lock_guard<std::mutex> lock(mu_);
    frame_.sequence = 0;
    frame_.rmsDb = frame_.peakDb = frame_.peakHoldDb = -120.0f;
    peakHoldLin_ = 0.0f;
    frame_.settingsEpoch++;
  }

  void resetPeakHold() {
    std::lock_guard<std::mutex> lock(mu_);
    peakHoldLin_ = 0.0f;
    frame_.peakHoldDb = -120.0f;
  }

  // Analysis thread: fold one drained chunk into the published frame.
  void processChunk(const float* samples, size_t n, uint64_t droppedFrames, bool running) {
    if (n == 0) {
      std::lock_guard<std::mutex> lock(mu_);
      frame_.droppedFrames = droppedFrames;
      frame_.running = running;
      return;
    }
    double sumSq = 0.0;
    float maxAbs = 0.0f;
    for (size_t i = 0; i < n; ++i) {
      const float s = samples[i];
      sumSq += static_cast<double>(s) * static_cast<double>(s);
      const float a = std::fabs(s);
      if (a > maxAbs) maxAbs = a;
    }
    const double meanPower = sumSq / static_cast<double>(n);
    // Log floor: silence reads −120 dB, never -inf/NaN (tech spec §3.1).
    const float rmsDb = static_cast<float>(10.0 * std::log10(meanPower + 1e-12));
    const float peakDb = static_cast<float>(20.0 * std::log10(static_cast<double>(maxAbs) + 1e-12));

    std::lock_guard<std::mutex> lock(mu_);
    if (maxAbs > peakHoldLin_) peakHoldLin_ = maxAbs;
    frame_.rmsDb = rmsDb;
    frame_.peakDb = peakDb;
    frame_.peakHoldDb = static_cast<float>(20.0 * std::log10(static_cast<double>(peakHoldLin_) + 1e-12));
    frame_.droppedFrames = droppedFrames;
    frame_.running = running;
    frame_.sequence++;
  }

  FrameData snapshot() const {
    std::lock_guard<std::mutex> lock(mu_);
    return frame_;
  }

 private:
  mutable std::mutex mu_;  // analysis ↔ bridge reader only — never the RT thread
  FrameData frame_{};
  float peakHoldLin_ = 0.0f;
};

}  // namespace apedsp
