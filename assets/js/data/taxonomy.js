// Master content map. Items are "|"-separated; an item may link to a live resource with
// ">kind:id" where kind ∈ calc | learn | sim | solver | eq | tool (tool = hash path, e.g. tool:units).
const g = (name, items) => ({ name, items: items.split('|').map(s => s.trim()).filter(Boolean) });

export const PHYSICS = {
  id: 'physics', code: 'PHY', name: 'Physics',
  blurb: 'Classical physics from first principles: mechanics, materials, waves, electromagnetism, thermal and nuclear physics.',
  groups: [
    g('Mechanics', 'Scalars and vectors|Distance and displacement|Speed and velocity|Acceleration|Motion graphs|SUVAT>calc:suvat|Projectile motion>calc:projectile|Relative motion|Newton\'s laws>eq:newton2|Free-body diagrams|Weight>eq:weight|Normal force|Tension|Friction|Drag>calc:drag|Terminal velocity>calc:drag|Equilibrium>learn:moments|Moments>learn:moments|Couples|Centre of mass|Centre of gravity|Momentum>eq:momentum|Impulse>eq:impulse|Conservation of momentum>calc:collision|Elastic/inelastic collisions>calc:collision|Work>eq:work|Energy>eq:ke|Power>eq:power|Efficiency>eq:efficiency|Springs>eq:hooke|Hooke\'s law>eq:hooke|Elastic potential energy>eq:epe|Circular motion>calc:circular|Centripetal acceleration>calc:circular|Centripetal force>eq:centripetal|Gravitation>eq:gravity|Gravitational fields|Gravitational potential|Orbits>calc:orbit|Escape velocity>calc:orbit|SHM>calc:shm-spring|Pendulums>calc:pendulum|Rotational motion|Angular velocity|Angular acceleration|Torque>eq:torque-alpha|Moment of inertia>calc:inertia|Angular momentum'),
    g('Materials', 'Density>eq:density|Hooke\'s law>eq:hooke|Stress>eq:stress|Strain>eq:strain|Young\'s modulus>learn:stress-strain|Elastic/plastic deformation>learn:stress-strain|Stress–strain curves>learn:stress-strain|Toughness|Hardness|Yield strength>tool:materials|Ultimate tensile strength>tool:materials|Thermal expansion>calc:thermal-stress'),
    g('Waves & Optics', 'Wave properties|Transverse/longitudinal waves|Wave speed>eq:wave-speed|Frequency>eq:period|Period>eq:period|Phase|Superposition|Interference>sim:double-slit|Standing waves|Resonance|Diffraction|Double-slit interference>calc:double-slit|Diffraction gratings>eq:grating|Refraction>calc:snell|Snell\'s law>calc:snell|Critical angle>calc:snell|Total internal reflection>calc:snell|Polarisation|Doppler effect>calc:doppler-sound|Sound|Intensity|Decibels>eq:decibel|Mirrors|Thin lenses>calc:lens|Lens equation>eq:lens|Magnification>calc:lens|Optical instruments|Thin-film interference'),
    g('Electricity & Magnetism', 'Charge>eq:charge|Current|Potential difference|EMF|Resistance|Resistivity>eq:resistivity|Ohm\'s law>calc:ohm|Electrical power>eq:epower|Electrical energy>calc:energy-cost|Series/parallel circuits>calc:combine|Kirchhoff\'s laws>learn:circuits|Internal resistance|Potential dividers>calc:divider|Capacitors>calc:capacitor|RC circuits>calc:rc|Electric fields>calc:coulomb|Electric potential>calc:coulomb|Coulomb\'s law>eq:coulomb|Magnetic fields>calc:bfield|Magnetic flux|Force on conductors>eq:lorentz-force|Force on charged particles|Electromagnetic induction>eq:faraday|Faraday\'s law>eq:faraday|Lenz\'s law|Transformers>calc:transformer|AC/DC'),
    g('Thermal Physics', 'Temperature|Internal energy|Specific heat capacity>calc:heating|Latent heat>calc:heating|Gas laws>eq:ideal-gas|Ideal gas equation>calc:ideal-gas|Kinetic theory|Conduction>eq:fourier|Convection>eq:convection|Radiation>calc:radiation|Blackbody radiation>calc:blackbody|First law of thermodynamics>eq:first-law'),
    g('Nuclear Physics', 'Nuclear structure|Isotopes|Nuclear stability>calc:binding|Radioactive decay>calc:decay|Alpha/beta/gamma|Half-life>calc:decay|Activity>eq:activity|Decay constant>eq:half-life|Binding energy>calc:binding|Mass defect>calc:binding|Fission|Fusion|Nuclear reactions|Radiation dose'),
  ],
};

