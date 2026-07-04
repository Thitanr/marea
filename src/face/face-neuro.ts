/* ==========================================================================
   MAREA — Facial Neurofeedback ("Calma Facial")
   The face replaces electrodes: brow-knit, eye-squint and lip-press
   blendshapes (calibrated against the user's own resting face) become a
   live relaxation signal. The bioluminescent ring grows and cools as the
   face lets go. Sessions are logged locally, like the perceptive journal.
   ========================================================================== */

import { faceEngine, FaceEngineException } from './face-engine.js';
import { TensionMeter, type SignalFrame } from './face-signals.js';
import { ensureFaceConsent } from './face-consent.js';
import { t } from '../core/i18n.js';
import { showToast } from '../core/toast.js';

const LOG_KEY = 'marea_neuro_logs';

let running = false;
let meter: TensionMeter | null = null;
let unsubscribe: (() => void) | null = null;
let startedAt = 0;
let calmSum = 0;
let calmCount = 0;
let lastUiUpdate = 0;

function els() {
  return {
    ring: document.getElementById('neuro-ring'),
    value: document.getElementById('neuro-ring-value'),
    status: document.getElementById('neuro-status'),
    btnStart: document.getElementById('btn-neuro-start'),
    btnStop: document.getElementById('btn-neuro-stop'),
  };
}

function onFrame(f: SignalFrame): void {
  const { ring, value, status } = els();
  if (!meter || !ring || !value || !status) return;

  const s = meter.update(f);
  const now = performance.now();
  if (now - lastUiUpdate < 120) return; // ~8 UI updates/s is plenty
  lastUiUpdate = now;

  if (!f.present) {
    status.textContent = t('face.no_face');
    return;
  }
  if (s.calibrating) {
    status.textContent = t('neuro.calibrating');
    value.textContent = '…';
    return;
  }

  calmSum += s.calm;
  calmCount++;

  // Ring: contracts and warms with tension, expands and cools with calm
  const scale = 0.55 + s.calm * 0.65;
  const hue = 45 + s.calm * 125; // 45 amber (tense) → 170 teal (calm)
  ring.style.transform = `scale(${scale.toFixed(3)})`;
  ring.style.background =
    `radial-gradient(circle, hsla(${hue.toFixed(0)}, 85%, 60%, ${0.18 + s.calm * 0.25}) 0%, hsla(${hue.toFixed(0)}, 80%, 45%, 0.06) 70%)`;
  ring.style.boxShadow = `0 0 ${(12 + s.calm * 38).toFixed(0)}px hsla(${hue.toFixed(0)}, 85%, 55%, ${0.25 + s.calm * 0.35})`;

  value.textContent = `${Math.round(s.calm * 100)}%`;
  status.textContent =
    s.tension > 0.45 ? t('neuro.state_tense')
    : s.tension > 0.2 ? t('neuro.state_release')
    : t('neuro.state_calm');
}

export async function startNeuroSession(): Promise<void> {
  if (running) return;
  if (!(await ensureFaceConsent())) return;

  showToast(t('face.loading'));
  try {
    await faceEngine.acquire();
  } catch (err) {
    const code = err instanceof FaceEngineException ? err.code : 'assets';
    showToast(t(code === 'camera' ? 'face.error_camera' : 'face.error_assets'));
    return;
  }

  running = true;
  meter = new TensionMeter();
  startedAt = Date.now();
  calmSum = 0;
  calmCount = 0;
  unsubscribe = faceEngine.onFrame(onFrame);

  const { btnStart, btnStop, status } = els();
  btnStart?.classList.add('hidden');
  btnStop?.classList.remove('hidden');
  if (status) status.textContent = t('neuro.calibrating');
}

export function stopNeuroSession(): void {
  if (!running) return;
  running = false;
  unsubscribe?.();
  unsubscribe = null;
  meter = null;
  faceEngine.release();

  const { ring, value, status, btnStart, btnStop } = els();
  btnStart?.classList.remove('hidden');
  btnStop?.classList.add('hidden');
  if (ring) {
    ring.style.transform = '';
    ring.style.background = '';
    ring.style.boxShadow = '';
  }

  const durationS = Math.round((Date.now() - startedAt) / 1000);
  if (calmCount > 0 && durationS >= 10) {
    const avgCalm = Math.round((calmSum / calmCount) * 100);
    let logs: unknown[];
    try { logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
    catch { logs = []; }
    logs.push({ date: new Date().toISOString(), seconds: durationS, avgCalm });
    try { localStorage.setItem(LOG_KEY, JSON.stringify(logs)); } catch { /* storage full — session still happened */ }
    if (status) status.textContent = `${t('neuro.saved')} · ${t('neuro.calm')} ${avgCalm}%`;
    if (value) value.textContent = `${avgCalm}%`;
    showToast(t('neuro.saved'));
  } else if (status) {
    status.textContent = t('neuro.ready');
    if (value) value.textContent = '–';
  }
}

export function isNeuroRunning(): boolean {
  return running;
}

/** Wire buttons. Called once from boot(). */
export function initNeuro(): void {
  const { btnStart, btnStop } = els();
  btnStart?.addEventListener('click', () => { startNeuroSession(); });
  btnStop?.addEventListener('click', stopNeuroSession);
}
