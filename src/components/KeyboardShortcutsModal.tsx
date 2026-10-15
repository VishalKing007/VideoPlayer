import React from 'react';
import { Keyboard, X } from 'lucide-react';
import type { PlayerTheme } from '../types/player.ts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Playback & Navigation',
      shortcuts: [
        { key: 'Space / K', desc: 'Play / Pause' },
        { key: '← / →', desc: 'Seek 5 seconds backward / forward' },
        { key: 'J / L', desc: 'Seek 10 seconds backward / forward (YouTube style)' },
        { key: '0 ... 9', desc: 'Seek to 0% - 90% of duration' },
        { key: ', (comma) / . (period)', desc: 'Frame-by-frame backward / forward (VLC step)' },
      ],
    },
    {
      title: 'Audio & Volume',
      shortcuts: [
        { key: '↑ / ↓', desc: 'Volume up / down (Boosts up to 200%)' },
        { key: 'M', desc: 'Mute / Unmute audio' },
        { key: 'B', desc: 'Open 10-Band Graphic Equalizer' },
      ],
    },
    {
      title: 'Display & Interface',
      shortcuts: [
        { key: 'F', desc: 'Toggle Fullscreen' },
        { key: 'T', desc: 'Toggle Theater wide mode' },
        { key: 'P', desc: 'Toggle Picture-in-Picture (PiP)' },
        { key: 'C', desc: 'Toggle Subtitles on / off' },
        { key: 'E', desc: 'Open Video Effects & Geometry' },
        { key: 'S', desc: 'Take high-res frame snapshot' },
      ],
    },
    {
      title: 'Pro Controls & Speed',
      shortcuts: [
        { key: '[ / ]', desc: 'Decrease / Increase playback speed by 0.25x' },
        { key: 'A', desc: 'Cycle A-B Repeat Loop (Set A -> Set B -> Clear)' },
        { key: '?', desc: 'Show this keyboard shortcuts guide' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-xl p-6 rounded-2xl border shadow-2xl ${theme.cardClass}`}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${theme.accentColor}20` }}
            >
              <Keyboard className="w-5 h-5" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Keyboard Shortcuts</h2>
              <p className="text-xs text-neutral-400">
                Hybrid VLC & YouTube hotkeys for power playback control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close keyboard shortcuts"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {sections.map((sec) => (
            <div key={sec.title} className="p-3.5 rounded-xl bg-neutral-900/70 border border-neutral-800">
              <h3 className="text-xs font-semibold text-neutral-300 mb-2">{sec.title}</h3>
              <div className="space-y-2">
                {sec.shortcuts.map((sc) => (
                  <div key={sc.key} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">{sc.desc}</span>
                    <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold text-neutral-200 bg-neutral-800 border border-neutral-700 rounded shadow-xs">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: theme.accentColor }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
