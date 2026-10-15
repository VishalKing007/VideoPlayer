import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Repeat,
  RotateCcw,
  SkipForward,
  SkipBack,
  Subtitles,
  Sliders,
  SlidersHorizontal,
  Camera,
  Bookmark,
  ListVideo,
  Tv,
  Check,
  Zap,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Sun,
} from 'lucide-react';
import type {
  ABLoopState,
  Bookmark as BookmarkType,
  MediaItem,
  PlayerTheme,
  SubtitleSettings,
  SubtitleTrack,
  VideoEffects,
} from '../types/player.ts';
import {
  clampPlaybackRate,
  formatTime,
  getCurrentCue,
  getVideoFilterStyle,
  getVideoTransformStyle,
} from '../utils/playerUtils.ts';

interface CustomVideoPlayerProps {
  currentTrack: MediaItem;
  theme: PlayerTheme;
  effects: VideoEffects;
  activeSubtitleTrack: SubtitleTrack | null;
  subtitleSettings: SubtitleSettings;
  bookmarks: BookmarkType[];
  onAddBookmark: (time: number, label: string) => void;
  onOpenPlaylist: () => void;
  onOpenThemes: () => void;
  onOpenEqualizer: () => void;
  onOpenEffects: () => void;
  onOpenSubtitles: () => void;
  onOpenShortcuts: () => void;
  onOpenBookmarks: () => void;
  onToggleStats: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onEnsureAudio: () => void;
  preampGain: number;
  setPreamp: (val: number) => void;
  onFileDrop: (files: FileList) => void;
  updateStatsSnapshot: (data: {
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
  }) => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  currentTrack,
  theme,
  effects,
  activeSubtitleTrack,
  subtitleSettings,
  bookmarks,
  onAddBookmark,
  onOpenPlaylist,
  onOpenThemes,
  onOpenEqualizer,
  onOpenEffects,
  onOpenSubtitles,
  onOpenShortcuts,
  onOpenBookmarks,
  onToggleStats,
  onPrevTrack,
  onNextTrack,
  videoRef,
  onEnsureAudio,
  preampGain,
  setPreamp,
  onFileDrop,
  updateStatsSnapshot,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const ambientCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [timeDisplayMode, setTimeDisplayMode] = useState<'standard' | 'remaining' | 'smpte'>('standard');
  const [ambientGlow, setAmbientGlow] = useState(true);

