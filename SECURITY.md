# Security Policy — Marea

Marea is a privacy-first accessibility PWA used by people in vulnerable
moments. Security reports are treated with the highest priority.

## Supported version

Only the latest version served at **https://marea.lanatech.tech** is
supported. The app self-updates via its service worker.

## Reporting a vulnerability

Please report vulnerabilities **privately** — do not open a public issue:

- Email: **humbertogilv@gmail.com** (subject: `[SECURITY] Marea`)
- Or use GitHub's private vulnerability reporting on this repository
  ("Security" tab → "Report a vulnerability"), if enabled.

You will receive an acknowledgement within 72 hours. Please include steps
to reproduce and the impact you foresee. Good-faith research is welcome;
we will credit you in the fix unless you prefer otherwise.

## Scope notes

- Marea stores **all user data in `localStorage` on the device** and makes
  **no network requests to third parties** (the CSP allows `'self'` only).
  Reports proving any data leaving the device are the highest severity.
- The camera (Face Control / Facial Calm) is processed entirely on-device
  with Google MediaPipe (bundled locally). Any finding that camera frames
  or derived data can leave the device is critical.
- Only official builds deployed from this repository's `main` branch by
  LANA Technologies are genuine. Forks that add trackers or remove privacy
  protections violate the AGPL-3.0 licence terms and the Philosophy
  Covenant (see LICENSE).
