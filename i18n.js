/* ==========================================================================
   MAREA - INTERNATIONALIZATION ENGINE (i18n)
   Pure JavaScript Localization Dictionary (ES / EN)
   ========================================================================== */

const i18n = {
    es: {
        // Menu & Navigation
        "nav.refugio": "Refugio",
        "nav.ancla": "Ancla",
        "nav.voz": "Voz",
        "nav.seguridad": "Anclajes",
        "nav.diario": "Diario",
        "nav.settings": "Ajustes",
        "header.exit": "Salir",

        // General buttons
        "common.start": "Comenzar",
        "common.prev": "Atrás",
        "common.next": "Siguiente",
        "common.done": "Hecho",

        // El Refugio (Chat)
        "refugio.still_here": "Sigo aquí. No tienes que decir nada...",
        "refugio.input_placeholder": "Escribe aquí si lo deseas...",
        "refugio.start_msg": "Hola. Has entrado en Marea. Aquí no hay expectativas, consejos no solicitados ni prisa. Dime cómo te sientes o simplemente quédate en silencio. Estoy aquí contigo.",
        
        // Quick responses for chat
        "refugio.quick.underwater": "Me siento bajo el agua",
        "refugio.quick.cant_breathe": "No puedo respirar bien",
        "refugio.quick.want_cry": "Quiero llorar y no sé cómo",
        "refugio.quick.rumination": "No puedo parar de pensar ('y si')",
        "refugio.quick.exhausted": "Estoy físicamente agotado/a",
        "refugio.quick.just_stay": "Solo quiero estar aquí en silencio",

        // Chatbot dialogue system responses
        "refugio.reply.underwater": "Tiene sentido que te sientas así. La presión es inmensa. Reduce tu espacio temporal: no pienses en mañana, solo resiste en este minuto. Estoy aquí a tu lado.",
        "refugio.reply.cant_breathe": "La opresión física es aterradora. Vamos a regularla. Ve a la pestaña 'Ancla' arriba y selecciona 'Respirar' o 'Agua Fría'. No hay prisa, te espero aquí.",
        "refugio.reply.want_cry": "El llanto retenido es como una presa llena de agua. No te fuerces. Está bien no saber cómo liberarlo. Sostengo el espacio contigo, no tienes que hacer nada perfecto.",
        "refugio.reply.rumination": "El bucle del 'y si' intenta controlar lo incontrolable y agota el cuerpo. Vamos a romperlo. Ve al menú 'Ancla' y selecciona 'Grounding (54321)' para enfocar tus sentidos.",
        "refugio.reply.exhausted": "Descansa. Tu cuerpo ha estado luchando contra una marea invisible durante mucho tiempo. No tienes que demostrar nada ahora. Deja caer tu peso, sigo aquí.",
        "refugio.reply.just_stay": "Me quedo contigo. No es necesario hablar. Enfoca tu mirada en la pantalla o cierra los ojos. El silencio es seguro aquí.",
        "refugio.reply.default": "Te escucho. Todo lo que sientes es válido, incluso la confusión o el dolor sin nombre. Si el dolor es demasiado grande, recuerda que en la pestaña 'Anclajes' tienes tus recursos de apoyo.",

        // El Ancla (Grounding & Regulators)
        "anchor.breathe_tab": "Respirar",
        "anchor.grounding_tab": "Sentidos (54321)",
        "anchor.tipp_tab": "Agua Fría (TIPP)",
        "anchor.breath_ready": "Pulsa el círculo para iniciar respiración de caja (4-4-4-4)",
        "anchor.breath_inhale": "Inhala profundamente...",
        "anchor.breath_hold1": "Mantén el aire...",
        "anchor.breath_exhale": "Exhala despacio...",
        "anchor.breath_hold2": "Mantén sin aire...",
        "anchor.sound_btn": "Sonido de Olas",

        // Grounding 5-4-3-2-1 Wizard steps
        "grounding.step1.title": "5 cosas que puedas VER",
        "grounding.step1.prompt": "Busca a tu alrededor y detén tu mirada en 5 objetos. Nómbralos en tu mente o en voz alta despacio.",
        "grounding.step2.title": "4 cosas que puedas TOCAR",
        "grounding.step2.prompt": "Siente la textura de lo que te rodea: tu ropa, el suelo bajo tus pies, la mesa. Toca 4 cosas conscientemente.",
        "grounding.step3.title": "3 cosas que puedas ESCUCHAR",
        "grounding.step3.prompt": "Cierra los ojos un segundo. Presta atención al entorno y detecta 3 sonidos, por más lejanos o suaves que sean.",
        "grounding.step4.title": "2 cosas que puedas OLER",
        "grounding.step4.prompt": "Intenta percibir el olor del ambiente, de tu piel, o de una taza de café cercana. Identifica 2 olores.",
        "grounding.step5.title": "1 cosa que puedas SABOREAR",
        "grounding.step5.prompt": "Nota el sabor en tu boca en este instante, o toma un pequeño sorbo de agua sintiendo su frescura.",
        "grounding.done": "¡Buen trabajo! Te has reconectado con el presente. El bucle se ha aflojado un poco. Puedes volver al Refugio.",

        // TIPP Timer
        "tipp.title": "Reinicio de Emergencia (TIPP)",
        "tipp.description": "Llena un recipiente con agua fría (puedes añadir hielo) o empapa una toalla. Inclínate y pon tu cara en el agua (especialmente el contorno de ojos) durante 20-30 segundos manteniendo la respiración. Esto activa el reflejo de buceo mamífero, bajando el ritmo cardíaco de golpe.",
        "tipp.start": "Iniciar 5 Minutos",
        "tipp.reset": "Reiniciar",
        "tipp.timer_done": "El tiempo ha terminado. ¿Cómo se siente tu cuerpo físico ahora?",

        // Voz de Marea (CAA / AAC)
        "aac.output_placeholder": "Toca los botones para hablar o escribe aquí...",
        "aac.clear_btn": "Borrar",
        "aac.speak_btn": "Decir",
        "aac.cat_needs": "Necesidades",
        "aac.cat_social": "Social",
        "aac.cat_emotions": "Sentir",

        // Safety Plan
        "safety.title": "Mis Anclajes de Seguridad",
        "safety.subtitle": "Configura estos recursos en momentos de calma para tenerlos listos en momentos de tormenta.",
        "safety.anchors_title": "Qué me sujeta al mundo",
        "safety.person_label": "Persona segura (que no me juzga):",
        "safety.song_label": "Canción que me estabiliza:",
        "safety.memory_label": "Un recuerdo o lugar que me transmite paz:",
        "safety.save_btn": "Guardar Anclajes",
        "safety.saved_toast": "Tus anclajes han sido guardados localmente.",
        "safety.helplines_title": "Líneas de Ayuda Directa",
        "safety.helpline_es": "Atención a la conducta suicida (España)",
        "safety.helpline_hope": "Teléfono de la Esperanza (España)",
        "safety.helpline_988": "Línea de Crisis (EE.UU., Canadá, LATAM)",
        "safety.helpline_mx": "Línea de la Vida (México)",

        // Perceptive Journal
        "journal.title": "Lienzo Perceptivo Diario",
        "journal.subtitle": "No necesitas narrar qué pasó. Expresa cómo sientes el mundo físicamente.",
        "journal.light": "Sensibilidad a la Luz",
        "journal.sound": "Sensibilidad al Sonido",
        "journal.pressure": "Presión Interna (Ansiedad)",
        "journal.pain": "Molestia o Dolor Físico",
        "journal.rumination": "Bucle de Rumiación ('Y si')",
        "journal.save_btn": "Guardar Lienzo de Hoy",
        "journal.saved_toast": "Tu huella sensorial de hoy ha sido guardada en tu dispositivo.",
        "journal.canvas_title": "Tu Huella Sensorial",
        "journal.canvas_caption": "Este patrón abstracto representa tu estado en este momento. Almacenado 100% en tu dispositivo.",
        "journal.val.1": "Ninguna / Bajo",
        "journal.val.2": "Leve",
        "journal.val.3": "Normal / Medio",
        "journal.val.4": "Alto",
        "journal.val.5": "Extremo / Intolerable",

        // Settings Panel
        "settings.title": "Configuración y Accesibilidad",
        "settings.lang_title": "Idioma (Language)",
        "settings.lang_desc": "Configura la app en tu lengua de preferencia.",
        "settings.hand_title": "Distribución Unilateral (Móviles)",
        "settings.hand_desc": "Ajusta los controles para alcanzarlos fácilmente con un solo pulgar.",
        "settings.hand_right": "Mano Derecha (Predeterminado)",
        "settings.hand_left": "Mano Izquierda",
        "settings.hand_center": "Centrado (Pantalla Completa)",
        "settings.theme_title": "Filtro y Contraste Visual",
        "settings.theme_desc": "Ajusta los colores para evitar hipersensibilidad o mejorar la visibilidad.",
        "settings.theme_dark": "Marea Oscura (Bioluminiscente)",
        "settings.theme_light": "Marea Clara (Arena Suave)",
        "settings.theme_contrast": "Alto Contraste",
        "settings.theme_mono": "Monocromo (Silencio de Color)",
        "settings.sync_title": "Copia de Seguridad en la Nube (Opcional)",
        "settings.sync_desc": "Crea una cuenta en Supabase para sincronizar tus diarios y anclajes. Sin datos, esta app seguirá siendo 100% local.",
        "settings.sync_btn": "Conectar Cuenta",
        "settings.reset_title": "Limpieza de Datos",
        "settings.reset_desc": "Elimina de forma irreversible toda la información guardada localmente.",
        "settings.reset_btn": "Borrar Todo",
        "settings.reset_confirm": "¿Estás seguro/a de que deseas borrar todos tus datos locales de Marea de forma irreversible?",
        "settings.reset_toast": "Todos los datos locales han sido eliminados."
    },
    en: {
        // Menu & Navigation
        "nav.refugio": "Haven",
        "nav.ancla": "Anchor",
        "nav.voz": "Voice",
        "nav.seguridad": "Anchors",
        "nav.diario": "Journal",
        "nav.settings": "Settings",
        "header.exit": "Exit",

        // General buttons
        "common.start": "Start",
        "common.prev": "Back",
        "common.next": "Next",
        "common.done": "Done",

        // El Refugio (Chat)
        "refugio.still_here": "I'm still here. No need to speak...",
        "refugio.input_placeholder": "Write here if you want...",
        "refugio.start_msg": "Hello. You've entered Marea. There are no expectations, no unsolicited advice, and no hurry here. Tell me how you feel, or simply stay in silence. I am here with you.",
        
        // Quick responses for chat
        "refugio.quick.underwater": "I feel underwater",
        "refugio.quick.cant_breathe": "I can't breathe well",
        "refugio.quick.want_cry": "I want to cry and don't know how",
        "refugio.quick.rumination": "I can't stop thinking ('what if')",
        "refugio.quick.exhausted": "I am physically exhausted",
        "refugio.quick.just_stay": "I just want to stay here in silence",

        // Chatbot dialogue system responses
        "refugio.reply.underwater": "It makes total sense you feel that way. The pressure is immense. Shrink your temporal window: don't think about tomorrow, just hold on for this single minute. I am here beside you.",
        "refugio.reply.cant_breathe": "Physical tightness is terrifying. Let's regulate it. Go to the 'Anchor' tab above and select 'Breathe' or 'Cold Water'. There is no rush, I'll wait for you here.",
        "refugio.reply.want_cry": "Unreleased crying is like a full water dam. Don't force yourself. It's okay not to know how to release it. I hold the space with you, you don't have to do anything perfectly.",
        "refugio.reply.rumination": "The 'what if' loop tries to control the uncontrollable and drains your body. Let's break it. Go to the 'Anchor' menu and select 'Sensory (54321)' to focus your senses.",
        "refugio.reply.exhausted": "Rest. Your body has been fighting an invisible tide for a long time. You don't have to prove anything right now. Let your weight drop, I'm still here.",
        "refugio.reply.just_stay": "I will stay with you. There's no need to speak. Focus your eyes on the screen or close them. Silence is safe here.",
        "refugio.reply.default": "I hear you. Everything you feel is valid, even confusion or nameless pain. If the pain is too great, remember you have support resources under the 'Anchors' tab.",

        // El Ancla (Grounding & Regulators)
        "anchor.breathe_tab": "Breathe",
        "anchor.grounding_tab": "Sensory (54321)",
        "anchor.tipp_tab": "Cold Water (TIPP)",
        "anchor.breath_ready": "Tap the circle to start box breathing (4-4-4-4)",
        "anchor.breath_inhale": "Inhale deeply...",
        "anchor.breath_hold1": "Hold your breath...",
        "anchor.breath_exhale": "Exhale slowly...",
        "anchor.breath_hold2": "Hold empty...",
        "anchor.sound_btn": "Ocean Waves",

        // Grounding 5-4-3-2-1 Wizard steps
        "grounding.step1.title": "5 things you can SEE",
        "grounding.step1.prompt": "Look around and focus your eyes on 5 objects. Name them slowly in your mind or out loud.",
        "grounding.step2.title": "4 things you can TOUCH",
        "grounding.step2.prompt": "Feel the texture of your surroundings: your clothes, the floor under your feet, the table. Touch 4 things mindfully.",
        "grounding.step3.title": "3 things you can HEAR",
        "grounding.step3.prompt": "Close your eyes for a second. Pay attention to the environment and detect 3 sounds, no matter how distant or soft.",
        "grounding.step4.title": "2 things you can SMELL",
        "grounding.step4.prompt": "Try to perceive the smell of the air, your skin, or a nearby coffee cup. Identify 2 smells.",
        "grounding.step5.title": "1 thing you can TASTE",
        "grounding.step5.prompt": "Notice the taste in your mouth right now, or take a small sip of water, feeling its freshness.",
        "grounding.done": "Well done! You've reconnected with the present. The loop has loosened a bit. You can return to the Haven.",

        // TIPP Timer
        "tipp.title": "Emergency Reset (TIPP)",
        "tipp.description": "Fill a bowl with very cold water (add ice if possible) or soak a cloth. Lean forward and submerge your face (especially the eye area) for 20-30 seconds while holding your breath. This activates the mammalian dive reflex, dropping your heart rate instantly.",
        "tipp.start": "Start 5 Minutes",
        "tipp.reset": "Reset",
        "tipp.timer_done": "Time is up. How does your physical body feel right now?",

        // Voz de Marea (CAA / AAC)
        "aac.output_placeholder": "Tap the buttons to speak or type here...",
        "aac.clear_btn": "Clear",
        "aac.speak_btn": "Speak",
        "aac.cat_needs": "Needs",
        "aac.cat_social": "Social",
        "aac.cat_emotions": "Feelings",

        // Safety Plan
        "safety.title": "My Safety Anchors",
        "safety.subtitle": "Set up these resources in calm times to have them ready in times of storm.",
        "safety.anchors_title": "What holds me to the world",
        "safety.person_label": "Safe person (who doesn't judge me):",
        "safety.song_label": "Stabilizing song:",
        "safety.memory_label": "A memory or place that brings me peace:",
        "safety.save_btn": "Save Anchors",
        "safety.saved_toast": "Your anchors have been saved locally.",
        "safety.helplines_title": "Direct Helplines",
        "safety.helpline_es": "Suicide crisis helpline (Spain)",
        "safety.helpline_hope": "Teléfono de la Esperanza (Spain)",
        "safety.helpline_988": "Crisis Lifeline (US, Canada, LATAM)",
        "safety.helpline_mx": "Línea de la Vida (Mexico)",

        // Perceptive Journal
        "journal.title": "Daily Perceptive Canvas",
        "journal.subtitle": "You don't need to write what happened. Express how you physically perceive the world.",
        "journal.light": "Light Sensitivity",
        "journal.sound": "Sound Sensitivity",
        "journal.pressure": "Internal Pressure (Anxiety)",
        "journal.pain": "Physical Pain / Discomfort",
        "journal.rumination": "Rumination Loop ('What if')",
        "journal.save_btn": "Save Today's Canvas",
        "journal.saved_toast": "Today's sensory footprint has been saved to your device.",
        "journal.canvas_title": "Your Sensory Footprint",
        "journal.canvas_caption": "This abstract pattern represents your current state. Stored 100% on your device.",
        "journal.val.1": "None / Low",
        "journal.val.2": "Mild",
        "journal.val.3": "Normal / Medium",
        "journal.val.4": "High",
        "journal.val.5": "Extreme / Unbearable",

        // Settings Panel
        "settings.title": "Settings & Accessibility",
        "settings.lang_title": "Language",
        "settings.lang_desc": "Set the app's primary language.",
        "settings.hand_title": "One-Handed Layout (Mobile)",
        "settings.hand_desc": "Adjust controls to reach them easily with a single thumb.",
        "settings.hand_right": "Right Hand (Default)",
        "settings.hand_left": "Left Hand",
        "settings.hand_center": "Centered (Full Screen)",
        "settings.theme_title": "Visual Contrast & Filters",
        "settings.theme_desc": "Adjust colours to prevent hypersensitivity or improve visibility.",
        "settings.theme_dark": "Deep Sea (Bioluminescent)",
        "settings.theme_light": "Warm Sand (Soft Pastel)",
        "settings.theme_contrast": "High Contrast",
        "settings.theme_mono": "Monochrome (Colour Silence)",
        "settings.sync_title": "Cloud Backup (Optional)",
        "settings.sync_desc": "Create a Supabase account to sync your journals and anchors. Without it, your app is still 100% local-first.",
        "settings.sync_btn": "Connect Account",
        "settings.reset_title": "Data Wipe",
        "settings.reset_desc": "Permanently erase all local data stored on this device.",
        "settings.reset_btn": "Wipe All Data",
        "settings.reset_confirm": "Are you sure you want to delete all local Marea data permanently?",
        "settings.reset_toast": "All local data has been deleted."
    }
};

