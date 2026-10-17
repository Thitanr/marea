import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/* Marea's promise: nothing a person says, writes, draws or looks at leaves their device.
   These tests fail the build if code or configuration starts to break that promise. */

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.js'].includes(extname(full))) out.push(full);
  }
  return out;
}
const SOURCES = walk(join(ROOT, 'src'));

describe('no data leaves the device', () => {
  it('the app code has no way to send data over the network', () => {
    const forbidden = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|RTCPeerConnection)\b\s*[(.]|new\s+(XMLHttpRequest|WebSocket|EventSource|RTCPeerConnection)\b/;
    const offenders = SOURCES.filter(f => forbidden.test(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
    expect(offenders).toEqual([]);
  });

  it('the only external addresses in the code are the ones a person explicitly triggers', () => {
    const allowed = [
      'https://wa.me/',                  // "Avisar": the person taps it and picks the contact
      'https://maps.google.com/?q=',     // location text added to that message only if the person allows GPS
      'https://www.google.com',          // quick exit: leave the page
    ];
    const urls = SOURCES.flatMap(f => readFileSync(f, 'utf8').match(/https?:\/\/[^\s"'`)<>]+/g) ?? []);
    const unexpected = urls.filter(u => !allowed.some(a => u.startsWith(a)));
    expect(unexpected).toEqual([]);
  });

  it('the page loads nothing from other origins', () => {
    const html = read('index.html');
    const loaders = html.match(/<(script|link|img|iframe|source|video|audio)\b[^>]*\b(src|href)="https?:\/\/[^"]+"/g) ?? [];
    // only the canonical link (an address, not a resource) may be absolute
    const bad = loaders.filter(l => !/rel="canonical"/.test(l) && !/rel="alternate"/.test(l));
    expect(bad).toEqual([]);
    expect(html).not.toMatch(/\sstyle="/);
    expect(html).not.toMatch(/\son[a-z]+="/);
  });

  it('the service worker never contacts another origin', () => {
    const sw = read('public/service-worker.js');
    expect(sw).toMatch(/url\.origin !== self\.location\.origin\) return/);
    expect(sw).not.toMatch(/https?:\/\//);
  });

  it('the headers keep the browser from connecting anywhere else', () => {
    const csp = /Content-Security-Policy: (.+)/.exec(read('public/_headers'))?.[1] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    // 'wasm-unsafe-eval' (the on-device vision model) is the only allowed relative of eval
    expect(csp).not.toMatch(/unsafe-inline|(?<!wasm-)unsafe-eval|https?:|\*/);
    const pp = /Permissions-Policy: (.+)/.exec(read('public/_headers'))?.[1] ?? '';
    expect(pp).toContain('microphone=()');
    expect(read('public/_headers')).toContain('Referrer-Policy: no-referrer');
  });

  it('no server-side voices: speech never streams text to a service', () => {
    const speech = read('src/core/speech.ts');
    expect(speech).toMatch(/filter\(v => v\.localService\)/);
    expect(speech).not.toMatch(/marea_voice_online|allowsOnlineVoices/);
  });

  it('nothing is bundled that phones home', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
    const deps = Object.keys(pkg.dependencies ?? {});
    // the only runtime dependency allowed is the on-device vision model
    expect(deps.filter(d => d !== '@mediapipe/tasks-vision')).toEqual([]);
  });
});
