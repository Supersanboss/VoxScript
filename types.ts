export interface Speaker {
  id: string;
  name: string;
  voice: VoiceName | string; // Can be a standard voice or a custom profile ID
  customProfileId?: string;
}

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export const AVAILABLE_VOICES: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export interface VoiceProfile {
  id: string;
  name: string;
  baseVoice: VoiceName;
  description: string; // e.g. "Raspy, elderly, slow pacing"
  gender: 'Male' | 'Female' | 'Neutral';
}

export interface GenerationConfig {
  temperature: number;
  speed: number;
  systemInstruction: string;
}

export interface AudioState {
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AppView = 'script' | 'voicelab' | 'live';