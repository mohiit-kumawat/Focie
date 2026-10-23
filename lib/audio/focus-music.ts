/**
 * Focie Cozy Focus Music & Ambient Audio Engine
 * Provides alert, rhythm-driven study audio (not sleepy/meditative)
 * with 100% offline procedural synthesis fallbacks and full user control.
 */

export interface FocusTrack {
  id: string;
  name: string;
  emoji: string;
  genre: "beats" | "binaural" | "synth" | "ambient";
  description: string;
  type: "stream" | "procedural";
  url?: string;
  bpm?: number;
}

export const FOCUS_TRACKS: FocusTrack[] = [
  {
    id: "lofi-beats",
    name: "Lo-Fi Study Beats",
    emoji: "🎵",
    genre: "beats",
    bpm: 85,
    description: "Alert 85 BPM rhythmic chillhop that keeps your momentum flowing.",
    type: "stream",
    url: "https://streams.ilovemusic.de/iloveradio17.mp3",
  },
  {
    id: "binaural-beta",
    name: "Binaural Beta Pulse (16Hz Alert)",
    emoji: "⚡",
    genre: "binaural",
    description: "Active cognitive frequencies (16Hz difference) stimulating alertness and problem-solving.",
    type: "procedural",
  },
  {
    id: "synthwave",
    name: "Synthwave Deep Work",
    emoji: "💻",
    genre: "synth",
    bpm: 100,
    description: "Upbeat retro-electronic cadence for coding, math crunch and problem solving.",
    type: "stream",
    url: "https://stream.nightride.fm/chillsynth.mp3",
  },
  {
    id: "storm-focus",
    name: "Storm & Focus Noise-Blocker",
    emoji: "🌧️",
    genre: "ambient",
    description: "Deep procedural rainfall that masks household distractions and room noise.",
    type: "procedural",
  },
  {
    id: "cozy-cafe",
    name: "Busy Study Cafe",
    emoji: "☕",
    genre: "ambient",
    description: "Energizing ambient coffeehouse chatter and momentum to banish loneliness.",
    type: "stream",
    url: "https://icecast.walmradio.com:8443/jazz",
  },
];

export interface FocusMusicState {
  isPlaying: boolean;
  activeTrackId: string;
  volume: number; // 0 to 1
  autoPlayWithTimer: boolean;
  isBuffering: boolean;
  error: string | null;
}

class FocusMusicEngine {
  private audioEl: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private proceduralNodes: { stop: () => void } | null = null;

  private state: FocusMusicState = {
    isPlaying: false,
    activeTrackId: "lofi-beats",
    volume: 0.5,
    autoPlayWithTimer: false,
    isBuffering: false,
    error: null,
  };

  private listeners: Set<(state: FocusMusicState) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedTrack = localStorage.getItem("focie_music_track");
        const savedVolume = localStorage.getItem("focie_music_volume");
        const savedAutoplay = localStorage.getItem("focie_music_autoplay");

