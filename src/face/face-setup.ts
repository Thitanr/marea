/* ==========================================================================
   MAREA — Face Control guided setup
   LANA philosophy: the technology adapts to the human, never the reverse.
   Nobody configures a gesture in a dropdown — the app watches and the first
   gesture the person can perform twice BECOMES their gesture. Done.
   ========================================================================== */

import { faceEngine, FaceEngineException } from './face-engine.js';
import { GestureDetector, type FaceGesture, type SignalFrame } from './face-signals.js';
import { ensureFaceConsent } from './face-consent.js';
import { faceSwitch } from './face-switch.js';
import { t } from '../core/i18n.js';
import { showToast } from '../core/toast.js';

const KEY_GESTURE = 'marea_face_gesture';
const KEY_SETUP_DONE = 'marea_face_setup_done';

const GESTURES: FaceGesture[] = ['blink', 'mouth', 'brows'];
const GESTURE_LABEL_KEY: Record<FaceGesture, string> = {
  blink: 'face.gesture_blink',
  mouth: 'face.gesture_mouth',
  brows: 'face.gesture_brows',
};

export function isSetupDone(): boolean {
  return localStorage.getItem(KEY_SETUP_DONE) === '1';
}

/**
 * Runs the guided discovery: camera on, all three gesture detectors listen
 * at once, the first gesture performed twice wins. Resolves true when Face
 * Control ends up enabled.
 */
export async function runFaceSetup(): Promise<boolean> {
  if (!(await ensureFaceConsent())) return false;

  showToast(t('face.loading'));
  try {
    await faceEngine.acquire();
  } catch (err) {
    const code = err instanceof FaceEngineException ? err.code : 'assets';
    showToast(t(code === 'camera' ? 'face.error_camera' : 'face.error_assets'));
    return false;
  }

  return new Promise<boolean>(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'stt-overlay face-setup-overlay';
    overlay.innerHTML = `
      <div class="stt-notice face-setup-card" role="dialog" aria-modal="true">
        <div class="face-setup-icon" aria-hidden="true">☺</div>
        <h2 class="face-setup-title">${t('face.setup_title')}</h2>
        <p class="stt-notice-text face-setup-text" id="face-setup-status" aria-live="polite">${t('face.setup_intro')}</p>
        <div class="face-setup-gestures" aria-hidden="true">
          <span class="face-setup-chip" data-g="blink">${t('face.gesture_blink')}</span>
          <span class="face-setup-chip" data-g="mouth">${t('face.gesture_mouth')}</span>
          <span class="face-setup-chip" data-g="brows">${t('face.gesture_brows')}</span>
        </div>
        <div class="stt-notice-actions">
          <button class="btn-secondary" id="face-setup-cancel">${t('face.notice_cancel')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const statusEl = overlay.querySelector<HTMLElement>('#face-setup-status')!;
    const detectors = new Map<FaceGesture, GestureDetector>(
      GESTURES.map(g => [g, new GestureDetector(g)])
    );
    let candidate: FaceGesture | null = null;
    let finished = false;

    const finish = (enabled: boolean): void => {
      if (finished) return;
      finished = true;
      unsubscribe();
      overlay.remove();
      faceEngine.release();
      resolve(enabled);
    };

    const highlightChip = (g: FaceGesture | null): void => {
      overlay.querySelectorAll('.face-setup-chip').forEach(el => {
        el.classList.toggle('face-setup-chip--active', el.getAttribute('data-g') === g);
      });
    };

    const unsubscribe = faceEngine.onFrame((f: SignalFrame) => {
      if (finished) return;
      if (!f.present) {
        statusEl.textContent = t('face.no_face');
        return;
      }
      for (const [g, det] of detectors) {
        if (!det.update(f)) continue;
        if (candidate === null || candidate !== g) {
          // First sighting of this gesture — ask to repeat it to confirm
          candidate = g;
          highlightChip(g);
          statusEl.textContent = `${t('face.setup_seen')} — ${t(GESTURE_LABEL_KEY[g])}. ${t('face.setup_repeat')}`;
        } else {
          // Same gesture twice: it chose itself
          faceSwitch.setGesture(g);
          localStorage.setItem(KEY_GESTURE, g);
          localStorage.setItem(KEY_SETUP_DONE, '1');
          const sel = document.getElementById('setting-face-gesture') as HTMLSelectElement | null;
          if (sel) sel.value = g;
          statusEl.textContent = `${t('face.setup_confirmed')} — ${t(GESTURE_LABEL_KEY[g])}`;
          setTimeout(async () => {
            const ok = await faceSwitch.enable();
            finish(ok);
          }, 900);
        }
        return;
      }
    });

    overlay.querySelector('#face-setup-cancel')?.addEventListener('click', () => finish(false));
  });
}

/** Header face button: one visible tap → guided setup (first time) or
    plain on/off (afterwards). Called once from boot(). */
export function initFaceHeaderButton(): void {
  const btn = document.getElementById('face-toggle-btn');
  if (!btn) return;

  const sync = (on: boolean): void => {
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  };
  document.addEventListener('marea:face-state', e => sync((e as CustomEvent).detail.on));
  sync(faceSwitch.enabled);

  let busy = false;
  btn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    try {
      if (faceSwitch.enabled) {
        faceSwitch.disable();
      } else if (isSetupDone()) {
        await faceSwitch.enable();
      } else {
        await runFaceSetup();
      }
    } finally {
      busy = false;
    }
  });
}
