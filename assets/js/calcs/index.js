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
import engineering2 from './engineering2.js';
import science2 from './science2.js';
import steam from './steam.js';
import refrig from './refrig.js';
import steel from './steel.js';
import structural2 from './structural2.js';

export const CALCS = [...mechanical, ...structural, ...steel, ...structural2, ...fluids, ...thermo, ...steam, ...refrig, ...electrical, ...manufacturing, ...physics, ...quantum, ...relativity, ...engineering2, ...science2];
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
  controls: { code: 'CTL', name: 'Control Systems', section: 'engineering' },
  signals: { code: 'SIG', name: 'Signals & Systems', section: 'engineering' },
  chemical: { code: 'CHE', name: 'Chemical Engineering', section: 'engineering' },
  civil: { code: 'CIV', name: 'Civil & Geotechnical', section: 'engineering' },
  materials: { code: 'MAT', name: 'Materials Science', section: 'engineering' },
  robotics: { code: 'MTX', name: 'Mechatronics & Robotics', section: 'engineering' },
  vibrations: { code: 'VIB', name: 'Vibrations', section: 'engineering' },
  maths: { code: 'MTH', name: 'Mathematics & Statistics', section: 'maths' },
  quantum: { code: 'QM', name: 'Quantum Physics', section: 'quantum' },
  relativity: { code: 'REL', name: 'Relativity & Cosmology', section: 'quantum' },
};
