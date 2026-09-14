/* ==========================================================================
   MAREA — Trusted Contact SOS handoff
   Those who are about to Code, we salute you.

   Marea never sends this message itself. It prepares one, entirely on the
   device, and hands it to the user's own messaging app — via the native
   share sheet or an sms: link — so the person decides, every single time,
   whether to actually press send. Nothing in this file makes a network
   request. If that ever stops being true, this file has failed its one job.
   ========================================================================== */

import type { TrustedContact } from '../types.js';
import { t } from '../core/i18n.js';

export type SosTemplateKey = 'using_anchor' | 'call_me';

export const SOS_TEMPLATE_KEYS: readonly SosTemplateKey[] = ['using_anchor', 'call_me'];

export function templateI18nKey(templateKey: SosTemplateKey): string {
  return `safety.template_${templateKey}`;
}

export function buildMessage(templateKey: SosTemplateKey): string {
  return t(templateI18nKey(templateKey));
}

export type SosHandoffMethod = 'share' | 'sms';

export interface SosHandoffResult {
  method: SosHandoffMethod;
  /** true when the user dismissed the native share sheet without sending anything */
  cancelled: boolean;
}

function canUseWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export function buildSmsUri(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}

/**
 * Hands the message off to the device's own messaging app. Never resolves
 * with confirmation of delivery — Marea has no way to know, and must never
 * claim to.
 */
export async function sendToContact(contact: TrustedContact, message: string): Promise<SosHandoffResult> {
  if (canUseWebShare()) {
    try {
      await navigator.share({ text: message });
      return { method: 'share', cancelled: false };
    } catch (err) {
      const cancelled = err instanceof Error && err.name === 'AbortError';
      return { method: 'share', cancelled };
    }
  }
  window.location.href = buildSmsUri(contact.phone, message);
  return { method: 'sms', cancelled: false };
}

/** Manual fallback for environments where neither share nor sms: does anything useful. */
export async function copyMessage(message: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}
