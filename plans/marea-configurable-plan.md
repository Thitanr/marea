# Plan: Marea configurable — "a tu manera"

Estado: **propuesta para revisión de Humberto** (2026-10-25). Nada de esto está implementado.

## 1. Por qué (diagnóstico honesto)

Marea hoy tiene un "perfil" (Alzheimer, autismo, afasia…) que solo mueve 2–4 valores
(tema, tamaño de letra, modo sensorial, mano). Todo lo demás es igual para todos y
está escrito en el código:

| Qué | Hoy | Dónde |
|---|---|---|
| Frases del tablero | 24 fijas, genéricas, no se pueden ocultar, cambiar ni añadir (ni nombres, médicos, medicación) | `src/data/aac-board.ts` |
| Pestañas | Las 7 para todo el mundo | `index.html` nav |
| Antitemblor (ignora 2º toque) | 400 ms fijo | `src/app.js` `initMotorGuard` |
| Velocidad del escáner del teclado | 1600 ms fijo | `src/app.js` `SCAN_SPEED` |
| Velocidad del escáner facial | 1400 ms fijo, pausa 900 ms | `src/face/face-switch.ts` |
| Pausa de escritura a mano | **ya configurable** (`marea_hw_delay`) | ajustes |
| Voz, velocidad, teclado, gesto facial, tema, letra, movimiento | **ya configurables** | ajustes |
| Varias personas (tu padre / tú) | No existe: un único juego de ajustes por dispositivo | — |
| Llevar la configuración a otro móvil | No existe | — |

La intuición de Humberto es correcta: Marea está hecha **para** la persona, no **con** la persona.
Yo mismo la dejé con el orden del tablero "inmutable por diseño"; eso protege la memoria
motora, pero hoy nadie puede decidir ese orden.

## 2. Qué enseñan Bragi y KAI (solo lo respaldado por código)

- **KAI `core/accessibility.py`** — perfiles como datos (`Profile`: `gesture_hold_mult`,
  `listen_window_s`, `hud_scale`, `speech_volume`, `repeat_tolerance`…). Lema del propio
  archivo: *"the human never has to adapt to the machine"*. Los perfiles son **puntos de
  partida con números**, no etiquetas.
- **Bragi `lib/persona.ts` + Onboarding** — una pregunta inicial ("¿cómo lo usarás?") que
  configura pestañas visibles, página de inicio y modo de entrada (visual/texto/voz);
  accesibilidad como ajustes reales (tipografía disléxica, densidad 100/115/130 %,
  filtros de color, modo cognitivo).
- **Bragi ModeBar** — *revelado progresivo*: el cliente ve solo lo esencial; lo avanzado
  aparece al activar "modo desarrollador". Marea necesita lo mismo: simple por defecto,
  avanzado a un paso.
- **Covenant (LICENSE)** — todo local, gratis siempre, AA como suelo. La configuración
  hereda esto: nada sale del dispositivo salvo lo que la persona inicia.

Lo que **no** uso: BCI/Neuralink, núcleo "libélula", telemetría de biometría, etc. de los
manifiestos (`docs/*.md`). Son aspiraciones sin código detrás, y no aplican a Marea.

## 3. Evidencia (lo que sí y lo que no sabemos)

- **Fotos personales en aphasia**: hay evidencia consistente pero de estudios pequeños de que
  las pantallas con escenas/fotos personales se prefieren y ayudan más que las genéricas
  (Beukelman et al. 2015/2021; Dietz et al. 2013). Coste práctico: producirlas.
- **Posiciones fijas**: un estudio (AJSLP 2018) en preescolares **sin discapacidad** muestra
  mejor aprendizaje motor con ubicación constante; los materiales de LAMP lo defienden pero
  son del propio fabricante. **No hay ensayo que compare fijo vs. personalizado.** Mi regla
  de "posiciones fijas" es juicio de diseño razonable, no hecho probado.
- **Velocidad de escaneo**: no existe un valor recomendado; la literatura (Ka & Simpson, Pitt)
  y los dispositivos comerciales coinciden en **medir el tiempo de reacción de la persona y
  ajustar**, y exponer tiempos de aceptación/liberación (el equivalente de mi antitemblor).
- Consecuencia: ofrecer **valores iniciales sensatos + calibración con la propia persona**, y
  nunca decidir por ella.

## 4. Principios

1. **Cambia solo cuando la persona (o su cuidador) lo decide.** Nada se reordena, oculta ni
   ajusta solo. Las posiciones del tablero se mantienen hasta que alguien las mueva
   explícitamente. (Reconcilia "configurable" con "memoria motora".)
2. **Simple por defecto, avanzado a un paso** (revelado progresivo de Bragi).
3. **Cada ajuste: valor actual, valor por defecto, "restablecer" y vista previa.**
4. **Candado** para que la persona no desconfigure por accidente (mantener pulsado para editar).
5. **Todo local.** Exportar/importar es un archivo que la persona guarda o abre ella misma
   (misma categoría que compartir el PNG del cuaderno); sin cuentas ni nube. El test de
   privacidad se amplía, no se relaja.
6. **No romper a quien ya usa Marea**: migración desde las claves `marea_*` actuales.
7. **Cada fase se entrega completa** (tests, a11y, producción) y no depende de la siguiente.

