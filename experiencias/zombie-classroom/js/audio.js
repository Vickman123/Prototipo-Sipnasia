/**
 * SIPNASIA XR - Audio Engine Procedural para Zombie Classroom
 * Sintetizador de audio en tiempo real basado en Web Audio API
 * Sin dependencias de archivos externos, máxima confiabilidad y baja latencia.
 */

export class ZombieAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.heartbeatTimer = null;
    this.ambientPlaying = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbientLoop();
    } catch (e) {
      console.warn('Web Audio API no soportado o bloqueado:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  createNoiseBuffer(duration = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /* ----------------------------------------------------
     DISPAROS DE ARMAS
     ---------------------------------------------------- */
  playPistolShot() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Golpe de tono rápido
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);

    // Ruido de pólvora
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.18);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  playShotgunShot() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub-bajo devastador
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    subGain.gain.setValueAtTime(1.2, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.36);

    // Explosión de perdigones
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.45);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    // Mecanismo de bombeo (pump action)
    setTimeout(() => {
      this.playMechanicalClick(0.08, 900);
      setTimeout(() => this.playMechanicalClick(0.1, 1400), 120);
    }, 280);
  }

  playRifleShot() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Chasquido agudo de alta velocidad
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    oscGain.gain.setValueAtTime(0.65, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);

    // Ráfaga comprimida
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  playPlasmaShot() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Silbido de carga y disparo sci-fi
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.28);

    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);

    // Resonancia ácida
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(320, t);
    subOsc.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.36);
  }

  playMechanicalClick(duration = 0.05, freq = 1200) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + duration);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  playReload() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.playMechanicalClick(0.07, 700);
    setTimeout(() => this.playMechanicalClick(0.09, 1300), 220);
    setTimeout(() => this.playMechanicalClick(0.12, 950), 550);
  }

  playWeaponSwitch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.playMechanicalClick(0.05, 1100);
  }

  /* ----------------------------------------------------
     IMPACTOS Y DAÑO
     ---------------------------------------------------- */
  playHitmarker(isHeadshot = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const freq = isHeadshot ? 1760 : 880;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(isHeadshot ? 0.6 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playZombieHit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.12);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playPlayerHurt() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Impacto sordo corporal
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  /* ----------------------------------------------------
     VOCES Y RUGIDOS DE ZOMBIES
     ---------------------------------------------------- */
  playZombieGroan(type = 'normal') {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'runner') {
      // Gruñido histérico y rápido
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(320, t + 0.15);
      osc.frequency.linearRampToValueAtTime(180, t + 0.35);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    } else if (type === 'tank') {
      // Rugido cavernoso y grave
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.linearRampToValueAtTime(115, t + 0.3);
      osc.frequency.linearRampToValueAtTime(50, t + 0.75);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);
    } else if (type === 'screamer') {
      // Chillido agudo ensordecedor
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.linearRampToValueAtTime(1100, t + 0.25);
      osc.frequency.linearRampToValueAtTime(600, t + 0.6);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    } else if (type === 'spitter') {
      // Gorgoteo químico ácido
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.4);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    } else {
      // Normal: lamento clásico zombie
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.linearRampToValueAtTime(155, t + 0.25);
      osc.frequency.linearRampToValueAtTime(90, t + 0.55);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
    }

    // Filtro formante vocal
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(type === 'tank' ? 400 : 850, t);
    filter.Q.setValueAtTime(2.2, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (type === 'tank' ? 0.76 : 0.6));
  }

  playAcidSplash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playTankStomp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.25);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  /* ----------------------------------------------------
     DROPS, RECOMPENSAS Y OLEADAS
     ---------------------------------------------------- */
  playPickup() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.35, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.21);
    });
  }

  playWaveStart() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Cuerno ominoso de alarma escolar
    const chords = [130.81, 196.00, 246.94]; // C3, G3, B3
    chords.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 0.98, t + 1.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.21);
    });
  }

  playWaveComplete() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Acorde triunfal
    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.35, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.41);
    });
  }

  /* ----------------------------------------------------
     AMBIENTE DE AULA ESCOLAR Y LATIDOS
     ---------------------------------------------------- */
  startAmbientLoop() {
    if (this.ambientPlaying || !this.ctx) return;
    this.ambientPlaying = true;

    // Lluvia distante y zumbido eléctrico de lámpara fluorescente
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, this.ctx.currentTime); // Zumbido 60Hz
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
    } catch (e) {}

    // Truenos periódicos distantes
    setInterval(() => {
      if (Math.random() < 0.4) {
        this.playThunder();
      }
    }, 18000);
  }

  playThunder() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + 2.0);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 2.1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    noise.start(t);
  }

  updateHeartbeat(playerHpPercent) {
    if (!this.ctx || this.isMuted) return;
    if (playerHpPercent <= 0.3 && !this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        this.playHeartbeatThud();
      }, 750);
    } else if (playerHpPercent > 0.3 && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  playHeartbeatThud() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.14);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);

    // Segundo latido
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(65, t2);
      osc2.frequency.exponentialRampToValueAtTime(25, t2 + 0.12);
      gain2.gain.setValueAtTime(0.5, t2);
      gain2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t2);
      osc2.stop(t2 + 0.13);
    }, 180);
  }
}