export const QUANTUM = {
  id: 'quantum', code: 'Q&R', name: 'Quantum & Relativity',
  blurb: 'Physics beyond the classical world — a separate top-level section with its own lessons, calculators, simulations and reference.',
  areas: [
    { id: 'qm', name: 'Quantum Mechanics', groups: [
      g('Quantum Foundations', 'Classical vs quantum physics|Planck\'s hypothesis|Planck constant|Quantized energy|Energy levels>calc:hydrogen|Ground/excited states|Energy transitions>calc:hydrogen|Photons>calc:photon|Photon energy E = hf>eq:photon|E = hc/λ>calc:photon|Photon momentum p = h/λ>calc:photon|Photon flux>calc:photon|Electronvolts ↔ joules>tool:units|Blackbody spectrum>calc:blackbody|Planck\'s law>calc:blackbody|Ultraviolet catastrophe>learn:photoelectric|Wien\'s displacement law>eq:wien|Stefan–Boltzmann law>eq:stefan|Work function>calc:photoelectric|Threshold frequency>calc:photoelectric|Stopping potential>calc:photoelectric|Einstein\'s photoelectric equation>eq:photoelectric|Effect of intensity vs frequency>learn:photoelectric|Compton scattering>calc:compton|Compton wavelength>eq:compton'),
      g('Wave–Particle Duality', 'Matter waves>calc:debroglie|de Broglie wavelength>eq:debroglie|Electron diffraction>calc:debroglie|Davisson–Germer experiment>calc:debroglie|Double-slit experiment>sim:double-slit|Single-particle interference|Probability interpretation|Complementarity|Classical limit|Correspondence principle'),
      g('Wavefunctions', 'Wavefunction ψ>sim:wavefunction|Physical meaning of ψ|Probability amplitude|Probability density ∣ψ∣²>sim:wavefunction|Complex wavefunctions|Normalization|Superposition>sim:wavefunction|Linear combinations|Boundary conditions|Expectation values|Operators|Eigenvalues|Eigenfunctions|Observables|Measurement postulate'),
      g('Schrödinger Equation', 'Time-dependent Schrödinger equation|Time-independent Schrödinger equation>eq:schrodinger|Hamiltonian|Kinetic-energy operator|Potential-energy operator|Stationary states|Separation of variables|Energy eigenvalues|Probability evolution|Conservation of probability'),
      g('Quantum Systems', 'Infinite square well>calc:box|Finite square well|Quantized energies>calc:box|Potential wells|Bound states|Potential barriers>calc:tunnel|Step potentials|Quantum harmonic oscillator>calc:qho|Zero-point energy>calc:qho|Ladder operators|Quantum tunnelling>calc:tunnel|Transmission/reflection probability>calc:tunnel|Alpha decay|Tunnel diode|Scanning tunnelling microscope|Tunnelling in fusion'),
      g('Measurement & Uncertainty', 'Heisenberg uncertainty principle>calc:uncertainty|Energy–time uncertainty>calc:uncertainty|Commutators|Compatible/incompatible observables|Quantum superposition|Decoherence|Classical emergence'),
      g('Angular Momentum & Spin', 'Orbital angular momentum|Angular momentum quantization|L² and L_z|Quantum numbers|Intrinsic spin|Spin-½ particles|Pauli matrices|Stern–Gerlach experiment|Spin measurement|Addition of angular momentum|Spin–orbit coupling'),
      g('Atomic Physics', 'Rutherford model|Bohr model>calc:hydrogen|Hydrogen atom>calc:hydrogen|Bohr radius>tool:constants|Atomic spectra>calc:hydrogen|Rydberg formula>eq:rydberg|Schrödinger hydrogen atom|Principal/orbital/magnetic/spin quantum numbers|Atomic orbitals|s, p, d, f orbitals|Pauli exclusion principle|Electron configurations|Hund\'s rule|Screening|Selection rules|Fine structure|Zeeman effect|Stark effect'),
      g('Quantum Statistics', 'Identical particles|Bosons|Fermions|Fermi–Dirac statistics|Bose–Einstein statistics|Maxwell–Boltzmann limit|Fermi energy|Fermi gas|Bose–Einstein condensation'),
      g('Advanced Quantum Mechanics', 'Dirac notation|Hilbert spaces|Hermitian & unitary operators|Matrix mechanics|Density matrices|Pure vs mixed states|Time-independent perturbation theory|Time-dependent perturbation theory|Variational method|Adiabatic theorem|Fermi\'s golden rule|Scattering theory|Born approximation'),
      g('Quantum Information', 'Qubits|Bloch sphere|Superposition and measurement|Pauli X/Y/Z gates|Hadamard gate|Phase gates|CNOT and controlled gates|Quantum circuits|Entanglement|Bell states|Bell inequalities|EPR paradox|Quantum teleportation|No-cloning theorem|Grover\'s algorithm|Shor\'s algorithm|Quantum error correction'),
    ] },
    { id: 'sr', name: 'Special Relativity', groups: [
      g('Foundations', 'Inertial reference frames|Galilean relativity|Galilean transformations|Speed of light>tool:constants|Michelson–Morley experiment|Einstein\'s postulates>learn:time-dilation|Invariance of c'),
      g('Space & Time', 'Events and observers|Relativity of simultaneity>sim:minkowski|Clock synchronization|Time dilation>calc:lorentz|Length contraction>calc:lorentz|Lorentz factor>eq:gamma|Proper time|Proper length|Muon decay>calc:lorentz|Twin paradox>sim:minkowski|Ladder/barn paradox'),
      g('Lorentz Transformations', 'Galilean vs Lorentz transformations|Position & time transformation>sim:minkowski|Inverse transformation|Relativistic velocity addition>calc:velocity-add|Lorentz boosts|Rapidity>calc:lorentz|Lorentz invariance'),
      g('Minkowski Spacetime', 'Worldlines>sim:minkowski|Light cones>sim:minkowski|Causal structure|Spacetime interval>calc:interval|Timelike / spacelike / null intervals>calc:interval|Minkowski diagrams>sim:minkowski'),
      g('Relativistic Mechanics', 'Relativistic momentum>calc:rel-energy|Relativistic energy>calc:rel-energy|Rest energy E₀ = mc²>eq:emc2|Energy–momentum relation>eq:energy-momentum|Relativistic kinetic energy>calc:rel-energy|Massless particles|Relativistic collisions and decays|Centre-of-momentum frame|Threshold energy|Relativistic Doppler effect>calc:rel-doppler'),
      g('Four-Vectors', 'Four-position|Four-velocity|Four-momentum|Four-acceleration|Minkowski metric|Scalar products & invariants|Covariant/contravariant components|Tensor notation'),
      g('Relativistic Electromagnetism', 'Transformation of E and B fields|Electromagnetic field tensor|Four-current|Covariant Maxwell equations|Magnetism as a relativistic effect'),
    ] },
    { id: 'gr', name: 'General Relativity', groups: [
      g('Foundations', 'Equivalence principle|Inertial vs gravitational mass|Accelerated frames|Gravity as curvature|Geodesics|Curved spacetime'),
      g('Mathematics of GR', 'Manifolds|Vectors & covectors|Tensors|Metric tensor|Einstein summation|Christoffel symbols|Covariant derivative|Parallel transport|Geodesic equation|Riemann curvature tensor|Ricci tensor & scalar|Stress–energy tensor'),
      g('Einstein Field Equations', 'Field equations>eq:efe|Einstein tensor|Cosmological constant|Matter–energy ↔ curvature'),
      g('Relativistic Gravity', 'Gravitational time dilation>calc:grav-dilation|Gravitational redshift/blueshift>calc:grav-dilation|GPS relativistic corrections>calc:gps|Light deflection|Shapiro time delay|Orbital precession>sim:bh-orbit|Frame dragging|Geodetic effect'),
      g('Black Holes', 'Escape velocity>calc:orbit|Schwarzschild radius>calc:black-hole|Event horizon>learn:black-holes|Singularity|Schwarzschild metric|Photon sphere>calc:black-hole|ISCO>calc:black-hole|Kerr black holes>calc:black-hole|Reissner–Nordström & Kerr–Newman|Ergosphere|Accretion disks|Penrose diagrams|Hawking radiation>calc:black-hole|Black-hole temperature & entropy>calc:black-hole|Information paradox|Orbits around black holes>sim:bh-orbit'),
      g('Gravitational Waves', 'Spacetime perturbations|Polarizations|Binary inspiral, merger, ringdown|Chirp mass>calc:chirp|Strain|Interferometric detection|Black-hole & neutron-star mergers>calc:chirp'),
      g('Cosmology', 'Cosmological principle|Expanding universe|Hubble law>eq:hubble|Scale factor|Cosmological redshift>calc:cosmology|FLRW metric|Friedmann equations|Critical density>calc:cosmology|Dark matter|Dark energy|Age of the universe>calc:cosmology|Lookback time>calc:cosmology|Distance measures>calc:cosmology|Particle horizon|CMB|Big Bang|Inflation'),
    ] },
    { id: 'pp', name: 'Particle Physics & QFT', groups: [
      g('Standard Model', 'Quarks|Leptons|Generations|Photon, gluon, W±, Z⁰|Higgs boson|Fundamental interactions|Feynman diagrams|Conservation laws|Quantum numbers|Colour charge|Decay, annihilation, pair production|Cross sections'),
      g('Relativistic Quantum Mechanics', 'Why Schrödinger is non-relativistic|Klein–Gordon equation|Dirac equation|Dirac spinors|Antimatter & positrons|Relativistic hydrogen atom'),
      g('Quantum Field Theory (advanced)', 'Classical fields|Lagrangian mechanics & action|Noether\'s theorem|Scalar, Dirac & EM fields|Creation/annihilation operators|Fock space|Propagators|Perturbation theory|QED|Introduction to QCD|Gauge theories|Spontaneous symmetry breaking|Higgs mechanism|Renormalization'),
    ] },
  ],
};

