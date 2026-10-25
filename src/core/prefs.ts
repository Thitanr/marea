/* ==========================================================================
   MAREA — Timing preferences the person (or a carer) can tune in Settings.
   Defaults equal the values that used to be fixed in the code, so nobody who
   already uses Marea notices a change. Stored only on this device.
   ========================================================================== */

const LS_TAP_GUARD = 'marea_tap_guard';
const LS_SCAN_FACTOR = 'marea_scan_factor';

/** Ignore a 2nd tap on the same button within this many ms (Motor mode). 0 = off. */
export const TAP_GUARD_CHOICES: readonly number[] = [0, 400, 800, 1200];
export const TAP_GUARD_DEFAULT = 400;

/** Multiplier on every scan step (keyboard scan and Face Control). >1 = slower. */
export const SCAN_FACTOR_CHOICES: readonly number[] = [0.7, 1, 1.5, 2];
export const SCAN_FACTOR_DEFAULT = 1;

function read(key: string, choices: readonly number[], fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw.trim() === '') return fallback; // '' would read as 0 (= off)
    const v = Number(raw);
    return choices.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export const tapGuardMs = (): number => read(LS_TAP_GUARD, TAP_GUARD_CHOICES, TAP_GUARD_DEFAULT);
export const scanFactor = (): number => read(LS_SCAN_FACTOR, SCAN_FACTOR_CHOICES, SCAN_FACTOR_DEFAULT);
/** A scan step of `baseMs` scaled by the person's chosen speed. */
export const scanStepMs = (baseMs: number): number => Math.round(baseMs * scanFactor());

function wire(id: string, key: string, current: () => number): void {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  if (!el) return;
  el.value = String(current());
  el.addEventListener('change', () => {
    try { localStorage.setItem(key, el.value); } catch { /* simply not remembered */ }
  });
}

export function initTimingSettings(): void {
  wire('setting-tap-guard', LS_TAP_GUARD, tapGuardMs);
  wire('setting-scan-speed', LS_SCAN_FACTOR, scanFactor);
}
