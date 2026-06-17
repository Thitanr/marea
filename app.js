/* ==========================================================================
   MAREA - CORE APPLICATION LOGIC
   Handles routing, i18n rendering, chat state machine, sensory grounding, 
   AAC speech, interactive canvas drawing, and local storage state persistence.
   ========================================================================== */

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
        
        // Simulate thoughtful reflection time
        setTimeout(() => {
            elements.chatTypingIndicator.classList.add("hidden");
            elements.chatQuickResponses.classList.remove("hidden");
            
            const reply = t(`refugio.reply.${key}`);
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
                alert(t("tipp.timer_done"));
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
    function renderAACBoard() {
        elements.aacGrid.innerHTML = "";
        
        const categoryData = aacBoardData[state.lang][state.aacActiveCategory];
        if (!categoryData) return;

        categoryData.forEach(item => {
            const card = document.createElement("button");
            card.className = "aac-card-btn";
            card.setAttribute("aria-label", `${item.text}. Toca para decir en voz alta.`);
            
            card.innerHTML = `
                <span class="aac-card-icon" aria-hidden="true">${item.icon}</span>
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
            utterance.lang = state.lang === "es" ? "es-ES" : "en-US";
            
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
        alert(t("safety.saved_toast"));
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
        ctx.fillStyle = "#03050c";
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
                alert(t("settings.reset_toast"));
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
                "deep-sea": "#060913",
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
                if (labelSpan) labelSpan.textContent = state.lang === "es" ? "Detener Olas" : "Stop Waves";
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
            alert(t("journal.saved_toast"));
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
