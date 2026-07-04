/* ==========================================================================
   MAREA — Face Signals (pure logic, no DOM, no camera)
   Ported from CIL_KAI_Core (core/emotion.py, core/calibration.py) to
   MediaPipe FaceLandmarker blendshapes. Everything runs on-device.
   ========================================================================== */

export interface BlendCategory {
  categoryName: string;
  score: number;
}

/** One processed camera frame reduced to the signals Marea cares about. */
export interface SignalFrame {
  t: number;          // timestamp ms
  present: boolean;   // a face was detected
  blink: number;      // 0..1 both-eyes closure (avg eyeBlinkLeft/Right)
  jawOpen: number;    // 0..1
  browUp: number;     // 0..1 inner brow raise
  browDown: number;   // 0..1 brow knit (tension / anger)
  squint: number;     // 0..1 eye squint (tension)
  press: number;      // 0..1 lip press (jaw/mouth tension)
  smile: number;      // 0..1
}

const EMPTY_FRAME: Omit<SignalFrame, 't' | 'present'> = {
  blink: 0, jawOpen: 0, browUp: 0, browDown: 0, squint: 0, press: 0, smile: 0,
};

function avg(map: Map<string, number>, a: string, b: string): number {
  return ((map.get(a) ?? 0) + (map.get(b) ?? 0)) / 2;
}

/** Reduce MediaPipe blendshape categories to a SignalFrame. */
export function extractSignals(blend: BlendCategory[] | undefined, t: number): SignalFrame {
  if (!blend || blend.length === 0) {
    return { t, present: false, ...EMPTY_FRAME };
  }
  const m = new Map<string, number>();
  for (const c of blend) m.set(c.categoryName, c.score);
  return {
    t,
    present: true,
    blink: avg(m, 'eyeBlinkLeft', 'eyeBlinkRight'),
    jawOpen: m.get('jawOpen') ?? 0,
    browUp: m.get('browInnerUp') ?? 0,
    browDown: avg(m, 'browDownLeft', 'browDownRight'),
    squint: avg(m, 'eyeSquintLeft', 'eyeSquintRight'),
    press: avg(m, 'mouthPressLeft', 'mouthPressRight'),
    smile: avg(m, 'mouthSmileLeft', 'mouthSmileRight'),
  };
}

/* --------------------------------------------------------------------------
   Gesture detection — the "facial switch".
   A gesture fires when its signal stays above the ON threshold for holdMs
   (spontaneous blinks last ~100-300ms, so they never fire), then needs to
   drop below the OFF threshold (hysteresis) and wait out a cooldown.
   -------------------------------------------------------------------------- */

export type FaceGesture = 'blink' | 'mouth' | 'brows';

interface GestureConf {
  on: number;
  off: number;
  holdMs: number;
  get: (f: SignalFrame) => number;
}

const GESTURES: Record<FaceGesture, GestureConf> = {
  blink: { on: 0.55, off: 0.35, holdMs: 450, get: f => f.blink },
  mouth: { on: 0.50, off: 0.30, holdMs: 400, get: f => f.jawOpen },
  brows: { on: 0.40, off: 0.22, holdMs: 400, get: f => f.browUp },
};

export class GestureDetector {
  private conf: GestureConf;
  private holdMult: number;
  private cooldownMs: number;
  private aboveSince: number | null = null;
  private firedAt = -Infinity;
  private armed = true;

  constructor(gesture: FaceGesture, holdMult = 1, cooldownMs = 900) {
    this.conf = GESTURES[gesture];
    this.holdMult = holdMult;
    this.cooldownMs = cooldownMs;
  }

