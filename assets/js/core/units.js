// Unit system. Every quantity is stored and computed internally in coherent SI.
// Each dimension lists units as factor-to-SI (value_SI = value * factor), except
// temperature which carries an offset (value_SI = (value + offset) * factor).

const IN = 0.0254, FT = 0.3048, LB = 0.45359237, LBF = 4.4482216152605, G0 = 9.80665;
const PSI = LBF / (IN * IN);

export const DIMS = {
  none: { name: 'Dimensionless', units: { '': 1, '%': 0.01 } },
  length: { name: 'Length', units: { m: 1, mm: 1e-3, cm: 1e-2, km: 1e3, 'µm': 1e-6, nm: 1e-9, pm: 1e-12, in: IN, ft: FT, yd: 0.9144, mi: 1609.344, 'nmi': 1852, AU: 149597870700, ly: 9.4607304725808e15, pc: 3.0856775814913673e16, Mpc: 3.0856775814913673e22 } },
  area: { name: 'Area', units: { 'm²': 1, 'mm²': 1e-6, 'cm²': 1e-4, 'km²': 1e6, ha: 1e4, 'in²': IN * IN, 'ft²': FT * FT } },
  volume: { name: 'Volume', units: { 'm³': 1, L: 1e-3, mL: 1e-6, 'cm³': 1e-6, 'mm³': 1e-9, 'in³': IN ** 3, 'ft³': FT ** 3, 'gal (US)': 3.785411784e-3, 'gal (UK)': 4.54609e-3 } },
  mass: { name: 'Mass', units: { kg: 1, g: 1e-3, mg: 1e-6, t: 1e3, lb: LB, oz: LB / 16, slug: LBF / FT, u: 1.66053906660e-27, 'MeV/c²': 1.78266192e-30, 'M☉': 1.98847e30, 'M⊕': 5.9722e24 } },
  time: { name: 'Time', units: { s: 1, ms: 1e-3, 'µs': 1e-6, ns: 1e-9, min: 60, h: 3600, day: 86400, yr: 31557600, Gyr: 31557600e9 } },
  frequency: { name: 'Frequency', units: { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, THz: 1e12, 'rpm (rev/min)': 1 / 60 } },
  angvel: { name: 'Angular velocity', units: { 'rad/s': 1, rpm: 2 * Math.PI / 60, 'deg/s': Math.PI / 180, 'rev/s': 2 * Math.PI } },
  angaccel: { name: 'Angular acceleration', units: { 'rad/s²': 1, 'deg/s²': Math.PI / 180 } },
  angle: { name: 'Angle', units: { deg: Math.PI / 180, rad: 1, rev: 2 * Math.PI, grad: Math.PI / 200 } },
  velocity: { name: 'Velocity', units: { 'm/s': 1, 'km/h': 1 / 3.6, 'mm/s': 1e-3, 'm/min': 1 / 60, 'ft/s': FT, 'ft/min': FT / 60, mph: 0.44704, kn: 1852 / 3600, 'km/s': 1e3, c: 299792458 } },
  accel: { name: 'Acceleration', units: { 'm/s²': 1, g: G0, 'ft/s²': FT, 'mm/s²': 1e-3 } },
  force: { name: 'Force', units: { N: 1, kN: 1e3, MN: 1e6, mN: 1e-3, lbf: LBF, kip: 1000 * LBF, kgf: G0, dyn: 1e-5 } },
  pressure: { name: 'Pressure / stress', units: { Pa: 1, kPa: 1e3, MPa: 1e6, GPa: 1e9, 'N/mm²': 1e6, bar: 1e5, mbar: 100, atm: 101325, psi: PSI, ksi: 1000 * PSI, Msi: 1e6 * PSI, psf: LBF / (FT * FT), mmHg: 133.322387415, torr: 101325 / 760, inHg: 3386.389, 'mH₂O': 9806.65, 'inH₂O': 249.08891 } },
  energy: { name: 'Energy', units: { J: 1, kJ: 1e3, MJ: 1e6, GJ: 1e9, mJ: 1e-3, Wh: 3600, kWh: 3.6e6, MWh: 3.6e9, GWh: 3.6e12, cal: 4.184, kcal: 4184, BTU: 1055.05585262, 'ft·lbf': FT * LBF, eV: 1.602176634e-19, keV: 1.602176634e-16, MeV: 1.602176634e-13, GeV: 1.602176634e-10, erg: 1e-7 } },
  power: { name: 'Power', units: { W: 1, kW: 1e3, MW: 1e6, GW: 1e9, mW: 1e-3, hp: 745.69987158227, PS: 735.49875, 'BTU/h': 0.29307107017, 'TR (refrig. ton)': 3516.8528420667, 'ft·lbf/s': FT * LBF } },
  torque: { name: 'Torque / moment', units: { 'N·m': 1, 'kN·m': 1e3, 'N·mm': 1e-3, 'MN·m': 1e6, 'lbf·ft': FT * LBF, 'lbf·in': IN * LBF, 'kip·ft': 1000 * FT * LBF, 'kgf·m': G0 } },
  density: { name: 'Density', units: { 'kg/m³': 1, 'g/cm³': 1000, 'kg/L': 1000, 'g/L': 1, 'lb/ft³': LB / FT ** 3, 'lb/in³': LB / IN ** 3, 'slug/ft³': (LBF / FT) / FT ** 3 } },
  temperature: { name: 'Temperature', units: { K: [1, 0], '°C': [1, 273.15], '°F': [5 / 9, 459.67], '°R': [5 / 9, 0] } },
  tempdiff: { name: 'Temperature difference', units: { K: 1, '°C': 1, '°F': 5 / 9, '°R': 5 / 9 } },
  dynvisc: { name: 'Dynamic viscosity', units: { 'Pa·s': 1, 'mPa·s': 1e-3, cP: 1e-3, P: 0.1, 'lbf·s/ft²': LBF / (FT * FT), 'lb/(ft·s)': LB / FT } },
  kinvisc: { name: 'Kinematic viscosity', units: { 'm²/s': 1, 'mm²/s': 1e-6, cSt: 1e-6, St: 1e-4, 'ft²/s': FT * FT } },
  flow: { name: 'Volumetric flow', units: { 'm³/s': 1, 'm³/h': 1 / 3600, 'L/s': 1e-3, 'L/min': 1e-3 / 60, 'gpm (US)': 3.785411784e-3 / 60, 'gpm (UK)': 4.54609e-3 / 60, cfm: FT ** 3 / 60, 'ft³/s': FT ** 3 } },
  massflow: { name: 'Mass flow', units: { 'kg/s': 1, 'kg/h': 1 / 3600, 'g/s': 1e-3, 't/h': 1 / 3.6, 'lb/s': LB, 'lb/h': LB / 3600 } },
  thermcond: { name: 'Thermal conductivity', units: { 'W/(m·K)': 1, 'BTU/(h·ft·°F)': 1.730734666 } },
  htc: { name: 'Heat transfer coefficient', units: { 'W/(m²·K)': 1, 'BTU/(h·ft²·°F)': 5.678263337 } },
  specheat: { name: 'Specific heat / entropy', units: { 'J/(kg·K)': 1, 'kJ/(kg·K)': 1e3, 'BTU/(lb·°F)': 4186.8 } },
  specenergy: { name: 'Specific energy / enthalpy', units: { 'J/kg': 1, 'kJ/kg': 1e3, 'MJ/kg': 1e6, 'BTU/lb': 2326 } },
  specvol: { name: 'Specific volume', units: { 'm³/kg': 1, 'L/kg': 1e-3, 'ft³/lb': FT ** 3 / LB } },
  heatflux: { name: 'Heat flux / irradiance', units: { 'W/m²': 1, 'kW/m²': 1e3, 'MW/m²': 1e6, 'W/cm²': 1e4, 'BTU/(h·ft²)': 3.15459075 } },
  thermres: { name: 'Thermal resistance', units: { 'K/W': 1, '°F·h/BTU': 1.895634 } },
  expansion: { name: 'Thermal expansion coeff.', units: { '1/K': 1, 'µm/(m·K)': 1e-6, '1/°F': 1.8 } },
  voltage: { name: 'Voltage', units: { V: 1, mV: 1e-3, 'µV': 1e-6, kV: 1e3, MV: 1e6 } },
  current: { name: 'Current', units: { A: 1, mA: 1e-3, 'µA': 1e-6, kA: 1e3 } },
  resistance: { name: 'Resistance', units: { 'Ω': 1, 'mΩ': 1e-3, 'kΩ': 1e3, 'MΩ': 1e6 } },
  capacitance: { name: 'Capacitance', units: { F: 1, mF: 1e-3, 'µF': 1e-6, nF: 1e-9, pF: 1e-12 } },
  inductance: { name: 'Inductance', units: { H: 1, mH: 1e-3, 'µH': 1e-6, nH: 1e-9 } },
  charge: { name: 'Charge', units: { C: 1, mC: 1e-3, 'µC': 1e-6, nC: 1e-9, e: 1.602176634e-19, Ah: 3600, mAh: 3.6 } },
  resistivity: { name: 'Resistivity', units: { 'Ω·m': 1, 'Ω·mm²/m': 1e-6, 'µΩ·cm': 1e-8, 'nΩ·m': 1e-9 } },
  apparent: { name: 'Apparent power', units: { VA: 1, kVA: 1e3, MVA: 1e6 } },
  reactive: { name: 'Reactive power', units: { var: 1, kvar: 1e3, Mvar: 1e6 } },
  bfield: { name: 'Magnetic flux density', units: { T: 1, mT: 1e-3, 'µT': 1e-6, nT: 1e-9, G: 1e-4 } },
  efield: { name: 'Electric field', units: { 'V/m': 1, 'kV/m': 1e3, 'V/mm': 1e3, 'MV/m': 1e6 } },
  amount: { name: 'Amount of substance', units: { mol: 1, kmol: 1e3, mmol: 1e-3 } },
  molarmass: { name: 'Molar mass', units: { 'kg/mol': 1, 'g/mol': 1e-3 } },
  momentum: { name: 'Momentum', units: { 'kg·m/s': 1, 'N·s': 1, 'eV/c': 1.602176634e-19 / 299792458, 'keV/c': 1.602176634e-16 / 299792458, 'MeV/c': 1.602176634e-13 / 299792458, 'GeV/c': 1.602176634e-10 / 299792458 } },
  inertia: { name: 'Mass moment of inertia', units: { 'kg·m²': 1, 'g·cm²': 1e-7, 'lb·ft²': LB * FT * FT, 'lb·in²': LB * IN * IN } },
  areamoment: { name: 'Second moment of area', units: { 'm⁴': 1, 'mm⁴': 1e-12, 'cm⁴': 1e-8, 'in⁴': IN ** 4 } },
  sectionmod: { name: 'Section modulus', units: { 'm³': 1, 'mm³': 1e-9, 'cm³': 1e-6, 'in³': IN ** 3 } },
  stiffness: { name: 'Stiffness / line load', units: { 'N/m': 1, 'N/mm': 1e3, 'kN/m': 1e3, 'kN/mm': 1e6, 'lbf/in': LBF / IN, 'lbf/ft': LBF / FT, 'kip/ft': 1000 * LBF / FT } },
  rotstiff: { name: 'Torsional stiffness', units: { 'N·m/rad': 1, 'N·m/deg': 180 / Math.PI, 'lbf·in/rad': IN * LBF } },
  activity: { name: 'Activity', units: { Bq: 1, kBq: 1e3, MBq: 1e6, GBq: 1e9, Ci: 3.7e10, mCi: 3.7e7 } },
  hubble: { name: 'Hubble parameter', units: { 'km/s/Mpc': 1e3 / 3.0856775814913673e22, '1/s': 1 } },
  entropy: { name: 'Entropy / heat capacity', units: { 'J/K': 1, 'kJ/K': 1e3, 'eV/K': 1.602176634e-19 } },
  spectral: { name: 'Spectral radiance', units: { 'W/(m²·sr·m)': 1, 'W/(m²·sr·nm)': 1e9 } },
  moldensity: { name: 'Number density', units: { '1/m³': 1, '1/cm³': 1e6 } },
  rate: { name: 'Rate', units: { '1/s': 1, '1/min': 1 / 60, '1/h': 1 / 3600, '1/day': 1 / 86400, '1/yr': 1 / 31557600 } },
  energydensity: { name: 'Energy density', units: { 'J/m³': 1, 'kJ/m³': 1e3, 'MJ/m³': 1e6 } },
  fuelcons: { name: 'Specific fuel consumption', units: { 'kg/J': 1, 'g/kWh': 1e-3 / 3.6e6, 'lb/(hp·h)': LB / (745.69987158227 * 3600) } },
  massperlen: { name: 'Mass per length', units: { 'kg/m': 1, 'g/m': 1e-3, 'lb/ft': LB / FT } },
};

