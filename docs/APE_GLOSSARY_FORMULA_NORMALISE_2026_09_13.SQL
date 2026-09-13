-- =====================================================================
-- Glossary formulas: normalise the 61 LaTeX rows to the house convention
-- APPLIED 2026-09-13 - migration glossary_formula_normalise_latex
-- =====================================================================
--
-- WHY. `glossary.formula_symbolic` is rendered as PLAIN TEXT in the glossary's
-- Equations & Formulas list, so 61 rows showed their markup verbatim - e.g.
-- "Conductor Resistance" displayed  R = \rho \ell / A  on the device.
-- Nobody had ever seen it: no client role holds a column grant on that column,
-- so the filter had shown 0 terms since it was built. It only became visible on
-- 2026-09-13 when `glossary_browse_v` began reading those columns as its owner.
--
-- CONVENTION - taken FROM the other 1,850 rows, not invented:
--   subscripts   _x and _{x}   (921 ASCII vs 129 Unicode; braces ARE the house
--                               style, e.g. "Sigma_{n=0}^{N-1}", so braces stay)
--   superscripts ^x and ^{x}
--   approx       the glyph      (71 rows use it, 2 spell it)
--   roots        the glyph      (already used: "= sqrt( ... )")
--   Greek        glyphs         (the clean set is split 265/256; glyphs read as
--                               maths, and "20 uPa" is how audio writes it)
--
-- ⚠️ THE TWO RULES THAT KEEP THE MATHS TRUE. Both exist because the first pass
-- got them wrong and reading all 61 outputs caught it:
--
--   1. A division inside a larger PRODUCT is parenthesised.
--      "100 \sum_i \dfrac{C_i}{T_i}" naively becomes "100 Sigma_i C_i / T_i",
--      which reads as (Sigma C_i)/T_i. It is now "100 Sigma_i (C_i / T_i)".
--      Likewise "\dfrac{1}{N}\sum..." -> "(1 / N) Sigma...", never "1 / N Sigma...".
--
--   2. A digit juxtaposed with a letter is an implicit multiplication, so it is
--      not an atom. "\dfrac{1}{2f}" is "1 / (2f)", never "1 / 2f", which reads
--      as (1/2)*f.
--
-- VERIFIED before applying, on all 61: every numeric literal in the source
-- survives into the output, parentheses / braces / angle brackets all balance,
-- and no backslash remains. Then read individually, one by one.
--
-- Rollback is at the bottom of this file.
-- =====================================================================

-- Airborne Reference Sound Pressure
--   was: p_0 = 20\ \mu\mathrm{Pa}
update public.glossary set formula_symbolic = 'p_0 = 20 μPa'
 where id = 'df56f367-dc37-42f2-a5c0-78c42ee32f53';

-- Approximate Ideal Quantization Signal-to-Noise Ratio
--   was: SNR_Q \approx 6.02\,B + 1.76\ \mathrm{dB}
update public.glossary set formula_symbolic = 'SNR_Q ≈ 6.02 B + 1.76 dB'
 where id = '18a30db6-2e4f-454d-b854-2a6f58e36f45';

-- Approximate Round-Trip Buffer Latency
--   was: t_RT \approx (N_{in} + N_{out}) / f_s + t_{conversion} + t_{processing}
update public.glossary set formula_symbolic = 't_RT ≈ (N_{in} + N_{out}) / f_s + t_{conversion} + t_{processing}'
 where id = '3fb84ecc-16db-4d92-be23-a874b12ae4c7';

-- Average Acoustic Intensity
--   was: I = \langle p(t)\,u(t) \rangle
update public.glossary set formula_symbolic = 'I = ⟨p(t) u(t)⟩'
 where id = '3559d26c-8b32-4744-b880-fb9ee73c352e';

-- Characteristic Acoustic Impedance
--   was: Z_{0} = \rho c
update public.glossary set formula_symbolic = 'Z_{0} = ρc'
 where id = '70ebe9fd-ee2f-45c6-8c94-ffa43d324876';

-- Conductor Resistance
--   was: R = \rho \ell / A
update public.glossary set formula_symbolic = 'R = ρℓ / A'
 where id = '5aef0e4d-fdec-42fb-9372-a5b82e9cddb3';

