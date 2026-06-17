/* ==========================================================================
   MAREA — Reactive Typed State Singleton
   Phase 1c: Single source of truth for all runtime state.
   Persisted fields hydrate from localStorage on import.
   ========================================================================== */

import type { AppState, Lang, Theme, HandMode, FontSize, AacCategory } from './types.js';

// ---- Persisted settings ----
function loadPersisted(): Pick<AppState, 'lang' | 'theme' | 'handMode' | 'sensoryMode' | 'fontSize' | 'reduceMotion'> {
  return {
    lang: (localStorage.getItem('marea_lang') as Lang) || 'es',
    theme: (localStorage.getItem('marea_theme') as Theme) || 'deep-sea',
    handMode: (localStorage.getItem('marea_hand') as HandMode) || 'right',
    sensoryMode: localStorage.getItem('marea_sensory') === 'true',
    fontSize: (localStorage.getItem('marea_fontsize') as FontSize) || 'normal',
    reduceMotion: localStorage.getItem('marea_reduce_motion') === 'true',
  };
}

const persisted = loadPersisted();

// ---- Singleton state ----
const state: AppState = {
  ...persisted,

  activeTab: 'refugio',
  activeAnchorSubtab: 'breathe',

  // Chat
  chatTimer: null,
  chatMessages: [],
  lastDefaultIndex: 0,

  // Breathing
  breathingInterval: null,
  breathingState: 0,
  breathingCycles: 0,

  // Grounding
  groundingStep: 0,

  // TIPP
  tippTimerInterval: null,
  tippTimeRemaining: 300, // 5 minutes

  // AAC
  aacActiveCategory: 'needs' as AacCategory,
};

// ---- Named persist helpers (call after mutation) ----
export function persistLang(lang: Lang): void {
  localStorage.setItem('marea_lang', lang);
}

export function persistTheme(theme: Theme): void {
  localStorage.setItem('marea_theme', theme);
}

export function persistHandMode(mode: HandMode): void {
  localStorage.setItem('marea_hand', mode);
}

export function persistSensoryMode(enabled: boolean): void {
  localStorage.setItem('marea_sensory', String(enabled));
}

export function persistFontSize(size: FontSize): void {
  localStorage.setItem('marea_fontsize', size);
}

export function persistReduceMotion(enabled: boolean): void {
  localStorage.setItem('marea_reduce_motion', String(enabled));
}

export { state };
export type { AppState };