  // Controls visibility & Hover state
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);

  // Scrubber Hover Preview
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  // A-B Loop State (VLC Feature)
  const [abLoop, setAbLoop] = useState<ABLoopState>({
    enabled: false,
    pointA: null,
    pointB: null,
  });

  // On Screen Display (VLC OSD notification)
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const osdTimerRef = useRef<number | null>(null);

  // Double-tap seek visual feedback (YouTube style ripple)
  const [seekRipple, setSeekRipple] = useState<{ direction: 'left' | 'right'; id: number } | null>(null);

  // Settings menu popover
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Drag over state for dropzone
  const [isDragOver, setIsDragOver] = useState(false);

  const showOSD = useCallback((msg: string) => {
    setOsdMessage(msg);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = window.setTimeout(() => {
      setOsdMessage(null);
    }, 1800);
  }, []);

  // Sync state from video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onEnsureAudio();
    };
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Handle A-B loop boundary
      if (abLoop.enabled && abLoop.pointA !== null && abLoop.pointB !== null) {
        if (video.currentTime >= abLoop.pointB || video.currentTime < abLoop.pointA) {
          video.currentTime = abLoop.pointA;
        }
      }

      // Calculate buffer health
      if (video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) >= video.currentTime) {
            setBufferedEnd(video.buffered.end(i));
            break;
          }
        }
      }

      // Sync stats snapshot periodically
      updateStatsSnapshot({
        videoResolution: `${video.videoWidth || 1920}x${video.videoHeight || 1080}`,
        viewportResolution: `${video.clientWidth}x${video.clientHeight}`,
        currentTime: video.currentTime,
        duration: video.duration || 0,
        playbackRate: video.playbackRate,
        volume: video.volume,
        preampBoost: preampGain,
        bufferHealth: Math.max(0, (video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0) - video.currentTime),
        droppedFrames: (video as unknown as { webkitDroppedFrameCount?: number }).webkitDroppedFrameCount || 0,
        audioCodecs: 'WebAudio Biquad + WebM/MP4',
        themeId: theme.name,
      });
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      video.playbackRate = playbackRate;
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [videoRef, abLoop, playbackRate, onEnsureAudio, preampGain, theme.name, updateStatsSnapshot]);

  // Ambient Glow effect - renders sampled video frame onto background canvas
  useEffect(() => {
    if (!ambientGlow) return;
    let animId: number;

    const sampleAmbient = () => {
      const video = videoRef.current;
      const canvas = ambientCanvasRef.current;
      if (video && canvas && !video.paused && !video.ended) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      animId = requestAnimationFrame(sampleAmbient);
    };

    animId = requestAnimationFrame(sampleAmbient);
    return () => cancelAnimationFrame(animId);
  }, [ambientGlow, videoRef]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
        setShowSettingsMenu(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    onEnsureAudio();
    if (video.paused) {
      video.play().catch(() => {});
      showOSD('Play');
    } else {
      video.pause();
      showOSD('Pause');
    }
  };

  // Frame Stepping (VLC Feature)
  const stepFrame = (direction: 'forward' | 'backward') => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    const frameDuration = 1 / 30; // 30 fps
    const newTime = direction === 'forward' ? video.currentTime + frameDuration : video.currentTime - frameDuration;
    video.currentTime = Math.max(0, Math.min(video.duration, newTime));
    showOSD(`Frame ${direction === 'forward' ? '+1' : '-1'} (${formatTime(video.currentTime, 'smpte')})`);
  };

  // Relative Seek
  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    video.currentTime = newTime;
    showOSD(`${seconds > 0 ? `+${seconds}s` : `${seconds}s`} (${formatTime(newTime)})`);

    // Trigger YouTube-like double-tap ripple
    setSeekRipple({
      direction: seconds > 0 ? 'right' : 'left',
      id: Date.now(),
    });
    setTimeout(() => setSeekRipple(null), 600);
  };

  // Playback Rate
  const changeSpeed = (rate: number) => {
    const video = videoRef.current;
    const clamped = clampPlaybackRate(rate);
    setPlaybackRate(clamped);
    if (video) video.playbackRate = clamped;
    showOSD(`Speed: ${clamped}x`);
  };

  // Volume & Boost
  const handleVolumeSlider = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    onEnsureAudio();

    if (val <= 1.0) {
      // Standard 0% to 100%
      video.volume = val;
      setPreamp(1.0);
      video.muted = false;
      showOSD(`Volume: ${Math.round(val * 100)}%`);
    } else {
      // VLC 200% Boost!
      video.volume = 1.0;
      setPreamp(val);
      video.muted = false;
      showOSD(`⚡ VLC Volume Boost: ${Math.round(val * 100)}%`);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    showOSD(video.muted ? 'Muted' : `Volume: ${Math.round(volume * 100)}%`);
  };

  // A-B Loop Cycle (VLC feature)
  const cycleABLoop = () => {
    if (!abLoop.enabled || abLoop.pointA === null) {
      // Set Point A
      setAbLoop({
        enabled: true,
        pointA: currentTime,
        pointB: null,
      });
      showOSD(`Point A Set: ${formatTime(currentTime)}`);
    } else if (abLoop.pointB === null) {
      // Set Point B
      if (currentTime > abLoop.pointA) {
        setAbLoop({
          enabled: true,
          pointA: abLoop.pointA,
          pointB: currentTime,
        });
        showOSD(`A-B Loop Active: ${formatTime(abLoop.pointA)} - ${formatTime(currentTime)}`);
      } else {
        showOSD('Point B must be after Point A');
      }
    } else {
      // Clear Loop
      setAbLoop({
        enabled: false,
        pointA: null,
        pointB: null,
      });
      showOSD('A-B Loop Cleared');
    }
  };

  // Take Snapshot / Screenshot (VLC Feature)
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Apply video filters to captured screenshot if user altered them
      ctx.filter = getVideoFilterStyle(effects);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      const dlLink = document.createElement('a');
      dlLink.download = `snapshot_${currentTrack.title.replace(/\s+/g, '_')}_${formatTime(video.currentTime).replace(':', '-')}.png`;
      dlLink.href = dataUrl;
      dlLink.click();
      showOSD('📸 Frame Snapshot Saved!');
    } catch {
      showOSD('Snapshot capture failed (CORS protected)');
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showOSD('Exit Picture-in-Picture');
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        showOSD('Picture-in-Picture Active');
      }
    } catch {
      showOSD('Picture-in-Picture unavailable');
    }
  };

  // Scrubber mouse events
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    videoRef.current.currentTime = target;
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleProgressBarMouseLeave = () => {
    setHoverTime(null);
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'l':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          seekRelative(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          seekRelative(5);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeSlider(Math.min(2.0, (preampGain > 1 ? preampGain : volume) + 0.05));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeSlider(Math.max(0, (preampGain > 1 ? preampGain : volume) - 0.05));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          setIsTheater((prev) => !prev);
          break;
        case 'p':
          e.preventDefault();
          togglePiP();
          break;
        case 'c':
          e.preventDefault();
          onOpenSubtitles();
          break;
        case 'b':
          e.preventDefault();
          onOpenEqualizer();
          break;
        case 'e':
          e.preventDefault();
          onOpenEffects();
          break;
        case 's':
          e.preventDefault();
          captureSnapshot();
          break;
        case 'a':
          e.preventDefault();
          cycleABLoop();
          break;
        case ',':
          e.preventDefault();
          stepFrame('backward');
          break;
        case '.':
          e.preventDefault();
          stepFrame('forward');
          break;
        case '[':
          e.preventDefault();
          changeSpeed(playbackRate - 0.25);
          break;
        case ']':
          e.preventDefault();
          changeSpeed(playbackRate + 0.25);
          break;
        case '?':
          e.preventDefault();
          onOpenShortcuts();
          break;
        default:
          if (/^[0-9]$/.test(e.key) && duration > 0 && videoRef.current) {
            e.preventDefault();
            const pct = parseInt(e.key) / 10;
            videoRef.current.currentTime = duration * pct;
            showOSD(`Seek ${pct * 100}%`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, duration, playbackRate, volume, preampGain, isMuted]);

  // Active subtitle cue
  const activeCue = activeSubtitleTrack
    ? getCurrentCue(activeSubtitleTrack.cues, currentTime, subtitleSettings.offsetSeconds)
    : null;

  // Aspect Ratio & Object Fit
  const getAspectRatioClass = () => {
    switch (effects.aspectRatio) {
      case '16:9':
        return 'aspect-video object-contain';
      case '4:3':
        return 'aspect-4/3 object-contain';
      case '21:9':
        return 'aspect-21/9 object-contain';
      case '1:1':
        return 'aspect-square object-contain';
      case 'fill':
        return 'w-full h-full object-cover';
      case 'stretch':
        return 'w-full h-full object-fill';
      default:
        return 'w-full h-full object-contain';
    }
  };

  const currentVolumeValue = preampGain > 1.0 ? preampGain : volume;
  const currentVolumePercent = Math.round(currentVolumeValue * 100);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          onFileDrop(e.dataTransfer.files);
          showOSD(`Loaded ${e.dataTransfer.files.length} file(s)`);
        }
      }}
      className={`relative select-none overflow-hidden rounded-2xl transition-all duration-300 ${
        isTheater ? 'w-full max-w-7xl mx-auto' : 'w-full max-w-5xl mx-auto'
      } ${isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : ''}`}
      style={{
        backgroundColor: '#000000',
        boxShadow: ambientGlow ? `0 20px 60px ${theme.glowColor}` : 'none',
      }}
    >
      {/* Ambient Glow Canvas (YouTube feature) */}
      {ambientGlow && (
        <canvas
          ref={ambientCanvasRef}
          width={32}
          height={18}
          className="absolute inset-0 w-full h-full opacity-40 blur-3xl scale-125 pointer-events-none transition-opacity duration-700"
          aria-hidden="true"
        />
      )}

      {/* Main Video Surface */}
      <div
        className="relative w-full h-full min-h-[360px] md:min-h-[500px] flex items-center justify-center bg-black cursor-pointer overflow-hidden"
        onClick={togglePlay}
        onDoubleClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const isRight = e.clientX - rect.left > rect.width / 2;
          seekRelative(isRight ? 10 : -10);
        }}
      >
        <video
          ref={videoRef}
          src={currentTrack.src}
          playsInline
          className={`transition-all duration-150 ${getAspectRatioClass()}`}
          style={{
            filter: getVideoFilterStyle(effects),
            transform: getVideoTransformStyle(effects),
          }}
        />

        {/* Double-tap ripple seek animation (YouTube feature) */}
        {seekRipple && (
          <div
            className={`absolute inset-y-0 ${
              seekRipple.direction === 'right' ? 'right-0 w-1/3' : 'left-0 w-1/3'
            } bg-white/10 backdrop-blur-xs flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-75 duration-200`}
          >
            <div className="flex flex-col items-center gap-1 text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full">
              {seekRipple.direction === 'right' ? (
                <>
                  <div className="flex">
                    <ChevronRight className="w-5 h-5 -mr-2" />
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  <span>+10s</span>
                </>
              ) : (
                <>
                  <div className="flex">
                    <ChevronLeft className="w-5 h-5" />
                    <ChevronLeft className="w-5 h-5 -ml-2" />
                  </div>
                  <span>-10s</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Drag & drop overlay indicator */}
        {isDragOver && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm border-2 border-dashed border-white/60 flex flex-col items-center justify-center text-white pointer-events-none">
            <Sparkles className="w-12 h-12 mb-2 animate-bounce text-amber-400" />
            <span className="text-base font-bold">Drop video or audio file to play instantly</span>
          </div>
        )}

        {/* Subtitle Cue Render */}
        {activeCue && (
          <div className="absolute bottom-16 inset-x-8 text-center pointer-events-none z-20 flex justify-center">
            <div
              className="inline-block px-4 py-1.5 rounded-lg font-medium leading-relaxed max-w-3xl transition-all"
              style={{
                fontSize:
                  subtitleSettings.fontSize === 'small'
                    ? '14px'
                    : subtitleSettings.fontSize === 'large'
                    ? '24px'
                    : subtitleSettings.fontSize === 'xlarge'
                    ? '30px'
                    : '18px',
                color: subtitleSettings.fontColor,
                backgroundColor: subtitleSettings.backgroundColor,
                textShadow: subtitleSettings.textShadow
                  ? '0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)'
                  : 'none',
              }}
            >
              {activeCue.text}
            </div>
          </div>
        )}

        {/* VLC-Style On-Screen Display (OSD) Notification */}
        {osdMessage && (
          <div className="absolute top-6 right-6 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
            <div className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg shadow-xl ${theme.osdBadgeClass}`}>
              {osdMessage}
            </div>
          </div>
        )}

        {/* Big Center Play/Pause button on pause */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div
              className="p-5 rounded-full backdrop-blur-md shadow-2xl transition-transform transform hover:scale-110"
              style={{ backgroundColor: `${theme.accentColor}dd` }}
            >
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Control Overlay Bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pb-3 pt-8 transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber Timeline */}
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          onMouseMove={handleProgressBarMouseMove}
          onMouseLeave={handleProgressBarMouseLeave}
          className="relative group/timeline w-full h-2.5 flex items-center cursor-pointer mb-3 py-1"
        >
          {/* Timeline Background Bar */}
          <div className="w-full h-1 group-hover/timeline:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all">
            {/* Buffered Bar */}
            <div
              className="h-full bg-white/40 transition-all duration-150"
              style={{ width: `${(bufferedEnd / (duration || 1)) * 100}%` }}
            />
          </div>

          {/* Played Progress Bar */}
          <div
            className="absolute left-0 h-1 group-hover/timeline:h-1.5 rounded-full transition-all pointer-events-none"
            style={{
              width: `${(currentTime / (duration || 1)) * 100}%`,
              backgroundColor: theme.sliderColor,
            }}
          />

          {/* Scrubber Knob / Handle */}
          <div
            className="absolute w-3.5 h-3.5 -ml-1.5 rounded-full bg-white shadow-md scale-0 group-hover/timeline:scale-100 transition-transform pointer-events-none"
            style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
          />

          {/* Chapter Tick Markers */}
          {currentTrack.chapters?.map((ch) => (
            <div
              key={ch.id}
              className="absolute top-0 bottom-0 w-0.5 bg-black/60 pointer-events-none"
              style={{ left: `${(ch.startTime / (duration || 1)) * 100}%` }}
              title={ch.title}
            />
          ))}

          {/* Bookmarks on Timeline */}
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="absolute top-0 bottom-0 w-1 bg-amber-400 rounded-xs pointer-events-none shadow-xs"
              style={{ left: `${(bm.time / (duration || 1)) * 100}%` }}
              title={`Bookmark: ${bm.label}`}
            />
          ))}

          {/* A-B Loop Region indicator on Timeline */}
          {abLoop.enabled && abLoop.pointA !== null && (
            <>
              <div
                className="absolute top-0 bottom-0 w-1 bg-sky-400 rounded-xs pointer-events-none"
                style={{ left: `${(abLoop.pointA / (duration || 1)) * 100}%` }}
                title="Point A"
              />
              {abLoop.pointB !== null && (
                <>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-sky-400 rounded-xs pointer-events-none"
                    style={{ left: `${(abLoop.pointB / (duration || 1)) * 100}%` }}
                    title="Point B"
                  />
                  <div
                    className="absolute top-0.5 bottom-0.5 bg-sky-400/30 rounded-xs pointer-events-none"
                    style={{
                      left: `${(abLoop.pointA / (duration || 1)) * 100}%`,
                      width: `${((abLoop.pointB - abLoop.pointA) / (duration || 1)) * 100}%`,
                    }}
                  />
                </>
              )}
            </>
          )}

          {/* Hover Timecode Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 px-2 py-0.5 rounded bg-black/90 text-white font-mono text-[11px] pointer-events-none -translate-x-1/2 border border-white/20 shadow-lg"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons and Tools Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onPrevTrack}
              className="p-1.5 hover:text-white text-neutral-300 rounded-lg hover:bg-white/10 transition-colors"
              title="Previous Video"
              aria-label="Previous Video"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Frame Step Backward (VLC) */}
            <button
              onClick={() => stepFrame('backward')}
              className="hidden sm:inline-flex p-1.5 hover:text-white text-neutral-300 rounded-lg hover:bg-white/10 transition-colors font-mono text-xs"
              title="Step Frame Backward (VLC)"
              aria-label="Frame backward"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Main Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl text-white transition-transform hover:scale-105"
              style={{ backgroundColor: theme.accentColor }}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            {/* Frame Step Forward (VLC) */}
            <button
              onClick={() => stepFrame('forward')}
              className="hidden sm:inline-flex p-1.5 hover:text-white text-neutral-300 rounded-lg hover:bg-white/10 transition-colors font-mono text-xs"
              title="Step Frame Forward (VLC)"
              aria-label="Frame forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNextTrack}
              className="p-1.5 hover:text-white text-neutral-300 rounded-lg hover:bg-white/10 transition-colors"
              title="Next Video"
              aria-label="Next Video"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume with 200% VLC Boost */}
            <div className="group/volume flex items-center gap-1.5 ml-1">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-white text-neutral-300 rounded-lg hover:bg-white/10 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <div className="w-16 sm:w-20 hidden group-hover/volume:flex items-center">
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.05"
                  value={isMuted ? 0 : currentVolumeValue}
                  onChange={(e) => handleVolumeSlider(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: theme.accentColor }}
                  aria-label="Volume slider with 200% boost"
                />
              </div>

              {/* Volume text badge with VLC Boost indicator */}
              <span
                className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded cursor-pointer ${
                  currentVolumePercent > 100
                    ? 'bg-orange-500/30 text-orange-400 font-bold border border-orange-500/40'
                    : 'text-neutral-400'
                }`}
                title="Click to toggle Equalizer & Boost"
                onClick={onOpenEqualizer}
              >
                {currentVolumePercent > 100 ? (
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-orange-400" />
                    {currentVolumePercent}%
                  </span>
                ) : (
                  `${currentVolumePercent}%`
                )}
              </span>
            </div>

            {/* Elapsed / Total Duration / Remaining / SMPTE timecode */}
            <button
              onClick={() => {
                if (timeDisplayMode === 'standard') setTimeDisplayMode('remaining');
                else if (timeDisplayMode === 'remaining') setTimeDisplayMode('smpte');
                else setTimeDisplayMode('standard');
              }}
              className="ml-2 font-mono text-[11px] text-neutral-300 hover:text-white tabular-nums px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              title="Click to toggle: Standard / Remaining / SMPTE Timecode"
            >
              {timeDisplayMode === 'smpte' ? (
                formatTime(currentTime, 'smpte')
              ) : timeDisplayMode === 'remaining' ? (
                `${formatTime(currentTime)} / ${formatTime(currentTime, 'remaining', duration)}`
              ) : (
                `${formatTime(currentTime)} / ${formatTime(duration)}`
              )}
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* A-B Loop Button (VLC) */}
            <button
              onClick={cycleABLoop}
              className={`hidden sm:inline-flex p-1.5 rounded-lg border transition-colors ${
                abLoop.enabled
                  ? 'bg-sky-500 text-black border-sky-400 font-bold'
                  : 'text-neutral-300 hover:text-white border-transparent hover:bg-white/10'
              }`}
              title={
                !abLoop.enabled
                  ? 'Set A-B Loop (Set Point A)'
                  : abLoop.pointB === null
                  ? 'Set Point B'
                  : 'Clear A-B Loop'
              }
              aria-label="A-B repeat loop"
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Subtitles Button */}
            <button
              onClick={onOpenSubtitles}
              className={`p-1.5 rounded-lg border transition-colors ${
                activeSubtitleTrack
                  ? 'bg-white text-black border-white'
                  : 'text-neutral-300 hover:text-white border-transparent hover:bg-white/10'
              }`}
              title="Subtitles & Closed Captions (C)"
              aria-label="Subtitles"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Audio Equalizer & Boost */}
            <button
              onClick={onOpenEqualizer}
              className="hidden sm:inline-flex p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Audio Equalizer & 200% Pre-amp Boost (B)"
              aria-label="Audio equalizer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Video Effects & Aspect Ratio */}
            <button
              onClick={onOpenEffects}
              className="hidden sm:inline-flex p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Video Effects, Color Adjust & Aspect Ratio (E)"
              aria-label="Video effects"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Snapshot / Camera (VLC) */}
            <button
              onClick={captureSnapshot}
              className="hidden sm:inline-flex p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Capture High-Res Frame Snapshot (S)"
              aria-label="Take snapshot"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Bookmarks */}
            <button
              onClick={onOpenBookmarks}
              className="hidden sm:inline-flex p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Timecode Bookmarks"
              aria-label="Bookmarks"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Playlist Queue */}
            <button
              onClick={onOpenPlaylist}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Playlist Queue & Local Files"
              aria-label="Playlist"
            >
              <ListVideo className="w-4 h-4" />
            </button>

            {/* Speed Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Settings & Themes"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Quick Settings Popover */}
              {showSettingsMenu && (
                <div className="absolute bottom-10 right-0 w-52 p-2 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl text-neutral-200 shadow-2xl z-40 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                    Quick Player Settings
                  </div>

                  {/* Themes */}
                  <button
                    onClick={() => {
                      onOpenThemes();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-800 text-left transition-colors"
                  >
                    <span>Skin Theme</span>
                    <span className="text-[11px] font-medium text-neutral-400 capitalize flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                      {theme.name.split(' ')[0]}
                    </span>
                  </button>

                  {/* Playback Speed selector */}
                  <div className="px-2.5 py-1 text-xs">
                    <div className="text-[11px] text-neutral-400 mb-1">Playback Speed: {playbackRate}x</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changeSpeed(rate)}
                          className={`py-0.5 rounded text-[10px] font-mono border ${
                            playbackRate === rate
                              ? 'bg-white text-black font-bold border-white'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ambient Glow Toggle (YouTube) */}
                  <button
                    onClick={() => setAmbientGlow(!ambientGlow)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-800 text-left transition-colors"
                  >
                    <span>Ambient Glow</span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {ambientGlow ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Stats for nerds toggle */}
                  <button
                    onClick={() => {
                      onToggleStats();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-800 text-left transition-colors"
                  >
                    <span>Stats for Nerds</span>
                    <Info className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  {/* Keyboard Shortcuts */}
                  <button
                    onClick={() => {
                      onOpenShortcuts();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-800 text-left transition-colors"
                  >
                    <span>Keyboard Hotkeys</span>
                    <span className="font-mono text-[10px] px-1 bg-neutral-800 rounded">?</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheater(!isTheater)}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors hidden sm:inline-flex"
              title="Theater Mode (T)"
              aria-label="Theater mode"
            >
              <Tv className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Fullscreen (F)"
              aria-label="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
