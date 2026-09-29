// Calculator registry.
import mechanical from './mechanical.js';
import structural from './structural.js';
import fluids from './fluids.js';
import thermo from './thermo.js';
import electrical from './electrical.js';
import manufacturing from './manufacturing.js';
import physics from './physics.js';
import quantum from './quantum.js';
import relativity from './relativity.js';

export const CALCS = [...mechanical, ...structural, ...fluids, ...thermo, ...electrical, ...manufacturing, ...physics, ...quantum, ...relativity];
export const CALC = Object.fromEntries(CALCS.map(c => [c.id, c]));

// Discipline metadata: code, name, section it belongs to.
export const DISCIPLINES = {
  mechanics: { code: 'MEC', name: 'Mechanics', section: 'physics' },
  waves: { code: 'WAV', name: 'Waves & Optics', section: 'physics' },
  nuclear: { code: 'NUC', name: 'Nuclear Physics', section: 'physics' },
  mechanical: { code: 'MED', name: 'Mechanical Design', section: 'engineering' },
  structural: { code: 'STR', name: 'Structural & Solid Mechanics', section: 'engineering' },
  fluids: { code: 'FLU', name: 'Fluid Mechanics', section: 'engineering' },
  thermo: { code: 'THM', name: 'Thermodynamics & Heat Transfer', section: 'engineering' },
  hvac: { code: 'HVC', name: 'HVAC & Refrigeration', section: 'engineering' },
  electrical: { code: 'ELE', name: 'Electrical & Electronic', section: 'engineering' },
  manufacturing: { code: 'MFG', name: 'Manufacturing', section: 'engineering' },
  energy: { code: 'NRG', name: 'Renewable & Energy', section: 'engineering' },
  quantum: { code: 'QM', name: 'Quantum Physics', section: 'quantum' },
  relativity: { code: 'REL', name: 'Relativity & Cosmology', section: 'quantum' },
};