-- Crest Factor as a Ratio
--   was: CF = \dfrac{x_{peak}}{x_{rms}}
update public.glossary set formula_symbolic = 'CF = x_{peak} / x_{rms}'
 where id = '29be5e74-0c32-4baa-acf8-34646515c0b8';

-- Crest Factor in Decibels
--   was: CF_{dB} = 20\,\log_{10}\!\left(\dfrac{x_{peak}}{x_{rms}}\right)
update public.glossary set formula_symbolic = 'CF_{dB} = 20 log_{10}(x_{peak} / x_{rms})'
 where id = '5b3bffa5-a8ce-4a14-8ca2-acd7557dd6bb';

-- dBFS Amplitude Ratio
--   was: \mathrm{dBFS} = 20\,\log_{10}\!\left(\dfrac{A}{A_{FS}}\right)
update public.glossary set formula_symbolic = 'dBFS = 20 log_{10}(A / A_{FS})'
 where id = '3f031bd1-658b-4dfb-a7cf-68fea55e6372';

-- dBm from Power
--   was: \mathrm{dBm} = 10\,\log_{10}\!\left(\dfrac{P}{1\ \mathrm{mW}}\right)
update public.glossary set formula_symbolic = 'dBm = 10 log_{10}(P / (1 mW))'
 where id = 'e37f9832-f7fc-4aca-aebf-47a86eb46396';

-- dBu from RMS Voltage
--   was: \mathrm{dBu} = 20\,\log_{10}\!\left(\dfrac{V}{0.775}\right)
update public.glossary set formula_symbolic = 'dBu = 20 log_{10}(V / 0.775)'
 where id = 'b788d787-0089-43b1-b2a3-aa39604e1ae2';

-- dBV from RMS Voltage
--   was: \mathrm{dBV} = 20\,\log_{10}\!\left(\dfrac{V}{1.0}\right)
update public.glossary set formula_symbolic = 'dBV = 20 log_{10}(V / 1.0)'
 where id = 'ee2f6b2b-3f3c-4c6a-a0ad-b85e33fe23e9';

-- Degrees-to-Radians Conversion
--   was: \varphi_{\text{rad}} = \varphi_{\text{deg}} \left( \dfrac{\pi}{180^{\circ}} \right)
update public.glossary set formula_symbolic = 'φ_{rad} = φ_{deg} (π / 180°)'
 where id = '09b0c6d3-f5d5-40e4-a88f-d257eaae28e5';

-- Delay from Sample Count
--   was: t = \dfrac{N}{f_s}
update public.glossary set formula_symbolic = 't = N / f_s'
 where id = '2873713b-2349-410b-b8a1-dddc17dafe6d';

-- Directivity Factor
--   was: Q = \dfrac{I_{\text{direction}}}{I_{\text{omnidirectional}}}
update public.glossary set formula_symbolic = 'Q = I_{direction} / I_{omnidirectional}'
 where id = '3e1a9220-f644-4143-a457-16173c5109bd';

-- Directivity Factor from Directivity Index
--   was: Q = 10^{\,DI/10}
update public.glossary set formula_symbolic = 'Q = 10^{DI/10}'
 where id = '0914c1e2-6e24-4f91-9df3-943752762391';

-- Directivity Index
--   was: DI = 10\,\log_{10}(Q)
update public.glossary set formula_symbolic = 'DI = 10 log_{10}(Q)'
 where id = 'ac240f57-5bf3-4e23-b922-910982fb3917';

-- Discrete RMS Value
--   was: x_rms = \sqrt{\dfrac{1}{N}\displaystyle\sum_{n=1}^{N} x_{n}^{2}}
update public.glossary set formula_symbolic = 'x_rms = √((1 / N) Σ_{n=1}^{N} x_{n}^{2})'
 where id = '7ba99fb6-5dad-4b56-b1e1-4b98bb4794ab';

-- Distance Difference from Phase Shift
--   was: \Delta d = \dfrac{\lambda \, \varphi}{360^{\circ}}
update public.glossary set formula_symbolic = 'Δd = (λ φ) / 360°'
 where id = '39a72e83-140f-4979-9b18-a4a1106dc0fe';

