import test from 'node:test';
import assert from 'node:assert/strict';
import { steamPT, steamPH, steamPS, satP, satT, region3rhoT, pB23, TB23 } from '../assets/js/data/if97.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) < tol, `${msg}: ${a} vs ${b}`);

test('IF97 region 3 (p,T) inverse recovers density on both branches', () => {
  for (const [rho, T] of [[500, 650], [200, 650], [500, 750]]) {
    const st = region3rhoT(rho, T);
    close(steamPT(st.p, T).rho, rho, 1e-7, `rho at ${T} K`);
  }
});

test('IF97 B23 boundary equation round-trips', () => {
  close(pB23(623.15), 16.5291643e6, 1e-8, 'p_B23(623.15 K)');
  close(TB23(pB23(700)), 700, 1e-9, 'T_B23(p_B23)');
});

test('IF97 saturation: liquid/vapour Gibbs energies equal within IF97 inter-region consistency', () => {
  for (const T of [300, 400, 500, 600, 630, 645]) {
    const s = satT(T), g = q => q.h - T * q.s;
    assert.ok(Math.abs(g(s.liq) - g(s.vap)) < 20, `g_f = g_g at ${T} K (${g(s.liq) - g(s.vap)} J/kg)`);
  }
});

test('IF97 (p,h) and (p,s) inverses', () => {
  for (const [p, T] of [[1e6, 573.15], [3e6, 300], [25e6, 660], [30e6, 2000]]) {
    const st = steamPT(p, T);
    close(steamPH(p, st.h).T, T, 1e-7, `T(p,h) at ${p} Pa`);
    close(steamPS(p, st.s).T, T, 1e-7, `T(p,s) at ${p} Pa`);
  }
  const s = satP(1e5), mid = steamPH(1e5, (s.liq.h + s.vap.h) / 2);
  close(mid.x, 0.5, 1e-9, 'quality in two-phase');
});
