// ape-dsp — CLIP SOURCE storage (engine 13, 2026-11-27, 1.0.1 store build,
// build must-do D16 / build-list A15): a preloaded float PCM recording the
// generator can play as GenMode::Clip, through the SAME effect chain and the
// SAME Q4 level cap as every generated signal (see Generator.hpp).
//
// Who does what:
//   platform (iOS AVAudioFile / Android MediaExtractor+MediaCodec) decodes the
//     file OFF the audio thread and hands deinterleaved float PCM to
//     Generator::loadClip (bridge thread);
//   makeClip (bridge thread) copies it into a ClipBuffer: NaN/inf → 0, a peak
//     above full scale is normalised down to 1.0, the loop seam is measured
//     once, and the fade lengths are fixed — the render path does no analysis;
//   ClipSlot hands the finished buffer to the audio thread LOCK-FREE and gets
//     the old one back for freeing — the audio thread never allocates, never
//     frees, never locks, and never reads a buffer the bridge has freed.
//
// THE OWNERSHIP RULE (ClipSlot). Three places can hold a buffer:
//   pending_  — published by the bridge, not yet taken by the audio thread.
//               std::atomic exchange: whoever takes it out owns it. A bridge
//               publish that gets a not-yet-adopted buffer back deletes it —
//               the audio thread never saw it.
//   cur_      — the one the audio thread plays. Plain pointer, audio thread
//               only. The bridge NEVER touches it (the destructor aside, which
//               runs only once the output has stopped).
//   retire_   — an SPSC pointer ring: the audio thread pushes the buffer it
//               just replaced; the bridge pops and deletes on its next call.
//               The audio thread adopts only when the ring has room, so it
//               never has to free anything itself.
// Pure C++17, header-only.
#pragma once

#include <atomic>
#include <cmath>
#include <cstdint>
#include <vector>

namespace apedsp {

namespace genclip {
/// Longest clip the engine accepts, in seconds of the file's own rate. Lab
/// recordings are short (the JS clip path budgets ~30 s); 60 s of stereo float
/// is ~23 MB, so a runaway file cannot balloon the app.
constexpr double kMaxSeconds = 60.0;
/// Accepted file sample rates.
constexpr double kMinRate = 8000.0;
constexpr double kMaxRate = 192000.0;
/// Loop-seam crossfade (used only when the seam is NOT seamless, see makeClip).
constexpr double kLoopXfadeSec = 0.010;
/// One-shot tail fade: the last few ms of a one-shot fade to zero so a file
/// that ends mid-waveform never ends on a step.
constexpr double kEndFadeSec = 0.005;
/// Clip gain range (dB, relative to the generator level). It can only
/// attenuate: 0 dB is the ceiling, ≤ kMinGainDb is silence.
constexpr double kMinGainDb = -120.0;

/// loadClip result codes (cross every bridge as an int).
enum Status : int {
  Ok = 0,
  Empty = 1,      // no frames / null data
  BadRate = 2,    // sample rate outside kMinRate..kMaxRate
  TooLong = 3,    // longer than kMaxSeconds
};
}  // namespace genclip

#ifdef APEDSP_CLIP_TEST_HOOKS
// Golden-test instrumentation only (never defined in an app build): a live
// buffer count, and a destructor that POISONS the samples with NaN before
// freeing, so a render that ever read a freed buffer would print NaN.
inline std::atomic<int>& clipLiveCount() {
  static std::atomic<int> n{0};
  return n;
}
#endif

struct ClipBuffer {
  std::vector<float> l, r;  // r empty = mono
  uint32_t frames = 0;      // 0 = the "no clip" buffer (unload) — renders silence
  double rate = 48000.0;    // the file's own rate; the render resamples
  bool seamless = true;     // loop seam step no bigger than the clip's own steps
  uint32_t xfade = 0;       // loop crossfade length (frames) when !seamless
  uint32_t endFade = 0;     // one-shot tail fade length (frames)
  double normGain = 1.0;    // < 1 = the file peaked above full scale and was scaled down

#ifdef APEDSP_CLIP_TEST_HOOKS
  ClipBuffer() { clipLiveCount().fetch_add(1); }
  ~ClipBuffer() {
    for (auto& v : l) v = std::nanf("");
    for (auto& v : r) v = std::nanf("");
    clipLiveCount().fetch_sub(1);
  }
  ClipBuffer(const ClipBuffer&) = delete;
  ClipBuffer& operator=(const ClipBuffer&) = delete;
#endif