-- Distance Ratio from Level Change
--   was: \dfrac{r_2}{r_1} = 10^{-\Delta L/20}
update public.glossary set formula_symbolic = 'r_2 / r_1 = 10^{-ΔL/20}'
 where id = 'd7389ce1-d2e4-4710-88d8-aa28c149b200';

-- Distance Represented by One Sample
--   was: d_{\text{sample}} = \dfrac{c}{f_s}
update public.glossary set formula_symbolic = 'd_{sample} = c / f_s'
 where id = '9fab13cb-775a-4514-9c52-15e8e5840fdb';

-- General RMS Value
--   was: x_rms = \sqrt{\dfrac{1}{T}\displaystyle\int_{0}^{T} x^{2}(t)\,dt}
update public.glossary set formula_symbolic = 'x_rms = √((1 / T) ∫_{0}^{T} x^{2}(t) dt)'
 where id = '7d88c620-96d9-4928-89f7-ee67dc74eb2e';

-- Half-Cycle Delay
--   was: t_{180^{\circ}} = \dfrac{1}{2f}
update public.glossary set formula_symbolic = 't_{180°} = 1 / (2f)'
 where id = 'd04fd691-6ec4-4d41-ba17-825141461725';

-- Hemispherical Surface Area
--   was: A = 2\pi r^{2}
update public.glossary set formula_symbolic = 'A = 2πr^{2}'
 where id = 'e32004e4-2791-4b9e-9ab4-b5560d695f99';

-- Instantaneous Acoustic Intensity
--   was: i(t) = p(t)\,u(t)
update public.glossary set formula_symbolic = 'i(t) = p(t) u(t)'
 where id = '9521a247-4f6c-4274-b505-f3c0c13032b4';

-- Intensity from Acoustic Power
--   was: I = \dfrac{W}{A}
update public.glossary set formula_symbolic = 'I = W / A'
 where id = '591106ca-26ad-4865-8c60-f8fd6d5f8d05';

-- Inverse-Square Intensity Relationship
--   was: I \propto \dfrac{1}{r^{2}}
update public.glossary set formula_symbolic = 'I ∝ 1 / r^{2}'
 where id = '81605823-f177-4ba6-b775-36c947f8027f';

-- One-Cycle Time
--   was: T = \dfrac{1}{f}
update public.glossary set formula_symbolic = 'T = 1 / f'
 where id = 'fef574c4-bc4c-4bf0-b405-4f4d03a66367';

-- OSHA Dose from TWA
--   was: D = 100 \times 2^{\frac{TWA - 90}{5}}
update public.glossary set formula_symbolic = 'D = 100 × 2^{(TWA - 90) / 5}'
 where id = '59f699e4-c3b4-4537-bda1-21438a1b9f81';

-- OSHA Noise Dose
--   was: D = 100 \sum_i \dfrac{C_i}{T_i}
update public.glossary set formula_symbolic = 'D = 100 Σ_i (C_i / T_i)'
 where id = '4dea3c27-90fe-4ece-a1d1-5328dd6b8e90';

-- OSHA TWA from Dose
--   was: TWA = 16.61 \, \log_{10}\!\left(\dfrac{D}{100}\right) + 90
update public.glossary set formula_symbolic = 'TWA = 16.61 log_{10}(D / 100) + 90'
 where id = '87417a32-1dff-4280-ab54-53b67b401fde';

-- Peak-to-Average Power Ratio
--   was: PAPR = 10\,\log_{10}\!\left(\dfrac{P_{peak}}{P_{avg}}\right)
update public.glossary set formula_symbolic = 'PAPR = 10 log_{10}(P_{peak} / P_{avg})'
 where id = 'baec4b06-27e4-41eb-b03d-a5501459c1a1';

-- Peak-to-Peak Voltage
--   was: V_{pp} = 2\,V_{peak}
update public.glossary set formula_symbolic = 'V_{pp} = 2 V_{peak}'
 where id = '15bf8150-7682-4211-9a97-4dbc4325b377';

