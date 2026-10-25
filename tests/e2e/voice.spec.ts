import { test, expect, type Page } from '@playwright/test';

/** Open the app as an already-onboarded user (so the welcome overlay is not in the way). */
async function openApp(page: Page, opts: { lang?: string; hand?: string; theme?: string; kb?: 'device' | 'marea' } = {}) {
  await page.addInitScript(({ lang, hand, theme, kb }) => {
    localStorage.setItem('marea_onboarded', '1');
    localStorage.setItem('marea_lang', lang);
    localStorage.setItem('marea_hand', hand);
    localStorage.setItem('marea_theme', theme);
    localStorage.setItem('marea_scan_onboarded', '1');
    localStorage.setItem('marea_kb_mode', kb);
    // Record speech instead of making sound
    (window as unknown as { __spoken: string[] }).__spoken = [];
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      (window as unknown as { __spoken: string[] }).__spoken.push(u.text);
    };
  }, { lang: opts.lang ?? 'es', hand: opts.hand ?? 'center', theme: opts.theme ?? 'deep-sea', kb: opts.kb ?? 'marea' });
  await page.goto('/');
  await expect(page.locator('#aac-grid .aac-card-btn')).toHaveCount(24);
}

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
const pad = (page: Page) => page.locator('#aac-speech-text');

test.describe('Motor mode (the Aphasia profile) — REAL clicks must work', () => {
  for (const hand of ['motor-center', 'motor-right', 'motor-left']) {
    test(`${hand}: tapping a card speaks it and fills the pad`, async ({ page }) => {
      await openApp(page, { hand });
      await page.locator('#aac-grid [data-id="pain"]').click();
      expect(await spoken(page)).toContain('Me duele. Necesito ayuda');
      await expect(pad(page)).toHaveValue('Me duele');
    });

    test(`${hand}: the bottom navigation still navigates`, async ({ page }) => {
      await openApp(page, { hand });
      await page.locator('#nav-settings').click();
      await expect(page.locator('#tab-settings')).toHaveClass(/active/);
      await page.locator('#nav-voz').click();
      await expect(page.locator('#tab-voz')).toHaveClass(/active/);
    });
  }

  test('an accidental double tap counts once (tremor guard)', async ({ page }) => {
    await openApp(page, { hand: 'motor-center' });
    await page.locator('#aac-grid [data-id="yes"]').dblclick();
    await expect(pad(page)).toHaveValue('Sí');
    expect(await spoken(page)).toHaveLength(1);
  });

  test('the tap guard can be switched off in Settings (and the choice is remembered)', async ({ page }) => {
    await openApp(page, { hand: 'motor-center' });
    await page.locator('#nav-settings').click();
    await page.locator('#setting-tap-guard').selectOption('0');
    await page.reload();
    await expect(page.locator('#aac-grid .aac-card-btn')).toHaveCount(24);
    await page.locator('#nav-settings').click();
    await expect(page.locator('#setting-tap-guard')).toHaveValue('0');
    await page.locator('#nav-voz').click();
    await page.locator('#aac-grid [data-id="yes"]').dblclick();
    expect((await spoken(page)).length).toBeGreaterThanOrEqual(2);
  });

  test('a longer tap guard also blocks a slower second tap', async ({ page }) => {
    await openApp(page, { hand: 'motor-center' });
    await page.locator('#nav-settings').click();
    await page.locator('#setting-tap-guard').selectOption('1200');
    await page.locator('#nav-voz').click();
    const yes = page.locator('#aac-grid [data-id="yes"]');
    await yes.click();
    await page.waitForTimeout(700); // slower than the normal 0.4 s guard, inside 1.2 s
    await yes.click();
    expect(await spoken(page)).toHaveLength(1);
  });

  test('scanning speed is a setting that is remembered', async ({ page }) => {
    await openApp(page, { hand: 'motor-center' });
    await page.locator('#nav-settings').click();
    await expect(page.locator('#setting-scan-speed')).toHaveValue('1'); // unchanged default
    await page.locator('#setting-scan-speed').selectOption('2');
    await page.reload();
    await page.locator('#nav-settings').click();
    await expect(page.locator('#setting-scan-speed')).toHaveValue('2');
  });
});

