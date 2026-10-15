import React, { useEffect, useRef } from 'react';
import { SlidersHorizontal, Volume2, RotateCcw, X, Zap } from 'lucide-react';
import { EQUALIZER_FREQUENCIES, EQUALIZER_PRESETS } from '../utils/playerUtils.ts';
import type { PlayerTheme } from '../types/player.ts';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
  bandGains: number[];
  setBandGain: (index: number, gain: number) => void;
  preampGain: number;
  setPreamp: (gain: number) => void;
  activePresetId: string;
  applyPreset: (presetId: string) => void;
  resetEqualizer: () => void;
  getFrequencyData: () => Uint8Array;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  theme,
  bandGains,
  setBandGain,
  preampGain,
  setPreamp,
  activePresetId,
  applyPreset,
  resetEqualizer,
  getFrequencyData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Render live audio visualizer inside the equalizer modal
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = getFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / data.length) * 1.5;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        ctx.fillStyle = theme.accentColor;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, getFrequencyData, theme.accentColor]);

  if (!isOpen) return null;

  const preampPercent = Math.round(preampGain * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-2xl p-6 rounded-2xl border shadow-2xl ${theme.cardClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${theme.accentColor}20` }}
            >
              <SlidersHorizontal className="w-5 h-5" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Audio Equalizer & 200% Boost</h2>
                {preampPercent > 100 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Zap className="w-3 h-3 fill-orange-400" /> VLC BOOST {preampPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                10-Band Biquad Graphic EQ with pre-amp amplification up to 200%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close equalizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time spectrum canvas */}
        <div className="relative mb-5 p-3 rounded-xl bg-black/60 border border-neutral-800">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-neutral-400">
            <span>Real-time Spectrum Analyzer</span>
            <span className="font-mono tabular-nums">Pre-Amp: {preampPercent}%</span>
          </div>
          <canvas
            ref={canvasRef}
            width={580}
            height={60}
            className="w-full h-14 rounded-md"
          />
        </div>

        {/* Pre-Amp slider (VLC 200% Boost) */}
        <div className="mb-6 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-neutral-200">
              <Volume2 className="w-4 h-4 text-orange-400" />
              Pre-Amplification Gain (VLC 200% Volume Boost)
            </span>
            <span
              className={`font-mono text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                preampPercent > 100
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {preampPercent}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={preampGain}
            onChange={(e) => setPreamp(parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            aria-label="Pre-amp Volume Boost slider"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-mono">
            <span>50%</span>
            <span>100% (Standard)</span>
            <span className="text-orange-400 font-semibold">150%</span>
            <span className="text-orange-400 font-bold">200% (VLC Max)</span>
          </div>
        </div>

        {/* 10-Band EQ Sliders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-300">
              10-Band Graphic Frequency Adjustment
            </span>
            <span className="text-[11px] text-neutral-500">Range: -12dB to +12dB</span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            {EQUALIZER_FREQUENCIES.map((freq, idx) => {
              const gain = bandGains[idx] || 0;
              const formattedFreq = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              return (
                <div key={freq} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono tabular-nums text-neutral-400 h-4">
                    {gain > 0 ? `+${gain}` : gain}
                  </span>
                  <div className="relative h-28 flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) => setBandGain(idx, parseFloat(e.target.value))}
                      className="w-24 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center accent-red-500"
                      style={{ accentColor: theme.accentColor }}
                      aria-label={`Gain for ${formattedFreq}Hz band`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{formattedFreq}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Presets and actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-neutral-400 mr-1">Presets:</span>
            {EQUALIZER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                  activePresetId === preset.id
                    ? 'bg-neutral-100 text-neutral-950 border-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetEqualizer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset EQ
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors"
              style={{ backgroundColor: theme.accentColor }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
