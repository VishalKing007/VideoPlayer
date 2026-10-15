import React from 'react';
import type { PlayerTheme, ThemeId } from '../types/player.ts';
import { PLAYER_THEMES } from '../utils/themeData.ts';
import { Check, Palette, X } from 'lucide-react';

interface ThemeSelectorProps {
  isOpen: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl p-6 bg-neutral-900 border border-neutral-700 text-neutral-100 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">Player Themes</h2>
              <p className="text-xs text-neutral-400">
                Choose your favorite visual skin inspired by VLC, YouTube, and pro studio consoles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close theme selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {(Object.values(PLAYER_THEMES) as PlayerTheme[]).map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-neutral-200 bg-neutral-800 ring-2 ring-neutral-400'
                    : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-sm text-white flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    {theme.name}
                  </span>
                  {isSelected && (
                    <span className="p-0.5 rounded-full bg-white text-black">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {theme.description}
                </p>

                {/* Color preview bar */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-neutral-800/80">
                  <div
                    className="h-2 flex-1 rounded-sm"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <div className="h-2 w-8 rounded-sm bg-neutral-700" />
                  <div className="h-2 w-4 rounded-sm bg-neutral-600" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
