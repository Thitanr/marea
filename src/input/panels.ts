/* ==========================================================================
   MAREA — Input panels: on-screen keyboard + handwriting ("write with finger
   or pencil"). Both write into the same text pad the AAC board uses, then the
   user presses "Say". Everything runs on-device.
   ========================================================================== */

import type { Lang } from '../types.js';
import { t } from '../core/i18n.js';
import { showToast } from '../core/toast.js';
import { state } from '../state.js';
import { buildLayout, isLatinKeyboardLang, wantsCapital, type LayoutMode, type KeyDef } from './layouts.js';
import { backspace, completeWord, insertText, suggest, textBeforeCaret, wordBeforeCaret } from './predict.js';
import { DIGITS, LETTERS, builtinTemplates } from './glyphs.js';
import { extent, normalize, recognize, type Point, type Template, type XY } from './recognizer.js';

const LS_LAYOUT = 'marea_kb_layout';
const LS_HW_DELAY = 'marea_hw_delay';
const LS_HW_USER = 'marea_hw_templates';
const MAX_USER_SAMPLES_PER_CHAR = 4;
/** Normalised $P distance above which a stroke is "not a letter" (tuned in recognizer.test.ts). */
export const REJECT_DISTANCE = 2.2;
const MIN_EXTENT_PX = 14;

type PanelName = 'kb' | 'hw';

const $ = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable: preferences just don't persist */ }
}

/* ------------------------------------------------------------------ */

export interface InputPanels {
  /** Re-render after a language change. */
  refresh(): void;
  close(): void;
  readonly open: PanelName | null;
}

