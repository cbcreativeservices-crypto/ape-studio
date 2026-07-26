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

  std::printf("\n==== GOLDEN RESULT: %d passed, %d failed ====\n", g_pass, g_fail);
  return g_fail == 0 ? 0 : 1;
}
