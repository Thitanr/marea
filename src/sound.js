/* ==========================================================================
   MAREA - SOUND SYSTEM (Web Audio API Synthesizer)
   Generates organic ocean wave sounds client-side, 100% offline.
   ========================================================================== */

class OceanSynth {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        
        // Audio nodes
        this.noiseNode = null;
        this.filterNode = null;
        this.gainNode = null;
        this.modulatorNode = null;
        this.modulatorGain = null;
    }

    init() {
        // Initialize AudioContext lazily on user interaction (browser security policy)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    }

    createNoiseBuffer() {
        if (!this.ctx) return null;
        const bufferSize = 2 * this.ctx.sampleRate; // 2 seconds of noise
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return noiseBuffer;
    }

    start() {
        if (this.isPlaying) return;

        if (!this.ctx) {
            this.init();
            // Suspend AudioContext when tab is hidden to save battery on mobile
            document.addEventListener('visibilitychange', () => {
                if (!this.ctx) return;
                if (document.hidden) {
                    this.ctx.suspend();
                } else if (this.isPlaying) {
                    this.ctx.resume();
                }
            });
        }

        // Resume context if suspended (mobile browsers policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.isPlaying = true;

        // 1. Noise source (looped)
        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = this.createNoiseBuffer();
        this.noiseNode.loop = true;

        // 2. Bandpass filter to make it sound like wind/water
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.Q.value = 1.0;
        this.filterNode.frequency.value = 350; // Starting frequency

        // 3. Main gain node (volume controller)
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        // Fade in
        this.gainNode.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 2.0);

        // 4. LFO (Low Frequency Oscillator) to modulate the filter and volume (ocean sweep)
        // A typical tide swell is ~8 seconds (4s swell, 4s recede = 0.125 Hz)
        this.modulatorNode = this.ctx.createOscillator();
        this.modulatorNode.type = 'sine';
        this.modulatorNode.frequency.value = 0.12; // ~8.3 seconds cycle

        // Gain node to control filter sweep depth
        this.modulatorGain = this.ctx.createGain();
        this.modulatorGain.gain.value = 200; // Modulates filter between 150Hz and 550Hz

        // 5. Connect modulator to filter frequency
        this.modulatorNode.connect(this.modulatorGain);
        this.modulatorGain.connect(this.filterNode.frequency);

        // Also modulate main volume slightly in sync with filter to mimic wave crashing
        const volModulatorGain = this.ctx.createGain();
        volModulatorGain.gain.value = 0.08;
        this.modulatorNode.connect(volModulatorGain);
        volModulatorGain.connect(this.gainNode.gain);

        // 6. Connect audio pipeline
        this.noiseNode.connect(this.filterNode);
        this.filterNode.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);

        // Start playing
        this.noiseNode.start(0);
        this.modulatorNode.start(0);
    }

    stop() {
        if (!this.isPlaying) return;
        
        const fadeOutTime = 1.5;
        if (this.gainNode && this.ctx) {
            // Fade out smoothly
            this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOutTime);
        }

        setTimeout(() => {
            if (this.noiseNode) {
                try { this.noiseNode.stop(); } catch(e) {}
                this.noiseNode.disconnect();
            }
            if (this.modulatorNode) {
                try { this.modulatorNode.stop(); } catch(e) {}
                this.modulatorNode.disconnect();
            }
            if (this.filterNode) this.filterNode.disconnect();
            if (this.gainNode) this.gainNode.disconnect();
            if (this.modulatorGain) this.modulatorGain.disconnect();
            
            this.isPlaying = false;
        }, fadeOutTime * 1000);
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    }
}

/* ==========================================================================
   BROWN NOISE — steady sound masking for autistic self-regulation.
   Deeper and softer than white noise (energy falls 6dB/octave), it masks
   unpredictable environmental sound without adding harshness of its own.
   Generated with a leaky integrator over white noise, 100% offline.
   ========================================================================== */
class BrownNoise {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.source = null;
        this.gainNode = null;
    }

    createBuffer() {
        const bufferSize = 5 * this.ctx.sampleRate; // 5s seamless loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02; // leaky integrator → brown
            data[i] = last * 3.5;                // normalise loudness
        }
        return buffer;
    }

    start() {
        if (this.isPlaying) return;
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            document.addEventListener('visibilitychange', () => {
                if (!this.ctx) return;
                if (document.hidden) this.ctx.suspend();
                else if (this.isPlaying) this.ctx.resume();
            });
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.isPlaying = true;
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.createBuffer();
        this.source.loop = true;
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.5);
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
        this.source.start(0);
    }

    stop() {
        if (!this.isPlaying) return;
        const fade = 1.0;
        if (this.gainNode && this.ctx) {
            this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.ctx.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fade);
        }
        setTimeout(() => {
            if (this.source) {
                try { this.source.stop(); } catch (e) {}
                this.source.disconnect();
            }
            if (this.gainNode) this.gainNode.disconnect();
            this.isPlaying = false;
        }, fade * 1000);
    }

    toggle() {
        if (this.isPlaying) { this.stop(); return false; }
        this.start();
        return true;
    }
}

// Global instances
const oceanSynth = new OceanSynth();
const brownNoise = new BrownNoise();

export { oceanSynth, OceanSynth, brownNoise, BrownNoise };