export function initInputPanels(): InputPanels {
  const pad = $<HTMLTextAreaElement>('aac-speech-text');
  const layoutEl = document.querySelector<HTMLElement>('.aac-layout');
  const board = document.querySelector<HTMLElement>('.aac-board-wrapper');
  const kbPanel = $('kb-panel');
  const hwPanel = $('hw-panel');
  const kbBtn = $('kb-open-btn');
  const hwBtn = $('hw-open-btn');
  const kbRows = $('kb-rows');
  const kbSuggest = $('kb-suggest');
  const hwSuggest = $('hw-suggest');
  if (!pad || !layoutEl || !board || !kbPanel || !hwPanel || !kbBtn || !hwBtn || !kbRows) {
    return { refresh() {}, close() {}, open: null };
  }

  let opened: PanelName | null = null;
  let layoutMode: LayoutMode = lsGet(LS_LAYOUT) === 'abc' ? 'abc' : 'qwerty';
  let shiftOnce = false;
  const lang = (): Lang => state.lang;

  const upper = (): boolean => shiftOnce || wantsCapital(textBeforeCaret(pad));

  /* ---- Shared: suggestions ------------------------------------------------ */
  function renderSuggestions(): void {
    const box = opened === 'hw' ? hwSuggest : kbSuggest;
    for (const b of [kbSuggest, hwSuggest]) if (b && b !== box) b.replaceChildren();
    if (!box) return;
    const typed = wordBeforeCaret(pad!);
    // Three big, readable suggestions on phones; four when there is room
    const words = isLatinKeyboardLang(lang()) ? suggest(typed, lang(), window.innerWidth < 460 ? 3 : 4) : [];
    box.replaceChildren(...words.map(word => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'kb-chip';
      const cap = typed !== '' && typed[0] === typed[0]!.toLocaleUpperCase() && typed[0] !== typed[0]!.toLocaleLowerCase();
      const shown = typed === '' && wantsCapital(textBeforeCaret(pad!)) ? word.charAt(0).toLocaleUpperCase() + word.slice(1) : cap ? word.charAt(0).toLocaleUpperCase() + word.slice(1) : word;
      chip.textContent = shown;
      chip.addEventListener('click', () => {
        completeWord(pad!, shown);
        shiftOnce = false;
        onPadChanged();
      });
      return chip;
    }));
  }

  function onPadChanged(): void {
    if (opened === 'kb') updateKeyLabels();
    if (opened) renderSuggestions();
  }
  pad.addEventListener('input', () => { if (opened) onPadChanged(); });

  /* ---- Keyboard ----------------------------------------------------------- */
  function keyAria(k: KeyDef): string {
    if (k.kind === 'shift') return t('kb.shift_aria');
    if (k.kind === 'back') return t('kb.back_aria');
    if (k.kind === 'space') return t('kb.space_aria');
    if (k.kind === 'layout') return t('kb.layout_aria');
    return k.label;
  }

  function buildKeyboard(): void {
    const rows = buildLayout(lang(), layoutMode, upper(), shiftOnce);
    kbRows!.classList.toggle('kb-abc', layoutMode === 'abc');
    kbRows!.replaceChildren(...rows.map(row => {
      const r = document.createElement('div');
      r.className = 'kb-row' + (row.digits ? ' kb-row--digits' : '');
      for (const k of row.keys) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'kb-key' + (k.kind === 'space' ? ' kb-key--space' : '') + (k.kind === 'shift' || k.kind === 'back' || k.kind === 'layout' ? ' kb-key--fn kb-key--wide' : '');
        b.dataset.kind = k.kind;
        b.dataset.value = k.value;
        b.textContent = k.kind === 'space' ? t('kb.space_aria') : k.label;
        b.setAttribute('aria-label', keyAria(k));
        // Keep the text pad's caret/selection: never let a key steal focus on press.
        b.addEventListener('mousedown', e => e.preventDefault());
        b.addEventListener('click', () => pressKey(k));
        r.appendChild(b);
      }
      return r;
    }));
  }

  function updateKeyLabels(): void {
    const up = upper();
    kbRows!.querySelectorAll<HTMLButtonElement>('.kb-key').forEach(b => {
      const kind = b.dataset.kind;
      if (kind === 'char') {
        const v = b.dataset.value ?? '';
        if (/\p{L}/u.test(v)) b.textContent = up ? v.toLocaleUpperCase() : v;
      } else if (kind === 'shift') {
        b.textContent = shiftOnce ? '⇪' : '⇧';
        b.classList.toggle('kb-key--on', shiftOnce);
        b.setAttribute('aria-pressed', String(shiftOnce));
      }
    });
  }

  function pressKey(k: KeyDef): void {
    if (k.kind === 'layout') {
      layoutMode = layoutMode === 'abc' ? 'qwerty' : 'abc';
      lsSet(LS_LAYOUT, layoutMode);
      buildKeyboard();
      renderSuggestions();
      return;
    }
    if (k.kind === 'shift') {
      shiftOnce = !shiftOnce;
    } else if (k.kind === 'back') {
      backspace(pad!);
    } else if (k.kind === 'space') {
      insertText(pad!, ' ');
    } else {
      const isLetter = /\p{L}/u.test(k.value);
      insertText(pad!, isLetter && upper() ? k.value.toLocaleUpperCase() : k.value);
      shiftOnce = false;
    }
    onPadChanged();
  }

  /* ---- Handwriting -------------------------------------------------------- */
  const canvas = $<HTMLCanvasElement>('hw-canvas');
  const progress = $('hw-progress');
  const candBox = $('hw-candidates');
  const modeBtn = $('hw-mode-btn');
  const hint = $('hw-hint');
  const ctx = canvas?.getContext('2d') ?? null;

  const builtins: Template[] = builtinTemplates();
  let userTemplates: Template[] = loadUserTemplates();
  let numbers = false;
  let strokes: XY[][] = [];
  let current: XY[] | null = null;
  let penSeen = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let last: { norm: Point[]; inserted: string } | null = null;

  function loadUserTemplates(): Template[] {
    try {
      const raw = JSON.parse(lsGet(LS_HW_USER) ?? '{}') as Record<string, Array<Array<[number, number, number]>>>;
      const out: Template[] = [];
      for (const [char, samples] of Object.entries(raw)) {
        for (const s of samples) out.push({ char, source: 'user', points: s.map(([x, y, id]) => ({ x, y, id })) });
      }
      return out;
    } catch {
      return [];
    }
  }

  function saveUserTemplate(char: string, norm: Point[]): void {
    const same = userTemplates.filter(u => u.char === char);
    const keep = same.slice(-(MAX_USER_SAMPLES_PER_CHAR - 1));
    userTemplates = [...userTemplates.filter(u => u.char !== char), ...keep, { char, source: 'user', points: norm }];
    const raw: Record<string, Array<Array<[number, number, number]>>> = {};
    for (const u of userTemplates) {
      (raw[u.char] ??= []).push(u.points.map(p => [Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000, p.id]));
    }
    lsSet(LS_HW_USER, JSON.stringify(raw));
  }

  function delayMs(): number {
    const v = Number(lsGet(LS_HW_DELAY));
    return Number.isFinite(v) && v >= 400 && v <= 6000 ? v : 1200;
  }

  function sizeCanvas(): void {
    if (!canvas || !ctx) return;
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function redraw(): void {
    if (!canvas || !ctx) return;
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = getComputedStyle(canvas).color;
    for (const s of [...strokes, ...(current ? [current] : [])]) {
      if (s.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(s[0]!.x, s[0]!.y);
      if (s.length === 1) ctx.lineTo(s[0]!.x + 0.1, s[0]!.y + 0.1);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i]!.x, s[i]!.y);
      ctx.stroke();
    }
  }

  function setProgress(run: boolean): void {
    if (!progress) return;
    progress.style.transition = 'none';
    progress.style.width = '0';
    if (run) {
      void progress.offsetWidth; // restart the transition
      progress.style.transition = `width ${delayMs()}ms linear`;
      progress.style.width = '100%';
    }
  }

  function clearDrawing(): void {
    if (timer) { clearTimeout(timer); timer = null; }
    strokes = [];
    current = null;
    setProgress(false);
    redraw();
  }

  function showCandidates(chars: string[], inserted: string, up: boolean): void {
    if (!candBox) return;
    candBox.replaceChildren(...chars.map((c, i) => {
      const shown = /\p{L}/u.test(c) && !up ? c.toLocaleLowerCase() : c;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hw-cand';
      b.textContent = shown;
      b.addEventListener('click', () => chooseCandidate(shown, i, inserted));
      return b;
    }));
  }

  function chooseCandidate(shown: string, index: number, inserted: string): void {
    if (shown !== inserted && textBeforeCaret(pad!).endsWith(inserted)) {
      backspace(pad!);
      insertText(pad!, shown);
    }
    if (last && index > 0) {
      saveUserTemplate(shown.toLocaleUpperCase(), last.norm);
      showToast(t('hw.learned'));
    }
    last = last ? { ...last, inserted: shown } : last;
    onPadChanged();
  }

  function commit(): void {
    if (timer) { clearTimeout(timer); timer = null; }
    setProgress(false);
    const drawn = strokes.filter(s => s.length > 0);
    if (drawn.length === 0) return;
    if (extent(drawn) < MIN_EXTENT_PX) { clearDrawing(); return; }
    const allow = numbers ? (c: string) => DIGITS.includes(c) : (c: string) => LETTERS.includes(c);
    const ranked = recognize(drawn, [...builtins, ...userTemplates], allow, 3);
    const best = ranked[0];
    if (!best || best.distance > REJECT_DISTANCE) {
      const note = document.createElement('span');
      note.className = 'hw-msg';
      note.textContent = t('hw.none');
      candBox?.replaceChildren(note);
      clearDrawing();
      return;
    }
    const norm = normalize(drawn);
    const isLetter = /\p{L}/u.test(best.char);
    const up = upper(); // decided BEFORE inserting: after "L" the text no longer asks for a capital
    const out = isLetter && !up ? best.char.toLocaleLowerCase() : best.char;
    insertText(pad!, out);
    shiftOnce = false;
    last = { norm, inserted: out };
    showCandidates(ranked.map(c => c.char), out, up);
    clearDrawing();
    onPadChanged();
  }

  function schedule(): void {
    if (timer) clearTimeout(timer);
    setProgress(true);
    timer = setTimeout(commit, delayMs());
  }

  function pt(e: PointerEvent): XY {
    const r = canvas!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', e => {
      sizeCanvas(); // never trust an observer that may not have fired yet: stroke coordinates must match the bitmap
      if (e.pointerType === 'pen') penSeen = true;
      if (penSeen && e.pointerType === 'touch') return; // palm rejection
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic pointers have no capture */ }
      if (timer) { clearTimeout(timer); timer = null; }
      setProgress(false);
      current = [pt(e)];
      redraw();
    });
    canvas.addEventListener('pointermove', e => {
      if (!current) return;
      if (penSeen && e.pointerType === 'touch') return;
      e.preventDefault();
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) current.push(pt(ev));
      redraw();
    });
    const end = (e: PointerEvent): void => {
      if (!current) return;
      if (penSeen && e.pointerType === 'touch') return;
      strokes.push(current);
      current = null;
      redraw();
      schedule();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => sizeCanvas()).observe(canvas);
  }

  function syncHandwritingStatic(): void {
    if (modeBtn) {
      modeBtn.textContent = numbers ? '123' : 'ABC';
      modeBtn.setAttribute('aria-pressed', String(numbers));
      modeBtn.setAttribute('aria-label', t('hw.mode_aria'));
    }
    if (hint) hint.textContent = numbers ? t('hw.hint_digits') : t('hw.hint_letters');
  }
  modeBtn?.addEventListener('click', () => { numbers = !numbers; clearDrawing(); candBox?.replaceChildren(); syncHandwritingStatic(); });
  $('hw-clear-btn')?.addEventListener('click', () => { clearDrawing(); candBox?.replaceChildren(); });
  $('hw-ok-btn')?.addEventListener('click', commit);
  $('hw-space-btn')?.addEventListener('click', () => { commit(); insertText(pad!, ' '); onPadChanged(); });
  $('hw-back-btn')?.addEventListener('click', () => { clearDrawing(); backspace(pad!); candBox?.replaceChildren(); onPadChanged(); });

  /* ---- Opening / closing -------------------------------------------------- */
  function show(name: PanelName | null): void {
    opened = name;
    kbPanel!.classList.toggle('hidden', name !== 'kb');
    hwPanel!.classList.toggle('hidden', name !== 'hw');
    board!.classList.toggle('hidden', name !== null);
    layoutEl!.classList.toggle('input-open', name !== null);
    kbBtn!.setAttribute('aria-expanded', String(name === 'kb'));
    hwBtn!.setAttribute('aria-expanded', String(name === 'hw'));
    kbBtn!.classList.toggle('active', name === 'kb');
    hwBtn!.classList.toggle('active', name === 'hw');
    // Our own keys edit the pad: stop the OS keyboard from covering them.
    pad!.inputMode = name ? 'none' : '';
    if (name === 'kb') buildKeyboard();
    if (name === 'hw') { syncHandwritingStatic(); sizeCanvas(); requestAnimationFrame(sizeCanvas); }
    if (name) renderSuggestions();
    else { clearDrawing(); }
  }

  /** The device's own keyboard is the default: it already speaks the person's language (accents,
   *  corrector, dictation, handwriting on tablets). Marea's large keyboard is opt-in from Settings.
   *  Chinese/Japanese always use the device keyboard (IME). */
  function useDeviceKeyboard(): boolean {
    return !isLatinKeyboardLang(lang()) || lsGet('marea_kb_mode') !== 'marea';
  }

  function toggle(name: PanelName): void {
    if (opened === name) { show(null); return; }
    if (name === 'kb' && useDeviceKeyboard()) {
      show(null);
      if (document.activeElement === pad) { pad!.blur(); return; } // second tap hides it again
      pad!.inputMode = '';
      pad!.lang = lang();
      pad!.focus();
      if (!isLatinKeyboardLang(lang())) showToast(t('kb.system_hint'));
      return;
    }
    show(name);
  }

  // Pressing the button must not steal focus from the text pad, so a second press can tell
  // the device keyboard is open and hide it.
  kbBtn.addEventListener('mousedown', e => e.preventDefault());
  kbBtn.addEventListener('click', () => toggle('kb'));
  hwBtn.addEventListener('click', () => toggle('hw'));
  $('kb-close-btn')?.addEventListener('click', () => show(null));
  $('hw-close-btn')?.addEventListener('click', () => show(null));

  function refresh(): void {
    // Handwriting recognises Latin letters/digits only
    hwBtn!.classList.toggle('hidden', !isLatinKeyboardLang(lang()));
    pad!.lang = lang();
    if (opened === 'hw' && !isLatinKeyboardLang(lang())) show(null);
    if (opened === 'kb' && !isLatinKeyboardLang(lang())) show(null);
    if (opened === 'kb') buildKeyboard();
    if (opened === 'hw') syncHandwritingStatic();
    if (opened) renderSuggestions();
  }
  refresh();

  return {
    refresh,
    close: () => show(null),
    get open() { return opened; },
  };
}
