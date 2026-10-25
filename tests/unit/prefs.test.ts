import { describe, it, expect, beforeEach } from 'vitest';
import { tapGuardMs, scanFactor, scanStepMs, TAP_GUARD_DEFAULT, SCAN_FACTOR_DEFAULT } from '../../src/core/prefs.js';

beforeEach(() => localStorage.clear());

describe('timing preferences', () => {
  it('default to the values that used to be fixed, so nothing changes for current users', () => {
    expect(tapGuardMs()).toBe(400);
    expect(TAP_GUARD_DEFAULT).toBe(400);
    expect(scanFactor()).toBe(1);
    expect(SCAN_FACTOR_DEFAULT).toBe(1);
    expect(scanStepMs(1600)).toBe(1600);
    expect(scanStepMs(1400)).toBe(1400);
  });

  it('"off" (0) is a real choice, not a missing value', () => {
    localStorage.setItem('marea_tap_guard', '0');
    expect(tapGuardMs()).toBe(0);
  });

  it('applies the chosen tap guard and scan speed', () => {
    localStorage.setItem('marea_tap_guard', '1200');
    localStorage.setItem('marea_scan_factor', '2');
    expect(tapGuardMs()).toBe(1200);
    expect(scanStepMs(1600)).toBe(3200);
    localStorage.setItem('marea_scan_factor', '0.7');
    expect(scanStepMs(1400)).toBe(980);
  });

  it('ignores anything that is not an offered choice (corrupt or hand-edited storage)', () => {
    for (const bad of ['', 'abc', '-5', '99999', 'NaN', '0.0001']) {
      localStorage.setItem('marea_tap_guard', bad);
      localStorage.setItem('marea_scan_factor', bad);
      expect(tapGuardMs()).toBe(400);
      expect(scanFactor()).toBe(1);
    }
  });
});