test.describe('Layout never pushes a button off screen', () => {
  for (const width of [320, 360, 390, 412]) {
    for (const lang of ['es', 'en', 'it', 'fr', 'de', 'zh', 'pt', 'ja']) {
      test(`${width}px / ${lang}: tools row fits inside the screen`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await openApp(page, { lang });
        for (const id of ['btn-aac-clear', 'kb-open-btn', 'hw-open-btn', 'eye-gaze-btn', 'btn-aac-speak']) {
          const box = await page.locator('#' + id).boundingBox();
          if (!box) continue; // handwriting is hidden for zh/ja on purpose
          expect(box.x, `${id} starts off-screen`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${id} ends off-screen`).toBeLessThanOrEqual(width + 0.5);
        }
      });
    }
  }
});

test.describe('Board', () => {
  test('one board, most urgent first, fixed positions', async ({ page }) => {
    await openApp(page);
    const ids = await page.locator('#aac-grid .aac-card-btn').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.id));
    expect(ids.slice(0, 6)).toEqual(['yes', 'no', 'help', 'pain', 'sick', 'bathroom']);
    await expect(page.locator('.aac-cat-btn')).toHaveCount(0); // no category tabs any more
  });

  test('the emergency card offers a real phone call', async ({ page }) => {
    await openApp(page);
    await page.locator('#nav-refugio').click();
    await page.locator('.alz-btn-emergency').click();
    await expect(page.locator('#alz-call-row a[href="tel:112"]')).toBeVisible();
  });
});

test.describe('Keyboard + handwriting', () => {
  test('by default the Keyboard button opens the DEVICE keyboard (the text pad gets focus)', async ({ page }) => {
    await openApp(page, { kb: 'device' });
    await page.locator('#kb-open-btn').click();
    await expect(pad(page)).toBeFocused();
    await expect(page.locator('#kb-panel')).toBeHidden();
    expect(await pad(page).evaluate(e => (e as HTMLTextAreaElement).lang)).toBe('es');
    await page.locator('#kb-open-btn').click(); // second tap hides it again
    await expect(pad(page)).not.toBeFocused();
  });

  test('on-screen keyboard types with real taps, auto-capital and word suggestions', async ({ page }) => {
    await openApp(page);
    await page.locator('#kb-open-btn').click();
    for (const k of 'hola') await page.locator(`#kb-rows .kb-key[data-value="${k}"]`).click();
    await expect(pad(page)).toHaveValue('Hola');
    await page.locator('#kb-rows .kb-key[data-kind="space"]').click();
    await expect(page.locator('#kb-suggest .kb-chip').first()).toBeVisible();
    await page.locator('#kb-rows .kb-key[data-kind="back"]').click();
    await expect(pad(page)).toHaveValue('Hola');
  });

  test('Spanish keyboard has ñ and accented vowels', async ({ page }) => {
    await openApp(page);
    await page.locator('#kb-open-btn').click();
    for (const k of ['ñ', 'á', 'é', 'í', 'ó', 'ú']) {
      await expect(page.locator(`#kb-rows .kb-key[data-value="${k}"]`)).toBeVisible();
    }
  });

  test('handwriting: a finger/pen/mouse-drawn L becomes text, under the pointer', async ({ page }) => {
    await openApp(page);
    await page.locator('#hw-open-btn').click();
    const box = (await page.locator('#hw-canvas').boundingBox())!;
    const x = box.x + box.width * 0.35, top = box.y + box.height * 0.2, bottom = box.y + box.height * 0.8;
    await page.mouse.move(x, top);
    await page.mouse.down();
    await page.mouse.move(x, bottom, { steps: 12 });
    await page.mouse.up();
    await page.mouse.move(x, bottom);
    await page.mouse.down();
    await page.mouse.move(x + box.width * 0.3, bottom, { steps: 12 });
    await page.mouse.up();
    await page.locator('#hw-ok-btn').click();
    await expect(pad(page)).toHaveValue(/^[Ll]$/);
    await expect(page.locator('#hw-candidates .hw-cand')).toHaveCount(3);
  });

  test('handwriting is not offered for Chinese/Japanese (the device keyboard is used)', async ({ page }) => {
    await openApp(page, { lang: 'ja' });
    await expect(page.locator('#hw-open-btn')).toBeHidden();
  });
});

test.describe('Journal notebook', () => {
  test('the pen draws where the pointer is, even on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await openApp(page);
    await page.locator('#nav-diario').click();
    const canvas = page.locator('#notebook-draw-canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10, { steps: 20 });
    await page.mouse.up();
    // The bitmap must match the visible size, and ink must reach the far corner.
    const result = await canvas.evaluate((c: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1;
      const r = c.getBoundingClientRect();
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let maxX = 0, maxY = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]! > 20) { if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
      return { bitmapW: c.width / dpr, cssW: r.width, inkX: maxX / dpr, inkY: maxY / dpr, cssH: r.height };
    });
    expect(Math.abs(result.bitmapW - result.cssW)).toBeLessThan(2);
    expect(result.inkX).toBeGreaterThan(result.cssW - 20);
    expect(result.inkY).toBeGreaterThan(result.cssH - 20);
  });
});

test.describe('Contact button', () => {
  test('the phone is optional when the device share sheet is available', async ({ page }) => {
    await page.addInitScript(() => { (navigator as unknown as { share: unknown }).share = async () => {}; });
    await openApp(page);
    await page.locator('#nav-seguridad').click();
    await expect(page.locator('#btn-reach-contact')).toHaveAttribute('aria-disabled', 'false');
  });
});
