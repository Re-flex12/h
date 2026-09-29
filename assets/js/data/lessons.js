// Lessons: Theory → Diagram → Equations → Worked example → Simulation → Questions → Apply.
// Math: $inline$ and $$display$$ (rendered with KaTeX). Depth blocks: { d: 'school'|'uni'|'pro', p }.
// Questions: numeric answers in the stated unit, relative tolerance tol (default 2 %).

export const LESSONS = [
  {
    id: 'suvat', title: 'Motion with Constant Acceleration', section: 'physics', topic: 'Mechanics', levels: ['school', 'uni'],
    intro: 'Five quantities — displacement, initial velocity, final velocity, acceleration and time — linked by four equations. Know any three, find the other two.',
    body: [
      { h: 'The idea' },
      { p: 'When acceleration $a$ is constant, velocity changes linearly with time and displacement is the area under the velocity–time graph. Everything else follows from those two facts.' },
      { fig: 'vt' },
      { eq: 'v = u + at' }, { eq: 's = \\tfrac12(u+v)t' }, { eq: 's = ut + \\tfrac12at^2' }, { eq: 'v^2 = u^2 + 2as' },
      { d: 'school', p: 'Pick a positive direction and stick with it. Anything pointing the other way (like gravity when you throw a ball upward) gets a minus sign. Each equation leaves out exactly one of the five quantities — choose the one that omits the quantity you neither know nor want.' },
      { d: 'uni', p: 'These are the integrals of $\\ddot x = a$: $\\dot x = u + at$ and $x = ut + \\tfrac12 at^2$. Eliminating $t$ gives $v^2 = u^2 + 2as$ — the work–energy theorem per unit mass, $\\tfrac12 v^2 - \\tfrac12 u^2 = as$.' },
      { d: 'pro', p: 'Real systems rarely have constant acceleration (drag, variable thrust, controller dynamics). Use SUVAT for bounding estimates, then integrate the equations of motion numerically (RK4 or better) for design — see the pendulum simulation for an RK4 example.' },
    ],
    example: { q: 'A car accelerates uniformly from 5 m/s to 25 m/s in 8 s. How far does it travel?', steps: ['Known: $u = 5$ m/s, $v = 25$ m/s, $t = 8$ s. Want $s$; $a$ is not needed.', 'Use the equation without $a$: $s = \\tfrac12(u+v)t$.', '$s = \\tfrac12(5 + 25)(8) = 120$ m.'], a: '120 m' },
    questions: [
      { q: 'A ball is dropped from rest. How far has it fallen after 2.0 s? (g = 9.81 m/s²)', ans: 19.62, unit: 'm', hint: 'u = 0, a = g, t = 2 s. Which equation has s, u, a and t?', sol: '$s = ut + \\tfrac12 at^2 = 0 + \\tfrac12(9.81)(2.0)^2 = 19.6$ m.' },
      { q: 'A train decelerates uniformly from 30 m/s to rest over 450 m. What is the magnitude of its deceleration?', ans: 1.0, unit: 'm/s²', hint: 'No time given — use v² = u² + 2as.', sol: '$0 = 30^2 + 2a(450) \\Rightarrow a = -1.0$ m/s², so the deceleration is 1.0 m/s².' },
      { q: 'A stone is thrown straight up at 15 m/s. How long until it reaches its highest point? (g = 9.81 m/s²)', ans: 1.529, unit: 's', hint: 'At the top, v = 0.', sol: '$0 = 15 - 9.81t \\Rightarrow t = 1.53$ s.' },
    ],
    calcs: ['suvat', 'projectile'], sims: ['projectile'], eqs: ['suvat1', 'suvat2', 'suvat3'],
  },
  {
    id: 'moments', title: 'Moments and Equilibrium', section: 'physics', topic: 'Mechanics', levels: ['school', 'uni', 'pro'],
    intro: 'A moment is the turning effect of a force. Balance the forces and the moments and a structure stays put — the foundation of every beam, truss and bracket calculation.',
    body: [
      { h: 'Turning effect' },
      { p: 'The moment of a force about a point is the force multiplied by the perpendicular distance from the point to the force’s line of action.' },
      { eq: 'M = F\\,d_\\perp' },
      { fig: 'beam' },
      { h: 'Equilibrium' },
      { p: 'A body is in static equilibrium when both the resultant force and the resultant moment are zero:' },
      { eq: '\\sum F_x = 0,\\qquad \\sum F_y = 0,\\qquad \\sum M = 0' },
      { d: 'school', p: 'Principle of moments: for a balanced object, total clockwise moment = total anticlockwise moment about any point. Taking moments about a support removes that support’s unknown force from the equation.' },
      { d: 'uni', p: 'In 2D you have three independent equilibrium equations, so you can solve for three unknown reactions. A beam with more unknowns than that is statically indeterminate — you then need compatibility (deflection) conditions, which is what the Beam Solver does with a stiffness method.' },
      { d: 'pro', p: 'Design checks start from reactions: they size bearings, anchor bolts and foundations. Always check load paths and load combinations (e.g. EN 1990 / ASCE 7) — a statically correct analysis of the wrong load case is still wrong.' },
    ],
    example: { q: 'A 4 m simply supported beam carries a 10 kN point load 1 m from the left support A. Find the reactions.', steps: ['Take moments about A (clockwise positive): $10 \\times 1 - R_B \\times 4 = 0$.', '$R_B = 2.5$ kN.', 'Vertical equilibrium: $R_A + R_B = 10 \\Rightarrow R_A = 7.5$ kN.'], a: '$R_A$ = 7.5 kN, $R_B$ = 2.5 kN' },
    questions: [
      { q: 'A 600 N person stands 1.5 m from the pivot of a see-saw. How far from the pivot on the other side must a 450 N person sit to balance?', ans: 2.0, unit: 'm', hint: 'Clockwise moment = anticlockwise moment.', sol: '$600 \\times 1.5 = 450 d \\Rightarrow d = 2.0$ m.' },
      { q: 'A 6 m simply supported beam carries a UDL of 4 kN/m over its full length. What is each reaction?', ans: 12, unit: 'kN', hint: 'Total load = w × L, shared equally by symmetry.', sol: 'Total load $= 4 \\times 6 = 24$ kN; by symmetry $R_A = R_B = 12$ kN.' },
      { q: 'A spanner 0.25 m long needs a 50 N·m torque to loosen a nut. What force is needed at the end, applied perpendicular?', ans: 200, unit: 'N', sol: '$F = M/d = 50/0.25 = 200$ N.' },
    ],
    calcs: ['beam-cases'], solvers: ['beam', 'truss'], eqs: ['moment'],
  },
  {
    id: 'momentum', title: 'Momentum and Collisions', section: 'physics', topic: 'Mechanics', levels: ['school', 'uni'],
    intro: 'Momentum is conserved in every collision. Kinetic energy is conserved only in perfectly elastic ones — the coefficient of restitution tells you how much is lost.',
    body: [
      { eq: 'p = mv' }, { eq: 'm_1u_1 + m_2u_2 = m_1v_1 + m_2v_2' },
      { p: 'Impulse — force multiplied by contact time — equals the change in momentum: $J = F\\Delta t = \\Delta p$. That is why airbags and crumple zones work: they stretch $\\Delta t$ to reduce $F$.' },
      { d: 'school', p: 'In an elastic collision both momentum and kinetic energy are conserved. In an inelastic one momentum is conserved but some kinetic energy becomes heat, sound and deformation. If the objects stick together, the collision is perfectly inelastic.' },
      { d: 'uni', p: 'Newton’s experimental law: $e = (v_2 - v_1)/(u_1 - u_2)$. Combined with momentum conservation this gives both final velocities; $e = 1$ recovers the elastic result.' },
    ],
    example: { q: 'A 2 kg trolley at 3 m/s hits a stationary 1 kg trolley and they stick together. Find their common velocity.', steps: ['Momentum before: $2 \\times 3 + 1 \\times 0 = 6$ kg·m/s.', 'After: $(2 + 1)v = 6 \\Rightarrow v = 2$ m/s.', 'KE lost: $\\tfrac12(2)(3^2) - \\tfrac12(3)(2^2) = 9 - 6 = 3$ J.'], a: '2 m/s (3 J lost)' },
    questions: [
      { q: 'A 0.16 kg cricket ball at 30 m/s is caught and stopped in 0.12 s. What is the average force on the hands?', ans: 40, unit: 'N', sol: '$F = \\Delta p/\\Delta t = 0.16 \\times 30/0.12 = 40$ N.' },
      { q: 'A 1200 kg car at 15 m/s rear-ends a stationary 800 kg car; they lock together. What is their speed just after?', ans: 9, unit: 'm/s', sol: '$1200 \\times 15 = 2000 v \\Rightarrow v = 9$ m/s.' },
    ],
    calcs: ['collision'], eqs: ['momentum', 'impulse'],
  },
  {
    id: 'stress-strain', title: "Stress, Strain and Young's Modulus", section: 'engineering', topic: 'Solid mechanics', levels: ['school', 'uni', 'pro'],
    intro: 'Stress is how hard a material is being loaded; strain is how much it stretches. In the elastic region they are proportional — the constant is Young’s modulus.',
    body: [
      { eq: '\\sigma = \\frac{F}{A},\\qquad \\varepsilon = \\frac{\\Delta L}{L},\\qquad E = \\frac{\\sigma}{\\varepsilon}' },
      { fig: 'ss' },
      { d: 'school', p: 'Up to the limit of proportionality the graph is a straight line (Hooke’s law). Past the elastic limit the material deforms permanently (plastic deformation). The peak of the curve is the ultimate tensile strength; the area under the curve is the energy absorbed per unit volume (toughness).' },
      { d: 'uni', p: 'For ductile metals with no sharp yield point, the yield strength is defined by the 0.2 % offset method. Poisson’s ratio $\\nu = -\\varepsilon_{lat}/\\varepsilon_{axial}$ links axial and lateral strain; for isotropic materials $G = E/[2(1+\\nu)]$.' },
      { d: 'pro', p: 'Design uses minimum (specification) or statistically based allowables — not typical handbook values. The Materials Database labels each entry with its basis. For multiaxial stress states, compare an equivalent stress (von Mises) with yield — see the Mohr’s Circle calculator.' },
    ],
    example: { q: 'A 12 mm diameter steel rod (E = 205 GPa), 1 m long, carries 20 kN in tension. Find the stress and elongation.', steps: ['$A = \\pi(0.012)^2/4 = 1.131\\times10^{-4}$ m².', '$\\sigma = 20\\,000/1.131\\times10^{-4} = 176.8$ MPa.', '$\\delta = \\sigma L/E = 176.8\\times10^6 \\times 1/205\\times10^9 = 0.862$ mm.'], a: 'σ ≈ 177 MPa, δ ≈ 0.86 mm' },
    questions: [
      { q: 'A wire of cross-section 0.5 mm² extends by 1.0 mm under 50 N. Its original length is 2.0 m. What is Young’s modulus in GPa?', ans: 200, unit: 'GPa', hint: 'σ = F/A, ε = ΔL/L.', sol: '$\\sigma = 50/0.5\\times10^{-6} = 100$ MPa; $\\varepsilon = 0.001/2 = 5\\times10^{-4}$; $E = 200$ GPa.' },
      { q: 'An aluminium bar (E = 69 GPa) must not stretch more than 0.5 mm over 1.5 m. What is the maximum allowable stress in MPa?', ans: 23, unit: 'MPa', sol: '$\\varepsilon = 0.5/1500 = 3.33\\times10^{-4}$; $\\sigma = E\\varepsilon = 23$ MPa.' },
    ],
    calcs: ['axial-stress', 'mohr', 'fatigue'], eqs: ['stress', 'strain', 'youngs'], tools: ['materials', 'compare'],
  },
  {
    id: 'beam-bending', title: 'Beam Bending', section: 'engineering', topic: 'Structural', levels: ['school', 'uni', 'pro'],
    intro: 'Same physics, three depths: what a moment does to a beam, how to find reactions and bending moment, and how engineers turn that into stress and deflection checks.',
    body: [
      { d: 'school', p: '<b>What is a moment?</b> A load on a beam tries to rotate it about each support. The supports push back (reactions) so that forces and moments balance. The beam bends: its top is squashed and its bottom is stretched (for a sagging beam).' },
      { d: 'uni', p: '<b>Shear force and bending moment.</b> Cutting the beam at $x$ and applying equilibrium to one side gives the internal shear $V(x)$ and moment $M(x)$. They are linked by $dV/dx = -w$ and $dM/dx = V$, so the bending moment peaks where the shear force crosses zero.' },
      { eq: '\\frac{M}{I} = \\frac{\\sigma}{y} = \\frac{E}{R}' },
      { eq: 'EI\\frac{d^2 v}{dx^2} = M(x)' },
      { d: 'pro', p: '<b>Design checks.</b> Bending stress $\\sigma = Mc/I$ against yield (or $M \\le Z_p f_y/\\gamma_{M0}$ in EN 1993), shear, deflection limits (often span/250 to span/360 for floors), lateral-torsional buckling for unrestrained compression flanges, and local bearing at supports. The Beam Solver gives reactions, SFD, BMD, deflection and stress for arbitrary loads — then check the code clauses.' },
      { fig: 'beam' },
    ],
    example: { q: 'A 4 m simply supported steel beam (E = 210 GPa, I = 8.36×10⁶ mm⁴) carries 10 kN at mid-span. Find M_max and δ_max.', steps: ['$M_{max} = PL/4 = 10 \\times 4/4 = 10$ kN·m.', '$\\delta_{max} = PL^3/(48EI) = 10\\,000 \\times 4^3/(48 \\times 210\\times10^9 \\times 8.36\\times10^{-6})$.', '$\\delta_{max} = 7.59$ mm (span/527).'], a: 'M = 10 kN·m, δ ≈ 7.6 mm' },
    questions: [
      { q: 'A 3 m cantilever carries 2 kN at its free end. What is the maximum bending moment in kN·m?', ans: 6, unit: 'kN·m', sol: '$M = PL = 2 \\times 3 = 6$ kN·m at the fixed end.' },
      { q: 'A rectangular section 50 mm wide × 100 mm deep carries M = 2 kN·m. What is the maximum bending stress in MPa?', ans: 24, unit: 'MPa', hint: 'I = bh³/12, c = h/2.', sol: '$Z = bh^2/6 = 50 \\times 100^2/6 = 83\\,333$ mm³; $\\sigma = 2\\times10^6/83\\,333 = 24$ MPa.' },
      { q: 'A 5 m simply supported beam carries 6 kN/m UDL. What is the maximum bending moment in kN·m?', ans: 18.75, unit: 'kN·m', sol: '$M = wL^2/8 = 6 \\times 25/8 = 18.75$ kN·m.' },
    ],
    calcs: ['beam-cases', 'section', 'buckling'], solvers: ['beam'], eqs: ['bending', 'ss-point', 'ss-udl'],
  },
  {
    id: 'reynolds', title: 'Reynolds Number and Pipe Flow', section: 'engineering', topic: 'Fluids', levels: ['school', 'uni', 'pro'],
    intro: 'The ratio of inertial to viscous forces decides whether flow is smooth or chaotic — and that decides how much energy a pipe system wastes.',
    body: [
      { eq: 'Re = \\frac{\\rho v D}{\\mu} = \\frac{vD}{\\nu}' },
      { d: 'school', p: 'Low Reynolds number: viscosity wins and the flow slides in smooth layers (laminar) — honey. High Reynolds number: inertia wins and the flow swirls into eddies (turbulent) — a fast river. In pipes, laminar flow is below about 2300 and turbulent above about 4000.' },
      { d: 'uni', p: 'Friction loss in a pipe follows Darcy–Weisbach, $h_f = f(L/D)v^2/2g$. For laminar flow $f = 64/Re$ exactly (Hagen–Poiseuille). For turbulent flow $f$ depends on both $Re$ and relative roughness $\\varepsilon/D$ through the Colebrook equation — which is what the Moody chart plots.' },
      { d: 'pro', p: 'Pressure drop scales roughly with $v^2$ (turbulent), so pumping power scales with $v^3$ for a given pipe. Doubling diameter cuts velocity by 4× and friction loss by ~30×. Balance capital cost (bigger pipe) against energy cost (bigger pump) — the Pipe Pressure Drop calculator gives shaft power directly.' },
    ],
    example: { q: 'Water at 20 °C (ρ = 998 kg/m³, μ = 1.0×10⁻³ Pa·s) flows at 2 m/s in a 25 mm pipe. Is it turbulent?', steps: ['$Re = 998 \\times 2 \\times 0.025/1.0\\times10^{-3}$.', '$Re = 49\\,900$.', 'Well above 4000 → turbulent.'], a: 'Re ≈ 50 000 — turbulent' },
    questions: [
      { q: 'Oil (ν = 1.0×10⁻⁴ m²/s) flows at 0.5 m/s in a 50 mm pipe. What is Re?', ans: 250, unit: '', sol: '$Re = vD/\\nu = 0.5 \\times 0.05/10^{-4} = 250$ — laminar.' },
      { q: 'For laminar flow at Re = 1600, what is the Darcy friction factor?', ans: 0.04, unit: '', sol: '$f = 64/Re = 0.04$.' },
    ],
    calcs: ['reynolds', 'pipe-flow', 'pump-power'], eqs: ['reynolds', 'darcy'], tools: ['fluids'],
  },
  {
    id: 'bernoulli', title: "Bernoulli's Equation", section: 'engineering', topic: 'Fluids', levels: ['school', 'uni'],
    intro: 'Energy conservation for a flowing fluid: where a fluid speeds up, its pressure drops.',
    body: [
      { eq: 'p + \\tfrac12\\rho v^2 + \\rho g z = \\text{constant along a streamline}' },
      { p: 'Combined with continuity ($A_1v_1 = A_2v_2$), Bernoulli explains venturi meters, carburettors, the pressure drop at a pipe contraction and (with care) lift.' },
      { d: 'school', p: 'Each term is an energy per unit volume: pressure energy, kinetic energy and potential energy. If one goes up, the others must go down.' },
      { d: 'uni', p: 'Valid for steady, incompressible, inviscid flow along a streamline. Real pipes lose energy to friction — add a head-loss term $h_L$ (see Darcy–Weisbach).' },
    ],
    example: { q: 'Water flows at 5 L/s from an 80 mm pipe into a 40 mm throat. If p₁ = 200 kPa (gauge), what is p₂?', steps: ['$v_1 = 0.005/(\\pi 0.04^2) = 0.995$ m/s, $v_2 = 3.98$ m/s.', '$p_2 = p_1 + \\tfrac12\\rho(v_1^2 - v_2^2) = 200\\,000 + 499(0.99 - 15.84)$.', '$p_2 = 192.6$ kPa.'], a: '≈ 192.6 kPa' },
    questions: [
      { q: 'Water speeds up from 1 m/s to 3 m/s in a horizontal pipe. What is the pressure drop in kPa? (ρ = 1000 kg/m³)', ans: 4, unit: 'kPa', sol: '$\\Delta p = \\tfrac12\\rho(v_2^2 - v_1^2) = 500(9 - 1) = 4$ kPa.' },
    ],
    calcs: ['venturi', 'orifice'], eqs: ['bernoulli', 'continuity'],
  },
  {
    id: 'circuits', title: "Circuits: Ohm's and Kirchhoff's Laws", section: 'physics', topic: 'Electricity', levels: ['school', 'uni'],
    intro: 'Two conservation laws — of charge and of energy — plus Ohm’s law are enough to analyse any resistive circuit.',
    body: [
      { eq: 'V = IR' },
      { p: '<b>Kirchhoff’s current law</b> (charge conservation): the currents into a junction sum to zero, $\\sum I = 0$. <b>Kirchhoff’s voltage law</b> (energy conservation): the voltages around any closed loop sum to zero, $\\sum V = 0$.' },
      { eq: 'R_{series} = R_1 + R_2 + \\dots,\\qquad \\frac{1}{R_{parallel}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\dots' },
      { d: 'school', p: 'In series, the same current flows through everything and the voltages add. In parallel, every branch has the same voltage and the currents add. Adding a resistor in parallel always lowers the total resistance.' },
      { d: 'uni', p: 'Systematic methods — nodal analysis (KCL at each node) and mesh analysis (KVL round each loop) — turn any linear circuit into a matrix equation. Thévenin’s theorem replaces any linear network, seen from two terminals, with a voltage source in series with a resistance.' },
    ],
    example: { q: 'A 12 V supply drives 100 Ω in series with (200 Ω ∥ 300 Ω). Find the supply current.', steps: ['$200 \\parallel 300 = 200\\times300/500 = 120$ Ω.', '$R_{tot} = 100 + 120 = 220$ Ω.', '$I = 12/220 = 54.5$ mA.'], a: '54.5 mA' },
    questions: [
      { q: 'What is the equivalent resistance of 6 Ω and 3 Ω in parallel?', ans: 2, unit: 'Ω', sol: '$6 \\times 3/(6 + 3) = 2$ Ω.' },
      { q: 'A 2 kW kettle runs on 230 V. What current does it draw?', ans: 8.696, unit: 'A', sol: '$I = P/V = 2000/230 = 8.70$ A.' },
    ],
    calcs: ['ohm', 'combine', 'divider'], eqs: ['ohm', 'epower'],
  },
  {
    id: 'photoelectric', title: 'Photons and the Photoelectric Effect', section: 'quantum', topic: 'Quantum foundations', levels: ['school', 'uni'],
    intro: 'Light arrives in packets. Brighter light means more packets, not bigger ones — which is why red light can never eject electrons from zinc, however intense.',
    body: [
      { eq: 'E = hf = \\frac{hc}{\\lambda}' },
      { eq: 'hf = \\phi + K_{max}' },
      { d: 'school', p: 'Each photon gives all its energy to one electron. If $hf$ is less than the work function $\\phi$ (the energy needed to escape the metal), no electrons come out at all. Above the threshold frequency, extra photon energy becomes the electron’s kinetic energy. Intensity only changes how many electrons are emitted per second.' },
      { d: 'uni', p: 'Classical wave theory predicted a time delay at low intensity and a kinetic energy depending on intensity — neither is observed. Einstein’s 1905 photon hypothesis explained both, and Millikan’s stopping-potential measurements ($eV_s = hf - \\phi$) gave $h$ from the slope of $V_s$ vs $f$.' },
      { h: 'Blackbody radiation' },
      { p: 'Planck’s quantisation of oscillator energies ($E = nhf$) removed the ultraviolet catastrophe of classical theory and produced the blackbody spectrum — try the Blackbody calculator.' },
    ],
    example: { q: 'Light of wavelength 400 nm falls on sodium (φ = 2.36 eV). Find K_max.', steps: ['$E = hc/\\lambda = 1240\\text{ eV·nm}/400\\text{ nm} = 3.10$ eV.', '$K_{max} = 3.10 - 2.36 = 0.74$ eV.', 'Stopping potential $V_s = 0.74$ V.'], a: 'K_max ≈ 0.74 eV' },
    questions: [
      { q: 'What is the energy in eV of a 500 nm photon?', ans: 2.48, unit: 'eV', sol: '$E = 1239.84/500 = 2.48$ eV.' },
      { q: 'A metal has work function 4.3 eV. What is its threshold wavelength in nm?', ans: 288.3, unit: 'nm', sol: '$\\lambda_0 = hc/\\phi = 1239.84/4.3 = 288$ nm (ultraviolet).' },
    ],
    calcs: ['photon', 'photoelectric', 'blackbody', 'debroglie'], eqs: ['photon', 'photoelectric'], sims: ['double-slit'],
  },
  {
    id: 'time-dilation', title: 'Time Dilation and Length Contraction', section: 'quantum', topic: 'Special relativity', levels: ['school', 'uni', 'pro'],
    intro: 'If every inertial observer measures the same speed of light, then moving clocks must run slow and moving rulers must shrink.',
    body: [
      { eq: '\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}},\\qquad \\Delta t = \\gamma\\Delta t_0,\\qquad L = \\frac{L_0}{\\gamma}' },
      { d: 'school', p: 'Picture a light clock: a pulse bouncing between two mirrors. Seen from a moving train, the pulse travels straight up and down. Seen from the platform, it travels along a longer diagonal — at the same speed $c$. So each tick takes longer for the platform observer. Proper time $\\Delta t_0$ is measured by a clock at rest relative to the events.' },
      { d: 'uni', p: 'Muons made in the upper atmosphere live 2.2 µs in their rest frame — enough to travel only ~660 m at 0.998c classically. With $\\gamma \\approx 16$ they survive ~35 µs in the Earth frame and reach the ground; in the muon frame the atmosphere is contracted instead. The Lorentz transformation unifies both views; see the Minkowski diagram simulation.' },
      { d: 'pro', p: 'GPS satellites must correct for special-relativistic slowing (−7.2 µs/day) and general-relativistic speeding up (+45.7 µs/day). Uncorrected, the net 38 µs/day would accumulate ~11 km/day of ranging error — try the Orbital Clock Rates calculator.' },
    ],
    example: { q: 'A spaceship travels at 0.8c. A clock on board ticks 1 hour. How long is that on Earth?', steps: ['$\\gamma = 1/\\sqrt{1 - 0.64} = 1/0.6 = 1.667$.', '$\\Delta t = \\gamma\\Delta t_0 = 1.667$ h.', '= 1 h 40 min.'], a: '1.667 h' },
    questions: [
      { q: 'What is γ at v = 0.6c?', ans: 1.25, unit: '', sol: '$\\gamma = 1/\\sqrt{1 - 0.36} = 1/0.8 = 1.25$.' },
      { q: 'A 100 m spaceship passes at 0.866c. How long does it appear to an observer at rest (in m)?', ans: 50, unit: 'm', tol: 0.01, sol: '$\\gamma = 2$, so $L = 100/2 = 50$ m.' },
    ],
    calcs: ['lorentz', 'velocity-add', 'interval', 'gps'], sims: ['minkowski'], eqs: ['gamma', 'time-dilation', 'length-contraction'],
  },
  {
    id: 'black-holes', title: 'Black Holes', section: 'quantum', topic: 'General relativity', levels: ['school', 'uni', 'pro'],
    intro: 'Squeeze a mass inside its Schwarzschild radius and not even light escapes. The event horizon is not a surface — it is a point of no return in spacetime.',
    body: [
      { eq: 'r_s = \\frac{2GM}{c^2}' },
      { d: 'school', p: 'Escape velocity from a sphere is $\\sqrt{2GM/r}$. Setting it equal to $c$ gives the Schwarzschild radius (the Newtonian argument happens to give the right answer). For the Sun $r_s \\approx 3$ km; for Earth, about 9 mm.' },
      { d: 'uni', p: 'In the Schwarzschild metric, $ds^2 = -(1 - r_s/r)c^2dt^2 + (1 - r_s/r)^{-1}dr^2 + r^2d\\Omega^2$, clocks at radius $r$ run slow by $\\sqrt{1 - r_s/r}$. Light can orbit at the photon sphere $1.5\\,r_s$, and the innermost stable circular orbit for matter is at $3\\,r_s$ — the inner edge of a non-spinning black hole’s accretion disk.' },
      { d: 'pro', p: 'Spin changes everything close in: for a near-maximal Kerr black hole ($a_* = 0.998$) the prograde ISCO moves in to $\\approx 1.24\\,GM/c^2$, raising accretion efficiency from ~6 % to ~32 %. Quantum effects give a Hawking temperature $T_H = \\hbar c^3/8\\pi GMk_B$ — 60 nK for a solar-mass hole, far below the CMB.' },
    ],
    example: { q: 'What is the Schwarzschild radius of a 10 M☉ black hole?', steps: ['$r_s = 2GM/c^2 = 2(6.674\\times10^{-11})(1.989\\times10^{31})/(2.998\\times10^8)^2$.', '$r_s = 2.95\\times10^4$ m.', '≈ 29.5 km.'], a: '≈ 29.5 km' },
    questions: [
      { q: 'What is the Schwarzschild radius of the Earth (M = 5.97×10²⁴ kg) in mm?', ans: 8.87, unit: 'mm', sol: '$r_s = 2GM/c^2 = 8.87$ mm.' },
      { q: 'Using the non-spinning result, at how many Schwarzschild radii is the ISCO?', ans: 3, unit: '', tol: 0.001, sol: '$r_{ISCO} = 6GM/c^2 = 3r_s$.' },
    ],
    calcs: ['black-hole', 'grav-dilation', 'chirp'], sims: ['bh-orbit'], eqs: ['schwarzschild', 'grav-td', 'efe'],
  },
];

export const LESSON = Object.fromEntries(LESSONS.map(l => [l.id, l]));
