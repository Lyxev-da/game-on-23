// @ts-nocheck
import { TIERS } from "./data";

type Wave = OscillatorType;

class Sfx {
  private enabledFlag = true;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private resumePending = false;
    private voices = new Set<AudioScheduledSourceNode>();
    private burst = 0;
    private burstAt = 0;

  get enabled() { return this.enabledFlag; }
  set enabled(value: boolean) {
    this.enabledFlag = value;
    if (!value) this.stopAll();
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(value ? 0.85 : 0, this.ctx.currentTime, 0.01);
  }

  stopAll() {
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* The voice may have just finished. */ }
    }
    this.voices.clear();
  }


  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.85;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended" && !this.resumePending) {
        this.resumePending = true;
        void this.ctx.resume().then(
          () => { this.resumePending = false; },
          () => { this.resumePending = false; },
        );
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    at: number,
    dur: number,
    type: Wave = "square",
    vol = 0.05,
    slideTo?: number,
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.voices.size >= 26) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.voices.add(osc);
    osc.onended = () => {
      this.voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(at: number, dur: number, vol = 0.05) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.voices.size >= 26) return;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    this.voices.add(src);
    src.onended = () => {
      this.voices.delete(src);
      src.disconnect();
      gain.disconnect();
    };
    src.buffer = buffer;
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(this.master);
    src.start(ctx.currentTime + at);
  }

  click() {
    this.tone(880, 0, 0.05, "triangle", 0.045);
  }

  /** Low mechanical thunk played the instant the roll button is pressed. */
  press() {
    this.tone(140, 0, 0.055, "sine", 0.07, 70);
    this.noise(0, 0.018, 0.02);
  }

  open() {
    this.tone(420, 0, 0.12, "triangle", 0.045, 760);
  }

  buy() {
    this.tone(988, 0, 0.08, "square", 0.04);
    this.tone(1319, 0.07, 0.2, "square", 0.04);
    this.tone(2637, 0.07, 0.18, "sine", 0.018);
  }

  craft() {
    this.tone(220, 0, 0.13, "square", 0.06, 130);
    this.noise(0.02, 0.11, 0.03);
    [659, 988, 1319].forEach((frequency, index) => this.tone(frequency, 0.12 + index * 0.08, 0.22, "triangle", 0.045));
    this.tone(2637, 0.32, 0.4, "sine", 0.018);
  }

  brew() {
    if (!this.enabled) return;
    this.noise(0, 0.22, 0.03);
    [320, 400, 490, 620].forEach((frequency, i) => this.tone(frequency, i * 0.055, 0.15, "sine", 0.045));
    this.tone(1318.5, 0.28, 0.22, "triangle", 0.035);
  }

  drink() {
    if (!this.enabled) return;
    [440, 659, 880, 1318].forEach((frequency, i) => this.tone(frequency, i * 0.065, 0.28, "triangle", 0.045));
    this.tone(1760, 0.22, 0.55, "sine", 0.022);
  }

  collectOffline() {
    if (!this.enabled) return;
    [659.25, 783.99, 987.77, 1318.51].forEach((frequency, index) => {
      this.tone(frequency, index * 0.055, 0.22, "triangle", 0.045);
    });
    this.tone(2637, 0.17, 0.32, "sine", 0.022);
  }

  deny() {
    this.tone(150, 0, 0.16, "square", 0.045, 110);
  }

  /** Decelerating ticks while the rarity rail spins down, like a prize wheel. */
  spin(seconds = 3.2) {
    if (!this.enabled) return;
    const ticks = 17;
    for (let i = 0; i < ticks; i++) {
      const at = (seconds - 0.42) * (i / ticks) ** 1.7;
      this.tone(430 - (i / ticks) * 150, at, 0.03, "square", 0.015);
    }
  }

  lucky() {
    if (!this.enabled) return;
    [783.99, 987.77, 1174.66, 1567.98].forEach((frequency, index) => this.tone(frequency, index * 0.095, 0.19, "triangle", 0.038));
    this.tone(2093, 0.4, 0.45, "sine", 0.022);
  }

  /** Suspense riser while the reel crawls toward a rare result. */
  suspense(seconds: number) {
    if (!this.enabled) return;
    this.tone(70, 0, seconds, "sawtooth", 0.028, 160);
    this.tone(140, 0, seconds, "triangle", 0.02, 420);
  }

  /** The rare-reveal stinger: a sub hit, then a chord that grows with rarity. */
  reveal(level: 1 | 2 | 3) {
    if (!this.enabled) return;
    this.tone(55, 0, 0.9, "sine", 0.12, 38);
    this.noise(0, 0.35, 0.05);
    const chord = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].slice(0, 3 + level * 1.4);
    chord.forEach((f, i) => this.tone(f, 0.12 + i * 0.07, 1.4, "square", 0.022));
    chord.forEach((f) => this.tone(f * 2, 0.5, 1.6, "triangle", 0.014));
    for (let i = 0; i < 6 + level * 5; i++) this.tone(1600 + Math.random() * 3000, 0.45 + i * 0.07, 0.14, "sine", 0.015);
  }

  /** Ticket payout: a quick cascade of coin pings that climbs with the count. */
  claim(tickets = 3) {
    if (!this.enabled) return;
    const pings = Math.min(9, 3 + Math.floor(tickets / 4));
    for (let i = 0; i < pings; i++) this.tone(880 * 1.122 ** i, i * 0.055, 0.16, "triangle", 0.036);
    this.tone(2093, pings * 0.055, 0.35, "sine", 0.026);
  }

  /** A bright two-note chime for a finished quest or a new event. */
  chime() {
    if (!this.enabled) return;
    this.tone(1046.5, 0, 0.18, "triangle", 0.04);
    this.tone(1567.98, 0.09, 0.3, "triangle", 0.04);
  }

  /** Big crackling "run resets" whoosh followed by a rising phoenix chord. */
  rebirth() {
    if (!this.enabled) return;
    this.tone(90, 0, 0.9, "sawtooth", 0.05, 30);
    this.noise(0, 0.9, 0.06);
    [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.75 + i * 0.1, 1.3, "square", 0.03));
    [523.25, 659.25, 783.99].forEach((f) => this.tone(f * 2, 1.4, 1.5, "triangle", 0.02));
    for (let i = 0; i < 10; i++) this.tone(1500 + Math.random() * 3000, 1.3 + i * 0.08, 0.14, "sine", 0.018);
  }

  roll(tier: number, shiny: boolean, crit: boolean, crystal = false, cursed = false, glitched = false) {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.burstAt > 120) {
      this.burst = 0;
      this.burstAt = now;
    }
    this.burst++;
    const chance = TIERS[tier].chance;
    if (chance <= 18 && this.burst > 2) return;

    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093];

    if (tier === 0) {
      this.tone(620, 0, 0.08, "square", 0.035, 900);
    } else if (chance <= 8) {
      this.tone(659.25, 0, 0.08, "square", 0.035);
      this.tone(987.77, 0.055, 0.12, "square", 0.035);
    } else if (chance <= 32) {
      [0, 1, 2].forEach((n, i) => this.tone(scale[n + 1], i * 0.055, 0.15, "triangle", 0.05));
    } else if (chance <= 110) {
      this.tone(110, 0, 0.28, "sine", 0.1, 60);
      [0, 1, 2, 3].forEach((n, i) => this.tone(scale[n + 1], i * 0.055, 0.18, "square", 0.035));
    } else {
      const chord =
        chance >= 3500
          ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
          : chance >= 900
            ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
            : [523.25, 659.25, 783.99, 1046.5];
      [0, 1, 2, 3].forEach((n, i) => this.tone(scale[n], i * 0.075, 0.16, "square", 0.035));
      chord.forEach((f) => this.tone(f, 0.32, 1, "square", 0.022));
      chord.forEach((f) => this.tone(f * 2, 0.32, 1, "triangle", 0.016));
      const sparkles = Math.min(18, 6 + tier);
      for (let i = 0; i < sparkles; i++) {
        this.tone(1800 + Math.random() * 2800, 0.38 + i * 0.06, 0.12, "sine", 0.016);
      }
      if (chance >= 6500) {
        [0, 1, 2].forEach((i) => this.tone(scale[6] * (1 + i * 0.5), 1.3 + i * 0.18, 0.5, "triangle", 0.02));
      }
    }

    if (shiny) {
      for (let i = 0; i < 6; i++) this.tone(1800 + i * 300, 0.1 + i * 0.04, 0.11, "sine", 0.025);
    }
    if (crystal) {
      // glassy ascending chime
      [2093, 2637, 3136, 4186].forEach((f, i) => this.tone(f, 0.05 + i * 0.09, 0.5, "sine", 0.035));
      [2093, 2637, 3136, 4186].forEach((f, i) => this.tone(f * 1.5, 0.08 + i * 0.09, 0.3, "triangle", 0.012));
      this.tone(5200, 0.45, 0.6, "sine", 0.02, 6400);
    }
    if (cursed) {
      // a low falling drone under a dissonant minor bell
      this.tone(98, 0, 1.4, "sawtooth", 0.05, 49);
      this.tone(55, 0.05, 1.6, "sine", 0.12, 41);
      [622.25, 659.25, 932.33].forEach((f, i) => this.tone(f, 0.12 + i * 0.11, 0.9, "triangle", 0.03));
      this.tone(1864.66, 0.5, 0.8, "sine", 0.02, 1244.5);
      this.noise(0.02, 0.5, 0.035);
    }
    if (glitched) {
      [880, 1320, 660, 1760, 1100].forEach((f, i) => this.tone(f, i * .055, .055, "square", .026));
      this.tone(98, .02, .55, "triangle", .05, 65);
      this.tone(2640, .34, .3, "sine", .022, 1760);
    }
    if (crit) {
      this.tone(300, 0, 0.1, "sawtooth", 0.04, 1800);
      this.tone(1600, 0.08, 0.22, "square", 0.03);
    }
  }
}

export const sfx = new Sfx();