-- Percentage Voltage Drop
--   was: \%\Delta V = (V_{drop} / V_{source}) \times 100
update public.glossary set formula_symbolic = '%ΔV = (V_{drop} / V_{source}) × 100'
 where id = '9dcabc0d-72ff-4089-8675-7b6e675d6838';

-- Phase in Radians
--   was: \varphi = 2\pi f \, \Delta t
update public.glossary set formula_symbolic = 'φ = 2πf Δt'
 where id = 'fc0624b7-3da2-44af-b578-b40216ae8965';

-- Phase Shift from Distance Difference
--   was: \varphi = 360^{\circ} \left( \dfrac{\Delta d}{\lambda} \right)
update public.glossary set formula_symbolic = 'φ = 360° (Δd / λ)'
 where id = 'ce8aef32-17c5-4f0c-ab20-423b08e30558';

-- Phase Shift from Time Delay
--   was: \varphi = 360^{\circ} \, f \, \Delta t
update public.glossary set formula_symbolic = 'φ = 360° f Δt'
 where id = 'c038c491-dab2-4633-831c-c93adc0a95e3';

-- Power from dBm
--   was: P_{mW} = 10^{\,\mathrm{dBm}/10}
update public.glossary set formula_symbolic = 'P_{mW} = 10^{dBm/10}'
 where id = 'a7d7ec32-4c29-4346-a8d0-4f2e06fbe6b9';

-- Power Ratio from Decibels
--   was: \dfrac{P_2}{P_1} = 10^{\,L/10}
update public.glossary set formula_symbolic = 'P_2 / P_1 = 10^{L/10}'
 where id = 'a034a08b-971c-4b36-aba9-91c96151fce2';

-- Power-Level Ratio
--   was: L = 10\,\log_{10}\!\left(\dfrac{P_2}{P_1}\right)
update public.glossary set formula_symbolic = 'L = 10 log_{10}(P_2 / P_1)'
 where id = 'd2ef2284-3e70-4dc5-b25b-33f07c3daec3';

-- Predicted Level at a New Distance
--   was: L_2 = L_1 - 20\,\log_{10}\!\left(\dfrac{r_2}{r_1}\right)
update public.glossary set formula_symbolic = 'L_2 = L_1 - 20 log_{10}(r_2 / r_1)'
 where id = '925a90ec-7064-4acb-b127-78857e5944a2';

-- Pressure Ratio from Decibels
--   was: \dfrac{p_2}{p_1} = 10^{\,\Delta L_p/20}
update public.glossary set formula_symbolic = 'p_2 / p_1 = 10^{ΔL_p/20}'
 where id = 'f7cf190c-2d10-4c65-95b2-8bca8997d314';

-- Quarter-Cycle Delay
--   was: t_{90^{\circ}} = \dfrac{1}{4f}
update public.glossary set formula_symbolic = 't_{90°} = 1 / (4f)'
 where id = '56cb97bf-3010-4139-a458-24e8225d936a';

-- Radians-to-Degrees Conversion
--   was: \varphi_{\text{deg}} = \varphi_{\text{rad}} \left( \dfrac{180^{\circ}}{\pi} \right)
update public.glossary set formula_symbolic = 'φ_{deg} = φ_{rad} (180° / π)'
 where id = 'e6b3b928-4468-4856-8bf2-3d1cff52f7b2';

-- RMS Pressure from Intensity
--   was: p_{rms} = \sqrt{I \rho c}
update public.glossary set formula_symbolic = 'p_{rms} = √(I ρc)'
 where id = '2fb8c619-cb8f-4b89-b836-e6e554a8db25';

-- RMS Voltage from dBu
--   was: V = 0.775 \times 10^{\,\mathrm{dBu}/20}
update public.glossary set formula_symbolic = 'V = 0.775 × 10^{dBu/20}'
 where id = '516d065c-5411-4281-94c7-1cb308b482bb';

-- RMS Voltage from dBV
--   was: V = 10^{\,\mathrm{dBV}/20}
update public.glossary set formula_symbolic = 'V = 10^{dBV/20}'
 where id = '39d0d92f-c449-44a5-ab46-0ce5d821b0ee';

-- Samples Corresponding to Delay
--   was: N = t \, f_s
update public.glossary set formula_symbolic = 'N = t f_s'
 where id = '7bb808cf-a578-404a-af5e-e6b2dc01603d';

