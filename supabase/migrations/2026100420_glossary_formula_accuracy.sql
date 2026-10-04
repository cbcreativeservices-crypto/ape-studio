-- 2026-10-04 · Calculator accuracy audit — glossary formula corrections.
-- DRAFT ONLY: NOT APPLIED. Comp A applies after owner approval.
--
-- The calculators are the source of truth (D53: one exact 0 dBu reference
-- √0.6 V = 0.774597 V; one exact 94 dB SPL anchor 20 µPa·10^(94/20)). These
-- glossary rows disagreed with them. Each UPDATE is keyed by id AND by the
-- current text, so it changes nothing if the row was already edited.

begin;

-- 1. dBu reference: 0.775 is a rounding of √0.6 = 0.7746 V (AES/IEC).
update public.glossary
   set formula_symbolic = 'dBu = 20 log_{10}(V / 0.7746)   (0.7746 V = √0.6 V, often rounded to 0.775)',
       formula_words    = 'dBu = 20 times the base-10 logarithm of (voltage divided by 0.7746 volts, the square root of 0.6)'
 where id = 'b788d787-0089-43b1-b2a3-aa39604e1ae2'
   and formula_symbolic = 'dBu = 20 log_{10}(V / 0.775)';

update public.glossary
   set formula_symbolic = 'V = 0.7746 × 10^{dBu/20}   (0.7746 V = √0.6 V, often rounded to 0.775)',
       formula_words    = 'Voltage = 0.7746 volts (the square root of 0.6) times 10 raised to the power of (dBu divided by 20)'
 where id = '516d065c-5411-4281-94c7-1cb308b482bb'
   and formula_symbolic = 'V = 0.775 × 10^{dBu/20}';

-- 2. Free-space path loss: the km/MHz constant is 20·log10(4π·10⁹/c) = 32.45
--    (32.448), not 32.44; the units belong in the formula itself.
update public.glossary
   set formula_symbolic = 'FSPL(dB) = 20*log10(d_km) + 20*log10(f_MHz) + 32.45   (= 20*log10(4*pi*d/lambda); far field only)',
       formula_words    = 'Free-space path loss in decibels is twenty times the log of distance in kilometers, plus twenty times the log of frequency in megahertz, plus the constant 32.45. It holds only in the far field, at least a wavelength from the antenna.'
 where id = '90c535fa-15cf-4325-9ae6-351ff1af08da'
   and formula_symbolic = 'FSPL(dB) = 20*log10(d) + 20*log10(f) + 32.44';

-- 3. 1 Pa is 93.98 dB SPL; 94 dB SPL is 1.0024 Pa.
update public.glossary
   set formula_symbolic = 'L_p = 20*log10(p / p_0),  p_0 = 20 uPa  ->  1 Pa = 93.98 dB  (94 dB = 1.0024 Pa)',
       formula_words    = 'Sound pressure level equals twenty times the base-ten logarithm of pressure divided by the reference of twenty micropascals, so one pascal is 93.98 decibels, and the 94 dB calibrator tone is 1.0024 pascals.'
 where id = 'e27dadc2-93b5-4423-938a-757938868262'
   and formula_symbolic = 'L_p = 20*log10(p / p_0),  p_0 = 20 uPa  ->  1 Pa = 94.0 dB';

-- 4. Reverberation radius: the exact coefficient is √(0.161/16π) = 0.0566.
update public.glossary
   set formula_symbolic = 'r_c = 0.0566 * sqrt(V / RT60)   (Q = 1; 0.0566 = sqrt(0.161 / (16*pi)), often rounded to 0.057)',
       formula_words    = 'For an omnidirectional source the reverberation radius in metres is 0.0566 (the square root of 0.161 over sixteen pi, often rounded to 0.057) times the square root of room volume in cubic metres divided by reverberation time in seconds.'
 where id = 'a760a251-a73e-4fe1-b653-c84086dd2fd4'
   and formula_symbolic = 'r_c = 0.057 * sqrt(V / RT60)   (Q = 1)';

-- 5. 6.02·N + 1.76 is the full-scale-sine SIGNAL-TO-QUANTIZATION-NOISE ratio;
--    the calculator calls 6.02·N the dynamic range. Name the quantity.
update public.glossary
   set formula_symbolic = 'SQNR ≈ 6.02·N + 1.76 dB  (ideal, full-scale sinusoid, undithered);  DR = 6.02·N dB',
       formula_words    = 'The ideal signal-to-quantization-noise ratio for a full-scale sine is about six point zero two times the number of bits plus one point seven six decibels; the dynamic range from full scale to one step is six point zero two decibels per bit. TPDF dither adds about 4.8 dB of noise.'
 where id = '54a1e347-dc73-5f15-aa1a-245d80bd6da8'
   and formula_symbolic = 'DR ≈ 6.02·N + 1.76 dB  (ideal, full-scale sinusoid)';

update public.glossary
   set formula_symbolic = 'SQNR ~= 6.02 * N + 1.76  (dB, ideal for a full-scale sine, N-bit uniform PCM, undithered)'
 where id = '243bb68f-e210-49d3-ab7f-98e8de9e3364'
   and formula_symbolic = 'DR ~= 6.02 * N + 1.76  (dB, ideal SQNR for full-scale sine, N-bit uniform PCM)';

commit;
