// ape-dsp — GOLDEN-VECTOR TEST HARNESS (engine build 2026-07-23, Spike-0
// report §8 "golden-vector CI tests"). Compiles the PORTABLE C++ core on any
// host (here: MSVC on the dev machine) and verifies the DSP math against
// known-good values: IEC A/C weighting points, FFT Parseval + bin placement,
// ballistics time constants, octave banding + Q2 resolvable flags, YIN pitch,
// generator levels incl. the Q4 cap, noise spectral tilts, clip detection,
// and the integrated EngineHub. Exit code 0 = all pass.
#include <cmath>
#include <cstdio>
#include <string>
#include <vector>

#include "../ios/core/Ballistics.hpp"
#include "../ios/core/Biquad.hpp"
#include "../ios/core/EngineHub.hpp"
#include "../ios/core/Fft.hpp"
#include "../ios/core/Generator.hpp"
#include "../ios/core/OctaveBands.hpp"
#include "../ios/core/Pitch.hpp"
#include "../ios/core/Rt60.hpp"
#include "../ios/core/WaveEnvelope.hpp"

using namespace apedsp;

static int g_pass = 0, g_fail = 0;

static void check(bool ok, const std::string& name, double got, double want, double tol) {
  if (ok) {
    ++g_pass;
    std::printf("PASS  %-52s got=%.4f want=%.4f (tol %.3f)\n", name.c_str(), got, want, tol);
  } else {
    ++g_fail;
    std::printf("FAIL  %-52s got=%.4f want=%.4f (tol %.3f)\n", name.c_str(), got, want, tol);
  }
}
static void near(const std::string& name, double got, double want, double tol) {
  check(std::fabs(got - want) <= tol, name, got, want, tol);
}
static void truthy(const std::string& name, bool got) {
  check(got, name, got ? 1 : 0, 1, 0);
}

static double db(double lin) { return 20.0 * std::log10(lin + 1e-30); }

