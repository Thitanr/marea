/* ==========================================================================
   MAREA - CORE APPLICATION LOGIC
   Handles routing, i18n rendering, chat state machine, sensory grounding,
   AAC speech, interactive canvas drawing, and local storage state persistence.
   ========================================================================== */

import { aacBoardData } from './data/aac-board.js';
import { oceanSynth, brownNoise } from './sound.js';
import { svgIcons } from './data/svg-icons.js';
import { state, persistLang, persistTheme, persistHandMode, persistSensoryMode, persistFontSize, persistReduceMotion } from './state.js';
import { showToast } from './core/toast.js';
import { t, translateDOM, tLang } from './core/i18n.js';
import { initFaceControl } from './face/face-switch.js';
import { initFaceHeaderButton } from './face/face-setup.js';
import { initNeuro, stopNeuroSession } from './face/face-neuro.js';
import { initInputPanels } from './input/panels.js';
import { learnWords } from './input/predict.js';
import { warmVoices, speak, stopSpeaking, initVoiceSettings, refreshVoiceSettings } from './core/speech.js';

/* ----- Module-compatible init (Phase 1a) ----- */
function boot() {

    // 1b. Voices load asynchronously: warm them on boot (see core/speech.ts)
    warmVoices();

    // 2. DOM Elements
    const elements = {
        // App Frame
        body: document.body,
        tabs: document.querySelectorAll(".nav-item"),
        panels: document.querySelectorAll(".tab-panel"),
        quickExitBtn: document.getElementById("quick-exit-btn"),
        
        // Ancla Hub Subtabs
        subtabBtns: document.querySelectorAll(".anchor-subtab-btn"),
        subpanels: document.querySelectorAll(".anchor-subpanel"),
        
        // Box Breathing
        breathingRing: document.getElementById("breathing-ring"),
        breathingRingText: document.getElementById("breathing-ring-text"),
        breathingInstruction: document.getElementById("breathing-instruction"),
        toggleOceanSoundBtn: document.getElementById("toggle-ocean-sound"),
        
        // Grounding
        groundingContainer: document.getElementById("grounding-step-container"),
        groundingPrevBtn: document.getElementById("grounding-prev-btn"),
        groundingNextBtn: document.getElementById("grounding-next-btn"),
        
        // TIPP
        tippTimerText: document.getElementById("tipp-timer"),
        btnTippStart: document.getElementById("btn-tipp-start"),
        btnTippReset: document.getElementById("btn-tipp-reset"),
        
        // Voz (AAC)
        aacSpeechText: document.getElementById("aac-speech-text"),
        btnAacClear: document.getElementById("btn-aac-clear"),
        btnAacSpeak: document.getElementById("btn-aac-speak"),
        aacGrid: document.getElementById("aac-grid"),
        
        // Safety Plan
        inputSafetyPerson: document.getElementById("input-anchor-person"),
        inputSafetySong: document.getElementById("input-anchor-song"),
        inputSafetyMemory: document.getElementById("input-anchor-memory"),
        btnSaveSafety: document.getElementById("btn-save-safety"),
        inputAnchorPhone: document.getElementById("input-anchor-phone"),
        selectContactMessage: document.getElementById("select-contact-message"),
        inputContactMessage: document.getElementById("input-contact-message"),
        btnReachContact: document.getElementById("btn-reach-contact"),
        chkContactLocation: document.getElementById("chk-contact-location"),
        contactPrivacyNotice: document.getElementById("contact-privacy-notice"),
        btnDismissPrivacyNotice: document.getElementById("btn-dismiss-privacy-notice"),

        // Diario
        sliderLight: document.getElementById("slider-light"),
        sliderSound: document.getElementById("slider-sound"),
        sliderPressure: document.getElementById("slider-pressure"),
        sliderPain: document.getElementById("slider-pain"),
        sliderRumination: document.getElementById("slider-rumination"),
        btnSaveJournal: document.getElementById("btn-save-journal"),
        sensorCanvas: document.getElementById("sensor-canvas"),
        
        // Settings
        selectLanguage: document.getElementById("setting-language"),
        selectHandMode: document.getElementById("setting-hand-mode"),
        selectTheme: document.getElementById("setting-theme"),
        toggleSensoryMode: document.getElementById("setting-sensory-mode"),
        btnResetData: document.getElementById("btn-reset-data"),

        // Onboarding
        onboardingOverlay: document.getElementById("onboarding-overlay"),
        onbStep0: document.getElementById("onb-step-0"),
        onbStep1: document.getElementById("onb-step-1"),
        onbStep2: document.getElementById("onb-step-2"),
        onbStep3: document.getElementById("onb-step-3"),
        onbDots: document.querySelectorAll(".onb-dot"),
        restartOnboardingBtn: document.getElementById("restart-onboarding-btn"),

        // Notebook
        notebookCanvas: document.getElementById("notebook-draw-canvas"),
        notebookText: document.getElementById("notebook-text"),
        notebookSaveBtn: document.getElementById("notebook-save-btn"),
        notebookPenBtn: document.getElementById("notebook-pen-btn"),
        notebookEraserBtn: document.getElementById("notebook-eraser-btn"),
        notebookClearBtn: document.getElementById("notebook-clear-btn"),
        notebookColor: document.getElementById("notebook-color"),
        notebookSize: document.getElementById("notebook-size")
    };

    // Input panels (keyboard + handwriting) are created after the DOM is wired
    let inputPanels = null;

    // 3. i18n Translation Engine
    function translateApp() {
        document.documentElement.lang = state.lang;
        translateDOM();
        renderAACBoard();
        drawSensoryCanvas();
        if (inputPanels) inputPanels.refresh();
        syncHelplines();
        refreshVoiceSettings();
    }

    // Show the crisis lines that matter for the language in use (112/911 always)
    function syncHelplines() {
        document.querySelectorAll('[data-helpline-langs]').forEach(el => {
            const langs = el.getAttribute('data-helpline-langs').split(' ');
            el.classList.toggle('hidden', !langs.includes(state.lang));
        });
    }

    // 4. Tab Routing Management
    function switchTab(tabId) {
        state.activeTab = tabId;
        
        // Deactivate all nav-items and panels
        elements.tabs.forEach(btn => {
            btn.classList.remove("active");
            btn.removeAttribute("aria-current");
        });
        elements.panels.forEach(panel => panel.classList.remove("active"));
        
        // Activate target
        const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        const activePanel = document.getElementById(`tab-${tabId}`);
        
        if (activeNav && activePanel) {
            activeNav.classList.add("active");
            activeNav.setAttribute("aria-current", "page");
            activePanel.classList.add("active");
        }

        // Action-specific tab entries
        if (tabId === "ancla") {
            if (state.activeAnchorSubtab === "breathe") {
                startBreathingGuide();
            }
        } else {
            stopBreathingGuide();
            stopNeuroSession();
        }

        if (tabId === "diario") {
            drawSensoryCanvas();
            window.dispatchEvent(new Event('resize')); // size the notebook canvas now that it is visible
        }
    }

    function switchAnchorSubtab(subtabId) {
        state.activeAnchorSubtab = subtabId;
        
        // Update tabs class
        elements.subtabBtns.forEach(btn => btn.classList.remove("active"));
        elements.subpanels.forEach(p => p.classList.remove("active"));
        
        const activeBtn = document.getElementById(`btn-subtab-${subtabId}`);
        const activeSubpanel = document.getElementById(`subtab-${subtabId}`);
        
        if (activeBtn && activeSubpanel) {
            activeBtn.classList.add("active");
            activeSubpanel.classList.add("active");
        }

        // Subpanel logic
        if (subtabId === "breathe") {
            startBreathingGuide();
        } else {
            stopBreathingGuide();
        }
        if (subtabId !== "neuro") {
            stopNeuroSession();
        }

        if (subtabId === "grounding") {
            state.groundingStep = 0;
            renderGroundingStep();
        }
    }

    // 5. El Refugio — Alzheimer Crisis Board only
    function updateAlzheimerMode() {
        // Board is always shown — no chat mode
        const navLabel = document.querySelector('#nav-refugio .nav-label');
        const navBtn = document.getElementById('nav-refugio');
        const label = t('alz.nav_label') || 'Alzheimer';
        if (navLabel) navLabel.textContent = label;
        if (navBtn) navBtn.setAttribute('aria-label', label);
    }

    function initChat() {
        updateAlzheimerMode();
    }

    // 6. El Ancla - Box Breathing (4-4-4-4)
    function startBreathingGuide() {
        if (state.breathingInterval) return;

        state.breathingState = 0;
        state.breathingCycles = 0;

        const runCycle = () => {
            const ring = elements.breathingRing;
            const text = elements.breathingRingText;
            const inst = elements.breathingInstruction;

            if (!ring || !text || !inst) return;

            let seconds = 4;
            text.textContent = seconds + "s";

            // Track countdown so stopBreathingGuide can cancel it immediately
            if (state.breathingCountdown) clearInterval(state.breathingCountdown);
            state.breathingCountdown = setInterval(() => {
                seconds--;
                if (seconds >= 0) {
                    text.textContent = seconds + "s";
                } else {
                    clearInterval(state.breathingCountdown);
                    state.breathingCountdown = null;
                }
            }, 1000);

            // Transition styles based on state
            switch(state.breathingState) {
                case 0: // Setup / Ready
                    inst.textContent = t("anchor.breath_inhale");
                    ring.style.transform = "scale(1.15)";
                    ring.style.background = "radial-gradient(circle, rgba(0,242,254,0.3) 0%, rgba(79,172,254,0.1) 70%)";
                    state.breathingState = 1; // move to hold next
                    break;
                case 1: // Hold Full
                    inst.textContent = t("anchor.breath_hold1");
                    ring.style.transform = "scale(1.15)";
                    ring.style.background = "radial-gradient(circle, rgba(192,132,252,0.3) 0%, rgba(139,92,246,0.1) 70%)";
                    state.breathingState = 2;
                    break;
                case 2: // Exhale
                    inst.textContent = t("anchor.breath_exhale");
                    ring.style.transform = "scale(0.5)";
                    ring.style.background = "radial-gradient(circle, rgba(0,242,254,0.05) 0%, rgba(79,172,254,0.01) 70%)";
                    state.breathingState = 3;
                    break;
                case 3: // Hold Empty
                    inst.textContent = t("anchor.breath_hold2");
                    ring.style.transform = "scale(0.5)";
                    ring.style.background = "radial-gradient(circle, rgba(239,68,68,0.05) 0%, rgba(0,0,0,0) 70%)";
                    state.breathingState = 0;
                    state.breathingCycles++;
                    break;
            }
        };

        // Run immediately then tick every 4 seconds
        runCycle();
        state.breathingInterval = setInterval(runCycle, 4000);
    }

    function stopBreathingGuide() {
        if (state.breathingCountdown) {
            clearInterval(state.breathingCountdown);
            state.breathingCountdown = null;
        }
        if (state.breathingInterval) {
            clearInterval(state.breathingInterval);
            state.breathingInterval = null;
        }
        if (elements.breathingRing) elements.breathingRing.style.transform = "scale(0.6)";
        if (elements.breathingRingText) elements.breathingRingText.textContent = "4s";
        if (elements.breathingInstruction) elements.breathingInstruction.textContent = t("anchor.breath_ready");
    }

    // 7. El Ancla - 5-4-3-2-1 Sensory Grounding Wizard
    function renderGroundingStep() {
        const steps = [
            { num: 5, key: "step1" },
            { num: 4, key: "step2" },
            { num: 3, key: "step3" },
            { num: 4, key: "step4" }, // 2 smells (we keep index but use key)
            { num: 5, key: "step5" }  // 1 taste
        ];
        
        // Map actual step numbers (5, 4, 3, 2, 1)
        const currentData = steps[state.groundingStep];
        const displayNum = 5 - state.groundingStep;

        if (state.groundingStep === 0) {
            elements.groundingPrevBtn.classList.add("hidden");
            elements.groundingNextBtn.textContent = t("common.start");
        } else {
            elements.groundingPrevBtn.classList.remove("hidden");
            elements.groundingNextBtn.textContent = t("common.next");
        }

        if (state.groundingStep > 4) {
            // Done
            elements.groundingContainer.innerHTML = `
                <div class="grounding-step-card">
                    <div class="grounding-num">✓</div>
                    <div class="grounding-title">${t("common.done")}</div>
                    <p class="grounding-prompt">${t("grounding.done")}</p>
                </div>
            `;
            elements.groundingNextBtn.textContent = t("common.done");
            elements.groundingPrevBtn.classList.add("hidden");
            return;
        }

        elements.groundingContainer.innerHTML = `
            <div class="grounding-step-card">
                <div class="grounding-num">${displayNum}</div>
                <div class="grounding-title">${t(`grounding.step${state.groundingStep + 1}.title`)}</div>
                <p class="grounding-prompt">${t(`grounding.step${state.groundingStep + 1}.prompt`)}</p>
            </div>
        `;
    }

    // 8. El Ancla - TIPP Cold Water Timer
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function startTippTimer() {
        if (state.tippTimerInterval) return;

        elements.btnTippStart.classList.add("hidden");
        elements.btnTippReset.classList.remove("hidden");

        state.tippTimerInterval = setInterval(() => {
            state.tippTimeRemaining--;
            elements.tippTimerText.textContent = formatTime(state.tippTimeRemaining);
            
            if (state.tippTimeRemaining <= 0) {
                clearInterval(state.tippTimerInterval);
                state.tippTimerInterval = null;
                elements.tippTimerText.textContent = "00:00";
                
                // Play a gentle offline audio beep or visual flash
                showToast(t("tipp.timer_done"));
                resetTippTimer();
            }
        }, 1000);
    }

    function resetTippTimer() {
        clearInterval(state.tippTimerInterval);
        state.tippTimerInterval = null;
        state.tippTimeRemaining = 300;
        elements.tippTimerText.textContent = formatTime(state.tippTimeRemaining);
        elements.btnTippStart.classList.remove("hidden");
        elements.btnTippReset.classList.add("hidden");
    }

    // 9. Voz de Marea - AAC Sound Board
    function getAacSvgIcon(iconKey) {
        const svgHeader = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="aac-icon" width="28" height="28">';
        const path = svgIcons[iconKey] || '<circle cx="12" cy="12" r="10"></circle>';
        return svgHeader + path + '</svg>';
    }

    function renderAACBoard() {
        elements.aacGrid.innerHTML = "";

        // One board, one fixed order (most urgent first): see data/aac-board.ts
        const items = aacBoardData[state.lang] || aacBoardData.es;

        items.forEach(item => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "aac-card-btn";
            card.dataset.kind = item.kind;
            card.dataset.id = item.id;
            card.setAttribute("aria-label", `${item.text}. ${t('aac.tap_to_speak')}`);

            card.innerHTML = `
                <span class="aac-card-icon" aria-hidden="true">${getAacSvgIcon(item.icon)}</span>
                <span class="aac-card-label"></span>
            `;
            card.querySelector(".aac-card-label").textContent = item.text;

            card.addEventListener("click", () => {
                card.classList.add("aac-card-flash");
                setTimeout(() => card.classList.remove("aac-card-flash"), 400);

                // Add to text pad
                if (elements.aacSpeechText.value) {
                    elements.aacSpeechText.value += " " + item.text;
                } else {
                    elements.aacSpeechText.value = item.text;
                }
                learnWords(item.text);

                // Speak out loud
                speakText(item.spoken);
            });

            elements.aacGrid.appendChild(card);
        });
    }

    // One speech engine for the whole app: best installed voice, user's choice and speed
    function speakText(phrase) {
        speak(phrase, state.lang);
    }

    // 10. Safety Plan Anchors
    function loadSafetyPlan() {
        elements.inputSafetyPerson.value = localStorage.getItem("marea_safety_person") || "";
        elements.inputSafetySong.value = localStorage.getItem("marea_safety_song") || "";
        elements.inputSafetyMemory.value = localStorage.getItem("marea_safety_memory") || "";
        elements.inputAnchorPhone.value = localStorage.getItem("marea_contact_phone") || "";
        elements.selectContactMessage.value = localStorage.getItem("marea_contact_message_choice") || "template_anchor";
        elements.inputContactMessage.value = localStorage.getItem("marea_contact_message_custom") || "";
        elements.chkContactLocation.checked = localStorage.getItem("marea_contact_include_location") === "1";
        syncCustomMessageVisibility();
        updateReachButton();
    }

    function saveSafetyPlan() {
        localStorage.setItem("marea_safety_person", elements.inputSafetyPerson.value);
        localStorage.setItem("marea_safety_song", elements.inputSafetySong.value);
        localStorage.setItem("marea_safety_memory", elements.inputSafetyMemory.value);
        localStorage.setItem("marea_contact_phone", elements.inputAnchorPhone.value);
        localStorage.setItem("marea_contact_message_choice", elements.selectContactMessage.value);
        localStorage.setItem("marea_contact_message_custom", elements.inputContactMessage.value);
        localStorage.setItem("marea_contact_include_location", elements.chkContactLocation.checked ? "1" : "0");
        showToast(t("safety.saved_toast"));
    }

    // 10b. Trusted Contact — always user-initiated. Marea never sends anything
    // itself: this only ever builds an sms: link that opens the user's own
    // messaging app with the message pre-filled, exactly like the tel: links
    // used by the crisis helplines below. The user still has to hit send
    // there, and Marea has no way to know — or record — whether they did.
    function syncCustomMessageVisibility() {
        elements.inputContactMessage.hidden = elements.selectContactMessage.value !== "custom";
    }

    function resolveContactMessage() {
        const choice = elements.selectContactMessage.value;
        if (choice === "custom") return elements.inputContactMessage.value.trim();
        if (choice === "template_call") return t("safety.message_option_call");
        return t("safety.message_option_anchor");
    }

    function buildWhatsAppUrl(phone, message) {
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }

    function updateReachButton() {
        // The href is a wa.me link — the fallback for browsers without Web
        // Share (mostly desktop) and the only option once a GPS fix is in
        // play (see the click handler below for why). It needs the full
        // number with country code and no leading zeros or symbols.
        const phone = elements.inputAnchorPhone.value.replace(/\D/g, "");
        const message = resolveContactMessage();
        // The phone number is only needed for the wa.me link (desktop, or when GPS
        // is attached). With the device share sheet the person picks the recipient.
        const needsPhone = !navigator.share || elements.chkContactLocation.checked;
        const phoneOk = phone.length >= 8;
        const ready = message.length > 0 && (!needsPhone || phoneOk);
        elements.btnReachContact.setAttribute("aria-disabled", ready ? "false" : "true");
        elements.btnReachContact.classList.toggle("is-disabled", !ready);
        elements.btnReachContact.href = ready && phoneOk ? buildWhatsAppUrl(phone, message) : "#";
    }

    // GPS location is opt-in only (the checkbox), never read unless the user
    // ticked it, and it's requested fresh on each tap rather than watched or
    // cached — the device's GPS chip works with zero network/cell signal,
    // which matters for someone reaching out from a place with neither.
    function getLocationSuffix() {
        return new Promise((resolve) => {
            if (!("geolocation" in navigator)) return resolve("");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    resolve(`\n\n📍 https://maps.google.com/?q=${latitude},${longitude}`);
                },
                () => resolve(null), // denied / unavailable / timeout — caller decides how to handle
                { timeout: 8000, maximumAge: 60000 }
            );
        });
    }

    // Shown once, the first time this card is seen — "radical honesty" that
    // the reach-out button is the one place in Marea where data can leave
    // the device, and only because the user chose to send it.
    function initContactPrivacyNotice() {
        if (localStorage.getItem("marea_contact_notice_dismissed") !== "1") {
            elements.contactPrivacyNotice.hidden = false;
        }
        elements.btnDismissPrivacyNotice.addEventListener("click", () => {
            elements.contactPrivacyNotice.hidden = true;
            localStorage.setItem("marea_contact_notice_dismissed", "1");
        });
    }

    function initTrustedContact() {
        initContactPrivacyNotice();
        elements.selectContactMessage.addEventListener("change", () => {
            syncCustomMessageVisibility();
            updateReachButton();
        });
        elements.inputAnchorPhone.addEventListener("input", updateReachButton);
        elements.inputContactMessage.addEventListener("input", updateReachButton);
        elements.chkContactLocation.addEventListener("change", updateReachButton);

        elements.btnReachContact.addEventListener("click", (e) => {
            if (elements.btnReachContact.getAttribute("aria-disabled") === "true") {
                e.preventDefault();
                showToast(resolveContactMessage().length === 0 ? t("safety.message_placeholder") : t("safety.reach_missing_phone"));
                return;
            }

            const phone = elements.inputAnchorPhone.value.replace(/\D/g, "");
            const message = resolveContactMessage();

            if (elements.chkContactLocation.checked) {
                // navigator.share() requires a live user gesture ("transient
                // activation") that doesn't reliably survive the async wait
                // for a GPS fix, so this path always goes straight to WhatsApp
                // rather than risk a silent failure once the fix comes back.
                e.preventDefault();
                getLocationSuffix().then((suffix) => {
                    if (suffix === null) showToast(t("safety.location_unavailable"));
                    window.open(buildWhatsAppUrl(phone, message + (suffix || "")), "_blank", "noopener,noreferrer");
                });
                return;
            }

            // No location involved: let the person's own device decide which
            // app to use — WhatsApp, Telegram, SMS, whatever they actually
            // have — instead of assuming everyone uses WhatsApp.
            if (navigator.share) {
                e.preventDefault();
                navigator.share({ text: message }).catch((err) => {
                    if (err && err.name === "AbortError") return; // they chose not to share — respect that
                    window.open(buildWhatsAppUrl(phone, message), "_blank", "noopener,noreferrer");
                });
                return;
            }
            // No Web Share support (typically desktop browsers): fall through
            // to the plain href, already set to the wa.me link above.
        });
    }

    // 11. Diario Perceptivo & Dynamic Canvas
    function drawSensoryCanvas() {
        const canvas = elements.sensorCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const l = parseInt(elements.sliderLight.value);
        const s = parseInt(elements.sliderSound.value);
        const p = parseInt(elements.sliderPressure.value);
        const pain = parseInt(elements.sliderPain.value);
        const r = parseInt(elements.sliderRumination.value);

        // Update slider value labels — use optional chaining in case elements are missing
        const lblLight = document.getElementById("label-val-light");
        const lblSound = document.getElementById("label-val-sound");
        const lblPressure = document.getElementById("label-val-pressure");
        const lblPain = document.getElementById("label-val-pain");
        const lblRumination = document.getElementById("label-val-rumination");
        if (lblLight) lblLight.textContent = t(`journal.val.${l}`);
        if (lblSound) lblSound.textContent = t(`journal.val.${s}`);
        if (lblPressure) lblPressure.textContent = t(`journal.val.${p}`);
        if (lblPain) lblPain.textContent = t(`journal.val.${pain}`);
        if (lblRumination) lblRumination.textContent = t(`journal.val.${r}`);

        // Clear canvas
        ctx.fillStyle = "#0B1120";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw dynamic bioluminescent concentric shapes representing sensory status
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Base Glow (Anxiety/Pressure modulates HSL hue: Calm 200/Teal -> Tense 0/Red)
        const hue = 200 - (p * 40); // 1: 160 (Teal), 5: 0 (Red)
        const baseRadius = 60 + (pain * 15);
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius);
        gradient.addColorStop(0, `hsla(${hue}, 90%, 60%, 0.7)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 80%, 40%, 0.2)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 10%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Light Sensitivity: Halo ring around center
        if (l > 1) {
            ctx.strokeStyle = `rgba(255, 240, 150, ${0.1 * l})`;
            ctx.lineWidth = l * 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Sound Sensitivity: Wavy circular pattern (more spikes = high sound sensitivity)
        if (s > 1) {
            ctx.strokeStyle = `rgba(0, 242, 254, ${0.15 * s})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const points = 30 + (s * 10);
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                // Add noise/waves to radius
                const wave = Math.sin(angle * 12) * (s * 3);
                const r_dist = 85 + wave;
                const x = centerX + Math.cos(angle) * r_dist;
                const y = centerY + Math.sin(angle) * r_dist;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Rumination Loop: A swirling spiral overlay
        if (r > 1) {
            ctx.strokeStyle = `rgba(192, 132, 252, ${0.08 * r})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const loops = r * 1.5;
            for (let angle = 0; angle < Math.PI * 2 * loops; angle += 0.1) {
                const spiralR = 20 + (angle * (6 - r));
                const x = centerX + Math.cos(angle) * spiralR;
                const y = centerY + Math.sin(angle) * spiralR;
                if (angle === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    // 12. Settings Setup
    function initSettings() {
        // Lang
        elements.selectLanguage.value = state.lang;
        elements.selectLanguage.addEventListener("change", (e) => {
            state.lang = e.target.value;
            persistLang(state.lang);
            translateApp();
            initChat();
        });

        // Hand layout
        elements.selectHandMode.value = state.handMode;
        applyHandMode();
        elements.selectHandMode.addEventListener("change", (e) => {
            state.handMode = e.target.value;
            persistHandMode(state.handMode);
            applyHandMode();
        });

        // Visual Theme
        elements.selectTheme.value = state.theme;
        applyTheme();
        elements.selectTheme.addEventListener("change", (e) => {
            state.theme = e.target.value;
            persistTheme(state.theme);
            applyTheme();
        });

        // Sensory Mode (CIL/KAI inspired)
        elements.toggleSensoryMode.checked = state.sensoryMode;
        applySensoryMode();
        elements.toggleSensoryMode.addEventListener("change", (e) => {
            state.sensoryMode = e.target.checked;
            persistSensoryMode(state.sensoryMode);
            applySensoryMode();
        });

        // Font size
        const selectFontSize = document.getElementById("setting-font-size");
        if (selectFontSize) {
            selectFontSize.value = state.fontSize;
            applyFontSize();
            selectFontSize.addEventListener("change", (e) => {
                state.fontSize = e.target.value;
                persistFontSize(state.fontSize);
                applyFontSize();
            });
        }

        // Reduce motion
        const toggleReduceMotion = document.getElementById("setting-reduce-motion");
        if (toggleReduceMotion) {
            toggleReduceMotion.checked = state.reduceMotion;
            applyReduceMotion();
            toggleReduceMotion.addEventListener("change", (e) => {
                state.reduceMotion = e.target.checked;
                persistReduceMotion(state.reduceMotion);
                applyReduceMotion();
            });
        }

        // Handwriting pause before a letter is committed (slower hands need longer)
        const hwDelay = document.getElementById("setting-hw-delay");
        if (hwDelay) {
            const saved = localStorage.getItem("marea_hw_delay");
            hwDelay.value = [...hwDelay.options].some(o => o.value === saved) ? saved : "1200";
            hwDelay.addEventListener("change", (e) => localStorage.setItem("marea_hw_delay", e.target.value));
        }

        // Face Control works offline only once its ~15 MB model is stored
        initFaceOfflineButton();

        // Voice (best installed, choosable) and which keyboard "Keyboard" opens
        initVoiceSettings();
        const kbMode = document.getElementById("setting-kb-mode");
        if (kbMode) {
            kbMode.value = localStorage.getItem("marea_kb_mode") === "marea" ? "marea" : "device";
            kbMode.addEventListener("change", (e) => localStorage.setItem("marea_kb_mode", e.target.value));
        }

        // Wipe Data
        elements.btnResetData.addEventListener("click", () => {
            if (confirm(t("settings.reset_confirm"))) {
                localStorage.clear();
                showToast(t("settings.reset_toast"));
                window.location.reload();
            }
        });

        // Condition / profile selector in settings
        const selectCondition = document.getElementById('setting-condition');
        if (selectCondition) {
            // 'other' is the canonical "no specific profile" value (matches onboarding)
            selectCondition.value = localStorage.getItem('marea_condition') || 'other';
            selectCondition.addEventListener('change', (e) => {
                const cond = e.target.value;
                localStorage.setItem('marea_condition', cond);
                applyConditionPreset(cond, false);
                initChat();
                showToast(t('settings.condition_saved'));
            });
        }

        // Restart onboarding guide
        if (elements.restartOnboardingBtn) {
            elements.restartOnboardingBtn.addEventListener("click", () => {
                if (window.restartOnboarding) {
                    window.restartOnboarding();
                    showToast(t("onboarding.welcome"));
                }
            });
        }
    }

    function applyHandMode() {
        elements.body.classList.remove(
            "mode-right-hand", "mode-left-hand", "mode-center",
            "mode-motor"
        );
        if (state.handMode.startsWith("motor-")) {
            const base = state.handMode.replace("motor-", "");
            if (base === "center") elements.body.classList.add("mode-center", "mode-motor");
            else elements.body.classList.add(`mode-${base}-hand`, "mode-motor");
        } else if (state.handMode === "center") {
            elements.body.classList.add("mode-center");
        } else {
            elements.body.classList.add(`mode-${state.handMode}-hand`);
        }
    }

    function applySensoryMode() {
        if (state.sensoryMode) {
            elements.body.classList.add("mode-sensory");
        } else {
            elements.body.classList.remove("mode-sensory");
        }
    }

    function applyFontSize() {
        const root = document.documentElement;
        root.classList.remove("font-large", "font-xlarge");
        if (state.fontSize === "large") root.classList.add("font-large");
        else if (state.fontSize === "xlarge") root.classList.add("font-xlarge");
    }

    function applyReduceMotion() {
        if (state.reduceMotion) elements.body.classList.add("reduce-motion");
        else elements.body.classList.remove("reduce-motion");
    }

    function applyTheme() {
        elements.body.classList.remove("theme-deep-sea", "theme-warm-sand", "theme-high-contrast", "theme-monochrome");
        elements.body.classList.add(`theme-${state.theme}`);
        
        // Update header background meta tag
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                "deep-sea": "#0a0f0d",
                "warm-sand": "#faf8f5",
                "high-contrast": "#000000",
                "monochrome": "#090909"
            };
            metaThemeColor.setAttribute("content", colors[state.theme] || "#0a0f0d");
        }
    }

    // 13. Event Listeners Initialization
    function setupEventListeners() {
        // Tab Navigation click listeners
        elements.tabs.forEach(btn => {
            btn.addEventListener("click", () => {
                const tabId = btn.getAttribute("data-tab");
                switchTab(tabId);
            });
        });

        // Anchor Subtab navigation
        elements.subtabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const subtabId = btn.id.replace("btn-subtab-", "");
                switchAnchorSubtab(subtabId);
            });
        });

        // Quick Exit button (navigates away to google.com instantly for safety/privacy)
        elements.quickExitBtn.addEventListener("click", () => {
            window.location.replace("https://www.google.com");
        });

        // Grounding Stepper navigation buttons
        elements.groundingNextBtn.addEventListener("click", () => {
            // On the "done" card the button restarts the wizard instead of
            // incrementing forever
            if (state.groundingStep > 4) {
                state.groundingStep = 0;
            } else {
                state.groundingStep++;
            }
            renderGroundingStep();
        });

        elements.groundingPrevBtn.addEventListener("click", () => {
            if (state.groundingStep > 0) {
                state.groundingStep--;
                renderGroundingStep();
            }
        });

        // Breathing toggle sound
        elements.toggleOceanSoundBtn.addEventListener("click", () => {
            const playing = oceanSynth.toggle();
            const labelSpan = elements.toggleOceanSoundBtn.querySelector("span");
            
            if (playing) {
                elements.toggleOceanSoundBtn.classList.add("active");
                if (labelSpan) {
                    labelSpan.textContent = t("anchor.sound_stop");
                }
            } else {
                elements.toggleOceanSoundBtn.classList.remove("active");
                if (labelSpan) labelSpan.textContent = t("anchor.sound_btn");
            }
        });

        // TIPP Timer controls
        elements.btnTippStart.addEventListener("click", startTippTimer);
        elements.btnTippReset.addEventListener("click", resetTippTimer);

        // AAC controls
        elements.btnAacClear.addEventListener("click", () => {
            elements.aacSpeechText.value = "";
        });

        elements.btnAacSpeak.addEventListener("click", () => {
            const text = elements.aacSpeechText.value.trim();
            if (!text) return;
            speakText(text);
            learnWords(text);
            // Clear pad after speaking so the next request starts fresh
            setTimeout(() => { elements.aacSpeechText.value = ""; }, 300);
        });

        // Safety Plan Save
        elements.btnSaveSafety.addEventListener("click", saveSafetyPlan);
        initTrustedContact();

        // Journal Live sliders draw updates
        [elements.sliderLight, elements.sliderSound, elements.sliderPressure, elements.sliderPain, elements.sliderRumination].forEach(s => {
            s.addEventListener("input", drawSensoryCanvas);
        });

        elements.btnSaveJournal.addEventListener("click", () => {
            // Save state to local database log
            let dailyLogs;
            try { dailyLogs = JSON.parse(localStorage.getItem("marea_journal_logs") || "[]"); }
            catch (_) { dailyLogs = []; }
            const entry = {
                date: localDateStr(),
                light: elements.sliderLight.value,
                sound: elements.sliderSound.value,
                pressure: elements.sliderPressure.value,
                pain: elements.sliderPain.value,
                rumination: elements.sliderRumination.value
            };
            dailyLogs.push(entry);
            localStorage.setItem("marea_journal_logs", JSON.stringify(dailyLogs));
            showToast(t("journal.saved_toast"));
        });
    }

    // 13b. Sintonía — interactive state & regulation cards
    function initSintonia() {
        const stateDetail = document.getElementById('sintonia-state-detail');
        const regDetail = document.getElementById('sintonia-reg-detail');

        document.querySelectorAll('.state-card').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.getAttribute('data-state');
                const isOpen = card.getAttribute('aria-expanded') === 'true';

                // Read the card name aloud — critical for non-verbal autistic users
                const cardLabel = card.querySelector('strong');
                if (cardLabel) speakText(cardLabel.textContent);

                document.querySelectorAll('.state-card').forEach(c => c.setAttribute('aria-expanded', 'false'));

                if (isOpen) {
                    stateDetail.classList.add('hidden');
                    stateDetail.innerHTML = '';
                } else {
                    card.setAttribute('aria-expanded', 'true');
                    stateDetail.classList.remove('hidden');
                    stateDetail.innerHTML = `
                        <p class="state-detail-what">${t('sintonia.state.' + key + '_detail')}</p>
                        <p class="state-detail-help">${t('sintonia.state.' + key + '_help')}</p>
                    `;
                    stateDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });

        // Personal regulation kit — every autistic nervous system is
        // different. Techniques the user marks as "this works for me" float
        // to the front, so in a crisis their own tools come first.
        const FAV_KEY = 'marea_sintonia_favs';
        let regFavs;
        try { regFavs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
        catch (_) { regFavs = new Set(); }

        const regGrid = document.querySelector('.reg-grid');

        function refreshRegOrder() {
            if (!regGrid) return;
            const cards = [...regGrid.querySelectorAll('.reg-card')];
            cards.sort((a, b) =>
                (regFavs.has(b.getAttribute('data-reg')) ? 1 : 0) -
                (regFavs.has(a.getAttribute('data-reg')) ? 1 : 0)
            );
            cards.forEach(c => {
                c.querySelector('.reg-fav-badge')?.remove();
                if (regFavs.has(c.getAttribute('data-reg'))) {
                    const badge = document.createElement('span');
                    badge.className = 'reg-fav-badge';
                    badge.setAttribute('aria-hidden', 'true');
                    badge.textContent = '★';
                    c.appendChild(badge);
                }
                regGrid.appendChild(c);
            });
        }
        refreshRegOrder();

        document.querySelectorAll('.reg-card').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.getAttribute('data-reg');
                const isActive = card.classList.contains('active');

                // Read the regulation card name aloud
                const cardLabel = card.querySelector('span');
                if (cardLabel) speakText(cardLabel.textContent);

                document.querySelectorAll('.reg-card').forEach(c => c.classList.remove('active'));

                if (isActive) {
                    regDetail.classList.add('hidden');
                    regDetail.innerHTML = '';
                } else {
                    card.classList.add('active');
                    regDetail.classList.remove('hidden');
                    const isFav = regFavs.has(key);
                    // The "sound" technique carries its own tool: a brown
                    // noise generator (steady masking, fully offline)
                    const noiseBtn = key === 'sound'
                        ? `<button class="reg-noise-btn" aria-pressed="${brownNoise.isPlaying}">${brownNoise.isPlaying ? '■ ' + t('sintonia.noise_stop') : '▶ ' + t('sintonia.noise_play')}</button>`
                        : '';
                    regDetail.innerHTML = `
                        <p class="state-detail-what">${t('sintonia.reg.' + key + '_detail')}</p>
                        ${noiseBtn}
                        <button class="reg-fav-btn" aria-pressed="${isFav}">
                            ${isFav ? '★' : '☆'} ${t('sintonia.fav_btn')}
                        </button>`;
                    regDetail.querySelector('.reg-noise-btn')?.addEventListener('click', (e) => {
                        const playing = brownNoise.toggle();
                        e.currentTarget.setAttribute('aria-pressed', String(playing));
                        e.currentTarget.textContent = playing
                            ? '■ ' + t('sintonia.noise_stop')
                            : '▶ ' + t('sintonia.noise_play');
                    });
                    regDetail.querySelector('.reg-fav-btn').addEventListener('click', (e) => {
                        const btn = e.currentTarget;
                        if (regFavs.has(key)) {
                            regFavs.delete(key);
                        } else {
                            regFavs.add(key);
                            showToast(t('sintonia.fav_on'));
                        }
                        localStorage.setItem(FAV_KEY, JSON.stringify([...regFavs]));
                        btn.setAttribute('aria-pressed', String(regFavs.has(key)));
                        btn.innerHTML = `${regFavs.has(key) ? '★' : '☆'} ${t('sintonia.fav_btn')}`;
                        refreshRegOrder();
                    });
                    regDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });

        // "Say it without words" — in a real shutdown you need to show the
        // phone across a room. Tapping a card opens it fullscreen with giant
        // high-contrast text. Tap anywhere to close.
        document.querySelectorAll('.show-card').forEach(card => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            const openFullscreen = () => {
                const text = card.querySelector('span')?.textContent || '';
                const ov = document.createElement('div');
                ov.className = 'show-fullscreen';
                ov.setAttribute('role', 'dialog');
                ov.setAttribute('aria-modal', 'true');
                ov.innerHTML = `
                    <button class="show-fullscreen-close" aria-label="✕">✕</button>
                    <p class="show-fullscreen-text"></p>
                    <p class="show-fullscreen-hint">${t('sintonia.show_fullscreen_hint')}</p>`;
                ov.querySelector('.show-fullscreen-text').textContent = text;
                ov.addEventListener('click', () => ov.remove());
                document.body.appendChild(ov);
            };
            card.addEventListener('click', openFullscreen);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFullscreen(); }
            });
        });

        // Instant refuge — one tap and the world goes dark: black screen,
        // one dim breathing light, optional brown noise. For the moments
        // when even Marea itself is too much input.
        const refugeBtn = document.getElementById('refuge-btn');
        if (refugeBtn) {
            refugeBtn.addEventListener('click', () => {
                const ov = document.createElement('div');
                ov.className = 'refuge-overlay';
                ov.setAttribute('role', 'dialog');
                ov.setAttribute('aria-modal', 'true');
                ov.setAttribute('aria-label', t('sintonia.refuge'));
                ov.innerHTML = `
                    <div class="refuge-dot" aria-hidden="true"></div>
                    <div class="refuge-controls">
                        <button id="refuge-noise" class="refuge-ctrl" aria-pressed="${brownNoise.isPlaying}">${brownNoise.isPlaying ? '■ ' + t('sintonia.noise_stop') : '▶ ' + t('sintonia.noise_play')}</button>
                        <button id="refuge-exit" class="refuge-ctrl">${t('sintonia.refuge_exit')}</button>
                    </div>`;
                ov.querySelector('#refuge-noise').addEventListener('click', (e) => {
                    const playing = brownNoise.toggle();
                    e.currentTarget.setAttribute('aria-pressed', String(playing));
                    e.currentTarget.textContent = playing
                        ? '■ ' + t('sintonia.noise_stop')
                        : '▶ ' + t('sintonia.noise_play');
                });
                ov.querySelector('#refuge-exit').addEventListener('click', () => {
                    brownNoise.stop(); // leaving the refuge leaves silence — predictable
                    ov.remove();
                });
                document.body.appendChild(ov);
            });
        }

        // Daily energy check-in (spoon theory) — knowing your level BEFORE
        // the crash is how autistic burnout gets prevented, not managed.
        const ENERGY_KEY = 'marea_energy';
        const ENERGY_LOG_KEY = 'marea_energy_logs';
        const battery = document.getElementById('energy-battery');
        const energyMsg = document.getElementById('energy-msg');

        function todayStr() { return localDateStr(); }

        function renderEnergy(level) {
            if (!battery) return;
            battery.querySelectorAll('.energy-seg').forEach(seg => {
                const n = parseInt(seg.getAttribute('data-level'));
                seg.classList.toggle('energy-seg--on', level > 0 && n <= level);
                seg.setAttribute('aria-checked', String(n === level));
            });
            if (energyMsg) {
                energyMsg.textContent = level === 0 ? ''
                    : level <= 2 ? t('sintonia.energy_low')
                    : level === 3 ? t('sintonia.energy_mid')
                    : t('sintonia.energy_high');
            }
        }

        if (battery) {
            let saved = { date: '', level: 0 };
            try { saved = JSON.parse(localStorage.getItem(ENERGY_KEY) || '{}'); } catch (_) {}
            renderEnergy(saved.date === todayStr() ? saved.level : 0);

            battery.querySelectorAll('.energy-seg').forEach(seg => {
                seg.addEventListener('click', () => {
                    const level = parseInt(seg.getAttribute('data-level'));
                    localStorage.setItem(ENERGY_KEY, JSON.stringify({ date: todayStr(), level }));
                    let logs;
                    try { logs = JSON.parse(localStorage.getItem(ENERGY_LOG_KEY) || '[]'); }
                    catch (_) { logs = []; }
                    logs = logs.filter(l => l.date !== todayStr());
                    logs.push({ date: todayStr(), level });
                    try { localStorage.setItem(ENERGY_LOG_KEY, JSON.stringify(logs)); } catch (_) {}
                    renderEnergy(level);
                });
            });
        }
    }

    // 13d. PWA Install prompt
    function initPwaInstall() {
        let deferredPrompt = null;
        const pwaItem = document.getElementById('pwa-install-item');
        const btnInstall = document.getElementById('btn-install-pwa');

        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = ('standalone' in navigator && navigator.standalone) ||
                             window.matchMedia('(display-mode: standalone)').matches;

        function showIOSInstallModal() {
            const modal = document.getElementById('ios-install-modal');
            if (!modal) return;
            modal.classList.remove('hidden');
            const closeBtn = modal.querySelector('.ios-modal-close');
            const backdrop = modal.querySelector('.ios-modal-backdrop');
            const handler = () => modal.classList.add('hidden');
            if (closeBtn) closeBtn.addEventListener('click', handler, { once: true });
            if (backdrop) backdrop.addEventListener('click', handler, { once: true });
        }
        window._showIOSInstallModal = showIOSInstallModal;

        // iOS: show banner on first visit (not already installed)
        if (isIOS && !isStandalone) {
            if (pwaItem) pwaItem.classList.remove('pwa-hidden');
            const iosHowBtn = document.getElementById('ios-banner-how');
            if (iosHowBtn) iosHowBtn.addEventListener('click', showIOSInstallModal);
            if (btnInstall) btnInstall.addEventListener('click', showIOSInstallModal);

            if (!localStorage.getItem('marea_ios_banner_shown')) {
                setTimeout(() => {
                    const banner = document.getElementById('ios-install-banner');
                    if (banner) {
                        banner.classList.remove('hidden');
                        localStorage.setItem('marea_ios_banner_shown', '1');
                        document.getElementById('ios-banner-close')?.addEventListener('click', () =>
                            banner.classList.add('hidden'), { once: true });
                        document.getElementById('ios-banner-how')?.addEventListener('click', () =>
                            banner.classList.add('hidden'), { once: true });
                    }
                }, 4000);
            }
            return; // iOS doesn't fire beforeinstallprompt
        }

        // Android / Desktop: native install prompt
        async function triggerInstall() {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (pwaItem) pwaItem.classList.add('pwa-hidden');
            const banner = document.getElementById('ios-install-banner');
            if (banner) banner.classList.add('hidden');
            if (outcome === 'accepted') showToast(t('settings.pwa_installed'));
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (pwaItem) pwaItem.classList.remove('pwa-hidden');
            // Show prominent install banner (same element, different behavior)
            if (!localStorage.getItem('marea_android_banner_shown')) {
                setTimeout(() => {
                    const banner = document.getElementById('ios-install-banner');
                    if (!banner) return;
                    banner.classList.remove('hidden');
                    localStorage.setItem('marea_android_banner_shown', '1');
                    document.getElementById('ios-banner-how')?.addEventListener('click', () => {
                        banner.classList.add('hidden');
                        triggerInstall();
                    }, { once: true });
                    document.getElementById('ios-banner-close')?.addEventListener('click', () =>
                        banner.classList.add('hidden'), { once: true });
                }, 3000);
            }
        });

        if (btnInstall) btnInstall.addEventListener('click', triggerInstall);

        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            if (pwaItem) pwaItem.classList.add('pwa-hidden');
        });
    }

    // 13b. Onboarding Wizard — 4-step welcome guide with condition selector
    function initOnboarding() {
        if (!elements.onboardingOverlay) return;

        const ONBOARDING_KEY = 'marea_onboarded';
        let selectedCondition = localStorage.getItem('marea_condition') || 'other';

        function showOnboardingStep(stepIndex) {
            const cards = [elements.onbStep0, elements.onbStep1, elements.onbStep2, elements.onbStep3];
            cards.forEach((card, i) => {
                if (!card) return;
                card.classList.toggle('hidden', i !== stepIndex);
            });
            elements.onbDots.forEach((dot, i) => {
                dot.classList.remove('active', 'done');
                if (i === stepIndex) dot.classList.add('active');
                else if (i < stepIndex) dot.classList.add('done');
            });
        }

        // Condition selector buttons (step 2)
        elements.onbStep2 && elements.onbStep2.querySelectorAll('.onb-condition-btn').forEach(btn => {
            // Mark pre-selected
            if (btn.getAttribute('data-condition') === selectedCondition) {
                btn.classList.add('onb-condition-btn--selected');
            }
            btn.addEventListener('click', () => {
                elements.onbStep2.querySelectorAll('.onb-condition-btn').forEach(b => b.classList.remove('onb-condition-btn--selected'));
                btn.classList.add('onb-condition-btn--selected');
                selectedCondition = btn.getAttribute('data-condition');
            });
        });

        // Step 0 → 1
        const btnNext0 = elements.onbStep0 && elements.onbStep0.querySelector('.onb-btn-next');
        if (btnNext0) btnNext0.addEventListener('click', () => showOnboardingStep(1));

        // Step 1 → 0 / 2
        const btnPrev1 = elements.onbStep1 && elements.onbStep1.querySelector('.onb-btn-prev');
        const btnNext1 = elements.onbStep1 && elements.onbStep1.querySelector('.onb-btn-next');
        if (btnPrev1) btnPrev1.addEventListener('click', () => showOnboardingStep(0));
        if (btnNext1) btnNext1.addEventListener('click', () => showOnboardingStep(2));

        // Step 2 → 1 / 3
        const btnPrev2 = elements.onbStep2 && elements.onbStep2.querySelector('.onb-btn-prev');
        const btnNext2 = elements.onbStep2 && elements.onbStep2.querySelector('.onb-btn-next');
        if (btnPrev2) btnPrev2.addEventListener('click', () => showOnboardingStep(1));
        if (btnNext2) btnNext2.addEventListener('click', () => showOnboardingStep(3));

        // Step 3: prev + start (apply condition settings)
        const btnPrev3 = elements.onbStep3 && elements.onbStep3.querySelector('.onb-btn-prev');
        const btnStart = elements.onbStep3 && elements.onbStep3.querySelector('.onb-btn-start');
        if (btnPrev3) btnPrev3.addEventListener('click', () => showOnboardingStep(2));
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                // Persist condition + apply preset settings
                localStorage.setItem('marea_condition', selectedCondition);
                applyConditionPreset(selectedCondition);

                localStorage.setItem(ONBOARDING_KEY, '1');
                elements.onboardingOverlay.classList.add('fade-out');
                setTimeout(() => {
                    elements.onboardingOverlay.classList.add('hidden');
                    elements.onboardingOverlay.classList.remove('fade-out');
                    // Re-init chat with new condition
                    initChat();
                }, 380);
            });
        }

        // Handlers are wired unconditionally above so that "Restart guide"
        // (settings) works even when onboarding was already completed —
        // an unwired overlay would trap the user behind a dead modal.
        if (localStorage.getItem(ONBOARDING_KEY) === '1') {
            elements.onboardingOverlay.classList.add('hidden');
            return;
        }

        elements.onboardingOverlay.classList.remove('hidden');
        translateDOM();
        showOnboardingStep(0);
    }

    // Apply sensible defaults for each condition profile
    function applyConditionPreset(condition, navigate = true) {
        const selectConditionEl = document.getElementById('setting-condition');
        if (selectConditionEl) selectConditionEl.value = condition;

        switch (condition) {
            case 'alzheimer':
                state.fontSize = 'xlarge'; persistFontSize('xlarge'); applyFontSize();
                state.theme = 'warm-sand'; persistTheme('warm-sand'); applyTheme();
                state.sensoryMode = true; persistSensoryMode(true); applySensoryMode();
                if (document.getElementById('setting-font-size')) document.getElementById('setting-font-size').value = 'xlarge';
                if (document.getElementById('setting-theme')) document.getElementById('setting-theme').value = 'warm-sand';
                if (document.getElementById('setting-sensory-mode')) document.getElementById('setting-sensory-mode').checked = true;
                if (navigate) switchTab('refugio');
                break;
            case 'autism':
                state.sensoryMode = true; persistSensoryMode(true); applySensoryMode();
                if (document.getElementById('setting-sensory-mode')) document.getElementById('setting-sensory-mode').checked = true;
                if (navigate) switchTab('sintonia');
                break;
            case 'aphasia':
                // Big buttons, but no assumption about WHICH hand works: the person (or
                // a carer) chooses the side in Settings if one-handed use is needed.
                state.handMode = 'motor-center'; persistHandMode('motor-center'); applyHandMode();
                if (document.getElementById('setting-hand-mode')) document.getElementById('setting-hand-mode').value = 'motor-center';
                if (navigate) switchTab('voz');
                break;
            case 'anxiety':
            case 'ptsd':
                if (navigate) switchTab('refugio');
                break;
            default:
                break;
        }
    }

    // 13c. Restart onboarding (called from Settings button)
    function restartOnboarding() {
        localStorage.removeItem('marea_onboarded');
        if (!elements.onboardingOverlay) return;
        elements.onboardingOverlay.classList.remove('hidden', 'fade-out');
        translateDOM();
        // Reset card visibility & dots to step 0 (buttons are already wired from init)
        const cards = [elements.onbStep0, elements.onbStep1, elements.onbStep2, elements.onbStep3];
        cards.forEach((card, i) => { if (card) card.classList.toggle('hidden', i !== 0); });
        elements.onbDots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i === 0) dot.classList.add('active');
        });
        // Restore current condition selection visually
        const savedCond = localStorage.getItem('marea_condition') || 'other';
        elements.onbStep2 && elements.onbStep2.querySelectorAll('.onb-condition-btn').forEach(btn => {
            btn.classList.toggle('onb-condition-btn--selected', btn.getAttribute('data-condition') === savedCond);
        });
    }
    window.restartOnboarding = restartOnboarding;

    // 13e. Notebook Canvas — drawing pad with stylus/finger/mouse + typed notes
    function initNotebook() {
        const canvas = elements.notebookCanvas;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        let tool = 'pen';
        let isDrawing = false;
        let lastX = 0, lastY = 0;

        let sized = false;
        let restored = false;

        function restoreSaved() {
            const saved = localStorage.getItem('marea_notebook_canvas');
            if (!saved) return;
            const img = new Image();
            img.onload = () => {
                const rctx = canvas.getContext('2d');
                if (rctx) rctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
            };
            img.src = saved;
        }

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            // Hidden tab (0x0): leave the bitmap alone. Sizing it to a guessed 320x240
            // made the pen draw away from the finger once the tab became visible.
            if (!rect.width || !rect.height) return;
            const w = rect.width;
            const h = rect.height;
            if (sized && Math.abs(canvas.width - Math.round(w * dpr)) < 2 && Math.abs(canvas.height - Math.round(h * dpr)) < 2) return;
            // Preserve existing drawing
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = canvas.width;
            tmpCanvas.height = canvas.height;
            const tmpCtx = tmpCanvas.getContext('2d');
            if (tmpCtx && sized) tmpCtx.drawImage(canvas, 0, 0);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            if (sized) ctx.drawImage(tmpCanvas, 0, 0, w, h);
            sized = true;
            if (!restored) { restored = true; restoreSaved(); }
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        // Fires when the Diario tab is first shown (and on any later size change)
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeCanvas).observe(canvas);

        if (elements.notebookText) {
            elements.notebookText.value = localStorage.getItem('marea_notebook_text') || '';
        }

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - rect.left, y: src.clientY - rect.top };
        }

        function startDraw(e) {
            resizeCanvas(); // never draw on a bitmap that does not match the visible size
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x; lastY = pos.y;
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const pos = getPos(e);
            const pressure = (e.pressure !== undefined && e.pressure > 0) ? e.pressure : 0.5;
            const size = parseFloat(elements.notebookSize ? elements.notebookSize.value : 4);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);

            if (tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = size * 6;
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineWidth = Math.max(1, size * pressure * 1.5);
                ctx.strokeStyle = elements.notebookColor ? elements.notebookColor.value : '#4db896';
            }
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        }

        let _saveTimer = null;
        function endDraw() {
            if (!isDrawing) return;
            isDrawing = false;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.globalCompositeOperation = 'source-over';
            // Auto-save debounced
            clearTimeout(_saveTimer);
            _saveTimer = setTimeout(() => {
                try {
                    localStorage.setItem('marea_notebook_canvas', canvas.toDataURL('image/png', 0.7));
                } catch (e) {
                    showToast(t('journal.save_error') || 'No se pudo guardar el dibujo (almacenamiento lleno)');
                }
            }, 1000);
        }

        canvas.addEventListener('pointerdown', startDraw, { passive: false });
        canvas.addEventListener('pointermove', draw, { passive: false });
        canvas.addEventListener('pointerup', endDraw);
        canvas.addEventListener('pointercancel', endDraw);
        canvas.addEventListener('pointerout', endDraw);
        // Touch fallback for older browsers
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);

        // Tool buttons
        if (elements.notebookPenBtn) {
            elements.notebookPenBtn.addEventListener('click', () => {
                tool = 'pen';
                elements.notebookPenBtn.classList.add('active');
                elements.notebookPenBtn.setAttribute('aria-pressed', 'true');
                if (elements.notebookEraserBtn) {
                    elements.notebookEraserBtn.classList.remove('active');
                    elements.notebookEraserBtn.setAttribute('aria-pressed', 'false');
                }
            });
        }
        if (elements.notebookEraserBtn) {
            elements.notebookEraserBtn.addEventListener('click', () => {
                tool = 'eraser';
                elements.notebookEraserBtn.classList.add('active');
                elements.notebookEraserBtn.setAttribute('aria-pressed', 'true');
                if (elements.notebookPenBtn) {
                    elements.notebookPenBtn.classList.remove('active');
                    elements.notebookPenBtn.setAttribute('aria-pressed', 'false');
                }
            });
        }
        if (elements.notebookClearBtn) {
            elements.notebookClearBtn.addEventListener('click', () => {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                localStorage.removeItem('marea_notebook_canvas');
            });
        }

        // Text auto-save
        if (elements.notebookText) {
            elements.notebookText.addEventListener('input', () => {
                localStorage.setItem('marea_notebook_text', elements.notebookText.value);
            });
        }

        // Save/share button — exports drawing + text as PNG to device
        if (elements.notebookSaveBtn) {
            elements.notebookSaveBtn.addEventListener('click', async () => {
                // Compose final canvas: drawing + text below
                const text = elements.notebookText ? elements.notebookText.value.trim() : '';
                const exportCanvas = document.createElement('canvas');
                const lineHeight = 22;
                const lines = text ? text.split('\n') : [];
                const textAreaH = lines.length > 0 ? lines.length * lineHeight + 40 : 0;
                exportCanvas.width = canvas.width;
                exportCanvas.height = canvas.height + textAreaH * dpr;

                const ectx = exportCanvas.getContext('2d');
                if (!ectx) { showToast(t('journal.notebook_saved')); return; }
                // White background
                ectx.fillStyle = '#ffffff';
                ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                // Drawing
                ectx.drawImage(canvas, 0, 0);
                // Text
                if (lines.length > 0) {
                    ectx.fillStyle = '#1a1a1a';
                    ectx.font = `${16 * dpr}px -apple-system, sans-serif`;
                    ectx.fillStyle = '#333';
                    lines.forEach((line, i) => {
                        ectx.fillText(line, 16 * dpr, canvas.height + (i + 1) * lineHeight * dpr + 10 * dpr);
                    });
                }

                exportCanvas.toBlob(async (blob) => {
                    const fileName = `marea-nota-${new Date().toISOString().slice(0,10)}.png`;
                    const file = new File([blob], fileName, { type: 'image/png' });
                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        try { await navigator.share({ files: [file], title: 'Marea — Nota Sensitiva' }); } catch (_) {}
                    } else {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = fileName; a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                    }
                    showToast(t('journal.notebook_saved'));
                }, 'image/png', 0.92);
            });
        }
    }

    // 13g. Alzheimer Crisis Board — caregiver-operated crisis support
    function initAlzheimerBoard() {
        const board = document.getElementById('alzheimer-crisis-board');
        const responsePanel = document.getElementById('alz-response-panel');
        const responseText = document.getElementById('alz-response-text');
        const speakBtn = document.getElementById('alz-speak-btn');
        const backBtn = document.getElementById('alz-back-btn');
        if (!board) return;

        function autoSpeak(text) {
            speak(text, state.lang, { speedFactor: 0.9 });
        }

        const callRow = document.getElementById('alz-call-row');

        function showResponse(text, key) {
            if (!responsePanel || !responseText) return;
            responseText.textContent = text;
            responsePanel.classList.remove('hidden');
            board.querySelector('.alz-grid')?.classList.add('hidden');
            // Only the emergency card offers a real phone call (the app never calls by itself)
            callRow?.classList.toggle('hidden', key !== 'emergency');
            autoSpeak(text);
        }

        board.querySelectorAll('.alz-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.alzKey;
                const replyKey = `alz.reply.${key}`;
                const found = t(replyKey);
                // t() returns the key itself when a string is missing — never speak that
                showResponse(found !== replyKey ? found : t('alz.reply.lost'), key);
            });
        });

        speakBtn?.addEventListener('click', () => {
            const text = responseText?.textContent;
            if (text) autoSpeak(text);
        });

        backBtn?.addEventListener('click', () => {
            responsePanel?.classList.add('hidden');
            callRow?.classList.add('hidden');
            if (responseText) responseText.textContent = '';
            board.querySelector('.alz-grid')?.classList.remove('hidden');
            stopSpeaking();
        });
    }

    // 13h. Scan Keyboard — row-column switch scanning, zero dependencies, 100% offline
    function initScanKeyboard() {
        const scanBtn    = document.getElementById('eye-gaze-btn');
        const scanKb     = document.getElementById('eye-gaze-keyboard');
        const wordDisplay= document.getElementById('eye-word-display');
        const letterGrid = document.getElementById('eye-letter-grid');
        const closeBtn   = document.getElementById('eye-gaze-close');
        if (!scanBtn || !scanKb) return;

        // Row definitions — determines scanning order and groupings
        let SCAN_ROWS = [];
        // Spanish needs Ñ ("año" is not "ano"); every language keeps the same grid otherwise.
        const scanRowsFor = (lang) => [
            ['A','B','C','D','E'],
            ['F','G','H','I','J'],
            ['K','L','M','N','O'],
            ['P','Q','R','S','T'],
            ['U','V','W','X','Y'],
            lang === 'es' ? ['Z','Ñ','DEL','SPACE','SEND'] : ['Z','DEL','SPACE','SEND'],
        ];
        SCAN_ROWS = scanRowsFor(state.lang);
        // Always slow: 1600ms per step — AAC users need time to react
        const SCAN_SPEED = 1600;

        let builtText = '';
        let phase     = 'row'; // 'row' | 'key'
        let rowIdx    = 0;
        let keyIdx    = 0;
        let scanTimer = null;
        let isOpen    = false;

        // ── Grid builder ─────────────────────────────────────────────────
        function buildGrid() {
            if (!letterGrid) return;
            letterGrid.innerHTML = '';
            SCAN_ROWS.flat().forEach(k => {
                const div = document.createElement('div');
                div.className = 'eye-key';
                div.dataset.key = k;
                if (k === 'DEL')   div.classList.add('eye-key-del');
                if (k === 'SPACE') div.classList.add('eye-key-space');
                if (k === 'SEND')  div.classList.add('eye-key-send');
                const label = k === 'DEL'   ? '⌫'
                            : k === 'SPACE' ? (t('swipe.space') || 'Espacio')
                            : k === 'SEND'  ? (t('swipe.send')  || '→ Texto')
                            : k;
                div.innerHTML = `<span class="eye-key-label">${label}</span>`;
                letterGrid.appendChild(div);
            });
        }

        // ── Word display ─────────────────────────────────────────────────
        function updateDisplay() {
            if (!wordDisplay) return;
            const hint = t('eye.gaze_dwell_hint') || 'Toca en cualquier lugar para seleccionar';
            wordDisplay.textContent = builtText || hint;
            wordDisplay.classList.toggle('eye-word-hint', !builtText);
        }

        // ── Highlight helpers ─────────────────────────────────────────────
        function keyEl(k) {
            return letterGrid?.querySelector(`.eye-key[data-key="${k}"]`);
        }

        function clearHighlights() {
            letterGrid?.querySelectorAll('.eye-key-scan-row, .eye-key-scan-active')
                .forEach(el => el.classList.remove('eye-key-scan-row', 'eye-key-scan-active'));
        }

        function highlightRow(rIdx) {
            clearHighlights();
            SCAN_ROWS[rIdx]?.forEach(k => keyEl(k)?.classList.add('eye-key-scan-row'));
        }

        function highlightKey(rIdx, kIdx) {
            clearHighlights();
            // Keep the rest of the row dimly lit for orientation
            SCAN_ROWS[rIdx]?.forEach(k => keyEl(k)?.classList.add('eye-key-scan-row'));
            const activeK = SCAN_ROWS[rIdx]?.[kIdx];
            if (activeK) {
                const el = keyEl(activeK);
                el?.classList.remove('eye-key-scan-row');
                el?.classList.add('eye-key-scan-active');
            }
        }

        // ── Scanner phases ────────────────────────────────────────────────
        function startRowPhase() {
            clearInterval(scanTimer);
            phase  = 'row';
            rowIdx = 0;
            highlightRow(0);
            scanTimer = setInterval(() => {
                rowIdx = (rowIdx + 1) % SCAN_ROWS.length;
                highlightRow(rowIdx);
            }, SCAN_SPEED);
        }

        function startKeyPhase() {
            clearInterval(scanTimer);
            phase  = 'key';
            keyIdx = 0;
            highlightKey(rowIdx, 0);
            scanTimer = setInterval(() => {
                keyIdx = (keyIdx + 1) % SCAN_ROWS[rowIdx].length;
                highlightKey(rowIdx, keyIdx);
            }, SCAN_SPEED);
        }

        // ── Key commit ────────────────────────────────────────────────────
        function selectKey(k) {
            const el = keyEl(k);
            if (el) {
                el.classList.add('eye-key-selected');
                setTimeout(() => el.classList.remove('eye-key-selected'), 350);
            }
            if (k === 'DEL') {
                builtText = builtText.slice(0, -1);
            } else if (k === 'SPACE') {
                if (builtText && !builtText.endsWith(' ')) builtText += ' ';
            } else if (k === 'SEND') {
                const aacEl = document.getElementById('aac-speech-text');
                const text  = builtText.trim();
                if (text) {
                    speakText(text);
                    learnWords(text);
                    if (aacEl) {
                        aacEl.value = aacEl.value
                            + (aacEl.value && !aacEl.value.endsWith(' ') ? ' ' : '')
                            + text;
                    }
                }
                builtText = '';
                updateDisplay();
                closeScanKb();
                return;
            } else {
                builtText += k.toLowerCase();
            }
            updateDisplay();
        }

        // ── Tap anywhere to advance / select ─────────────────────────────
        function onTap(e) {
            if (e.target.closest('button')) return; // let close/OK buttons handle themselves
            if (e.target.closest('#scan-onboard-overlay')) return; // onboarding overlay absorbs taps
            if (phase === 'row') {
                startKeyPhase();
            } else {
                const k = SCAN_ROWS[rowIdx]?.[keyIdx];
                if (k) selectKey(k);
                // SEND closes the keyboard: restarting the scan here left a timer running forever
                if (isOpen) startRowPhase();
            }
        }

        // ── Onboarding ────────────────────────────────────────────────────
        const ONBOARD_KEY = 'marea_scan_onboarded';

        function showOnboarding() {
            const overlay = document.getElementById('scan-onboard-overlay');
            if (!overlay) { startScan(); return; }
            overlay.classList.remove('hidden');
            const okBtn = overlay.querySelector('.scan-onboard-ok');
            if (okBtn) {
                // Use onclick (not addEventListener) so repeated open/close doesn't stack handlers
                okBtn.onclick = () => {
                    localStorage.setItem(ONBOARD_KEY, '1');
                    overlay.classList.add('hidden');
                    okBtn.onclick = null;
                    startScan();
                };
            }
        }

        function startScan() {
            SCAN_ROWS = scanRowsFor(state.lang);
            buildGrid();
            updateDisplay();
            startRowPhase();
        }

        // ── Open / Close ──────────────────────────────────────────────────
        function openScanKb() {
            if (inputPanels) inputPanels.close();
            isOpen    = true;
            builtText = '';
            scanKb.classList.remove('hidden');
            scanBtn.classList.add('active');
            if (!localStorage.getItem(ONBOARD_KEY)) {
                showOnboarding();
            } else {
                startScan();
            }
        }

        function closeScanKb() {
            isOpen = false;
            clearInterval(scanTimer);
            scanTimer = null;
            clearHighlights();
            // Also hide onboarding overlay if it was open (in case user closed without completing)
            document.getElementById('scan-onboard-overlay')?.classList.add('hidden');
            scanKb.classList.add('hidden');
            scanBtn.classList.remove('active');
        }

        // ── Event wiring ──────────────────────────────────────────────────
        scanBtn.addEventListener('click', openScanKb);
        closeBtn?.addEventListener('click', closeScanKb);
        scanKb.addEventListener('pointerdown', onTap);
    }

    // "Today" for journals/energy must be the person's local day, not UTC
    function localDateStr() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    // Motor mode: ignore an accidental second tap on the same button within 400 ms
    // (tremor/spasticity). Done in JS: a CSS `pointer-events: none` on :active used to
    // swallow every real click. Never blocks Face Control / assistive-tech clicks.
    function initMotorGuard() {
        let lastEl = null;
        let lastAt = 0;
        document.addEventListener('click', (e) => {
            if (!e.isTrusted || !document.body.classList.contains('mode-motor')) return;
            const btn = e.target.closest ? e.target.closest('button') : null;
            if (!btn || btn.closest('.kb-rows') || btn.closest('.hw-actions')) return; // typing must repeat fast
            const now = performance.now();
            if (btn === lastEl && now - lastAt < 400) {
                e.stopImmediatePropagation();
                e.preventDefault();
                return;
            }
            lastEl = btn;
            lastAt = now;
        }, true);
    }

    // Escape closes whatever is on top (dialogs, panels) — keyboard users are never trapped
    function initGlobalKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const full = document.querySelector('.show-fullscreen');
            if (full) { full.remove(); return; }
            const refugeExit = document.getElementById('refuge-exit');
            if (refugeExit) { refugeExit.click(); return; }
            const consent = document.getElementById('face-consent-cancel') || document.getElementById('face-setup-cancel');
            if (consent) { consent.click(); return; }
            const ios = document.getElementById('ios-install-modal');
            if (ios && !ios.classList.contains('hidden')) { ios.classList.add('hidden'); return; }
            const scan = document.getElementById('eye-gaze-keyboard');
            if (scan && !scan.classList.contains('hidden')) { document.getElementById('eye-gaze-close')?.click(); return; }
            if (inputPanels && inputPanels.open) inputPanels.close();
        });
    }

    // Face Control needs ~15 MB (model + runtime). It is cached the first time it is used;
    // this button lets the person (or a carer) store it ahead of time, on purpose, on Wi-Fi.
    function initFaceOfflineButton() {
        const btn = document.getElementById('btn-face-offline');
        const status = document.getElementById('face-offline-status');
        if (!btn) return;
        if (!('serviceWorker' in navigator)) { btn.closest('.settings-item')?.classList.add('hidden'); return; }
        const setStatus = (key) => { if (status) status.textContent = t(key); };
        navigator.serviceWorker.addEventListener('message', (e) => {
            if (!e.data || e.data.type !== 'FACE_PREFETCH') return;
            btn.disabled = false;
            if (e.data.state === 'done') { setStatus('settings.face_offline_done'); showToast(t('settings.face_offline_done')); }
            else if (e.data.state === 'error') { setStatus('settings.face_offline_fail'); showToast(t('settings.face_offline_fail')); }
        });
        btn.addEventListener('click', async () => {
            const reg = await navigator.serviceWorker.ready;
            if (!reg.active) { setStatus('settings.face_offline_fail'); return; }
            btn.disabled = true;
            setStatus('settings.face_offline_busy');
            reg.active.postMessage({ type: 'PREFETCH_FACE' });
        });
        if (window.caches) {
            caches.match('/models/face_landmarker.task').then(r => { if (r) setStatus('settings.face_offline_done'); }).catch(() => {});
        }
    }

    // 14. Initialize App Lifecycle
    translateApp();
    setupEventListeners();
    initOnboarding();
    initSettings();
    initChat();
    initAlzheimerBoard();
    loadSafetyPlan();
    initSintonia();
    initPwaInstall();
    initNotebook();
    inputPanels = initInputPanels();
    initScanKeyboard();
    initMotorGuard();
    initGlobalKeys();
    initNeuro();
    initFaceControl();
    initFaceHeaderButton();

    // 15. Service Worker Registration for Offline capability
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            let accepted = false;
            let reloading = false;

            const offerUpdate = (worker) => {
                const banner = document.getElementById('sw-update-banner');
                if (!banner) return;
                banner.classList.remove('hidden');
                document.getElementById('sw-update-btn')?.addEventListener('click', () => {
                    accepted = true;
                    banner.classList.add('hidden');
                    worker.postMessage({ type: 'SKIP_WAITING' });
                }, { once: true });
                document.getElementById('sw-update-dismiss')?.addEventListener('click', () => {
                    banner.classList.add('hidden');
                }, { once: true });
            };

            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
                    reg.addEventListener('updatefound', () => {
                        const nw = reg.installing;
                        if (!nw) return;
                        nw.addEventListener('statechange', () => {
                            if (nw.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(nw);
                        });
                    });
                })
                .catch(err => console.error('[Service Worker] Registration failed:', err));

            // Reload ONLY after the person pressed "Update now" — never mid-sentence or mid-crisis
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (accepted && !reloading) { reloading = true; window.location.reload(); }
            });
        });
    }
}

/* ----- Exported for main.ts (Phase 1a) ----- */
export { boot };
