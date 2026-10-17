import { defineConfig } from '@playwright/test';

/* End-to-end tests drive the real, built app with REAL mouse events (page.click,
   page.mouse), which is what finds bugs that synthetic el.click() hides — e.g.
   the CSS rule that once swallowed every real click in Motor mode.
   Locally it uses the installed Edge/Chrome; in CI set CI=1 and install chromium. */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    channel: process.env.CI ? undefined : (process.env.PW_CHANNEL ?? 'msedge'),
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
