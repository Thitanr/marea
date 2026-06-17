/* ==========================================================================
   MAREA — Application Entry Point (TypeScript)
   Phase 1a: Scaffold — imports existing JS modules via Vite ESM bundling.
   ========================================================================== */

// These are still .js files during migration; TypeScript compiles them via
// allowJs (transitive) and Vite bundles them natively as ESM modules.
import { boot } from './app.js';

// Boot the app immediately — app.js checks DOMContentLoaded internally.
document.addEventListener('DOMContentLoaded', boot);
