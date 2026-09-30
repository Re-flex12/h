// Master content map. Items are "|"-separated; an item may link to a live resource with
// ">kind:id" where kind ∈ calc | learn | sim | solver | eq | tool (tool = hash path, e.g. tool:units).
const g = (name, items) => ({ name, items: items.split('|').map(s => s.trim()).filter(Boolean) });

export const PHYSICS = {
  id: 'physics', code: 'PHY', name: 'Physics',
  blurb: 'Classical physics from first principles: mechanics, materials, waves, electromagnetism, thermal and nuclear physics.',
  groups: [
    g('Mechanics', 'Scalars and vectors>topic:scalars-vectors|Distance and displacement>topic:distance-displacement|Speed and velocity>topic:speed-velocity|Acceleration>topic:acceleration|Motion graphs>topic:motion-graphs|SUVAT>calc:suvat|Projectile motion>calc:projectile|Relative motion>topic:relative-motion|Newton\'s laws>eq:newton2|Free-body diagrams>topic:free-body-diagrams|Weight>eq:weight|Normal force>topic:normal-force|Tension>topic:tension|Friction>topic:friction|Drag>calc:drag|Terminal velocity>calc:drag|Equilibrium>learn:moments|Moments>learn:moments|Couples>topic:couples|Centre of mass>topic:centre-of-mass|Centre of gravity>topic:centre-of-gravity|Momentum>eq:momentum|Impulse>eq:impulse|Conservation of momentum>sim:collisions|Elastic/inelastic collisions>sim:collisions|Work>eq:work|Energy>eq:ke|Power>eq:power|Efficiency>eq:efficiency|Springs>eq:hooke|Hooke\'s law>eq:hooke|Elastic potential energy>eq:epe|Circular motion>calc:circular|Centripetal acceleration>calc:circular|Centripetal force>eq:centripetal|Gravitation>eq:gravity|Gravitational fields>topic:gravitational-fields|Gravitational potential>topic:gravitational-potential|Orbits>sim:kepler|Escape velocity>calc:orbit|SHM>calc:shm-spring|Pendulums>calc:pendulum|Rotational motion>topic:rotational-motion|Angular velocity>topic:angular-velocity|Angular acceleration>topic:angular-acceleration|Torque>eq:torque-alpha|Moment of inertia>calc:inertia|Angular momentum>topic:angular-momentum'),
    g('Materials', 'Density>eq:density|Hooke\'s law>eq:hooke|Stress>eq:stress|Strain>eq:strain|Young\'s modulus>learn:stress-strain|Elastic/plastic deformation>sim:tensile|Stress–strain curves>sim:tensile|Toughness>sim:tensile|Hardness>topic:hardness|Yield strength>tool:materials|Ultimate tensile strength>tool:materials|Thermal expansion>calc:thermal-stress'),
    g('Waves & Optics', 'Wave properties>sim:waves|Transverse/longitudinal waves>sim:waves|Wave speed>eq:wave-speed|Frequency>eq:period|Period>eq:period|Phase>sim:waves|Superposition>sim:waves|Interference>sim:double-slit|Standing waves>sim:waves|Resonance>calc:standing-wave|Diffraction>topic:diffraction|Double-slit interference>calc:double-slit|Diffraction gratings>eq:grating|Refraction>calc:snell|Snell\'s law>calc:snell|Critical angle>calc:snell|Total internal reflection>calc:snell|Polarisation>topic:polarisation|Doppler effect>calc:doppler-sound|Sound>calc:standing-wave|Intensity>topic:intensity|Decibels>eq:decibel|Mirrors>topic:mirrors|Thin lenses>sim:optics|Lens equation>eq:lens|Magnification>calc:lens|Optical instruments>sim:optics|Thin-film interference>topic:thin-film-interference'),
    g('Electricity & Magnetism', 'Charge>eq:charge|Current>topic:current|Potential difference>topic:potential-difference|EMF>topic:emf|Resistance>topic:resistance|Resistivity>eq:resistivity|Ohm\'s law>calc:ohm|Electrical power>eq:epower|Electrical energy>calc:energy-cost|Series/parallel circuits>calc:combine|Kirchhoff\'s laws>learn:circuits|Internal resistance>topic:internal-resistance|Potential dividers>calc:divider|Capacitors>calc:capacitor|RC circuits>calc:rc|Electric fields>sim:efield|Electric potential>sim:efield|Coulomb\'s law>eq:coulomb|Magnetic fields>calc:bfield|Magnetic flux>topic:magnetic-flux|Force on conductors>eq:lorentz-force|Force on charged particles>topic:force-on-charges|Electromagnetic induction>eq:faraday|Faraday\'s law>eq:faraday|Lenz\'s law>topic:lenzs-law|Transformers>calc:transformer|AC/DC>topic:ac-dc'),
    g('Thermal Physics', 'Temperature>topic:temperature|Internal energy>topic:internal-energy|Specific heat capacity>calc:heating|Latent heat>calc:heating|Gas laws>eq:ideal-gas|Ideal gas equation>calc:ideal-gas|Kinetic theory>calc:kinetic-theory|Conduction>sim:heat|Convection>eq:convection|Radiation>calc:radiation|Blackbody radiation>calc:blackbody|First law of thermodynamics>eq:first-law'),
    g('Nuclear Physics', 'Nuclear structure>topic:nuclear-structure|Isotopes>topic:isotopes|Nuclear stability>calc:binding|Radioactive decay>calc:decay|Alpha/beta/gamma>topic:alpha-beta-gamma|Half-life>calc:decay|Activity>eq:activity|Decay constant>eq:half-life|Binding energy>calc:binding|Mass defect>calc:binding|Fission>calc:nuclear-energy|Fusion>calc:nuclear-energy|Nuclear reactions>calc:nuclear-energy|Radiation dose>topic:radiation-dose'),
  ],
};

