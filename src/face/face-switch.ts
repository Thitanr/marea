/* ==========================================================================
   MAREA — Face Control (hands-free navigation)
   KAI's facial perception applied as a universal "facial switch":
   an auto-scanning highlight walks through everything interactive on the
   current screen; a deliberate facial gesture (long blink / open mouth /
   raised brows) activates the highlighted control. Works across the whole
   app, including the scan keyboard. 100% on-device.
   ========================================================================== */

import { faceEngine, FaceEngineException } from './face-engine.js';
import { GestureDetector, type FaceGesture, type SignalFrame } from './face-signals.js';
import { ensureFaceConsent, hasFaceConsent } from './face-consent.js';
import { t } from '../core/i18n.js';
import { showToast } from '../core/toast.js';

const KEY_ON = 'marea_face_on';
const KEY_GESTURE = 'marea_face_gesture';

const SCAN_MS = 1400;            // auto-scan pace — deliberate, AAC-friendly
const POST_SELECT_PAUSE_MS = 900; // let the user see what their selection did

/* Overlays that must capture the scan while visible (topmost first). */
const OVERLAY_SCOPES = [
  '#scan-onboard-overlay',
  '.stt-overlay',
  '#ios-install-modal',
  '#onboarding-overlay',
];

function isVisible(el: HTMLElement): boolean {
  if (el.classList.contains('hidden')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function savedGesture(): FaceGesture {
  const g = localStorage.getItem(KEY_GESTURE);
  return g === 'mouth' || g === 'brows' ? g : 'blink';
}

class FaceSwitch {
  private active = false;
  private detector = new GestureDetector(savedGesture());
  private unsubscribe: (() => void) | null = null;
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private pausedUntil = 0;
  private targets: HTMLElement[] = [];
  private index = -1;
  private indicator: HTMLElement | null = null;
  private indicatorText: HTMLElement | null = null;
  private facePresent = true;

  get enabled(): boolean {
    return this.active;
  }

  setGesture(g: FaceGesture): void {
    localStorage.setItem(KEY_GESTURE, g);
    this.detector = new GestureDetector(g);
  }

  async enable(): Promise<boolean> {
    if (this.active) return true;
    if (!(await ensureFaceConsent())) return false;

    showToast(t('face.loading'));
    try {
      await faceEngine.acquire();
    } catch (err) {
      const code = err instanceof FaceEngineException ? err.code : 'assets';
      showToast(t(code === 'camera' ? 'face.error_camera' : 'face.error_assets'));
      return false;
    }

    this.active = true;
    localStorage.setItem(KEY_ON, '1');
    this.detector = new GestureDetector(savedGesture());
    this.mountIndicator();
    this.unsubscribe = faceEngine.onFrame(this.onFrame);
    this.startScanning();
    showToast(t('face.on'));
    return true;
  }

  disable(): void {
    if (!this.active) return;
    this.active = false;
    localStorage.setItem(KEY_ON, '0');
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.stopScanning();
    this.indicator?.remove();
    this.indicator = null;
    this.indicatorText = null;
    faceEngine.release();
    showToast(t('face.off'));
  }

  /* ---- Frame handling ------------------------------------------------- */

  private onFrame = (f: SignalFrame): void => {
    if (f.present !== this.facePresent) {
      this.facePresent = f.present;
      this.updateIndicator();
    }
    if (this.detector.update(f)) this.onGesture();
  };

  private onGesture(): void {
    this.flashIndicator();
    if (performance.now() < this.pausedUntil) return;

    // Scan keyboard open? It runs its own row/column scanner — a gesture
    // is simply the "tap anywhere" it already understands.
    const scanKb = document.getElementById('eye-gaze-keyboard');
    const scanOnboard = document.getElementById('scan-onboard-overlay');
    if (scanKb && isVisible(scanKb) && !(scanOnboard && isVisible(scanOnboard))) {
      scanKb.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      return;
    }

    const el = this.targets[this.index];
    if (!el || !isVisible(el)) return;
    el.classList.add('face-scan-selected');
    setTimeout(() => el.classList.remove('face-scan-selected'), 500);
    this.activate(el);
    // DOM likely changed — restart the walk after a beat
    this.pausedUntil = performance.now() + POST_SELECT_PAUSE_MS;
    this.index = -1;
    this.clearHighlight();
  }

  /** A plain .click() is useless on selects and range sliders — a gesture
      cycles them to their next value instead, so every setting stays
      reachable with just the face. */
  private activate(el: HTMLElement): void {
    if (el.tagName === 'SELECT') {
      const sel = el as HTMLSelectElement;
      sel.selectedIndex = (sel.selectedIndex + 1) % sel.options.length;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'range') {
      const range = el as HTMLInputElement;
      const step = Number(range.step) || 1;
      const next = Number(range.value) + step;
      range.value = String(next > Number(range.max) ? Number(range.min) : next);
      range.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    el.click();
  }

  /* ---- Scanning ------------------------------------------------------- */

  private startScanning(): void {
    this.stopScanning();
    this.index = -1;
    this.scanTimer = setInterval(() => this.advance(), SCAN_MS);
    this.advance();
  }

  private stopScanning(): void {
    if (this.scanTimer) clearInterval(this.scanTimer);
    this.scanTimer = null;
    this.clearHighlight();
  }

  private advance(): void {
    if (performance.now() < this.pausedUntil) return;

    // While the scan keyboard is open it drives its own highlight
    const scanKb = document.getElementById('eye-gaze-keyboard');
    if (scanKb && isVisible(scanKb)) {
      this.clearHighlight();
      this.updateIndicator();
      return;
    }

    const current = this.targets[this.index] ?? null;
    this.targets = this.collectTargets();
    if (this.targets.length === 0) { this.clearHighlight(); return; }

    const keep = current ? this.targets.indexOf(current) : -1;
    this.index = (keep >= 0 ? keep + 1 : 0) % this.targets.length;
    const next = this.targets[this.index];
    if (next) this.highlight(next);
  }

  private collectTargets(): HTMLElement[] {
    // A visible overlay owns the screen
    for (const sel of OVERLAY_SCOPES) {
      const overlay = document.querySelector<HTMLElement>(sel);
      if (overlay && isVisible(overlay)) {
        return this.interactiveIn(overlay);
      }
    }
    const panel = document.querySelector<HTMLElement>('.tab-panel.active');
    const items = panel ? this.interactiveIn(panel) : [];
    // Navigation last — content first is almost always what the user wants
    document.querySelectorAll<HTMLElement>('.app-navbar .nav-item').forEach(el => {
      if (isVisible(el)) items.push(el);
    });
    const indicator = this.indicator;
    return items.filter(el => el !== indicator && !indicator?.contains(el));
  }

  private interactiveIn(root: HTMLElement): HTMLElement[] {
    const nodes = root.querySelectorAll<HTMLElement>(
      'button, [role="button"], a[href], input, select, textarea, summary, label'
    );
    return Array.from(nodes).filter(el => {
      if (!isVisible(el) || (el as HTMLButtonElement).disabled) return false;
      // Labels only stand in for controls that are visually hidden
      // (e.g. .settings-toggle checkboxes with display:none)
      if (el.tagName === 'LABEL') {
        const input = el.querySelector<HTMLInputElement>('input');
        return !!input && !isVisible(input);
      }
      return true;
    });
  }

  private highlight(el: HTMLElement): void {
    this.clearHighlight();
    el.classList.add('face-scan-active');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  private clearHighlight(): void {
    document.querySelectorAll('.face-scan-active')
      .forEach(el => el.classList.remove('face-scan-active'));
  }

  /* ---- Indicator pill --------------------------------------------------
     Always-visible status + the escape hatch: tapping it turns Face
     Control off (caregivers or the user's working hand can always stop it). */

  private mountIndicator(): void {
    const pill = document.createElement('button');
    pill.id = 'face-indicator';
    pill.className = 'face-indicator';
    pill.setAttribute('aria-live', 'polite');
    pill.title = t('face.indicator_stop');
    pill.innerHTML = `<span class="face-indicator-dot" aria-hidden="true"></span><span class="face-indicator-text"></span>`;
    pill.addEventListener('click', () => this.disable());
    document.body.appendChild(pill);
    this.indicator = pill;
    this.indicatorText = pill.querySelector('.face-indicator-text');
    this.updateIndicator();
  }

  private updateIndicator(): void {
    if (!this.indicator || !this.indicatorText) return;
    this.indicator.classList.toggle('face-indicator-noface', !this.facePresent);
    this.indicatorText.textContent = this.facePresent ? t('face.on') : t('face.no_face');
  }

  private flashIndicator(): void {
    if (!this.indicator) return;
    this.indicator.classList.add('face-indicator-pulse');
    setTimeout(() => this.indicator?.classList.remove('face-indicator-pulse'), 400);
  }
}

export const faceSwitch = new FaceSwitch();

/** Wire settings controls + auto-resume. Called once from boot(). */
export function initFaceControl(): void {
  const toggle = document.getElementById('setting-face-control') as HTMLInputElement | null;
  const gestureSel = document.getElementById('setting-face-gesture') as HTMLSelectElement | null;

  if (gestureSel) {
    gestureSel.value = savedGesture();
    gestureSel.addEventListener('change', () => {
      faceSwitch.setGesture(gestureSel.value as FaceGesture);
    });
  }

  if (toggle) {
    toggle.checked = localStorage.getItem(KEY_ON) === '1';
    toggle.addEventListener('change', async () => {
      if (toggle.checked) {
        const ok = await faceSwitch.enable();
        if (!ok) toggle.checked = false;
      } else {
        faceSwitch.disable();
      }
    });
  }

  // Auto-resume: a user who depends on Face Control cannot re-enable it by
  // hand — if it was on (and consented) last session, bring it back.
  if (localStorage.getItem(KEY_ON) === '1' && hasFaceConsent()) {
    faceSwitch.enable().then(ok => {
      if (!ok && toggle) toggle.checked = false;
    });
  }
}
