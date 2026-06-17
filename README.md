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
*   **One-Handed Sweep Layout**: Positions and clusters all main buttons on the lower-left or lower-right of the screen (selectable in settings) so everything sits within the natural sweep of a single thumb.
*   **Speech Soundboards**: Large, high-contrast cards representing basic needs, social interaction (*“My brain works perfectly, but I struggle to speak. Please have patience with me”*), and emotional states. Tapping a card reads it aloud using the native offline text-to-speech engine (TTS).

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

**All rights reserved.**

To guarantee the security, privacy, and absolute integrity of Marea for its users:
*   **No Unauthorised Redistribution or Modification**: You may not copy, modify, redistribute, publish, or package this software under other names.
*   **Security Auditing Allowed**: The codebase is source-available solely for transparency, academic auditing, and privacy verification.
*   **Official Releases Only**: Only Lana Technologies (Thitanr) is authorised to publish official versions, updates, and compile native builds of Marea. This is strictly enforced to prevent third parties from injecting spyware, trackers, advertisements, or data-collection mechanisms into the application.
