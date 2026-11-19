import type { AudioSettings, RegionInfo, WeatherType } from './types';

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private envFilter: BiquadFilterNode | null = null;

  private settings: AudioSettings = {
    masterVolume: 0.75,
    sfxVolume: 0.85,
    ambienceVolume: 0.65,
    muted: false,
  };
  private ambienceTimer: number | null = null;
  private isPlaying = false;
  private isNight = false;
  private tensionLevel = 0;
  private regionAmbience: RegionInfo['ambienceType'] = 'vila';
  private weather: WeatherType = 'limpo';
  private isIndoors = false;

  public init(): void {
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    if (ua && !ua.hasBeenActive && !this.ctx) {
      return;
    }
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambienceGain = this.ctx.createGain();
      this.envFilter = this.ctx.createBiquadFilter();
      this.envFilter.type = 'lowpass';
      this.envFilter.frequency.value = 18000;

      this.sfxGain.connect(this.envFilter);
      this.ambienceGain.connect(this.envFilter);
      this.envFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
      this.setupContinuousWindAndRain();
      this.setupSuspenseDrone();
    } catch {
      this.ctx = null;
    }
  }

  public updateSettings(next: AudioSettings): void {
    this.settings = { ...next };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.04);
    this.ambienceGain.gain.setTargetAtTime(this.settings.ambienceVolume, now, 0.04);
  }

  public setWorldState(
    playing: boolean,
    isNight: boolean,
    tensionLevel: number,
    regionAmbience: RegionInfo['ambienceType'] = 'vila',
    weather: WeatherType = 'limpo',
    isIndoors = false,
  ): void {
    this.isPlaying = playing;
    this.isNight = isNight;
    this.tensionLevel = Math.max(0, Math.min(1, tensionLevel));
    this.regionAmbience = regionAmbience;
    this.weather = weather;
    this.isIndoors = isIndoors;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.envFilter) {
      const targetCutoff =
        regionAmbience === 'subterraneo' ? 1400 : isIndoors ? 3200 : 18000;
      this.envFilter.frequency.setTargetAtTime(targetCutoff, now, 0.25);
    }
    if (this.windGain) {
      const windBase = weather === 'ventania' || weather === 'tempestade' ? 0.2 : isNight ? 0.12 : 0.07;
      this.windGain.gain.setTargetAtTime(playing ? windBase : 0.04, now, 0.4);
    }
    if (this.rainGain) {
      const raining = weather === 'chuva' || weather === 'tempestade';
      const rainVol = playing && raining ? (isIndoors ? 0.06 : 0.16) : 0;
      this.rainGain.gain.setTargetAtTime(rainVol, now, 0.4);
    }
    if (this.droneGain) {
      const subBoost = regionAmbience === 'subterraneo' || regionAmbience === 'sombrio' ? 0.05 : 0;
      const targetDrone = playing && (isNight || subBoost > 0) ? 0.03 + subBoost + this.tensionLevel * 0.14 : 0;
      this.droneGain.gain.setTargetAtTime(targetDrone, now, 0.35);
    }

    if (playing && this.ambienceTimer === null) {
      this.scheduleAmbientTick();
    } else if (!playing && this.ambienceTimer !== null) {
      window.clearTimeout(this.ambienceTimer);
      this.ambienceTimer = null;
    }
  }

  private setupContinuousWindAndRain(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = buffer;
    windNoise.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 380;
    windFilter.Q.value = 1.4;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.05;
    windNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.ambienceGain);
    windNoise.start();

    const rainNoise = this.ctx.createBufferSource();
    rainNoise.buffer = buffer;
    rainNoise.loop = true;
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1200;
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;
    rainNoise.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambienceGain);
    rainNoise.start();
  }

  private setupSuspenseDrone(): void {
    if (!this.ctx || !this.ambienceGain) return;
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sawtooth';
    this.droneOsc.frequency.value = 55;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 135;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0;
    this.droneOsc.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.ambienceGain);
    this.droneOsc.start();
  }

  private scheduleAmbientTick(): void {
    if (!this.isPlaying) {
      this.ambienceTimer = null;
      return;
    }
    const delayMs = this.isNight ? 1800 + Math.random() * 2500 : 2800 + Math.random() * 3200;
    this.ambienceTimer = window.setTimeout(() => {
      if (this.isPlaying && this.ctx && !this.settings.muted) {
        const roll = Math.random();
        if (this.regionAmbience === 'agua') {
          if (roll < 0.65) this.playFrogCroak();
          else this.playCricketChirp();
        } else if (this.regionAmbience === 'subterraneo') {
          if (roll < 0.5) this.playWoodCreak();
          else this.playDoorKnock();
        } else if (this.isNight) {
          if (roll < 0.35) this.playCricketChirp();
          else if (roll < 0.56) this.playFrogCroak();
          else if (roll < 0.72) this.playDogBark();
          else if (roll < 0.88) this.playWoodCreak();
          else this.playViolaNote();
        } else {
          if (roll < 0.45) this.playCricketChirp();
          else if (roll < 0.72) this.playViolaNote();
          else this.playDogBark();
        }
      }
      this.scheduleAmbientTick();
    }, delayMs);
  }

  public playCricketChirp(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.085;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4200 + Math.random() * 350, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.035, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ambienceGain);
      osc.start(t);
      osc.stop(t + 0.065);
    }
  }

  public playFrogCroak(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115, t);
      osc.frequency.exponentialRampToValueAtTime(175, t + 0.11);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.ambienceGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  public playDogBark(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = now + i * 0.26;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.14);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambienceGain);
      osc.start(t);
      osc.stop(t + 0.16);
    }
  }

  public playViolaNote(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const notes = [293.66, 349.23, 440, 523.25, 440];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.ambienceGain) return;
      const t = now + idx * 0.24;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.55);
      osc.connect(gain);
      gain.connect(this.ambienceGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playThunder(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(88, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 1.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.55);
  }

  public playFootstep(
    surface: 'wood' | 'dirt' | 'grass' | 'stone' | 'water',
    sprint = false,
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitchJitter = 0.92 + Math.random() * 0.16;

    if (surface === 'wood') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
    } else if (surface === 'stone') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(195 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.055);
    } else if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(310 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    } else if (surface === 'dirt') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.06);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    }

    const amp = sprint ? 0.14 : 0.085;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playDoorCreak(open: boolean): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(open ? 190 : 280, now);
    osc.frequency.linearRampToValueAtTime(open ? 310 : 140, now + 0.28);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 3;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playDoorKnock(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  }

  public playWoodCreak(): void {
    this.playDoorCreak(Math.random() > 0.5);
  }

  public playPickup(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playAchievement(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playChickenSquawk(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520 + i * 90, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.08);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  public playSaciWhistle(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(1750, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.28);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playSpookySting(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [92.5, 98.0, 138.59].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.75);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 650;
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.82);
    });
  }

  public playClockThreeAM(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.7;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.62);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.65);
    }
  }

  public playUiClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.045);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }
}

export const gameAudio = new GameAudioEngine();