export const MATHS = {
  id: 'maths', code: 'MTH', name: 'Mathematics',
  blurb: 'The mathematics underneath every physics and engineering tool — from algebra to numerical methods.',
  groups: [
    g('Core Mathematics', 'Arithmetic|Fractions|Ratios|Percentages|Algebra|Equations>tool:solver|Inequalities|Functions>tool:graph|Graphs>tool:graph|Polynomials|Exponentials>eq:compound|Logarithms>eq:log|Sequences|Series'),
    g('Geometry & Trigonometry', 'Geometry|Coordinate geometry|Pythagoras>eq:pythag|Trigonometric functions|Trig identities|Radians>tool:units|Sine/cosine rules>eq:cosine-rule|Vectors|3D geometry'),
    g('Calculus', 'Limits|Differentiation|Integration|Applications|Partial derivatives|Multiple integrals|Vector calculus|Gradient, divergence, curl|Line/surface integrals'),
    g('Linear Algebra', 'Vectors|Matrices|Determinants|Matrix inversion|Systems of equations|Vector spaces|Linear transformations|Eigenvalues & eigenvectors'),
    g('Differential Equations', 'First-order ODEs|Second-order ODEs>calc:shm-spring|Systems of ODEs|PDE introduction|Laplace transforms|Fourier series'),
    g('Numerical Methods', 'Root finding>tool:solver|Bisection>tool:solver|Newton–Raphson>tool:solver|Numerical differentiation|Numerical integration|Euler method|Runge–Kutta>sim:pendulum|Interpolation|Numerical linear algebra>solver:truss'),
    g('Probability & Statistics', 'Probability|Distributions|Mean/variance/SD>tool:data|Binomial|Poisson|Normal distribution|Confidence intervals|Hypothesis testing|Correlation>tool:data|Regression>tool:data|Error propagation>tool:uncertainty'),
  ],
};

