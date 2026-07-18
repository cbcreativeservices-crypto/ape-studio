// ape-dsp — lock-free single-producer/single-consumer float ring buffer.
// Producer = the audio (RT) thread; consumer = the analysis thread.
// Pure C++17, no platform dependencies (tech spec §1.1: portable core).
//
// SPIKE DEVIATION OF RECORD: overrun policy is drop-NEWEST + counter, not the
// spec's drop-oldest. Drop-oldest requires the producer to move the consumer's
// tail (breaks the SPSC invariant without extra synchronization). With a ≥2 s
// ring drained every ~50 ms, overrun only happens if the analysis thread stalls
// >2 s — at which point which end is dropped is immaterial, and the counter
// records it either way. Flagged for the report-back per kickoff brief §7.
#pragma once

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <vector>

namespace apedsp {

class SpscRing {
 public:
  // capacityPow2 MUST be a power of two.
  explicit SpscRing(size_t capacityPow2) : buf_(capacityPow2), mask_(capacityPow2 - 1) {}

  // RT thread. Mixes N deinterleaved channels to mono while writing.
  // No locks, no allocation.
  size_t writeChannels(const float* const* channels, int nch, size_t frames) {
    const size_t head = head_.load(std::memory_order_relaxed);
    const size_t tail = tail_.load(std::memory_order_acquire);
    const size_t freeSlots = buf_.size() - (head - tail);
    size_t n = frames;
    if (n > freeSlots) {
      dropped_.fetch_add(static_cast<uint64_t>(n - freeSlots), std::memory_order_relaxed);
      n = freeSlots;
    }
    const float inv = nch > 0 ? 1.0f / static_cast<float>(nch) : 1.0f;
    for (size_t i = 0; i < n; ++i) {
      float s = 0.0f;
      for (int c = 0; c < nch; ++c) s += channels[c][i];
      buf_[(head + i) & mask_] = s * inv;
    }
    head_.store(head + n, std::memory_order_release);
    return n;
  }

  // Analysis thread.
  size_t read(float* out, size_t maxFrames) {
    const size_t tail = tail_.load(std::memory_order_relaxed);
    const size_t head = head_.load(std::memory_order_acquire);
    const size_t avail = head - tail;
    const size_t n = avail < maxFrames ? avail : maxFrames;
    for (size_t i = 0; i < n; ++i) out[i] = buf_[(tail + i) & mask_];
    tail_.store(tail + n, std::memory_order_release);
    return n;
  }

  void clear() {
    // Consumer-side drain; safe to call from the analysis thread only.
    tail_.store(head_.load(std::memory_order_acquire), std::memory_order_release);
  }

  uint64_t dropped() const { return dropped_.load(std::memory_order_relaxed); }

 private:
  std::vector<float> buf_;
  size_t mask_;
  std::atomic<size_t> head_{0};
  std::atomic<size_t> tail_{0};
  std::atomic<uint64_t> dropped_{0};
};

}  // namespace apedsp
