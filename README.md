# 🌊 Marea - Herramienta de Sostén y Dignidad

Marea es una aplicación web progresiva (PWA) de código abierto, diseñada para funcionar 100% sin conexión (offline-first) y con total privacidad. Su objetivo es servir como un **ancla sensorial, refugio conversacional y canal de comunicación aumentativa** para personas neurodivergentes, con discapacidad (por ejemplo, afasia motora post-ictus) o neurotípicas en situaciones de sobrecarga.

Creado como un regalo para la comunidad por **Lana Technologies**.

---

## 🎨 Filosofía del Proyecto

1.  **Privacidad Absoluta**: No existe recopilación de datos, no hay rastreadores, ni registro obligatorio. El 100% de la información (diarios sensoriales, planes de seguridad) se almacena localmente en la memoria de tu dispositivo (`localStorage`).
2.  **Cero Fricción**: Marea funciona directamente desde el navegador web. Al ser una PWA, se puede "Añadir a la pantalla de inicio" en iOS y Android para instalarse como una app nativa en segundos, ocupando menos de 1 MB.
3.  **Accesibilidad sin Excepciones**: Diseñado bajo pautas WCAG 2.1 AA para garantizar que personas ciegas, con dificultades motoras, parálisis unilaterales (hemiplejia) o hipersensibilidad sensorial puedan utilizarla con autonomía.

---

## 🛠️ Características Principales

### 💬 1. El Refugio (Validación Conversacional)
Un espacio de diálogo guiado que practica la **validación incondicional**. No ofrece positividad tóxica ni consejos simplistas. Cuenta con un sistema de presencia ininterrumpida: si dejas de escribir, la app no se desconecta; un pulso de luz y la frase *«Sigo aquí. No tienes que decir nada si no quieres»* te acompañan.

### ⚓ 2. El Ancla (Regulación Sensorial)
*   **Respiración de Caja (4-4-4-4)**: Un anillo bioluminiscente interactivo que guía la inhalación, retención y exhalación, sincronizado opcionalmente con un rumor de olas de mar sintetizado en tiempo real (proceduralmente por Web Audio API, sin descargas).
*   **Grounding 5-4-3-2-1**: Un asistente paso a paso para reconectarte con tus sentidos (vista, tacto, oído, olfato, gusto) y desactivar la rumiación ("el y si").
*   **Reinicio TIPP (Agua Fría)**: Un temporizador mecánico de 5 minutos que guía al usuario para aplicar agua fría en los ojos/rostro, estimulando el nervio vago y reduciendo físicamente las pulsaciones cardíacas.

### 🗣️ 3. Voz de Marea (CAA - Comunicación Aumentativa)
Diseñada especialmente para supervivientes de **ictus con afasia** (que conservan su capacidad cognitiva pero no pueden hablar o les cuesta expresarse) y parálisis de un brazo:
*   **Distribución Unilateral (Mano Izquierda / Derecha)**: Desplaza y agrupa los botones principales a la esquina de la pantalla que el usuario elija para que alcancen todo con un solo pulgar.
*   **Tablero de Voz**: Tarjetas grandes con necesidades básicas, comunicación social (*"Mi cerebro funciona bien, pero me cuesta hablar. Ten paciencia"*), y emociones. Al pulsarlas, la app pronuncia la frase en voz alta usando el motor nativo del dispositivo (TTS).

### 📝 4. Anclajes de Seguridad
Un plan de crisis basado en el modelo Stanley-Brown. Te permite registrar en tus días tranquilos tu persona segura, tu canción ancla y un recuerdo de paz, permitiendo extraerlos rápidamente cuando "el agua suba".

### 🎨 5. Diario Perceptivo
Registra tu sensibilidad a la luz, ruido, dolor físico y nivel de rumiación. En lugar de escribir un diario de texto, Marea procesa estos niveles en un **lienzo abstracto dinámico**, convirtiendo tu estado sensorial en una obra de arte digital única.

---

## ⚙️ Estructura del Código

Marea está construida con la mínima infraestructura posible para asegurar su portabilidad y velocidad:
*   `index.html` - Maquetación semántica y de accesibilidad.
*   `styles.css` - Estilos de glassmorphism y layouts unilaterales.
*   `app.js` - Control de navegación, chat, sintetizador de voz y almacenamiento.
*   `sound.js` - Generador procedural del oleaje oceánico.
*   `i18n.js` - Diccionario de idiomas (Español / Inglés) integrado.
*   `manifest.json` & `service-worker.js` - Configuración PWA.

---

## 🔒 Descargo de Responsabilidad (Disclaimer)

Marea es un espacio de sostén emocional y regulación sensorial de baja intensidad. **No es un dispositivo médico ni reemplaza a un profesional de la salud mental o a los servicios de emergencia.** Si tú o alguien que conoces se encuentra en peligro inmediato, por favor ponte en contacto con los números de emergencia de tu país (ej. 024 en España, 988 en USA/LATAM).

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Eres libre de modificarlo, distribuirlo y utilizarlo de forma no comercial.
