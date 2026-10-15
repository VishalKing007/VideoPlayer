export type ThemeId = 'youtube' | 'vlc' | 'cyberpunk' | 'studio' | 'nordic' | 'retro';

export interface PlayerTheme {
  id: ThemeId;
  name: string;
  description: string;
  bgClass: string;
  cardClass: string;
  accentColor: string;
  accentHoverColor: string;
  sliderColor: string;
  textPrimary: string;
  textSecondary: string;
  borderClass: string;
  osdBadgeClass: string;
  glowColor: string;
}

export type AspectRatioOption = 'auto' | '16:9' | '4:3' | '21:9' | '1:1' | 'fill' | 'stretch';

export interface VideoEffects {
  brightness: number; // 0 to 200, default 100
  contrast: number;   // 0 to 200, default 100
  saturation: number; // 0 to 200, default 100
  hueRotate: number;  // 0 to 360, default 0
  invert: boolean;
  sepia: number;      // 0 to 100, default 0
  blur: number;       // 0 to 20px, default 0
  flipH: boolean;
  flipV: boolean;
  rotation: number;   // 0, 90, 180, 270
  aspectRatio: AspectRatioOption;
}

export interface SubtitleCue {
  id?: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  cues: SubtitleCue[];
  isCustom?: boolean;
}

export interface SubtitleSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontColor: string;
  backgroundColor: string;
  textShadow: boolean;
  offsetSeconds: number; // subtitle sync adjustment in seconds
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
}

export interface Bookmark {
  id: string;
  time: number;
  label: string;
  createdAt: number;
}

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  src: string;
  thumbnailUrl?: string;
  duration?: number;
  type: 'video' | 'audio';
  isLocal?: boolean;
  subtitles?: SubtitleTrack[];
  chapters?: Chapter[];
  description?: string;
}

export interface ABLoopState {
  enabled: boolean;
  pointA: number | null;
  pointB: number | null;
}

export interface EqualizerBand {
  frequency: number;
  gain: number; // -12dB to +12dB
}

export interface EqualizerPreset {
  id: string;
  name: string;
  gains: number[]; // 10 bands
}