export const QUANTUM = {
  id: 'quantum', code: 'Q&R', name: 'Quantum & Relativity',
  blurb: 'Physics beyond the classical world — a separate top-level section with its own lessons, calculators, simulations and reference.',
  areas: [
    { id: 'qm', name: 'Quantum Mechanics', groups: [
      g('Quantum Foundations', 'Energy levels>calc:hydrogen|Energy transitions>calc:hydrogen|Photons>calc:photon|Photon energy E = hf>eq:photon|E = hc/λ>calc:photon|Photon momentum p = h/λ>calc:photon|Photon flux>calc:photon|Electronvolts ↔ joules>tool:units|Blackbody spectrum>calc:blackbody|Planck\'s law>calc:blackbody|Ultraviolet catastrophe>learn:photoelectric|Wien\'s displacement law>eq:wien|Stefan–Boltzmann law>eq:stefan|Work function>calc:photoelectric|Threshold frequency>calc:photoelectric|Stopping potential>calc:photoelectric|Einstein\'s photoelectric equation>eq:photoelectric|Effect of intensity vs frequency>learn:photoelectric|Compton scattering>calc:compton|Compton wavelength>eq:compton'),
      g('Wave–Particle Duality', 'Matter waves>calc:debroglie|de Broglie wavelength>eq:debroglie|Electron diffraction>calc:debroglie|Davisson–Germer experiment>calc:debroglie|Double-slit experiment>sim:double-slit'),
      g('Wavefunctions', 'Wavefunction ψ>sim:wavefunction|Probability density ∣ψ∣²>sim:wavefunction|Complex wavefunctions>sim:packet|Normalization>sim:packet|Superposition>sim:wavefunction'),
      g('Schrödinger Equation', 'Time-dependent Schrödinger equation>sim:packet|Time-independent Schrödinger equation>eq:schrodinger|Stationary states>sim:wavefunction|Probability evolution>sim:packet|Conservation of probability>sim:packet'),
      g('Quantum Systems', 'Infinite square well>calc:box|Quantized energies>calc:box|Potential barriers>sim:packet|Quantum harmonic oscillator>calc:qho|Zero-point energy>calc:qho|Quantum tunnelling>sim:packet|Transmission/reflection probability>calc:tunnel'),
      g('Measurement & Uncertainty', 'Heisenberg uncertainty principle>calc:uncertainty|Energy–time uncertainty>calc:uncertainty'),
      g('Angular Momentum & Spin', 'Intrinsic spin>calc:zeeman|Spin-½ particles>calc:zeeman|Stern–Gerlach experiment>sim:stern-gerlach|Spin measurement>calc:zeeman'),
      g('Atomic Physics', 'Bohr model>calc:hydrogen|Hydrogen atom>calc:hydrogen|Bohr radius>tool:constants|Atomic spectra>calc:hydrogen|Rydberg formula>eq:rydberg|Schrödinger hydrogen atom>sim:orbitals|Principal/orbital/magnetic/spin quantum numbers>sim:orbitals|Atomic orbitals>sim:orbitals|s, p, d, f orbitals>sim:orbitals|Zeeman effect>calc:zeeman'),
      g('Quantum Statistics', 'Fermi–Dirac statistics>calc:fermi|Bose–Einstein statistics>calc:bec|Fermi energy>calc:fermi|Fermi gas>calc:fermi|Bose–Einstein condensation>calc:bec'),
      g('Quantum Information', 'Qubits>tool:qc|Bloch sphere>tool:qc|Superposition and measurement>tool:qc|Pauli X/Y/Z gates>tool:qc|Hadamard gate>tool:qc|Phase gates>tool:qc|CNOT and controlled gates>tool:qc|Quantum circuits>tool:qc|Entanglement>tool:qc|Bell states>tool:qc|Grover\'s algorithm>tool:qc'),
    ] },
    { id: 'sr', name: 'Special Relativity', groups: [
      g('Foundations', 'Speed of light>tool:constants|Einstein\'s postulates>learn:time-dilation|Invariance of c>sim:lightclock'),
      g('Space & Time', 'Events and observers>sim:minkowski|Relativity of simultaneity>sim:minkowski|Time dilation>calc:lorentz|Length contraction>calc:lorentz|Lorentz factor>eq:gamma|Proper time>sim:lightclock|Muon decay>calc:lorentz|Twin paradox>sim:minkowski'),
      g('Lorentz Transformations', 'Position & time transformation>sim:minkowski|Relativistic velocity addition>calc:velocity-add|Rapidity>calc:lorentz'),
      g('Minkowski Spacetime', 'Worldlines>sim:minkowski|Light cones>sim:minkowski|Spacetime interval>calc:interval|Timelike / spacelike / null intervals>calc:interval|Minkowski diagrams>sim:minkowski'),
      g('Relativistic Mechanics', 'Relativistic momentum>calc:rel-energy|Relativistic energy>calc:rel-energy|Rest energy E₀ = mc²>eq:emc2|Energy–momentum relation>eq:energy-momentum|Relativistic kinetic energy>calc:rel-energy|Relativistic collisions and decays>calc:threshold|Centre-of-momentum frame>calc:threshold|Threshold energy>calc:threshold|Relativistic Doppler effect>calc:rel-doppler'),
    ] },
    { id: 'gr', name: 'General Relativity', groups: [
      g('Einstein Field Equations', 'Field equations>eq:efe'),
      g('Relativistic Gravity', 'Gravitational time dilation>calc:grav-dilation|Gravitational redshift/blueshift>calc:grav-dilation|GPS relativistic corrections>calc:gps|Orbital precession>sim:bh-orbit'),
      g('Black Holes', 'Escape velocity>calc:orbit|Schwarzschild radius>calc:black-hole|Event horizon>learn:black-holes|Photon sphere>calc:black-hole|ISCO>calc:black-hole|Kerr black holes>calc:black-hole|Accretion disks>sim:accretion|Hawking radiation>calc:black-hole|Black-hole temperature & entropy>calc:black-hole|Orbits around black holes>sim:bh-orbit'),
      g('Gravitational Waves', 'Spacetime perturbations>sim:gwaves|Binary inspiral, merger, ringdown>sim:gwaves|Chirp mass>calc:chirp|Strain>sim:gwaves|Black-hole & neutron-star mergers>calc:chirp'),
      g('Cosmology', 'Cosmological principle>sim:universe|Expanding universe>sim:universe|Hubble law>eq:hubble|Scale factor>sim:universe|Cosmological redshift>calc:cosmology|Friedmann equations>sim:universe|Critical density>calc:cosmology|Dark energy>sim:universe|Age of the universe>calc:cosmology|Lookback time>calc:cosmology|Distance measures>calc:cosmology'),
    ] },
    { id: 'pp', name: 'Particle Physics', groups: [
      g('Particles & Collisions', 'Mass–energy equivalence>calc:mass-energy|Relativistic energy & momentum>calc:rel-energy|Threshold energy & particle production>calc:threshold|Pair production & antimatter>calc:threshold|Compton scattering>calc:compton|Nuclear binding energy>calc:binding'),
    ] },
  ],
};

