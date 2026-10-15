import React from 'react';
import {
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  X,
  Maximize2,
  Tv,
} from 'lucide-react';
import type { AspectRatioOption, PlayerTheme, VideoEffects } from '../types/player.ts';

interface VideoEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
  effects: VideoEffects;
  onChangeEffects: (effects: VideoEffects) => void;
  onResetEffects: () => void;
}

export const VideoEffectsModal: React.FC<VideoEffectsModalProps> = ({
  isOpen,
  onClose,
  theme,
  effects,
  onChangeEffects,
  onResetEffects,
}) => {
  if (!isOpen) return null;

  const updateField = <K extends keyof VideoEffects>(key: K, value: VideoEffects[K]) => {
    onChangeEffects({
      ...effects,
      [key]: value,
    });
  };

  const rotate90 = () => {
    const nextRotation = (effects.rotation + 90) % 360;
    updateField('rotation', nextRotation);
  };

  const aspectRatios: { id: AspectRatioOption; label: string }[] = [
    { id: 'auto', label: 'Default (Auto)' },
    { id: '16:9', label: '16:9 (Widescreen)' },
    { id: '4:3', label: '4:3 (Classic TV)' },
    { id: '21:9', label: '21:9 (Cinematic)' },
    { id: '1:1', label: '1:1 (Square)' },
    { id: 'fill', label: 'Fill / Zoom' },
    { id: 'stretch', label: 'Stretch' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-xl p-6 rounded-2xl border shadow-2xl ${theme.cardClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${theme.accentColor}20` }}
            >
              <Sliders className="w-5 h-5" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Video Effects & Geometry</h2>
              <p className="text-xs text-neutral-400">
                VLC-grade color grading, aspect ratio adjustments, rotation & mirror transforms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close video effects"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Aspect Ratio & Transform */}
          <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-neutral-400" />
                Aspect Ratio Override
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">Current: {effects.aspectRatio}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
              {aspectRatios.map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateField('aspectRatio', item.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                    effects.aspectRatio === item.id
                      ? 'bg-neutral-100 text-neutral-950 border-white font-semibold shadow-sm'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs">
              <span className="text-neutral-300 font-semibold">Geometric Transform</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={rotate90}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 transition-colors"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{effects.rotation}°</span>
                </button>
                <button
                  onClick={() => updateField('flipH', !effects.flipH)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
                    effects.flipH
                      ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                  }`}
                  title="Flip Horizontal (Mirror)"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Mirror</span>
                </button>
                <button
                  onClick={() => updateField('flipV', !effects.flipV)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-colors ${
                    effects.flipV
                      ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip V</span>
                </button>
              </div>
            </div>
          </div>

          {/* Color Adjustments */}
          <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-neutral-400" />
              Color Grading & Filters
            </span>

            {/* Brightness */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300">Brightness</span>
                <span className="font-mono text-neutral-400">{effects.brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={effects.brightness}
                onChange={(e) => updateField('brightness', parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: theme.accentColor }}
                aria-label="Video brightness slider"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300">Contrast</span>
                <span className="font-mono text-neutral-400">{effects.contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={effects.contrast}
                onChange={(e) => updateField('contrast', parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: theme.accentColor }}
                aria-label="Video contrast slider"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300">Saturation</span>
                <span className="font-mono text-neutral-400">{effects.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={effects.saturation}
                onChange={(e) => updateField('saturation', parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: theme.accentColor }}
                aria-label="Video saturation slider"
              />
            </div>

            {/* Hue */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300">Hue Rotate</span>
                <span className="font-mono text-neutral-400">{effects.hueRotate}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={effects.hueRotate}
                onChange={(e) => updateField('hueRotate', parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: theme.accentColor }}
                aria-label="Video hue rotation slider"
              />
            </div>

            {/* Sepia & Blur */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-300">Sepia</span>
                  <span className="font-mono text-neutral-400">{effects.sepia}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.sepia}
                  onChange={(e) => updateField('sepia', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: theme.accentColor }}
                  aria-label="Video sepia slider"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-300">Blur</span>
                  <span className="font-mono text-neutral-400">{effects.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={effects.blur}
                  onChange={(e) => updateField('blur', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: theme.accentColor }}
                  aria-label="Video blur slider"
                />
              </div>
            </div>

            {/* Invert toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <span className="text-xs text-neutral-300">Negative / Invert Colors</span>
              <button
                onClick={() => updateField('invert', !effects.invert)}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  effects.invert
                    ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                {effects.invert ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-800">
          <button
            onClick={onResetEffects}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm"
            style={{ backgroundColor: theme.accentColor }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