  /** Feed one frame; returns true exactly once per performed gesture. */
  update(f: SignalFrame): boolean {
    if (!f.present) { this.aboveSince = null; return false; }
    const v = this.conf.get(f);

    if (v < this.conf.off) { this.armed = true; this.aboveSince = null; return false; }
    if (!this.armed || v < this.conf.on) {
      if (v < this.conf.on) this.aboveSince = null;
      return false;
    }
    if (this.aboveSince === null) this.aboveSince = f.t;
    const held = f.t - this.aboveSince;
    if (held >= this.conf.holdMs * this.holdMult && f.t - this.firedAt >= this.cooldownMs) {
      this.firedAt = f.t;
      this.armed = false;       // must release below OFF before re-arming
      this.aboveSince = null;
      return true;
    }
    return false;
  }
}

/* --------------------------------------------------------------------------
   Tension meter — neurofeedback without electrodes.
   Learns the user's resting face for `baselineMs`, then scores how far
   brow-knit / squint / lip-press rise above that personal baseline.
   (Same personal-calibration idea as KAI's calibration.py.)
   -------------------------------------------------------------------------- */

export interface TensionState {
  calibrating: boolean;
  /** 0 = fully relaxed vs own baseline, 1 = very tense. Smoothed. */
  tension: number;
  /** Convenience inverse: 0..1 calm. */
  calm: number;
}

export class TensionMeter {
  private baselineMs: number;
  private startT: number | null = null;
  private sums = { browDown: 0, squint: 0, press: 0 };
  private count = 0;
  private base: { browDown: number; squint: number; press: number } | null = null;
  private smoothed = 0;
  private readonly alpha = 0.12; // EMA — slow enough to feel steady, not laggy

  constructor(baselineMs = 3000) {
    this.baselineMs = baselineMs;
  }

  update(f: SignalFrame): TensionState {
    if (!f.present) {
      return { calibrating: this.base === null, tension: this.smoothed, calm: 1 - this.smoothed };
    }
    if (this.base === null) {
      if (this.startT === null) this.startT = f.t;
      this.sums.browDown += f.browDown;
      this.sums.squint += f.squint;
      this.sums.press += f.press;
      this.count++;
      if (f.t - this.startT >= this.baselineMs && this.count > 0) {
        this.base = {
          browDown: this.sums.browDown / this.count,
          squint: this.sums.squint / this.count,
          press: this.sums.press / this.count,
        };
      }
      return { calibrating: this.base === null, tension: 0, calm: 1 };
    }

    const raw =
      0.40 * Math.max(0, f.browDown - this.base.browDown) +
      0.30 * Math.max(0, f.squint - this.base.squint) +
      0.30 * Math.max(0, f.press - this.base.press);
    // Typical above-baseline excursions reach ~0.35-0.45 when visibly tense.
    const norm = Math.min(1, raw * 2.6);
    this.smoothed += this.alpha * (norm - this.smoothed);
    return { calibrating: false, tension: this.smoothed, calm: 1 - this.smoothed };
  }

  reset(): void {
    this.startT = null;
    this.sums = { browDown: 0, squint: 0, press: 0 };
    this.count = 0;
    this.base = null;
    this.smoothed = 0;
  }
}

/* --------------------------------------------------------------------------
   Emotion heuristic — direct port of KAI core/emotion.py classify_emotion(),
   re-expressed over blendshapes. Kept internal (never shown as a verdict to
   the user — Marea validates, it does not diagnose).
   -------------------------------------------------------------------------- */

export interface EmotionResult {
  label: 'surprise' | 'anger' | 'joy' | 'neutral';
  confidence: number;
}

export function classifyEmotion(f: SignalFrame): EmotionResult | null {
  if (!f.present) return null;
  if (f.jawOpen > 0.50) {
    return { label: 'surprise', confidence: Math.min(f.jawOpen / 0.7, 1) };
  }
  if (f.browDown > 0.50) {
    return { label: 'anger', confidence: Math.min(f.browDown / 0.8, 1) };
  }
  if (f.smile > 0.45) {
    return { label: 'joy', confidence: Math.min(f.smile / 0.8, 1) };
  }
  return { label: 'neutral', confidence: 0.5 };
}
