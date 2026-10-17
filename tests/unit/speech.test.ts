import { describe, it, expect, beforeEach } from 'vitest';

type FakeVoice = { name: string; lang: string; voiceURI: string; localService: boolean; default: boolean };
const v = (name: string, lang: string, localService = true, def = false): FakeVoice => ({ name, lang, voiceURI: name, localService, default: def });

const VOICES: FakeVoice[] = [
  v('Microsoft Helena - Spanish (Spain)', 'es-ES'),
  v('Microsoft Pablo - Spanish (Spain)', 'es-ES'),
  v('Microsoft Elvira Online (Natural) - Spanish (Spain)', 'es-ES', false),
  v('Google español', 'es-ES', false),
  v('Mónica', 'es-ES'),
  v('Paulina (Enhanced)', 'es-MX'),
  v('eSpeak Spanish', 'es'),
  v('Microsoft David - English (United States)', 'en-US'),
];

const spoken: Array<{ text: string; voice?: string; rate: number; lang: string }> = [];

beforeEach(() => {
  localStorage.clear();
  spoken.length = 0;
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
    getVoices: () => VOICES,
    addEventListener: () => {},
    cancel: () => {},
    speak: (u: { text: string; voice?: { name: string }; rate: number; lang: string }) => spoken.push({ text: u.text, voice: u.voice?.name, rate: u.rate, lang: u.lang }),
  };
  (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
    text: string; voice?: unknown; rate = 1; pitch = 1; volume = 1; lang = '';
    constructor(text: string) { this.text = text; }
  };
});

async function load() {
  const speech = await import('../../src/core/speech.js');
  speech.warmVoices();
  return speech;
}

describe('voice selection', () => {
  it('prefers a natural/enhanced on-device voice over robotic ones', async () => {
    const { rankedVoices } = await load();
    const names = rankedVoices('es').map(x => x.name);
    expect(names[0]).toMatch(/Paulina|Mónica/); // pleasant local voices first
    expect(names.indexOf('eSpeak Spanish')).toBe(names.length - 1);
  });

  it('never uses a voice that sends text to a server unless the person allows it', async () => {
    const { rankedVoices, pickVoice } = await load();
    expect(rankedVoices('es').every(x => x.localService)).toBe(true);
    expect(pickVoice('es')?.localService).toBe(true);
    localStorage.setItem('marea_voice_online', '1');
    const withOnline = rankedVoices('es').map(x => x.name);
    expect(withOnline).toContain('Microsoft Elvira Online (Natural) - Spanish (Spain)');
    // The typical Windows case: once allowed, the natural online voice beats the robotic built-in ones
    expect(withOnline.indexOf('Microsoft Elvira Online (Natural) - Spanish (Spain)')).toBeLessThan(withOnline.indexOf('Microsoft Helena - Spanish (Spain)'));
  });

  it('honours the voice the person chose, but not an online one while online is off', async () => {
    const { pickVoice } = await load();
    localStorage.setItem('marea_voice_es', 'Microsoft Pablo - Spanish (Spain)');
    expect(pickVoice('es')?.name).toBe('Microsoft Pablo - Spanish (Spain)');
    localStorage.setItem('marea_voice_es', 'Google español');
    expect(pickVoice('es')?.localService).toBe(true);
  });

  it('only offers voices of the right language', async () => {
    const { rankedVoices } = await load();
    expect(rankedVoices('en').map(x => x.name)).toEqual(['Microsoft David - English (United States)']);
    expect(rankedVoices('ja')).toEqual([]);
  });
});

describe('speaking', () => {
  it('speaks with the picked voice at the saved speed, a little slower for calm replies', async () => {
    const { speak, savedRate } = await load();
    speak('Hola', 'es');
    expect(spoken[0]!.voice).toMatch(/Paulina|Mónica/);
    expect(spoken[0]!.rate).toBeCloseTo(savedRate(), 5);
    localStorage.setItem('marea_voice_rate', '0.75');
    speak('Hola', 'es', { speedFactor: 0.9 });
    expect(spoken[1]!.rate).toBeCloseTo(0.675, 3);
  });

  it('ignores empty text and keeps speaking when no voice exists for the language', async () => {
    const { speak } = await load();
    speak('   ', 'es');
    expect(spoken).toHaveLength(0);
    speak('こんにちは', 'ja');
    expect(spoken[0]!.voice).toBeUndefined();
    expect(spoken[0]!.lang).toBe('ja-JP');
  });
});