-- Sine-Wave Peak Voltage
--   was: V_{peak} = \sqrt{2}\,V_{rms}
update public.glossary set formula_symbolic = 'V_{peak} = √2 V_{rms}'
 where id = '2e661548-b3df-4032-8aa0-4d570e1b5ee3';

-- Sine-Wave RMS from Peak-to-Peak Voltage
--   was: V_rms = \dfrac{V_{pp}}{2\sqrt{2}}
update public.glossary set formula_symbolic = 'V_rms = V_{pp} / (2√2)'
 where id = '83f6f8ec-6638-4dc8-86ff-d3c416142864';

-- Sine-Wave RMS Voltage
--   was: V_rms = \dfrac{V_{peak}}{\sqrt{2}}
update public.glossary set formula_symbolic = 'V_rms = V_{peak} / √2'
 where id = '2f6b80dc-579a-47b1-804f-8cef53514db2';

-- Sound Intensity from RMS Pressure for a Plane Progressive Wave
--   was: I = p_{rms}^{2} / (\rho c)
update public.glossary set formula_symbolic = 'I = p_{rms}^{2} / (ρc)'
 where id = '9e935f31-4474-458d-86b3-a19cbaae37fc';

-- Sound Intensity Level
--   was: L_I = 10\,\log_{10}\!\left(\dfrac{I}{I_0}\right)
update public.glossary set formula_symbolic = 'L_I = 10 log_{10}(I / I_0)'
 where id = '464e3fe6-85a6-4c3b-a688-e54abaaab81d';

-- Sound Power Level
--   was: L_W = 10\,\log_{10}\!\left(\dfrac{W}{W_0}\right)
update public.glossary set formula_symbolic = 'L_W = 10 log_{10}(W / W_0)'
 where id = 'f0b57f4b-a374-4606-9108-dc34f9a3668e';

-- Sound Pressure Level
--   was: L_p = 20\,\log_{10}\!\left(\dfrac{p_{rms}}{p_0}\right)
update public.glossary set formula_symbolic = 'L_p = 20 log_{10}(p_{rms} / p_0)'
 where id = 'dbf87bc7-2019-492d-9abd-04950ff10ae6';

-- Sound-Pressure-Level Ratio
--   was: \Delta L_p = 20\,\log_{10}\!\left(\dfrac{p_2}{p_1}\right)
update public.glossary set formula_symbolic = 'ΔL_p = 20 log_{10}(p_2 / p_1)'
 where id = '032f3588-bdf4-460b-91ff-f70935a8d99b';

-- Spherical Surface Area
--   was: A = 4\pi r^{2}
update public.glossary set formula_symbolic = 'A = 4πr^{2}'
 where id = 'fa7b1535-a507-46ce-8ff3-d0617cfb3345';

-- Time Delay from Phase Shift
--   was: \Delta t = \dfrac{\varphi}{360^{\circ} \, f}
update public.glossary set formula_symbolic = 'Δt = φ / (360° f)'
 where id = '873b0450-755c-4aed-b04a-1c75ae742615';

-- Two-Conductor Circuit Resistance
--   was: R_{loop} = 2\rho \ell / A
update public.glossary set formula_symbolic = 'R_{loop} = 2ρℓ / A'
 where id = '44e10029-78b2-4f7a-b1a6-d49624d10af6';

-- Voltage Ratio from Decibels
--   was: \dfrac{V_2}{V_1} = 10^{\,L/20}
update public.glossary set formula_symbolic = 'V_2 / V_1 = 10^{L/20}'
 where id = 'cfc5fbfa-b093-4d14-ac07-03590ceca6a7';

-- Voltage-Level Ratio for Equal Impedances
--   was: L = 20\,\log_{10}\!\left(\dfrac{V_2}{V_1}\right)
update public.glossary set formula_symbolic = 'L = 20 log_{10}(V_2 / V_1)'
 where id = '1f761388-fee6-410f-b6d1-4d365ab22e2c';

-- Expect 0.
select count(*) as latex_rows_remaining from public.glossary
 where formula_symbolic ~ '\\';


