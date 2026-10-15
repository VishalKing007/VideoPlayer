import React, { useRef, useState, useEffect } from 'react';
import {
  FolderOpen,
  Palette,
  SlidersHorizontal,
  Sliders,
  Subtitles as SubtitlesIcon,
  Bookmark as BookmarkIcon,
  ListVideo,
  Keyboard,
  Info,
  Tv,
  Sparkles,
  Zap,
  Play,
  Film,
  Music,
  Share2,
  Check,
  RotateCcw,
} from 'lucide-react';
import type {
  Bookmark,
  MediaItem,
  SubtitleSettings,
  SubtitleTrack,
  ThemeId,
  VideoEffects,
} from './types/player.ts';
import { DEMO_MEDIA_ITEMS } from './utils/playerUtils.ts';
import { PLAYER_THEMES } from './utils/themeData.ts';
import { useWebAudio } from './hooks/useWebAudio.ts';
import { CustomVideoPlayer } from './components/CustomVideoPlayer.tsx';
import { ThemeSelector } from './components/ThemeSelector.tsx';
import { EqualizerModal } from './components/EqualizerModal.tsx';
import { VideoEffectsModal } from './components/VideoEffectsModal.tsx';
import { SubtitlesModal } from './components/SubtitlesModal.tsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { BookmarksModal } from './components/BookmarksModal.tsx';
import { StatsForNerds } from './components/StatsForNerds.tsx';
import { PlaylistDrawer } from './components/PlaylistDrawer.tsx';

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Active theme state
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('omniplayer_theme');
    return (saved as ThemeId) || 'youtube';
  });
  const currentTheme = PLAYER_THEMES[currentThemeId] || PLAYER_THEMES.youtube;

  // Playlist State
  const [playlist, setPlaylist] = useState<MediaItem[]>(DEMO_MEDIA_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTrack = playlist[currentIndex] || playlist[0];

  // Repeat and Shuffle
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState(false);

  // Video Effects state (VLC)
  const [effects, setEffects] = useState<VideoEffects>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    invert: false,
    sepia: 0,
    blur: 0,
    flipH: false,
    flipV: false,
    rotation: 0,
    aspectRatio: 'auto',
  });

  // Subtitles State
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [activeSubtitleTrackId, setActiveSubtitleTrackId] = useState<string | null>(null);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontSize: 'medium',
    fontColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    textShadow: true,
    offsetSeconds: 0,
  });

  // Bookmarks state (saved to localStorage)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('omniplayer_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals visibility
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [isSubtitlesOpen, setIsSubtitlesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Technical stats snapshot
  const [statsSnapshot, setStatsSnapshot] = useState({
    videoResolution: '1920x1080',
    viewportResolution: '1280x720',
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    volume: 1.0,
    preampBoost: 1.0,
    bufferHealth: 0,
    droppedFrames: 0,
    audioCodecs: 'WebAudio Biquad + WebM/MP4',
    themeId: currentTheme.name,
  });

  // Web Audio Hook (Equalizer & 200% Preamp boost)
  const {
    bandGains,
    setBandGain,
    preampGain,
    setPreamp,
    activePresetId,
    applyPreset,
    resetEqualizer,
    ensureAudioPlaying,
    getFrequencyData,
  } = useWebAudio(videoRef);

  // Persist theme changes
  const handleSelectTheme = (id: ThemeId) => {
    setCurrentThemeId(id);
    localStorage.setItem('omniplayer_theme', id);
  };

  // Sync subtitles whenever current track changes
  useEffect(() => {
    if (currentTrack && currentTrack.subtitles) {
      setSubtitleTracks(currentTrack.subtitles);
      // Auto-enable first track if available
      setActiveSubtitleTrackId(currentTrack.subtitles[0]?.id || null);
    } else {
      setSubtitleTracks([]);
      setActiveSubtitleTrackId(null);
    }
  }, [currentTrack]);

  // Handle local video/audio file additions
  const handleAddLocalFiles = (files: FileList) => {
    const newItems: MediaItem[] = Array.from(files).map((file) => {
      const fileUrl = URL.createObjectURL(file);
      const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/i.test(file.name);
      return {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Disk File',
        src: fileUrl,
        type: isAudio ? 'audio' : 'video',
        isLocal: true,
      };
    });

    if (newItems.length > 0) {
      setPlaylist((prev) => [...newItems, ...prev]);
      setCurrentIndex(0); // switch to the newly loaded local item
    }
  };

  // Handle network stream URL addition
  const handleAddUrl = (title: string, url: string) => {
    const newItem: MediaItem = {
      id: `stream-${Date.now()}`,
      title,
      artist: 'Network Stream',
      src: url,
      type: 'video',
      isLocal: false,
    };
    setPlaylist((prev) => [...prev, newItem]);
    setCurrentIndex(playlist.length);
  };

  // Playlist Navigation
  const handleNextTrack = () => {
    if (repeatMode === 'one' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      return;
    }
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * playlist.length);
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const handlePrevTrack = () => {
    if (videoRef.current && videoRef.current.currentTime > 3) {
      videoRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleRemoveTrack = (index: number) => {
    if (playlist.length <= 1) return;
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
    if (currentIndex >= index && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMoveTrack = (from: number, to: number) => {
    setPlaylist((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
    if (currentIndex === from) {
      setCurrentIndex(to);
    }
  };

  // Bookmark management
  const handleAddBookmark = (time: number, label: string) => {
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      time,
      label,
      createdAt: Date.now(),
    };
    const updated = [newBookmark, ...bookmarks];
    setBookmarks(updated);
    localStorage.setItem('omniplayer_bookmarks', JSON.stringify(updated));
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem('omniplayer_bookmarks', JSON.stringify(updated));
  };

  const handleJumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  };

  // Add custom subtitle track
  const handleAddCustomSubtitleTrack = (track: SubtitleTrack) => {
    setSubtitleTracks((prev) => [...prev, track]);
    setActiveSubtitleTrackId(track.id);
  };

  const activeSubtitleTrack =
    subtitleTracks.find((t) => t.id === activeSubtitleTrackId) || null;

  const headerFileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${currentTheme.bgClass}`}>
      {/* Universal Top Bar Contract: 3 Zones */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-neutral-800/80 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Brand Wordmark (Single text element in display face) */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md font-bold text-white text-sm"
            style={{ backgroundColor: currentTheme.accentColor }}
          >
            OP
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            OmniPlayer Studio
          </span>
          <span className="hidden lg:inline text-xs text-neutral-400">
            · VLC & YouTube Hybrid Player
          </span>
        </div>

        {/* Zone 2: Navigation / Quick Tools Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-300">
          <button
            onClick={() => setIsEqualizerOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
            200% Audio Boost & EQ
          </button>
          <button
            onClick={() => setIsEffectsOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            Video Effects
          </button>
          <button
            onClick={() => setIsSubtitlesOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <SubtitlesIcon className="w-3.5 h-3.5 text-emerald-400" />
            Subtitles Sync
          </button>
          <button
            onClick={() => setIsThemeOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            Themes ({currentTheme.name.split(' ')[0]})
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Open Local File) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => headerFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-transform hover:scale-102 shadow-md whitespace-nowrap shrink-0"
            style={{ backgroundColor: currentTheme.accentColor }}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Open Local Media
          </button>
          <input
            ref={headerFileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,.mkv,.mp4,.webm,.ogg,.mp3,.wav"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddLocalFiles(e.target.files);
              }
              if (headerFileInputRef.current) headerFileInputRef.current.value = '';
            }}
            className="hidden"
            aria-label="Upload local media file"
          />
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Core Custom Video Player */}
        <section className="w-full">
          <CustomVideoPlayer
            currentTrack={currentTrack}
            theme={currentTheme}
            effects={effects}
            activeSubtitleTrack={activeSubtitleTrack}
            subtitleSettings={subtitleSettings}
            bookmarks={bookmarks}
            onAddBookmark={handleAddBookmark}
            onOpenPlaylist={() => setIsPlaylistOpen(true)}
            onOpenThemes={() => setIsThemeOpen(true)}
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            onOpenEffects={() => setIsEffectsOpen(true)}
            onOpenSubtitles={() => setIsSubtitlesOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenBookmarks={() => setIsBookmarksOpen(true)}
            onToggleStats={() => setIsStatsOpen((prev) => !prev)}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            videoRef={videoRef}
            onEnsureAudio={ensureAudioPlaying}
            preampGain={preampGain}
            setPreamp={setPreamp}
            onFileDrop={handleAddLocalFiles}
            updateStatsSnapshot={setStatsSnapshot}
          />
        </section>

        {/* Video Info & Hybrid Toolbar Bar */}
        <section className={`p-5 rounded-2xl border backdrop-blur-md transition-colors ${currentTheme.cardClass}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {currentTrack.title}
                </h1>
                {currentTrack.isLocal && (
                  <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                    Local File
                  </span>
                )}
                {preampGain > 1.0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Zap className="w-3 h-3 fill-orange-400" /> VLC BOOST {Math.round(preampGain * 100)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>{currentTrack.artist || 'Media Track'}</span>
                <span aria-hidden="true">·</span>
                <span>Stereo 48kHz</span>
                <span aria-hidden="true">·</span>
                <span>Active Skin: {currentTheme.name}</span>
                {activeSubtitleTrack && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400">Subtitles: {activeSubtitleTrack.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Pills Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setIsEqualizerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="10-Band Graphic Equalizer and 200% Pre-amp volume boost"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
                <span>EQ & Boost</span>
              </button>

              <button
                onClick={() => setIsEffectsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="Color grading, aspect ratio, flip and rotation"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Effects</span>
              </button>

              <button
                onClick={() => setIsSubtitlesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="Load .SRT/.VTT and adjust timing delay"
              >
                <SubtitlesIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subtitles</span>
              </button>

              <button
                onClick={() => setIsBookmarksOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="Timecode Bookmarks"
              >
                <BookmarkIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Bookmarks ({bookmarks.length})</span>
              </button>

              <button
                onClick={() => setIsThemeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="Change Player Skin / Theme"
              >
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Theme</span>
              </button>

              <button
                onClick={() => setIsPlaylistOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="Playlist queue"
              >
                <ListVideo className="w-3.5 h-3.5 text-rose-400" />
                <span>Queue ({playlist.length})</span>
              </button>

              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-700 transition-colors"
                title="Keyboard Shortcuts"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description or Chapters breakdown */}
          <div className="pt-3 text-xs text-neutral-400 leading-relaxed">
            <p className="mb-2">{currentTrack.description || 'Smooth high-fidelity streaming & local playback.'}</p>
            {currentTrack.chapters && currentTrack.chapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-neutral-800/80">
                <span className="text-[11px] font-semibold text-neutral-300">Chapters:</span>
                {currentTrack.chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleJumpToTime(ch.startTime)}
                    className="px-2.5 py-1 text-[11px] rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>{ch.title}</span>
                    <span className="font-mono text-neutral-500">
                      {Math.floor(ch.startTime / 60)}:{(ch.startTime % 60).toString().padStart(2, '0')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Feature Highlights & Demo Media Carousel */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Featured Media & Local File Stash
              </h2>
              <p className="text-xs text-neutral-400">
                Click any clip to load instantly, or drag & drop files from your computer anywhere onto the player
              </p>
            </div>
            <button
              onClick={() => setIsPlaylistOpen(true)}
              className="text-xs font-medium text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View Full Queue ({playlist.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {playlist.slice(0, 4).map((item, idx) => {
              const isPlaying = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`group flex flex-col text-left rounded-xl overflow-hidden border transition-all ${
                    isPlaying
                      ? 'border-neutral-300 bg-neutral-800 ring-2 ring-neutral-400/40 shadow-lg'
                      : 'border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="relative aspect-video w-full bg-neutral-800 overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        {item.type === 'audio' ? (
                          <Music className="w-8 h-8 text-neutral-500" />
                        ) : (
                          <Film className="w-8 h-8 text-neutral-500" />
                        )}
                      </div>
                    )}
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="p-2.5 rounded-full bg-white text-black shadow-lg">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-white truncate mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {item.artist || (item.isLocal ? 'Local Media' : 'Demo Stream')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Feature Grid: VLC & YouTube Hybrid Capabilities */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-white">VLC Supercharged Audio</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Real-time Web Audio API pipeline with 200% volume boost preamp, 10-band Biquad equalizer, and audio spectrum visualizer.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <Tv className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-white">YouTube Experience</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ambient glow back-projection, scrubber hover preview, double-tap seek ripples, theater mode, and YouTube Stats for Nerds.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Local Access & Subtitles</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Drag & drop any video from your hard drive, load external .SRT/.VTT files, and synchronize subtitle timing down to 100 milliseconds.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 py-4 px-6 text-center text-xs text-neutral-500">
        OmniPlayer Studio · VLC & YouTube Hybrid Media Engine · Built for power users
      </footer>

      {/* Interactive Overlays & Modals */}
      <ThemeSelector
        isOpen={isThemeOpen}
        currentTheme={currentThemeId}
        onSelectTheme={handleSelectTheme}
        onClose={() => setIsThemeOpen(false)}
      />

      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        theme={currentTheme}
        bandGains={bandGains}
        setBandGain={setBandGain}
        preampGain={preampGain}
        setPreamp={setPreamp}
        activePresetId={activePresetId}
        applyPreset={applyPreset}
        resetEqualizer={resetEqualizer}
        getFrequencyData={getFrequencyData}
      />

      <VideoEffectsModal
        isOpen={isEffectsOpen}
        onClose={() => setIsEffectsOpen(false)}
        theme={currentTheme}
        effects={effects}
        onChangeEffects={setEffects}
        onResetEffects={() =>
          setEffects({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hueRotate: 0,
            invert: false,
            sepia: 0,
            blur: 0,
            flipH: false,
            flipV: false,
            rotation: 0,
            aspectRatio: 'auto',
          })
        }
      />

      <SubtitlesModal
        isOpen={isSubtitlesOpen}
        onClose={() => setIsSubtitlesOpen(false)}
        theme={currentTheme}
        tracks={subtitleTracks}
        activeTrackId={activeSubtitleTrackId}
        onSelectTrack={setActiveSubtitleTrackId}
        onAddCustomTrack={handleAddCustomSubtitleTrack}
        settings={subtitleSettings}
        onUpdateSettings={setSubtitleSettings}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        theme={currentTheme}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        theme={currentTheme}
        currentTime={videoRef.current?.currentTime || 0}
        bookmarks={bookmarks}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onJumpToTime={handleJumpToTime}
      />

      <PlaylistDrawer
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        theme={currentTheme}
        playlist={playlist}
        currentIndex={currentIndex}
        onSelectTrack={(idx) => {
          setCurrentIndex(idx);
          setIsPlaylistOpen(false);
        }}
        onAddLocalFiles={handleAddLocalFiles}
        onAddUrl={handleAddUrl}
        onRemoveTrack={handleRemoveTrack}
        onMoveTrack={handleMoveTrack}
        repeatMode={repeatMode}
        onToggleRepeat={() => {
          if (repeatMode === 'off') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('off');
        }}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
      />

      {isStatsOpen && (
        <StatsForNerds
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          theme={currentTheme}
          stats={statsSnapshot}
        />
      )}
    </div>
  );
}