  int channels() const { return frames == 0 ? 0 : (r.empty() ? 1 : 2); }
};

/// Build a ClipBuffer from deinterleaved float PCM (BRIDGE thread: allocates).
/// R may be null (mono). Returns nullptr and sets *status on a refusal.
inline ClipBuffer* makeClip(const float* L, const float* R, uint32_t frames, double rate, int* status) {
  auto fail = [status](int s) -> ClipBuffer* {
    if (status) *status = s;
    return nullptr;
  };
  if (L == nullptr || frames == 0) return fail(genclip::Empty);
  if (!(rate >= genclip::kMinRate && rate <= genclip::kMaxRate)) return fail(genclip::BadRate);
  if (static_cast<double>(frames) > rate * genclip::kMaxSeconds) return fail(genclip::TooLong);
  ClipBuffer* c = new ClipBuffer();
  c->frames = frames;
  c->rate = rate;
  c->l.assign(L, L + frames);
  if (R != nullptr) c->r.assign(R, R + frames);
  // Sanitise + peak: a NaN/inf sample would poison the chain's filter state.
  float peak = 0.0f;
  auto clean = [&peak](std::vector<float>& v) {
    for (auto& x : v) {
      if (!std::isfinite(x)) x = 0.0f;
      const float a = std::fabs(x);
      if (a > peak) peak = a;
    }
  };
  clean(c->l);
  clean(c->r);
  // A HOT file (decoded AAC overshoot, a float WAV above 0 dBFS) is scaled so
  // its peak is exactly full scale — the clip then has the same unit-level
  // contract as every generator mode, and the Q4 cap chain bounds it. (The
  // render also clamps every interpolated sample to ±1 as a backstop.)
  if (peak > 1.0f) {
    const float g = 1.0f / peak;
    c->normGain = static_cast<double>(g);
    for (auto& x : c->l) x *= g;
    for (auto& x : c->r) x *= g;
  }
  // Loop seam, measured ONCE here (never on the audio thread): the wrap
  // N-1 → 0 is seamless when its step is no larger than the largest step
  // inside the clip, on every channel — a clip cut for looping (whole periods,
  // zero crossings) then wraps byte-continuously. Otherwise the render
  // crossfades the last kLoopXfadeSec into the first, so the wrap never steps.
  auto seamOk = [frames](const std::vector<float>& v) {
    if (v.empty() || frames < 2) return true;
    float maxStep = 0.0f;
    for (uint32_t i = 1; i < frames; ++i) {
      const float s = std::fabs(v[i] - v[i - 1]);
      if (s > maxStep) maxStep = s;
    }
    return std::fabs(v[0] - v[frames - 1]) <= maxStep * 1.000001f + 1e-7f;
  };
  c->seamless = seamOk(c->l) && seamOk(c->r);
  const uint32_t quarter = frames / 4;
  const uint32_t xf = static_cast<uint32_t>(std::lround(rate * genclip::kLoopXfadeSec));
  const uint32_t ef = static_cast<uint32_t>(std::lround(rate * genclip::kEndFadeSec));
  c->xfade = c->seamless ? 0 : (xf < quarter ? xf : quarter);
  c->endFade = ef < quarter ? ef : quarter;
  if (status) *status = genclip::Ok;
  return c;
}

/// The lock-free hand-off between the bridge and the audio thread (see the
/// ownership rule in the header).
class ClipSlot {
 public:
  ClipSlot() = default;
  ClipSlot(const ClipSlot&) = delete;
  ClipSlot& operator=(const ClipSlot&) = delete;
  /// Only once the output has stopped (the owning object is being destroyed).
  ~ClipSlot() {
    delete pending_.exchange(nullptr);
    drain();
    delete cur_;
  }

  // ---- Bridge thread ----
  /// Publish a buffer (ownership passes to the slot). Frees what the audio
  /// thread has already retired, and a previous publish it never took.
  void publish(ClipBuffer* b) {
    drain();
    ClipBuffer* never = pending_.exchange(b, std::memory_order_acq_rel);
    delete never;  // the audio thread never saw it
  }
  /// Free every buffer the audio thread has handed back.
  void drain() {
    const uint32_t head = head_.load(std::memory_order_acquire);
    uint32_t tail = tail_.load(std::memory_order_relaxed);
    while (tail != head) {
      delete ring_[tail & kMask];
      ring_[tail & kMask] = nullptr;
      ++tail;
    }
    tail_.store(tail, std::memory_order_release);
  }

  // ---- Audio thread ----
  bool hasPending() const { return pending_.load(std::memory_order_acquire) != nullptr; }
  /// Take the pending buffer if there is one and room to retire the current
  /// one. Never allocates or frees. True when the playing buffer changed.
  bool adopt() {
    const uint32_t head = head_.load(std::memory_order_relaxed);
    const uint32_t tail = tail_.load(std::memory_order_acquire);
    if (head - tail >= kSlots) return false;  // retire ring full — keep playing, try next block
    ClipBuffer* n = pending_.exchange(nullptr, std::memory_order_acq_rel);
    if (n == nullptr) return false;
    if (cur_ != nullptr) {
      ring_[head & kMask] = cur_;
      head_.store(head + 1, std::memory_order_release);
    }
    cur_ = n;
    return true;
  }
  const ClipBuffer* current() const { return cur_; }

 private:
  static constexpr uint32_t kSlots = 8;  // power of two
  static constexpr uint32_t kMask = kSlots - 1;
  std::atomic<ClipBuffer*> pending_{nullptr};
  ClipBuffer* cur_ = nullptr;  // audio thread only
  ClipBuffer* ring_[kSlots] = {};
  std::atomic<uint32_t> head_{0};  // audio thread writes
  std::atomic<uint32_t> tail_{0};  // bridge writes
};

}  // namespace apedsp
