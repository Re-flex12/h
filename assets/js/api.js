// Public JavaScript API: window.PHYSENG — run any calculator, solve equations and convert units from the console
// or from another script on the page (including the single-file build).
import { CALCS, CALC } from './calcs/index.js';
import { pickerRecord } from './calcs/_h.js';
import { EQ, EQUATIONS } from './data/equations.js';
import { DIMS, convert, toSI, fromSI } from './core/units.js';
import { compile, solveRoot } from './core/expr.js';
import { MATERIALS, materialSI } from './data/materials.js';
import { CONSTANTS, C } from './data/constants.js';
import { solveBeam } from './solvers/beam-core.js';
import { solveTruss } from './solvers/truss-core.js';
import { solveCircuit, solvePipeNetwork, solveCycle } from './solvers/cores2.js';

export const API_VERSION = '1.0';

export function defaults(id) {
  const c = CALC[id];
  if (!c) throw new Error(`Unknown calculator "${id}"`);
  const v = Object.fromEntries(c.inputs.map(i => [i.k, i.def]));
  c.inputs.filter(i => i.fill).forEach(i => { const r = pickerRecord(i.type, i.def); if (r) Object.entries(i.fill).forEach(([k, p]) => { if (r[p] != null) v[k] = r[p]; }); });
  return v;
}

export function run(id, inputs = {}) {
  const c = CALC[id], v = defaults(id);
  c.inputs.filter(i => i.fill && inputs[i.k]).forEach(i => { const r = pickerRecord(i.type, inputs[i.k]); if (r) Object.entries(i.fill).forEach(([k, p]) => { if (r[p] != null) v[k] = r[p]; }); });
  Object.assign(v, inputs);
  const r = c.compute(v);
  const outputs = Object.fromEntries(c.outputs.map(o => [o.k, r[o.k]]));
  return { calculator: id, inputs: v, outputs, warnings: r._warn || [], checks: r._checks || [], units: 'SI' };
}

export function solve(eqId, known, unknown) {
  const e = EQ[eqId];
  if (!e?.f) throw new Error(`Equation "${eqId}" is not numerically solvable`);
  const c = compile(e.f), start = e.v.find(x => x[0] === unknown)?.[4] ?? 1;
  return solveRoot(x => c.f({ ...known, [unknown]: x }), start);
}

export const PHYSENG = {
  version: API_VERSION,
  calculators: () => CALCS.map(c => ({ id: c.id, title: c.title, discipline: c.disc, inputs: c.inputs.map(i => ({ key: i.k, label: i.label, dim: i.dim, type: i.type, default: i.def })), outputs: c.outputs.map(o => ({ key: o.k, label: o.label, dim: o.dim })) })),
  defaults, run, solve,
  equations: () => EQUATIONS.map(e => ({ id: e.id, name: e.name, tex: e.tex, variables: e.v.map(v => ({ key: v[0], label: v[1], dim: v[2] })) })),
  convert, toSI, fromSI, dimensions: () => Object.fromEntries(Object.entries(DIMS).map(([k, d]) => [k, Object.keys(d.units)])),
  material: id => materialSI(id), materials: () => MATERIALS.map(m => ({ id: m.id, name: m.name })),
  constants: C, constantsTable: CONSTANTS,
  solvers: { beam: solveBeam, truss: solveTruss, circuit: solveCircuit, pipeNetwork: solvePipeNetwork, cycle: solveCycle },
};