        if (savedTrack && FOCUS_TRACKS.some((t) => t.id === savedTrack)) {
          this.state.activeTrackId = savedTrack;
        }
        if (savedVolume !== null) {
          const v = parseFloat(savedVolume);
          if (!isNaN(v) && v >= 0 && v <= 1) this.state.volume = v;
        }
        if (savedAutoplay !== null) {
          this.state.autoPlayWithTimer = savedAutoplay === "true";
        }
      } catch {
        // Ignore localStorage read errors
      }
    }
  }

  public subscribe(listener: (state: FocusMusicState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public getState(): FocusMusicState {
    return { ...this.state };
  }

  public getActiveTrack(): FocusTrack {
    return (
      FOCUS_TRACKS.find((t) => t.id === this.state.activeTrackId) ||
      FOCUS_TRACKS[0]!
    );
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.setValueAtTime(this.state.volume, this.audioCtx.currentTime);
          this.masterGain.connect(this.audioCtx.destination);
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

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;

    if (this.audioEl) {
      this.audioEl.volume = clamped;
    }
    if (this.audioCtx && this.masterGain) {
      try {
        this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
      } catch {
        // Ignore AudioParam errors
      }
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("focie_music_volume", String(clamped));
      } catch {}
    }
    this.notify();
  }

  public setAutoPlayWithTimer(enabled: boolean) {
    this.state.autoPlayWithTimer = enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("focie_music_autoplay", String(enabled));
      } catch {}
    }
    this.notify();
  }

  public async setTrack(trackId: string) {
    const track = FOCUS_TRACKS.find((t) => t.id === trackId);
    if (!track) return;

    this.state.activeTrackId = track.id;
    this.state.error = null;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("focie_music_track", track.id);
      } catch {}
    }

    if (this.state.isPlaying) {
      await this.play();
    } else {
      this.notify();
    }
  }

  public async togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  public async play() {
    this.stopCurrentAudio();
    const track = this.getActiveTrack();

    if (track.type === "procedural") {
      this.playProcedural(track.id);
      this.state.isPlaying = true;
      this.state.isBuffering = false;
      this.state.error = null;
      this.notify();
      return;
    }

    // Stream Audio
    if (track.url) {
      this.state.isBuffering = true;
      this.state.error = null;
      this.notify();

      try {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = track.url;
        audio.volume = this.state.volume;
        audio.preload = "auto";
        this.audioEl = audio;

        audio.onwaiting = () => {
          this.state.isBuffering = true;
          this.notify();
        };

        audio.onplaying = () => {
          this.state.isBuffering = false;
          this.state.isPlaying = true;
          this.notify();
        };

        audio.onerror = () => {
          console.warn(`[FocusMusic] Stream failed for ${track.name}. Falling back to Binaural Beta.`);
          this.state.isBuffering = false;
          this.state.error = "Stream busy; switched to offline Beta waves.";
          this.playProcedural("binaural-beta");
          this.state.isPlaying = true;
          this.notify();
        };

        await audio.play();
        this.state.isPlaying = true;
        this.state.isBuffering = false;
        this.notify();
      } catch (err: unknown) {
        console.warn("[FocusMusic] Play blocked or failed:", err);
        // Fallback to offline procedural audio
        this.playProcedural("binaural-beta");
        this.state.isPlaying = true;
        this.state.isBuffering = false;
        this.notify();
      }
    }
  }

  public pause() {
    this.stopCurrentAudio();
    this.state.isPlaying = false;
    this.state.isBuffering = false;
    this.notify();
  }

  private stopCurrentAudio() {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.src = "";
        this.audioEl.load();
      } catch {}
      this.audioEl = null;
    }

    if (this.proceduralNodes) {
      try {
        this.proceduralNodes.stop();
      } catch {}
      this.proceduralNodes = null;
    }
  }

  /**
   * Procedural Audio Synthesizer:
   * 1. Binaural Beta (16Hz focus differential for active alertness)
   * 2. Procedural Storm & Rain (Noise buffer + resonant filter)
   */
  private playProcedural(trackId: string) {
    const ctx = this.getAudioContext();
    if (!ctx || !this.masterGain) return;

    if (trackId === "binaural-beta") {
      // 16Hz Beta difference: Left = 200Hz, Right = 216Hz
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      // Soft sub-harmonic foundation (warm Rhodes pad tone)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(100, ctx.currentTime);
      subGain.gain.setValueAtTime(0.08, ctx.currentTime);

      oscL.type = "sine";
      oscL.frequency.setValueAtTime(200, ctx.currentTime);

      oscR.type = "sine";
      oscR.frequency.setValueAtTime(216, ctx.currentTime);

      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(0.25, ctx.currentTime);

      if (pannerL && pannerR) {
        pannerL.pan.setValueAtTime(-1, ctx.currentTime);
        pannerR.pan.setValueAtTime(1, ctx.currentTime);
        oscL.connect(pannerL);
        pannerL.connect(localGain);
        oscR.connect(pannerR);
        pannerR.connect(localGain);
      } else {
        oscL.connect(localGain);
        oscR.connect(localGain);
      }

      subOsc.connect(subGain);
      subGain.connect(localGain);
      localGain.connect(this.masterGain);

      const now = ctx.currentTime;
      oscL.start(now);
      oscR.start(now);
      subOsc.start(now);

      this.proceduralNodes = {
        stop: () => {
          try {
            oscL.stop();
            oscR.stop();
            subOsc.stop();
            oscL.disconnect();
            oscR.disconnect();
            subOsc.disconnect();
            localGain.disconnect();
          } catch {}
        },
      };
    } else if (trackId === "storm-focus") {
      // Procedural Rain Noise Buffer (3 seconds loop)
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Pink noise filter approximation
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.25;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Lowpass filter for smooth rainfall
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(850, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.masterGain);

      whiteNoise.start();

      this.proceduralNodes = {
        stop: () => {
          try {
            whiteNoise.stop();
            whiteNoise.disconnect();
            filter.disconnect();
            rainGain.disconnect();
          } catch {}
        },
      };
    }
  }
}

export const focusMusicEngine = new FocusMusicEngine();

