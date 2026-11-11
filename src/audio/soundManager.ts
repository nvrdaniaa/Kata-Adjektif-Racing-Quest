/**
 * Procedural Web Audio Sound & Background Music Manager for Kata Adjektif Racing Quest.
 * Zero external audio assets (100% procedural Web Audio synthesis).
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Background Music (BGM) Nodes
  private bgmGain: GainNode | null = null;
  private bgmIntervalId: number | null = null;
  private isBgmPlaying: boolean = false;
  private currentStep: number = 0;
  private isQuizMode: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } else {
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.setValueAtTime(this.isQuizMode ? 0.035 : 0.07, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- BACKGROUND MUSIC SYSTEM ---
  public startBgm() {
    if (this.isBgmPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.07, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    this.isBgmPlaying = true;
    this.currentStep = 0;

    // Peaceful, melodious pentatonic progression in C / Am (warm synth bells and soft bass)
    // Chords: Cmaj7 -> Am7 -> Fmaj7 -> G7
    const bassNotes = [130.81, 130.81, 110.0, 110.0, 87.31, 87.31, 98.0, 98.0];
    const melodyScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // C4, D4, E4, G4, A4, C5, D5, E5
    const melodyPattern = [
      0, 2, 4, 3, 2, 4, 5, 4,
      1, 3, 5, 4, 3, 5, 6, 5,
      0, 2, 4, 5, 4, 3, 2, 1,
      2, 4, 6, 5, 4, 3, 1, 0,
    ];

    const stepDurationMs = 240; // ~125 BPM 8th notes

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.bgmGain) return;
      const now = this.ctx.currentTime;
      const step = this.currentStep;

      // Play soft bass every 4 steps
      if (step % 4 === 0) {
        const bassFreq = bassNotes[(step / 4) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bGain.gain.setValueAtTime(0.12, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        bassOsc.connect(bGain);
        bGain.connect(this.bgmGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.7);
      }

      // Play gentle melody note (arpeggiated, calming)
      const noteIdx = melodyPattern[step % melodyPattern.length];
      const melodyFreq = melodyScale[noteIdx % melodyScale.length];

      const melOsc = this.ctx.createOscillator();
      const mGain = this.ctx.createGain();
      melOsc.type = 'triangle';
      melOsc.frequency.setValueAtTime(melodyFreq, now);

      const noteVol = this.isQuizMode ? 0.06 : 0.1;
      mGain.gain.setValueAtTime(0, now);
      mGain.gain.linearRampToValueAtTime(noteVol, now + 0.03);
      mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      melOsc.connect(mGain);
      mGain.connect(this.bgmGain);

      melOsc.start(now);
      melOsc.stop(now + 0.4);

      this.currentStep = (this.currentStep + 1) % 64;
    }, stepDurationMs);
  }

  public setQuizMode(isQuiz: boolean) {
    this.isQuizMode = isQuiz;
    if (this.bgmGain && this.ctx && !this.isMuted) {
      // Duck background music during questions so reading and thinking is serene
      const targetVol = isQuiz ? 0.035 : 0.07;
      this.bgmGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.2);
    }
  }

  public stopBgm() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.isBgmPlaying = false;
  }

  // --- ENGINE SFX SYSTEM ---
  public startEngine() {
    if (this.isMuted || this.isEngineRunning) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {}
  }

  public updateEngineSpeed(speedRatio: number) {
    if (!this.isEngineRunning || !this.ctx || this.isMuted || !this.engineOsc || !this.engineFilter || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const clampedRatio = Math.max(0, Math.min(1, speedRatio));
    // Pitch ranges from 45Hz at idle to 160Hz at max speed
    const targetFreq = 45 + clampedRatio * 115;
    const filterFreq = 140 + clampedRatio * 400;
    const targetVol = 0.04 + clampedRatio * 0.07;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
    }
    this.isEngineRunning = false;
  }

  public playCollectGift() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Sparkling double arpeggio (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.3);
      });
    } catch {}
  }

  public playCorrectAnswer() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Triumphant chord (G4 -> C5 -> E5 -> G5)
      const notes = [392.0, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.05 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.5);
      });
    } catch {}
  }

  public playWrongAnswer() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public playBumpSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const melody = [
        { f: 523.25, t: 0.0, d: 0.12 },
        { f: 523.25, t: 0.14, d: 0.12 },
        { f: 523.25, t: 0.28, d: 0.12 },
        { f: 659.25, t: 0.42, d: 0.35 },
        { f: 783.99, t: 0.8, d: 0.25 },
        { f: 1046.5, t: 1.08, d: 0.65 },
      ];

      melody.forEach(({ f, t, d }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);

        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.25, now + t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d + 0.05);
      });
    } catch {}
  }

  public playButtonClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }
}

export const soundManager = new SoundManager();
