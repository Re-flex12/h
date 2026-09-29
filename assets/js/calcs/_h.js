// Helpers for writing calculator definitions compactly.
// Input:  I(key, label, texSymbol, dim, defaultSI, extra)
// Output: O(key, label, texSymbol, dim, extra)
// extra fields: u:{si,metric,imperial} preferred units · adv:true (advanced mode only) · showIf(v) ·
//   type:'number'|'select'|'material'|'fluid'|'gas'|'roughness'|'list'|'text' · options:[[value,label]] ·
//   fill:{inputKey: propKey} (for material/fluid/gas pickers) · min/max · hint
import { MATERIALS, materialSI } from '../data/materials.js';
import { FLUIDS, GASES, ROUGHNESS } from '../data/fluids.js';

export const I = (k, label, sym, dim, def, x = {}) => ({ k, label, sym, dim, def, type: 'number', ...x });
export const O = (k, label, sym, dim, x = {}) => ({ k, label, sym, dim, ...x });
export const SEL = (k, label, options, def, x = {}) => ({ k, label, type: 'select', options, def: def ?? options[0][0], dim: 'none', ...x });

export const MAT = (k, fill, def, x = {}) => ({ k, label: 'Material', type: 'material', fill, def, dim: 'none', ...x });
export const FLU = (k, fill, def = 'water20', x = {}) => ({ k, label: 'Fluid', type: 'fluid', fill, def, dim: 'none', ...x });
export const GAS = (k, fill, def = 'air', x = {}) => ({ k, label: 'Gas', type: 'gas', fill, def, dim: 'none', ...x });

export function pickerOptions(type) {
  if (type === 'material') return MATERIALS.map(m => [m.id, m.name]);
  if (type === 'fluid') return FLUIDS.map(f => [f.id, f.name]);
  if (type === 'gas') return GASES.map(g => [g.id, g.name]);
  if (type === 'roughness') return ROUGHNESS.map(r => [r.id, `${r.name} (ε = ${r.eps} mm)`]);
  return [];
}
export function pickerRecord(type, id) {
  if (type === 'material') return materialSI(id);
  if (type === 'fluid') return FLUIDS.find(f => f.id === id);
  if (type === 'gas') { const g = GASES.find(x => x.id === id); return g && { ...g, cv: g.cp - g.R }; }
  if (type === 'roughness') { const r = ROUGHNESS.find(x => x.id === id); return r && { eps: r.eps * 1e-3 }; }
  return null;
}

export const PI = Math.PI;
export const g0 = 9.80665;
export const sq = x => x * x;
export const deg = x => x * 180 / Math.PI;
export const rad = x => x * Math.PI / 180;

export const check = (label, pass, detail = '') => ({ label, pass, detail });
