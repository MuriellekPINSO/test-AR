/**
 * 🔊 Moteur audio procédural — Chasse au Trésor AR
 * Génère tous les sons via Web Audio API (pas de fichier externe requis)
 */

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume si suspendu (politique autoplay navigateur)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/** Joue une note simple */
function playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
}

// ── Sons du jeu ──────────────────────────────────────────────────

/** Bip positif — scan réussi */
export function playScanSound() {
    playTone(880, 0.12, 'sine', 0.25);
    playTone(1320, 0.15, 'sine', 0.25, 0.1);
}

/** Whoosh — flèche qui tourne */
export function playArrowSpinSound() {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * 0.15;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);
    filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 1.5);
    filter.Q.value = 2;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();
}

/** Craquement + sparkle — coffre qui s'ouvre */
export function playTreasureOpenSound() {
    // Craquement
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05)) * 0.4;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    source.connect(filter);
    filter.connect(ctx.destination);
    source.start();

    // Sparkle notes
    playTone(1047, 0.2, 'sine', 0.15, 0.3);
    playTone(1319, 0.2, 'sine', 0.15, 0.45);
    playTone(1568, 0.3, 'sine', 0.15, 0.6);
}

/** Cha-ching — collecte de trésor */
export function playCollectSound() {
    playTone(523, 0.08, 'square', 0.15);
    playTone(659, 0.08, 'square', 0.15, 0.08);
    playTone(784, 0.08, 'square', 0.15, 0.16);
    playTone(1047, 0.25, 'square', 0.2, 0.24);
    // Effet "coins"
    playTone(4000, 0.06, 'sine', 0.1, 0.1);
    playTone(4500, 0.06, 'sine', 0.1, 0.18);
    playTone(5000, 0.06, 'sine', 0.08, 0.26);
}

/** Fanfare de victoire 🎺 */
export function playVictorySound() {
    const notes = [
        [523, 0.15], [523, 0.15], [523, 0.15], [523, 0.4],
        [415, 0.4], [466, 0.4], [523, 0.2],
        [466, 0.15], [523, 0.6],
    ];
    let time = 0;
    notes.forEach(([freq, dur]) => {
        playTone(freq, dur, 'triangle', 0.2, time);
        playTone(freq * 1.5, dur, 'triangle', 0.1, time); // harmonie
        time += dur + 0.02;
    });
}

/** Clic UI */
export function playClickSound() {
    playTone(700, 0.05, 'sine', 0.15);
}

// ── Vibration haptique ───────────────────────────────────────────

export function vibrate(pattern = [50]) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

export function vibrateCollect() {
    vibrate([30, 50, 80]);
}

export function vibrateVictory() {
    vibrate([100, 50, 100, 50, 200]);
}
