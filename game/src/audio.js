// The sounds of the night, made with the Web Audio API: no audio files, so the
// game ships as code alone. Every tone is a short shaped oscillator.
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** The audio context, created on the first gesture a browser allows. */
  context() {
    if (this.ctx === null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Play one shaped tone. */
  tone(frequency, duration, options = {}) {
    if (this.muted) return;
    const ctx = this.context();
    if (!ctx) return;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = options.type || 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (options.slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.slideTo), now + duration);
    }
    const volume = options.volume ?? 0.12;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  /** A burst of noise, for the snuff of an ember. */
  noise(duration, volume = 0.1) {
    if (this.muted) return;
    const ctx = this.context();
    if (!ctx) return;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  /** The core burst: a falling sweep with a little noise on top. */
  burst() {
    this.tone(520, 0.34, { slideTo: 90, type: 'sawtooth', volume: 0.13 });
    this.noise(0.26, 0.09);
  }

  /** An ember snuffed. */
  snuff() {
    this.tone(660, 0.1, { type: 'square', volume: 0.05 });
    this.noise(0.1, 0.05);
  }

  /** A mote gathered: a bright little pair of notes. */
  mote() {
    this.tone(880, 0.09, { type: 'triangle', volume: 0.07 });
    this.tone(1320, 0.12, { type: 'sine', volume: 0.05 });
  }

  /** The wick is struck. */
  hurt() {
    this.tone(180, 0.5, { slideTo: 60, type: 'sawtooth', volume: 0.16 });
    this.noise(0.3, 0.1);
  }

  /** A wave begins. */
  wave() {
    this.tone(300, 0.42, { type: 'triangle', volume: 0.1 });
    this.tone(450, 0.5, { type: 'sine', volume: 0.06 });
  }

  /** The shield comes up. */
  shield() {
    this.tone(740, 0.26, { slideTo: 1200, type: 'sine', volume: 0.08 });
  }

  /** The night ends, one way or the other. */
  end(won) {
    if (won) {
      this.tone(523, 0.35, { volume: 0.1 });
      this.tone(659, 0.35, { volume: 0.09 });
      this.tone(784, 0.6, { volume: 0.08 });
    } else {
      this.tone(220, 0.7, { slideTo: 70, type: 'sawtooth', volume: 0.13 });
    }
  }
}
