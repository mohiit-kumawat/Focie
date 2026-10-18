/**
 * Cozy Web Audio Sound Engine for Focusie
 * Synthesizes gentle, soothing acoustic bells without external audio asset downloads.
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("focie_sound_muted");
      this.isMuted = saved === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("focie_sound_muted", String(muted));
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Soothing multi-tone crystalline bell chime on session completion (528Hz Solfeggio / C Major harmony)
   */
  public playCompletionChime(volume = 0.35): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Harmonic frequencies: C5, E5, G5, B5, C6 (cozy peaceful progression)
      const frequencies = [523.25, 659.25, 783.99, 987.77, 1046.5];
      const now = ctx.currentTime;

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warm harmonic sine wave
        osc.type = "sine";
        const noteStart = now + idx * 0.14;
        osc.frequency.setValueAtTime(freq, noteStart);

        // Gentle envelope: instant attack with lingering resonance
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(volume / frequencies.length, noteStart + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 2.3);
      });
    } catch {
      // Gracefully silent if browser blocks audio
    }
  }

  /**
   * Soft wooden drop chime on timer start
   */
  public playStartChime(volume = 0.2): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Silent on policy block
    }
  }
}

export const soundEngine = new SoundEngine();