// Engineering disciplines. calc: which calculator discipline keys are shown on the discipline page.
export const ENGINEERING = {
  id: 'engineering', code: 'ENG', name: 'Engineering',
  blurb: 'Professional-grade engineering: every calculator states its equations, assumptions, units, limitations and sources.',
  disciplines: [
    { id: 'mechanical', code: 'MEC', name: 'Mechanical', calc: ['mechanical', 'mechanics'], groups: [
      g('Statics', 'Forces|Moments>eq:moment|Couples|Equilibrium>learn:moments|Free-body diagrams|Trusses>solver:truss|Frames|Distributed loads>solver:beam|Centroids>calc:section'),
      g('Dynamics', 'Particle kinematics>calc:suvat|Particle kinetics|Rigid-body motion|Rotation|Work–energy|Impulse–momentum>calc:collision|Moment of inertia>calc:inertia|Angular momentum'),
      g('Mechanical Design', 'Shafts>calc:shaft-size|Gears>calc:gear-train|Gear trains>calc:gear-train|Bearings>calc:bearing-life|Springs>calc:spring|Bolts>calc:bolt|Screws|Keys|Splines|Couplings|Belts>calc:belt-drive|Chains|Clutches|Brakes|Flywheels>calc:flywheel|Seals|Fasteners>tool:tables'),
    ] },
    { id: 'solid', code: 'SOL', name: 'Solid Mechanics', calc: ['structural'], groups: [
      g('Stress & Strain', 'Stress>calc:axial-stress|Strain>calc:axial-stress|Hooke\'s law|Elasticity|Poisson\'s ratio|Axial loading>calc:axial-stress|Torsion>calc:shaft-torsion|Bending>calc:beam-cases|Shear|Beam deflection>calc:beam-cases|Combined loading>calc:shaft-size'),
      g('Failure & Design', 'Stress transformation>calc:mohr|Strain transformation|Principal stresses>calc:mohr|Mohr\'s circle>calc:mohr|von Mises stress>calc:mohr|Tresca criterion>calc:mohr|Stress concentrations|Columns>calc:buckling|Buckling>calc:buckling|Contact stresses|Pressure vessels>calc:pressure-vessel|Fatigue>calc:fatigue|S-N curves|Fracture mechanics|Creep'),
      g('FEA Fundamentals', 'FEM fundamentals>solver:beam|Nodes/elements|Meshing|Boundary conditions|Loads|Stiffness matrices>solver:truss|Linear static analysis>solver:truss|Modal analysis|Thermal FEA|Convergence|Result interpretation'),
    ] },
    { id: 'structural', code: 'STR', name: 'Structural & Civil', calc: ['structural'], groups: [
      g('Structural', 'Beams>solver:beam|Trusses>solver:truss|Frames|Reactions>solver:beam|SFD/BMD>solver:beam|Deflection>calc:beam-cases|Columns>calc:buckling|Structural steel>tool:materials|Reinforced concrete|Loads|Load combinations|Section properties>calc:section'),
      g('Geotechnical', 'Soil properties|Effective stress|Consolidation|Shear strength|Bearing capacity|Foundations|Retaining walls|Slope stability'),
      g('Hydrology', 'Rainfall|Runoff|Drainage>calc:manning|Rational method|Hydrographs|Flood calculations|Open channels>calc:manning'),
      g('Surveying', 'Levelling|Coordinates|Bearings|Traverses|Areas/volumes'),
    ] },
    { id: 'vibrations', code: 'VIB', name: 'Dynamics & Vibrations', calc: ['mechanics'], groups: [
      g('Vibrations', 'Free vibration>calc:shm-spring|Forced vibration|Natural frequency>calc:shm-spring|Damping>calc:shm-spring|Damping ratio>calc:shm-spring|Resonance|Harmonic excitation|Base excitation|Vibration isolation|Rotating imbalance|SDOF systems>calc:shm-spring|MDOF systems|Modal analysis|Frequency response|Transmissibility|Gyroscopes'),
    ] },
    { id: 'fluids', code: 'FLU', name: 'Fluid Mechanics', calc: ['fluids'], groups: [
      g('Fundamentals', 'Density / specific gravity>eq:density|Specific weight|Pressure>eq:pressure|Hydrostatic pressure>calc:hydrostatic|Absolute vs gauge pressure>calc:hydrostatic|Manometers|Pascal\'s law|Buoyancy / Archimedes>calc:buoyancy|Centre of pressure|Viscosity>tool:fluids|Dynamic ↔ kinematic viscosity>eq:kinvisc|Surface tension|Capillary rise'),
      g('Flow', 'Volumetric & mass flow rate>eq:continuity|Continuity equation>eq:continuity|Reynolds number>calc:reynolds|Laminar/turbulent flow>calc:reynolds|Mach number>calc:isa|Speed of sound>calc:isa|Compressible/incompressible flow'),
      g('Bernoulli & Energy', 'Bernoulli equation>calc:venturi|Total, pressure, velocity & elevation head>calc:venturi|Energy equation|Hydraulic & energy grade lines|Stagnation & dynamic pressure>calc:drag'),
      g('Pipes', 'Darcy–Weisbach>calc:pipe-flow|Darcy friction factor>calc:pipe-flow|Colebrook equation>calc:pipe-flow|Swamee–Jain approximation>calc:pipe-flow|Moody chart|Relative roughness>calc:pipe-flow|Major & minor losses>calc:pipe-flow|Equivalent length|Pipes in series/parallel|Pipe sizing>calc:pipe-flow|Pressure-drop calculator>calc:pipe-flow|Pipe networks'),
      g('Fittings & Measurement', 'Elbows, tees, bends, valves (K factors)>calc:pipe-flow|Entrances/exits|Contractions/expansions|Venturi meter>calc:venturi|Orifice plate>calc:orifice|Pitot tube|Flow nozzle|Rotameter'),
      g('Pumps & Turbines', 'Pump power>calc:pump-power|Hydraulic power>eq:pump-power|Pump efficiency>calc:pump-power|Total dynamic head|System curve|Operating point|Pumps in series/parallel|NPSH>calc:npsh|Cavitation check>calc:npsh|Affinity laws>calc:affinity|Pump selection helper|Water hammer>calc:water-hammer'),
      g('Open Channel', 'Manning equation>calc:manning|Hydraulic radius>calc:manning|Froude number>calc:manning|Critical depth|Normal depth|Rectangular & trapezoidal channels>calc:manning|Weirs|Spillways'),
      g('Aerodynamics', 'Drag force>calc:drag|Drag coefficient>calc:drag|Lift>eq:lift|Lift coefficient|Terminal velocity>calc:drag|Wing loading|Lift-to-drag ratio|Air density vs altitude>calc:isa|Airfoils|Boundary layers|Stall'),
      g('Advanced', 'Isentropic flow|Choked flow|Nozzle flow|Shock waves|Boundary layers|Pipe-network solver|Compressible-flow solver'),
    ] },
    { id: 'thermo', code: 'THM', name: 'Thermodynamics', calc: ['thermo'], groups: [
      g('Properties & Laws', 'State variables|Temperature conversion>tool:units|Specific volume|Internal energy|Enthalpy|Entropy|Specific heats c_p, c_v|Ideal gases>calc:ideal-gas|Real gases|Gas mixtures|First law>eq:first-law|Second law|Exergy|Steady-flow energy equation'),
      g('Processes', 'Isobaric>calc:gas-process|Isochoric>calc:gas-process|Isothermal>calc:gas-process|Adiabatic / isentropic>calc:gas-process|Polytropic>calc:gas-process|P–V diagrams>calc:gas-process'),
      g('Cycles', 'Carnot>calc:carnot|Otto>calc:otto|Diesel>calc:diesel|Dual|Brayton>calc:brayton|Rankine>calc:rankine|Refrigeration>calc:refrigeration|Heat pumps>calc:carnot|T–s diagrams'),
      g('Heat Transfer', 'Fourier\'s law>eq:fourier|Plane & composite walls>calc:wall|Cylindrical conduction>calc:pipe-insulation|Spherical conduction|Thermal resistance>calc:wall|Insulation thickness>calc:pipe-insulation|Critical insulation radius>calc:pipe-insulation|Convection>eq:convection|Nusselt, Prandtl, Grashof numbers|Natural/forced convection|Radiation>calc:radiation|View factors|Fins|Transient conduction>calc:lumped'),
      g('Heat Exchangers', 'LMTD>calc:lmtd|NTU / effectiveness>calc:entu|Parallel & counterflow>calc:entu|Shell-and-tube>calc:entu|Required area>calc:lmtd|Outlet temperatures>calc:entu'),
      g('Engines', 'Displacement>calc:engine|Bore/stroke>calc:engine|Compression ratio>calc:otto|BMEP/IMEP>calc:engine|Brake & indicated power>calc:engine|BSFC>calc:engine|Volumetric efficiency>calc:engine|Air–fuel ratio>calc:engine|Thermal efficiency>calc:engine'),
      g('Steam & Property Tables', 'Water/steam saturation>calc:steam-sat|Superheated steam|Compressed liquid|Quality|Air properties>tool:fluids|Water properties>tool:fluids|Refrigerants'),
    ] },
    { id: 'electrical', code: 'ELE', name: 'Electrical & Electronic', calc: ['electrical'], groups: [
      g('Fundamentals', 'Charge>eq:charge|Current|Voltage|Resistance|Conductance|Resistivity>eq:resistivity|Ohm\'s law>calc:ohm|Electrical energy & power>calc:energy-cost|Joule heating'),
      g('Resistors & Circuits', 'Series/parallel resistors>calc:combine|Voltage divider>calc:divider|Loaded divider>calc:divider|Current divider|Resistor colour codes>calc:colour-code|Kirchhoff\'s laws>learn:circuits|Nodal & mesh analysis|Thévenin/Norton equivalents>calc:divider|Superposition|Maximum power transfer|Delta ↔ wye'),
      g('Capacitors & Inductors', 'Capacitance>calc:capacitor|Series/parallel capacitors>calc:combine|Stored energy>eq:cap-energy|RC charging/discharging>calc:rc|RC time constant>eq:rc-tau|Capacitive reactance>eq:xc|Inductance|Series/parallel inductors>calc:combine|RL circuits>calc:rl|Inductive reactance>eq:xl'),
      g('AC & RLC', 'Frequency ↔ period|RMS & peak|Phase angle|Real, reactive & apparent power>calc:ac-power|Power factor>calc:ac-power|Power-factor correction>calc:ac-power|Complex impedance>calc:rlc|Series & parallel RLC>calc:rlc|Resonance>eq:resonance|Q factor & bandwidth>calc:rlc'),
      g('Power Systems', 'Three-phase power>calc:three-phase|Star/delta>calc:three-phase|Line ↔ phase quantities>calc:three-phase|Transformers>calc:transformer|Motors>calc:motor|Synchronous speed & slip>calc:motor|Starting current|Cable voltage drop>calc:voltage-drop|Cable sizing|Short-circuit current|Protection'),
      g('Batteries', 'Capacity (Ah ↔ Wh)>calc:battery|Runtime>calc:battery|C-rate>calc:battery|Series/parallel cells>calc:battery|Pack voltage & energy>calc:battery|EV battery calculations'),
      g('Electronics', 'LED resistor>calc:led|Diodes|Zener diodes|Rectifiers|BJTs|MOSFETs|Op-amps>calc:opamp-filter|Filters>calc:opamp-filter|Cutoff frequency>calc:opamp-filter|Logic gates|ADC/DAC|PWM'),
      g('Electromagnetism', 'Coulomb\'s law>calc:coulomb|Electric field & potential>calc:coulomb|Magnetic field>calc:bfield|Force on a conductor>eq:lorentz-force|Magnetic flux|Faraday\'s & Lenz\'s laws>eq:faraday|Solenoids>calc:bfield'),
    ] },
    { id: 'controls', code: 'CTL', name: 'Control Systems', calc: [], groups: [
      g('Control Systems', 'Open/closed-loop control|Feedback|Transfer functions|Block diagrams|Signal-flow graphs|First/second-order systems|Transient response|Steady-state error|Stability|Routh–Hurwitz|Root locus|Bode plots|Nyquist plots|Gain/phase margins|PID control|P/PI/PD controllers|State-space models|Controllability & observability'),
    ] },
    { id: 'mechatronics', code: 'MTX', name: 'Mechatronics & Robotics', calc: [], groups: [
      g('Mechatronics', 'Sensors|Actuators|Encoders|Servos|Stepper motors|DC & BLDC motors>calc:motor|Microcontrollers|PLC fundamentals|PWM|ADC/DAC|Signal conditioning'),
      g('Robotics', 'Coordinate frames|Degrees of freedom|Forward kinematics|Inverse kinematics|Transformation matrices|Jacobians|Robot dynamics|Trajectory planning|Motion control|Mobile robots|Manipulators'),
    ] },
    { id: 'materials', code: 'MAT', name: 'Materials Science', calc: [], groups: [
      g('Materials Science', 'Atomic bonding|Crystal structures|Unit cells|Miller indices|Crystal defects|Dislocations|Diffusion|Phase diagrams|Iron–carbon diagram|Heat treatment|Annealing, quenching, tempering|Hardening|Strengthening mechanisms|Metals>tool:materials|Polymers>tool:materials|Ceramics>tool:materials|Composites>tool:materials|Corrosion|Fatigue>calc:fatigue|Creep|Fracture|Material selection>tool:compare|Failure analysis'),
    ] },
    { id: 'manufacturing', code: 'MFG', name: 'Manufacturing', calc: ['manufacturing'], groups: [
      g('Processes', 'Casting|Forging|Rolling|Extrusion|Welding|Brazing|Soldering|Additive manufacturing|Injection moulding|Sheet-metal forming|Surface finishing'),
      g('Machining', 'Turning>calc:turning|Milling>calc:milling|Drilling>calc:drilling|Grinding|CNC|Cutting speeds>calc:turning|Feed rates>calc:milling|Material removal rate>calc:milling|Machining time>calc:turning|Tool life'),
      g('Metrology, GD&T & Fits', 'Metrology|Quality control|GD&T|Datums|Flatness, straightness|Parallelism, perpendicularity|Position|Runout|Profile|Fits>calc:iso-fit|Tolerances>calc:iso-fit|Tolerance stacks>calc:tol-stack|Surface finish|Thread reference>tool:tables'),
    ] },
    { id: 'hvac', code: 'HVC', name: 'HVAC & Refrigeration', calc: ['hvac'], groups: [
      g('HVAC', 'Heating/cooling loads>calc:hvac-load|Sensible heat>calc:hvac-load|Latent heat>calc:hvac-load|Sensible heat ratio>calc:hvac-load|Airflow|Duct sizing>calc:duct|Pressure drop>calc:duct|Fan power|COP>calc:refrigeration|EER/SEER|Refrigeration ton ↔ kW>tool:units'),
      g('Refrigeration', 'Vapour-compression cycle>calc:refrigeration|Compressors|Condensers|Evaporators|Expansion valves|Refrigerants'),
      g('Psychrometrics', 'Dry-bulb & wet-bulb temperature>calc:psychro|Relative humidity>calc:psychro|Humidity ratio>calc:psychro|Dew point>calc:psychro|Enthalpy>calc:psychro|Psychrometric chart'),
    ] },
    { id: 'chemical', code: 'CHE', name: 'Chemical', calc: [], groups: [
      g('Chemical Engineering', 'Mass balances|Energy balances|Process flow|Fluid transport>calc:pipe-flow|Heat transfer>calc:lmtd|Mass transfer|Diffusion|Reaction kinetics|Reactor design|Batch reactors|CSTR|PFR|Distillation|Absorption|Extraction|Filtration|Separation|Process control'),
    ] },
    { id: 'signals', code: 'SIG', name: 'Signals & Systems', calc: [], groups: [
      g('Signals & Systems', 'Continuous/discrete signals|Periodic signals|Sampling|Nyquist theorem|Aliasing|Convolution|Fourier series|Fourier transform|FFT|Laplace transform|Z-transform|Transfer functions|Frequency response>calc:opamp-filter|Filters>calc:opamp-filter|Noise|Signal-to-noise ratio|Spectral analysis'),
    ] },
    { id: 'energy', code: 'NRG', name: 'Renewable & Energy', calc: ['energy'], groups: [
      g('Solar', 'Solar irradiance|PV output>calc:solar-pv|Panel efficiency|Array sizing>calc:solar-pv|Battery sizing>calc:battery|Inverters'),
      g('Wind & Hydro', 'Wind power>calc:wind|Power coefficient & Betz limit>calc:wind|Tip-speed ratio>calc:wind|Capacity factor|Hydropower>calc:hydro'),
      g('Storage & Systems', 'Batteries>calc:battery|Flywheels>calc:flywheel|Pumped hydro>calc:hydro|Hydrogen|Thermal storage|Energy efficiency|Combined-cycle plants>calc:brayton|CHP|Heat pumps>calc:carnot|Grid storage'),
    ] },
    { id: 'computational', code: 'CMP', name: 'Computational Engineering', calc: [], groups: [
      g('Programming', 'Python for engineers|Numerical computing|Arrays|Plotting>tool:graph|Data processing>tool:data|Symbolic maths'),
      g('Numerical Engineering', 'Root finding>tool:solver|Optimization|Numerical integration|Numerical differentiation|ODE/PDE solving>sim:pendulum|Finite differences|FEM>solver:truss|CFD fundamentals|Monte Carlo simulation>tool:uncertainty'),
    ] },
    { id: 'experimental', code: 'EXP', name: 'Experimental Engineering & Data', calc: [], groups: [
      g('Measurement & Data', 'Calibration|Accuracy vs precision|Resolution|Repeatability|Uncertainty>tool:uncertainty|Error propagation>tool:uncertainty|Experimental design|Sampling|Sensor data|Noise|Regression>tool:data|Curve fitting>tool:data|Residuals>tool:data|R²>tool:data|Confidence intervals|Data visualization>tool:graph|Dimensional analysis>tool:dimensions'),
    ] },
    { id: 'design', code: 'DES', name: 'Engineering Design', calc: [], groups: [
      g('Engineering Design', 'Design process|Requirements|Specifications|Constraints|Concept generation|Concept selection|Safety factors>eq:fos|Reliability|FMEA|Failure analysis|Material selection>tool:compare|Component selection|Optimization|Tolerances>calc:tol-stack|Design for manufacture|Design for assembly|Cost estimation|Sustainability|Life-cycle analysis'),
    ] },
  ],
};

