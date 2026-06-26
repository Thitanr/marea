/* ==========================================================================
   MAREA - CORE APPLICATION LOGIC
   Handles routing, i18n rendering, chat state machine, sensory grounding,
   AAC speech, interactive canvas drawing, and local storage state persistence.
   ========================================================================== */

import { aacBoardData } from './data/aac-board.js';
import { oceanSynth } from './sound.js';
import { svgIcons } from './data/svg-icons.js';
import { state, persistLang, persistTheme, persistHandMode, persistSensoryMode, persistFontSize, persistReduceMotion } from './state.js';
import { showToast } from './core/toast.js';
import { t, translateDOM, tLang } from './core/i18n.js';

/* ----- Module-compatible init (Phase 1a) ----- */
function boot() {

    // 1b. Voice cache — pre-load TTS voices on boot for zero-delay speech
    let _voiceCache = [];
    function _warmVoices() {
        _voiceCache = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    }
    if ('speechSynthesis' in window) {
        _warmVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
            window.speechSynthesis.onvoiceschanged = _warmVoices;
        }
    }

    // 2. DOM Elements
    const elements = {
        // App Frame
        body: document.body,
        tabs: document.querySelectorAll(".nav-item"),
        panels: document.querySelectorAll(".tab-panel"),
        quickExitBtn: document.getElementById("quick-exit-btn"),
        
        // Refugio (Chat)
        chatMessagesContainer: document.getElementById("chat-messages"),
        chatInput: document.getElementById("chat-text-input"),
        chatSendBtn: document.getElementById("chat-send-btn"),
        chatQuickResponses: document.getElementById("chat-quick-responses"),
        chatTypingIndicator: document.getElementById("chat-typing-indicator"),
        
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
        aacCatBtns: document.querySelectorAll(".aac-cat-btn"),
        aacGrid: document.getElementById("aac-grid"),
        
        // Safety Plan
        inputSafetyPerson: document.getElementById("input-anchor-person"),
        inputSafetySong: document.getElementById("input-anchor-song"),
        inputSafetyMemory: document.getElementById("input-anchor-memory"),
        btnSaveSafety: document.getElementById("btn-save-safety"),
        
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
        btnSyncSupabase: document.getElementById("btn-sync-supabase"),
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

    // 3. i18n Translation Engine
    function translateApp() {
        translateDOM();
        renderAACBoard();
        loadQuickResponses();
        drawSensoryCanvas();
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
        }

        if (tabId === "diario") {
            drawSensoryCanvas();
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

        if (subtabId === "grounding") {
            state.groundingStep = 0;
            renderGroundingStep();
        }
    }

    // 5. El Refugio — Alzheimer Crisis Board only (chat removed)
    function addChatBubble() { /* chat removed */ }

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

    function loadQuickResponses() {
        if (!elements.chatQuickResponses) return;
        elements.chatQuickResponses.innerHTML = "";
        const condition = localStorage.getItem('marea_condition') || '';

        let keys, prefix;
        if (condition === 'alzheimer') {
            keys = ["lost", "confused", "home", "help", "family", "safe"];
            prefix = "refugio.alzheimer.quick.";
        } else {
            keys = ["underwater", "cant_breathe", "want_cry", "rumination", "exhausted", "just_stay"];
            prefix = "refugio.quick.";
        }

        keys.forEach(key => {
            const btn = document.createElement("button");
            btn.className = "quick-response-btn";
            btn.textContent = t(`${prefix}${key}`);
            btn.addEventListener("click", () => handleUserMsg(t(`${prefix}${key}`), key, condition));
            elements.chatQuickResponses.appendChild(btn);
        });
    }

    function handleUserMsg(text, key = "default", condition = null) {
        if (!text.trim()) return;
        if (!elements.chatMessagesContainer) return;
        const activeCondition = condition || localStorage.getItem('marea_condition') || '';

        // Add user msg
        addChatBubble(text, "user");
        elements.chatInput.value = "";
        resetStillHereTimer();
        
        // Hide quick responses while processing
        elements.chatQuickResponses.classList.add("hidden");
        
        // Show typing indicator
        elements.chatTypingIndicator.classList.remove("hidden");
        elements.chatMessagesContainer.scrollTop = elements.chatMessagesContainer.scrollHeight;
        
        // Match user intent if key is default
        let matchedKey = key;
        let replyLang = state.lang;
        
        if (key === "default") {
            const cleanText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents
            
            // Language auto-detection
            const frenchWords = /\b(bonjour|salut|comment|faire|affronter|anxiete|panique|peur|parler|ecrire|aphasie|aide)\b/;
            const germanWords = /\b(hallo|wie|bewaltigen|angst|panik|sprechen|schreiben|aphasie|hilfe)\b/;
            const portugueseWords = /\b(ola|como|enfrentar|lidar|ansiedade|panico|medo|falar|escrever|afasia|ajuda)\b/;
            const italianWords = /\b(ciao|come|affrontarlo|affrontare|ansia|paura|spaventato|parlare|colpo|scrivere|afasia|aiuto)\b/;
            const spanishWords = /\b(hola|como|hago|hacer|enfrento|afronto|sobrevivo|sobrevivir|ansiedad|panico|miedo|ayuda|hablar|hablo|escribir|escribo|afasia)\b/;
            const englishWords = /\b(hello|hi|how|cope|handle|face|survive|anxiety|panic|fear|scared|afraid|speak|aphasia|stroke|talk|writing|type|help)\b/;
            
            if (italianWords.test(cleanText)) {
                replyLang = "it";
            } else if (frenchWords.test(cleanText)) {
                replyLang = "fr";
            } else if (germanWords.test(cleanText)) {
                replyLang = "de";
            } else if (portugueseWords.test(cleanText)) {
                replyLang = "pt";
            } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) { // Japanese Hiragana/Katakana
                replyLang = "ja";
            } else if (/[\u4e00-\u9fa5]/.test(text)) { // Chinese / Japanese Kanji (default to Chinese)
                replyLang = "zh";
            } else if (englishWords.test(cleanText)) {
                replyLang = "en";
            } else if (spanishWords.test(cleanText)) {
                replyLang = "es";
            }
            
            // Intent classification (multi-language regex matching)
            // 1. Intent: How / Afrontar
            if (/\b(como|hago|hacer|enfrento|afronto|sobrevivo|sobrevivir|solucion|afrontarlo|how|cope|handle|face|survive|affrontarlo|affrontare|comment|faire|affronter|wie|bewaltigen|lidar|enfrentar|どう|対処|克服)\b/.test(cleanText) || /[\u5982\u4f55\u600e\u4e48\u529e]/.test(text)) {
                matchedKey = "how";
            }
            // 2. Intent: Anxiety / Panic
            else if (/\b(ansiedad|panico|miedo|asustado|asustada|temblor|palpitaciones|anxiety|panic|fear|scared|afraid|racing|ansia|paura|spaventato|anxiete|panique|peur|angst|panik|medo|不安|パニック|恐怖)\b/.test(cleanText) || /[\u7126\u8651\u6050\u614c\u5bb3\u6015]/.test(text)) {
                matchedKey = "anxiety";
            }
            // 3. Intent: Speech / Afasia / Dysarthria
            else if (/\b(hablar|afasia|ictus|hablo|escribir|escribo|speak|aphasia|stroke|talk|writing|type|parlare|colpo|scrivere|ecrire|aphasie|catastro|ictus|parler|sprechen|schreiben|falar|escrever|話|話す|喋|言葉)\b/.test(cleanText) || /[\u8bf4\u8bdd\u5199\u5b57\u5931\u8bed]/.test(text)) {
                matchedKey = "speech";
            }
            // General conversation -> cycle default replies
            else {
                matchedKey = `default_${state.lastDefaultIndex}`;
                state.lastDefaultIndex = (state.lastDefaultIndex + 1) % 5;
            }
        }

        // Alzheimer profile: simple, calm, short replies — no complex intent matching needed
        if (activeCondition === 'alzheimer') {
            const alzKey = ['lost','confused','home','help','family','safe'].includes(key)
                ? key : 'safe';
            setTimeout(() => {
                elements.chatTypingIndicator.classList.add("hidden");
                elements.chatQuickResponses.classList.remove("hidden");
                addChatBubble(t(`refugio.alzheimer.reply.${alzKey}`), "system");
                resetStillHereTimer();
            }, 800);
            return;
        }

        // Simulate thoughtful reflection time
        setTimeout(() => {
            elements.chatTypingIndicator.classList.add("hidden");
            elements.chatQuickResponses.classList.remove("hidden");

            // Resolve reply using the target detected language
            const reply = tLang(replyLang, `refugio.reply.${matchedKey}`);
            addChatBubble(reply, "system");
            resetStillHereTimer();
        }, 1500);
    }

    function resetStillHereTimer() {
        if (!elements.chatTypingIndicator) return;
        clearTimeout(state.chatTimer);
        elements.chatTypingIndicator.classList.add("hidden");
        state.chatTimer = setTimeout(() => {
            elements.chatTypingIndicator?.classList.remove("hidden");
        }, 25000);
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
        
        const categoryData = aacBoardData[state.lang][state.aacActiveCategory];
        if (!categoryData) return;

        categoryData.forEach(item => {
            const card = document.createElement("button");
            card.className = "aac-card-btn";
            card.setAttribute("aria-label", `${item.text}. ${t('aac.tap_to_speak')}`);
            
            card.innerHTML = `
                <span class="aac-card-icon" aria-hidden="true">${getAacSvgIcon(item.icon)}</span>
                <span class="aac-card-label">${item.text}</span>
            `;
            
            card.addEventListener("click", () => {
                // Highlight button
                card.style.borderColor = "var(--accent-glow)";
                card.style.boxShadow = "0 0 15px var(--accent-glow)";
                setTimeout(() => {
                    card.style.borderColor = "";
                    card.style.boxShadow = "";
                }, 400);

                // Add to text pad
                if (elements.aacSpeechText.value) {
                    elements.aacSpeechText.value += " " + item.text;
                } else {
                    elements.aacSpeechText.value = item.text;
                }
                
                // Speak out loud
                speakText(item.spoken);
            });

            elements.aacGrid.appendChild(card);
        });
    }

    function speakText(phrase) {
        if (!phrase || !phrase.trim()) return;
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(phrase.trim());
        const langMap = { es: "es-ES", en: "en-GB", it: "it-IT", fr: "fr-FR", de: "de-DE", zh: "zh-CN", pt: "pt-PT", ja: "ja-JP" };
        utterance.lang = langMap[state.lang] || "en-GB";

        // Use pre-warmed cache; fall back to live query if empty
        const voices = (_voiceCache && _voiceCache.length) ? _voiceCache : window.speechSynthesis.getVoices();
        const langPrefix = utterance.lang.substring(0, 2);
        const voice = voices.find(v => v.lang === utterance.lang) || voices.find(v => v.lang.startsWith(langPrefix));
        if (voice) utterance.voice = voice;

        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }

    // 10. Safety Plan Anchors
    function loadSafetyPlan() {
        elements.inputSafetyPerson.value = localStorage.getItem("marea_safety_person") || "";
        elements.inputSafetySong.value = localStorage.getItem("marea_safety_song") || "";
        elements.inputSafetyMemory.value = localStorage.getItem("marea_safety_memory") || "";
    }

    function saveSafetyPlan() {
        localStorage.setItem("marea_safety_person", elements.inputSafetyPerson.value);
        localStorage.setItem("marea_safety_song", elements.inputSafetySong.value);
        localStorage.setItem("marea_safety_memory", elements.inputSafetyMemory.value);
        showToast(t("safety.saved_toast"));
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

        // Sync (coming soon)
        elements.btnSyncSupabase.addEventListener("click", () => {
            showToast(t("settings.sync_coming"));
        });

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
            selectCondition.value = localStorage.getItem('marea_condition') || '';
            selectCondition.addEventListener('change', (e) => {
                const cond = e.target.value;
                localStorage.setItem('marea_condition', cond);
                applyConditionPreset(cond);
                initChat();
                showToast(t('settings.condition_title'));
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
            elements.body.classList.add(`mode-${base}-hand`, "mode-motor");
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
        elements.body.classList.remove("font-large", "font-xlarge");
        if (state.fontSize === "large") elements.body.classList.add("font-large");
        else if (state.fontSize === "xlarge") elements.body.classList.add("font-xlarge");
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
            window.location.href = "https://www.google.com";
        });

        // Chat send mechanisms (guarded — chat removed from refugio tab)
        elements.chatSendBtn?.addEventListener("click", () => {
            handleUserMsg(elements.chatInput?.value ?? '');
        });
        elements.chatInput?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleUserMsg(elements.chatInput.value);
        });

        // Grounding Stepper navigation buttons
        elements.groundingNextBtn.addEventListener("click", () => {
            state.groundingStep++;
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
            // Clear pad after speaking so the next request starts fresh
            setTimeout(() => { elements.aacSpeechText.value = ""; }, 300);
        });

        elements.aacCatBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                elements.aacCatBtns.forEach(b => {
                    b.classList.remove("active");
                    b.setAttribute("aria-selected", "false");
                });
                btn.classList.add("active");
                btn.setAttribute("aria-selected", "true");
                
                state.aacActiveCategory = btn.getAttribute("data-category");
                renderAACBoard();
            });
        });

        // Safety Plan Save
        elements.btnSaveSafety.addEventListener("click", saveSafetyPlan);

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
                date: new Date().toISOString().split('T')[0],
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
                    regDetail.innerHTML = `<p class="state-detail-what">${t('sintonia.reg.' + key + '_detail')}</p>`;
                    regDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }

    // 13c. Speech-to-Text — native device microphone, no AI
    function initSpeechRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const micBtn = document.getElementById('chat-mic-btn');
        if (!micBtn) return;
        if (!SR) { micBtn.style.display = 'none'; return; }

        const LANG_MAP = { es: 'es-ES', en: 'en-US', it: 'it-IT', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN', pt: 'pt-BR', ja: 'ja-JP' };
        let recognition = null;
        let listening = false;

        function startListening() {
            // Abort any in-progress session before creating a new one
            if (recognition) { try { recognition.abort(); } catch (_) {} }
            recognition = new SR();
            recognition.lang = LANG_MAP[state.lang] || 'es-ES';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                listening = true;
                micBtn.classList.add('listening');
                micBtn.setAttribute('aria-label', t('refugio.mic_stop'));
            };
            recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                const input = elements.chatInput;
                if (input) input.value = (input.value + ' ' + text).trim();
                if (input) input.focus();
            };
            recognition.onend = () => {
                listening = false;
                micBtn.classList.remove('listening');
                micBtn.setAttribute('aria-label', t('refugio.mic_start'));
            };
            recognition.onerror = (e) => {
                listening = false;
                micBtn.classList.remove('listening');
                micBtn.setAttribute('aria-label', t('refugio.mic_start'));
                if (e.error === 'not-allowed') {
                    showToast(t('refugio.mic_denied') || 'Permiso de micrófono denegado');
                }
            };
            recognition.start();
        }

        function showNotice() {
            const overlay = document.createElement('div');
            overlay.className = 'stt-overlay';
            overlay.innerHTML = `
                <div class="stt-notice" role="dialog" aria-modal="true">
                    <p class="stt-notice-text">${t('stt.notice_text')}</p>
                    <div class="stt-notice-actions">
                        <button class="btn-secondary" id="stt-cancel">${t('stt.notice_cancel')}</button>
                        <button class="btn-primary" id="stt-accept">${t('stt.notice_accept')}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            document.getElementById('stt-accept').addEventListener('click', () => {
                localStorage.setItem('marea_stt_ok', '1');
                overlay.remove();
                startListening();
            });
            document.getElementById('stt-cancel').addEventListener('click', () => overlay.remove());
        }

        micBtn.addEventListener('click', () => {
            if (listening) { recognition && recognition.stop(); return; }
            if (!localStorage.getItem('marea_stt_ok')) { showNotice(); return; }
            startListening();
        });
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
            if (pwaItem) pwaItem.style.display = '';
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
            if (pwaItem) pwaItem.style.display = 'none';
            const banner = document.getElementById('ios-install-banner');
            if (banner) banner.classList.add('hidden');
            if (outcome === 'accepted') showToast(t('settings.pwa_installed'));
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (pwaItem) pwaItem.style.display = '';
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
            if (pwaItem) pwaItem.style.display = 'none';
        });
    }

    // 13b. Onboarding Wizard — 4-step welcome guide with condition selector
    function initOnboarding() {
        if (!elements.onboardingOverlay) return;

        const ONBOARDING_KEY = 'marea_onboarded';
        let selectedCondition = localStorage.getItem('marea_condition') || 'other';

        if (localStorage.getItem(ONBOARDING_KEY) === '1') {
            elements.onboardingOverlay.classList.add('hidden');
            return;
        }

        elements.onboardingOverlay.classList.remove('hidden');
        translateDOM();
        showOnboardingStep(0);

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
    }

    // Apply sensible defaults for each condition profile
    function applyConditionPreset(condition) {
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
                switchTab('refugio');
                break;
            case 'autism':
                state.sensoryMode = true; persistSensoryMode(true); applySensoryMode();
                if (document.getElementById('setting-sensory-mode')) document.getElementById('setting-sensory-mode').checked = true;
                switchTab('sintonia');
                break;
            case 'aphasia':
                state.handMode = 'motor-right'; persistHandMode('motor-right'); applyHandMode();
                if (document.getElementById('setting-hand-mode')) document.getElementById('setting-hand-mode').value = 'motor-right';
                switchTab('voz');
                break;
            case 'anxiety':
                switchTab('refugio');
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

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width || 320;
            const h = rect.height || 240;
            // Preserve existing drawing
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = canvas.width;
            tmpCanvas.height = canvas.height;
            const tmpCtx = tmpCanvas.getContext('2d');
            if (tmpCtx) tmpCtx.drawImage(canvas, 0, 0);
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            ctx.drawImage(tmpCanvas, 0, 0, w, h);
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Restore saved drawing
        const saved = localStorage.getItem('marea_notebook_canvas');
        if (saved) {
            const img = new Image();
            img.onload = () => {
                const rctx = canvas.getContext('2d');
                if (rctx) rctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
            };
            img.src = saved;
        }
        if (elements.notebookText) {
            elements.notebookText.value = localStorage.getItem('marea_notebook_text') || '';
        }

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return { x: src.clientX - rect.left, y: src.clientY - rect.top };
        }

        function startDraw(e) {
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

    // 13f. Swipe Keyboard — slide-to-type for fast/one-handed AAC input
    function initSwipeKeyboard() {
        const swipeBtn = document.getElementById('eye-mode-btn');
        const keyboard = document.getElementById('swipe-keyboard');
        const wordEl = document.getElementById('swipe-kb-word');
        const hintEl = document.getElementById('swipe-kb-hint');
        const closeBtn = document.getElementById('swipe-kb-close');
        const rowsEl = document.getElementById('swipe-kb-rows');
        if (!swipeBtn || !keyboard || !wordEl || !rowsEl) return;

        const ROWS = [
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L'],
            ['Z','X','C','V','B','N','M','⌫'],
        ];

        let active = false;
        let isSwiping = false;
        let lastKey = null;
        let builtText = '';
        let trailCanvas = null;
        let ctx = null;
        let trailPoints = [];
        let pointerHandled = false;  // suppress click after pointer interaction

        function buildKeyboard() {
            rowsEl.innerHTML = '';
            ROWS.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'swipe-kb-row';
                row.forEach(letter => {
                    const btn = document.createElement('button');
                    btn.className = 'swipe-key' + (letter === '⌫' ? ' swipe-key-del' : '');
                    btn.dataset.key = letter;
                    btn.textContent = letter;
                    btn.type = 'button';
                    rowDiv.appendChild(btn);
                });
                rowsEl.appendChild(rowDiv);
            });
            const bottomRow = document.createElement('div');
            bottomRow.className = 'swipe-kb-row swipe-kb-bottom';
            const spaceBtn = document.createElement('button');
            spaceBtn.className = 'swipe-key swipe-key-space';
            spaceBtn.dataset.key = 'SPACE';
            spaceBtn.textContent = t('swipe.space') || 'Espacio';
            spaceBtn.type = 'button';
            const sendBtn = document.createElement('button');
            sendBtn.className = 'swipe-key swipe-key-send';
            sendBtn.dataset.key = 'SEND';
            sendBtn.textContent = t('swipe.send') || 'Añadir';
            sendBtn.type = 'button';
            bottomRow.appendChild(spaceBtn);
            bottomRow.appendChild(sendBtn);
            rowsEl.appendChild(bottomRow);

            const existing = keyboard.querySelector('.swipe-trail-canvas');
            if (existing) existing.remove();
            trailCanvas = document.createElement('canvas');
            trailCanvas.className = 'swipe-trail-canvas';
            trailCanvas.setAttribute('aria-hidden', 'true');
            keyboard.insertBefore(trailCanvas, rowsEl);
            ctx = trailCanvas.getContext('2d');
            setTimeout(resizeCanvas, 20);
        }

        function resizeCanvas() {
            if (!trailCanvas || !rowsEl) return;
            const rect = rowsEl.getBoundingClientRect();
            trailCanvas.width = rect.width;
            trailCanvas.height = rect.height;
            trailCanvas.style.width = rect.width + 'px';
            trailCanvas.style.height = rect.height + 'px';
            trailCanvas.style.top = rowsEl.offsetTop + 'px';
        }

        function clearTrail() {
            if (ctx && trailCanvas) ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
            trailPoints = [];
        }

        function drawTrail() {
            if (!ctx || !trailCanvas || trailPoints.length < 2) return;
            ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
            ctx.strokeStyle = 'rgba(77,184,150,0.65)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(77,184,150,0.4)';
            ctx.beginPath();
            ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
            for (let i = 1; i < trailPoints.length; i++) ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
            ctx.stroke();
            ctx.shadowBlur = 0;
            const last = trailPoints[trailPoints.length - 1];
            ctx.fillStyle = 'rgba(77,184,150,0.9)';
            ctx.beginPath();
            ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        function getKeyAt(cx, cy) {
            const el = document.elementFromPoint(cx, cy);
            if (!el) return null;
            const k = el.closest('.swipe-key');
            return k && k.closest('#swipe-kb-rows') ? k : null;
        }

        function highlightKey(el) {
            rowsEl.querySelectorAll('.swipe-key.key-active').forEach(k => k.classList.remove('key-active'));
            if (el) el.classList.add('key-active');
        }

        function getAACText() { return document.getElementById('aac-speech-text'); }

        function sendToAAC() {
            const aacText = getAACText();
            const text = builtText.trim();
            if (aacText && text) {
                const existing = aacText.value;
                aacText.value = existing + (existing && !existing.endsWith(' ') ? ' ' : '') + text;
            }
            builtText = '';
            wordEl.textContent = '';
            if (hintEl) hintEl.style.display = '';
        }

        function handleSpecial(k) {
            if (k === '⌫') {
                const aacText = getAACText();
                if (builtText.length > 0) {
                    builtText = builtText.slice(0, -1);
                } else if (aacText && aacText.value.length > 0) {
                    aacText.value = aacText.value.slice(0, -1);
                }
                wordEl.textContent = builtText;
                return true;
            }
            if (k === 'SPACE') {
                builtText += builtText && !builtText.endsWith(' ') ? ' ' : '';
                wordEl.textContent = builtText;
                return true;
            }
            if (k === 'SEND') {
                sendToAAC();
                toggleKeyboard(false);
                return true;
            }
            return false;
        }

        // Pointer events — work for mouse, touch, and stylus
        function onPointerDown(e) {
            if (!active) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            const keyEl = getKeyAt(e.clientX, e.clientY);
            if (!keyEl) return;
            e.preventDefault();
            keyboard.setPointerCapture(e.pointerId);
            pointerHandled = true;
            isSwiping = true;
            lastKey = null;
            clearTrail();
            const kRect = rowsEl.getBoundingClientRect();
            trailPoints.push({ x: e.clientX - kRect.left, y: e.clientY - kRect.top });
            const k = keyEl.dataset.key;
            if (!handleSpecial(k)) {
                builtText += k.toLowerCase();
                lastKey = k;
                wordEl.textContent = builtText;
                if (hintEl) hintEl.style.display = 'none';
                highlightKey(keyEl);
            }
        }

        function onPointerMove(e) {
            if (!isSwiping || !active) return;
            e.preventDefault();
            const kRect = rowsEl.getBoundingClientRect();
            trailPoints.push({ x: e.clientX - kRect.left, y: e.clientY - kRect.top });
            drawTrail();
            const keyEl = getKeyAt(e.clientX, e.clientY);
            if (!keyEl) return;
            const k = keyEl.dataset.key;
            if (k !== lastKey && k !== '⌫' && k !== 'SPACE' && k !== 'SEND') {
                builtText += k.toLowerCase();
                lastKey = k;
                wordEl.textContent = builtText;
                highlightKey(keyEl);
            }
        }

        function onPointerUp() {
            if (!isSwiping) return;
            isSwiping = false;
            highlightKey(null);
            if (builtText && !builtText.endsWith(' ')) builtText += ' ';
            wordEl.textContent = builtText;
            setTimeout(clearTrail, 400);
        }

        function onPointerCancel() {
            isSwiping = false;
            pointerHandled = false;
            highlightKey(null);
            clearTrail();
        }

        rowsEl.addEventListener('click', e => {
            // Suppress click when pointer already handled the interaction
            if (pointerHandled) { pointerHandled = false; return; }
            const key = e.target.closest('.swipe-key');
            if (!key) return;
            const k = key.dataset.key;
            if (handleSpecial(k)) return;
            builtText += k.toLowerCase();
            wordEl.textContent = builtText;
            if (hintEl) hintEl.style.display = 'none';
        });

        function toggleKeyboard(show) {
            active = show !== undefined ? show : !active;
            const aacBoard = document.querySelector('.aac-board-wrapper');
            const span = swipeBtn.querySelector('span');
            if (active) {
                keyboard.classList.remove('hidden');
                aacBoard?.classList.add('hidden');
                if (span) span.textContent = t('eye.btn_stop') || 'Cerrar';
                swipeBtn.classList.add('active');
                builtText = '';
                wordEl.textContent = '';
                buildKeyboard();
                keyboard.addEventListener('pointerdown', onPointerDown, { passive: false });
                keyboard.addEventListener('pointermove', onPointerMove, { passive: false });
                keyboard.addEventListener('pointerup', onPointerUp);
                keyboard.addEventListener('pointercancel', onPointerCancel);
            } else {
                keyboard.classList.add('hidden');
                aacBoard?.classList.remove('hidden');
                if (span) span.textContent = t('eye.btn_text') || 'Deslizar';
                swipeBtn.classList.remove('active');
                keyboard.removeEventListener('pointerdown', onPointerDown);
                keyboard.removeEventListener('pointermove', onPointerMove);
                keyboard.removeEventListener('pointerup', onPointerUp);
                keyboard.removeEventListener('pointercancel', onPointerCancel);
                clearTrail();
            }
        }

        swipeBtn.addEventListener('click', () => toggleKeyboard());
        closeBtn?.addEventListener('click', () => { sendToAAC(); toggleKeyboard(false); });
    }

    // 13g. Alzheimer Crisis Board — caregiver-operated crisis support
    function initAlzheimerBoard() {
        const board = document.getElementById('alzheimer-crisis-board');
        const responsePanel = document.getElementById('alz-response-panel');
        const responseText = document.getElementById('alz-response-text');
        const speakBtn = document.getElementById('alz-speak-btn');
        const backBtn = document.getElementById('alz-back-btn');
        if (!board) return;

        const LANG_MAP = { es:'es-ES', en:'en-US', it:'it-IT', fr:'fr-FR', de:'de-DE', zh:'zh-CN', pt:'pt-PT', ja:'ja-JP' };

        function autoSpeak(text) {
            if (!('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = LANG_MAP[state.lang] || 'es-ES';
            u.rate = 0.82;
            window.speechSynthesis.speak(u);
        }

        function showResponse(text) {
            if (!responsePanel || !responseText) return;
            responseText.textContent = text;
            responsePanel.classList.remove('hidden');
            board.querySelector('.alz-grid')?.classList.add('hidden');
            autoSpeak(text);
        }

        board.querySelectorAll('.alz-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.alzKey;
                const reply = t(`alz.reply.${key}`) || t(`refugio.alzheimer.reply.${key}`) || t('alz.reply.lost');
                showResponse(reply);
            });
        });

        speakBtn?.addEventListener('click', () => {
            const text = responseText?.textContent;
            if (text) autoSpeak(text);
        });

        backBtn?.addEventListener('click', () => {
            responsePanel?.classList.add('hidden');
            if (responseText) responseText.textContent = '';
            board.querySelector('.alz-grid')?.classList.remove('hidden');
            window.speechSynthesis?.cancel();
        });
    }

    // 13h. Scan Keyboard — row-column switch scanning, zero dependencies, 100% offline
    function initScanKeyboard() {
        const scanBtn    = document.getElementById('eye-gaze-btn');
        const scanKb     = document.getElementById('eye-gaze-keyboard');
        const wordDisplay= document.getElementById('eye-word-display');
        const letterGrid = document.getElementById('eye-letter-grid');
        const closeBtn   = document.getElementById('eye-gaze-close');
        const speedBtn   = document.getElementById('eye-recalib-btn');
        if (!scanBtn || !scanKb) return;

        const DWELL_MS    = 1200;
        const CALIB_CLICKS= 3;     // clicks per dot for calibration
        const WG_CDN      = 'https://cdn.jsdelivr.net/npm/webgazer@2.1.0/dist/webgazer.min.js';
        const LANG_MAP    = { es:'es-ES', en:'en-US', it:'it-IT', fr:'fr-FR', de:'de-DE', zh:'zh-CN', pt:'pt-PT', ja:'ja-JP' };

        // Row definitions — determines scanning order and groupings
        const SCAN_ROWS = [
            ['A','B','C','D','E'],
            ['F','G','H','I','J'],
            ['K','L','M','N','O'],
            ['P','Q','R','S','T'],
            ['U','V','W','X','Y'],
            ['Z','DEL','SPACE','SEND'],
        ];
        // Scan speeds in ms: slow / normal / fast
        const SPEEDS    = [1600, 1100, 700];
        const SPEED_ICONS = ['🐢', '▶', '⚡'];

        let builtText = '';
        let phase     = 'row'; // 'row' | 'key'
        let rowIdx    = 0;
        let keyIdx    = 0;
        let scanTimer = null;
        let speedIdx  = 1; // default: normal
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
            }, SPEEDS[speedIdx]);
        }

        function startKeyPhase() {
            clearInterval(scanTimer);
            phase  = 'key';
            keyIdx = 0;
            highlightKey(rowIdx, 0);
            scanTimer = setInterval(() => {
                keyIdx = (keyIdx + 1) % SCAN_ROWS[rowIdx].length;
                highlightKey(rowIdx, keyIdx);
            }, SPEEDS[speedIdx]);
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
                if (aacEl && text) {
                    aacEl.value = aacEl.value
                        + (aacEl.value && !aacEl.value.endsWith(' ') ? ' ' : '')
                        + text;
                }
                builtText = '';
            } else {
                builtText += k.toLowerCase();
            }
            updateDisplay();
        }

        // ── Tap anywhere to advance / select ─────────────────────────────
        function onTap(e) {
            if (e.target.closest('button')) return; // let close/speed buttons handle themselves
            if (phase === 'row') {
                startKeyPhase();
            } else {
                const k = SCAN_ROWS[rowIdx]?.[keyIdx];
                if (k) selectKey(k);
                startRowPhase();
            }
        }

        // ── Open / Close ──────────────────────────────────────────────────
        function openScanKb() {
            isOpen    = true;
            builtText = '';
            scanKb.classList.remove('hidden');
            scanBtn.classList.add('active');
            buildGrid();
            updateDisplay();
            startRowPhase();
        }

        function closeScanKb() {
            isOpen = false;
            clearInterval(scanTimer);
            scanTimer = null;
            clearHighlights();
            scanKb.classList.add('hidden');
            scanBtn.classList.remove('active');
        }

        // ── Speed toggle ──────────────────────────────────────────────────
        function updateSpeedBtn() {
            if (!speedBtn) return;
            speedBtn.textContent = SPEED_ICONS[speedIdx];
        }

        speedBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            speedIdx = (speedIdx + 1) % SPEEDS.length;
            updateSpeedBtn();
            if (isOpen) {
                if (phase === 'row') startRowPhase();
                else startKeyPhase();
            }
        });

        // ── Event wiring ──────────────────────────────────────────────────
        scanBtn.addEventListener('click', openScanKb);
        closeBtn?.addEventListener('click', closeScanKb);
        scanKb.addEventListener('pointerdown', onTap);

        updateSpeedBtn();
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
    initSpeechRecognition();
    initPwaInstall();
    initNotebook();
    initSwipeKeyboard();
    initScanKeyboard();

    // 15. Service Worker Registration for Offline capability
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    console.log('[Service Worker] Registered:', reg.scope);

                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (!navigator.serviceWorker.controller) {
                                    // First install — activate immediately
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                } else {
                                    // Update available — auto-apply and show brief notification
                                    _reloadPending = true;
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    _showUpdateBanner();
                                }
                            }
                        });
                    });
                })
                .catch(err => console.error('[Service Worker] Registration failed:', err));

            // After SKIP_WAITING the controller changes — reload to pick up new assets
            let _reloadPending = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (_reloadPending) window.location.reload();
            });

            function _showUpdateBanner() {
                const banner = document.getElementById('sw-update-banner');
                if (!banner) return;
                banner.classList.remove('hidden');
                // Update is already applied — page will reload via controllerchange
                document.getElementById('sw-update-btn')?.addEventListener('click', () => {
                    banner.classList.add('hidden');
                }, { once: true });
                document.getElementById('sw-update-dismiss')?.addEventListener('click', () => {
                    banner.classList.add('hidden');
                }, { once: true });
            }
        });
    }
}

/* ----- Exported for main.ts (Phase 1a) ----- */
export { boot };
