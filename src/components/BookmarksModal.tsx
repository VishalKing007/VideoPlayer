import React, { useState } from 'react';
import { Bookmark as BookmarkIcon, Plus, Trash2, ExternalLink, X, Download } from 'lucide-react';
import type { Bookmark, PlayerTheme } from '../types/player.ts';
import { formatTime } from '../utils/playerUtils.ts';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
  currentTime: number;
  bookmarks: Bookmark[];
  onAddBookmark: (time: number, label: string) => void;
  onDeleteBookmark: (id: string) => void;
  onJumpToTime: (time: number) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  theme,
  currentTime,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  onJumpToTime,
}) => {
  const [newLabel, setNewLabel] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim() || `Bookmark at ${formatTime(currentTime)}`;
    onAddBookmark(currentTime, label);
    setNewLabel('');
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `video-bookmarks-${Date.now()}.json`);
    dl.click();
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
              <BookmarkIcon className="w-5 h-5" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Timecode Bookmarks</h2>
              <p className="text-xs text-neutral-400">
                Mark key timestamps, study notes, or favorite moments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close bookmarks modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add current timestamp bookmark form */}
        <form onSubmit={handleAdd} className="mb-5 p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-neutral-800 text-neutral-200">
            {formatTime(currentTime)}
          </span>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Bookmark note or title..."
            className="flex-1 px-3 py-1.5 text-xs bg-neutral-800/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </form>

        {/* Bookmarks List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {bookmarks.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-xl border border-dashed border-neutral-800">
              No bookmarks yet. Play video and click "Add" to save timecodes.
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:bg-neutral-800/50 transition-colors"
              >
                <button
                  onClick={() => {
                    onJumpToTime(bm.time);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 text-left flex-1 truncate group"
                >
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-800 group-hover:bg-neutral-700 text-neutral-200">
                    {formatTime(bm.time)}
                  </span>
                  <span className="text-xs font-medium text-neutral-300 truncate group-hover:text-white">
                    {bm.label}
                  </span>
                  <ExternalLink className="w-3 h-3 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={() => onDeleteBookmark(bm.id)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-800 transition-colors"
                  title="Delete bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-800">
          {bookmarks.length > 0 ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          ) : <div />}
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
