import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  Link as LinkIcon,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  Repeat,
  Repeat1,
  Shuffle,
  X,
  Plus,
  Film,
  Music,
} from 'lucide-react';
import type { MediaItem, PlayerTheme } from '../types/player.ts';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PlayerTheme;
  playlist: MediaItem[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onAddLocalFiles: (files: FileList) => void;
  onAddUrl: (title: string, url: string) => void;
  onRemoveTrack: (index: number) => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  playlist,
  currentIndex,
  onSelectTrack,
  onAddLocalFiles,
  onAddUrl,
  onRemoveTrack,
  onMoveTrack,
  repeatMode,
  onToggleRepeat,
  isShuffle,
  onToggleShuffle,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlTitle, setUrlTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;
    onAddUrl(urlTitle.trim() || 'Network Stream', streamUrl.trim());
    setUrlTitle('');
    setStreamUrl('');
    setShowUrlInput(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddLocalFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 p-4 flex flex-col bg-neutral-900/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Playlist Queue</span>
            <span className="text-xs font-mono text-neutral-400 font-normal">
              ({currentIndex + 1} / {playlist.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-400">Local files, streams & demo queue</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          aria-label="Close playlist"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Bar: Open Local File / Open URL / Shuffle / Repeat */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg border border-neutral-700 transition-colors"
            title="Open local media files"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,.mkv,.mp4,.webm,.ogg,.mp3,.wav"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Open local video files"
          />

          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg border border-neutral-700 transition-colors"
            title="Add network URL or stream"
          >
            <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>URL</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleShuffle}
            className={`p-1.5 rounded-lg border transition-colors ${
              isShuffle
                ? 'bg-neutral-100 text-neutral-950 border-white'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title={isShuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1.5 rounded-lg border transition-colors ${
              repeatMode !== 'off'
                ? 'bg-neutral-100 text-neutral-950 border-white'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
            aria-label={`Toggle repeat (currently ${repeatMode})`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* URL Input Drawer */}
      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="p-3 mb-3 bg-neutral-800/90 rounded-xl border border-neutral-700 space-y-2">
          <div className="text-xs font-semibold text-neutral-200">Add Network Stream URL</div>
          <input
            type="text"
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            placeholder="Title (optional)..."
            className="w-full px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-700 rounded-md text-white placeholder-neutral-500"
          />
          <input
            type="url"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            required
            className="w-full px-2.5 py-1 text-xs bg-neutral-900 border border-neutral-700 rounded-md text-white placeholder-neutral-500"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded-md transition-colors"
              style={{ backgroundColor: theme.accentColor }}
            >
              <Plus className="w-3 h-3" />
              Add Stream
            </button>
          </div>
        </form>
      )}

      {/* Playlist Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {playlist.map((item, idx) => {
          const isPlaying = idx === currentIndex;
          return (
            <div
              key={item.id}
              className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isPlaying
                  ? 'border-neutral-400 bg-neutral-800/90 shadow-md ring-1 ring-neutral-400/30'
                  : 'border-neutral-800/80 bg-neutral-900/60 hover:bg-neutral-800/60 hover:border-neutral-700'
              }`}
            >
              <button
                onClick={() => onSelectTrack(idx)}
                className="flex items-center gap-2.5 text-left flex-1 min-w-0"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'audio' ? (
                    <Music className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <Film className="w-5 h-5 text-neutral-400" />
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isPlaying ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.isLocal && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-700 text-neutral-300 shrink-0">
                        Local
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 block truncate">
                    {item.artist || (item.isLocal ? 'Local File' : 'Stream')}
                  </span>
                </div>
              </button>

              {/* Item reorder & delete actions */}
              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button
                    onClick={() => onMoveTrack(idx, idx - 1)}
                    className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-700/50"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx < playlist.length - 1 && (
                  <button
                    onClick={() => onMoveTrack(idx, idx + 1)}
                    className="p-1 hover:text-white text-neutral-400 rounded hover:bg-neutral-700/50"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {playlist.length > 1 && (
                  <button
                    onClick={() => onRemoveTrack(idx)}
                    className="p-1 hover:text-red-400 text-neutral-500 rounded hover:bg-neutral-700/50"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