export const TOOLS_LIST = [
  ['calculators', 'Calculator Library', 'Every calculator, filterable by discipline and level.'],
  ['solvers', 'Solvers', 'Beam and truss solvers now; circuit, pipe network, gear system, heat exchanger and cycle solvers planned.'],
  ['sims', 'Simulations', 'Interactive physics: projectile, pendulum, double slit, wavefunctions, Minkowski diagram, black-hole orbits.'],
  ['solver', 'Equation Solver', 'Pick any library equation and solve for any variable numerically, with units.'],
  ['units', 'Unit Converter', '40+ physical quantities, with engineering units and CODATA-exact factors.'],
  ['graph', 'Graphing', 'Plot functions and data, with log axes and regression.'],
  ['data', 'Data Analysis', 'Paste or import CSV: statistics, regression, residuals, R².'],
  ['uncertainty', 'Uncertainty Propagation', 'Linear (partial-derivative) and Monte Carlo propagation through any formula.'],
  ['dimensions', 'Dimensional Analysis', 'Check any equation for dimensional consistency.'],
];

export const REFERENCE_LIST = [
  ['equations', 'Equation Library', 'Searchable equations with variables, units and linked calculators.'],
  ['constants', 'Constants', 'CODATA 2018, SI-exact, IAU and engineering constants.'],
  ['materials', 'Materials Database', 'Metals, polymers, composites and construction materials with sourced properties.'],
  ['compare', 'Material Comparison', 'Side-by-side properties, specific strength/stiffness and an Ashby-style chart.'],
  ['fluids', 'Fluid & Property Tables', 'Water, air, common liquids, gases and IAPWS-IF97 saturation.'],
  ['tables', 'Engineering Tables', 'ISO metric threads, bolt classes, NPS pipe sizes, roughness, K-factors.'],
  ['standards', 'Standards Guide', 'What ISO, ASME, ASTM, IEC, EN and others cover — and which calculators relate.'],
];

