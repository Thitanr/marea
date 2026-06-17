import { i18n } from '../data/i18n-dict.js';
import { state } from '../state.js';

export function t(key: string): string {
  return i18n[state.lang]?.[key] ?? i18n.es?.[key] ?? key;
}

export function tLang(lang: string, key: string): string {
  return (i18n as Record<string, Record<string, string>>)[lang]?.[key] ?? i18n.es?.[key] ?? key;
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

  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria')!;
    el.setAttribute('aria-label', t(key));
  });

  document.documentElement.lang = state.lang;
}
