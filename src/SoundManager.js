export class SoundManager {
    constructor() {
        this.ctx = null;
        this.bgGainNode = null;
        this.bgOscillator = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    playJump() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playLaneSwitch() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playPowerup() {
        if (!this.ctx) return;
        const notes = [523, 659, 784]; // C5, E5, G5 arpeggio
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.15);
            osc.start(this.ctx.currentTime + i * 0.08);
            osc.stop(this.ctx.currentTime + i * 0.08 + 0.15);
        });
    }

    playExplosion() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        source.start(this.ctx.currentTime);
    }

    playDeath() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.6);
    }

    startBGM() {
        if (!this.ctx || this.bgOscillator) return;

        // Bass drone
        this.bgGainNode = this.ctx.createGain();
        this.bgGainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
        this.bgGainNode.connect(this.ctx.destination);

        this.bgOscillator = this.ctx.createOscillator();
        this.bgOscillator.type = 'sine';
        this.bgOscillator.frequency.setValueAtTime(55, this.ctx.currentTime);
        this.bgOscillator.connect(this.bgGainNode);
        this.bgOscillator.start();

        // Second harmonic
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(110, this.ctx.currentTime);
        gain2.gain.setValueAtTime(0.02, this.ctx.currentTime);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start();
        this.bgOsc2 = osc2;
    }

    stopBGM() {
        if (this.bgOscillator) {
            this.bgOscillator.stop();
            this.bgOscillator = null;
        }
        if (this.bgOsc2) {
            this.bgOsc2.stop();
            this.bgOsc2 = null;
        }
    }
}
