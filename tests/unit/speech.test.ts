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

  it('never lists or picks a voice that sends text to a server', async () => {
    const { rankedVoices, pickVoice } = await load();
    const names = rankedVoices('es').map(x => x.name);
    expect(rankedVoices('es').every(x => x.localService)).toBe(true);
    expect(names).not.toContain('Microsoft Elvira Online (Natural) - Spanish (Spain)');
    expect(names).not.toContain('Google español');
    expect(pickVoice('es')?.localService).toBe(true);
    // not even if an old preference or a stored flag asks for it
    localStorage.setItem('marea_voice_online', '1');
    localStorage.setItem('marea_voice_es', 'Microsoft Elvira Online (Natural) - Spanish (Spain)');
    expect(rankedVoices('es').map(x => x.name)).not.toContain('Microsoft Elvira Online (Natural) - Spanish (Spain)');
    expect(pickVoice('es')?.localService).toBe(true);
  });

  it('honours the on-device voice the person chose', async () => {
    const { pickVoice } = await load();
    localStorage.setItem('marea_voice_es', 'Microsoft Pablo - Spanish (Spain)');
    expect(pickVoice('es')?.name).toBe('Microsoft Pablo - Spanish (Spain)');
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