// Default unit per dimension for each unit system.
export const SYSTEMS = {
  si: {},
  metric: {
    length: 'mm', area: 'mm²', volume: 'L', force: 'kN', pressure: 'MPa', torque: 'N·m', temperature: '°C', tempdiff: '°C',
    energy: 'kJ', power: 'kW', flow: 'L/min', dynvisc: 'mPa·s', kinvisc: 'cSt', areamoment: 'mm⁴', sectionmod: 'mm³',
    angvel: 'rpm', angle: 'deg', stiffness: 'N/mm', density: 'kg/m³', specenergy: 'kJ/kg', specheat: 'kJ/(kg·K)', capacitance: 'µF', inductance: 'mH', massflow: 'kg/h',
  },
  imperial: {
    length: 'in', area: 'in²', volume: 'gal (US)', mass: 'lb', force: 'lbf', pressure: 'psi', torque: 'lbf·ft', temperature: '°F', tempdiff: '°F',
    energy: 'BTU', power: 'hp', flow: 'gpm (US)', velocity: 'ft/s', accel: 'ft/s²', density: 'lb/ft³', dynvisc: 'lbf·s/ft²', kinvisc: 'ft²/s',
    areamoment: 'in⁴', sectionmod: 'in³', angvel: 'rpm', angle: 'deg', stiffness: 'lbf/in', thermcond: 'BTU/(h·ft·°F)', htc: 'BTU/(h·ft²·°F)',
    specheat: 'BTU/(lb·°F)', specenergy: 'BTU/lb', heatflux: 'BTU/(h·ft²)', massflow: 'lb/h', inertia: 'lb·ft²', specvol: 'ft³/lb', expansion: '1/°F',
  },
};