// ---------------------------------------------------------------------------
int main() {
  const double fs = 48000.0;

  // ---- 1) A/C weighting vs IEC 61672 table --------------------------------
  {
    BiquadCascade A = weighting::designA(fs);
    BiquadCascade C = weighting::designC(fs);
    struct P { double f, wantDb, tol; };
    // Digital (bilinear) response: tolerance loosens toward Nyquist (warping).
    const P aPts[] = {{31.5, -39.4, 0.5}, {100, -19.1, 0.4}, {500, -3.2, 0.3},
                      {1000, 0.0, 0.05},  {2000, 1.2, 0.3},  {4000, 1.0, 0.5},
                      {8000, -1.1, 1.2},  {10000, -2.5, 2.2}};
    for (const P& p : aPts) near("A-weight @" + std::to_string((int)p.f) + " Hz",
                                 db(A.measureGainAt(p.f, fs)), p.wantDb, p.tol);
    const P cPts[] = {{31.5, -3.0, 0.4}, {100, -0.3, 0.3}, {1000, 0.0, 0.05},
                      {4000, -0.8, 0.5}, {8000, -3.0, 1.2}, {10000, -4.4, 2.2}};
    for (const P& p : cPts) near("C-weight @" + std::to_string((int)p.f) + " Hz",
                                 db(C.measureGainAt(p.f, fs)), p.wantDb, p.tol);
  }

  // ---- 2) FFT: Parseval + bin placement -----------------------------------
  {
    const size_t N = 4096;
    Fft fft(N);
    std::vector<float> x(N);
    const double amp = 0.1;  // −20 dBFS → power amp²/2 → −23.01 dB
    const double f0 = 1000.0;
    for (size_t i = 0; i < N; ++i)
      x[i] = static_cast<float>(amp * std::sin(2.0 * 3.14159265358979323846 * f0 * i / fs));
    std::vector<double> p(fft.bins());
    fft.powerSpectrum(x.data(), p.data());
    double total = 0.0;
    size_t peakBin = 0;
    double peakVal = 0.0;
    for (size_t k = 0; k < p.size(); ++k) {
      total += p[k];
      if (p[k] > peakVal) {
        peakVal = p[k];
        peakBin = k;
      }
    }
    near("FFT Parseval total power (dB)", 10.0 * std::log10(total), -23.01, 0.25);
    near("FFT peak bin", (double)peakBin, std::round(f0 * N / fs), 1.0);
  }

  // ---- 3) Ballistics time constant ----------------------------------------
  {
    PowerBallistics fast;
    fast.configure(0.125, fs);
    const size_t n = static_cast<size_t>(0.125 * fs);  // exactly one τ
    for (size_t i = 0; i < n; ++i) fast.push(1.0f);
    near("Fast ballistics @1τ (power)", fast.power(), 1.0 - std::exp(-1.0), 0.01);
  }

  // ---- 4) Octave bands: placement + Q2 resolvable flags -------------------
  {
    const size_t N = 8192;
    Fft fft(N);
    std::vector<float> x(N);
    for (size_t i = 0; i < N; ++i)
      x[i] = static_cast<float>(0.1 * std::sin(2.0 * 3.14159265358979323846 * 1000.0 * i / fs));
    std::vector<double> p(fft.bins());
    fft.powerSpectrum(x.data(), p.data());
    BandFrame bf = OctaveBands::analyze(p.data(), p.size(), fs, N, 3);
    // Find the 1 kHz band and its neighbors.
    size_t k1 = 0;
    for (size_t i = 0; i < bf.centers.size(); ++i)
      if (std::fabs(bf.centers[i] - 1000.0) < 1) k1 = i;
    near("1/3-oct band @1 kHz level (dB)", bf.levelsDb[k1], -23.01, 0.6);
    truthy("1/3-oct neighbor bands ≥20 dB down",
           bf.levelsDb[k1 - 1] < -43.0 && bf.levelsDb[k1 + 1] < -43.0);
    // Q2: with N=1024 (df≈46.9 Hz) the 25 Hz third-octave (width ~5.8 Hz) must
    // flag unresolvable; with N=16384 (df≈2.9 Hz) it resolves.
    Fft small(1024);
    std::vector<double> ps(small.bins(), 0.0);
    BandFrame low = OctaveBands::analyze(ps.data(), ps.size(), fs, 1024, 3);
    truthy("Q2 gray-out: 25 Hz band UNRESOLVABLE @N=1024", !low.resolvable[0]);
    Fft big(16384);
    std::vector<double> pb(big.bins(), 0.0);
    BandFrame hi = OctaveBands::analyze(pb.data(), pb.size(), fs, 16384, 3);
    truthy("Q2 gray-out: 25 Hz band resolvable @N=16384", hi.resolvable[0]);
  }

  // ---- 5) YIN pitch --------------------------------------------------------
  {
    PitchDetector det(static_cast<size_t>(fs * 0.05), static_cast<size_t>(fs * 0.025));
    std::vector<float> x(det.needed());
    auto tone = [&](double f) {
      for (size_t i = 0; i < x.size(); ++i)
        x[i] = static_cast<float>(0.3 * std::sin(2.0 * 3.14159265358979323846 * f * i / fs));
      return det.estimate(x.data(), fs);
    };
    PitchEstimate e440 = tone(440.0);
    near("YIN 440 Hz", e440.freq, 440.0, 0.5);
    truthy("YIN 440 Hz voiced + confident", e440.voiced && e440.confidence > 0.9);
    PitchEstimate e82 = tone(82.41);
    near("YIN 82.41 Hz (low E)", e82.freq, 82.41, 0.5);
    // Noise → not a stable pitch.
    uint32_t rng = 1234567;
    for (size_t i = 0; i < x.size(); ++i) {
      rng ^= rng << 13;
      rng ^= rng >> 17;
      rng ^= rng << 5;
      x[i] = static_cast<float>((static_cast<double>(rng) / 2147483648.0) - 1.0) * 0.3f;
    }
    PitchEstimate en = det.estimate(x.data(), fs);
    truthy("YIN white noise NOT voiced", !en.voiced);
  }

  // ---- 6) Generator: levels + Q4 cap + spectral tilts ---------------------
  {
    Generator gen;
    gen.configure(fs);
    gen.setMode(GenMode::Sine);
    gen.setFrequency(1000.0);
    gen.start();
    std::vector<float> buf(static_cast<size_t>(fs));
    gen.render(buf.data(), (uint32_t)buf.size());  // includes 10 ms fade-in
    double sumSq = 0.0;
    const size_t skip = static_cast<size_t>(fs * 0.05);
    for (size_t i = skip; i < buf.size(); ++i) sumSq += (double)buf[i] * buf[i];
    near("Generator sine RMS @default −20 dBFS", 10.0 * std::log10(sumSq / (buf.size() - skip)),
         -23.01, 0.15);

    // Q4 cap: request −6 dBFS while LOCKED → clamps to −12.
    gen.setLevelDb(-6.0);
    near("Q4 cap: locked effective level", gen.effectiveLevelDb(), -12.0, 1e-9);
    gen.render(buf.data(), (uint32_t)buf.size());
    sumSq = 0.0;
    for (size_t i = skip; i < buf.size(); ++i) sumSq += (double)buf[i] * buf[i];
    near("Q4 cap: locked −6 dBFS renders at −12", 10.0 * std::log10(sumSq / (buf.size() - skip)),
         -15.01, 0.2);
    gen.unlockCap();
    near("Q4 cap: unlocked effective level", gen.effectiveLevelDb(), -6.0, 1e-9);

    // Spectral tilts via octave-band analysis (average many frames).
    auto tiltOf = [&](GenMode m) {
      Generator g2;
      g2.configure(fs);
      g2.setMode(m);
      g2.start();
      const size_t N = 16384;
      Fft fft(N);
      std::vector<float> frame(N);
      std::vector<double> p(fft.bins()), acc(fft.bins(), 0.0);
      // settle
      g2.render(frame.data(), (uint32_t)N);
      const int rounds = 24;
      for (int r = 0; r < rounds; ++r) {
        g2.render(frame.data(), (uint32_t)N);
        fft.powerSpectrum(frame.data(), p.data());
        for (size_t k = 0; k < p.size(); ++k) acc[k] += p[k];
      }
      for (auto& v : acc) v /= rounds;
      return OctaveBands::analyze(acc.data(), acc.size(), fs, N, 1);
    };
    auto bandAt = [](const BandFrame& b, double c) {
      for (size_t i = 0; i < b.centers.size(); ++i)
        if (std::fabs(b.centers[i] - c) < 1) return b.levelsDb[i];
      return -999.0;
    };
    BandFrame pink = tiltOf(GenMode::Pink);
    // Pink: equal energy per octave → octave bands flat. Check 250 vs 4000.
    near("Pink noise octave flatness (250 Hz vs 4 kHz)", bandAt(pink, 250) - bandAt(pink, 4000),
         0.0, 2.5);
    BandFrame white = tiltOf(GenMode::White);
    // White: +3 dB per octave in octave bands → 4 octaves 500→8000 = +12 dB.
    near("White noise octave tilt (8 kHz − 500 Hz)", bandAt(white, 8000) - bandAt(white, 500),
         12.0, 2.5);
  }

  // ---- 7) Waveform envelope + clip runs -----------------------------------
  {
    WaveEnvelope we;
    we.configure(480, 100);  // 10 ms buckets
    std::vector<float> x(static_cast<size_t>(fs) / 2);
    // Overdriven sine — peaks beyond full scale (finding F1).
    for (size_t i = 0; i < x.size(); ++i)
      x[i] = static_cast<float>(1.2 * std::sin(2.0 * 3.14159265358979323846 * 100.0 * i / fs));
    we.push(x.data(), x.size());
    truthy("Clip runs detected on overdriven sine", we.clippedBuckets() > 0);
    std::vector<WaveBucket> out(100);
    const size_t got = we.snapshot(out.data(), out.size());
    truthy("Envelope buckets committed", got > 40);
    near("Envelope max shows beyond-FS peak (F1)", out[0].mx, 1.2, 0.05);

    WaveEnvelope clean;
    clean.configure(480, 100);
    for (size_t i = 0; i < x.size(); ++i)
      x[i] = static_cast<float>(0.5 * std::sin(2.0 * 3.14159265358979323846 * 100.0 * i / fs));
    clean.push(x.data(), x.size());
    truthy("No clip runs on clean sine", clean.clippedBuckets() == 0);
  }

  // ---- 8) EngineHub integration -------------------------------------------
  {
    EngineHub hub;
    hub.configureSampleRate(fs);
    EngineConfig cfg;
    cfg.fftSize = 4096;
    cfg.fraction = 3;
    cfg.spectrumEnabled = true;
    cfg.pitchEnabled = true;
    cfg.waveformEnabled = true;
    hub.setConfig(cfg);

    std::vector<float> chunk(512);
    double phase = 0.0;
    const double f0 = 1000.0, amp = 0.1;
    const size_t chunks = static_cast<size_t>(2.0 * fs) / chunk.size();
    for (size_t c = 0; c < chunks; ++c) {
      for (size_t i = 0; i < chunk.size(); ++i) {
        phase += f0 / fs;
        chunk[i] = static_cast<float>(amp * std::sin(2.0 * 3.14159265358979323846 * phase));
      }
      hub.processChunk(chunk.data(), chunk.size(), 0, true);
      hub.analysisTick();
    }
    MeterFrame m = hub.meterFrame();
    near("Hub Z-fast @1 kHz −20 dBFS sine", m.zFastDb, -23.01, 0.3);
    near("Hub A≈Z at 1 kHz", m.aFastDb - m.zFastDb, 0.0, 0.3);
    near("Hub Leq(Z) over run", m.leqZDb, -23.01, 0.3);
    truthy("Hub peak-hold ≈ amp", std::fabs(m.peakHoldDb - db(amp)) < 0.2);
    truthy("Hub no clip runs at −20 dBFS", m.clipRuns == 0);

    BandsSnapshot b = hub.bandsSnapshot();
    truthy("Hub bands computed", b.sequence > 0 && b.centers.size() == 30);
    size_t k1 = 0;
    for (size_t i = 0; i < b.centers.size(); ++i)
      if (std::fabs(b.centers[i] - 1000.0) < 1) k1 = i;
    near("Hub band @1 kHz", b.levelsDb[k1], -23.01, 1.0);

    PitchSnapshot ps = hub.pitchSnapshot();
    near("Hub pitch @1 kHz", ps.freq, 1000.0, 2.0);
    truthy("Hub pitch voiced", ps.voiced);

    SpectrumSnapshot ss = hub.spectrumSnapshot();
    truthy("Hub spectrum bins = fft/2+1", ss.binsDb.size() == 4096 / 2 + 1);

    std::vector<WaveBucket> wb(120);
    truthy("Hub waveform buckets", hub.waveSnapshot(wb.data(), wb.size()) > 20);
  }

  // ---- 9) RT60: synthetic decays with known reverb time -------------------
  {
    // Decaying white noise: 60 dB over T seconds → amplitude ~ e^(−6.9078·t/T).
    auto makeDecay = [&](double T, double floorDb, size_t n) {
      std::vector<float> x(n);
      uint32_t rng = 0xC0FFEE01;
      const double k = 6.907755278982137 / T;  // ln(10^(60/20)) / T
      const double floorAmp = std::pow(10.0, floorDb / 20.0);
      for (size_t i = 0; i < n; ++i) {
        rng ^= rng << 13;
        rng ^= rng >> 17;
        rng ^= rng << 5;
        const double w1 = (static_cast<double>(rng) / 2147483648.0) - 1.0;
        rng ^= rng << 13;
        rng ^= rng >> 17;
        rng ^= rng << 5;
        const double w2 = (static_cast<double>(rng) / 2147483648.0) - 1.0;
        const double t = static_cast<double>(i) / fs;
        x[i] = static_cast<float>(0.7 * w1 * std::exp(-k * t) + floorAmp * w2);
      }
      return x;
    };

    const std::vector<float> decay = makeDecay(0.6, -75.0, static_cast<size_t>(fs * 3.5));
    Rt60Analysis a = Rt60::analyze(decay.data(), decay.size(), fs);
    truthy("RT60 returns 6 octave bands + broadband", a.bands.size() == 7);
    const Rt60BandResult& bb = a.bands.back();
    truthy("RT60 broadband VALID on clean decay", bb.valid);
    near("RT60 broadband T20→RT60 (T=0.6 s)", bb.t20Rt60Sec, 0.6, 0.09);
    near("RT60 broadband T30→RT60 (T=0.6 s)", bb.t30Rt60Sec, 0.6, 0.09);
    truthy("RT60 broadband fit quality R²>0.95", bb.r2 > 0.95);
    // Mid band (1 kHz) — octave-filtered noise jitters more; looser tolerance.
    const Rt60BandResult* k1 = nullptr;
    for (const auto& b : a.bands)
      if (b.bandHz == 1000.0) k1 = &b;
    truthy("RT60 1 kHz band valid", k1 != nullptr && k1->valid);
    near("RT60 1 kHz band T20→RT60", k1->t20Rt60Sec, 0.6, 0.12);
    truthy("RT60 display curve produced", a.curveDb.size() > 100);

    // Insufficient decay range (floor at −18 dB) → NEVER a fabricated RT60.
    const std::vector<float> shallow = makeDecay(0.6, -18.0, static_cast<size_t>(fs * 3.5));
    Rt60Analysis s = Rt60::analyze(shallow.data(), shallow.size(), fs);
    const Rt60BandResult& sb = s.bands.back();
    truthy("RT60 INVALID when decay range insufficient (Q-integrity)", !sb.valid && sb.t20Rt60Sec == 0.0);
    truthy("RT60 reports the honest available range", sb.decayRangeDb < 35.0);
  }

  // ---- 10) RT60 capture state machine (EngineHub) -------------------------
  {
    EngineHub hub;
    hub.configureSampleRate(fs);
    hub.rt60Arm();
    // Silence: stays ARMED (no trigger).
    std::vector<float> quiet(4096, 0.0f);
    for (int i = 0; i < 8; ++i) hub.processChunk(quiet.data(), quiet.size(), 0, true);
    truthy("RT60 capture stays ARMED in silence", hub.rt60State() == Rt60State::Armed);
    // Burst + decay: triggers, records 3.5 s, analyzes, lands DONE.
    uint32_t rng = 0xABCD1234;
    const double k = 6.907755278982137 / 0.5;
    size_t idx = 0;
    std::vector<float> chunk(4096);
    const size_t total = static_cast<size_t>(fs * 4.2);
    for (size_t off = 0; off < total; off += chunk.size()) {
      for (size_t i = 0; i < chunk.size(); ++i, ++idx) {
        rng ^= rng << 13;
        rng ^= rng >> 17;
        rng ^= rng << 5;
        const double w = (static_cast<double>(rng) / 2147483648.0) - 1.0;
        const double t = static_cast<double>(idx) / fs;
        chunk[i] = static_cast<float>(0.7 * w * std::exp(-k * t) + 1e-4 * w);
      }
      hub.processChunk(chunk.data(), chunk.size(), 0, true);
    }
    truthy("RT60 capture reaches DONE after burst+decay", hub.rt60State() == Rt60State::Done);
    const Rt60Analysis res = hub.rt60Result();
    truthy("RT60 capture produced bands", res.bands.size() == 7);
    near("RT60 captured broadband (T=0.5 s)", res.bands.back().t20Rt60Sec, 0.5, 0.09);
    hub.rt60Cancel();
    truthy("RT60 cancel returns to OFF", hub.rt60State() == Rt60State::Off);
  }

  std::printf("\n==== GOLDEN RESULT: %d passed, %d failed ====\n", g_pass, g_fail);
  return g_fail == 0 ? 0 : 1;
}
