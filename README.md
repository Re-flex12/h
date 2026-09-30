# PHYSENG — Physics & Engineering Toolkit

**Learn it → Calculate it → Simulate it → Apply it.** One platform for school students, engineering students and working engineers.

Static site, no build step: plain ES modules plus KaTeX (from a CDN) for maths rendering.

```bash
npm run serve      # python3 -m http.server 8080  → http://localhost:8080
npm test           # node --test: calculators, solvers, units, equations, validation cases
npm install && npm run build   # → dist/physeng.html — the whole site in ONE self-contained file
```

`dist/physeng.html` bundles all JS, CSS, data and KaTeX (fonts embedded). Open it straight from disk or host it anywhere; it works offline (only the optional web fonts need a connection).

## What's included

| Area | Contents |
|---|---|
| **Calculators** | 168 calculators across mechanics, mechanical design, structural (incl. EN 1993 steel beam/column checks, EN 1992 RC beams, EN 1990 load combinations), fluids, thermodynamics, steam, HVAC & refrigeration, electrical, manufacturing, energy, controls, signals, chemical, civil/geotechnical, materials, robotics, vibrations, maths & statistics, waves/optics, nuclear, **quantum** and **relativity/cosmology**. Each has basic/advanced modes, per-field units (SI / metric-engineering / imperial), material/fluid/gas pickers, stated equations, assumptions, limitations, sources, pass/fail checks, a share link, save-to-project (with versioning) and a printable calculation sheet. |
| **Solvers** | Beam (any supports and loads, indeterminate), truss (direct stiffness), circuit (DC + AC phasor MNA, frequency sweep), pipe network (loops, pumps, Colebrook), drive train (gears, belts, chains, worms, planetaries), thermodynamic cycles (Otto, Diesel, Dual, Brayton, Carnot, Stirling), MDOF vibration (modes + FRF), heat exchangers (ε-NTU/LMTD) and PID. |
| **Simulations** | 26: projectile, pendulum, collisions, waves, optics, electric fields, magnetic fields of currents, RLC phasors, Kepler orbits, heat conduction, tensile test, flow past a cylinder (Magnus), gear train, Doppler/Mach cone, double slit, wavefunctions, tunnelling wave packet, hydrogen orbitals, Stern–Gerlach, Minkowski diagram, light clock, black-hole orbits, accretion disk, gravitational lensing, gravitational waves and the expanding universe. |
| **Quantum & Relativity** | A separate top-level section with its own calculators, lessons, simulations, a quantum-circuit simulator and topic map (QM, atomic, quantum information, SR, GR, black holes, gravitational waves, cosmology, particle physics). |
| **Reference** | Equation library (113 equations, each solvable for any variable); CODATA constants; 58-material database with a comparison/Ashby view; fluid and gas tables; **full IAPWS-IF97 steam tables** (Regions 1–5, T–s / Mollier / p–h charts); **refrigerant tables** for 11 refrigerants (from reference equations of state); **IPE/HEA/HEB steel sections**; ISO threads, bolt classes, NPS pipe, K-factors; a standards guide; and the JavaScript API. |
| **Tools** | Unit converter, equation solver, graphing, CSV data analysis/regression, uncertainty propagation (GUM + Monte Carlo), dimensional analysis, FFT, matrix calculator, numerical methods, psychrometric chart, quantum circuits, and "Ask" (plain-English questions routed to the right calculator). |
| **Learn** | 23 lessons, 61 topic guides (depth adapts to School / University / Professional), 12 **lab guides** with a live data table, least-squares fit and uncertainty, 6 timed **exam-style papers** (GCSE, A-level, IB, university) with mark schemes, a question bank, formula drills, timed quizzes, flashcards and progress tracking. |
| **Workspace** | Projects, calculation history with **revisions and diffs**, favourites, notes, project summaries, JSON import/export (stored in the browser). |
| **Accounts** | Optional sign-up and sign-in with Supabase Auth: email confirmation, password reset, profile (name, role), Terms of Service and Privacy Policy acceptance recorded per version (with a re-acceptance prompt when they change), and self-service account deletion. Signed-in users' projects **sync across devices** (last edit wins, deletions propagate, the database refuses stale overwrites); projects made while signed out stay in the browser until you choose to upload them. Setup: [SUPABASE.md](SUPABASE.md). |
| **Search** | Global search (`/` or Ctrl+K). It also recognises typed equations such as `E=mc2`, `PV=nRT` or `FL^3/48EI`. |
| **Topic guides** | 61 explainers for core physics (motion, forces, rotation, gravity, electricity, magnetism, waves, thermal, nuclear) and maths (arithmetic to vector calculus, Laplace transforms and hypothesis testing), each with key equations, a worked example, a self-check and linked tools. |
| **Content map** | 706 topics; every one links to a live lesson, topic guide, calculator, simulation, solver or reference page. |

## Reliability

- All calculations run in coherent SI. Temperatures and temperature differences are separate quantities.
- `assets/js/data/validation.js` holds reference cases, which run in `npm test` and show on each calculator as a "Validated" record. Sources include: IAPWS-IF97 verification tables (all regions), ICAO atmosphere, ISO 898-1, ISO 286, Roark, Çengel textbook cycles, CoolProp refrigerant cycles, ArcelorMittal section tables, NCCI M_cr, EN 1990/1992 hand calculations and Planck ΛCDM.
- Steam properties agree with the IAPWS verification values to ≤ 1e-8. Refrigerant tables are generated from CoolProp reference equations of state, with interpolation error < 0.5 kJ/kg.
- The solvers are tested against closed-form determinate and indeterminate cases.
- Materials data are representative handbook values, labelled *typical* or *spec minimum*. They are **not design allowables**. Code checks are simplified preliminary-design aids. Results are not certified engineering analysis.

## Layout

```
index.html                 app shell
assets/css/main.css        design system (dark "oscilloscope" / light "blueprint")
assets/js/app.js           router, settings, account button
assets/js/config.js        Supabase URL/anon key, Terms version, legal details
assets/vendor/supabase.js  supabase-js UMD build (MIT)
supabase/schema.sql        profiles table, RLS, Terms-enforcing sign-up trigger, delete_user()
assets/js/api.js           window.PHYSENG scripting API
assets/js/search.js        global search and equation recognition
assets/js/core/            units, expression parser/solver, numerics, plotting, storage, formatting
assets/js/calcs/           calculator definitions by discipline
assets/js/solvers/         beam, truss, circuit, pipe-network, cycle, vibration and drive cores (pure, tested)
assets/js/data/            taxonomy, equations, materials, fluids, IF97, refrigerants, steel sections, constants, lessons, labs, papers, validation
assets/js/pages/           page renderers (sections, calculators, solvers, sims, tools, learn, labs, practice, reference, workspace)
scripts/build-single.mjs   single-file build
tests/                     node:test suites
```

## Coming next

Syncing calculation history and learning progress to accounts, and team projects. Until then, projects move between people and devices through JSON export/import or share links.