## 5. Arquitectura propuesta

Un único módulo `src/config/` (TypeScript, tipado, versionado), como el `Profile` de KAI:

```
MareaConfig {
  version, personId,
  display: { theme, fontSize, density, motion, sensory },
  input:   { hand, tapGuardMs, scanMs, faceHoldMult, facePauseMs, hwPauseMs, kbMode, kbLayout },
  output:  { voiceByLang, rate, speakOnTap },
  board:   { columns, hidden[], order[], custom[] },   // custom = frases propias (+ foto opcional)
  nav:     { visibleTabs[], startTab, kiosk },
  lock:    boolean
}
```

- `schema.ts` (tipos + defaults + validación estricta de rangos), `store.ts` (leer/escribir/
  suscribirse), `migrate.ts` (claves antiguas → v1), `presets.ts` (perfiles = configs).
- `app.js` deja de leer `localStorage` por su cuenta y consume el store (migración gradual,
  sin reescribir los 2000 líneas de golpe).
- Fotos: IndexedDB (localStorage solo da ~5 MB), reducidas en el dispositivo.
- Todo texto nuevo × 8 idiomas con el test de paridad que ya existe.

## 6. Fases

**Fase 0 — Cimientos (invisible).** Módulo de config + migración + tests (rangos, ida y vuelta,
migración de ajustes actuales). Cero cambio visible. *Riesgo bajo; condición para todo lo demás.*

**Fase 1 — Mi tablero (mayor valor para afasia).** Modo edición con candado: ocultar tarjetas,
mover (modo "mover" explícito, nunca arrastre accidental), editar texto/frase hablada,
**añadir frases propias** (nombres, médico, dirección, medicación), columnas 1–3.
Fotos personales como opción posterior dentro de la fase si el uso real lo pide.

**Fase 2 — Mis tiempos.** Exponer antitemblor (tap guard), velocidad del escáner de teclado y
del facial, multiplicador de mantener gesto (de KAI `gesture_hold_mult`). **"Pruébalo"**:
mini-calibración de 30 s que mide cómo toca/reacciona la persona y *propone* valores (la
persona acepta o no). Sin inventar umbrales: los valores iniciales actuales son el punto de
partida y el rango permitido se valida con tests.

**Fase 3 — Personas y perfiles.** Perfiles como presets numéricos (estilo KAI: motor, memoria,
sensorial) + "Mío". Varias personas en un mismo dispositivo (Papá / Humberto). Pestañas visibles
y pestaña de inicio; **modo quiosco "solo Hablar"**. Ajustes en dos niveles: Simple / Avanzado.
Exportar/importar configuración en un archivo (para pasarla a otro móvil).

**Fase 4 — Asistente "Hazlo a tu manera".** Onboarding que, en vez de elegir diagnóstico, pregunta
por cómo se usa (¿una mano? ¿temblor? ¿lee bien? ¿escribe o dibuja?) y aplica las fases 1–3.
Es lo último porque necesita que las piezas existan.

Cada fase termina con: `tsc` + vitest + Playwright (clics reales) + axe AA en extremos
(letra muy grande + 1 columna + 4 temas) + CI + comprobación en producción.

## 7. Decisiones que necesito de Humberto

1. ¿Empezamos por **Fase 1 (tablero propio)**? Es lo que más habría ayudado a tu padre.
2. ¿**Fotos personales** dentro de Fase 1 o después? (Mejor evidencia, pero más trabajo y
   almacenamiento local.)
3. ¿Quieres un **candado** con mantener pulsado (sin contraseñas ni cuentas)? Recomendado.
4. ¿El modo quiosco "solo Hablar" es útil para tu padre?

## 8. Lo que este plan no resuelve (honesto)

- **No tengo forma de validar con una persona con afasia real** salvo tu padre. Cada fase
  debería probarse con él antes de darla por buena; idealmente también con una logopeda.
- Más ajustes = más carga cognitiva si se muestran todos. Por eso Simple/Avanzado, candado y
  que lo configure el cuidador.
- Táctil real, iOS y cámara siguen **sin verificar** en dispositivos reales (arrastre de
  pendientes anteriores).
- La calibración de la Fase 2 propone, no diagnostica; no es una herramienta clínica.

## 9. Fuentes

- Beukelman et al., 2021 (PMC8375495); Beukelman et al., 2015 — Visual Scene Displays, afasia crónica severa.
- Dietz et al., 2013 — *Personalizing AAC for People with Aphasia: The Role of Text and Pictures* (Pitt).
- AJSLP 2018 (17-0129) — *Consistent Symbol Location Affects Motor Learning in Preschoolers Without Disabilities*.
- Ka & Simpson (Pitt) — ajuste automático de la velocidad de escaneo; PRC-Saltillo, *Scan Timing*.
- Código leído: `AUTOMATION_TOOL/CIL_KAI_Core/core/accessibility.py`,
  `AUTOMATION_TOOL/bragi/src/lib/persona.ts`, `.../components/ModeBar.tsx`,
  `.../components/settings/AppearancePanel.tsx`, `marea/LICENSE` (Philosophy Covenant).