export const MATHS = {
  id: 'maths', code: 'MTH', name: 'Mathematics',
  blurb: 'The mathematics underneath every physics and engineering tool — from algebra to numerical methods.',
  groups: [
    g('Core Mathematics', 'Arithmetic>topic:arithmetic|Fractions>topic:fractions|Ratios>topic:ratios|Percentages>topic:percentages|Algebra>topic:algebra|Equations>tool:solver|Inequalities>topic:inequalities|Functions>tool:graph|Graphs>tool:graph|Polynomials>calc:poly-roots|Exponentials>eq:compound|Logarithms>eq:log|Sequences>topic:sequences|Series>topic:series'),
    g('Geometry & Trigonometry', 'Geometry>topic:geometry|Coordinate geometry>topic:coordinate-geometry|Pythagoras>eq:pythag|Trigonometric functions>calc:triangle|Trig identities>topic:trig-identities|Radians>tool:units|Sine/cosine rules>calc:triangle|Vectors>calc:vectors|3D geometry>calc:vectors'),
    g('Calculus', 'Limits>topic:limits|Differentiation>tool:numerics|Integration>tool:numerics|Applications>tool:graph|Partial derivatives>topic:partial-derivatives|Multiple integrals>topic:multiple-integrals|Vector calculus>topic:vector-calculus|Gradient, divergence, curl>topic:gradient-div-curl|Line/surface integrals>topic:line-surface-integrals'),
    g('Linear Algebra', 'Vectors>calc:vectors|Matrices>tool:matrix|Determinants>tool:matrix|Matrix inversion>tool:matrix|Systems of equations>tool:matrix|Vector spaces>topic:vector-spaces|Linear transformations>tool:matrix|Eigenvalues & eigenvectors>tool:matrix'),
    g('Differential Equations', 'First-order ODEs>tool:numerics|Second-order ODEs>calc:shm-spring|Systems of ODEs>solver:vibration|PDE introduction>topic:pde-intro|Laplace transforms>topic:laplace-transforms|Fourier series>tool:fft'),
    g('Numerical Methods', 'Root finding>tool:numerics|Bisection>tool:numerics|Newton–Raphson>tool:numerics|Numerical differentiation>tool:numerics|Numerical integration>tool:numerics|Euler method>tool:numerics|Runge–Kutta>tool:numerics|Interpolation>tool:data|Numerical linear algebra>tool:matrix'),
    g('Probability & Statistics', 'Probability>calc:binomial|Distributions>calc:normal-dist|Mean/variance/SD>tool:data|Binomial>calc:binomial|Poisson>calc:binomial|Normal distribution>calc:normal-dist|Confidence intervals>calc:conf-int|Hypothesis testing>topic:hypothesis-testing|Correlation>tool:data|Regression>tool:data|Error propagation>tool:uncertainty'),
  ],
};

