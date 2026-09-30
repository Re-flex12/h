// Hot-rolled European I and H sections (EN 10365 dimensions). Properties are computed from the
// nominal dimensions including root fillets, using the same formulas as the ArcelorMittal / SCI tables.
// Dimensions in mm: [h, b, tw, tf, r].
const IPE = { 80: [80, 46, 3.8, 5.2, 5], 100: [100, 55, 4.1, 5.7, 7], 120: [120, 64, 4.4, 6.3, 7], 140: [140, 73, 4.7, 6.9, 7], 160: [160, 82, 5.0, 7.4, 9], 180: [180, 91, 5.3, 8.0, 9], 200: [200, 100, 5.6, 8.5, 12], 220: [220, 110, 5.9, 9.2, 12], 240: [240, 120, 6.2, 9.8, 15], 270: [270, 135, 6.6, 10.2, 15], 300: [300, 150, 7.1, 10.7, 15], 330: [330, 160, 7.5, 11.5, 18], 360: [360, 170, 8.0, 12.7, 18], 400: [400, 180, 8.6, 13.5, 21], 450: [450, 190, 9.4, 14.6, 21], 500: [500, 200, 10.2, 16.0, 21], 550: [550, 210, 11.1, 17.2, 24], 600: [600, 220, 12.0, 19.0, 24] };
const HEA = { 100: [96, 100, 5, 8, 12], 120: [114, 120, 5, 8, 12], 140: [133, 140, 5.5, 8.5, 12], 160: [152, 160, 6, 9, 15], 180: [171, 180, 6, 9.5, 15], 200: [190, 200, 6.5, 10, 18], 220: [210, 220, 7, 11, 18], 240: [230, 240, 7.5, 12, 21], 260: [250, 260, 7.5, 12.5, 24], 280: [270, 280, 8, 13, 24], 300: [290, 300, 8.5, 14, 27], 320: [310, 300, 9, 15.5, 27], 340: [330, 300, 9.5, 16.5, 27], 360: [350, 300, 10, 17.5, 27], 400: [390, 300, 11, 19, 27], 450: [440, 300, 11.5, 21, 27], 500: [490, 300, 12, 23, 27], 600: [590, 300, 13, 25, 27] };
const HEB = { 100: [100, 100, 6, 10, 12], 120: [120, 120, 6.5, 11, 12], 140: [140, 140, 7, 12, 12], 160: [160, 160, 8, 13, 15], 180: [180, 180, 8.5, 14, 15], 200: [200, 200, 9, 15, 18], 220: [220, 220, 9.5, 16, 18], 240: [240, 240, 10, 17, 21], 260: [260, 260, 10, 17.5, 24], 280: [280, 280, 10.5, 18, 24], 300: [300, 300, 11, 19, 27], 320: [320, 300, 11.5, 20.5, 27], 340: [340, 300, 12, 21.5, 27], 360: [360, 300, 12.5, 22.5, 27], 400: [400, 300, 13.5, 24, 27], 450: [450, 300, 14, 26, 27], 500: [500, 300, 14.5, 28, 27], 600: [600, 300, 15.5, 30, 27] };

export const FAMILIES = { IPE, HEA, HEB };

// Section properties (mm-based inputs; returns SI: m, m², m⁴, m³, m⁶, kg/m).
export function iSection(h, b, tw, tf, r) {
  const hw = h - 2 * tf, af = (1 - Math.PI / 4) * r * r;          // one root-fillet area
  const ey = r * (10 - 3 * Math.PI) / (3 * (4 - Math.PI));        // fillet centroid offset from its square corner
  const yf = hw / 2 - ey;                                         // fillet centroid from the major axis
  const A = 2 * b * tf + hw * tw + 4 * af;
  const Ifil = r ** 4 * (1 / 3 - Math.PI / 16 - 1 / (9 * (4 - Math.PI)));   // spandrel about its own centroid (either axis)
  const Iy = (b * h ** 3 - (b - tw) * hw ** 3) / 12 + 4 * (Ifil + af * yf * yf);
  const zf = tw / 2 + ey;
  const Iz = 2 * tf * b ** 3 / 12 + hw * tw ** 3 / 12 + 4 * (Ifil + af * zf * zf);
  const Wely = Iy / (h / 2), Welz = Iz / (b / 2);
  const Wply = b * tf * (h - tf) + tw * hw * hw / 4 + 4 * af * yf;
  const Wplz = tf * b * b / 2 + hw * tw * tw / 4 + 4 * af * zf;
  const Avz = Math.max(A - 2 * b * tf + (tw + 2 * r) * tf, hw * tw);  // EN 1993-1-1 6.2.6(3)a, η = 1
  // Torsion constant with the web–flange fillet contribution (ArcelorMittal / El Darwish & Johnston).
  const D = ((r + tw / 2) ** 2 + (r + tf) ** 2 - r * r) / (2 * r + tf), alpha = (tw / tf) * (0.145 + 0.1 * r / tf);
  const It = 2 / 3 * (b - 0.63 * tf) * tf ** 3 + 1 / 3 * (h - 2 * tf) * tw ** 3 + 2 * alpha * D ** 4;
  const Iw = Iz * (h - tf) ** 2 / 4;
  const mm = 1e-3;
  return {
    h: h * mm, b: b * mm, tw: tw * mm, tf: tf * mm, r: r * mm,
    A: A * mm ** 2, Iy: Iy * mm ** 4, Iz: Iz * mm ** 4, Wely: Wely * mm ** 3, Welz: Welz * mm ** 3, Wply: Wply * mm ** 3, Wplz: Wplz * mm ** 3,
    iy: Math.sqrt(Iy / A) * mm, iz: Math.sqrt(Iz / A) * mm, Avz: Avz * mm ** 2, It: It * mm ** 4, Iw: Iw * mm ** 6, mass: A * mm ** 2 * 7850,
  };
}

export const SECTIONS = Object.entries(FAMILIES).flatMap(([fam, t]) => Object.entries(t).map(([n, d]) => ({ id: `${fam}${n}`, name: `${fam} ${n}`, fam, dims: d, ...iSection(...d) })));
export const SECTION = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
