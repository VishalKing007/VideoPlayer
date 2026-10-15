import React, { useRef } from 'react';
import {
  Subtitles,
  Upload,
  Clock,
  Type,
  X,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import type { PlayerTheme, SubtitleSettings, SubtitleTrack } from '../types/player.ts';
import { parseSRT, parseVTT } from '../utils/playerUtils.ts';

interface SubtitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  onAddCustomTrack: (track: SubtitleTrack) => void;
  settings: SubtitleSettings;
  onUpdateSettings: (settings: SubtitleSettings) => void;
}

export const SubtitlesModal: React.FC<SubtitlesModalProps> = ({
  isOpen,
  onClose,
  theme,
  tracks,
  activeTrackId,
  onSelectTrack,
  onAddCustomTrack,
  settings,
  onUpdateSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const isVtt = file.name.endsWith('.vtt');
      const cues = isVtt ? parseVTT(content) : parseSRT(content);

      const newTrack: SubtitleTrack = {
        id: `custom-sub-${Date.now()}`,
        label: file.name.replace(/\.[^/.]+$/, ''),
        language: 'custom',
        cues,
        isCustom: true,
      };

      onAddCustomTrack(newTrack);
      onSelectTrack(newTrack.id);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adjustOffset = (delta: number) => {
    const newOffset = Math.round((settings.offsetSeconds + delta) * 10) / 10;
    onUpdateSettings({
      ...settings,
      offsetSeconds: newOffset,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-lg p-6 rounded-2xl border shadow-2xl ${theme.cardClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${theme.accentColor}20` }}
            >
              <Subtitles className="w-5 h-5" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Subtitles & Captions</h2>
              <p className="text-xs text-neutral-400">
                Track selection, local .srt/.vtt loading & millisecond sync adjustment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close subtitles modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Subtitle Tracks */}
          <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-200">Select Track</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: theme.accentColor }}
              >
                <Upload className="w-3.5 h-3.5" />
                Load Local .SRT / .VTT
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".srt,.vtt,text/plain"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload local subtitle file"
              />
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => onSelectTrack(null)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
                  activeTrackId === null
                    ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                    : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <span>Off (Disabled)</span>
                {activeTrackId === null && <Check className="w-4 h-4" />}
              </button>

              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
                    activeTrackId === track.id
                      ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                      : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{track.label}</span>
                    {track.isCustom && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-700 text-neutral-300">
                        Local
                      </span>
                    )}
                  </div>
                  {activeTrackId === track.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sync Timing Offset (VLC feature) */}
          <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                Subtitle Sync Delay (VLC Sync)
              </span>
              <span className="font-mono text-xs font-semibold tabular-nums text-neutral-300 px-2 py-0.5 rounded bg-neutral-800">
                {settings.offsetSeconds > 0 ? `+${settings.offsetSeconds}s` : `${settings.offsetSeconds}s`}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mb-3">
              Advance or delay subtitles if audio is ahead or behind
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustOffset(-1.0)}
                className="flex-1 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                -1.0s
              </button>
              <button
                onClick={() => adjustOffset(-0.1)}
                className="flex-1 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                -100ms
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, offsetSeconds: 0 })}
                className="px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700"
              >
                Reset
              </button>
              <button
                onClick={() => adjustOffset(0.1)}
                className="flex-1 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                +100ms
              </button>
              <button
                onClick={() => adjustOffset(1.0)}
                className="flex-1 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                +1.0s
              </button>
            </div>
          </div>

          {/* Subtitle Appearance */}
          <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
            <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-neutral-400" />
              Subtitle Styling
            </span>

            {/* Font Size */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">Text Size</span>
              <div className="flex gap-1">
                {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSettings({ ...settings, fontSize: size })}
                    className={`px-2.5 py-1 text-xs rounded border capitalize transition-colors ${
                      settings.fontSize === size
                        ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">Text Color</span>
              <div className="flex gap-2">
                {[
                  { name: 'White', color: '#ffffff' },
                  { name: 'Yellow', color: '#facc15' },
                  { name: 'Cyan', color: '#38bdf8' },
                  { name: 'Green', color: '#4ade80' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => onUpdateSettings({ ...settings, fontColor: c.color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      settings.fontColor === c.color ? 'scale-110 border-white ring-2 ring-white/50' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                    aria-label={`Subtitle color ${c.name}`}
                  />
                ))}
              </div>
            </div>

            {/* Background Style */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300">Background Box</span>
              <div className="flex gap-1">
                {[
                  { label: 'None', val: 'transparent' },
                  { label: 'Dim', val: 'rgba(0,0,0,0.6)' },
                  { label: 'Solid', val: 'rgba(0,0,0,0.95)' },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => onUpdateSettings({ ...settings, backgroundColor: b.val })}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      settings.backgroundColor === b.val
                        ? 'bg-neutral-100 text-neutral-950 border-white font-semibold'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: theme.accentColor }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