// Engineering disciplines. calc: which calculator discipline keys are shown on the discipline page.
export const ENGINEERING = {
  id: 'engineering', code: 'ENG', name: 'Engineering',
  blurb: 'Professional-grade engineering: every calculator states its equations, assumptions, units, limitations and sources.',
  disciplines: [
    { id: 'mechanical', code: 'MEC', name: 'Mechanical', calc: ['mechanical', 'mechanics'], groups: [
      g('Statics', 'Moments>eq:moment|Equilibrium>learn:moments|Trusses>solver:truss|Distributed loads>solver:beam|Centroids>calc:section'),
      g('Dynamics', 'Particle kinematics>calc:suvat|Impulse–momentum>calc:collision|Moment of inertia>calc:inertia'),
      g('Mechanical Design', 'Shafts>calc:shaft-size|Gears>calc:gear-train|Gear trains>calc:gear-train|Bearings>calc:bearing-life|Springs>calc:spring|Bolts>calc:bolt|Couplings>solver:gear|Belts>calc:belt-drive|Chains>solver:gear|Flywheels>calc:flywheel|Fasteners>tool:tables'),
    ] },
    { id: 'solid', code: 'SOL', name: 'Solid Mechanics', calc: ['structural'], groups: [
      g('Stress & Strain', 'Stress>calc:axial-stress|Strain>calc:axial-stress|Axial loading>calc:axial-stress|Torsion>calc:shaft-torsion|Bending>calc:beam-cases|Beam deflection>calc:beam-cases|Combined loading>calc:shaft-size'),
      g('Failure & Design', 'Stress transformation>calc:mohr|Principal stresses>calc:mohr|Mohr\'s circle>calc:mohr|von Mises stress>calc:mohr|Tresca criterion>calc:mohr|Columns>calc:buckling|Buckling>calc:buckling|Pressure vessels>calc:pressure-vessel|Fatigue>calc:fatigue|S-N curves>calc:paris|Fracture mechanics>calc:fracture'),
      g('FEA Fundamentals', 'FEM fundamentals>solver:beam|Stiffness matrices>solver:truss|Linear static analysis>solver:truss|Modal analysis>solver:vibration'),
    ] },
    { id: 'structural', code: 'STR', name: 'Structural & Civil', calc: ['structural', 'civil'], groups: [
      g('Structural', 'Beams>solver:beam|Trusses>solver:truss|Reactions>solver:beam|SFD/BMD>solver:beam|Deflection>calc:beam-cases|Columns>calc:buckling|Structural steel>tool:sections|Reinforced concrete>calc:rc-beam|Loads>calc:load-comb|Load combinations>calc:load-comb|Section properties>calc:section'),
      g('Geotechnical', 'Soil properties>calc:effective-stress|Effective stress>calc:effective-stress|Consolidation>calc:consolidation|Bearing capacity>calc:bearing|Foundations>calc:bearing|Retaining walls>calc:earth-pressure'),
      g('Hydrology', 'Rainfall>calc:rational|Runoff>calc:rational|Drainage>calc:manning|Rational method>calc:rational|Open channels>calc:manning'),
    ] },
    { id: 'vibrations', code: 'VIB', name: 'Dynamics & Vibrations', calc: ['vibrations'], groups: [
      g('Vibrations', 'Free vibration>calc:shm-spring|Forced vibration>calc:forced-vib|Natural frequency>calc:shm-spring|Damping>calc:shm-spring|Damping ratio>calc:shm-spring|Resonance>calc:forced-vib|Harmonic excitation>calc:forced-vib|Base excitation>calc:forced-vib|Vibration isolation>calc:forced-vib|Rotating imbalance>calc:unbalance|SDOF systems>calc:shm-spring|MDOF systems>solver:vibration|Modal analysis>solver:vibration|Frequency response>calc:forced-vib|Transmissibility>calc:forced-vib'),
    ] },
    { id: 'fluids', code: 'FLU', name: 'Fluid Mechanics', calc: ['fluids'], groups: [
      g('Fundamentals', 'Density / specific gravity>eq:density|Pressure>eq:pressure|Hydrostatic pressure>calc:hydrostatic|Absolute vs gauge pressure>calc:hydrostatic|Buoyancy / Archimedes>calc:buoyancy|Viscosity>tool:fluids|Dynamic ↔ kinematic viscosity>eq:kinvisc'),
      g('Flow', 'Volumetric & mass flow rate>eq:continuity|Continuity equation>eq:continuity|Reynolds number>calc:reynolds|Laminar/turbulent flow>calc:reynolds|Mach number>calc:isa|Speed of sound>calc:isa'),
      g('Bernoulli & Energy', 'Bernoulli equation>calc:venturi|Total, pressure, velocity & elevation head>calc:venturi|Stagnation & dynamic pressure>calc:drag'),
      g('Pipes', 'Darcy–Weisbach>calc:pipe-flow|Darcy friction factor>calc:pipe-flow|Colebrook equation>calc:pipe-flow|Swamee–Jain approximation>calc:pipe-flow|Relative roughness>calc:pipe-flow|Major & minor losses>calc:pipe-flow|Equivalent length>solver:pipe-network|Pipes in series/parallel>solver:pipe-network|Pipe sizing>calc:pipe-flow|Pressure-drop calculator>calc:pipe-flow|Pipe networks>solver:pipe-network'),
      g('Fittings & Measurement', 'Elbows, tees, bends, valves (K factors)>calc:pipe-flow|Venturi meter>calc:venturi|Orifice plate>calc:orifice'),
      g('Pumps & Turbines', 'Pump power>calc:pump-power|Hydraulic power>eq:pump-power|Pump efficiency>calc:pump-power|Total dynamic head>solver:pipe-network|System curve>solver:pipe-network|Operating point>solver:pipe-network|Pumps in series/parallel>solver:pipe-network|NPSH>calc:npsh|Cavitation check>calc:npsh|Affinity laws>calc:affinity|Pump selection helper>calc:pump-power|Water hammer>calc:water-hammer'),
      g('Open Channel', 'Manning equation>calc:manning|Hydraulic radius>calc:manning|Froude number>calc:manning|Rectangular & trapezoidal channels>calc:manning'),
      g('Aerodynamics', 'Drag force>calc:drag|Drag coefficient>calc:drag|Lift>eq:lift|Lift coefficient>sim:flow|Terminal velocity>calc:drag|Air density vs altitude>calc:isa'),
      g('Advanced', 'Shock waves>sim:doppler|Pipe-network solver>solver:pipe-network'),
    ] },
    { id: 'thermo', code: 'THM', name: 'Thermodynamics', calc: ['thermo'], groups: [
      g('Properties & Laws', 'Temperature conversion>tool:units|Ideal gases>calc:ideal-gas|First law>eq:first-law'),
      g('Processes', 'Isobaric>calc:gas-process|Isochoric>calc:gas-process|Isothermal>calc:gas-process|Adiabatic / isentropic>calc:gas-process|Polytropic>calc:gas-process|P–V diagrams>calc:gas-process'),
      g('Cycles', 'Carnot>calc:carnot|Otto>calc:otto|Diesel>calc:diesel|Dual>solver:cycle|Brayton>calc:brayton|Rankine>calc:rankine-if97|Refrigeration>calc:refrigeration|Heat pumps>calc:vcr-cycle|T–s diagrams>solver:cycle'),
      g('Heat Transfer', 'Fourier\'s law>eq:fourier|Plane & composite walls>calc:wall|Cylindrical conduction>calc:pipe-insulation|Thermal resistance>calc:wall|Insulation thickness>calc:pipe-insulation|Critical insulation radius>calc:pipe-insulation|Convection>eq:convection|Radiation>calc:radiation|Transient conduction>sim:heat'),
      g('Heat Exchangers', 'LMTD>calc:lmtd|NTU / effectiveness>calc:entu|Parallel & counterflow>calc:entu|Shell-and-tube>calc:entu|Required area>calc:lmtd|Outlet temperatures>calc:entu'),
      g('Engines', 'Displacement>calc:engine|Bore/stroke>calc:engine|Compression ratio>calc:otto|BMEP/IMEP>calc:engine|Brake & indicated power>calc:engine|BSFC>calc:engine|Volumetric efficiency>calc:engine|Air–fuel ratio>calc:engine|Thermal efficiency>calc:engine'),
      g('Steam & Property Tables', 'Water/steam saturation>calc:steam-sat|Superheated steam>calc:steam-props|Compressed liquid>calc:steam-props|Quality>calc:steam-props|Air properties>tool:fluids|Water properties>tool:fluids|Refrigerants>tool:refrigerants'),
    ] },
    { id: 'electrical', code: 'ELE', name: 'Electrical & Electronic', calc: ['electrical'], groups: [
      g('Fundamentals', 'Charge>eq:charge|Resistivity>eq:resistivity|Ohm\'s law>calc:ohm|Electrical energy & power>calc:energy-cost'),
      g('Resistors & Circuits', 'Series/parallel resistors>calc:combine|Voltage divider>calc:divider|Loaded divider>calc:divider|Current divider>solver:circuit|Resistor colour codes>calc:colour-code|Kirchhoff\'s laws>learn:circuits|Nodal & mesh analysis>solver:circuit|Thévenin/Norton equivalents>calc:divider|Superposition>solver:circuit|Maximum power transfer>solver:circuit|Delta ↔ wye>solver:circuit'),
      g('Capacitors & Inductors', 'Capacitance>calc:capacitor|Series/parallel capacitors>calc:combine|Stored energy>eq:cap-energy|RC charging/discharging>calc:rc|RC time constant>eq:rc-tau|Capacitive reactance>eq:xc|Series/parallel inductors>calc:combine|RL circuits>calc:rl|Inductive reactance>eq:xl'),
      g('AC & RLC', 'Phase angle>sim:rlc|Real, reactive & apparent power>calc:ac-power|Power factor>calc:ac-power|Power-factor correction>calc:ac-power|Complex impedance>calc:rlc|Series & parallel RLC>calc:rlc|Resonance>eq:resonance|Q factor & bandwidth>calc:rlc'),
      g('Power Systems', 'Three-phase power>calc:three-phase|Star/delta>calc:three-phase|Line ↔ phase quantities>calc:three-phase|Transformers>calc:transformer|Motors>calc:motor|Synchronous speed & slip>calc:motor|Cable voltage drop>calc:voltage-drop'),
      g('Batteries', 'Capacity (Ah ↔ Wh)>calc:battery|Runtime>calc:battery|C-rate>calc:battery|Series/parallel cells>calc:battery|Pack voltage & energy>calc:battery'),
      g('Electronics', 'LED resistor>calc:led|Op-amps>calc:opamp-filter|Filters>calc:opamp-filter|Cutoff frequency>calc:opamp-filter'),
      g('Electromagnetism', 'Coulomb\'s law>calc:coulomb|Electric field & potential>calc:coulomb|Magnetic field>calc:bfield|Force on a conductor>eq:lorentz-force|Faraday\'s & Lenz\'s laws>eq:faraday|Solenoids>calc:bfield'),
    ] },
    { id: 'controls', code: 'CTL', name: 'Control Systems', calc: ['controls'], groups: [
      g('Control Systems', 'Open/closed-loop control>calc:pid|Feedback>calc:pid|Transfer functions>calc:bode|First/second-order systems>calc:second-order|Transient response>calc:second-order|Steady-state error>calc:pid|Stability>calc:bode|Routh–Hurwitz>calc:bode|Bode plots>calc:bode|Nyquist plots>calc:bode|Gain/phase margins>calc:bode|PID control>calc:pid|P/PI/PD controllers>calc:zn-tuning'),
    ] },
    { id: 'mechatronics', code: 'MTX', name: 'Mechatronics & Robotics', calc: ['robotics'], groups: [
      g('Mechatronics', 'Actuators>calc:dc-motor|Stepper motors>calc:stepper|DC & BLDC motors>calc:dc-motor|ADC/DAC>calc:adc'),
      g('Robotics', 'Coordinate frames>calc:two-link|Degrees of freedom>calc:two-link|Forward kinematics>calc:two-link|Inverse kinematics>calc:two-link|Jacobians>calc:two-link|Manipulators>calc:two-link'),
    ] },
    { id: 'materials', code: 'MAT', name: 'Materials Science', calc: ['materials'], groups: [
      g('Materials Science', 'Crystal structures>calc:crystal|Unit cells>calc:crystal|Miller indices>calc:bragg|Diffusion>calc:carburizing|Heat treatment>calc:carburizing|Strengthening mechanisms>calc:hall-petch|Metals>tool:materials|Polymers>tool:materials|Ceramics>tool:materials|Composites>calc:rule-mixtures|Fatigue>calc:fatigue|Fracture>calc:fracture|Material selection>tool:compare'),
    ] },
    { id: 'manufacturing', code: 'MFG', name: 'Manufacturing', calc: ['manufacturing'], groups: [
      g('Machining', 'Turning>calc:turning|Milling>calc:milling|Drilling>calc:drilling|Cutting speeds>calc:turning|Feed rates>calc:milling|Material removal rate>calc:milling|Machining time>calc:turning'),
      g('Metrology, GD&T & Fits', 'Fits>calc:iso-fit|Tolerances>calc:iso-fit|Tolerance stacks>calc:tol-stack|Thread reference>tool:tables'),
    ] },
    { id: 'hvac', code: 'HVC', name: 'HVAC & Refrigeration', calc: ['hvac'], groups: [
      g('HVAC', 'Heating/cooling loads>calc:hvac-load|Sensible heat>calc:hvac-load|Latent heat>calc:hvac-load|Sensible heat ratio>calc:hvac-load|Duct sizing>calc:duct|Pressure drop>calc:duct|COP>calc:refrigeration|Refrigeration ton ↔ kW>tool:units'),
      g('Refrigeration', 'Vapour-compression cycle>calc:vcr-cycle|Compressors>calc:vcr-cycle|Expansion valves>calc:refrigerant-props|Refrigerants>calc:refrigerant-compare'),
      g('Psychrometrics', 'Dry-bulb & wet-bulb temperature>calc:psychro|Relative humidity>calc:psychro|Humidity ratio>calc:psychro|Dew point>calc:psychro|Enthalpy>calc:psychro|Psychrometric chart>tool:psychro'),
    ] },
    { id: 'chemical', code: 'CHE', name: 'Chemical', calc: ['chemical'], groups: [
      g('Chemical Engineering', 'Mass balances>calc:mixing|Energy balances>calc:afr|Fluid transport>calc:pipe-flow|Heat transfer>calc:lmtd|Diffusion>calc:carburizing|Reaction kinetics>calc:arrhenius|Reactor design>calc:reactor|Batch reactors>calc:arrhenius|CSTR>calc:reactor|PFR>calc:reactor'),
    ] },
    { id: 'signals', code: 'SIG', name: 'Signals & Systems', calc: ['signals'], groups: [
      g('Signals & Systems', 'Continuous/discrete signals>tool:fft|Periodic signals>tool:fft|Sampling>calc:aliasing|Nyquist theorem>calc:aliasing|Aliasing>calc:aliasing|Fourier series>tool:fft|Fourier transform>tool:fft|FFT>tool:fft|Frequency response>calc:opamp-filter|Filters>calc:opamp-filter|Noise>calc:adc|Signal-to-noise ratio>calc:adc|Spectral analysis>tool:fft'),
    ] },
    { id: 'energy', code: 'NRG', name: 'Renewable & Energy', calc: ['energy'], groups: [
      g('Solar', 'PV output>calc:solar-pv|Array sizing>calc:solar-pv|Battery sizing>calc:battery'),
      g('Wind & Hydro', 'Wind power>calc:wind|Power coefficient & Betz limit>calc:wind|Tip-speed ratio>calc:wind|Hydropower>calc:hydro'),
      g('Storage & Systems', 'Batteries>calc:battery|Flywheels>calc:flywheel|Pumped hydro>calc:hydro|Combined-cycle plants>calc:brayton|Heat pumps>calc:carnot'),
    ] },
    { id: 'computational', code: 'CMP', name: 'Computational Engineering', calc: [], groups: [
      g('Programming', 'Numerical computing>tool:api|Plotting>tool:graph|Data processing>tool:data|Symbolic maths>tool:solver'),
      g('Numerical Engineering', 'Root finding>tool:solver|Optimization>tool:solver|Numerical integration>tool:numerics|Numerical differentiation>tool:numerics|ODE/PDE solving>sim:pendulum|FEM>solver:truss|Monte Carlo simulation>tool:uncertainty'),
    ] },
    { id: 'experimental', code: 'EXP', name: 'Experimental Engineering & Data', calc: [], groups: [
      g('Measurement & Data', 'Uncertainty>tool:uncertainty|Error propagation>tool:uncertainty|Sampling>calc:aliasing|Noise>calc:adc|Regression>tool:data|Curve fitting>tool:data|Residuals>tool:data|R²>tool:data|Confidence intervals>calc:conf-int|Data visualization>tool:graph|Dimensional analysis>tool:dimensions'),
    ] },
    { id: 'design', code: 'DES', name: 'Engineering Design', calc: [], groups: [
      g('Engineering Design', 'Safety factors>eq:fos|Material selection>tool:compare|Tolerances>calc:tol-stack'),
    ] },
  ],
};