export function siUnit(dim) {
  const d = DIMS[dim];
  if (!d) return '';
  return Object.keys(d.units).find(k => {
    const f = d.units[k];
    return Array.isArray(f) ? f[0] === 1 && f[1] === 0 : f === 1;
  }) ?? Object.keys(d.units)[0];
}

export function unitsOf(dim) { return DIMS[dim] ? Object.keys(DIMS[dim].units) : ['']; }

export function defaultUnit(dim, system = 'si', prefs = null) {
  if (prefs && prefs[system] && DIMS[dim]?.units[prefs[system]] !== undefined) return prefs[system];
  if (prefs && system !== 'imperial' && prefs.si && DIMS[dim]?.units[prefs.si] !== undefined) return prefs.si;
  const s = SYSTEMS[system]?.[dim];
  if (s && DIMS[dim]?.units[s] !== undefined) return s;
  return siUnit(dim);
}

export function toSI(value, dim, unit) {
  const f = DIMS[dim]?.units[unit];
  if (f === undefined) return value;
  if (Array.isArray(f)) return (value + f[1]) * f[0];
  return value * f;
}

export function fromSI(value, dim, unit) {
  const f = DIMS[dim]?.units[unit];
  if (f === undefined) return value;
  if (Array.isArray(f)) return value / f[0] - f[1];
  return value / f;
}

export function convert(value, dim, from, to) { return fromSI(toSI(value, dim, from), dim, to); }

// Converter categories (subset of DIMS worth exposing in the unit converter UI).
export const CONVERTER_DIMS = [
  'length', 'area', 'volume', 'mass', 'time', 'velocity', 'accel', 'force', 'pressure', 'energy', 'power', 'torque',
  'density', 'temperature', 'tempdiff', 'dynvisc', 'kinvisc', 'flow', 'massflow', 'thermcond', 'htc', 'specheat', 'specenergy',
  'heatflux', 'angle', 'angvel', 'frequency', 'areamoment', 'sectionmod', 'inertia', 'stiffness', 'charge', 'capacitance',
  'inductance', 'resistivity', 'bfield', 'momentum', 'activity', 'expansion', 'fuelcons',
];
