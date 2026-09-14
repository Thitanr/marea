import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildMessage,
  buildSmsUri,
  sendToContact,
  copyMessage,
  SOS_TEMPLATE_KEYS,
} from '../../src/safety/trusted-contact.js';
import { state } from '../../src/state.js';

describe('trusted contact SOS handoff', () => {
  it('exposes exactly the templates defined for i18n', () => {
    expect(SOS_TEMPLATE_KEYS).toEqual(['using_anchor', 'call_me']);
  });

  it('builds a localized message per template, never falling through to the raw key', () => {
    state.lang = 'es';
    for (const key of SOS_TEMPLATE_KEYS) {
      const msg = buildMessage(key);
      expect(msg.length).toBeGreaterThan(0);
      expect(msg.startsWith('safety.')).toBe(false);
    }
  });

  it('builds a valid sms: URI with the message encoded and the phone stripped of formatting', () => {
    const uri = buildSmsUri('+34 600 111 222', 'Hola, ¿me llamas?');
    expect(uri.startsWith('sms:+34600111222?body=')).toBe(true);
    expect(uri).toContain(encodeURIComponent('Hola, ¿me llamas?'));
  });

  it('keeps at most one leading + and drops any other non-digit noise', () => {
    expect(buildSmsUri('34+600 111-222', 'x')).toBe('sms:34600111222?body=x');
    expect(buildSmsUri('+34+600+111+222', 'x')).toBe('sms:+34600111222?body=x');
  });

  describe('sendToContact', () => {
    const contact = { name: 'Ana', phone: '+34600111222' };

    afterEach(() => {
      // @ts-expect-error - remove test doubles so they don't leak between tests
      delete navigator.share;
    });

    it('never touches the network, regardless of which handoff path is taken', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('should not be called'));
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockResolvedValue(undefined),
        configurable: true,
      });
      await sendToContact(contact, 'mensaje');
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('uses navigator.share when available, and reports success without claiming delivery', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      const result = await sendToContact(contact, 'mensaje');
      expect(shareMock).toHaveBeenCalledWith({ text: 'mensaje' });
      expect(result).toEqual({ method: 'share', cancelled: false });
    });

    it('reports cancellation instead of silently falling back to a second app', async () => {
      const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockRejectedValue(abortError),
        configurable: true,
      });
      const result = await sendToContact(contact, 'mensaje');
      expect(result).toEqual({ method: 'share', cancelled: true });
    });

    it('falls back to clicking an sms: link when the Web Share API is unavailable', async () => {
      // Same technique as the existing tel: helpline links — a real anchor
      // click, not a window.location.href assignment (which, on a desktop
      // browser with no sms: handler registered, puts the document through
      // an ambiguous failed top-level navigation instead of a clean handoff).
      let clickedHref = '';
      let wasConnectedAtClickTime = false;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        clickedHref = this.href;
        wasConnectedAtClickTime = this.isConnected;
      });
      const result = await sendToContact(contact, 'mensaje');
      expect(result).toEqual({ method: 'sms', cancelled: false });
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(clickedHref).toBe(buildSmsUri(contact.phone, 'mensaje'));
      // Must be attached to the document at click time — a detached anchor's
      // click doesn't reliably reach the browser's protocol-handler dispatch.
      expect(wasConnectedAtClickTime).toBe(true);
      clickSpy.mockRestore();
    });
  });

  describe('copyMessage', () => {
    afterEach(() => {
      // @ts-expect-error - remove test double so it doesn't leak between tests
      delete navigator.clipboard;
    });

    it('uses the Clipboard API and reports success', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
      const ok = await copyMessage('mensaje');
      expect(writeText).toHaveBeenCalledWith('mensaje');
      expect(ok).toBe(true);
    });

    it('reports failure instead of throwing when the clipboard is unavailable', async () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      const ok = await copyMessage('mensaje');
      expect(ok).toBe(false);
    });
  });
});