export const PLATFORM = {
  student: 'Lessons|Worked examples|Question bank|Topic questions|Multiple-choice questions|Automatic marking|Hints|Full solutions|Difficulty levels|Topic progress|Formula practice|Flashcards|Quizzes|Timed tests|Past-paper-style questions|Lab guides',
  professional: 'Project workspaces|Saved calculations|Calculation history|Calculation versioning|Calculation sheets|PDF reports|Assumption tracking|Source/reference tracking|Unit-system selection|Material selection|Fluid selection|Reusable inputs|Calculation templates|Shared calculations|Team projects|CSV import/export|Data export|API access',
  workspace: 'Projects|Calculations|Simulations|Graphs|Datasets|Reports|Saved equations|Saved materials|Recent activity|Student/engineer mode|SI/Imperial|Default units|Discipline|Education level',
};

// Status of platform features in this build (for the content map / roadmap).
export const FEATURE_STATUS = {
  live: ['Lessons', 'Worked examples', 'Question bank', 'Topic questions', 'Automatic marking', 'Hints', 'Full solutions', 'Difficulty levels', 'Formula practice', 'Project workspaces', 'Saved calculations', 'Calculation history', 'Calculation sheets', 'PDF reports', 'Assumption tracking', 'Source/reference tracking', 'Unit-system selection', 'Material selection', 'Fluid selection', 'Reusable inputs', 'Shared calculations', 'CSV import/export', 'Data export', 'Projects', 'Calculations', 'Reports', 'Saved equations', 'Saved materials', 'Recent activity', 'Student/engineer mode', 'SI/Imperial', 'Default units', 'Education level', 'Datasets', 'Graphs'],
};
