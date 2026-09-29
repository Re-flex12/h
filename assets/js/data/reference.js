// Reference tables and standards guide. Dimensional data only (no reproduction of standard text).

// ISO metric coarse threads (ISO 261/262). Stress area computed per ISO 898-1: As = π/4 (d − 0.9382 P)².
export const THREADS = [[1.6, 0.35], [2, 0.4], [2.5, 0.45], [3, 0.5], [4, 0.7], [5, 0.8], [6, 1], [8, 1.25], [10, 1.5], [12, 1.75], [14, 2], [16, 2], [20, 2.5], [24, 3], [30, 3.5], [36, 4], [42, 4.5], [48, 5]]
  .map(([d, P]) => ({ d, P, As: Math.PI / 4 * (d - 0.9382 * P) ** 2, d3: d - 1.22687 * P, drill: +(d - P).toFixed(2) }));

// ISO 898-1 property classes (MPa): Rm nom/min, ReL or Rp0.2 min, proof stress Sp.
export const BOLT_CLASSES = [
  ['4.6', 400, 400, 240, 225, 'Low-strength, general'],
  ['4.8', 400, 420, 340, 310, 'Low-strength'],
  ['5.6', 500, 500, 300, 280, ''],
  ['5.8', 500, 520, 420, 380, ''],
  ['8.8 (d ≤ 16)', 800, 800, 640, 580, 'Standard high-tensile structural/mechanical'],
  ['8.8 (d > 16)', 800, 830, 660, 600, ''],
  ['10.9', 1000, 1040, 940, 830, 'High-strength'],
  ['12.9', 1200, 1220, 1100, 970, 'Very high strength (socket cap screws)'],
];

// ASME B36.10M carbon steel pipe: NPS, OD mm, Sch 40 wall mm, Sch 80 wall mm.
export const PIPES = [
  ['1/8', 10.3, 1.73, 2.41], ['1/4', 13.7, 2.24, 3.02], ['3/8', 17.1, 2.31, 3.20], ['1/2', 21.3, 2.77, 3.73], ['3/4', 26.7, 2.87, 3.91],
  ['1', 33.4, 3.38, 4.55], ['1-1/4', 42.2, 3.56, 4.85], ['1-1/2', 48.3, 3.68, 5.08], ['2', 60.3, 3.91, 5.54], ['2-1/2', 73.0, 5.16, 7.01],
  ['3', 88.9, 5.49, 7.62], ['4', 114.3, 6.02, 8.56], ['5', 141.3, 6.55, 9.53], ['6', 168.3, 7.11, 10.97], ['8', 219.1, 8.18, 12.70],
  ['10', 273.0, 9.27, 15.09], ['12', 323.8, 10.31, 17.48],
];

// Typical minor-loss coefficients (Crane TP-410 / White; indicative, fully turbulent).
export const KFACTORS = [
  ['Pipe entrance, sharp-edged', 0.5], ['Pipe entrance, well rounded', 0.04], ['Pipe exit (to reservoir)', 1.0], ['90° standard elbow (threaded)', 0.9],
  ['90° long-radius elbow (flanged)', 0.3], ['45° elbow', 0.4], ['180° return bend', 1.5], ['Tee, flow through run', 0.4], ['Tee, flow through branch', 1.8],
  ['Gate valve, fully open', 0.15], ['Gate valve, ½ open', 5.6], ['Globe valve, fully open', 10], ['Ball valve, fully open', 0.05], ['Butterfly valve, fully open', 0.5],
  ['Swing check valve', 2.0], ['Sudden contraction (A₂/A₁ = 0.5)', 0.3], ['Sudden expansion', '(1 − A₁/A₂)²'],
];

