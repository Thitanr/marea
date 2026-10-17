# 🌊 Marea - Sostén & Dignidad (Holding & Dignity)

Marea is an offline-first Progressive Web App (PWA) designed to function 100% without an internet connection. It serves as a **sensory anchor, conversational haven, and augmentative communication channel** for neurodivergent, disabled (such as stroke survivors with motor hemiplegia and aphasia), and neurotypical individuals in times of sensory overload or crisis.

Created as a gift to the community by **Lana Technologies**.

---

## 🎨 Project Philosophy

1.  **Absolute Privacy**: No data collection, no trackers, and no mandatory registration. 100% of user data (perceptive journals, safety anchors) remains securely stored on the local storage of the user's device (`localStorage`).
2.  **Zero Friction**: Marea operates directly in any modern mobile or tablet web browser. As a PWA, users can "Add to Home Screen" to install it as a standalone app in seconds, with a footprint under 1 MB.
3.  **Uncompromising Accessibility**: Built strictly under WCAG 2.1 AA guidelines to ensure blind users, individuals with motor difficulties, unilateral paralysis (hemiplegia), or severe sensory hypersensitivity can navigate the app with complete autonomy.

---

## 🛠️ Key Features

### 💬 1. The Haven (Conversational Validation)
An active-listening chat module that practices **radical validation**. It avoids toxic positivity and unsolicited advice. It features a continuous presence system: if the user stops typing, the app remains open, softly pulsing a bioluminescent light accompanied by the message: *“I'm still here. No need to speak if you do not want to.”*

### ⚓ 2. The Anchor (Sensory Regulators)
*   **Box Breathing (4-4-4-4)**: An interactive bioluminescent ring guiding inhalation, retention, and exhalation, synchronized with real-time procedural ocean wave sounds (synthesised offline via Web Audio API).
*   **Sensory Grounding (5-4-3-2-1)**: A step-by-step wizard to help users reconnect with their immediate surroundings (sight, touch, hearing, smell, taste) to break cognitive rumiation loops ("what ifs").
*   **TIPP Reset (Cold Water)**: A mechanical 5-minute timer guiding the user to submerge their face/eyes in cold water to stimulate the vagus nerve and physically lower their heart rate during panic.

### 🗣️ 3. Marea Voice (AAC - Augmentative and Alternative Communication)
Specifically designed for **stroke (ictus) survivors** with speech difficulties (aphasia/dysarthria) and unilateral motor limitations:
*   **One board, one fixed order**: 24 large cards, most urgent first — yes / no, help, pain, feeling unwell, toilet, water, food, rest — then conversation repair (*“My brain works perfectly, but I struggle to speak. Please have patience with me”*, wait, slower, I don't understand), comfort, feelings and closeness. No categories to navigate and positions never change, so the hand learns where things are (motor planning). Wording is short, literal and gender-neutral; no metaphors. Tapping a card reads it aloud with the device's own text-to-speech.
*   **Write it instead** (the text pad above the board is shared by all inputs; **Say** speaks it):
    *   **Keyboard** — by default opens the **device's own keyboard** (already in the person's language, with accents, corrector, dictation). Marea's large keyboard is an opt-in alternative (*Settings → Typing keyboard*): in the person's language (ñ and accents included; AZERTY for French, QWERTZ for German), alphabetical **ABC** layout as an alternative, automatic capitals, and **word suggestions** that learn the words you really use (stored only on this device).
    *   **Write** (handwriting) — write one capital letter at a time with finger, pencil or mouse. Recognition is local (a $P point-cloud matcher with built-in stroke templates, no model and no network); it shows the 3 best guesses, and **learns from your corrections**. A palm-rejection mode ignores the hand when a pen is used, and the pause before a letter is accepted is adjustable in Settings. Chinese and Japanese use the device's own keyboard/IME.
    *   **Scan** — row/column switch scanning for people who can use a single switch or tap, including Face Control.
