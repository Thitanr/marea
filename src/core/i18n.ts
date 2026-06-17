import { i18n } from '../data/i18n-dict.js';
import { state } from '../state.js';

export function t(key: string): string {
  return i18n[state.lang]?.[key] ?? i18n.es?.[key] ?? key;
}

export function translateDOM(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')!;
    const text = t(key);
    const svg = el.querySelector('svg');
    if (svg) {
      el.innerHTML = '';
      el.appendChild(svg);
      el.appendChild(document.createTextNode(' ' + text));
    } else {
      el.textContent = text;
    }
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')!;
    el.setAttribute('placeholder', t(key));
  });

  document.documentElement.lang = state.lang;
}
