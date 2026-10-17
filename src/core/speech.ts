/* ==========================================================================
   MAREA — Speech: the best voice the device really has, never a surprise.
   - Prefers voices that run ON the device (private, work offline) and that
     sound natural (neural / premium / enhanced / Siri / known good names).
   - Voices that send the text to a server ("online") are NEVER offered: Marea's
     promise is that nothing the person says or writes leaves the device.
   - The person (or a carer) can pick any installed voice and the speed.
   ========================================================================== */

import type { Lang } from '../types.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { state } from '../state.js';

export const LOCALE: Record<Lang, string> = {
  es: 'es-ES', en: 'en-GB', it: 'it-IT', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN', pt: 'pt-PT', ja: 'ja-JP',
};

const LS_VOICE = 'marea_voice_';        // + lang -> voiceURI
const LS_RATE = 'marea_voice_rate';
export const DEFAULT_RATE = 0.92;

const lsGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* preference simply isn't remembered */ } };

const synth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

let cache: SpeechSynthesisVoice[] = [];
function refreshCache(): void {
  const s = synth();
  if (s) cache = s.getVoices();
}

/** Call once at boot: browsers load voices asynchronously. */
export function warmVoices(): void {
  const s = synth();
  if (!s) return;
  refreshCache();
  s.addEventListener?.('voiceschanged', () => { refreshCache(); refreshVoiceSettings(); });
}

export const savedRate = (): number => {
  const v = Number(lsGet(LS_RATE));
  return Number.isFinite(v) && v >= 0.5 && v <= 1.6 ? v : DEFAULT_RATE;
};

/* ---- voice quality heuristics --------------------------------------------- */

const NATURAL = /natural|neural|premium|enhanced|wavenet|studio|siri|multilingual/i;
const ROBOTIC = /espeak|festival|flite|compact|desktop|pico/i;
// Voices widely regarded as pleasant on their platforms (macOS / iOS / Android / Windows)
const WELL_KNOWN = /\b(m[oó]nica|paulina|jorge|marisol|diego|samantha|daniel|karen|moira|serena|am[eé]lie|thomas|audrey|alice|federica|luca|anna|petra|yannick|luciana|joana|catarina|kyoko|ting-ting|mei-jia|helena|elvira|alvaro|jenny|aria|denise|katja|conrad)\b/i;

export function scoreVoice(v: SpeechSynthesisVoice, lang: Lang): number {
  const want = LOCALE[lang].toLowerCase();
  const vl = v.lang.replace('_', '-').toLowerCase();
  let s = 0;
  if (vl === want) s += 30;
  else if (vl.startsWith(want.slice(0, 2))) s += 10;
  if (v.localService) s += 40;
  if (NATURAL.test(v.name)) s += 60;
  if (WELL_KNOWN.test(v.name)) s += 15;
  if (ROBOTIC.test(v.name)) s -= 40;
  if (v.default) s += 3;
  return s;
}

/** Voices for a language, best first. Only voices that run on the device: a voice with
 *  `localService === false` streams the text to a server, so it is never listed or picked. */
export function rankedVoices(lang: Lang): SpeechSynthesisVoice[] {
  const prefix = LOCALE[lang].slice(0, 2).toLowerCase();
  return cache
    .filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(prefix))
    .filter(v => v.localService)
    .sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang) || a.name.localeCompare(b.name));
}

export function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const list = rankedVoices(lang);
  const chosen = lsGet(LS_VOICE + lang);
  if (chosen) {
    const mine = list.find(v => v.voiceURI === chosen);
    if (mine) return mine;
  }
  return list[0];
}

/* ---- speaking ---------------------------------------------------------------- */

export interface SpeakOptions {
  /** Multiplier on the saved speed: 0.88 for the calmer Alzheimer replies. */
  speedFactor?: number;
}

export function speak(text: string, lang: Lang = state.lang, opts: SpeakOptions = {}): void {
  const s = synth();
  if (!s || !text || !text.trim()) return;
  if (cache.length === 0) refreshCache();
  s.cancel();
  const u = new SpeechSynthesisUtterance(text.trim());
  const voice = pickVoice(lang);
  if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = LOCALE[lang]; }
  u.rate = Math.min(1.6, Math.max(0.5, savedRate() * (opts.speedFactor ?? 1)));
  u.pitch = 1;
  u.volume = 1;
  s.speak(u);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

/* ---- Settings UI ---------------------------------------------------------------- */

const $ = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

export function refreshVoiceSettings(): void {
  const select = $<HTMLSelectElement>('setting-voice');
  const note = $('voice-note');
  if (!select) return;
  const lang = state.lang;
  const list = rankedVoices(lang);
  const saved = lsGet(LS_VOICE + lang) ?? '';
  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = t('settings.voice_auto');
  const opts = list.slice(0, 12).map(v => {
    const o = document.createElement('option');
    o.value = v.voiceURI;
    o.textContent = `${v.name} · ${t('settings.voice_local')}`;
    return o;
  });
  select.replaceChildren(auto, ...opts);
  select.value = list.some(v => v.voiceURI === saved) ? saved : '';
  if (note) {
    note.textContent = list.length === 0 ? t('settings.voice_none') : '';
    note.classList.toggle('hidden', list.length > 0 ? true : false);
  }
}

export function initVoiceSettings(): void {
  const select = $<HTMLSelectElement>('setting-voice');
  const rate = $<HTMLSelectElement>('setting-voice-rate');
  const test = $('btn-voice-test');
  if (!select) return;

  if (rate) {
    const r = savedRate();
    const values = [...rate.options].map(o => Number(o.value));
    rate.value = String(values.reduce((best, v) => (Math.abs(v - r) < Math.abs(best - r) ? v : best), values[0] ?? DEFAULT_RATE));
    rate.addEventListener('change', () => { lsSet(LS_RATE, rate.value); });
  }
  select.addEventListener('change', () => {
    lsSet(LS_VOICE + state.lang, select.value);
  });
  test?.addEventListener('click', () => {
    if (!synth()) { showToast(t('settings.voice_none')); return; }
    speak(t('settings.voice_sample'));
  });
  refreshVoiceSettings();
}