-- =====================================================================
-- ROLLBACK - restores all 61 originals exactly as they stood.
-- =====================================================================
-- update public.glossary set formula_symbolic = 'p_0 = 20\ \mu\mathrm{Pa}' where id = 'df56f367-dc37-42f2-a5c0-78c42ee32f53';
-- update public.glossary set formula_symbolic = 'SNR_Q \approx 6.02\,B + 1.76\ \mathrm{dB}' where id = '18a30db6-2e4f-454d-b854-2a6f58e36f45';
-- update public.glossary set formula_symbolic = 't_RT \approx (N_{in} + N_{out}) / f_s + t_{conversion} + t_{processing}' where id = '3fb84ecc-16db-4d92-be23-a874b12ae4c7';
-- update public.glossary set formula_symbolic = 'I = \langle p(t)\,u(t) \rangle' where id = '3559d26c-8b32-4744-b880-fb9ee73c352e';
-- update public.glossary set formula_symbolic = 'Z_{0} = \rho c' where id = '70ebe9fd-ee2f-45c6-8c94-ffa43d324876';
-- update public.glossary set formula_symbolic = 'R = \rho \ell / A' where id = '5aef0e4d-fdec-42fb-9372-a5b82e9cddb3';
-- update public.glossary set formula_symbolic = 'CF = \dfrac{x_{peak}}{x_{rms}}' where id = '29be5e74-0c32-4baa-acf8-34646515c0b8';
-- update public.glossary set formula_symbolic = 'CF_{dB} = 20\,\log_{10}\!\left(\dfrac{x_{peak}}{x_{rms}}\right)' where id = '5b3bffa5-a8ce-4a14-8ca2-acd7557dd6bb';
-- update public.glossary set formula_symbolic = '\mathrm{dBFS} = 20\,\log_{10}\!\left(\dfrac{A}{A_{FS}}\right)' where id = '3f031bd1-658b-4dfb-a7cf-68fea55e6372';
-- update public.glossary set formula_symbolic = '\mathrm{dBm} = 10\,\log_{10}\!\left(\dfrac{P}{1\ \mathrm{mW}}\right)' where id = 'e37f9832-f7fc-4aca-aebf-47a86eb46396';
-- update public.glossary set formula_symbolic = '\mathrm{dBu} = 20\,\log_{10}\!\left(\dfrac{V}{0.775}\right)' where id = 'b788d787-0089-43b1-b2a3-aa39604e1ae2';
-- update public.glossary set formula_symbolic = '\mathrm{dBV} = 20\,\log_{10}\!\left(\dfrac{V}{1.0}\right)' where id = 'ee2f6b2b-3f3c-4c6a-a0ad-b85e33fe23e9';
-- update public.glossary set formula_symbolic = '\varphi_{\text{rad}} = \varphi_{\text{deg}} \left( \dfrac{\pi}{180^{\circ}} \right)' where id = '09b0c6d3-f5d5-40e4-a88f-d257eaae28e5';
-- update public.glossary set formula_symbolic = 't = \dfrac{N}{f_s}' where id = '2873713b-2349-410b-b8a1-dddc17dafe6d';
-- update public.glossary set formula_symbolic = 'Q = \dfrac{I_{\text{direction}}}{I_{\text{omnidirectional}}}' where id = '3e1a9220-f644-4143-a457-16173c5109bd';
-- update public.glossary set formula_symbolic = 'Q = 10^{\,DI/10}' where id = '0914c1e2-6e24-4f91-9df3-943752762391';
-- update public.glossary set formula_symbolic = 'DI = 10\,\log_{10}(Q)' where id = 'ac240f57-5bf3-4e23-b922-910982fb3917';
-- update public.glossary set formula_symbolic = 'x_rms = \sqrt{\dfrac{1}{N}\displaystyle\sum_{n=1}^{N} x_{n}^{2}}' where id = '7ba99fb6-5dad-4b56-b1e1-4b98bb4794ab';
-- update public.glossary set formula_symbolic = '\Delta d = \dfrac{\lambda \, \varphi}{360^{\circ}}' where id = '39a72e83-140f-4979-9b18-a4a1106dc0fe';
-- update public.glossary set formula_symbolic = '\dfrac{r_2}{r_1} = 10^{-\Delta L/20}' where id = 'd7389ce1-d2e4-4710-88d8-aa28c149b200';
-- update public.glossary set formula_symbolic = 'd_{\text{sample}} = \dfrac{c}{f_s}' where id = '9fab13cb-775a-4514-9c52-15e8e5840fdb';
-- update public.glossary set formula_symbolic = 'x_rms = \sqrt{\dfrac{1}{T}\displaystyle\int_{0}^{T} x^{2}(t)\,dt}' where id = '7d88c620-96d9-4928-89f7-ee67dc74eb2e';
-- update public.glossary set formula_symbolic = 't_{180^{\circ}} = \dfrac{1}{2f}' where id = 'd04fd691-6ec4-4d41-ba17-825141461725';
-- update public.glossary set formula_symbolic = 'A = 2\pi r^{2}' where id = 'e32004e4-2791-4b9e-9ab4-b5560d695f99';
-- update public.glossary set formula_symbolic = 'i(t) = p(t)\,u(t)' where id = '9521a247-4f6c-4274-b505-f3c0c13032b4';
-- update public.glossary set formula_symbolic = 'I = \dfrac{W}{A}' where id = '591106ca-26ad-4865-8c60-f8fd6d5f8d05';
-- update public.glossary set formula_symbolic = 'I \propto \dfrac{1}{r^{2}}' where id = '81605823-f177-4ba6-b775-36c947f8027f';
-- update public.glossary set formula_symbolic = 'T = \dfrac{1}{f}' where id = 'fef574c4-bc4c-4bf0-b405-4f4d03a66367';
-- update public.glossary set formula_symbolic = 'D = 100 \times 2^{\frac{TWA - 90}{5}}' where id = '59f699e4-c3b4-4537-bda1-21438a1b9f81';
-- update public.glossary set formula_symbolic = 'D = 100 \sum_i \dfrac{C_i}{T_i}' where id = '4dea3c27-90fe-4ece-a1d1-5328dd6b8e90';
-- update public.glossary set formula_symbolic = 'TWA = 16.61 \, \log_{10}\!\left(\dfrac{D}{100}\right) + 90' where id = '87417a32-1dff-4280-ab54-53b67b401fde';
-- update public.glossary set formula_symbolic = 'PAPR = 10\,\log_{10}\!\left(\dfrac{P_{peak}}{P_{avg}}\right)' where id = 'baec4b06-27e4-41eb-b03d-a5501459c1a1';
-- update public.glossary set formula_symbolic = 'V_{pp} = 2\,V_{peak}' where id = '15bf8150-7682-4211-9a97-4dbc4325b377';
-- update public.glossary set formula_symbolic = '\%\Delta V = (V_{drop} / V_{source}) \times 100' where id = '9dcabc0d-72ff-4089-8675-7b6e675d6838';
-- update public.glossary set formula_symbolic = '\varphi = 2\pi f \, \Delta t' where id = 'fc0624b7-3da2-44af-b578-b40216ae8965';
-- update public.glossary set formula_symbolic = '\varphi = 360^{\circ} \left( \dfrac{\Delta d}{\lambda} \right)' where id = 'ce8aef32-17c5-4f0c-ab20-423b08e30558';
-- update public.glossary set formula_symbolic = '\varphi = 360^{\circ} \, f \, \Delta t' where id = 'c038c491-dab2-4633-831c-c93adc0a95e3';
-- update public.glossary set formula_symbolic = 'P_{mW} = 10^{\,\mathrm{dBm}/10}' where id = 'a7d7ec32-4c29-4346-a8d0-4f2e06fbe6b9';
-- update public.glossary set formula_symbolic = '\dfrac{P_2}{P_1} = 10^{\,L/10}' where id = 'a034a08b-971c-4b36-aba9-91c96151fce2';
-- update public.glossary set formula_symbolic = 'L = 10\,\log_{10}\!\left(\dfrac{P_2}{P_1}\right)' where id = 'd2ef2284-3e70-4dc5-b25b-33f07c3daec3';
-- update public.glossary set formula_symbolic = 'L_2 = L_1 - 20\,\log_{10}\!\left(\dfrac{r_2}{r_1}\right)' where id = '925a90ec-7064-4acb-b127-78857e5944a2';
-- update public.glossary set formula_symbolic = '\dfrac{p_2}{p_1} = 10^{\,\Delta L_p/20}' where id = 'f7cf190c-2d10-4c65-95b2-8bca8997d314';
-- update public.glossary set formula_symbolic = 't_{90^{\circ}} = \dfrac{1}{4f}' where id = '56cb97bf-3010-4139-a458-24e8225d936a';
-- update public.glossary set formula_symbolic = '\varphi_{\text{deg}} = \varphi_{\text{rad}} \left( \dfrac{180^{\circ}}{\pi} \right)' where id = 'e6b3b928-4468-4856-8bf2-3d1cff52f7b2';
-- update public.glossary set formula_symbolic = 'p_{rms} = \sqrt{I \rho c}' where id = '2fb8c619-cb8f-4b89-b836-e6e554a8db25';
-- update public.glossary set formula_symbolic = 'V = 0.775 \times 10^{\,\mathrm{dBu}/20}' where id = '516d065c-5411-4281-94c7-1cb308b482bb';
-- update public.glossary set formula_symbolic = 'V = 10^{\,\mathrm{dBV}/20}' where id = '39d0d92f-c449-44a5-ab46-0ce5d821b0ee';
-- update public.glossary set formula_symbolic = 'N = t \, f_s' where id = '7bb808cf-a578-404a-af5e-e6b2dc01603d';
-- update public.glossary set formula_symbolic = 'V_{peak} = \sqrt{2}\,V_{rms}' where id = '2e661548-b3df-4032-8aa0-4d570e1b5ee3';
-- update public.glossary set formula_symbolic = 'V_rms = \dfrac{V_{pp}}{2\sqrt{2}}' where id = '83f6f8ec-6638-4dc8-86ff-d3c416142864';
-- update public.glossary set formula_symbolic = 'V_rms = \dfrac{V_{peak}}{\sqrt{2}}' where id = '2f6b80dc-579a-47b1-804f-8cef53514db2';
-- update public.glossary set formula_symbolic = 'I = p_{rms}^{2} / (\rho c)' where id = '9e935f31-4474-458d-86b3-a19cbaae37fc';
-- update public.glossary set formula_symbolic = 'L_I = 10\,\log_{10}\!\left(\dfrac{I}{I_0}\right)' where id = '464e3fe6-85a6-4c3b-a688-e54abaaab81d';
-- update public.glossary set formula_symbolic = 'L_W = 10\,\log_{10}\!\left(\dfrac{W}{W_0}\right)' where id = 'f0b57f4b-a374-4606-9108-dc34f9a3668e';
-- update public.glossary set formula_symbolic = 'L_p = 20\,\log_{10}\!\left(\dfrac{p_{rms}}{p_0}\right)' where id = 'dbf87bc7-2019-492d-9abd-04950ff10ae6';
-- update public.glossary set formula_symbolic = '\Delta L_p = 20\,\log_{10}\!\left(\dfrac{p_2}{p_1}\right)' where id = '032f3588-bdf4-460b-91ff-f70935a8d99b';
-- update public.glossary set formula_symbolic = 'A = 4\pi r^{2}' where id = 'fa7b1535-a507-46ce-8ff3-d0617cfb3345';
-- update public.glossary set formula_symbolic = '\Delta t = \dfrac{\varphi}{360^{\circ} \, f}' where id = '873b0450-755c-4aed-b04a-1c75ae742615';
-- update public.glossary set formula_symbolic = 'R_{loop} = 2\rho \ell / A' where id = '44e10029-78b2-4f7a-b1a6-d49624d10af6';
-- update public.glossary set formula_symbolic = '\dfrac{V_2}{V_1} = 10^{\,L/20}' where id = 'cfc5fbfa-b093-4d14-ac07-03590ceca6a7';
-- update public.glossary set formula_symbolic = 'L = 20\,\log_{10}\!\left(\dfrac{V_2}{V_1}\right)' where id = '1f761388-fee6-410f-b6d1-4d365ab22e2c';
