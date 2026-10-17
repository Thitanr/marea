import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/* WCAG 2.1 AA colour contrast, every theme x every tab (+ the keyboard/handwriting
   panels and the emergency card). Run with: npm run test:a11y  */

const THEMES = ['deep-sea', 'warm-sand', 'high-contrast', 'monochrome'] as const;
const TABS = ['voz', 'ancla', 'seguridad', 'diario', 'sintonia', 'refugio', 'settings'] as const;

async function boot(page: Page, theme: string, lang = 'es') {
  await page.addInitScript(({ theme, lang }) => {
    localStorage.setItem('marea_onboarded', '1');
    localStorage.setItem('marea_lang', lang);
    localStorage.setItem('marea_theme', theme);
    localStorage.setItem('marea_scan_onboarded', '1');
  }, { theme, lang });
  await page.goto('/');
  // Let entry animations finish so we measure final colours, not mid-fade ones
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important;animation:none !important}' });
}

async function contrastViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  return results.violations.flatMap(v => v.nodes.map(n => `${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`));
}

for (const theme of THEMES) {
  test.describe(`contrast: ${theme}`, () => {
    for (const tab of TABS) {
      test(`tab ${tab}`, async ({ page }) => {
        await boot(page, theme);
        await page.locator(`#nav-${tab}`).click();
        if (tab === 'ancla') await page.locator('#btn-subtab-tipp').click();
        expect(await contrastViolations(page)).toEqual([]);
      });
    }

    test('keyboard panel', async ({ page }) => {
      await boot(page, theme);
      await page.locator('#kb-open-btn').click();
      expect(await contrastViolations(page)).toEqual([]);
    });

    test('handwriting panel', async ({ page }) => {
      await boot(page, theme);
      await page.locator('#hw-open-btn').click();
      expect(await contrastViolations(page)).toEqual([]);
    });

    test('emergency card with call buttons', async ({ page }) => {
      await boot(page, theme);
      await page.locator('#nav-refugio').click();
      await page.locator('.alz-btn-emergency').click();
      expect(await contrastViolations(page)).toEqual([]);
    });
  });
}
