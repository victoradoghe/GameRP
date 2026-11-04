// Pure Web Audio API procedural synthesizer for GameRP (NoPixel V // Eko City)
// Zero external asset downloads required, instant playback!

class LagosAudioEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private musicInterval: NodeJS.Timeout | null = null;
  public isMusicPlaying: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterVolume = 1;
  private musicVolume = 0.8;

  /** Master SFX bus (all sounds route through here). */
  private out(): AudioNode {
    if (!this.ctx) throw new Error('Audio context not ready');
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.masterGain;
  }

  /** Music bus (routes into master so master volume also applies). */
  private musicOut(): AudioNode {
    if (!this.ctx) throw new Error('Audio context not ready');
    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.out());
    }
    return this.musicGain;
  }

  public setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  public setMusicVolume(v: number) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playDanfoHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(370, t); // F#4
    osc2.frequency.setValueAtTime(466, t); // Bb4

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gain.gain.setValueAtTime(0.18, t + 0.15);
    gain.gain.linearRampToValueAtTime(0, t + 0.18);

    gain.gain.setValueAtTime(0.18, t + 0.24);
    gain.gain.linearRampToValueAtTime(0, t + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.out());

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  public playPoliceSiren() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.linearRampToValueAtTime(1150, t + 0.35);
    osc.frequency.linearRampToValueAtTime(650, t + 0.7);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.72);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.75);
  }

  public playPhoneRing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Modern iPhone/NoPixel marimba-style chord arpeggio
    const notes = [659.25, 880, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.out());

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  public playSmsChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, t); // C6
    osc.frequency.setValueAtTime(1318.51, t + 0.09); // E6

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playRadioClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.setValueAtTime(1200, t + 0.03);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playSeatbeltChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, t);
    osc.frequency.setValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playCameraClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.out());
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playVehicleIgnition() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.25);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    osc.connect(gain);
    gain.connect(this.out());
    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playHackBeep(success: boolean = true) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = success ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(success ? 1100 : 220, t);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playDispatchAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [880, 660, 880].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.11;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
      osc.connect(gain);
      gain.connect(this.out());
      osc.start(start);
      osc.stop(start + 0.11);
    });
  }

  public playCashEarn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playUpNepa() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.out());

      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  public playBlackout() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.6);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.65);
  }

  public playEatFood() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.07);
    osc.frequency.linearRampToValueAtTime(280, t + 0.14);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.out());

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playDrumBeat(type: 'kick' | 'snare' | 'shaker') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.musicOut());
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (type === 'snare') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.musicOut());
      osc.start(t);
      osc.stop(t + 0.15);
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.musicOut());
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  public toggleAfrobeatsGroove(): boolean {
    if (this.isMusicPlaying) {
      this.stopAfrobeatsGroove();
      return false;
    } else {
      this.startAfrobeatsGroove();
      return true;
    }
  }

  public startAfrobeatsGroove() {
    this.initCtx();
    if (this.musicInterval) clearInterval(this.musicInterval);
    this.isMusicPlaying = true;

    let step = 0;
    const stepDurationMs = (60 / 108 / 4) * 1000;
    const bassFreqs = [87.31, 87.31, 103.83, 116.54, 130.81, 87.31, 103.83, 116.54];

    this.musicInterval = setInterval(() => {
      if (this.isMuted) return;
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      if (step === 0 || step === 6 || step === 10) {
        this.playDrumBeat('kick');
      }
      if (step === 4 || step === 12) {
        this.playDrumBeat('snare');
      }
      if (step % 2 === 0) {
        this.playDrumBeat('shaker');
      }

      if (step === 0 || step === 3 || step === 8 || step === 11) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        const noteIndex = Math.floor(step / 2) % bassFreqs.length;
        bassOsc.frequency.setValueAtTime(bassFreqs[noteIndex], t);

        bassGain.gain.setValueAtTime(0.18, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicOut());
        bassOsc.start(t);
        bassOsc.stop(t + 0.28);
      }

      step = (step + 1) % 16;
    }, stepDurationMs);
  }

  public stopAfrobeatsGroove() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }

  public setEngine(active: boolean, speedPct: number) {
    if (!active || this.isMuted) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }
    this.initCtx();
    if (!this.ctx) return;

    if (!this.engineOsc || !this.engineSubOsc || !this.engineFilter || !this.engineGain) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineSubOsc.type = 'triangle';
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 260;
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(this.engineFilter);
      this.engineSubOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.out());

      this.engineOsc.start();
      this.engineSubOsc.start();
    }

    const t = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(100, speedPct)) / 100;
    // Simulate 5-gear RPM sawtooth curve so shifting feels alive
    const gearSaw = (clamped * 3.8) % 1;
    const rpmNorm = clamped < 0.03 ? 0.08 : 0.22 + gearSaw * 0.65 + clamped * 0.25;
    const baseFreq = 44 + rpmNorm * 115;

    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.06);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.06);
    this.engineFilter.frequency.setTargetAtTime(180 + rpmNorm * 520, t, 0.08);
    this.engineGain.gain.setTargetAtTime(0.035 + clamped * 0.045, t, 0.08);
  }

  public playCrash(intensity: number = 0.6) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const clamped = Math.max(0.15, Math.min(1, intensity));

    // Low body thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 * clamped + 50, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.26);
    oscGain.gain.setValueAtTime(0.32 * clamped, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(oscGain);
    oscGain.connect(this.out());
    osc.start(t);
    osc.stop(t + 0.3);

    // Metallic crunch noise burst
    const duration = 0.22 + clamped * 0.18;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650 + clamped * 900, t);
    filter.Q.setValueAtTime(1.1, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.28 * clamped, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.out());
    noise.start(t);
  }
}

export const audioEngine = new LagosAudioEngine();
