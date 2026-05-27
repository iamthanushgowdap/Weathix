import { Audio } from 'expo-av';
// Platform intentionally NOT imported at module level — lazily accessed inside methods

interface AudioLoop {
  sound: Audio.Sound | null;
  targetVolume: number;
  currentVolume: number;
}

export class ProceduralAmbientAudioEngine {
  private loops: Record<string, AudioLoop> = {};
  private crossfadeInterval: any = null;
  private isInitialized = false;
  private isMuted = false;

  constructor() {
    this.loops = {
      rain: { sound: null, targetVolume: 0, currentVolume: 0 },
      wind: { sound: null, targetVolume: 0, currentVolume: 0 },
      thunder: { sound: null, targetVolume: 0, currentVolume: 0 },
      snow: { sound: null, targetVolume: 0, currentVolume: 0 },
    };
  }

  /**
   * Initializes standard audio routing modes and preloads loops
   */
  async initialize(): Promise<void> {
    const platformOS: string = (() => { try { return require('react-native').Platform.OS; } catch { return 'native'; } })();
    if (platformOS === 'web' || this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldRouteThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      } as any);

      // Preload loop files (with try/catch to avoid hard errors if resources aren't fully bundled yet)
      this.loops.rain.sound = await this.preloadLoop(require('../../assets/audio/soft_rain.mp3'));
      this.loops.wind.sound = await this.preloadLoop(require('../../assets/audio/soft_wind.mp3'));
      this.loops.thunder.sound = await this.preloadLoop(require('../../assets/audio/thunder_rumble.mp3'));
      this.loops.snow.sound = await this.preloadLoop(require('../../assets/audio/soft_snow.mp3'));

      // Launch crossfade correction timer running at 100ms intervals
      this.crossfadeInterval = setInterval(() => this.processVolumeCrossfades(), 100);
      this.isInitialized = true;
      console.log('[Weathix Audio] Procedural Audio initialized successfully.');
    } catch (error) {
      console.warn('[Weathix Audio] Audio engine failed loading native assets. Muting ambient channels.', error);
    }
  }

  private async preloadLoop(source: any): Promise<Audio.Sound | null> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true, isLooping: true, volume: 0 }
      );
      return sound;
    } catch {
      return null;
    }
  }

  /**
   * Modulates volumes according to climate levels
   */
  updateAmbientParameters(
    rainIntensity: number, // 0.0 (drizzle) to 1.0 (torrential storm)
    windSpeedKph: number,  // 0 to 100 kph
    stormActive: boolean,
    isSnow: boolean
  ): void {
    if (!this.isInitialized || this.isMuted) return;

    if (isSnow) {
      this.loops.snow.targetVolume = Math.min(rainIntensity * 0.7, 0.8);
      this.loops.rain.targetVolume = 0;
    } else {
      this.loops.rain.targetVolume = Math.min(rainIntensity * 0.85, 0.95);
      this.loops.snow.targetVolume = 0;
    }

    // Standard scale: 70kph corresponds to maximum wind sound volume
    this.loops.wind.targetVolume = Math.min(windSpeedKph / 70.0, 0.8);
    this.loops.thunder.targetVolume = stormActive ? 0.9 : 0.0;
  }

  /**
   * Fades audio tracks linearly to prevent dynamic audio pops
   */
  private async processVolumeCrossfades(): Promise<void> {
    for (const key of Object.keys(this.loops)) {
      const item = this.loops[key];
      if (!item.sound) continue;

      const diff = item.targetVolume - item.currentVolume;
      if (Math.abs(diff) > 0.02) {
        const step = diff > 0 ? 0.03 : -0.03;
        item.currentVolume = Math.max(0, Math.min(1, item.currentVolume + step));
        try {
          await item.sound.setVolumeAsync(item.currentVolume);
        } catch {
          // Guard against rapid JSI unmount errors
        }
      }
    }
  }

  /**
   * Master volume control
   */
  setMute(mute: boolean): void {
    this.isMuted = mute;
    if (mute) {
      for (const key of Object.keys(this.loops)) {
        this.loops[key].targetVolume = 0;
      }
    }
  }

  /**
   * Clean unmount buffers
   */
  async dispose(): Promise<void> {
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
    }
    for (const key of Object.keys(this.loops)) {
      const item = this.loops[key];
      if (item.sound) {
        try {
          await item.sound.unloadAsync();
        } catch {}
        item.sound = null;
      }
    }
    this.isInitialized = false;
  }
}

let _audioEngineInstance: ProceduralAmbientAudioEngine | null = null;

/**
 * Lazily-created singleton — deferred so Platform is never accessed during
 * module evaluation (before the React Native bridge is ready on Android).
 */
export const proceduralAudioEngine = {
  get instance(): ProceduralAmbientAudioEngine {
    if (!_audioEngineInstance) {
      _audioEngineInstance = new ProceduralAmbientAudioEngine();
    }
    return _audioEngineInstance;
  },
  initialize: () => proceduralAudioEngine.instance.initialize(),
  updateAmbientParameters: (
    rainIntensity: number,
    windSpeedKph: number,
    stormActive: boolean,
    isSnow: boolean
  ) => proceduralAudioEngine.instance.updateAmbientParameters(rainIntensity, windSpeedKph, stormActive, isSnow),
  setMute: (mute: boolean) => proceduralAudioEngine.instance.setMute(mute),
  dispose: () => proceduralAudioEngine.instance.dispose(),
};