*   **Voice**: speaks with the best voice actually installed on the device (natural/enhanced first), never a surprise. The person or a carer can pick another voice and the speed in *Settings → Voice*. Voices that stream text to a server (some Edge/Chrome "online" voices) are **never used**: nothing the person says or writes leaves the device.
*   **Hand side**: *Right hand* puts the most urgent cards on the right edge (thumb side), *Left hand* on the left; *Motor* makes every button bigger. The Aphasia profile selects big buttons but never assumes which hand works.

### 👁️ 3b. Face Control & Facial Neurofeedback (KAI Perception)
Powered by the same on-device perception engine as **CIL/KAI** (MediaPipe FaceLandmarker, 478 landmarks + blendshapes), bundled locally — no CDN, no cloud, frames never leave the device:
*   **Face Control (Hands-Free)**: an auto-scanning focus walks through every interactive element of the app; the user selects with a configurable facial gesture (long blink, open mouth, or raised brows). Includes the scan keyboard, so a user with no motor control of their hands can navigate and *speak* using only their face.
*   **Facial Neurofeedback ("Calma Facial")**: the face replaces electrodes. Brow-knit, eye-squint and jaw tension — calibrated against the user's own resting face — drive a live bioluminescent ring that grows as the user physically lets go. Sessions are logged locally.
*   **Offline model**: the ~15 MB face model is stored the first time Face Control runs, or ahead of time from *Settings → Face Control offline*.

Face perception is built on **Google MediaPipe FaceLandmarker** (Apache 2.0), bundled locally and running entirely on-device. Note: on iPhone, camera access works in Safari; iOS still limits camera permissions for *installed* home-screen web apps — an Apple platform restriction, not a Marea choice.

### 📝 4. Safety Anchors
A personalized crisis plan based on the Stanley-Brown safety model. Users can register their safe person, stabilizing song, and peaceful memory during calm periods, allowing quick retrieval when "the water rises".

### 🎨 5. Perceptive Journal
Log sensory inputs (sensitivity to light, sound, anxiety, physical pain, and rumination). Rather than writing a text log, Marea processes these sliders to draw a **dynamic abstract canvas**, visualising your sensory footprint as a unique piece of digital art.

---

## ⚙️ Codebase Structure

Marea is built using minimal, lightweight technologies for maximum portability and speed:
*   `index.html` - Semantic layout with full ARIA accessibility roles.
*   `styles.css` - Custom styling with dynamic themes (Deep Sea, Warm Sand, High Contrast, Monochrome) and unilateral layouts.
*   `app.js` - Client-side state machine, navigation, local storage hooks, and SpeechSynthesis player.
*   `sound.js` - Real-time Web Audio API procedural wave synth.
*   `i18n.js` - Integrated dictionaries for dynamic Spanish and English translation.
*   `manifest.json` & `service-worker.js` - PWA assets.

---

## 🔒 Legal Disclaimer

Marea is a low-intensity sensory holding space. **It is not a medical device and does not replace professional therapy, clinical treatment, or emergency services.** If you or someone you know is in immediate danger, please contact your local emergency services (e.g. 112/999 in the UK/Europe, 988 in the US/Canada, 024 in Spain).

---

## 📄 License & Integrity Protection

**Copyright (C) 2024–2026 Lana Technologies · Humberto Gil Valera**
Licensed under the [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-only).

The AGPL-3.0 means:
- Anyone can read, audit, and verify the source code — transparency is non-negotiable.
- Any modified version distributed publicly or run as a network service **must** publish its full source code under the same license.
- **You cannot take Marea proprietary.** If you build on it, you build in the open.

Additionally, any use or fork must honour the **Philosophy Covenant** (see [`LICENSE`](./LICENSE)):
- **Absolute Privacy** — no user data may leave the device, ever.
- **No monetisation of vulnerability** — no paywalls on core features for people in crisis.
- **Accessibility first** — WCAG 2.1 AA is the floor, not the ceiling.
- **Open source forever** — modifications must remain open.

Official releases are published exclusively by **Lana Technologies** at [marea.lanatech.tech](https://marea.lanatech.tech).
Unofficial forks that remove privacy protections, add trackers, or misrepresent the official app violate both the license and the covenant.
