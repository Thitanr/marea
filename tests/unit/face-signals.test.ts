/* ==========================================================================
   Unit tests — face-signals pure logic (gestures, tension, emotion port)
   ========================================================================== */

import { describe, it, expect } from 'vitest';
import {
  extractSignals,
  GestureDetector,
  TensionMeter,
  classifyEmotion,
  type SignalFrame,
} from '../../src/face/face-signals.js';

function frame(t: number, overrides: Partial<SignalFrame> = {}): SignalFrame {
  return {
    t,
    present: true,
    blink: 0, jawOpen: 0, browUp: 0, browDown: 0, squint: 0, press: 0, smile: 0,
    ...overrides,
  };
}

describe('extractSignals', () => {
  it('reports no face when blendshapes are missing', () => {
    expect(extractSignals(undefined, 10).present).toBe(false);
    expect(extractSignals([], 10).present).toBe(false);
  });

  it('averages left/right blendshapes', () => {
    const f = extractSignals([
      { categoryName: 'eyeBlinkLeft', score: 0.8 },
      { categoryName: 'eyeBlinkRight', score: 0.6 },
      { categoryName: 'jawOpen', score: 0.4 },
      { categoryName: 'browDownLeft', score: 0.2 },
      { categoryName: 'browDownRight', score: 0.4 },
    ], 42);
    expect(f.present).toBe(true);
    expect(f.t).toBe(42);
    expect(f.blink).toBeCloseTo(0.7);
    expect(f.jawOpen).toBeCloseTo(0.4);
    expect(f.browDown).toBeCloseTo(0.3);
  });
});

describe('GestureDetector (long blink)', () => {
  it('ignores a natural short blink (~200ms)', () => {
    const d = new GestureDetector('blink');
    expect(d.update(frame(0, { blink: 0.9 }))).toBe(false);
    expect(d.update(frame(200, { blink: 0.9 }))).toBe(false);
    expect(d.update(frame(300, { blink: 0.1 }))).toBe(false);
  });

  it('fires exactly once for a sustained blink', () => {
    const d = new GestureDetector('blink');
    expect(d.update(frame(0, { blink: 0.9 }))).toBe(false);
    expect(d.update(frame(460, { blink: 0.9 }))).toBe(true);   // held long enough
    expect(d.update(frame(600, { blink: 0.9 }))).toBe(false);  // still held — no re-fire
    expect(d.update(frame(700, { blink: 0.9 }))).toBe(false);
  });

  it('requires release below OFF threshold before re-arming', () => {
    const d = new GestureDetector('blink');
    d.update(frame(0, { blink: 0.9 }));
    expect(d.update(frame(500, { blink: 0.9 }))).toBe(true);
    // drop only to 0.45 (above OFF 0.35) — must not re-arm
    d.update(frame(1600, { blink: 0.45 }));
    d.update(frame(1700, { blink: 0.9 }));
    expect(d.update(frame(2300, { blink: 0.9 }))).toBe(false);
    // full release, then a new sustained blink fires again
    d.update(frame(2400, { blink: 0.1 }));
    d.update(frame(2500, { blink: 0.9 }));
    expect(d.update(frame(3000, { blink: 0.9 }))).toBe(true);
  });

  it('does not fire without a face', () => {
    const d = new GestureDetector('mouth');
    expect(d.update(frame(0, { present: false, jawOpen: 0.9 }))).toBe(false);
    expect(d.update(frame(600, { present: false, jawOpen: 0.9 }))).toBe(false);
  });
});

describe('TensionMeter', () => {
  function calibrate(m: TensionMeter, base: Partial<SignalFrame>, until = 3100): number {
    let t = 0;
    for (; t <= until; t += 100) m.update(frame(t, base));
    return t;
  }

  it('reports calibrating during the baseline window', () => {
    const m = new TensionMeter();
    expect(m.update(frame(0)).calibrating).toBe(true);
    expect(m.update(frame(1000)).calibrating).toBe(true);
    expect(m.update(frame(3200)).calibrating).toBe(false);
  });

  it('stays calm at baseline and rises with facial tension', () => {
    const m = new TensionMeter();
    let t = calibrate(m, { browDown: 0.05, squint: 0.05, press: 0.05 });

    let s = m.update(frame(t, { browDown: 0.05, squint: 0.05, press: 0.05 }));
    expect(s.tension).toBeLessThan(0.1);

    // Sustained visible tension well above the personal baseline
    for (let i = 0; i < 60; i++) {
      t += 100;
      s = m.update(frame(t, { browDown: 0.6, squint: 0.5, press: 0.5 }));
    }
    expect(s.tension).toBeGreaterThan(0.6);
    expect(s.calm).toBeCloseTo(1 - s.tension);
  });

  it('adapts to the personal baseline (a naturally furrowed brow is not tension)', () => {
    const m = new TensionMeter();
    let t = calibrate(m, { browDown: 0.4 });
    let s = m.update(frame(t, { browDown: 0.4 }));
    for (let i = 0; i < 20; i++) { t += 100; s = m.update(frame(t, { browDown: 0.4 })); }
    expect(s.tension).toBeLessThan(0.1);
  });
});

describe('classifyEmotion (KAI emotion.py port)', () => {
  it('returns null without a face', () => {
    expect(classifyEmotion(frame(0, { present: false }))).toBeNull();
  });

  it('classifies surprise, anger, joy and neutral', () => {
    expect(classifyEmotion(frame(0, { jawOpen: 0.7 }))?.label).toBe('surprise');
    expect(classifyEmotion(frame(0, { browDown: 0.7 }))?.label).toBe('anger');
    expect(classifyEmotion(frame(0, { smile: 0.6 }))?.label).toBe('joy');
    expect(classifyEmotion(frame(0))?.label).toBe('neutral');
  });

  it('prioritises surprise over joy when both present (KAI ordering)', () => {
    const r = classifyEmotion(frame(0, { jawOpen: 0.6, smile: 0.6 }));
    expect(r?.label).toBe('surprise');
  });
});
