// Procedural audio engine using the Web Audio API
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Engine node references
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineLowpass: BiquadFilterNode | null = null;

  // Squeal/Screech references (drift)
  private screechGain: GainNode | null = null;
  private screechOsc: OscillatorNode | null = null;

  constructor() {
    // Lazy initialized on first user interaction to conform to browser policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.setupEngineSynth();
      this.setupScreechSynth();
    } catch (e) {
      console.warn("Web Audio API not supported or blocked in this environment", e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        this.ctx.suspend();
      } else {
        this.ctx.resume();
      }
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  private setupEngineSynth() {
    if (!this.ctx) return;

    // Create custom oscillator structure for a rich, vibrating car rumble
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineLowpass = this.ctx.createBiquadFilter();

    // Sawtooth + Triangle gives a nice mechanical/throaty feedback
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    // Detune them slightly for a chorusing engine effect
    this.engineOsc1.detune.setValueAtTime(-10, this.ctx.currentTime);
    this.engineOsc2.detune.setValueAtTime(10, this.ctx.currentTime);

    // Initial frequencies (RPM)
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineOsc2.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    // Low pass filter to make it a deep, rumbling engine instead of a harsh synth
    this.engineLowpass.type = 'lowpass';
    this.engineLowpass.frequency.setValueAtTime(180, this.ctx.currentTime);

    // Initial gain (very low, starts idle)
    this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    // Connect them
    this.engineOsc1.connect(this.engineLowpass);
    this.engineOsc2.connect(this.engineLowpass);
    this.engineLowpass.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    // Start
    this.engineOsc1.start(0);
    this.engineOsc2.start(0);
  }

  private setupScreechSynth() {
    if (!this.ctx) return;

    // Create high-pitched screech for skidding tires
    this.screechOsc = this.ctx.createOscillator();
    this.screechGain = this.ctx.createGain();
    const bandpass = this.ctx.createBiquadFilter();

    this.screechOsc.type = 'triangle';
    this.screechOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

    // Rapid pitch modulation (vibrato) to simulate tyre skipping/chattering on asphalt
    const modulator = this.ctx.createOscillator();
    const modulatorGain = this.ctx.createGain();
    modulator.frequency.setValueAtTime(45, this.ctx.currentTime);
    modulatorGain.gain.setValueAtTime(180, this.ctx.currentTime);

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Wire modulator to screecher frequency
    modulator.connect(modulatorGain);
    if (this.screechOsc) {
      modulatorGain.connect(this.screechOsc.frequency);
    }

    this.screechOsc.connect(bandpass);
    bandpass.connect(this.screechGain);
    this.screechGain.connect(this.ctx.destination);

    // Start both
    modulator.start(0);
    this.screechOsc.start(0);
  }

  /**
   * Adjust fuel throttle and speed pitch
   * @param ratio value from 0.0 (idle) to 1.0 (max throttle/speed)
   * @param active boolean indicating if engine is turned on
   */
  public updateEngineSound(ratio: number, active: boolean = true) {
    if (!this.ctx || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      // Don't crash if context is sleeping, try to resume
      return;
    }

    const t = this.ctx.currentTime;

    if (!active) {
      this.engineGain?.gain.setTargetAtTime(0, t, 0.1);
      return;
    }

    // Clamp ratio between 0 and 1
    const clRatio = Math.max(0, Math.min(1, ratio));

    // Base idle frequency is ~45Hz, redline is ~160Hz
    const baseFreq = 40 + clRatio * 150;
    this.engineOsc1?.frequency.setTargetAtTime(baseFreq, t, 0.1);
    this.engineOsc2?.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.15);

    // Open lowpass filter wider as revs increase to simulate a louder exhaust note
    const filterFreq = 160 + clRatio * 600;
    this.engineLowpass?.frequency.setTargetAtTime(filterFreq, t, 0.15);

    // Engine is slightly louder when under full load helper
    const targetGain = 0.04 + clRatio * 0.09;
    this.engineGain?.gain.setTargetAtTime(targetGain, t, 0.08);
  }

  /**
   * Play screech sound
   * @param skidIntensity 0.0 to 1.0 depending on drift sliding drift angle / slip velocity
   */
  public updateScreech(skidIntensity: number) {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const clIntensity = Math.max(0, Math.min(1, skidIntensity));

    if (clIntensity < 0.1) {
      this.screechGain?.gain.setTargetAtTime(0, t, 0.1);
    } else {
      // Synthesize raw squealing tire noise
      // Modulation frequency represents asphalt roughness
      const pitch = 550 + clIntensity * 200;
      this.screechOsc?.frequency.setTargetAtTime(pitch, t, 0.05);

      // Squeal gain climbs with intensity
      const volume = clIntensity * 0.12;
      this.screechGain?.gain.setTargetAtTime(volume, t, 0.08);
    }
  }

  public playCrash(impactForce: number) {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const force = Math.max(0.1, Math.min(1, impactForce));

    // Synthesize short low-frequency explosion/thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(15, t + 0.3 * force);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, t);
    filter.frequency.exponentialRampToValueAtTime(20, t + 0.2 * force);

    gain.gain.setValueAtTime(force * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35 * force);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45 * force);
  }

  public playLapChime() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Elegant retro sci-fi ping-pong chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx?.createOscillator();
      const gain = this.ctx?.createGain();

      if (osc && gain) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.45);
      }
    });
  }

  public playButtonPress() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

// Single active speaker instance
export const audio = new SoundManager();
