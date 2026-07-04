/* ==========================================================================
   MAREA — Camera consent (shared by Face Control & Neurofeedback)
   Same pattern and CSS as the STT notice. Camera never streams anywhere:
   consent is about turning the camera ON, not about sending data (none is).
   ========================================================================== */

import { t } from '../core/i18n.js';

const KEY_OK = 'marea_face_ok';

export function hasFaceConsent(): boolean {
  return localStorage.getItem(KEY_OK) === '1';
}

export function ensureFaceConsent(): Promise<boolean> {
  if (hasFaceConsent()) return Promise.resolve(true);
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'stt-overlay';
    overlay.innerHTML = `
      <div class="stt-notice" role="dialog" aria-modal="true">
        <p class="stt-notice-text">${t('face.notice_text')}</p>
        <div class="stt-notice-actions">
          <button class="btn-secondary" id="face-consent-cancel">${t('face.notice_cancel')}</button>
          <button class="btn-primary" id="face-consent-accept">${t('face.notice_accept')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#face-consent-accept')?.addEventListener('click', () => {
      localStorage.setItem(KEY_OK, '1');
      overlay.remove();
      resolve(true);
    });
    overlay.querySelector('#face-consent-cancel')?.addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
  });
}
