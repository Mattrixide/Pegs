// Synthesized audio using Web Audio API — no external files needed

export class AudioSystem {
  constructor() {
    this._ctx = null;
    this._ready = false;
    // Defer AudioContext creation until first user gesture
  }

  _ensureCtx() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return true;
    }
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._ready = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  _beep(freq, volume, duration, type = 'sine', startOffset = 0) {
    if (!this._ensureCtx()) return;
    const ctx = this._ctx;
    const t = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  playPegHit(type) {
    const freqMap = { blue: 440, orange: 880, green: 660, purple: 1100 };
    this._beep(freqMap[type] || 440, 0.06, 0.07, 'sine');
  }

  playBucketCatch() {
    // Quick ascending arpeggio
    [523, 659, 784, 1047].forEach((f, i) => {
      this._beep(f, 0.12, 0.14, 'triangle', i * 0.08);
    });
  }

  playRoundEnd() {
    this._beep(330, 0.08, 0.2, 'sine', 0);
    this._beep(440, 0.08, 0.2, 'sine', 0.18);
  }

  // Simplified Ode to Joy (Beethoven 9th, 4th movement)
  playOdeToJoy() {
    if (!this._ensureCtx()) return;
    const ctx = this._ctx;

    // Frequencies for notes: E E F G G F E D C C D E  E. D D
    const melody = [
      [330,0.22],[330,0.22],[349,0.22],[392,0.22],
      [392,0.22],[349,0.22],[330,0.22],[294,0.22],
      [262,0.22],[262,0.22],[294,0.22],[330,0.22],
      [330,0.33],[294,0.11],[294,0.44],
      [330,0.22],[330,0.22],[349,0.22],[392,0.22],
      [392,0.22],[349,0.22],[330,0.22],[294,0.22],
      [262,0.22],[262,0.22],[294,0.22],[330,0.22],
      [294,0.33],[262,0.11],[262,0.44],
    ];

    let t = ctx.currentTime + 0.05;
    melody.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.85);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
  }

  // progress 0→1: controls starting pitch — higher fill = higher sound
  playFeverUp(progress = 0) {
    if (!this._ensureCtx()) return;
    const ctx = this._ctx;
    const t   = ctx.currentTime;
    const dur = 0.65;

    // Pitch range scales with fill level
    const startFreq = 100 * Math.pow(8, progress); // 100 Hz empty → 800 Hz full
    const endFreq   = startFreq * 3.5;

    // Clean sine sweep, low to high
    const osc     = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.7);
    osc.frequency.exponentialRampToValueAtTime(endFreq * 0.6, t + dur);
    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.linearRampToValueAtTime(0.013, t + 0.05);
    oscGain.gain.setValueAtTime(0.013, t + 0.12);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  playGameOver() {
    // Sad descending notes
    [392, 349, 330, 262].forEach((f, i) => {
      this._beep(f, 0.1, 0.35, 'sine', i * 0.3);
    });
  }
}
