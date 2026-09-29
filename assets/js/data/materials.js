// Materials database — representative engineering properties at room temperature.
//
// Units in this file (converted to SI by materialSI()):
//   rho kg/m³ · E, G GPa · Sy, Su, Sf MPa · el % · k W/(m·K) · cp J/(kg·K) · a µm/(m·K) · res µΩ·cm
// basis: 'typical' = representative handbook value; 'min' = specification minimum.
// Sy for polymers = tensile yield/strength at yield where defined; composites list fibre-direction values.
// Sources are aggregated handbook data (ASM Handbooks, Shigley Table A-20 / A-22 for SAE steels, MMPDS-style
// typical values for aerospace alloys, EN/ASTM specification minima where marked, and manufacturer datasheets for polymers).
// These are NOT design allowables. Properties vary with product form, thickness, heat treatment and supplier.

const M = (o) => o;

export const MATERIALS = [
  // ── Aluminium alloys ───────────────────────────────────
  M({ id: 'al-6061-t6', name: '6061-T6 Aluminium', cat: 'Metals', sub: 'Aluminium alloys', cond: 'T6 (solution treated + artificially aged)', basis: 'typical',
    rho: 2700, E: 68.9, G: 26, nu: 0.33, Sy: 276, Su: 310, el: 12, hb: 95, Sf: 96.5, k: 167, cp: 896, a: 23.6, melt: '582–652', res: 3.99,
    uses: 'General structural parts, frames, fittings, machined components, marine hardware', corr: 'Good general corrosion resistance; good weldability (HAZ loses T6 strength).',
    notes: 'Fatigue strength at 5×10⁸ cycles (R.R. Moore). Weld-affected zone strength drops to roughly T4/O-temper levels.' }),
  M({ id: 'al-6082-t6', name: '6082-T6 Aluminium', cat: 'Metals', sub: 'Aluminium alloys', cond: 'T6 extrusion, t ≤ 5 mm', basis: 'min',
    rho: 2700, E: 70, G: 26, nu: 0.33, Sy: 250, Su: 290, el: 8, hb: 95, k: 172, cp: 894, a: 23.1, melt: '555–650', res: 3.9,
    uses: 'European structural extrusions, trusses, cranes, bridges', corr: 'Good corrosion resistance.', notes: 'Minimum values per EN 755-2 for thin extrusions; thicker sections differ.' }),
  M({ id: 'al-7075-t6', name: '7075-T6 Aluminium', cat: 'Metals', sub: 'Aluminium alloys', cond: 'T6', basis: 'typical',
    rho: 2810, E: 71.7, G: 26.9, nu: 0.33, Sy: 503, Su: 572, el: 11, hb: 150, Sf: 159, k: 130, cp: 960, a: 23.6, melt: '477–635', res: 5.15,
    uses: 'Aircraft structures, highly stressed parts, bike components, moulds', corr: 'Lower corrosion resistance; susceptible to SCC in T6 (T73 improves this). Poor weldability.',
    notes: 'Fatigue strength at 5×10⁸ cycles.' }),
  M({ id: 'al-2024-t3', name: '2024-T3 Aluminium', cat: 'Metals', sub: 'Aluminium alloys', cond: 'T3 (solution treated, cold worked, naturally aged)', basis: 'typical',
    rho: 2780, E: 73.1, G: 28, nu: 0.33, Sy: 345, Su: 483, el: 18, hb: 120, Sf: 138, k: 121, cp: 875, a: 23.2, melt: '502–638', res: 5.82,
    uses: 'Aircraft skins and fuselage structure, fatigue-critical parts', corr: 'Poor corrosion resistance — often clad (Alclad) or anodised.', notes: 'Excellent fatigue crack growth resistance.' }),
  M({ id: 'al-5083-h116', name: '5083-H116 Aluminium', cat: 'Metals', sub: 'Aluminium alloys', cond: 'H116 (strain hardened, marine)', basis: 'typical',
    rho: 2660, E: 70.3, G: 26.4, nu: 0.33, Sy: 228, Su: 317, el: 16, hb: 85, k: 117, cp: 900, a: 23.8, melt: '574–638', res: 5.9,
    uses: 'Ship hulls, pressure vessels, cryogenic tanks', corr: 'Excellent seawater resistance; very good weldability.', notes: '' }),

  // ── Carbon & alloy steels ──────────────────────────────
  M({ id: 'st-1018-hr', name: 'AISI 1018 Steel (hot rolled)', cat: 'Metals', sub: 'Carbon steels', cond: 'Hot rolled', basis: 'min',
    rho: 7870, E: 205, G: 80, nu: 0.29, Sy: 220, Su: 400, el: 25, hb: 116, k: 51.9, cp: 486, a: 11.5, melt: '~1420–1510', res: 15.9,
    uses: 'General low-carbon steel parts, shafts under light load, pins, case-hardened parts', corr: 'Rusts — needs coating/plating.', notes: 'SAE minimum properties (Shigley Table A-20).' }),
  M({ id: 'st-1018-cd', name: 'AISI 1018 Steel (cold drawn)', cat: 'Metals', sub: 'Carbon steels', cond: 'Cold drawn', basis: 'min',
    rho: 7870, E: 205, G: 80, nu: 0.29, Sy: 370, Su: 440, el: 15, hb: 126, k: 51.9, cp: 486, a: 11.5, melt: '~1420–1510', res: 15.9,
    uses: 'Precision shafting, bright bar, machined parts', corr: 'Rusts — needs coating/plating.', notes: 'SAE minimum properties (Shigley Table A-20).' }),
  M({ id: 'st-1020-hr', name: 'AISI 1020 Steel (hot rolled)', cat: 'Metals', sub: 'Carbon steels', cond: 'Hot rolled', basis: 'min',
    rho: 7870, E: 207, G: 80, nu: 0.29, Sy: 210, Su: 380, el: 25, hb: 111, k: 51.9, cp: 486, a: 11.7, melt: '~1420–1510', res: 15.9,
    uses: 'Structural and general engineering parts', corr: 'Rusts — needs coating.', notes: 'SAE minimum properties (Shigley Table A-20).' }),
  M({ id: 'st-1045-cd', name: 'AISI 1045 Steel (cold drawn)', cat: 'Metals', sub: 'Carbon steels', cond: 'Cold drawn', basis: 'min',
    rho: 7850, E: 205, G: 80, nu: 0.29, Sy: 530, Su: 630, el: 12, hb: 179, k: 49.8, cp: 486, a: 11.2, melt: '~1420–1500', res: 16.2,
    uses: 'Shafts, axles, gears, bolts, crankshafts (often induction hardened)', corr: 'Rusts — needs coating.', notes: 'SAE minimum properties (Shigley Table A-20).' }),
  M({ id: 'st-4140-ann', name: 'AISI 4140 Steel (annealed)', cat: 'Metals', sub: 'Alloy steels', cond: 'Annealed', basis: 'typical',
    rho: 7850, E: 205, G: 80, nu: 0.29, Sy: 417, Su: 655, el: 25.7, hb: 197, k: 42.6, cp: 473, a: 12.2, melt: '~1416', res: 22.0,
    uses: 'Pre-machining condition for shafts, gears, spindles, tooling', corr: 'Rusts — needs coating.', notes: 'Cr-Mo alloy steel. Properties rise sharply with quench & temper.' }),
  M({ id: 'st-4140-norm', name: 'AISI 4140 Steel (normalised)', cat: 'Metals', sub: 'Alloy steels', cond: 'Normalised (870 °C)', basis: 'typical',
    rho: 7850, E: 205, G: 80, nu: 0.29, Sy: 655, Su: 1020, el: 17.7, hb: 302, k: 42.6, cp: 473, a: 12.2, melt: '~1416', res: 22.0,
    uses: 'Shafts, axles, high-strength bolts, gears, oil-tool components', corr: 'Rusts — needs coating.', notes: 'For Q&T conditions use supplier/heat-treater certificate data.' }),
  M({ id: 'st-a36', name: 'ASTM A36 Structural Steel', cat: 'Metals', sub: 'Carbon steels', cond: 'As rolled plate/shapes', basis: 'min',
    rho: 7850, E: 200, G: 79.3, nu: 0.26, Sy: 250, Su: 400, el: 20, hb: 119, k: 50, cp: 486, a: 11.7, melt: '~1425–1540', res: 16,
    uses: 'Buildings, bridges, general structural fabrication', corr: 'Rusts — paint or galvanise.', notes: 'Specification minimum yield; ultimate range 400–550 MPa.' }),
  M({ id: 'st-s355', name: 'EN 10025 S355 Structural Steel', cat: 'Metals', sub: 'Carbon steels', cond: 'As rolled, t ≤ 16 mm', basis: 'min',
    rho: 7850, E: 210, G: 81, nu: 0.3, Sy: 355, Su: 470, el: 22, k: 50, cp: 460, a: 12, melt: '~1425–1540', res: 16,
    uses: 'European structural steelwork', corr: 'Rusts — paint or galvanise.', notes: 'Minimum values; yield reduces for thicker sections. Eurocode 3 design values use E = 210 GPa.' }),
  M({ id: 'ci-grey-30', name: 'Grey Cast Iron (ASTM A48 Class 30)', cat: 'Metals', sub: 'Cast irons', cond: 'As cast', basis: 'min',
    rho: 7200, E: 100, G: 40, nu: 0.26, Sy: null, Su: 214, el: 0.5, hb: 210, k: 46, cp: 490, a: 10.5, melt: '~1150–1200', res: null,
    uses: 'Machine bases, engine blocks, brake discs, housings', corr: 'Moderate.', notes: 'Brittle: no defined yield; E varies with stress (≈ 90–113 GPa). Compressive strength ≈ 3–4× tensile.' }),

  // ── Stainless steels ───────────────────────────────────
  M({ id: 'ss-304', name: '304 Stainless Steel (annealed)', cat: 'Metals', sub: 'Stainless steels', cond: 'Annealed', basis: 'typical',
    rho: 8000, E: 193, G: 77, nu: 0.29, Sy: 215, Su: 505, el: 70, hb: 123, Sf: 240, k: 16.2, cp: 500, a: 17.3, melt: '1400–1455', res: 72,
    uses: 'Food equipment, architectural trim, tanks, fasteners, general corrosion-resistant parts', corr: 'Excellent general corrosion resistance; pitting risk in chlorides.', notes: 'Austenitic; work hardens strongly; non-magnetic when annealed.' }),
  M({ id: 'ss-316', name: '316 Stainless Steel (annealed)', cat: 'Metals', sub: 'Stainless steels', cond: 'Annealed', basis: 'typical',
    rho: 8000, E: 193, G: 77, nu: 0.3, Sy: 290, Su: 580, el: 50, hb: 149, k: 16.3, cp: 500, a: 15.9, melt: '1375–1400', res: 74,
    uses: 'Marine hardware, chemical/pharma process equipment, medical devices', corr: 'Better chloride/pitting resistance than 304 (Mo addition).', notes: 'ASTM A240 minima: Sy 205 MPa, Su 515 MPa.' }),

  // ── Titanium ───────────────────────────────────────────
  M({ id: 'ti-6al4v', name: 'Ti-6Al-4V (Grade 5, annealed)', cat: 'Metals', sub: 'Titanium alloys', cond: 'Annealed', basis: 'typical',
    rho: 4430, E: 113.8, G: 44, nu: 0.342, Sy: 880, Su: 950, el: 14, hb: 334, Sf: 510, k: 6.7, cp: 526, a: 8.6, melt: '1604–1660', res: 178,
    uses: 'Aerospace structure, turbine parts, medical implants, high-performance fasteners', corr: 'Excellent, including seawater.', notes: 'Fatigue value: unnotched, 10⁷ cycles, typical.' }),
  M({ id: 'ti-gr2', name: 'Titanium Grade 2 (CP)', cat: 'Metals', sub: 'Titanium alloys', cond: 'Annealed', basis: 'min',
    rho: 4510, E: 105, G: 45, nu: 0.37, Sy: 275, Su: 345, el: 20, hb: 160, k: 16.4, cp: 523, a: 8.6, melt: '~1665', res: 53,
    uses: 'Chemical process equipment, heat exchangers, marine', corr: 'Outstanding.', notes: 'ASTM B265 minimums.' }),

  // ── Copper alloys, Mg, Ni ──────────────────────────────
  M({ id: 'cu-c11000', name: 'Copper C11000 (ETP, annealed)', cat: 'Metals', sub: 'Copper alloys', cond: 'Annealed (O60)', basis: 'typical',
    rho: 8890, E: 115, G: 44, nu: 0.31, Sy: 69, Su: 220, el: 45, hb: 45, k: 388, cp: 385, a: 17, melt: '1065–1083', res: 1.71,
    uses: 'Busbars, electrical conductors, heat exchangers', corr: 'Good; forms patina.', notes: '≈ 100 % IACS conductivity.' }),
  M({ id: 'cu-c26000', name: 'Cartridge Brass C26000 (annealed)', cat: 'Metals', sub: 'Copper alloys', cond: 'Annealed', basis: 'typical',
    rho: 8530, E: 110, G: 41, nu: 0.375, Sy: 75, Su: 300, el: 68, hb: 60, k: 120, cp: 375, a: 20, melt: '915–955', res: 6.2,
    uses: 'Ammunition cases, radiator cores, hardware, deep-drawn parts', corr: 'Good; dezincification risk in some waters.', notes: '70Cu–30Zn.' }),
  M({ id: 'cu-c51000', name: 'Phosphor Bronze C51000 (annealed)', cat: 'Metals', sub: 'Copper alloys', cond: 'Annealed', basis: 'typical',
    rho: 8860, E: 110, G: 41, nu: 0.34, Sy: 130, Su: 340, el: 55, k: 84, cp: 380, a: 17.8, melt: '975–1060', res: 11.5,
    uses: 'Springs, bushings, electrical contacts, bellows', corr: 'Very good.', notes: 'Spring tempers reach Su > 700 MPa.' }),
  M({ id: 'mg-az31b', name: 'Magnesium AZ31B (H24 sheet)', cat: 'Metals', sub: 'Magnesium alloys', cond: 'H24', basis: 'typical',
    rho: 1770, E: 45, G: 17, nu: 0.35, Sy: 200, Su: 260, el: 15, hb: 73, k: 96, cp: 1000, a: 26, melt: '605–630', res: 9.2,
    uses: 'Lightweight housings, laptop cases, automotive panels', corr: 'Poor — requires coating; galvanic corrosion risk.', notes: 'Machining chips are flammable.' }),
  M({ id: 'ni-718', name: 'Inconel 718 (solution + aged)', cat: 'Metals', sub: 'Nickel alloys', cond: 'Precipitation hardened', basis: 'typical',
    rho: 8190, E: 200, G: 77, nu: 0.29, Sy: 1030, Su: 1240, el: 12, hb: 363, k: 11.4, cp: 435, a: 13, melt: '1260–1336', res: 125,
    uses: 'Gas turbine discs and casings, rocket engines, high-temperature fasteners', corr: 'Excellent, including oxidation to ~700 °C.', notes: 'Retains strength to ~650 °C.' }),

  // ── Polymers ───────────────────────────────────────────
  M({ id: 'p-abs', name: 'ABS (general purpose)', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Injection moulded', basis: 'typical',
    rho: 1050, E: 2.3, nu: 0.35, Sy: 40, Su: 43, el: 20, k: 0.17, cp: 1400, a: 90, melt: 'Tg ≈ 105', res: null,
    uses: 'Housings, consumer products, 3D printing', corr: 'Poor solvent resistance; UV degrades.', notes: 'Properties are temperature and rate dependent.' }),
  M({ id: 'p-pla', name: 'PLA', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Moulded / dense print', basis: 'typical',
    rho: 1240, E: 3.5, nu: 0.36, Sy: 55, Su: 60, el: 6, k: 0.13, cp: 1800, a: 68, melt: 'Tg ≈ 60, Tm ≈ 150–160', res: null,
    uses: 'Prototyping, 3D printing, packaging', corr: 'Biodegradable under industrial composting.', notes: 'FDM parts are anisotropic: z-direction strength can be 50 % lower.' }),
  M({ id: 'p-petg', name: 'PETG', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Moulded', basis: 'typical',
    rho: 1270, E: 2.1, nu: 0.38, Sy: 50, Su: 53, el: 100, k: 0.2, cp: 1200, a: 68, melt: 'Tg ≈ 80', res: null,
    uses: 'Food containers, guards, 3D printing', corr: 'Good chemical resistance.', notes: '' }),
  M({ id: 'p-pa66', name: 'Nylon 6/6 (dry as moulded)', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Dry as moulded', basis: 'typical',
    rho: 1140, E: 2.9, nu: 0.39, Sy: 82, Su: 82, el: 60, k: 0.25, cp: 1670, a: 80, melt: 'Tm ≈ 260', res: null,
    uses: 'Gears, bearings, cable ties, structural clips', corr: 'Absorbs moisture (up to ~8 %), lowering stiffness and strength.', notes: 'Conditioned (50 % RH) E ≈ 1.2–1.7 GPa.' }),
  M({ id: 'p-pc', name: 'Polycarbonate', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Moulded', basis: 'typical',
    rho: 1200, E: 2.4, nu: 0.37, Sy: 62, Su: 65, el: 110, k: 0.2, cp: 1200, a: 65, melt: 'Tg ≈ 147', res: null,
    uses: 'Glazing, guards, lenses, helmets', corr: 'Attacked by some solvents; stress cracking.', notes: 'Very high impact toughness.' }),
  M({ id: 'p-hdpe', name: 'HDPE', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Moulded', basis: 'typical',
    rho: 950, E: 1.0, nu: 0.46, Sy: 26, Su: 30, el: 500, k: 0.48, cp: 1900, a: 120, melt: 'Tm ≈ 130', res: null,
    uses: 'Pipes, tanks, cutting boards, liners', corr: 'Excellent chemical resistance.', notes: 'Significant creep under sustained load.' }),
  M({ id: 'p-pvc', name: 'PVC (rigid, unplasticised)', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Extruded', basis: 'typical',
    rho: 1400, E: 3.0, nu: 0.38, Sy: 50, Su: 52, el: 40, k: 0.19, cp: 1000, a: 55, melt: 'Tg ≈ 80', res: null,
    uses: 'Pipes, window frames, ducts', corr: 'Good chemical resistance.', notes: 'Brittle at low temperature.' }),
  M({ id: 'p-peek', name: 'PEEK (unfilled)', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Moulded', basis: 'typical',
    rho: 1300, E: 3.6, nu: 0.4, Sy: 100, Su: 100, el: 30, k: 0.25, cp: 1340, a: 47, melt: 'Tg ≈ 143, Tm ≈ 343', res: null,
    uses: 'Aerospace, medical, high-temperature bearings and seals', corr: 'Outstanding chemical resistance.', notes: 'Continuous service to ~250 °C.' }),
  M({ id: 'p-ptfe', name: 'PTFE', cat: 'Polymers', sub: 'Thermoplastics', cond: 'Sintered', basis: 'typical',
    rho: 2200, E: 0.5, nu: 0.46, Sy: 12, Su: 25, el: 300, k: 0.25, cp: 1000, a: 125, melt: 'Tm ≈ 327', res: null,
    uses: 'Seals, low-friction bearings, chemical linings', corr: 'Inert to almost all chemicals.', notes: 'Cold flow (creep) is significant.' }),

  // ── Composites (fibre-direction / quasi-isotropic) ─────
  M({ id: 'c-cfrp-ud', name: 'CFRP, unidirectional (0°, standard-modulus)', cat: 'Composites', sub: 'Fibre-reinforced polymers', cond: 'T300/T700-class fibre, epoxy, Vf ≈ 60 %', basis: 'typical',
    rho: 1600, E: 135, G: 5, nu: 0.3, Sy: null, Su: 1500, el: 1.2, k: 5, cp: 1000, a: 0.5, melt: 'Epoxy Tg ≈ 120–180', res: null,
    uses: 'Aerospace spars, bike frames, motorsport', corr: 'Galvanic corrosion with aluminium — isolate.', notes: 'Strongly anisotropic. Transverse E ≈ 9 GPa and strength ≈ 50 MPa. G is in-plane shear modulus.' }),
  M({ id: 'c-cfrp-qi', name: 'CFRP, quasi-isotropic laminate', cat: 'Composites', sub: 'Fibre-reinforced polymers', cond: '[0/±45/90]s, epoxy', basis: 'typical',
    rho: 1600, E: 50, G: 19, nu: 0.3, Sy: null, Su: 600, el: 1.2, k: 3, cp: 1000, a: 2, melt: '—', res: null,
    uses: 'Panels, housings, general CFRP parts', corr: 'Galvanic corrosion with aluminium — isolate.', notes: 'In-plane properties; through-thickness much lower.' }),
  M({ id: 'c-gfrp-ud', name: 'GFRP, unidirectional (E-glass/epoxy)', cat: 'Composites', sub: 'Fibre-reinforced polymers', cond: 'Vf ≈ 55–60 %', basis: 'typical',
    rho: 2000, E: 40, G: 4, nu: 0.28, Sy: null, Su: 1000, el: 2.5, k: 0.4, cp: 900, a: 6, melt: '—', res: null,
    uses: 'Wind turbine blades, boat hulls, leaf springs', corr: 'Good.', notes: 'Anisotropic; fatigue and moisture sensitive.' }),
  M({ id: 'c-kevlar-ud', name: 'Aramid (Kevlar 49)/epoxy, unidirectional', cat: 'Composites', sub: 'Fibre-reinforced polymers', cond: 'Vf ≈ 60 %', basis: 'typical',
    rho: 1380, E: 76, G: 2.1, nu: 0.34, Sy: null, Su: 1380, el: 1.8, k: 0.5, cp: 1100, a: -2, melt: '—', res: null,
    uses: 'Ballistic panels, pressure vessels, ropes', corr: 'UV sensitive.', notes: 'Poor compressive strength (≈ 280 MPa).' }),

  // ── Construction & ceramics ────────────────────────────
  M({ id: 'con-c30', name: 'Concrete C30/37', cat: 'Engineering materials', sub: 'Construction', cond: '28-day, normal-weight', basis: 'typical',
    rho: 2400, E: 33, G: 13.7, nu: 0.2, Sy: null, Su: 2.9, el: 0.01, k: 1.7, cp: 880, a: 10, melt: '—', res: null,
    uses: 'Structural concrete', corr: 'Reinforcement corrosion is the durability driver.', notes: 'Su here = mean tensile strength (f_ctm). Characteristic compressive strength f_ck = 30 MPa (cylinder). E = E_cm per EN 1992-1-1.' }),
  M({ id: 'glass-soda', name: 'Soda-lime glass', cat: 'Engineering materials', sub: 'Ceramics & glasses', cond: 'Annealed', basis: 'typical',
    rho: 2500, E: 70, G: 29, nu: 0.22, Sy: null, Su: 45, el: 0, k: 1.0, cp: 840, a: 9, melt: 'softening ≈ 720', res: null,
    uses: 'Windows, containers', corr: 'Excellent.', notes: 'Strength is flaw-controlled and statistical; design strengths are much lower. Tempered glass ≈ 4× stronger.' }),
  M({ id: 'cer-al2o3', name: 'Alumina (99.5 % Al₂O₃)', cat: 'Engineering materials', sub: 'Ceramics & glasses', cond: 'Sintered', basis: 'typical',
    rho: 3890, E: 370, G: 152, nu: 0.22, Sy: null, Su: 380, el: 0, k: 35, cp: 880, a: 8.1, melt: '2072', res: null,
    uses: 'Wear parts, insulators, substrates, armour', corr: 'Inert.', notes: 'Su = flexural strength; compressive strength ≈ 2600 MPa. Fracture toughness ≈ 4 MPa·√m.' }),
  M({ id: 'wood-df', name: 'Douglas fir (along grain, 12 % MC)', cat: 'Engineering materials', sub: 'Timber', cond: 'Clear, air-dry', basis: 'typical',
    rho: 530, E: 13.4, G: 0.8, nu: 0.29, Sy: null, Su: 85, el: 0, k: 0.12, cp: 1700, a: 4, melt: '—', res: null,
    uses: 'Framing, beams, plywood', corr: 'Rot and insects if wet.', notes: 'Su = modulus of rupture (clear specimens, USDA Wood Handbook). Grade and moisture strongly affect values.' }),
];