export const TOOLS_LIST = [
  ['calculators', 'Calculator Library', 'Every calculator, filterable by discipline and level.'],
  ['solvers', 'Solvers', 'Beam, truss, circuit (DC/AC), pipe network, drive train, thermodynamic cycle and MDOF vibration solvers.'],
  ['sims', 'Simulations', 'Interactive physics: projectile, pendulum, double slit, wavefunctions, Minkowski diagram, black-hole orbits.'],
  ['solver', 'Equation Solver', 'Pick any library equation and solve for any variable numerically, with units.'],
  ['units', 'Unit Converter', '40+ physical quantities, with engineering units and CODATA-exact factors.'],
  ['graph', 'Graphing', 'Plot functions and data, with log axes and regression.'],
  ['data', 'Data Analysis', 'Paste or import CSV: statistics, regression, residuals, R².'],
  ['uncertainty', 'Uncertainty Propagation', 'Linear (partial-derivative) and Monte Carlo propagation through any formula.'],
  ['dimensions', 'Dimensional Analysis', 'Check any equation for dimensional consistency.'],
  ['ask', 'Ask (question interpreter)', 'Type a question in plain English — it picks the calculator, reads your quantities and units, and runs the real engine.'],
  ['fft', 'Signal Analysis (FFT)', 'Windowed FFT amplitude spectrum, peaks, RMS and THD for generated or pasted signals.'],
  ['matrix', 'Matrix Tool', 'Determinant, inverse, eigenvalues/eigenvectors, and linear systems Ax = b.'],
  ['numerics', 'Numerical Methods Lab', 'Root finding, integration, differentiation and ODE integrators compared step by step.'],
  ['psychro', 'Psychrometric Chart', 'Interactive moist-air chart with state points and process loads.'],
  ['qc', 'Quantum Circuit Simulator', 'State-vector simulation of up to 5 qubits with Bloch vectors.'],
  ['practice', 'Practice & Quizzes', 'Question bank, generated formula drills, timed quizzes and flashcards.'],
];

