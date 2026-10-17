import { test, expect } from '@playwright/test';

/* Runtime proof of the promise: while a person uses every tab, speaks, types, draws and
   writes in the notebook, the browser makes requests ONLY to Marea's own origin. */
test('using the whole app sends nothing to any other origin', async ({ page }) => {
  const origin = 'http://127.0.0.1:4173';
  const foreign: string[] = [];
  const posts: string[] = [];
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:')) foreign.push(`${r.method()} ${u}`);
    if (r.method() !== 'GET' && !u.startsWith('blob:')) posts.push(`${r.method()} ${u}`);
  });
  await page.addInitScript(() => {
    localStorage.setItem('marea_onboarded', '1');
    localStorage.setItem('marea_lang', 'es');
    localStorage.setItem('marea_scan_onboarded', '1');
    window.speechSynthesis.speak = () => {};
  });
  await page.goto('/');
  await expect(page.locator('#aac-grid .aac-card-btn')).toHaveCount(24);

  await page.locator('#aac-grid [data-id="pain"]').click();
  await page.locator('#aac-speech-text').fill('Quiero agua, por favor');
  for (const tab of ['ancla', 'seguridad', 'diario', 'sintonia', 'refugio', 'settings', 'voz']) {
    await page.locator(`#nav-${tab}`).click();
  }
  await page.waitForTimeout(500);

  expect(foreign).toEqual([]);
  expect(posts).toEqual([]);
});
