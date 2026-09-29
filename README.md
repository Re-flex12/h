# PHYSENG — Physics & Engineering Toolkit

**Learn it → Calculate it → Simulate it → Apply it.** One platform for school students, engineering students and working engineers.

Static site, no build step: plain ES modules plus KaTeX (from a CDN) for maths rendering.

```bash
npm run serve      # python3 -m http.server 8080  → http://localhost:8080
npm test           # node --test: calculators, solvers, units, equations, validation cases
```

## What's in V1

| Area | Contents |
|---|---|
| **Calculators** | 112 calculators across mechanics, mechanical design, structural/solid mechanics, fluids, thermodynamics, HVAC, electrical, manufacturing, energy, waves/optics, nuclear, **quantum** and **relativity/cosmology**. Each one has basic/advanced modes, per-field units (SI / metric-engineering / imperial), material/fluid/gas pickers, stated equations, assumptions, limitations, sources, pass/fail checks, a share link, save-to-project, and a printable calculation sheet (PDF). |
| **Solvers** | Beam solver: drag-and-drop supports and loads; pin/roller/fixed supports; point, distributed/triangular and couple loads; handles indeterminate beams; outputs reactions, SFD, BMD, deflection and stress. Truss solver: direct stiffness method with draggable nodes. |
| **Simulations** | Projectile with drag (RK4), non-linear pendulum and phase portrait, double slit with photon-by-photon build-up, wavefunction explorer (box and QHO superpositions), Minkowski diagram, Schwarzschild black-hole orbits. |
| **Quantum & Relativity** | A separate top-level section with its own calculator library, lessons, simulations and topic map (QM, atomic, quantum information, SR, GR, black holes, gravitational waves, cosmology, particle physics, QFT). |
| **Reference** | Equation library (113 equations, each solvable for any variable), CODATA constants, materials database with basis/condition, a comparison view with an Ashby-style chart, water/air/fluid/gas tables, IAPWS-IF97 saturation, ISO threads, bolt classes, NPS pipe, K-factors, and a standards guide. |
| **Tools** | Unit converter (40+ quantities), equation solver (library equations or your own), graphing, CSV data analysis/regression, uncertainty propagation (GUM plus Monte Carlo), dimensional analysis. |
| **Learn** | Lessons whose depth adapts to the selected level (School / University / Professional), with worked examples, marked questions, hints, solutions and progress tracking. |
| **Workspace** | Projects, calculation history, favourites, notes, JSON import/export (stored in the browser). |
| **Search** | Global search (`/` or Ctrl+K) over ~1,500 items. It also recognises typed equations such as `E=mc2`, `PV=nRT` or `FL^3/48EI`. |
| **Content map** | All 1,085 topics from the full site spec. Linked items open live tools; the rest are marked as planned. |

## Reliability

- All calculations run in coherent SI. Temperatures and temperature differences are separate quantities.
- `assets/js/data/validation.js` holds reference cases (IAPWS-IF97 verification values, ICAO atmosphere, ISO 898-1, ISO 286, Roark, Ashby GPS, Planck ΛCDM, etc.). They run in `npm test` and show on each calculator as a "Validated" record.
- The beam and truss solvers are tested against closed-form determinate and indeterminate cases.
- Materials data are representative handbook values, labelled *typical* or *spec minimum*. They are **not design allowables**. Results are not certified engineering analysis.

## Layout

```
index.html                 app shell
assets/css/main.css        design system (dark "oscilloscope" / light "blueprint")
assets/js/app.js           router, settings
assets/js/search.js        global search and equation recognition
assets/js/core/            units, expression parser/solver, plotting, storage, formatting
assets/js/calcs/           calculator definitions by discipline
assets/js/solvers/         beam and truss cores (pure, tested)
assets/js/data/            taxonomy (content map), equations, materials, fluids, constants, lessons, reference, validation
assets/js/pages/           page renderers
tests/                     node:test suites
```

## Roadmap

Accounts and sync, circuit / pipe-network / cycle / PID solvers, full IF97 steam properties, exam-board question sets, a larger materials library, and an API.