export const REFERENCE_LIST = [
  ['equations', 'Equation Library', 'Searchable equations with variables, units and linked calculators.'],
  ['constants', 'Constants', 'CODATA 2018, SI-exact, IAU and engineering constants.'],
  ['materials', 'Materials Database', 'Metals, polymers, composites and construction materials with sourced properties.'],
  ['compare', 'Material Comparison', 'Side-by-side properties, specific strength/stiffness and an Ashby-style chart.'],
  ['fluids', 'Fluid & Property Tables', 'Water, air, common liquids, gases and IAPWS-IF97 saturation.'],
  ['steam', 'Steam Tables (IAPWS-IF97)', 'Saturated, superheated, compressed and supercritical water with T–s, Mollier and p–h charts.'],
  ['refrigerants', 'Refrigerant Tables', 'P–T saturation tables, p–h diagrams, GWP and safety class for 11 refrigerants.'],
  ['sections', 'Steel Sections', 'IPE, HEA and HEB section dimensions and properties (A, I, W_el, W_pl, I_t, I_w).'],
  ['tables', 'Engineering Tables', 'ISO metric threads, bolt classes, NPS pipe sizes, roughness, K-factors.'],
  ['standards', 'Standards Guide', 'What ISO, ASME, ASTM, IEC, EN and others cover — and which calculators relate.'],
  ['api', 'JavaScript API', 'Call any calculator, solver, equation or unit conversion from code via window.PHYSENG.'],
];

