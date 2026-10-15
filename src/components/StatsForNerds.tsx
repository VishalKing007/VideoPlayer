import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { PlayerTheme } from '../types/player.ts';

interface StatsForNerdsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
  stats: {
    videoResolution: string;
    viewportResolution: string;
    currentTime: number;
    duration: number;
    playbackRate: number;
    volume: number;
    preampBoost: number;
    bufferHealth: number;
    droppedFrames: number;
    audioCodecs: string;
    themeId: string;
  };
}

export const StatsForNerds: React.FC<StatsForNerdsProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = JSON.stringify(stats, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-4 left-4 z-40 w-80 p-3.5 bg-black/85 backdrop-blur-md text-white font-mono text-[11px] rounded-xl border border-white/10 shadow-2xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="font-bold tracking-wider text-xs text-neutral-200">Stats for Nerds</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:text-white text-neutral-400 transition-colors"
            title="Copy technical stats"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-white text-neutral-400 transition-colors"
            aria-label="Close stats for nerds"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1 text-neutral-300">
        <div className="flex justify-between">
          <span className="text-neutral-400">Resolution:</span>
          <span className="tabular-nums font-semibold">{stats.videoResolution}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Viewport:</span>
          <span className="tabular-nums">{stats.viewportResolution}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Position / Dur:</span>
          <span className="tabular-nums font-semibold">
            {stats.currentTime.toFixed(2)}s / {stats.duration.toFixed(2)}s
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Buffer Ahead:</span>
          <span className="tabular-nums text-emerald-400 font-semibold">{stats.bufferHealth.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Speed Rate:</span>
          <span className="tabular-nums">{stats.playbackRate}x</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Volume Output:</span>
          <span className="tabular-nums">
            {Math.round(stats.volume * 100)}% {stats.preampBoost > 1 ? `(+${Math.round((stats.preampBoost - 1) * 100)}% Boost)` : ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Dropped Frames:</span>
          <span className="tabular-nums">{stats.droppedFrames} / 0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Engine Profile:</span>
          <span className="tabular-nums text-sky-400 font-semibold">{stats.audioCodecs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Active Skin:</span>
          <span className="capitalize">{stats.themeId}</span>
        </div>
      </div>
    </div>
  );
};