// Property metadata for display and comparison.
export const PROPS = [
  { k: 'rho', label: 'Density', sym: '\\rho', unit: 'kg/m³', dim: 'density', f: 1 },
  { k: 'E', label: "Young's modulus", sym: 'E', unit: 'GPa', dim: 'pressure', f: 1e9 },
  { k: 'G', label: 'Shear modulus', sym: 'G', unit: 'GPa', dim: 'pressure', f: 1e9 },
  { k: 'nu', label: "Poisson's ratio", sym: '\\nu', unit: '—', dim: 'none', f: 1 },
  { k: 'Sy', label: 'Yield strength', sym: 'S_y', unit: 'MPa', dim: 'pressure', f: 1e6 },
  { k: 'Su', label: 'Tensile strength', sym: 'S_u', unit: 'MPa', dim: 'pressure', f: 1e6 },
  { k: 'el', label: 'Elongation at break', sym: 'A', unit: '%', dim: 'none', f: 1 },
  { k: 'hb', label: 'Hardness (Brinell)', sym: 'HB', unit: 'HB', dim: 'none', f: 1 },
  { k: 'Sf', label: 'Fatigue strength', sym: 'S_f', unit: 'MPa', dim: 'pressure', f: 1e6 },
  { k: 'k', label: 'Thermal conductivity', sym: 'k', unit: 'W/(m·K)', dim: 'thermcond', f: 1 },
  { k: 'cp', label: 'Specific heat', sym: 'c_p', unit: 'J/(kg·K)', dim: 'specheat', f: 1 },
  { k: 'a', label: 'Thermal expansion', sym: '\\alpha', unit: 'µm/(m·K)', dim: 'expansion', f: 1e-6 },
  { k: 'res', label: 'Electrical resistivity', sym: '\\rho_e', unit: 'µΩ·cm', dim: 'resistivity', f: 1e-8 },
];

export const DERIVED = [
  { k: 'specStr', label: 'Specific strength (Sy or Su)/ρ', unit: 'kN·m/kg', f: m => ((m.Sy ?? m.Su) * 1e6 / m.rho) / 1e3 },
  { k: 'specStiff', label: 'Specific stiffness E/ρ', unit: 'MN·m/kg', f: m => (m.E * 1e9 / m.rho) / 1e6 },
  { k: 'beamStiff', label: 'Light stiff beam index E^½/ρ', unit: '(Pa^½)/(kg/m³)', f: m => Math.sqrt(m.E * 1e9) / m.rho },
  { k: 'thermDiff', label: 'Thermal diffusivity k/(ρc_p)', unit: 'mm²/s', f: m => m.k / (m.rho * m.cp) * 1e6 },
];

export function getMaterial(id) { return MATERIALS.find(m => m.id === id); }

// SI view of a material (Pa, 1/K, Ω·m …) for use in calculators.
export function materialSI(id) {
  const m = getMaterial(id);
  if (!m) return null;
  const out = { ...m };
  PROPS.forEach(p => { if (m[p.k] != null) out[p.k] = m[p.k] * p.f; });
  return out;
}