export const PLATFORM = {
  student: 'Lessons|Worked examples|Question bank|Topic questions|Multiple-choice questions|Automatic marking|Hints|Full solutions|Difficulty levels|Topic progress|Formula practice|Flashcards|Quizzes|Timed tests|Past-paper-style questions|Lab guides',
  professional: 'Project workspaces|Saved calculations|Calculation history|Calculation versioning|Calculation sheets|PDF reports|Assumption tracking|Source/reference tracking|Unit-system selection|Material selection|Fluid selection|Reusable inputs|Calculation templates|Shared calculations|Team projects|CSV import/export|Data export|API access',
  workspace: 'Projects|Calculations|Simulations|Graphs|Datasets|Reports|Saved equations|Saved materials|Recent activity|Student/engineer mode|SI/Imperial|Default units|Discipline|Education level',
};

// Status of platform features in this build (for the content map / roadmap).
export const FEATURE_STATUS = {
  live: ['Past-paper-style questions', 'Lab guides', 'Calculation versioning', 'Simulations', 'Discipline', 'Multiple-choice questions', 'Topic progress', 'Flashcards', 'Quizzes', 'Timed tests', 'API access', 'Calculation templates', 'Lessons', 'Worked examples', 'Question bank', 'Topic questions', 'Automatic marking', 'Hints', 'Full solutions', 'Difficulty levels', 'Formula practice', 'Project workspaces', 'Saved calculations', 'Calculation history', 'Calculation sheets', 'PDF reports', 'Assumption tracking', 'Source/reference tracking', 'Unit-system selection', 'Material selection', 'Fluid selection', 'Reusable inputs', 'Shared calculations', 'CSV import/export', 'Data export', 'Projects', 'Calculations', 'Reports', 'Saved equations', 'Saved materials', 'Recent activity', 'Student/engineer mode', 'SI/Imperial', 'Default units', 'Education level', 'Datasets', 'Graphs'],
};
