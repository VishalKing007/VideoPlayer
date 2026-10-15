import type {
  AspectRatioOption,
  EqualizerPreset,
  MediaItem,
  SubtitleCue,
  VideoEffects,
} from '../types/player.ts';

/**
 * Formats time in seconds to mm:ss or hh:mm:ss string.
 */
export function formatTime(
  seconds: number,
  mode: 'standard' | 'remaining' | 'smpte' = 'standard',
  totalDuration?: number
): string {
  if (isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }

  if (mode === 'remaining' && typeof totalDuration === 'number' && totalDuration > 0) {
    const remaining = Math.max(0, totalDuration - seconds);
    return `-${formatTime(remaining, 'standard')}`;
  }

  if (mode === 'smpte') {
    const totalMs = Math.floor(seconds * 1000);
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const frames = Math.floor(((totalMs % 1000) / 1000) * 30); // assuming 30 fps
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  const rounded = Math.floor(seconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clamps playback rate to allowed range (0.25x to 4x).
 */
export function clampPlaybackRate(rate: number): number {
  if (isNaN(rate)) return 1.0;
  return Math.max(0.25, Math.min(4.0, Math.round(rate * 100) / 100));
}

/**
 * Parses timestamp string "00:01:23,456" or "00:01:23.456" into seconds.
 */
export function parseSubtitleTimestamp(timeStr: string): number {
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Parses SRT subtitle text into structured cues.
 */
export function parseSRT(srtContent: string): SubtitleCue[] {
  if (!srtContent) return [];
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    // Some SRTs start with numeric identifier
    if (/^\d+$/.test(lines[0].trim())) {
      timeLineIdx = 1;
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startRaw, endRaw] = timeLine.split('-->');
    if (!startRaw || !endRaw) continue;

    const startTime = parseSubtitleTimestamp(startRaw);
    const endTime = parseSubtitleTimestamp(endRaw);
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join('\n').replace(/<[^>]*>/g, '').trim();

    if (text && endTime > startTime) {
      cues.push({ startTime, endTime, text });
    }
  }

  return cues;
}

/**
 * Parses WebVTT subtitle text into structured cues.
 */
export function parseVTT(vttContent: string): SubtitleCue[] {
  if (!vttContent) return [];
  const clean = vttContent.replace(/^WEBVTT[^\n]*\n+/i, '');
  return parseSRT(clean);
}

/**
 * Finds active subtitle cue for a given current time with sync offset.
 */
export function getCurrentCue(
  cues: SubtitleCue[],
  currentTime: number,
  offsetSeconds: number = 0
): SubtitleCue | null {
  if (!cues || cues.length === 0) return null;
  const targetTime = currentTime - offsetSeconds;
  return (
    cues.find(
      (cue) => targetTime >= cue.startTime && targetTime <= cue.endTime
    ) || null
  );
}

/**
 * Builds CSS filter string from VideoEffects object.
 */
export function getVideoFilterStyle(effects: VideoEffects): string {
  const filters: string[] = [];
  if (effects.brightness !== 100) filters.push(`brightness(${effects.brightness}%)`);
  if (effects.contrast !== 100) filters.push(`contrast(${effects.contrast}%)`);
  if (effects.saturation !== 100) filters.push(`saturate(${effects.saturation}%)`);
  if (effects.hueRotate !== 0) filters.push(`hue-rotate(${effects.hueRotate}deg)`);
  if (effects.invert) filters.push('invert(100%)');
  if (effects.sepia > 0) filters.push(`sepia(${effects.sepia}%)`);
  if (effects.blur > 0) filters.push(`blur(${effects.blur}px)`);

  return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * Builds CSS transform string for video rotation and flips.
 */
export function getVideoTransformStyle(effects: VideoEffects): string {
  const transforms: string[] = [];
  if (effects.rotation !== 0) transforms.push(`rotate(${effects.rotation}deg)`);
  if (effects.flipH) transforms.push('scaleX(-1)');
  if (effects.flipV) transforms.push('scaleY(-1)');

  return transforms.length > 0 ? transforms.join(' ') : 'none';
}

/**
 * Standard 10 Equalizer band frequencies in Hz.
 */
export const EQUALIZER_FREQUENCIES = [
  32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000
];

/**
 * Curated audio equalizer presets.
 */
export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { id: 'flat', name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass', name: 'Bass Boost', gains: [7, 6, 5, 2, 0, 0, 0, 0, 0, 0] },
  { id: 'vocal', name: 'Vocal Clarity', gains: [-2, -1, 0, 3, 5, 5, 4, 2, 0, -1] },
  { id: 'rock', name: 'Rock', gains: [5, 4, 3, 1, -1, -1, 1, 3, 4, 5] },
  { id: 'cinema', name: 'Movie / Dialogue', gains: [3, 2, 0, 2, 4, 4, 3, 2, 1, 0] },
  { id: 'electronic', name: 'Electronic', gains: [6, 5, 2, 0, -2, 2, 1, 2, 4, 5] },
  { id: 'treble', name: 'Treble Booster', gains: [-2, -2, -1, 0, 1, 2, 4, 6, 7, 8] },
];

/**
 * Sample Media library with royalty-free videos & audios to guarantee out-of-the-box delight.
 */
export const DEMO_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'demo-bunny',
    title: 'Big Buck Bunny - Open Movie Trailer',
    artist: 'Blender Foundation',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80',
    type: 'video',
    description: 'Classic open-source animation classic with lush green nature and vibrant characters.',
    chapters: [
      { id: 'c1', title: 'Forest Awakening', startTime: 0 },
      { id: 'c2', title: 'The Meadow Encounter', startTime: 120 },
      { id: 'c3', title: 'The Apple Trap', startTime: 280 },
      { id: 'c4', title: 'Bunny Strikes Back', startTime: 420 },
    ],
    subtitles: [
      {
        id: 'sub-en',
        label: 'English [CC]',
        language: 'en',
        cues: [
          { startTime: 2, endTime: 6, text: 'A sunny peaceful morning in the enchanted forest...' },
          { startTime: 7, endTime: 12, text: 'Big Buck Bunny steps out into the fresh blooming meadow.' },
          { startTime: 14, endTime: 19, text: 'Gentle breeze rustles through the giant oak trees.' },
          { startTime: 21, endTime: 27, text: 'Suddenly, mischief emerges from the shadows!' },
          { startTime: 29, endTime: 35, text: 'The forest creatures prepare for an unexpected showdown.' },
        ],
      },
      {
        id: 'sub-es',
        label: 'Español',
        language: 'es',
        cues: [
          { startTime: 2, endTime: 6, text: 'Una mañana pacífica y soleada en el bosque encantado...' },
          { startTime: 7, endTime: 12, text: 'Big Buck Bunny sale al prado florido.' },
          { startTime: 14, endTime: 19, text: 'Una suave brisa susurra entre los grandes robles.' },
        ],
      },
    ],
  },
  {
    id: 'demo-sintel',
    title: 'Sintel - Fantasy Cinematic Journey',
    artist: 'Blender Animation Studio',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
    type: 'video',
    description: 'Epic fantasy adventure following a lone traveler across snowy mountain peaks in search of her dragon.',
    chapters: [
      { id: 's1', title: 'Blizzard Ascent', startTime: 0 },
      { id: 's2', title: 'The Old Shaman', startTime: 100 },
      { id: 's3', title: 'Memory of the Dragon', startTime: 220 },
    ],
    subtitles: [
      {
        id: 'sintel-en',
        label: 'English [Narrative]',
        language: 'en',
        cues: [
          { startTime: 5, endTime: 11, text: 'Cold biting winds sweep over the frozen peak.' },
          { startTime: 13, endTime: 18, text: 'She continues forward, refusing to turn back.' },
          { startTime: 22, endTime: 28, text: 'Every step brings memories of what was lost.' },
        ],
      },
    ],
  },
  {
    id: 'demo-tears-of-steel',
    title: 'Tears of Steel - Sci-Fi VFX Showcase',
    artist: 'Mango Open Movie Team',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    type: 'video',
    description: 'Futuristic dystopian sci-fi set in Amsterdam with towering mechs and high-tech tracking visuals.',
    chapters: [
      { id: 't1', title: 'The Amsterdam Outpost', startTime: 0 },
      { id: 't2', title: 'Robotics Calibration', startTime: 80 },
      { id: 't3', title: 'The Final Directive', startTime: 250 },
    ],
  },
  {
    id: 'demo-we-are-going-on-bullrun',
    title: 'Bullrun Supercars - 60FPS Speed Trail',
    artist: 'Chromium Media Project',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&q=80',
    type: 'video',
    description: 'High-octane road trip footage with sports cars roaring across scenic highways.',
  },
];
