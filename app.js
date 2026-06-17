/* ==========================================================================
   MAREA - CORE APPLICATION LOGIC
   Handles routing, i18n rendering, chat state machine, sensory grounding, 
   AAC speech, interactive canvas drawing, and local storage state persistence.
   ========================================================================== */

// Toast notification system (non-blocking, accessibility-friendly)
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    document.body.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add("toast-visible"));
    setTimeout(() => {
        toast.classList.remove("toast-visible");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. App State
    const state = {
        lang: localStorage.getItem("marea_lang") || "es",
        theme: localStorage.getItem("marea_theme") || "deep-sea",
        handMode: localStorage.getItem("marea_hand") || "right",
        activeTab: "refugio",
        activeAnchorSubtab: "breathe",
        
        // Chat
        chatTimer: null,
        chatMessages: [],
        lastDefaultIndex: 0,
        
        // Breathing
        breathingInterval: null,
        breathingState: 0, // 0: Idle, 1: Inhale, 2: Hold, 3: Exhale, 4: Hold Empty
        breathingCycles: 0,
        
        // Grounding Wizard
        groundingStep: 0,
        
        // TIPP Timer
        tippTimerInterval: null,
        tippTimeRemaining: 300, // 5 minutes in seconds
        
        // AAC
        aacActiveCategory: "needs"
    };

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
        btnSyncSupabase: document.getElementById("btn-sync-supabase"),
        btnResetData: document.getElementById("btn-reset-data")
    };

    // 3. i18n Translation Engine
    function translateApp() {
        // Translate text contents
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (i18n[state.lang] && i18n[state.lang][key]) {
                // If it contains SVG children, preserve them
                const svg = el.querySelector("svg");
                if (svg) {
                    el.innerHTML = "";
                    el.appendChild(svg);
                    el.appendChild(document.createTextNode(" " + i18n[state.lang][key]));
                } else {
                    el.textContent = i18n[state.lang][key];
                }
            }
        });

        // Translate placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (i18n[state.lang] && i18n[state.lang][key]) {
                el.setAttribute("placeholder", i18n[state.lang][key]);
            }
        });

        // Update document lang
        document.documentElement.lang = state.lang;
        
        // Reload dynamic components
        renderAACBoard();
        loadQuickResponses();
        drawSensoryCanvas();
    }

    function t(key) {
        return (i18n[state.lang] && i18n[state.lang][key]) || key;
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

    // 5. El Refugio (Validating Active Listening Chat)
    function addChatBubble(text, sender = "system") {
        const bubble = document.createElement("div");
        bubble.className = `chat-msg ${sender}`;
        bubble.textContent = text;
        elements.chatMessagesContainer.appendChild(bubble);
        elements.chatMessagesContainer.scrollTop = elements.chatMessagesContainer.scrollHeight;
    }

    function initChat() {
        elements.chatMessagesContainer.innerHTML = "";
        addChatBubble(t("refugio.start_msg"), "system");
        loadQuickResponses();
        resetStillHereTimer();
    }

    function loadQuickResponses() {
        elements.chatQuickResponses.innerHTML = "";
        const keys = [
            "underwater",
            "cant_breathe",
            "want_cry",
            "rumination",
            "exhausted",
            "just_stay"
        ];
        
        keys.forEach(key => {
            const btn = document.createElement("button");
            btn.className = "quick-response-btn";
            btn.textContent = t(`refugio.quick.${key}`);
            btn.addEventListener("click", () => handleUserMsg(t(`refugio.quick.${key}`), key));
            elements.chatQuickResponses.appendChild(btn);
        });
    }

    function handleUserMsg(text, key = "default") {
        if (!text.trim()) return;
        
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

        // Simulate thoughtful reflection time
        setTimeout(() => {
            elements.chatTypingIndicator.classList.add("hidden");
            elements.chatQuickResponses.classList.remove("hidden");
            
            // Resolve reply using the target detected language
            const reply = (i18n[replyLang] && i18n[replyLang][`refugio.reply.${matchedKey}`]) || t(`refugio.reply.${matchedKey}`);
            addChatBubble(reply, "system");
            resetStillHereTimer();
        }, 1500);
    }

    function resetStillHereTimer() {
        clearTimeout(state.chatTimer);
        elements.chatTypingIndicator.classList.add("hidden");
        
        // After 25s of silence, pulse the "I'm still here" indicator softly
        state.chatTimer = setTimeout(() => {
            elements.chatTypingIndicator.classList.remove("hidden");
            elements.chatMessagesContainer.scrollTop = elements.chatMessagesContainer.scrollHeight;
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
            
            const countdown = setInterval(() => {
                seconds--;
                if (seconds >= 0) {
                    text.textContent = seconds + "s";
                } else {
                    clearInterval(countdown);
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
        if (state.breathingInterval) {
            clearInterval(state.breathingInterval);
            state.breathingInterval = null;
        }
        if (elements.breathingRing) {
            elements.breathingRing.style.transform = "scale(0.6)";
            elements.breathingRingText.textContent = "4s";
            elements.breathingInstruction.textContent = t("anchor.breath_ready");
        }
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
        const icons = {
            help: '<circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>',
            water: '<path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"></path>',
            food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M21 15V2a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3zM18 22V15M9 22V11"></path>',
            pain: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>',
            rest: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"></path>',
            move: '<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"></path>',
            bathroom: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>',
            temp: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>',
            brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M12 5v14M12 9h4M12 14h6M12 9H8M12 14H6"></path>',
            yes: '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>',
            no: '<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6M9 9l6 6"></path>',
            thanks: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>',
            wait: '<path d="M5 2h14M5 22h14M19 2v6a7 7 0 0 1-2.24 5.21v0A7 7 0 0 1 19 16v6M5 2v6a7 7 0 0 0 2.24 5.21v0A7 7 0 0 0 5 16v6"></path>',
            confused: '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"></path>',
            mute: '<line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"></path>',
            home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"></path>',
            underwater: '<path d="M2 6c.6.5 1.2 1 2.5 1C5.8 7 7 6 7 6s1.2-1 2.5-1c1.3 0 2.5 1 2.5 1s1.2 1 2.5 1c1.3 0 2.5-1 2.5-1s1.2-1 2.5-1 2.5 1 2.5 1M2 12c.6.5 1.2 1 2.5 1 1.3 0 2.5-1 2.5-1s1.2-1 2.5-1c1.3 0 2.5 1 2.5 1s1.2 1 2.5 1c1.3 0 2.5-1 2.5-1s1.2-1 2.5-1 2.5 1 2.5 1M2 18c.6.5 1.2 1 2.5 1 1.3 0 2.5-1 2.5-1s1.2-1 2.5-1c1.3 0 2.5 1 2.5 1s1.2 1 2.5 1c1.3 0 2.5-1 2.5-1s1.2-1 2.5-1 2.5 1 2.5 1"></path>',
            overload: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
            sad: '<circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"></path>',
            frustrated: '<polygon points="12 2 2 22 22 22 12 2"></polygon><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17.01"></line>',
            trapped: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
            hug: '<path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14a2 2 0 0 1 2-2h3M22 14a2 2 0 0 0-2-2h-3"></path>',
            love: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>',
            alone: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 11h-6"></path>'
        };
        const path = icons[iconKey] || '<circle cx="12" cy="12" r="10"></circle>';
        return svgHeader + path + '</svg>';
    }

    function renderAACBoard() {
        elements.aacGrid.innerHTML = "";
        
        const categoryData = aacBoardData[state.lang][state.aacActiveCategory];
        if (!categoryData) return;

        categoryData.forEach(item => {
            const card = document.createElement("button");
            card.className = "aac-card-btn";
            card.setAttribute("aria-label", `${item.text}. Toca para decir en voz alta.`);
            
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
        if (!phrase) return;
        
        // Use browser native SpeechSynthesis
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(phrase);
            const langMap = {
                "es": "es-ES",
                "en": "en-GB", // Standardised to British English
                "it": "it-IT",
                "fr": "fr-FR",
                "de": "de-DE",
                "zh": "zh-CN",
                "pt": "pt-PT",
                "ja": "ja-JP"
            };
            utterance.lang = langMap[state.lang] || "en-GB";
            
            // Try to find a nice local voice matching language
            const voices = window.speechSynthesis.getVoices();
            const matchingVoice = voices.find(v => v.lang.startsWith(utterance.lang));
            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("Speech Synthesis not supported in this browser.");
        }
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
        
        const l = parseInt(elements.sliderLight.value);
        const s = parseInt(elements.sliderSound.value);
        const p = parseInt(elements.sliderPressure.value);
        const pain = parseInt(elements.sliderPain.value);
        const r = parseInt(elements.sliderRumination.value);

        // Update slider value labels
        document.getElementById("label-val-light").textContent = t(`journal.val.${l}`);
        document.getElementById("label-val-sound").textContent = t(`journal.val.${s}`);
        document.getElementById("label-val-pressure").textContent = t(`journal.val.${p}`);
        document.getElementById("label-val-pain").textContent = t(`journal.val.${pain}`);
        document.getElementById("label-val-rumination").textContent = t(`journal.val.${r}`);

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
            localStorage.setItem("marea_lang", state.lang);
            translateApp();
            initChat();
        });

        // Hand layout
        elements.selectHandMode.value = state.handMode;
        applyHandMode();
        elements.selectHandMode.addEventListener("change", (e) => {
            state.handMode = e.target.value;
            localStorage.setItem("marea_hand", state.handMode);
            applyHandMode();
        });

        // Visual Theme
        elements.selectTheme.value = state.theme;
        applyTheme();
        elements.selectTheme.addEventListener("change", (e) => {
            state.theme = e.target.value;
            localStorage.setItem("marea_theme", state.theme);
            applyTheme();
        });

        // Wipe Data
        elements.btnResetData.addEventListener("click", () => {
            if (confirm(t("settings.reset_confirm"))) {
                localStorage.clear();
                showToast(t("settings.reset_toast"));
                window.location.reload();
            }
        });
    }

    function applyHandMode() {
        elements.body.classList.remove("mode-right-hand", "mode-left-hand", "mode-center");
        elements.body.classList.add(`mode-${state.handMode}`);
    }

    function applyTheme() {
        elements.body.classList.remove("theme-deep-sea", "theme-warm-sand", "theme-high-contrast", "theme-monochrome");
        elements.body.classList.add(`theme-${state.theme}`);
        
        // Update header background meta tag
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                "deep-sea": "#0B1120",
                "warm-sand": "#faf8f5",
                "high-contrast": "#000000",
                "monochrome": "#090909"
            };
            metaThemeColor.setAttribute("content", colors[state.theme] || "#060913");
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

        // Chat send mechanisms
        elements.chatSendBtn.addEventListener("click", () => {
            handleUserMsg(elements.chatInput.value);
        });
        
        elements.chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                handleUserMsg(elements.chatInput.value);
            }
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
                    const stopText = {
                        "es": "Detener Olas",
                        "it": "Ferma Onde",
                        "fr": "Arrêter les Vagues",
                        "de": "Wellen stoppen",
                        "zh": "停止海浪",
                        "pt": "Parar Ondas",
                        "ja": "波音を止める"
                    };
                    labelSpan.textContent = stopText[state.lang] || "Stop Waves";
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
            speakText(elements.aacSpeechText.value);
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
            const dailyLogs = JSON.parse(localStorage.getItem("marea_journal_logs") || "[]");
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

    // 14. Initialize App Lifecycle
    translateApp();
    setupEventListeners();
    initSettings();
    initChat();
    loadSafetyPlan();

    // 15. Service Worker Registration for Offline capability
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('[Service Worker] Registered successfully:', reg.scope))
                .catch(err => console.error('[Service Worker] Registration failed:', err));
        });
    }
});
