// Exam-style papers: original structured questions written in the style of common exam boards
// (not reproductions of official papers). Answers are computed from the data given in each stem.
const PI = Math.PI, g = 9.81;
const P = (q, ans, unit, marks, scheme, tol = 0.02) => ({ q, ans, unit, marks, scheme, tol });

export const PAPERS = [
  {
    id: 'gcse-forces-energy', title: 'Forces, Motion & Energy', style: 'GCSE-style', level: 'school', mins: 30, sec: 'physics',
    info: 'Take g = 9.8 N/kg. Give answers to 2–3 significant figures.',
    questions: [
      { stem: 'A car of mass 1200 kg accelerates uniformly from rest to 18 m/s in 6.0 s.', parts: [
        P('Calculate the acceleration of the car.', 18 / 6, 'm/s²', 2, 'a = (v − u)/t (1) = 18/6 = 3.0 m/s² (1)'),
        P('Calculate the resultant force on the car.', 1200 * 3, 'N', 2, 'F = ma (1) = 1200 × 3.0 = 3600 N (1)'),
        P('Calculate the distance travelled in the 6.0 s.', 0.5 * 18 * 6, 'm', 2, 's = ½(u + v)t (1) = ½ × 18 × 6.0 = 54 m (1)'),
        P('Calculate the kinetic energy of the car at 18 m/s. Give your answer in kJ.', 0.5 * 1200 * 18 ** 2 / 1e3, 'kJ', 2, 'Eₖ = ½mv² (1) = ½ × 1200 × 18² = 194 400 J = 194 kJ (1)'),
      ] },
      { stem: 'A student lifts a 2.0 kg book vertically through 1.5 m onto a shelf.', parts: [
        P('Calculate the gain in gravitational potential energy of the book.', 2 * 9.8 * 1.5, 'J', 2, 'Eₚ = mgh (1) = 2.0 × 9.8 × 1.5 = 29.4 J (1)'),
        P('The lift takes 0.60 s. Calculate the useful power output of the student.', 2 * 9.8 * 1.5 / 0.6, 'W', 2, 'P = E/t (1) = 29.4/0.60 = 49 W (1)'),
      ] },
      { stem: 'A spring with spring constant 40 N/m is stretched by 0.15 m. The limit of proportionality is not exceeded.', parts: [
        P('Calculate the force needed.', 40 * 0.15, 'N', 1, 'F = ke = 40 × 0.15 = 6.0 N (1)'),
        P('Calculate the elastic potential energy stored.', 0.5 * 40 * 0.15 ** 2, 'J', 2, 'Eₑ = ½ke² (1) = 0.45 J (1)'),
      ] },
      { stem: 'A 2.2 kW kettle heats 0.50 kg of water from 20 °C to 100 °C. The specific heat capacity of water is 4200 J/(kg °C).', parts: [
        P('Calculate the energy needed to heat the water. Give your answer in kJ.', 0.5 * 4200 * 80 / 1e3, 'kJ', 2, 'ΔE = mcΔθ (1) = 0.50 × 4200 × 80 = 168 000 J = 168 kJ (1)'),
        P('Calculate the minimum time this would take.', 0.5 * 4200 * 80 / 2200, 's', 2, 't = E/P (1) = 168 000/2200 = 76 s (1)'),
        P('It actually takes 95 s. Calculate the efficiency of the kettle as a percentage.', 0.5 * 4200 * 80 / (2200 * 95) * 100, '%', 2, 'Energy supplied = 2200 × 95 = 209 000 J (1); efficiency = 168 000/209 000 = 80 % (1)'),
      ] },
    ],
  },
  {
    id: 'gcse-electricity-waves', title: 'Electricity & Waves', style: 'GCSE-style', level: 'school', mins: 30, sec: 'physics',
    info: 'Give answers to 2–3 significant figures.',
    questions: [
      { stem: 'A 12 V battery is connected to a 4.0 Ω resistor and an 8.0 Ω resistor in series.', parts: [
        P('Calculate the total resistance.', 12, 'Ω', 1, 'R = R₁ + R₂ = 12 Ω (1)'),
        P('Calculate the current in the circuit.', 1, 'A', 2, 'I = V/R (1) = 12/12 = 1.0 A (1)'),
        P('Calculate the potential difference across the 8.0 Ω resistor.', 8, 'V', 2, 'V = IR (1) = 1.0 × 8.0 = 8.0 V (1)'),
        P('Calculate the power dissipated in the 4.0 Ω resistor.', 4, 'W', 2, 'P = I²R (1) = 1.0² × 4.0 = 4.0 W (1)'),
      ] },
      { stem: 'The same two resistors are now connected in parallel across the 12 V battery.', parts: [
        P('Calculate the total resistance of the combination.', 1 / (1 / 4 + 1 / 8), 'Ω', 2, '1/R = 1/4 + 1/8 (1) → R = 2.7 Ω (1)'),
        P('Calculate the current from the battery.', 12 / 4 + 12 / 8, 'A', 2, 'I = 12/4 + 12/8 (1) = 4.5 A (1)'),
      ] },
      { stem: 'A water wave has a frequency of 50 Hz and a wavelength of 0.40 m.', parts: [
        P('Calculate the wave speed.', 50 * 0.4, 'm/s', 2, 'v = fλ (1) = 20 m/s (1)'),
        P('Calculate the period of the wave.', 1 / 50, 's', 1, 'T = 1/f = 0.020 s (1)'),
      ] },
      { stem: 'A current of 0.25 A flows through a lamp for 2.0 minutes. The potential difference across the lamp is 6.0 V.', parts: [
        P('Calculate the charge that flows.', 0.25 * 120, 'C', 2, 'Q = It (1) = 0.25 × 120 = 30 C (1)'),
        P('Calculate the energy transferred.', 30 * 6, 'J', 2, 'E = QV (1) = 30 × 6.0 = 180 J (1)'),
      ] },
    ],
  },
  {
    id: 'alevel-mechanics', title: 'Mechanics', style: 'A-level-style', level: 'school', mins: 45, sec: 'physics',
    info: 'Take g = 9.81 m s⁻². Ignore air resistance unless stated.',
    questions: [
      { stem: 'A ball is kicked from level ground at 20 m s⁻¹ at 30° above the horizontal.', parts: [
        P('Calculate the time of flight.', 2 * 20 * Math.sin(PI / 6) / g, 's', 3, 'uᵧ = 20 sin 30° = 10 m s⁻¹ (1); t = 2uᵧ/g (1) = 2.04 s (1)'),
        P('Calculate the horizontal range.', 20 * Math.cos(PI / 6) * 2 * 20 * Math.sin(PI / 6) / g, 'm', 2, 'uₓ = 20 cos 30° = 17.3 m s⁻¹ (1); R = uₓt = 35.3 m (1)'),
        P('Calculate the maximum height.', 10 ** 2 / (2 * g), 'm', 2, 'v² = u² − 2gh with v = 0 (1): h = 10²/(2 × 9.81) = 5.10 m (1)'),
      ] },
      { stem: 'A 0.80 kg trolley moving at 3.0 m s⁻¹ collides with a stationary 1.2 kg trolley. They stick together.', parts: [
        P('Calculate their common velocity after the collision.', 0.8 * 3 / 2, 'm s⁻¹', 2, 'Momentum conserved: 0.80 × 3.0 = 2.0v (1) → v = 1.2 m s⁻¹ (1)'),
        P('Calculate the kinetic energy lost in the collision.', 0.5 * 0.8 * 9 - 0.5 * 2 * 1.2 ** 2, 'J', 3, 'Initial Eₖ = 3.6 J (1); final Eₖ = 1.44 J (1); loss = 2.16 J (1)'),
      ] },
      { stem: 'A 0.50 kg mass on a string moves in a horizontal circle of radius 0.80 m at 2.0 revolutions per second. Ignore gravity.', parts: [
        P('Calculate the angular speed.', 2 * PI * 2, 'rad s⁻¹', 1, 'ω = 2πf = 12.6 rad s⁻¹ (1)'),
        P('Calculate the tension in the string.', 0.5 * (4 * PI) ** 2 * 0.8, 'N', 2, 'T = mω²r (1) = 0.50 × 12.57² × 0.80 = 63.2 N (1)'),
      ] },
      { stem: 'A uniform 4.0 m beam of weight 200 N rests on supports at each end. A 500 N load sits 1.0 m from the left end.', parts: [
        P('Calculate the reaction at the left support.', (200 * 2 + 500 * 3) / 4, 'N', 3, 'Moments about right support (1): 4R_L = 200 × 2.0 + 500 × 3.0 (1) → R_L = 475 N (1)'),
        P('Calculate the reaction at the right support.', 700 - 475, 'N', 1, 'R_R = 700 − 475 = 225 N (1)'),
      ] },
    ],
  },
  {
    id: 'alevel-fields-thermal-nuclear', title: 'Fields, Thermal & Nuclear', style: 'A-level-style', level: 'school', mins: 45, sec: 'physics',
    info: 'R = 8.31 J mol⁻¹ K⁻¹, k = 1.38 × 10⁻²³ J K⁻¹, GM(Earth) = 3.99 × 10¹⁴ N m² kg⁻¹.',
    questions: [
      { stem: 'A 220 µF capacitor is charged to 12 V and then discharged through a 47 kΩ resistor.', parts: [
        P('Calculate the initial charge on the capacitor.', 220e-6 * 12 * 1e3, 'mC', 1, 'Q = CV = 220 × 10⁻⁶ × 12 = 2.64 mC (1)'),
        P('Calculate the energy stored.', 0.5 * 220e-6 * 144 * 1e3, 'mJ', 2, 'E = ½CV² (1) = 15.8 mJ (1)'),
        P('Calculate the time constant.', 220e-6 * 47e3, 's', 1, 'τ = RC = 10.3 s (1)'),
        P('Calculate the p.d. after 5.0 s.', 12 * Math.exp(-5 / (220e-6 * 47e3)), 'V', 2, 'V = V₀e^(−t/RC) (1) = 12e^(−5.0/10.3) = 7.4 V (1)'),
      ] },
      { stem: 'An ideal gas occupies 0.020 m³ at 100 kPa and 300 K.', parts: [
        P('Calculate the amount of gas.', 1e5 * 0.02 / (8.31 * 300), 'mol', 2, 'n = pV/RT (1) = 0.802 mol (1)'),
        P('The gas is heated at constant volume to 450 K. Calculate the new pressure.', 150, 'kPa', 1, 'p ∝ T: p = 100 × 450/300 = 150 kPa (1)'),
        P('Calculate the mean translational kinetic energy of a molecule at 450 K, in units of 10⁻²¹ J.', 1.5 * 1.38e-23 * 450 / 1e-21, '×10⁻²¹ J', 2, 'Eₖ = (3/2)kT (1) = 9.32 × 10⁻²¹ J (1)'),
      ] },
      { stem: 'Iodine-131 has a half-life of 8.0 days. A sample has an initial activity of 4.0 MBq.', parts: [
        P('Calculate the decay constant in units of 10⁻⁶ s⁻¹.', Math.log(2) / (8 * 86400) / 1e-6, '×10⁻⁶ s⁻¹', 2, 'λ = ln 2 / t½ (1), t½ in seconds = 6.91 × 10⁵ s → λ = 1.00 × 10⁻⁶ s⁻¹ (1)'),
        P('Calculate the activity after 20 days.', 4 * 2 ** (-20 / 8), 'MBq', 2, 'A = A₀(½)^(t/t½) (1) = 4.0 × 0.5^2.5 = 0.71 MBq (1)'),
      ] },
      { stem: 'A geostationary satellite has an orbital period of 24 hours.', parts: [
        P('Calculate its orbital radius in units of 10⁷ m.', Math.cbrt(3.99e14 * 86400 ** 2 / (4 * PI * PI)) / 1e7, '×10⁷ m', 3, 'GMm/r² = mω²r (1) → r³ = GMT²/4π² (1) → r = 4.23 × 10⁷ m (1)'),
        P('Calculate its orbital speed.', 2 * PI * Math.cbrt(3.99e14 * 86400 ** 2 / (4 * PI * PI)) / 86400, 'm s⁻¹', 1, 'v = 2πr/T = 3.07 × 10³ m s⁻¹ (1)'),
      ] },
    ],
  },
  {
    id: 'ib-waves-quantum', title: 'Waves & Quantum Physics', style: 'IB-style (HL)', level: 'school', mins: 40, sec: 'quantum',
    info: 'h = 6.63 × 10⁻³⁴ J s, c = 3.00 × 10⁸ m s⁻¹, e = 1.60 × 10⁻¹⁹ C, mₑ = 9.11 × 10⁻³¹ kg. hc = 1240 eV nm.',
    questions: [
      { stem: 'Ultraviolet light of wavelength 250 nm falls on a metal with work function 4.3 eV.', parts: [
        P('Calculate the photon energy in eV.', 1240 / 250, 'eV', 2, 'E = hc/λ (1) = 1240/250 = 4.96 eV (1)'),
        P('Calculate the maximum kinetic energy of the emitted electrons.', 1240 / 250 - 4.3, 'eV', 1, 'Eₖ = hf − Φ = 0.66 eV (1)', 0.03),
        P('Calculate the threshold wavelength.', 1240 / 4.3, 'nm', 2, 'λ₀ = hc/Φ (1) = 288 nm (1)'),
      ] },
      { stem: 'Monochromatic light of wavelength 600 nm passes through two slits 0.25 mm apart. The screen is 1.5 m away.', parts: [
        P('Calculate the fringe spacing.', 600e-9 * 1.5 / 0.25e-3 * 1e3, 'mm', 2, 's = λD/d (1) = 3.6 mm (1)'),
        P('Calculate the fringe spacing when the wavelength is changed to 450 nm.', 450e-9 * 1.5 / 0.25e-3 * 1e3, 'mm', 1, 's ∝ λ: 3.6 × 450/600 = 2.7 mm (1)'),
      ] },
      { stem: 'An electron is accelerated from rest through a potential difference of 150 V.', parts: [
        P('Calculate its de Broglie wavelength in nm.', 6.63e-34 / Math.sqrt(2 * 9.11e-31 * 1.6e-19 * 150) * 1e9, 'nm', 3, 'Eₖ = eV (1); p = √(2mEₖ) (1); λ = h/p = 0.100 nm (1)'),
      ] },
      { stem: 'In hydrogen, an electron falls from n = 3 to n = 2. Use Eₙ = −13.6 eV/n².', parts: [
        P('Calculate the energy of the emitted photon.', 13.6 * (1 / 4 - 1 / 9), 'eV', 2, 'ΔE = 13.6(1/2² − 1/3²) (1) = 1.89 eV (1)'),
        P('Calculate its wavelength.', 1240 / (13.6 * (1 / 4 - 1 / 9)), 'nm', 2, 'λ = hc/ΔE (1) = 656 nm (red, Hα) (1)'),
      ] },
    ],
  },
  {
    id: 'uni-engineering-y1', title: 'Engineering Mechanics & Thermofluids', style: 'University Year 1', level: 'uni', mins: 60, sec: 'engineering',
    info: 'Use g = 9.81 m/s². State assumptions where appropriate.',
    questions: [
      { stem: 'A simply supported steel beam spans 6.0 m and carries a uniformly distributed load of 10 kN/m (including self-weight). E = 200 GPa, I = 8.0 × 10⁻⁵ m⁴, section depth 300 mm (symmetric).', parts: [
        P('Calculate the maximum bending moment.', 10 * 36 / 8, 'kN·m', 2, 'M_max = wL²/8 (1) = 10 × 6²/8 = 45 kN·m (1)'),
        P('Calculate the maximum deflection.', 5 * 10e3 * 6 ** 4 / (384 * 200e9 * 8e-5) * 1e3, 'mm', 3, 'δ = 5wL⁴/(384EI) (1), consistent units (1) → 10.5 mm (1)'),
        P('Calculate the maximum bending stress.', 45e3 * 0.15 / 8e-5 / 1e6, 'MPa', 2, 'σ = Mc/I (1) = 45 × 10³ × 0.15/8.0 × 10⁻⁵ = 84.4 MPa (1)'),
      ] },
      { stem: 'A solid shaft of diameter 40 mm transmits 20 kW at 1200 rev/min.', parts: [
        P('Calculate the torque.', 20e3 / (1200 * 2 * PI / 60), 'N·m', 2, 'T = P/ω (1), ω = 125.7 rad/s → T = 159 N·m (1)'),
        P('Calculate the maximum shear stress.', 16 * (20e3 / (1200 * 2 * PI / 60)) / (PI * 0.04 ** 3) / 1e6, 'MPa', 2, 'τ = 16T/πd³ (1) = 12.7 MPa (1)'),
      ] },
      { stem: 'Water (ν = 1.0 × 10⁻⁶ m²/s) flows at 0.020 m³/s through a 100 mm bore pipe 50 m long. Take the Darcy friction factor as 0.018.', parts: [
        P('Calculate the mean velocity.', 0.02 / (PI * 0.1 ** 2 / 4), 'm/s', 1, 'V = Q/A = 2.55 m/s (1)'),
        P('Calculate the Reynolds number in units of 10⁵.', 0.02 / (PI * 0.1 ** 2 / 4) * 0.1 / 1e-6 / 1e5, '×10⁵', 2, 'Re = VD/ν (1) = 2.55 × 10⁵ — turbulent (1)'),
        P('Calculate the friction head loss.', 0.018 * 50 / 0.1 * (0.02 / (PI * 0.1 ** 2 / 4)) ** 2 / (2 * g), 'm', 3, 'h_f = f(L/D)V²/2g (1)(1) = 2.97 m (1)'),
      ] },
      { stem: 'A heat engine operates between reservoirs at 800 K and 300 K. It absorbs 100 kW and delivers 35 kW of work.', parts: [
        P('Calculate the Carnot efficiency.', (1 - 300 / 800) * 100, '%', 1, 'η_C = 1 − T_C/T_H = 62.5 % (1)'),
        P('Calculate the second-law efficiency.', 0.35 / (1 - 300 / 800) * 100, '%', 2, 'η = 35 % (1); η_II = 35/62.5 = 56 % (1)'),
      ] },
      { stem: 'An air-standard Otto cycle has a compression ratio of 9 (γ = 1.4).', parts: [
        P('Calculate the thermal efficiency.', (1 - 9 ** -0.4) * 100, '%', 2, 'η = 1 − r^(1−γ) (1) = 58.5 % (1)'),
      ] },
    ],
  },
];
export const PAPER = Object.fromEntries(PAPERS.map(p => [p.id, p]));
export const paperMarks = p => p.questions.reduce((s, q) => s + q.parts.reduce((a, x) => a + x.marks, 0), 0);
