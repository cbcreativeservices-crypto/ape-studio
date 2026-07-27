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
#include "../ios/core/Binaural.hpp"
#include "../ios/core/Biquad.hpp"
#include "../ios/core/Effects.hpp"
#include "../ios/core/EngineHub.hpp"
#include "../ios/core/Fft.hpp"
#include "../ios/core/Generator.hpp"
#include "../ios/core/Modular.hpp"
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

  // ---- 6b) ADDITIVE generator (HV-2 Build 1) ------------------------------
  {
    const uint32_t H = 12;
    const size_t skip = static_cast<size_t>(fs * 0.1);  // fade-in + ramps settle
    const size_t len = static_cast<size_t>(fs);         // 1 s → integer cycles
    // Magnitude at frequency f via sin/cos correlation over an exact integer
    // number of cycles (all test tones are integer Hz over a 1 s window, so
    // the correlation is exactly orthogonal to every other harmonic).
    auto magAt = [&](const std::vector<float>& x, size_t off, size_t n, double f) {
      double sc = 0.0, ss = 0.0;
      for (size_t i = 0; i < n; ++i) {
        const double w = 2.0 * 3.14159265358979323846 * f * static_cast<double>(i) / fs;
        sc += x[off + i] * std::cos(w);
        ss += x[off + i] * std::sin(w);
      }
      return 2.0 * std::sqrt(sc * sc + ss * ss) / static_cast<double>(n);
    };
    // Marshal the HV-2 flat layout [f0, a1..a12, p1..p12].
    auto setParams = [&](Generator& gg, double f0, const double* amps, const double* degs) {
      double v[25];
      v[0] = f0;
      for (uint32_t h = 0; h < H; ++h) {
        v[1 + h] = amps[h];
        v[1 + H + h] = degs[h];
      }
      gg.setAdditive(v, 25);
    };
    double zeros[12] = {0};
    double ones[12], d180[12];
    for (int h = 0; h < 12; ++h) {
      ones[h] = 1.0;
      d180[h] = 180.0;
    }

    // (a) Spectral correctness: square-12 (odd harmonics at 1/n) at f0=480 Hz
    //     (integer samples per cycle). Expected |Hn| = 0.1 · norm · aₙ with
    //     norm = 1/Σaₙ (Σ = 1 + 1/3 + 1/5 + 1/7 + 1/9 + 1/11 ≈ 1.8782 > 1
    //     → attenuating).
    double sq[12] = {1, 0, 1.0 / 3, 0, 1.0 / 5, 0, 1.0 / 7, 0, 1.0 / 9, 0, 1.0 / 11, 0};
    Generator g;
    g.configure(fs);
    g.setMode(GenMode::Additive);
    setParams(g, 480.0, sq, zeros);
    g.start();
    std::vector<float> buf(skip + len);
    g.render(buf.data(), (uint32_t)buf.size());
    double sumA = 0.0, sumA2 = 0.0;
    for (double a : sq) {
      sumA += a;
      sumA2 += a * a;
    }
    const double norm = 1.0 / sumA;
    const double lvl = 0.1;  // default −20 dBFS
    near("Additive square-12 |H1|", magAt(buf, skip, len, 480.0), lvl * norm, 0.002);
    near("Additive square-12 |H3|", magAt(buf, skip, len, 1440.0), lvl * norm / 3.0, 0.002);
    near("Additive square-12 |H5|", magAt(buf, skip, len, 2400.0), lvl * norm / 5.0, 0.002);
    near("Additive square-12 |H11|", magAt(buf, skip, len, 5280.0), lvl * norm / 11.0, 0.002);
    truthy("Additive square-12 even H2 absent", magAt(buf, skip, len, 960.0) < 1e-4);
    double ms = 0.0;
    for (size_t i = skip; i < buf.size(); ++i) ms += (double)buf[i] * buf[i];
    ms /= (double)len;
    near("Additive square-12 RMS (dB)", 10.0 * std::log10(ms),
         10.0 * std::log10(lvl * norm * lvl * norm * sumA2 / 2.0), 0.05);

    // (b) Normalization bound: pathological all-amps-1 set through the SAME
    //     Q4 cap chain as sine — request 0 dBFS while LOCKED → −12 effective,
    //     and the summed output must stay under that cap.
    Generator gb;
    gb.configure(fs);
    gb.setMode(GenMode::Additive);
    setParams(gb, 480.0, ones, zeros);
    gb.setLevelDb(0.0);
    near("Additive Q4 cap chain: locked effective level", gb.effectiveLevelDb(), -12.0, 1e-9);
    gb.start();
    std::vector<float> b2(static_cast<size_t>(fs));
    gb.render(b2.data(), (uint32_t)b2.size());
    double mxB = 0.0;
    for (float v : b2) mxB = std::max(mxB, (double)std::fabs(v));
    truthy("Additive all-ones peak ≤ −12 dBFS cap",
           mxB <= std::pow(10.0, -12.0 / 20.0) + 1e-6);
    truthy("Additive all-ones audible (not over-normalized)", mxB > 0.02);
    near("Additive norm status = 1/Σaₙ (all-ones → 1/12)", gb.additiveNorm(), 1.0 / 12.0, 1e-9);

    // (c) Ramp continuity: worst-case jump square→all-ones + 180° phases must
    //     glide (~8 ms), never click, and never pierce the cap mid-ramp. A
    //     hard swap would show a sample delta ~10× the steady maximum; the
    //     ramps add only a small slope on top of the steadier of the two
    //     endpoint waveshapes, so 1.5× separates cleanly.
    std::vector<float> b3(static_cast<size_t>(fs * 0.2));
    g.render(b3.data(), (uint32_t)b3.size());  // steady state A (square-12)
    double steadyA = 0.0;
    for (size_t i = 1; i < b3.size(); ++i)
      steadyA = std::max(steadyA, (double)std::fabs(b3[i] - b3[i - 1]));
    setParams(g, 480.0, ones, d180);
    std::vector<float> b4(static_cast<size_t>(fs * 0.2));
    g.render(b4.data(), (uint32_t)b4.size());  // transition + settle
    double dmax = std::fabs((double)b4[0] - (double)b3.back());
    double mxT = 0.0;
    for (size_t i = 0; i < b4.size(); ++i) {
      if (i > 0) dmax = std::max(dmax, (double)std::fabs(b4[i] - b4[i - 1]));
      mxT = std::max(mxT, (double)std::fabs(b4[i]));
    }
    std::vector<float> b5(static_cast<size_t>(fs * 0.2));
    g.render(b5.data(), (uint32_t)b5.size());  // steady state B
    double steadyB = 0.0;
    for (size_t i = 1; i < b5.size(); ++i)
      steadyB = std::max(steadyB, (double)std::fabs(b5[i] - b5[i - 1]));
    truthy("Additive param jump click-free (Δ ≤ 1.5×steady)",
           dmax <= std::max(steadyA, steadyB) * 1.5 + 1e-6);
    truthy("Additive norm bound holds mid-ramp (|x| ≤ −20 dBFS)", mxT <= lvl + 1e-6);

    // (d) Phase handling: {a1=1, a3=1/3} with φ3=0° vs 180°. Same RMS; peaks
    //     differ analytically: max|2s−(4/3)s³| = 0.9428 vs max|(4/3)s³| = 4/3
    //     (s = sin), ratio √2. Fresh generators → deterministic start phase.
    double aPair[12] = {1, 0, 1.0 / 3, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    double phB[12] = {0};
    phB[2] = 180.0;
    auto peakRms = [&](const double* degs, double& peak, double& rmsDb) {
      Generator gp;
      gp.configure(fs);
      gp.setMode(GenMode::Additive);
      setParams(gp, 480.0, aPair, degs);
      gp.start();
      std::vector<float> b(skip + len);
      gp.render(b.data(), (uint32_t)b.size());
      peak = 0.0;
      double m = 0.0;
      for (size_t i = skip; i < b.size(); ++i) {
        peak = std::max(peak, (double)std::fabs(b[i]));
        m += (double)b[i] * b[i];
      }
      rmsDb = 10.0 * std::log10(m / (double)len);
    };
    double pkA, rmsA, pkB, rmsB;
    peakRms(zeros, pkA, rmsA);
    peakRms(phB, pkB, rmsB);
    near("Additive phase flip: RMS unchanged (dB)", rmsB - rmsA, 0.0, 0.05);
    near("Additive phase flip: peak ratio = √2", pkB / pkA, 1.41421, 0.02);

    // (e) Nyquist omission: f0 = 5 kHz, all 12 amps 1 → only n=1..4 (< 24 kHz)
    //     synthesize; n ≥ 5 silently omitted, so NO energy at their alias
    //     frequencies. norm stays 1/12 (conservative full-target sum — see
    //     Generator.hpp).
    Generator gn;
    gn.configure(fs);
    gn.setMode(GenMode::Additive);
    setParams(gn, 5000.0, ones, zeros);
    gn.start();
    std::vector<float> bn(skip + len);
    gn.render(bn.data(), (uint32_t)bn.size());
    near("Additive Nyquist: H4 (20 kHz) present", magAt(bn, skip, len, 20000.0), lvl / 12.0,
         0.0005);
    truthy("Additive Nyquist: H5 (25 kHz) NOT aliased to 23 kHz",
           magAt(bn, skip, len, 23000.0) < 1e-4);
    truthy("Additive Nyquist: H6 (30 kHz) NOT aliased to 18 kHz",
           magAt(bn, skip, len, 18000.0) < 1e-4);

    // (f) RUNNING mode switch is click-free (HV-2 Build 3's in-place retune
    //     idiom: toggleSolo genSet({mode: sine}) over a playing model, and
    //     PLAY MODEL genSet({mode: additive}) over a running solo). The
    //     retrigger must dip the 10 ms envelope to zero, apply the reset at
    //     the bottom, and fade back — never step the output (the pre-fix
    //     behavior reset the 12 phase accumulators under a full envelope:
    //     worst-case ~2× amp single-sample jump). Bridge order matters:
    //     targets first, then mode — matching the fixed genSet marshaling.
    {
      Generator gr;
      gr.configure(fs);
      gr.setMode(GenMode::Sine);
      gr.setFrequency(480.0);
      gr.start();
      // +24 samples ≈ a quarter cycle at 480 Hz: the sine segment ends near
      // its PEAK (~+0.1) while the 90/270° pulse model's first sample is ~0,
      // so the pre-fix instant snap is a near-full-amplitude jump this test
      // deterministically catches; the env dip renders it smooth.
      std::vector<float> s1(static_cast<size_t>(fs * 0.2) + 24);
      gr.render(s1.data(), (uint32_t)s1.size());  // fade-in + steady sine
      double steadySine = 0.0;
      for (size_t i = s1.size() / 2; i < s1.size(); ++i)
        steadySine = std::max(steadySine, (double)std::fabs(s1[i] - s1[i - 1]));
      // In-place switch to a pulse-like model (90/270° phase offsets — the
      // finding's worst case for the old snap).
      double pulseDeg[12] = {90, 270, 90, 270, 90, 270, 90, 270, 90, 270, 90, 270};
      setParams(gr, 480.0, ones, pulseDeg);
      gr.setMode(GenMode::Additive);
      std::vector<float> s2(static_cast<size_t>(fs * 0.2));
      gr.render(s2.data(), (uint32_t)s2.size());  // dip + fade-up + settle
      std::vector<float> s3(static_cast<size_t>(fs * 0.2));
      gr.render(s3.data(), (uint32_t)s3.size());  // steady additive
      double steadyAdd = 0.0, msAdd = 0.0;
      for (size_t i = 1; i < s3.size(); ++i)
        steadyAdd = std::max(steadyAdd, (double)std::fabs(s3[i] - s3[i - 1]));
      for (float v : s3) msAdd += (double)v * v;
      const double steadyMax = std::max(steadySine, steadyAdd);
      double dmaxSw = std::fabs((double)s2[0] - (double)s1.back());
      for (size_t i = 1; i < s2.size(); ++i)
        dmaxSw = std::max(dmaxSw, (double)std::fabs(s2[i] - s2[i - 1]));
      truthy("Running sine→additive switch click-free (Δ ≤ 1.5×steady)",
             dmaxSw <= steadyMax * 1.5 + 1e-6);
      truthy("Running sine→additive switch: tone comes back",
             10.0 * std::log10(msAdd / (double)s3.size()) > -40.0);
      // And back to sine in place (the solo-over-model direction).
      gr.setMode(GenMode::Sine);
      std::vector<float> s4(static_cast<size_t>(fs * 0.2));
      gr.render(s4.data(), (uint32_t)s4.size());
      double dmaxBack = std::fabs((double)s4[0] - (double)s3.back());
      double msBack = 0.0;
      for (size_t i = 1; i < s4.size(); ++i)
        dmaxBack = std::max(dmaxBack, (double)std::fabs(s4[i] - s4[i - 1]));
      for (size_t i = s4.size() / 2; i < s4.size(); ++i) msBack += (double)s4[i] * s4[i];
      truthy("Running additive→sine switch click-free (Δ ≤ 1.5×steady)",
             dmaxBack <= steadyMax * 1.5 + 1e-6);
      truthy("Running additive→sine switch: sine comes back",
             10.0 * std::log10(msBack / (double)(s4.size() - s4.size() / 2)) > -40.0);
    }
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

  // ---- 9) Speaker-safety high-pass (route-aware generator HPF, engineVersion 4)
  {
    // 9a. Filter DESIGN — 2nd-order Butterworth HP; magnitude matches the JS
    //     speakerSafety response |H|^2 = r^4/(1+r^4), r = f/fc, fc = 150 Hz.
    BiquadCascade hp;
    hp.sections.push_back(Biquad::highpass(150.0, fs));
    near("Speaker HPF -3 dB at corner (150 Hz)", db(hp.measureGainAt(150.0, fs)), -3.01, 0.3);
    near("Speaker HPF -12 dB/oct one octave below (75 Hz)", db(hp.measureGainAt(75.0, fs)), -12.30, 0.5);
    near("Speaker HPF passband unity (2 kHz)", db(hp.measureGainAt(2000.0, fs)), 0.0, 0.2);
    truthy("Speaker HPF rejects sub-bass (20 Hz <= -28 dB)", db(hp.measureGainAt(20.0, fs)) < -28.0);

    // 9b. End-to-end through the Generator: OFF BY DEFAULT (regression — the
    //     other vectors assume a flat path), ENGAGED attenuates lows, passband
    //     untouched.
    auto sineMeanDb = [&](double freq, bool engage) {
      Generator g;
      g.configure(fs);
      g.setMode(GenMode::Sine);
      g.setFrequency(freq);
      g.setLevelDb(-20.0);
      if (engage) g.setHpf(150.0);
      g.start();
      std::vector<float> buf(static_cast<size_t>(fs * 0.6));
      g.render(buf.data(), (uint32_t)buf.size());
      const size_t skip = static_cast<size_t>(fs * 0.2);
      double sumSq = 0.0;
      for (size_t i = skip; i < buf.size(); ++i) sumSq += (double)buf[i] * buf[i];
      return 10.0 * std::log10(sumSq / (double)(buf.size() - skip));
    };
    near("Speaker HPF OFF by default: 75 Hz sine flat (-23 dBFS)", sineMeanDb(75.0, false), -23.01, 0.3);
    near("Speaker HPF ON: 75 Hz sine attenuated ~12.3 dB", sineMeanDb(75.0, true), -35.31, 0.6);
    near("Speaker HPF ON: 2 kHz sine passband untouched", sineMeanDb(2000.0, true), -23.01, 0.3);

    // 9c. Route change is CLICK-FREE (crossfade, not an abrupt insert) — the
    //     boundary sample at a mid-tone engage/disengage must not step. (The
    //     abrupt version steps the low end by ~the filtered/raw amplitude
    //     difference and clicks loudly on a headphone plug/unplug.)
    {
      Generator g;
      g.configure(fs);
      g.setMode(GenMode::Sine);
      g.setFrequency(75.0);
      g.setLevelDb(-20.0);
      g.setHpf(150.0);  // start on the speaker (engaged)
      g.start();
      std::vector<float> a(static_cast<size_t>(fs * 0.3));
      g.render(a.data(), (uint32_t)a.size());
      g.setHpf(0.0);  // route → headphones mid-tone (disengage)
      std::vector<float> b(static_cast<size_t>(fs * 0.3));
      g.render(b.data(), (uint32_t)b.size());
      // Per-sample delta of the settled RAW tone (b's tail, crossfade done).
      double steadyRaw = 0.0;
      for (size_t i = b.size() * 3 / 4; i < b.size(); ++i)
        steadyRaw = std::max(steadyRaw, (double)std::fabs(b[i] - b[i - 1]));
      const double jumpAB = std::fabs((double)b[0] - (double)a.back());
      truthy("Route HPF disengage click-free (boundary step <= 2x steady)", jumpAB <= steadyRaw * 2.0 + 1e-6);
      g.setHpf(150.0);  // route → speaker mid-tone (re-engage)
      std::vector<float> c(static_cast<size_t>(fs * 0.3));
      g.render(c.data(), (uint32_t)c.size());
      const double jumpBC = std::fabs((double)c[0] - (double)b.back());
      truthy("Route HPF engage click-free (boundary step <= 2x steady)", jumpBC <= steadyRaw * 2.0 + 1e-6);

      // 9d. The route-change GATE actually mutes: a mid-tone change must drop the
      //     output to ~silence during the hold window (masking the switch), then
      //     recover to full level. (b was rendered right after setHpf(0).)
      double holdPeak = 0.0;  // 12–28 ms after the change → inside fade-out+hold
      for (size_t i = static_cast<size_t>(fs * 0.012); i < static_cast<size_t>(fs * 0.028); ++i)
        holdPeak = std::max(holdPeak, (double)std::fabs(b[i]));
      truthy("Route gate mutes during the switch (hold peak < 0.005)", holdPeak < 0.005);
      double tailPeak = 0.0;  // end of c → fully recovered
      for (size_t i = c.size() * 3 / 4; i < c.size(); ++i) tailPeak = std::max(tailPeak, (double)std::fabs(c[i]));
      truthy("Route gate recovers to full level after fade-in", tailPeak > 0.02);
    }

    // 9e. HPF engaging DURING the onset (the route layer sets it right after
    //     start — a real ordering race) must NOT gate: that ducks the tone start
    //     into a soft "puff". The onset must rise straight to full with no
    //     near-silent window.
    {
      Generator g;
      g.configure(fs);
      g.setMode(GenMode::Sine);
      g.setFrequency(220.0);
      g.setLevelDb(-20.0);
      g.start();  // start FIRST (hpf still 0), then engage mid-onset:
      std::vector<float> on(static_cast<size_t>(fs * 0.006));
      g.render(on.data(), (uint32_t)on.size());
      g.setHpf(150.0);
      std::vector<float> rest(static_cast<size_t>(fs * 0.20));
      g.render(rest.data(), (uint32_t)rest.size());
      // No gated silent window in the 15–80 ms region after the change.
      double minWinPeak = 1.0;
      const size_t win = static_cast<size_t>(fs * 0.005);
      for (size_t s = static_cast<size_t>(fs * 0.015); s + win < rest.size() && s < static_cast<size_t>(fs * 0.08);
           s += win) {
        double p = 0.0;
        for (size_t i = s; i < s + win; ++i) p = std::max(p, (double)std::fabs(rest[i]));
        minWinPeak = std::min(minWinPeak, p);
      }
      truthy("HPF engage during onset does NOT gate (no puff)", minWinPeak > 0.02);
    }
  }

  // ---- 10) Stereo dual-oscillator (engineVersion 5) -----------------------
  {
    auto magAtCh = [&](const std::vector<float>& buf, size_t skip, size_t len, double f) {
      double re = 0.0, im = 0.0;
      const double w = 2.0 * 3.14159265358979323846 * f / fs;
      for (size_t i = 0; i < len; ++i) {
        const double x = buf[skip + i];
        re += x * std::cos(w * i);
        im -= x * std::sin(w * i);
      }
      return 2.0 * std::sqrt(re * re + im * im) / len;
    };
    Generator g;
    g.configure(fs);
    g.setMode(GenMode::Sine);
    g.setLevelDb(-20.0);
    g.setStereo(true, 220.0, 660.0);  // L = 220 Hz, R = 660 Hz (hard-panned)
    g.start();
    std::vector<float> Lb(static_cast<size_t>(fs * 0.4)), Rb(static_cast<size_t>(fs * 0.4));
    g.renderStereo(Lb.data(), Rb.data(), (uint32_t)Lb.size());
    const size_t skip = static_cast<size_t>(fs * 0.2), len = Lb.size() - skip;
    // Each channel carries ITS tone and NOT the other's.
    truthy("Stereo L has 220 Hz", magAtCh(Lb, skip, len, 220.0) > 0.05);
    truthy("Stereo L excludes 660 Hz (hard-panned)", magAtCh(Lb, skip, len, 660.0) < 0.005);
    truthy("Stereo R has 660 Hz", magAtCh(Rb, skip, len, 660.0) > 0.05);
    truthy("Stereo R excludes 220 Hz (hard-panned)", magAtCh(Rb, skip, len, 220.0) < 0.005);

    // Stereo + speaker HPF: the low L tone is attenuated per-channel; R (660 Hz,
    // in the passband) is not.
    Generator gh;
    gh.configure(fs);
    gh.setMode(GenMode::Sine);
    gh.setLevelDb(-20.0);
    gh.setStereo(true, 90.0, 660.0);  // L low (below corner), R in passband
    gh.setHpf(150.0);
    gh.start();
    std::vector<float> Lh(static_cast<size_t>(fs * 0.4)), Rh(static_cast<size_t>(fs * 0.4));
    gh.renderStereo(Lh.data(), Rh.data(), (uint32_t)Lh.size());
    truthy("Stereo HPF attenuates the low L channel", magAtCh(Lh, skip, len, 90.0) < magAtCh(Rh, skip, len, 660.0));

    // A mono caller (R = nullptr) still works and equals the mono path — stereo
    // OFF leaves the existing behavior byte-for-byte (regression).
    Generator gm;
    gm.configure(fs);
    gm.setMode(GenMode::Sine);
    gm.setFrequency(440.0);
    gm.setLevelDb(-20.0);
    gm.start();
    std::vector<float> mono(static_cast<size_t>(fs * 0.4));
    gm.render(mono.data(), (uint32_t)mono.size());
    near("Mono render unchanged after stereo refactor (440 Hz RMS)",
         10.0 * std::log10([&] {
           double s = 0.0;
           for (size_t i = skip; i < mono.size(); ++i) s += (double)mono[i] * mono[i];
           return s / (mono.size() - skip);
         }()),
         -23.01, 0.3);
  }

  // ---- 11) Effects path — RBJ EQ designs + EqEffect end-to-end ------------
  {
    auto gainAt = [&](const Biquad& bq, double f) {
      BiquadCascade c;
      c.sections.push_back(bq);
      return db(c.measureGainAt(f, fs));
    };
    // 11a. Filter DESIGNS (RBJ cookbook).
    near("EQ peaking +6 dB @1 kHz (at band)", gainAt(Biquad::peaking(1000.0, 1.0, 6.0, fs), 1000.0), 6.0, 0.3);
    near("EQ peaking +6 dB @1 kHz (far, 100 Hz)", gainAt(Biquad::peaking(1000.0, 1.0, 6.0, fs), 100.0), 0.0, 0.4);
    near("EQ low-shelf +6 dB @200 (deep 40 Hz)", gainAt(Biquad::lowShelf(200.0, 0.707, 6.0, fs), 40.0), 6.0, 0.5);
    near("EQ low-shelf +6 dB @200 (high 8 kHz ~0)", gainAt(Biquad::lowShelf(200.0, 0.707, 6.0, fs), 8000.0), 0.0, 0.3);
    near("EQ high-shelf +6 dB @2 kHz (10 kHz)", gainAt(Biquad::highShelf(2000.0, 0.707, 6.0, fs), 10000.0), 6.0, 0.5);
    near("EQ high-shelf +6 dB @2 kHz (100 Hz ~0)", gainAt(Biquad::highShelf(2000.0, 0.707, 6.0, fs), 100.0), 0.0, 0.3);
    near("EQ low-pass -3 dB @1 kHz corner", gainAt(Biquad::lowpass(1000.0, 0.707, fs), 1000.0), -3.0, 0.4);
    truthy("EQ low-pass rejects highs (8 kHz <= -30 dB)", gainAt(Biquad::lowpass(1000.0, 0.707, fs), 8000.0) < -30.0);

    // 11b. EqEffect end-to-end (stereo): a +6 dB peak at 1 kHz lifts a 1 kHz
    //      tone, leaves 100 Hz alone, and bypass is exact passthrough.
    auto eqGainDb = [&](EqEffect& eq, double f) {
      const size_t settle = static_cast<size_t>(fs * 0.2), meas = static_cast<size_t>(fs * 0.3);
      const double w = 2.0 * 3.14159265358979323846 * f / fs;
      std::vector<float> L(settle + meas), R(settle + meas);
      for (size_t i = 0; i < L.size(); ++i) L[i] = R[i] = (float)std::sin(w * i);
      eq.processStereo(L.data(), R.data(), (uint32_t)L.size());
      double si = 0.0, so = 0.0;
      for (size_t i = settle; i < L.size(); ++i) {
        const double x = std::sin(w * i);
        si += x * x;
        so += (double)L[i] * L[i];
      }
      return 10.0 * std::log10((so + 1e-30) / (si + 1e-30));
    };
    EqEffect eq;
    eq.configure(fs);
    eq.setEnabled(true);
    eq.setBand(0, EqEffect::Peak, 1000.0, 1.0, 6.0);
    near("EqEffect +6 dB peak lifts 1 kHz", eqGainDb(eq, 1000.0), 6.0, 0.5);
    near("EqEffect +6 dB peak leaves 100 Hz", eqGainDb(eq, 100.0), 0.0, 0.5);

    EqEffect eqBypass;
    eqBypass.configure(fs);
    eqBypass.setBand(0, EqEffect::Peak, 1000.0, 1.0, 6.0);  // configured but disabled
    truthy("EqEffect disabled = exact passthrough", [&] {
      std::vector<float> L(256), R(256), Lin(256);
      for (size_t i = 0; i < L.size(); ++i) L[i] = Lin[i] = R[i] = (float)std::sin(0.1 * i);
      eqBypass.processStereo(L.data(), R.data(), (uint32_t)L.size());
      for (size_t i = 0; i < L.size(); ++i)
        if (std::fabs(L[i] - Lin[i]) > 1e-7f) return false;
      return true;
    }());
  }

  // ---- 12) Effects path — Delay, Mod, Dynamics, Distortion, Reverb, Stereo
  {
    // Helper: sine gain (dB) through a stereo effect, after settle.
    auto fxSineGainDb = [&](auto& fxNode, double f, double amp) {
      const size_t settle = static_cast<size_t>(fs * 0.3), meas = static_cast<size_t>(fs * 0.3);
      const double w = 2.0 * 3.14159265358979323846 * f / fs;
      std::vector<float> L(settle + meas), R(settle + meas);
      for (size_t i = 0; i < L.size(); ++i) L[i] = R[i] = (float)(amp * std::sin(w * i));
      fxNode.processStereo(L.data(), R.data(), (uint32_t)L.size());
      double so = 0.0;
      for (size_t i = settle; i < L.size(); ++i) so += (double)L[i] * L[i];
      const double si = amp * amp * 0.5 * (double)meas;
      return 10.0 * std::log10((so + 1e-30) / (si + 1e-30));
    };
    auto magIn = [&](const std::vector<float>& b, size_t skip, size_t len, double f) {
      double re = 0.0, im = 0.0;
      const double w = 2.0 * 3.14159265358979323846 * f / fs;
      for (size_t i = 0; i < len; ++i) { re += b[skip + i] * std::cos(w * i); im -= b[skip + i] * std::sin(w * i); }
      return 2.0 * std::sqrt(re * re + im * im) / len;
    };

    // 12a. DELAY — impulse: echo lands at T; second echo ≈ feedback ratio.
    {
      DelayEffect d;
      d.setParam(1, 100.0);  // 100 ms
      d.setParam(2, 0.5);
      d.setParam(3, 1.0);    // full wet: taps only
      d.setParam(5, 20000.0);
      d.configure(fs);
      d.setEnabled(true);
      std::vector<float> L(static_cast<size_t>(fs * 0.35), 0.0f), R(L.size(), 0.0f);
      L[0] = R[0] = 1.0f;
      d.processStereo(L.data(), R.data(), (uint32_t)L.size());
      auto peakNear = [&](double tSec) {
        const size_t c = static_cast<size_t>(tSec * fs);
        double p = 0.0;
        for (size_t i = c - 200; i < c + 200 && i < L.size(); ++i) p = std::max(p, (double)std::fabs(L[i]));
        return p;
      };
      const double t1 = peakNear(0.100), t2 = peakNear(0.200);
      truthy("Delay: echo at 100 ms", t1 > 0.5);
      near("Delay: 2nd echo / 1st = feedback", t2 / (t1 + 1e-12), 0.5, 0.12);
    }
    // 12b. FLANGER comb — static (depth 0) 2 ms delay at 50% mix: notch at
    //      250 Hz ((2k−1)/2τ), flat at 500 Hz.
    {
      ModEffect m;
      m.configure(fs);
      m.setEnabled(true);
      m.setParam(1, 1.0);  // flanger
      m.setParam(3, 0.0);  // depth 0 = static comb
      m.setParam(6, 2.0);  // 2 ms
      m.setParam(5, 0.5);
      truthy("Flanger comb: notch at 250 Hz (<= -20 dB)", fxSineGainDb(m, 250.0, 0.3) < -20.0);
      ModEffect m2;
      m2.configure(fs);
      m2.setEnabled(true);
      m2.setParam(1, 1.0); m2.setParam(3, 0.0); m2.setParam(6, 2.0); m2.setParam(5, 0.5);
      near("Flanger comb: flat at 500 Hz", fxSineGainDb(m2, 500.0, 0.3), 0.0, 1.0);
    }
    // 12c. PHASER — static 4-stage: some frequency is deeply notched, nothing
    //      wildly boosted (uneven sparse notches — the defining signature).
    {
      double minG = 100.0, maxG = -100.0;
      for (int k = 0; k < 40; ++k) {
        ModEffect p;
        p.configure(fs);
        p.setEnabled(true);
        p.setParam(1, 2.0); p.setParam(3, 0.0); p.setParam(7, 1000.0);
        p.setParam(8, 4.0); p.setParam(5, 0.5); p.setParam(4, 0.0);
        const double f = 100.0 * std::pow(10000.0 / 100.0, k / 39.0);
        const double g = fxSineGainDb(p, f, 0.3);
        minG = std::min(minG, g);
        maxG = std::max(maxG, g);
      }
      truthy("Phaser: a deep notch exists (<= -10 dB)", minG < -10.0);
      truthy("Phaser: no runaway boost (<= +3.5 dB)", maxG < 3.5);
    }
    // 12d. COMPRESSOR — −6 dBFS sine over a −20 threshold at 4:1 → ~10.5 dB GR.
    {
      DynamicsEffect c(DynamicsEffect::Compressor);
      c.configure(fs);
      c.setEnabled(true);
      c.setParam(1, -20.0); c.setParam(2, 4.0); c.setParam(3, 5.0); c.setParam(4, 100.0);
      near("Compressor: 4:1 over 14 dB → ~10.5 dB GR", fxSineGainDb(c, 1000.0, 0.5), -10.5, 1.2);
      near("Compressor: grDb readout matches", c.grDb(), 10.5, 1.2);
    }
    // 12e. GATE — closed under threshold attenuates toward the range floor;
    //      open above passes at unity.
    {
      DynamicsEffect gq(DynamicsEffect::GateMode);
      gq.configure(fs);
      gq.setEnabled(true);
      gq.setParam(1, -30.0); gq.setParam(6, -40.0); gq.setParam(4, 60.0);
      truthy("Gate: closed under threshold (<= -30 dB)", fxSineGainDb(gq, 1000.0, 0.003) < -30.0);
      DynamicsEffect go(DynamicsEffect::GateMode);
      go.configure(fs);
      go.setEnabled(true);
      go.setParam(1, -30.0); go.setParam(6, -40.0);
      near("Gate: open above threshold (unity)", fxSineGainDb(go, 1000.0, 0.5), 0.0, 1.0);
    }
    // 12f. LIMITER — 0 dBFS sine against a −12 ceiling → output ~−12 dBFS.
    {
      DynamicsEffect lim(DynamicsEffect::LimiterMode);
      lim.configure(fs);
      lim.setEnabled(true);
      lim.setParam(8, -12.0); lim.setParam(4, 200.0);
      near("Limiter: 0 dBFS held to -12 ceiling", fxSineGainDb(lim, 1000.0, 1.0), -12.0, 1.2);
    }
    // 12g. DISTORTION — symmetric hard clip → odd harmonics only; asymmetric
    //      tube → even harmonics appear (the core lesson).
    {
      auto renderDist = [&](int type) {
        DistortionEffect dd;
        dd.configure(fs);
        dd.setEnabled(true);
        dd.setParam(1, (double)type); dd.setParam(2, 12.0); dd.setParam(3, 1.0); dd.setParam(4, 0.0);
        const double w = 2.0 * 3.14159265358979323846 * 480.0 / fs;
        std::vector<float> L(static_cast<size_t>(fs * 0.5)), R(L.size());
        for (size_t i = 0; i < L.size(); ++i) L[i] = R[i] = (float)(0.5 * std::sin(w * i));
        dd.processStereo(L.data(), R.data(), (uint32_t)L.size());
        return L;
      };
      const size_t skip = static_cast<size_t>(fs * 0.2);
      auto hard = renderDist(0);
      const size_t len = hard.size() - skip;
      truthy("Distortion hard: H3 present", magIn(hard, skip, len, 1440.0) > 0.01);
      truthy("Distortion hard: H2 absent (odd only)", magIn(hard, skip, len, 960.0) < 0.005);
      auto tube = renderDist(2);
      truthy("Distortion tube: H2 present (asymmetric → even)", magIn(tube, skip, len, 960.0) > 0.01);
    }
    // 12h. REVERB — impulse grows a decaying tail; late < early (RT60 0.5 s).
    {
      ReverbEffect rv;
      rv.setParam(1, 0.5); rv.setParam(2, 0.0); rv.setParam(4, 1.0);
      rv.configure(fs);
      rv.setEnabled(true);
      std::vector<float> L(static_cast<size_t>(fs * 0.8), 0.0f), R(L.size(), 0.0f);
      L[0] = R[0] = 1.0f;
      rv.processStereo(L.data(), R.data(), (uint32_t)L.size());
      auto energy = [&](double a, double b) {
        double e = 0.0;
        for (size_t i = (size_t)(a * fs); i < (size_t)(b * fs) && i < L.size(); ++i) e += (double)L[i] * L[i];
        return e;
      };
      const double early = energy(0.05, 0.15), late = energy(0.4, 0.5);
      truthy("Reverb: tail exists (early energy > 0)", early > 1e-7);
      truthy("Reverb: tail decays (late < early)", late < early);
    }
    // 12i. STEREO — width 0 collapses to mono; polarity invert flips R vs L.
    {
      StereoEffect st;
      st.configure(fs);
      st.setEnabled(true);
      st.setParam(1, 0.0);  // width 0 = mono
      std::vector<float> L(512), R(512);
      for (size_t i = 0; i < L.size(); ++i) {
        L[i] = (float)std::sin(0.05 * i);
        R[i] = (float)std::sin(0.11 * i);
      }
      st.processStereo(L.data(), R.data(), (uint32_t)L.size());
      bool mono = true;
      for (size_t i = 0; i < L.size(); ++i)
        if (std::fabs(L[i] - R[i]) > 1e-5f) { mono = false; break; }
      truthy("Stereo: width 0 collapses to mono (L == R)", mono);
      StereoEffect si;
      si.configure(fs);
      si.setEnabled(true);
      si.setParam(4, 1.0);  // invert R
      std::vector<float> L2(512), R2(512);
      for (size_t i = 0; i < L2.size(); ++i) L2[i] = R2[i] = (float)(0.5 * std::sin(0.05 * i));
      si.processStereo(L2.data(), R2.data(), (uint32_t)L2.size());
      bool anti = true;
      for (size_t i = 8; i < L2.size(); ++i)
        if (std::fabs(L2[i] + R2[i]) > 1e-4f) { anti = false; break; }
      truthy("Stereo: R-polarity invert → L = -R (cancels in mono)", anti);
    }
    // 12j. CHAIN — scalar dispatch + reset.
    {
      EffectChain ch;
      ch.configure(fs);
      truthy("Chain: idle by default", !ch.anyActive());
      ch.set(fx::Eq, 0, 1.0);
      truthy("Chain: fxSet enables a node", ch.anyActive());
      ch.reset();
      truthy("Chain: reset disables everything", !ch.anyActive());
    }
  }

  // ---- 13) FM voice (wave-2, engineVersion 7) -----------------------------
  {
    // Same integer-cycle correlation as the additive tests: every frequency
    // below is a multiple of 500 Hz and windows are multiples of 0.25 s, so
    // the correlation is exactly orthogonal to every other component.
    auto magAt = [&](const std::vector<float>& x, size_t off, size_t n, double f) {
      double sc = 0.0, ss = 0.0;
      for (size_t i = 0; i < n; ++i) {
        const double w = 2.0 * 3.14159265358979323846 * f * static_cast<double>(i) / fs;
        sc += x[off + i] * std::cos(w);
        ss += x[off + i] * std::sin(w);
      }
      return 2.0 * std::sqrt(sc * sc + ss * ss) / static_cast<double>(n);
    };
    const size_t skip = static_cast<size_t>(fs * 0.1);  // fade-in settles (index snaps at trigger)
    const size_t len = static_cast<size_t>(fs);         // 1 s
    const double lvl = 0.1;                             // default −20 dBFS

    // (a) Index 0 → a pure carrier (FM off is a sine, byte-honest).
    {
      Generator g;
      g.configure(fs);
      g.setMode(GenMode::Fm);
      g.setFrequency(2500.0);
      g.setFm(0.2, 0.0, 0.0);
      g.start();
      std::vector<float> b(skip + len);
      g.render(b.data(), (uint32_t)b.size());
      near("FM I=0: pure carrier |fc|", magAt(b, skip, len, 2500.0), lvl, 0.003);
      truthy("FM I=0: no sideband at fc+fm", magAt(b, skip, len, 3000.0) < 1e-3);
      truthy("FM I=0: no sideband at fc-fm", magAt(b, skip, len, 2000.0) < 1e-3);
    }

    // (b) I=1, fc=2500, ratio=0.2 (fm=500): sideband amplitudes are the exact
    //     Bessel values J_k(1) — THE canonical FM identity (Chowning).
    //     J0(1)=0.7652 · J1(1)=0.4401 · J2(1)=0.1149. All sidebands stay far
    //     from DC/Nyquist so no fold-back interferes at this fm.
    {
      Generator g;
      g.configure(fs);
      g.setMode(GenMode::Fm);
      g.setFrequency(2500.0);
      g.setFm(0.2, 1.0, 0.0);
      g.start();
      std::vector<float> b(skip + len);
      g.render(b.data(), (uint32_t)b.size());
      near("FM I=1: carrier J0", magAt(b, skip, len, 2500.0), lvl * 0.7652, 0.004);
      near("FM I=1: upper J1 (fc+fm)", magAt(b, skip, len, 3000.0), lvl * 0.4401, 0.004);
      near("FM I=1: lower J1 (fc-fm)", magAt(b, skip, len, 2000.0), lvl * 0.4401, 0.004);
      near("FM I=1: upper J2 (fc+2fm)", magAt(b, skip, len, 3500.0), lvl * 0.1149, 0.004);
      near("FM I=1: lower J2 (fc-2fm)", magAt(b, skip, len, 1500.0), lvl * 0.1149, 0.004);
    }

    // (c) Index DECAY (the bell/pluck envelope): I(t)=6·e^(−t/0.25). Early the
    //     energy is spread into sidebands (carrier well below full); by 1.5 s
    //     the index has decayed (I≈0.015) → essentially a pure carrier again.
    {
      Generator g;
      g.configure(fs);
      g.setMode(GenMode::Fm);
      g.setFrequency(2500.0);
      g.setFm(0.2, 6.0, 0.25);
      g.start();
      std::vector<float> b(static_cast<size_t>(fs * 2.0));
      g.render(b.data(), (uint32_t)b.size());
      const size_t early = static_cast<size_t>(fs * 0.1);
      const size_t late = static_cast<size_t>(fs * 1.5);
      const size_t win = static_cast<size_t>(fs * 0.25);
      truthy("FM decay: carrier suppressed early (energy in sidebands)",
             magAt(b, early, win, 2500.0) < 0.06);
      near("FM decay: pure carrier after decay", magAt(b, late, win, 2500.0), lvl, 0.004);
      truthy("FM decay: sidebands gone after decay", magAt(b, late, win, 3000.0) < 1.5e-3);
    }
  }

  // ---- 14) Binaural panner bus (wave-2, engineVersion 7) ------------------
  {
    // Phase-aware correlation: returns {mag, phase} at f over an integer-cycle
    // window (all test tones divide the window length).
    struct MP { double mag, ph; };
    auto probe = [&](const std::vector<float>& x, size_t off, size_t n, double f) -> MP {
      double sc = 0.0, ss = 0.0;
      for (size_t i = 0; i < n; ++i) {
        const double w = 2.0 * 3.14159265358979323846 * f * static_cast<double>(i) / fs;
        sc += x[off + i] * std::cos(w);
        ss += x[off + i] * std::sin(w);
      }
      return {2.0 * std::sqrt(sc * sc + ss * ss) / static_cast<double>(n), std::atan2(sc, ss)};
    };
    auto renderBus = [&](BinauralBus& bus, double secs) {
      const size_t n = static_cast<size_t>(fs * secs);
      std::vector<float> L(n, 0.0f), R(n, 0.0f);
      bus.renderAddInto(L.data(), R.data(), (uint32_t)n);
      return std::pair<std::vector<float>, std::vector<float>>(std::move(L), std::move(R));
    };
    const size_t skip = static_cast<size_t>(fs * 0.3);  // fades + delay slew settle
    const size_t len = static_cast<size_t>(fs);

    // (a) CENTER (az 0): perfectly symmetric — L == R sample-exact.
    {
      BinauralBus bus;
      bus.configure(fs);
      bus.setSource(0, true, 0 /*sine*/, 500.0, -20.0, 0.0, 1.0);
      bus.start();
      auto [L, R] = renderBus(bus, 1.4);
      bool same = true;
      for (size_t i = skip; i < L.size(); ++i)
        if (std::fabs(L[i] - R[i]) > 1e-9f) { same = false; break; }
      truthy("Binaural az=0: L == R (symmetric)", same);
      truthy("Binaural az=0: tone present", probe(L, skip, len, 500.0).mag > 0.02);
    }

    // (b) RIGHT (az +90): far (LEFT) ear is quieter AND later. The measured
    //     delay includes the head-shadow one-pole's phase lag, so the window is
    //     generous around the Woodworth 656 µs.
    {
      BinauralBus bus;
      bus.configure(fs);
      bus.setSource(0, true, 0, 500.0, -20.0, 90.0, 1.0);
      bus.start();
      auto [L, R] = renderBus(bus, 1.4);
      const MP l = probe(L, skip, len, 500.0), r = probe(R, skip, len, 500.0);
      truthy("Binaural az=+90: ILD — far (L) ear ≥6 dB down",
             l.mag < r.mag * std::pow(10.0, -6.0 / 20.0));
      double dph = r.ph - l.ph;  // L lags R → phase(L) < phase(R)
      while (dph > 3.14159265358979323846) dph -= 2.0 * 3.14159265358979323846;
      while (dph < -3.14159265358979323846) dph += 2.0 * 3.14159265358979323846;
      const double itdUs = dph / (2.0 * 3.14159265358979323846 * 500.0) * 1e6;
      check(itdUs > 500.0 && itdUs < 900.0, "Binaural az=+90: ITD ~Woodworth 656 us", itdUs,
            656.0, 250.0);
    }

    // (c) LEFT (az −90) mirrors: far ear is RIGHT.
    {
      BinauralBus bus;
      bus.configure(fs);
      bus.setSource(0, true, 0, 500.0, -20.0, -90.0, 1.0);
      bus.start();
      auto [L, R] = renderBus(bus, 1.4);
      truthy("Binaural az=-90: mirrored ILD — far (R) ear down",
             probe(R, skip, len, 500.0).mag <
                 probe(L, skip, len, 500.0).mag * std::pow(10.0, -6.0 / 20.0));
    }

    // (d) HEAD SHADOW is frequency-dependent: at az +90 the far/near ratio at
    //     4 kHz is clearly smaller than at 500 Hz (the LPF bites HF harder).
    {
      BinauralBus lo, hi;
      lo.configure(fs);
      hi.configure(fs);
      lo.setSource(0, true, 0, 500.0, -20.0, 90.0, 1.0);
      hi.setSource(0, true, 0, 4000.0, -20.0, 90.0, 1.0);
      lo.start();
      hi.start();
      auto [Ll, Rl] = renderBus(lo, 1.4);
      auto [Lh, Rh] = renderBus(hi, 1.4);
      const double ratioLo = probe(Ll, skip, len, 500.0).mag / probe(Rl, skip, len, 500.0).mag;
      const double ratioHi = probe(Lh, skip, len, 4000.0).mag / probe(Rh, skip, len, 4000.0).mag;
      truthy("Binaural shadow: HF far/near ratio < LF ratio", ratioHi < ratioLo * 0.7);
    }

    // (e) DISTANCE: 2 m vs 1 m = −6.02 dB (inverse distance re 1 m).
    {
      BinauralBus near1, far2;
      near1.configure(fs);
      far2.configure(fs);
      near1.setSource(0, true, 0, 500.0, -20.0, 0.0, 1.0);
      far2.setSource(0, true, 0, 500.0, -20.0, 0.0, 2.0);
      near1.start();
      far2.start();
      auto [L1, R1] = renderBus(near1, 1.4);
      auto [L2, R2] = renderBus(far2, 1.4);
      near("Binaural distance: 2 m is −6 dB vs 1 m",
           db(probe(L2, skip, len, 500.0).mag) - db(probe(L1, skip, len, 500.0).mag), -6.02, 0.3);
    }

    // (f) THREE-SOURCE MIX + Q4 bus norm: all sources audible in both ears and
    //     the summed peak can never pierce the −12 dBFS cap.
    {
      BinauralBus bus;
      bus.configure(fs);
      bus.setSource(0, true, 0, 500.0, -12.0, -60.0, 1.0);
      bus.setSource(1, true, 0, 1500.0, -12.0, 0.0, 1.0);
      bus.setSource(2, true, 0, 2500.0, -12.0, 60.0, 1.0);
      bus.start();
      auto [L, R] = renderBus(bus, 1.4);
      truthy("Binaural mix: src0 in L", probe(L, skip, len, 500.0).mag > 0.01);
      truthy("Binaural mix: src2 in R", probe(R, skip, len, 2500.0).mag > 0.01);
      truthy("Binaural mix: src1 in both", probe(L, skip, len, 1500.0).mag > 0.01 &&
                                               probe(R, skip, len, 1500.0).mag > 0.01);
      near("Binaural bus norm published (3 @ cap → 1/3)", bus.busNorm(), 1.0 / 3.0, 0.02);
      float peak = 0.0f;
      for (size_t i = skip; i < L.size(); ++i) {
        const float a = std::fabs(L[i]), b = std::fabs(R[i]);
        peak = a > peak ? a : peak;
        peak = b > peak ? b : peak;
      }
      truthy("Binaural bus peak ≤ Q4 cap", peak <= std::pow(10.0, -12.0 / 20.0) + 1e-3);
    }
  }

  // ---- 15) Modular synth voice (wave-2, engineVersion 7) ------------------
  {
    auto magAt = [&](const std::vector<float>& x, size_t off, size_t n, double f) {
      double sc = 0.0, ss = 0.0;
      for (size_t i = 0; i < n; ++i) {
        const double w = 2.0 * 3.14159265358979323846 * f * static_cast<double>(i) / fs;
        sc += x[off + i] * std::cos(w);
        ss += x[off + i] * std::sin(w);
      }
      return 2.0 * std::sqrt(sc * sc + ss * ss) / static_cast<double>(n);
    };
    auto rmsWin = [&](const std::vector<float>& x, size_t off, size_t n) {
      double s = 0.0;
      for (size_t i = 0; i < n; ++i) s += (double)x[off + i] * x[off + i];
      return std::sqrt(s / n);
    };
    using namespace modular;
    // A voice with instant-ish envelope, filter wide open, drone gate — the
    // "bare VCO" configuration every spectral test starts from. Level −20 dB
    // keeps |y| ≈ 0.1 → tanh ≈ identity (<0.4 % H3 error at unit input 0.1)…
    // tanh sits BEFORE the gain though, so drive is the raw VCO (±1):
    // tanh(±1) compresses ~24 % — the saturation stage is part of the voice,
    // so expectations below are measured against the tanh'd waveform, checked
    // as RATIOS between harmonics (tanh preserves odd symmetry and the
    // qualitative 1/n vs 1/n² structure the lab teaches).
    auto mkVoice = [&](ModularVoice& v, int shp, double f0hz, double cutoffHz, double resv) {
      v.configure(fs);
      v.set(Shape, shp);
      v.set(BaseFreq, f0hz);
      v.set(Cutoff, cutoffHz);
      v.set(Resonance, resv);
      v.set(EnvA, 0.001);
      v.set(EnvD, 0.001);
      v.set(EnvS, 1.0);
      v.set(EnvR, 0.05);
      v.set(LfoDepth, 0.0);
      v.set(SeqOn, 0.0);
      v.set(LevelDb, -20.0);
    };
    auto renderV = [&](ModularVoice& v, double secs) {
      const size_t n = static_cast<size_t>(fs * secs);
      std::vector<float> L(n, 0.0f), R(n, 0.0f);
      v.renderAddInto(L.data(), R.data(), (uint32_t)n);
      return L;
    };
    const size_t skip = static_cast<size_t>(fs * 0.3);
    const size_t len = static_cast<size_t>(fs);

    // (a) SAW spectrum: every harmonic, falling ≈1/n (checked as ratios).
    {
      ModularVoice v;
      mkVoice(v, 0, 250.0, 14000.0, 0.0);
      v.start();
      auto L = renderV(v, 1.4);
      const double h1 = magAt(L, skip, len, 250.0);
      const double h2 = magAt(L, skip, len, 500.0);
      const double h3 = magAt(L, skip, len, 750.0);
      truthy("Modular saw: fundamental present", h1 > 0.02);
      near("Modular saw: H2/H1 ≈ 1/2", h2 / h1, 0.5, 0.1);
      near("Modular saw: H3/H1 ≈ 1/3", h3 / h1, 1.0 / 3.0, 0.1);
    }
    // (b) SQUARE spectrum: odd-only, H3/H1 ≈ 1/3.
    {
      ModularVoice v;
      mkVoice(v, 1, 250.0, 14000.0, 0.0);
      v.start();
      auto L = renderV(v, 1.4);
      const double h1 = magAt(L, skip, len, 250.0);
      truthy("Modular square: even H2 suppressed", magAt(L, skip, len, 500.0) < 0.05 * h1);
      near("Modular square: H3/H1 ≈ 1/3", magAt(L, skip, len, 750.0) / h1, 1.0 / 3.0, 0.12);
    }
    // (c) VCF cutoff: closing the filter kills the highs (H20 of a 110 Hz saw
    //     at 2200 Hz: open vs cutoff 500 Hz → > 12 dB drop).
    {
      ModularVoice open_, closed;
      mkVoice(open_, 0, 110.0, 14000.0, 0.0);
      mkVoice(closed, 0, 110.0, 500.0, 0.0);
      open_.start();
      closed.start();
      auto Lo = renderV(open_, 1.4);
      auto Lc = renderV(closed, 1.4);
      const double drop = db(magAt(Lc, skip, len, 2200.0)) - db(magAt(Lo, skip, len, 2200.0));
      truthy("Modular VCF: cutoff 500 drops H20 (2200 Hz) > 12 dB", drop < -12.0);
    }
    // (d) RESONANCE: boosts the harmonic nearest the cutoff (saw 55 Hz through
    //     fc=2035 Hz — harmonic 37 sits at the peak).
    {
      ModularVoice flat, ringy;
      mkVoice(flat, 0, 55.0, 2035.0, 0.0);
      mkVoice(ringy, 0, 55.0, 2035.0, 1.0);
      flat.start();
      ringy.start();
      auto Lf = renderV(flat, 1.4);
      auto Lr = renderV(ringy, 1.4);
      truthy("Modular VCF: resonance boosts near-cutoff harmonic",
             magAt(Lr, skip, len, 2035.0) > magAt(Lf, skip, len, 2035.0) * 1.4);
    }
    // (e) ADSR attack: 0.4 s attack → early window much quieter than late.
    {
      ModularVoice v;
      mkVoice(v, 3 /*sine*/, 440.0, 14000.0, 0.0);
      v.set(EnvA, 0.4);
      v.start();
      auto L = renderV(v, 1.0);
      const size_t w = static_cast<size_t>(fs * 0.1);
      truthy("Modular ADSR: slow attack ramps up",
             rmsWin(L, static_cast<size_t>(fs * 0.02), w) <
                 0.5 * rmsWin(L, static_cast<size_t>(fs * 0.8), w));
    }
    // (f) LFO tremolo (dest amp, 4 Hz, full depth): the amplitude envelope dips
    //     near zero every trough — peak level in a trough window ≪ in a crest.
    {
      ModularVoice v;
      mkVoice(v, 3, 440.0, 14000.0, 0.0);
      v.set(LfoRate, 4.0);
      v.set(LfoDepth, 1.0);
      v.set(LfoDest, 3);
      v.start();
      auto L = renderV(v, 2.0);
      // Scan 50 ms windows over the settled tail for min/max peak.
      const size_t w = static_cast<size_t>(fs * 0.05);
      double lo = 1e9, hi = 0.0;
      for (size_t off = skip; off + w < L.size(); off += w) {
        double pk = 0.0;
        for (size_t i = 0; i < w; ++i) pk = std::fabs(L[off + i]) > pk ? std::fabs(L[off + i]) : pk;
        lo = pk < lo ? pk : lo;
        hi = pk > hi ? pk : hi;
      }
      truthy("Modular LFO tremolo: deep 4 Hz amplitude modulation", lo < 0.3 * hi);
    }
    // (g) SEQUENCER: steps 0 and +12 at 2 steps/s — the pitch alternates
    //     octaves window-by-window (440 then 880).
    {
      ModularVoice v;
      mkVoice(v, 3, 440.0, 14000.0, 0.0);
      v.set(SeqOn, 1.0);
      v.set(SeqRate, 2.0);
      for (int i = 0; i < 8; ++i) {
        v.set(SeqStep0 + i, (i % 2) ? 12.0 : 0.0);
        v.set(SeqGate0 + i, 1.0);
      }
      v.start();
      auto L = renderV(v, 2.0);
      // Step 0 (0..0.5 s) plays 440; step 1 (0.5..1.0 s) plays 880. Probe the
      // middle 0.25 s of each (integer cycles at both frequencies).
      const size_t w = static_cast<size_t>(fs * 0.25);
      const size_t s0 = static_cast<size_t>(fs * 0.15);
      const size_t s1 = static_cast<size_t>(fs * 0.65);
      truthy("Modular seq: step 0 plays the base pitch",
             magAt(L, s0, w, 440.0) > 4.0 * magAt(L, s0, w, 880.0));
      truthy("Modular seq: step 1 plays +12 semitones",
             magAt(L, s1, w, 880.0) > 4.0 * magAt(L, s1, w, 440.0));
    }
  }

  std::printf("\n==== GOLDEN RESULT: %d passed, %d failed ====\n", g_pass, g_fail);
  return g_fail == 0 ? 0 : 1;
}