// AAC Speech Boards Definition (Translates directly)
const aacBoardData = {
    es: {
        needs: [
            { icon: "🆘", text: "Necesito ayuda urgente", spoken: "Necesito ayuda urgente" },
            { icon: "💧", text: "Quiero agua", spoken: "Quiero beber agua, por favor" },
            { icon: "🍎", text: "Tengo hambre", spoken: "Tengo hambre, quiero comer algo" },
            { icon: "💊", text: "Tengo dolor", spoken: "Tengo dolor físico, necesito ayuda" },
            { icon: "🛏️", text: "Quiero descansar", spoken: "Estoy muy cansado y necesito descansar" },
            { icon: "🚶‍♂️", text: "Quiero cambiar de lugar", spoken: "Quiero moverme o cambiar de sitio, por favor" },
            { icon: "🚻", text: "Necesito el baño", spoken: "Necesito ir al baño" },
            { icon: "🌡️", text: "Tengo frío/calor", spoken: "Tengo frío o calor, necesito regular la temperatura" }
        ],
        social: [
            { icon: "🧠", text: "Mi cerebro funciona bien, me cuesta hablar", spoken: "Mi cerebro funciona perfectamente, pero me cuesta hablar en este momento. Por favor, ten paciencia conmigo." },
            { icon: "👍", text: "Sí", spoken: "Sí" },
            { icon: "👎", text: "No", spoken: "No" },
            { icon: "🙏", text: "Gracias", spoken: "Muchas gracias" },
            { icon: "💬", text: "Espérame, por favor", spoken: "Por favor, dame un momento para expresarme." },
            { icon: "❓", text: "No entiendo", spoken: "No entiendo lo que quieres decir, ¿puedes explicarlo de otra forma?" },
            { icon: "🔇", text: "No puedo hablar ahora", spoken: "No puedo hablar en este momento." },
            { icon: "🏠", text: "Quiero ir a casa", spoken: "Quiero volver a mi casa, por favor." }
        ],
        emotions: [
            { icon: "🌊", text: "Me siento bajo el agua", spoken: "Me siento abrumado y bajo el agua en este momento" },
            { icon: "🤯", text: "Mucha sobrecarga", spoken: "Tengo una gran sobrecarga sensorial y mental, hay demasiado ruido o estímulo" },
            { icon: "😔", text: "Estoy triste", spoken: "Me siento triste y decaído" },
            { icon: "😠", text: "Frustración", spoken: "Siento mucha frustración por no poderme comunicar bien" },
            { icon: "🕸️", text: "Atrapado/a en mi mente", spoken: "Me siento atrapado dentro de mi propia mente" },
            { icon: "🫂", text: "Necesito un abrazo", spoken: "Necesito contacto físico o un abrazo de apoyo" },
            { icon: "❤️", text: "Te quiero", spoken: "Te quiero" },
            { icon: "⏳", text: "Necesito estar solo/a", spoken: "Necesito estar solo en silencio un rato" }
        ]
    },
    en: {
        needs: [
            { icon: "🆘", text: "I need urgent help", spoken: "I need urgent help" },
            { icon: "💧", text: "I want water", spoken: "I would like some water, please" },
            { icon: "🍎", text: "I am hungry", spoken: "I am hungry, I want to eat something" },
            { icon: "💊", text: "I am in pain", spoken: "I am in physical pain, I need assistance" },
            { icon: "🛏️", text: "I want to rest", spoken: "I am very tired and I need to rest" },
            { icon: "🚶‍♂️", text: "I want to move", spoken: "I want to move or change location, please" },
            { icon: "🚻", text: "Need bathroom", spoken: "I need to use the bathroom" },
            { icon: "🌡️", text: "Cold/Hot", spoken: "I feel too cold or too hot, I need to adjust the temperature" }
        ],
        social: [
            { icon: "🧠", text: "My brain works, speech is hard", spoken: "My brain works perfectly fine, but I struggle to speak right now. Please have patience with me." },
            { icon: "👍", text: "Yes", spoken: "Yes" },
            { icon: "👎", text: "No", spoken: "No" },
            { icon: "🙏", text: "Thank you", spoken: "Thank you very much" },
            { icon: "💬", text: "Wait, please", spoken: "Please give me a moment to express myself." },
            { icon: "❓", text: "I don't understand", spoken: "I don't understand what you mean, can you explain it differently?" },
            { icon: "🔇", text: "Can't speak now", spoken: "I cannot speak right now." },
            { icon: "🏠", text: "Want to go home", spoken: "I want to go back home, please." }
        ],
        emotions: [
            { icon: "🌊", text: "I feel underwater", spoken: "I feel overwhelmed and underwater right now" },
            { icon: "🤯", text: "Sensory overload", spoken: "I am experiencing heavy sensory and mental overload, there is too much noise or input" },
            { icon: "😔", text: "I am sad", spoken: "I feel sad and low" },
            { icon: "😠", text: "Frustration", spoken: "I feel very frustrated because I cannot communicate well" },
            { icon: "🕸️", text: "Trapped in my mind", spoken: "I feel trapped inside my own mind" },
            { icon: "🫂", text: "I need a hug", spoken: "I need physical contact or a supportive hug" },
            { icon: "❤️", text: "I love you", spoken: "I love you" },
            { icon: "⏳", text: "Need to be alone", spoken: "I need to be alone in silence for a while" }
        ]
    }
};
