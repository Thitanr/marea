/* ==========================================================================
   MAREA — Shared TypeScript Interfaces
   Phase 1b: Foundation types for all modules.
   ========================================================================== */

// ===== Language & Theme =====
export type Lang = 'es' | 'en' | 'it' | 'fr' | 'de' | 'zh' | 'pt' | 'ja';
export type Theme = 'deep-sea' | 'warm-sand' | 'high-contrast' | 'monochrome';
export type HandMode = 'right' | 'left' | 'center' | 'motor-right' | 'motor-left' | 'motor-center';

// ===== Chat =====
export type ChatSender = 'system' | 'user';
export type QuickReplyKey = 'underwater' | 'cant_breathe' | 'want_cry' | 'rumination' | 'exhausted' | 'just_stay';
export type IntentKey = 'how' | 'anxiety' | 'speech' | 'default_0' | 'default_1' | 'default_2' | 'default_3' | 'default_4';

export interface ChatMessage {
  text: string;
  sender: ChatSender;
}

// ===== Breathing =====
export type BreathingPhase = 0 | 1 | 2 | 3 | 4;
export type BreathingState = BreathingPhase; // alias: legacy name used in app.js

// ===== Grounding =====
export interface GroundingStep {
  num: number;
  key: string;
}

// ===== AAC =====
export type AacCategory = 'needs' | 'social' | 'emotions';

export interface AacItem {
  icon: string;
  text: string;
  spoken: string;
}

// ===== Journal =====
export interface JournalEntry {
  date: string;
  light: string;
  sound: string;
  pressure: string;
  pain: string;
  rumination: string;
}

// ===== App State =====
export interface AppState {
  lang: Lang;
  theme: Theme;
  handMode: HandMode;
  sensoryMode: boolean;
  activeTab: string;
  activeAnchorSubtab: string;

  // Chat
  chatTimer: ReturnType<typeof setTimeout> | null;
  chatMessages: ChatMessage[];
  lastDefaultIndex: number;

  // Breathing
  breathingInterval: ReturnType<typeof setInterval> | null;
  breathingState: BreathingPhase;
  breathingCycles: number;

  // Grounding
  groundingStep: number;

  // TIPP
  tippTimerInterval: ReturnType<typeof setInterval> | null;
  tippTimeRemaining: number;

  // AAC
  aacActiveCategory: AacCategory;
}

// ===== Data dictionaries =====
export type I18nDict = Record<Lang, Record<string, string>>;
export type AacBoardDict = Record<Lang, Record<AacCategory, AacItem[]>>;
export type SvgIconMap = Record<string, string>;