export const STANDARDS = [
  { org: 'ISO', full: 'International Organization for Standardization', url: 'https://www.iso.org', scope: 'International standards across all engineering fields: quality (ISO 9001), GPS/tolerancing (ISO 286, ISO 1101), fasteners (ISO 898), bearings (ISO 281), gears (ISO 6336), atmosphere (ISO 2533), flow measurement (ISO 5167).',
    items: [['ISO 286-1/-2', 'Limits and fits (ISO code system for tolerances)', 'iso-fit'], ['ISO 898-1', 'Mechanical properties of bolts, screws and studs', 'bolt'], ['ISO 281', 'Rolling bearings — dynamic load ratings and rating life', 'bearing-life'], ['ISO 6336', 'Load capacity of spur and helical gears', 'gear-train'], ['ISO 5167', 'Flow measurement by pressure differential devices', 'orifice'], ['ISO 2533', 'Standard atmosphere', 'isa'], ['ISO 1101 / ISO 5459', 'Geometrical tolerancing and datums', null], ['ISO 6946', 'Building components — thermal resistance and U-value', 'wall'], ['ISO 80000', 'Quantities and units', null]] },
  { org: 'ASME', full: 'American Society of Mechanical Engineers', url: 'https://www.asme.org', scope: 'Pressure equipment, piping, dimensioning & tolerancing, and mechanical components — widely adopted in North America and internationally.',
    items: [['BPVC Section VIII', 'Boiler & Pressure Vessel Code — pressure vessels', 'pressure-vessel'], ['B31.1 / B31.3', 'Power piping / Process piping', 'pipe-flow'], ['B36.10M', 'Welded and seamless wrought steel pipe (dimensions)', null], ['Y14.5', 'Dimensioning and tolerancing (GD&T)', 'tol-stack'], ['B106.1M', 'Design of transmission shafting', 'shaft-size'], ['PTC series', 'Performance test codes (pumps, turbines, fans)', null]] },
  { org: 'ASTM International', full: 'ASTM International (formerly American Society for Testing and Materials)', url: 'https://www.astm.org', scope: 'Material specifications and test methods. Material grades in the database cite ASTM specifications where applicable.',
    items: [['A36', 'Carbon structural steel', null], ['A240', 'Stainless plate, sheet and strip', null], ['A48', 'Grey iron castings', null], ['B265', 'Titanium and titanium alloy strip, sheet, plate', null], ['E8/E8M', 'Tension testing of metallic materials', null], ['E466', 'Force-controlled constant-amplitude fatigue tests', 'fatigue'], ['D638', 'Tensile properties of plastics', null]] },
  { org: 'IEC', full: 'International Electrotechnical Commission', url: 'https://www.iec.ch', scope: 'Electrical, electronic and related technologies: installations, machines, cables, components, safety.',
    items: [['IEC 60364', 'Low-voltage electrical installations (incl. voltage drop, cable selection)', 'voltage-drop'], ['IEC 60228', 'Conductors of insulated cables (resistance)', 'voltage-drop'], ['IEC 60034', 'Rotating electrical machines', 'motor'], ['IEC 60072', 'Dimensions and output series for rotating machines', 'pump-power'], ['IEC 60062', 'Marking codes for resistors and capacitors', 'colour-code'], ['IEC 61724', 'Photovoltaic system performance', 'solar-pv'], ['IEC 61400', 'Wind energy generation systems', 'wind']] },
  { org: 'CEN (EN / Eurocodes)', full: 'European Committee for Standardization', url: 'https://www.cencenelec.eu', scope: 'European Norms, including the Eurocodes for structural design (EN 1990–1999) and material standards (EN 10025 steels, EN 755 aluminium).',
    items: [['EN 1990', 'Basis of structural design (load combinations)', null], ['EN 1991', 'Actions on structures', null], ['EN 1992-1-1', 'Design of concrete structures', null], ['EN 1993-1-1', 'Design of steel structures (member buckling, bending)', 'buckling'], ['EN 10025', 'Hot-rolled structural steels (S235, S355 …)', null], ['EN 13445', 'Unfired pressure vessels', 'pressure-vessel']] },
  { org: 'IEEE / NFPA / BSI', full: 'Institute of Electrical and Electronics Engineers · National Fire Protection Association · British Standards Institution', url: 'https://www.ieee.org', scope: 'National and sector standards frequently needed alongside ISO/IEC.',
    items: [['NFPA 70 (NEC)', 'US National Electrical Code — wiring and protection', 'voltage-drop'], ['BS 7671', 'UK Requirements for Electrical Installations (IET Wiring Regulations)', 'voltage-drop'], ['IEEE 1547', 'Interconnection of distributed energy resources', null], ['IEEE 754', 'Floating-point arithmetic (how this site computes)', null]] },
  { org: 'ASHRAE / AGMA / ANSI-HI / IAPWS / ICAO', full: 'Sector bodies for HVAC, gears, pumps, water/steam properties and aviation', url: 'https://www.ashrae.org', scope: 'Sector references used directly by calculators on this site.',
    items: [['ASHRAE Handbook — Fundamentals', 'Psychrometrics, load calculation, duct design', 'psychro'], ['AGMA 2001-D04', 'Gear rating (US practice)', 'gear-train'], ['ANSI/HI 9.6.1', 'NPSH margin for rotodynamic pumps', 'npsh'], ['IAPWS-IF97', 'Industrial formulation for water & steam properties', 'steam-sat'], ['ICAO Doc 7488', 'Manual of the ICAO Standard Atmosphere', 'isa'], ['CODATA 2018', 'Recommended values of the fundamental physical constants', null]] },
];
