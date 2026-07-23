// ape-dsp — oscilloscope-style waveform envelope + clip-run detection (engine
// build 2026-07-23, tech spec §5 waveform path). Decimated min/max/RMS
// buckets over a rolling history — numerical display data, never raw audio
// (spec §18). Pure C++17, header-only.
#pragma once

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace apedsp {

struct WaveBucket {
  float mn = 0.0f, mx = 0.0f;
  float rms = 0.0f;
  bool clipped = false;
};

class WaveEnvelope {
 public:
  // bucketFrames: samples per bucket (e.g. 2400 @48k = 50 ms); history: bucket count.
  void configure(size_t bucketFrames, size_t historyBuckets) {
    bucketFrames_ = bucketFrames < 16 ? 16 : bucketFrames;
    ring_.assign(historyBuckets, WaveBucket{});
    head_ = 0;
    filled_ = 0;
    resetAccum();
  }

  void push(const float* samples, size_t n) {
    for (size_t i = 0; i < n; ++i) {
      const float s = samples[i];
      if (s < accMn_) accMn_ = s;
      if (s > accMx_) accMx_ = s;
      accSumSq_ += static_cast<double>(s) * s;
      // Clip runs: ≥3 consecutive samples at/beyond ~full scale (F1: peaks can
      // EXCEED 0 dBFS on overload — detect ≥, never assume ≤1.0).
      if (std::fabs(s) >= kClipLevel) {
        if (++clipRun_ >= 3) accClipped_ = true;
      } else {
        clipRun_ = 0;
      }
      if (++accCount_ >= bucketFrames_) commitBucket();
    }
  }

  // Copy the newest → oldest history (up to maxOut buckets). Returns count.
  size_t snapshot(WaveBucket* out, size_t maxOut) const {
    const size_t n = filled_ < maxOut ? filled_ : maxOut;
    for (size_t i = 0; i < n; ++i) {
      // i=0 → newest committed bucket.
      const size_t idx = (head_ + ring_.size() - 1 - i) % ring_.size();
      out[i] = ring_[idx];
    }
    return n;
  }

  uint64_t clippedBuckets() const { return clippedTotal_; }

  void reset() {
    for (auto& b : ring_) b = WaveBucket{};
    head_ = 0;
    filled_ = 0;
    clippedTotal_ = 0;
    resetAccum();
  }

 private:
  void commitBucket() {
    WaveBucket b;
    b.mn = accMn_ <= accMx_ ? accMn_ : 0.0f;
    b.mx = accMx_ >= accMn_ ? accMx_ : 0.0f;
    b.rms = static_cast<float>(std::sqrt(accSumSq_ / static_cast<double>(accCount_)));
    b.clipped = accClipped_;
    if (accClipped_) ++clippedTotal_;
    ring_[head_] = b;
    head_ = (head_ + 1) % ring_.size();
    if (filled_ < ring_.size()) ++filled_;
    resetAccum();
  }

  void resetAccum() {
    accMn_ = 1e9f;
    accMx_ = -1e9f;
    accSumSq_ = 0.0;
    accCount_ = 0;
    accClipped_ = false;
    clipRun_ = 0;
  }

  static constexpr float kClipLevel = 0.999f;
  size_t bucketFrames_ = 2400;
  std::vector<WaveBucket> ring_{120};
  size_t head_ = 0, filled_ = 0;
  float accMn_ = 1e9f, accMx_ = -1e9f;
  double accSumSq_ = 0.0;
  size_t accCount_ = 0;
  bool accClipped_ = false;
  int clipRun_ = 0;
  uint64_t clippedTotal_ = 0;
};

}  // namespace apedsp
