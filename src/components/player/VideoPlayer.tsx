
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Pause,
  Play,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Settings2,
  Timer,
  Maximize,
  Minimize,
  Captions,
  RotateCcw,
  RotateCw,
  X,
  Share2,
  ExternalLink,
  PictureInPicture,
  PictureInPicture2,
  LockKeyhole,
  LockKeyholeOpen,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Expand,
  ArrowUp,
  ArrowDown,
  LayoutList,
  MonitorPlay,
  Maximize2,
  Minus,
  ArrowUpLeft,
  ArrowUpRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import * as SliderPrimitive from "@radix-ui/react-slider";

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | null;

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  onStreamSuccess?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
  forceLiveEdge?: boolean;
  onToggleLiveEdge?: () => void;
  isPip?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
  onPrevChannel?: () => void;
  onNextChannel?: () => void;
  onSelectChannel?: (channel: Channel) => void;
  channelList?: Channel[];
  showChannelStrip?: boolean;
  onToggleChannelStrip?: () => void;
  retryTrigger?: number;
};

export default function VideoPlayer({
  channel,
  onStreamError,
  onStreamSuccess,
  autoSkip,
  isMuted: initialIsMuted,
  forceLiveEdge,
  onToggleLiveEdge,
  isPip,
  onExpand,
  onClose,
  onPrevChannel,
  onNextChannel,
  onSelectChannel,
  channelList = [],
  showChannelStrip = true,
  onToggleChannelStrip,
  retryTrigger = 0,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(!!initialIsMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  // Use refs for dragging/locked so stable window event handlers always see latest values
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const isLockedRef = useRef(false);

  // PIP sizing constants — follows industry standard (YouTube, macOS, Discord)
  const PIP_MIN_WIDTH = 320;
  const PIP_COMPACT_BREAKPOINT = 380; // below this, use ultra-compact layout

  // PIP drag/resize refs (use refs not state so mousemove is never stale)
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [pipWidth, setPipWidth] = useState(() => {
    if (typeof window === 'undefined') return 400;
    // Responsive default: 30% of viewport width, clamped between min and 480
    return Math.max(PIP_MIN_WIDTH, Math.min(480, Math.round(window.innerWidth * 0.3)));
  });

  // Derived compact flag — drives ultra-compact layout at small sizes
  const isPipCompact = isPip && pipWidth < PIP_COMPACT_BREAKPOINT;
  const [isMinimized, setIsMinimized] = useState(false);
  const [resizeDir, setResizeDirection] = useState<ResizeDirection>(null);
  const pipDraggingRef = useRef(false);
  const pipResizeDirRef = useRef<ResizeDirection>(null);
  const interactionStart = useRef({ 
    mouseX: 0, 
    mouseY: 0, 
    startRight: 0, 
    startBottom: 0, 
    startWidth: 0,
    startHeight: 0,
  });

  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [playbackRate, setPlaybackRate] = useState<string>('1');

  const [currentTime, setCurrentTime] = useState('00:00');
  const [totalTime, setTotalTime] = useState('LIVE');
  const [progress, setProgress] = useState(100);
  // Live wall-clock time shown during live streams
  const [liveClockTime, setLiveClockTime] = useState('');
  // Track whether this is a live or VOD stream
  const isLiveRef = useRef(true);

  // Buffered range percentage for secondary progress indicator
  const [bufferedPercent, setBufferedPercent] = useState(0);

  // On-Screen Display (OSD) feedback — e.g. "⏸ Paused", "🔊 75%"
  const [osdText, setOsdText] = useState<string | null>(null);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dedicated Volume OSD next to the icon
  const [showVolumeOsd, setShowVolumeOsd] = useState(false);
  const volumeOsdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerVolumeOsd = useCallback(() => {
    setShowVolumeOsd(true);
    if (volumeOsdTimerRef.current) clearTimeout(volumeOsdTimerRef.current);
    volumeOsdTimerRef.current = setTimeout(() => setShowVolumeOsd(false), 800);
  }, []);

  // Progress bar hover timestamp tooltip
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [hoverPercent, setHoverPercent] = useState(0);

  // Double-tap ripple animation
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Error retry countdown
  const [errorCountdown, setErrorCountdown] = useState<number | null>(null);
  const [internalRetryKey, setInternalRetryKey] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile swipe gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeVolumeRef = useRef<number>(1);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Channel wheel overlay — shows when CH+/CH- is pressed
  const [showChannelWheel, setShowChannelWheel] = useState(false);
  const [wheelDirection, setWheelDirection] = useState<'up' | 'down' | null>(null);
  const channelWheelTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) setShowControls(false);
    }, 5000);
  }, []);

  // OSD feedback — shows a brief message overlay then fades
  const triggerOsd = useCallback((text: string) => {
    setOsdText(text);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => setOsdText(null), 800);
  }, []);

  // Retry the current channel after an error
  const handleRetry = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setErrorCountdown(null);
    setInternalRetryKey(prev => prev + 1);
  }, []);

  // Start auto-skip countdown
  const startErrorCountdown = useCallback(() => {
    setErrorCountdown(3);
    if (countdownRef.current) clearInterval(countdownRef.current);
    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setErrorCountdown(null);
        onStreamError?.();
      } else {
        setErrorCountdown(count);
      }
    }, 1000);
  }, [onStreamError]);

  // Show channel wheel overlay with direction and auto-hide
  const triggerChannelWheel = useCallback((direction: 'up' | 'down') => {
    setShowChannelWheel(true);
    setWheelDirection(direction);
    if (channelWheelTimerRef.current) clearTimeout(channelWheelTimerRef.current);
    channelWheelTimerRef.current = setTimeout(() => {
      setShowChannelWheel(false);
      setWheelDirection(null);
    }, 3000);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
      const fsActive = fsElement === containerRef.current;
      setIsFullscreen(fsActive);

      // When exiting fullscreen while in PIP, clear stale inline styles
      // left by the resize handler so that React's pipStyle can re-apply cleanly.
      if (!fsActive && isPip && containerRef.current) {
        containerRef.current.style.width = '';
        containerRef.current.style.height = '';
        containerRef.current.style.right = '';
        containerRef.current.style.bottom = '';
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isPip]);

  useEffect(() => {
    if (!channel?.url || !containerRef.current) return;

    setError(null);
    setIsLoading(true);
    setCurrentTime('00:00');
    setTotalTime('LIVE');
    setProgress(100);
    isLiveRef.current = true;
    setQualityLevels([]);
    setSelectedQuality('auto');
    setPlaybackRate('1');

    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered w-full h-full object-contain';
    videoElement.setAttribute('playsinline', 'true');

    const playerContainer = videoContainerRef.current;
    if (playerContainer) {
      playerContainer.innerHTML = '';
      playerContainer.appendChild(videoElement);
    }

    const player = videojs(videoElement, {
      autoplay: true,
      controls: false,
      fluid: false,
      fill: true,
      muted: isMuted,
      sources: [{
        src: channel.url,
        type: 'application/x-mpegURL'
      }],
      html5: {
        vhs: {
          overrideNative: false,
          enableLowInitialPlaylist: true,
          fastQualityChangeHtml5: true,
          useBandwidthFromLocalStorage: false
        },
        nativeAudioTracks: true,
        nativeVideoTracks: true
      }
    });

    playerRef.current = player;

    const levels = (player as any).qualityLevels();

    const updateQualityLevels = () => {
      const newLevels: any[] = [];
      for (let i = 0; i < levels.length; i++) {
        newLevels.push({
          index: i,
          label: levels[i].height ? `${levels[i].height}p` : 'Source',
          height: levels[i].height,
          bitrate: levels[i].bitrate
        });
      }
      const uniqueLevels = Array.from(new Map(newLevels.map(l => [l.height, l])).values());
      setQualityLevels(uniqueLevels.sort((a, b) => (b.height || 0) - (a.height || 0)));
    };

    levels.on('addqualitylevel', updateQualityLevels);
    levels.on('removequalitylevel', updateQualityLevels);

    player.on('play', () => {
      setIsPlaying(true);
      resetControlsTimer();
    });
    player.on('pause', () => {
      setIsPlaying(false);
      setShowControls(true);
    });
    player.on('waiting', () => setIsLoading(true));
    player.on('playing', () => {
      setIsLoading(false);
      onStreamSuccess?.();
    });

    player.on('loadedmetadata', () => {
      setIsLoading(false);
      const duration = player.duration();
      if (duration && duration !== Infinity) {
        // VOD stream
        isLiveRef.current = false;
        setTotalTime(formatTime(duration));
      } else {
        // Live stream
        isLiveRef.current = true;
        setTotalTime('LIVE');
        setProgress(100);
      }
      updateQualityLevels();
    });

    player.on('timeupdate', () => {
      // Don't update while user is dragging
      if (isDraggingRef.current) return;

      const isLive = isLiveRef.current;
      const current = player.currentTime() || 0;
      const duration = player.duration() || 0;
      const seekable = player.seekable();

      setCurrentTime(formatTime(current));

      if (!isLive && duration && duration !== Infinity) {
        // VOD: simple percentage
        const prog = (current / duration) * 100;
        setProgress(Math.min(100, Math.max(0, prog)));
        setTotalTime(formatTime(duration));
      } else if (seekable && seekable.length > 0) {
        // Live DVR: show position within the seekable buffer window
        const start = seekable.start(0);
        const end = seekable.end(0);
        const windowDuration = end - start;
        if (windowDuration > 0) {
          const prog = ((current - start) / windowDuration) * 100;
          setProgress(Math.min(100, Math.max(0, prog)));
        } else {
          setProgress(100);
        }
        setTotalTime('LIVE');
      } else {
        // Fallback: live, no DVR info yet
        setProgress(100);
        setTotalTime('LIVE');
      }

      // Calculate buffered range percentage
      const buffered = player.buffered();
      if (buffered && buffered.length > 0) {
        const buffEnd = buffered.end(buffered.length - 1);
        if (!isLive && duration && duration !== Infinity) {
          setBufferedPercent(Math.min(100, (buffEnd / duration) * 100));
        } else if (seekable && seekable.length > 0) {
          const start = seekable.start(0);
          const end = seekable.end(0);
          const windowDuration = end - start;
          if (windowDuration > 0) {
            setBufferedPercent(Math.min(100, ((buffEnd - start) / windowDuration) * 100));
          }
        }
      }
    });

    player.on('volumechange', () => {
      setVolume(player.volume() ?? 1);
      setIsMuted(player.muted() ?? false);
    });

    player.on('error', () => {
      const vjsError = player.error();
      if (vjsError) {
        setError('Failed to load stream. Please try again later.');
        setIsLoading(false);
        if (autoSkip) {
          startErrorCountdown();
        }
      }
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      if (channelWheelTimerRef.current) clearTimeout(channelWheelTimerRef.current);
      if (volumeOsdTimerRef.current) clearTimeout(volumeOsdTimerRef.current);
    };
  }, [channel?.url, autoSkip, onStreamError, resetControlsTimer, startErrorCountdown, retryTrigger, internalRetryKey]);

  useEffect(() => {
    if (!playerRef.current || !forceLiveEdge || isDragging || !isPlaying) return;

    const syncInterval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      // Only sync to live edge for actual live streams, not VOD
      if (!isLiveRef.current) return;

      const seekable = player.seekable();
      if (seekable && seekable.length > 0) {
        const end = seekable.end(0);
        const current = player.currentTime();
        if (end - current > 3) {
          player.currentTime(end);
        }
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [forceLiveEdge, isDragging, isPlaying]);

  // Sync isMuted from parent props without recreating the player
  useEffect(() => {
    if (playerRef.current && initialIsMuted !== undefined) {
      playerRef.current.muted(!!initialIsMuted);
      setIsMuted(!!initialIsMuted);
    }
  }, [initialIsMuted]);

  // Live wall-clock ticker — runs every second when stream is live
  useEffect(() => {
    if (totalTime !== 'LIVE') {
      setLiveClockTime('');
      return;
    }
    const tick = () => {
      const now = new Date();
      setLiveClockTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [totalTime]);

  // Global keyboard shortcuts — active whenever the player has a channel loaded
  useEffect(() => {
    if (!channel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (playerRef.current) {
            if (isPlaying) {
              playerRef.current.pause();
              triggerOsd('⏸  Paused');
            } else {
              playerRef.current.play();
              triggerOsd('▶  Playing');
            }
          }
          resetControlsTimer();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (!isLockedRef.current && playerRef.current) {
            const cur = playerRef.current.currentTime() || 0;
            playerRef.current.currentTime(Math.max(0, cur - 10));
            triggerOsd('⏪  −10s');
          }
          resetControlsTimer();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isLockedRef.current && playerRef.current) {
            const cur = playerRef.current.currentTime() || 0;
            playerRef.current.currentTime(cur + 10);
            triggerOsd('⏩  +10s');
          }
          resetControlsTimer();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!isLockedRef.current) {
            onNextChannel?.();
            triggerOsd('↑  CH+');
            triggerChannelWheel('up');
          }
          resetControlsTimer();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isLockedRef.current) {
            onPrevChannel?.();
            triggerOsd('↓  CH−');
            triggerChannelWheel('down');
          }
          resetControlsTimer();
          break;
        case 'm':
        case 'M':
          if (playerRef.current) {
            const newMuted = !playerRef.current.muted();
            playerRef.current.muted(newMuted);
            setIsMuted(newMuted);
            triggerOsd(newMuted ? '🔇  Muted' : `🔊  Volume ${Math.round((playerRef.current.volume() || 0) * 100)}%`);
          }
          resetControlsTimer();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (containerRef.current) {
            const el = containerRef.current as any;
            const doc = document as any;
            const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement;
            const isMeFullscreen = fsElement === el;

            if (!isMeFullscreen) {
              if (el.requestFullscreen) {
                el.requestFullscreen();
              } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
              }
              triggerOsd('⛶  Fullscreen');
            } else {
              if (doc.exitFullscreen) {
                doc.exitFullscreen();
              } else if (doc.webkitExitFullscreen) {
                doc.webkitExitFullscreen();
              }
              triggerOsd('⊡  Exit Fullscreen');
            }
          }
          resetControlsTimer();
          break;
        case 'Escape':
          if (isFullscreen) {
            const doc = document as any;
            if (doc.exitFullscreen) {
              doc.exitFullscreen();
            } else if (doc.webkitExitFullscreen) {
              doc.webkitExitFullscreen();
            }
          }
          resetControlsTimer();
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [channel, isPlaying, isFullscreen, resetControlsTimer, onNextChannel, onPrevChannel, triggerOsd, triggerChannelWheel]);

  const handleTogglePlay = () => {
    if (isPlaying) playerRef.current?.pause();
    else playerRef.current?.play();
  };

  const handleSkip = (seconds: number) => {
    if (!playerRef.current || isLocked) return;
    if (forceLiveEdge && onToggleLiveEdge) {
      onToggleLiveEdge();
    }
    const currentTimeValue = playerRef.current.currentTime();
    playerRef.current.currentTime(currentTimeValue + seconds);
    resetControlsTimer();
  };

  const handleReplay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (forceLiveEdge && onToggleLiveEdge) {
      onToggleLiveEdge();
    }
    playerRef.current.currentTime(0);
    playerRef.current.play();
    resetControlsTimer();
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    playerRef.current?.muted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    playerRef.current?.volume(val);
    playerRef.current?.muted(val === 0);
  };

  const handleFullScreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!containerRef.current) return;
    const el = containerRef.current as any;
    const doc = document as any;
    const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement;
    const isMeFullscreen = fsElement === el;

    if (!isMeFullscreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  const handleToggleCaptions = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    const tracks = playerRef.current.textTracks();
    const newState = !captionsEnabled;

    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') {
        tracks[i].mode = newState ? 'showing' : 'disabled';
      }
    }
    setCaptionsEnabled(newState);
  };

  const handleQualityChange = (val: string) => {
    setSelectedQuality(val);
    const levels = playerRef.current?.qualityLevels();
    if (!levels) return;

    if (val === 'auto') {
      for (let i = 0; i < levels.length; i++) {
        levels[i].enabled = true;
      }
    } else {
      const index = parseInt(val);
      for (let i = 0; i < levels.length; i++) {
        levels[i].enabled = i === index;
      }
    }
  };

  const handlePlaybackRateChange = (val: string) => {
    setPlaybackRate(val);
    if (playerRef.current) {
      playerRef.current.playbackRate(parseFloat(val));
    }
  };

  const handleTogglePip = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    const video = playerRef.current.el().querySelector('video');
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        if (typeof document.exitPictureInPicture === 'function') {
          await document.exitPictureInPicture();
          setIsPipActive(false);
        }
      } else {
        // Prevent InvalidStateError on mobile when metadata isn't loaded yet
        if (video.readyState === 0) {
          toast({ title: "Please wait", description: "Video is still loading..." });
          return;
        }
        if (typeof video.requestPictureInPicture !== 'function') {
          // Firefox fallback: show stylized toast
          toast({
            duration: 3000,
            className: "bg-[#299fff] border-none text-white !p-0 shadow-2xl relative w-[360px]",
            style: {
              clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)'
            },
            title: (
              <div className="flex flex-col p-4 pl-6 pr-4 justify-center">
                <span className="text-white/90 text-[11px] font-semibold mb-1 tracking-wider uppercase">Firefox Picture-in-Picture</span>
                <span className="text-white text-[14px] font-bold tracking-tight leading-snug flex items-center flex-wrap">
                  Please click the <PictureInPicture className="w-5 h-5 mx-1.5 text-white bg-black/20 p-1 rounded inline-block" /> icon floating on the right side of the video
                </span>
              </div>
            ) as any,
          });
          return;
        }
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (e) {
      console.error("PIP failed", e);
      toast({ title: "PIP Failed", description: "Could not start Picture-in-Picture mode." });
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!channel) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: channel.name,
          text: `Watch ${channel.name} live on GTNPlay!`,
          url: window.location.href,
        });
      } catch (err: any) {
        // Ignore AbortError (user dismissed share sheet) and InvalidStateError (double click)
        if (err.name !== 'AbortError') {
          console.error("Share failed", err);
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Channel link copied to clipboard." });
    }
  };

  const handleOutlink = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (channel?.url) {
      window.open(channel.url, '_blank');
    }
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLocked = !isLocked;
    isLockedRef.current = newLocked;
    setIsLocked(newLocked);
    resetControlsTimer();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const threshold = 300;
    const diff = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    if (isLocked) {
      setShowControls(prev => {
        const next = !prev;
        if (next) resetControlsTimer();
        return next;
      });
      return;
    }

    if (diff < threshold) {
      setShowControls(true);
      resetControlsTimer();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const midPoint = rect.width / 2;

      // Trigger ripple animation
      const side = clickX < midPoint ? 'left' : 'right';
      setDoubleTapSide(side);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => setDoubleTapSide(null), 600);

      if (side === 'left') {
        handleSkip(-10);
      } else {
        handleSkip(10);
      }
    } else {
      setShowControls(true);
      resetControlsTimer();
    }
  };

  const seekToPosition = useCallback((clientX: number) => {
    if (!progressBarRef.current || !playerRef.current || isLockedRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));

    const isLive = isLiveRef.current;
    const duration = playerRef.current.duration();
    const seekable = playerRef.current.seekable();

    if (!isLive && duration && duration !== Infinity) {
      // VOD seeking
      playerRef.current.currentTime(duration * percentage);
      setProgress(percentage * 100);
    } else if (seekable && seekable.length > 0) {
      // Live DVR seeking within the buffer window
      const start = seekable.start(0);
      const end = seekable.end(0);
      const windowDuration = end - start;
      const targetTime = start + (windowDuration * percentage);
      playerRef.current.currentTime(targetTime);
      setProgress(percentage * 100);
    }
  }, []);

  const startDrag = useCallback((clientX: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    if (forceLiveEdge && onToggleLiveEdge) {
      onToggleLiveEdge();
    }
    seekToPosition(clientX);
  }, [forceLiveEdge, onToggleLiveEdge, seekToPosition]);

  // Stable handlers attached to window — use refs, never stale
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) seekToPosition(e.clientX);
    };
    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) seekToPosition(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [seekToPosition]);

  // ─── PIP drag & resize (ref-based, no stale closures) ───────────────────
  const handlePipMouseDown = (e: React.MouseEvent, direction: ResizeDirection = null) => {
    if (!isPip || isMinimized || !containerRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    interactionStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startRight: window.innerWidth - rect.right,
      startBottom: window.innerHeight - rect.bottom,
      startWidth: rect.width,
      startHeight: rect.height,
    };

    if (direction) {
      pipResizeDirRef.current = direction;
      setResizeDirection(direction);
    } else {
      pipDraggingRef.current = true;
    }
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const deltaX = e.clientX - interactionStart.current.mouseX;
      const deltaY = e.clientY - interactionStart.current.mouseY;
      const s = interactionStart.current;

      if (pipDraggingRef.current) {
        const newRight = Math.max(0, Math.min(window.innerWidth - 200, s.startRight - deltaX));
        const newBottom = Math.max(0, Math.min(window.innerHeight - 60, s.startBottom - deltaY));
        containerRef.current.style.right = `${newRight}px`;
        containerRef.current.style.bottom = `${newBottom}px`;
      } else if (pipResizeDirRef.current) {
        const dir = pipResizeDirRef.current;
        const hasE = dir.includes('e');
        const hasW = dir.includes('w');
        const hasS = dir.includes('s');

        let newW = s.startWidth;
        let newR = s.startRight;
        let newB = s.startBottom;

        // Horizontal component: determine new width from deltaX
        if (hasE) {
          // East (right edge): user drags right → width grows, right-offset shrinks
          newW = s.startWidth + deltaX;
        } else if (hasW) {
          // West (left edge): user drags left (neg deltaX) → width grows. Right-offset stays.
          newW = s.startWidth - deltaX;
        } else if (dir === 'n' || dir === 's') {
          // Pure vertical edge: derive width from height change via aspect ratio
          const newH = dir === 's' ? s.startHeight + deltaY : s.startHeight - deltaY;
          newW = newH * (16 / 9);
        }

        // Clamp width
        newW = Math.max(PIP_MIN_WIDTH, Math.min(window.innerWidth * 0.6, newW));
        const newH = newW / (16 / 9);

        // Adjust position: only the DRAGGED edge moves, the opposite edge stays put.
        // East edge moved → right-offset must change so left edge stays fixed
        if (hasE) newR = s.startRight - (newW - s.startWidth);
        // South edge moved → bottom-offset must change so top edge stays fixed
        if (hasS || dir === 's') newB = s.startBottom - (newH - s.startHeight);

        containerRef.current.style.width = `${newW}px`;
        containerRef.current.style.height = `${newH}px`;
        containerRef.current.style.right = `${Math.max(0, newR)}px`;
        containerRef.current.style.bottom = `${Math.max(0, newB)}px`;
      }
    };

    const onUp = () => {
      if (!containerRef.current) return;
      if (pipDraggingRef.current || pipResizeDirRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({ x: window.innerWidth - rect.right, y: window.innerHeight - rect.bottom });
        setPipWidth(rect.width);
      }
      pipDraggingRef.current = false;
      pipResizeDirRef.current = null;
      setResizeDirection(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPip, isMinimized]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].clientX);
  };

  // Progress bar hover timestamp
  const handleProgressHover = (e: React.MouseEvent) => {
    if (!progressBarRef.current || !playerRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    setHoverPercent(percentage * 100);

    const isLive = isLiveRef.current;
    const duration = playerRef.current.duration();
    const seekable = playerRef.current.seekable();

    if (!isLive && duration && duration !== Infinity) {
      setHoverTime(formatTime(duration * percentage));
    } else if (seekable && seekable.length > 0) {
      const start = seekable.start(0);
      const end = seekable.end(0);
      const windowDuration = end - start;
      const offset = windowDuration * percentage;
      // Show as negative offset from live edge (e.g. "-01:23")
      const behindLive = windowDuration - offset;
      setHoverTime(behindLive < 1 ? 'LIVE' : `-${formatTime(behindLive)}`);
    } else {
      setHoverTime(null);
    }
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
  };

  // Mobile swipe gesture — vertical swipe on left half = volume
  const handleSwipeStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    swipeVolumeRef.current = playerRef.current?.volume() ?? 1;
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !playerRef.current || isLocked) return;
    const deltaY = touchStartRef.current.y - e.touches[0].clientY;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    // Only vertical swipes (not horizontal drags)
    if (deltaX > Math.abs(deltaY)) return;
    // Need at least 10px of vertical movement
    if (Math.abs(deltaY) < 10) return;

    // Volume adjustment: 200px of swipe = full volume range
    const volumeDelta = deltaY / 200;
    const newVolume = Math.max(0, Math.min(1, swipeVolumeRef.current + volumeDelta));
    playerRef.current.volume(newVolume);
    playerRef.current.muted(newVolume === 0);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    triggerVolumeOsd();
    resetControlsTimer();
  };

  const handleSwipeEnd = () => {
    touchStartRef.current = null;
  };

  if (!channel) {
    if (isPip) return null;
    return (
      <div className="flex-1 flex items-center justify-center bg-black h-full w-full">
        <div className="flex flex-col items-center gap-6 text-white/30 animate-in fade-in zoom-in duration-1000">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center ring-1 ring-white/10">
            <MonitorPlay className="w-12 h-12 opacity-50" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-headline font-bold tracking-widest uppercase">Select a Channel</p>
            <p className="text-sm opacity-60">Choose a channel from the library to start watching</p>
          </div>
        </div>
      </div>
    );
  }

  // When fullscreen from PIP, use full-size control styling
  const usePipControls = isPip && !isFullscreen;

  // Volume icon helper — 4 progressive waves
  const getVolumeIcon = (vol: number, muted: boolean) => {
    const iconSize = usePipControls ? "w-3 h-3" : "w-4 h-4";
    if (muted || vol === 0) return <VolumeX className={cn("text-red-500", iconSize)} />;
    
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(iconSize)}
      >
        {/* Base speaker cone */}
        <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
        
        {/* Wave 1 (1 - 25%) */}
        {vol > 0 && <path d="M13.12 14.12a3 3 0 0 0 0-4.24" />}
        
        {/* Wave 2 (26 - 50%) */}
        {vol > 0.25 && <path d="M15.24 16.24a6 6 0 0 0 0-8.48" />}
        
        {/* Wave 3 (51 - 75%) */}
        {vol > 0.50 && <path d="M17.36 18.36a9 9 0 0 0 0-12.72" />}
        
        {/* Wave 4 (76 - 100%) */}
        {vol > 0.75 && <path d="M19.49 20.49a12 12 0 0 0 0-16.98" />}
      </svg>
    );
  };

  const pipStyle: React.CSSProperties = usePipControls
    ? {
        position: 'fixed',
        right: `${position.x}px`,
        bottom: `${position.y}px`,
        width: isMinimized ? '220px' : `${pipWidth}px`,
        height: isMinimized ? '48px' : `${pipWidth / (16 / 9)}px`,
        zIndex: 100,
        transition: (pipDraggingRef.current || pipResizeDirRef.current) ? 'none' : 'width 0.2s ease, height 0.2s ease',
      }
    : {};

  return (
    <div
      ref={containerRef}
      style={pipStyle}
      onMouseDown={(e) => handlePipMouseDown(e)}
      onMouseMove={isPip ? undefined : resetControlsTimer}
      onMouseEnter={isPip ? () => setShowControls(true) : undefined}
      onMouseLeave={isPip ? () => setShowControls(false) : undefined}
      onClick={handleContainerClick}
      onTouchStart={handleSwipeStart}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
      onWheel={(e) => {
        // Prevent default to stop page scrolling while hovering video
        // e.preventDefault() cannot be called here if passive, but React onWheel is not passive by default.
        if (isLocked || !containerRef.current) return;

        // Only adjust volume if scrolling on the right half of the player
        const rect = containerRef.current.getBoundingClientRect();
        const isRightHalf = (e.clientX - rect.left) > (rect.width / 2);
        if (!isRightHalf) return;

        const volChange = e.deltaY < 0 ? 0.05 : -0.05;
        const newVol = Math.max(0, Math.min(1, volume + volChange));
        setVolume(newVol);
        playerRef.current?.volume(newVol);
        playerRef.current?.muted(newVol === 0);
        setIsMuted(newVol === 0);
        triggerVolumeOsd();
        resetControlsTimer();
      }}
      className={cn(
        "group relative flex flex-col bg-black text-white select-none overflow-hidden",
        (!isPip || isFullscreen) && "flex-1 w-full h-full transition-all duration-500",
        usePipControls && "rounded-xl shadow-2xl border border-white/20",
        usePipControls && !isMinimized && "cursor-move",
        isFullscreen && "rounded-none border-none",
        !showControls && isPlaying && !isDragging && "cursor-none"
      )}
    >
      {/* ── PIP OVERLAY UI ───────────────────────────────────────────────────────── */}
      {usePipControls && (
        <>
          {/* Resize handles — thin invisible edges */}
          {!isMinimized && (
            <>
              <div onMouseDown={(e) => handlePipMouseDown(e, 'w')}  className="absolute inset-y-0 left-0   w-1.5 cursor-w-resize  z-50" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 'e')}  className="absolute inset-y-0 right-0  w-1.5 cursor-e-resize  z-50" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 'n')}  className="absolute inset-x-0 top-0    h-1.5 cursor-n-resize  z-50" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 's')}  className="absolute inset-x-0 bottom-0 h-1.5 cursor-s-resize  z-50" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 'nw')} className="absolute top-0 left-0   w-3 h-3 cursor-nw-resize z-[51]" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 'ne')} className="absolute top-0 right-0  w-3 h-3 cursor-ne-resize z-[51]" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 'sw')} className="absolute bottom-0 left-0  w-3 h-3 cursor-sw-resize z-[51]" />
              <div onMouseDown={(e) => handlePipMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-[51]" />
            </>
          )}

          {/* Top chrome bar — always visible in PIP */}
          <div
            className="absolute top-0 left-0 right-0 z-40 flex items-center bg-gradient-to-b from-black/80 to-transparent"
            style={{ height: isMinimized ? '48px' : isPipCompact ? '30px' : '36px' }}
          >
            {/* Title and Logo */}
            <div
              className={cn("flex-1 flex items-center h-full cursor-move overflow-hidden", isPipCompact ? "gap-1.5 px-2" : "gap-2 px-2.5")}
              onMouseDown={(e) => handlePipMouseDown(e)}
            >
              {/* Drag grip dots */}
              <svg width="10" height="14" viewBox="0 0 10 14" className="shrink-0 text-white/30" fill="currentColor">
                <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
                <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
                <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
              </svg>
            </div>

            {/* Window control buttons */}
            <div className={cn("flex items-center shrink-0", isPipCompact ? "gap-0 px-1" : "gap-0.5 px-1.5")}>
              {/* Minimize / Restore */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(v => !v); }}
                className={cn("flex items-center justify-center rounded hover:bg-white/15 text-white/60 hover:text-white transition-colors", isPipCompact ? "w-5 h-5" : "w-6 h-6")}
                title={isMinimized ? 'Restore' : 'Minimize'}
              >
                {isMinimized
                  ? <Maximize2 className={cn(isPipCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                  : <Minus className={cn(isPipCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />}
              </button>
              {/* Expand to full player */}
              <button
                onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
                className={cn("flex items-center justify-center rounded hover:bg-white/15 text-white/60 hover:text-white transition-colors", isPipCompact ? "w-5 h-5" : "w-6 h-6")}
                title="Back to App"
              >
                <ArrowUpLeft className={cn(isPipCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
              </button>
              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                className={cn("flex items-center justify-center rounded hover:bg-white/15 text-white/60 hover:text-white transition-colors", isPipCompact ? "w-5 h-5" : "w-6 h-6")}
                title="Close"
              >
                <X className={cn(isPipCompact ? "w-2.5 h-2.5" : "w-3 h-3")} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Channel Strip Overlay — left side vertical strip, controlled by setting */}
      {showChannelStrip && !isMinimized && channelList.length > 0 && channel && (() => {
        const currentIdx = channelList.findIndex(c => c.url === channel.url);
        if (currentIdx === -1) return null;
        const indices: number[] = [];
        const stripCount = isPip ? 2 : 3;
        for (let offset = -stripCount; offset <= stripCount; offset++) {
          // Use proper positive modulo wrap-around
          const wrappedIdx = ((currentIdx + offset) % channelList.length + channelList.length) % channelList.length;
          indices.push(wrappedIdx);
        }
        return (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-40 flex flex-col items-center transition-all duration-500",
              isPip ? "left-2 gap-1" : "left-12 gap-2",
              (showControls || showChannelWheel) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.stopPropagation();
              if (e.deltaY > 0) {
                onPrevChannel?.();
                triggerChannelWheel('down');
              } else if (e.deltaY < 0) {
                onNextChannel?.();
                triggerChannelWheel('up');
              }
            }}
          >
            {indices.map((idx, i) => {
              const ch = channelList[idx];
              if (!ch) return null;
              
              const isCurrent = idx === currentIdx;
              const distFromCenter = Math.abs(i - stripCount);
              return (
                <div
                  key={`${ch.url}-${i}`}
                  onClick={() => {
                    if (!isCurrent) {
                      onSelectChannel?.(ch);
                      triggerChannelWheel(idx > currentIdx ? 'up' : 'down');
                    }
                  }}
                  className={cn(
                    "relative overflow-hidden border-2 transition-all duration-300 flex items-center justify-center cursor-pointer",
                    isPip ? "rounded-lg" : "rounded-2xl",
                    isCurrent
                      ? cn("border-[#299fff] z-10", isPip ? "ring-1 ring-[#299fff]/40 shadow-[0_0_12px_rgba(41,159,255,0.4)]" : "ring-2 ring-[#299fff]/40 shadow-[0_0_24px_rgba(41,159,255,0.5)]")
                      : "border-transparent hover:border-white/20 hover:opacity-80",
                    // PIP-proportional sizes
                    distFromCenter === 0 && (isPip ? "w-[44px] h-[44px]" : "w-[96px] h-[96px]"),
                    distFromCenter === 1 && (isCurrent ? "" : (isPip ? "w-[36px] h-[36px] opacity-60" : "w-[84px] h-[84px] opacity-60")),
                    distFromCenter === 2 && (isPip ? "w-[28px] h-[28px] opacity-35" : "w-[72px] h-[72px] opacity-35"),
                    distFromCenter === 3 && "w-[60px] h-[60px] opacity-15"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0",
                    isCurrent ? "bg-black/30" : "bg-black/60"
                  )} />
                  {ch.tvg.logo ? (
                    <img
                      src={ch.tvg.logo}
                      alt={ch.name}
                      className={cn(
                        "object-contain relative z-10",
                        isPip
                          ? (distFromCenter === 0 ? "w-7 h-7" : "w-5 h-5")
                          : (distFromCenter === 0 ? "w-16 h-16" : distFromCenter === 1 ? "w-13 h-13" : "w-10 h-10")
                      )}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className={cn(
                      "font-bold text-white/60 relative z-10 text-center leading-tight px-1 line-clamp-2",
                      isPip ? "text-[6px]" : (distFromCenter === 0 ? "text-[10px]" : "text-[8px]")
                    )}>{ch.name}</span>
                  )}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#299fff] rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="flex-1 relative bg-black">
        {isLoading && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none gap-4">
            {channel.tvg.logo && (
              <img src={channel.tvg.logo} alt="" className="w-16 h-16 object-contain opacity-60" />
            )}
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{channel.name}</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4 z-30 bg-black">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
              <span className="text-2xl text-red-500">!</span>
            </div>
            <p className="text-white/60 text-sm font-medium">{error}</p>
            <p className="text-white/30 text-xs">{channel.name}</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                className="px-4 py-2 rounded-lg bg-[#299fff] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#299fff]/80 transition-all"
                aria-label="Retry stream"
              >
                Try Again
              </button>
            </div>
            
            {autoSkip && errorCountdown !== null && (
              <div className="absolute top-6 right-12 z-40">
                <div className="relative inline-block">
                  {/* SVG Border Animation */}
                  <style>
                    {`
                      @keyframes shrink-border {
                        from { stroke-dashoffset: 0; }
                        to { stroke-dashoffset: 100; }
                      }
                      .animate-shrink-border {
                        animation: shrink-border 3s linear forwards;
                      }
                    `}
                  </style>
                  <svg className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none z-10 overflow-visible" aria-hidden="true">
                    <rect 
                      x="0" y="0" width="100%" height="100%" rx="14" ry="14"
                      fill="none" 
                      stroke="#299fff" 
                      strokeWidth="3" 
                      pathLength="100"
                      strokeDasharray="100" 
                      className="animate-shrink-border drop-shadow-[0_0_6px_rgba(41,159,255,0.5)]"
                    />
                  </svg>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (countdownRef.current) clearInterval(countdownRef.current);
                      setErrorCountdown(null);
                    }}
                    className="relative z-20 px-5 py-2.5 rounded-lg bg-white/5 border border-transparent text-white/80 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md"
                    aria-label="Cancel auto-skip"
                  >
                    Skipping in {errorCountdown}s — Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALWAYS keep the container mounted so video.js initialization doesn't race with React rendering it */}
        <div ref={videoContainerRef} className={cn("video-container w-full h-full", error ? "hidden" : "block")} />

        {/* OSD Feedback Overlay */}
        {osdText && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-3 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl">
              <span className="text-white text-lg font-bold tracking-wide">{osdText}</span>
            </div>
          </div>
        )}

        {/* Double-tap ripple animation */}
        {doubleTapSide && (
          <div className={cn(
            "absolute top-0 bottom-0 z-25 flex items-center justify-center pointer-events-none",
            doubleTapSide === 'left' ? "left-0 right-1/2" : "left-1/2 right-0"
          )}>
            <div className="w-24 h-24 rounded-full bg-white/10 animate-ping" />
            <div className="absolute flex flex-col items-center gap-1">
              {doubleTapSide === 'left' ? (
                <RotateCcw className="w-8 h-8 text-white/80" />
              ) : (
                <RotateCw className="w-8 h-8 text-white/80" />
              )}
              <span className="text-white/80 text-sm font-bold">10s</span>
            </div>
          </div>
        )}

        <div className={cn(
          "absolute inset-0 z-20",
          isPip ? "transition-none" : "transition-opacity duration-500",
          (showControls || isDragging) && !error ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {/* Semi-transparent background — stays full-size */}
          <div className={cn("absolute inset-0", (showControls || isDragging) && !error && !isLocked && "bg-black/40")} />
          {/* Controls content */}
          <div className="absolute inset-0 flex flex-col">

          <div className={cn("absolute top-0 inset-x-0 flex items-center justify-between z-40 pointer-events-none", usePipControls ? "p-3" : "p-6")}>
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={handleToggleLock}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all flex items-center justify-center shrink-0",
                  isLocked
                    ? "text-red-500 bg-black/40 backdrop-blur-md"
                    : "text-white/60 hover:text-white hover:bg-white/5 bg-black/20 backdrop-blur-sm"
                )}
                title={isLocked ? "Unlock Screen" : "Lock Screen"}
                aria-label={isLocked ? "Unlock screen" : "Lock screen"}
              >
                {isLocked ? <LockKeyhole className="w-4 h-4" /> : <LockKeyholeOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Top-Right Absolute Controls (Close & Volume) */}
          {!isLocked && (
            <div className={cn(
              "absolute z-40 flex flex-col items-center pointer-events-auto transition-all duration-300",
              usePipControls ? (isPipCompact ? "top-8 right-1.5 gap-2" : "top-10 right-2 gap-3") : "top-6 right-6 gap-4",
              showControls ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
            )}>
              {!usePipControls && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                  className="w-8 h-8 rounded-lg text-white/40 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-md transition-all outline-none flex items-center justify-center shrink-0"
                  title="Close"
                  aria-label="Close player"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Volume control — vertical slider below the icon on hover */}
              <div className="relative group/volume flex flex-col items-center">
                {/* Volume icon button — icon changes based on level */}
                <button
                  onClick={handleToggleMute}
                  className={cn(
                    "text-white/40 hover:text-white bg-black/20 hover:bg-white/10 backdrop-blur-md transition-colors outline-none rounded-lg flex items-center justify-center shrink-0 z-10",
                    usePipControls ? (isPipCompact ? "w-6 h-6" : "w-8 h-8") : "w-8 h-8"
                  )}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {getVolumeIcon(volume, isMuted)}
                </button>

                {/* Volume level indicator — appears on hover or when scrolling */}
                <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-1 flex flex-col items-center transition-all duration-300 z-50 pointer-events-none",
                  showVolumeOsd 
                    ? "opacity-100" 
                    : "opacity-0 group-hover/volume:opacity-100"
                )}>
                  <span className={cn(
                    "font-bold text-white tabular-nums bg-black/60 py-0.5 rounded backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center",
                    usePipControls ? "text-[8px] w-[34px]" : "text-[10px] w-[44px]"
                  )}>
                    {isMuted ? 0 : Math.round(volume * 100)}%
                  </span>
                </div>

                {/* Vertical slider bar — appears ONLY on hover */}
                <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-8 flex flex-col items-center transition-all duration-300 z-50",
                  "before:absolute before:content-[''] before:-top-8 before:left-0 before:right-0 before:h-8",
                  "opacity-0 group-hover/volume:opacity-100 pointer-events-none group-hover/volume:pointer-events-auto"
                )}>
                  <div className={cn(
                    "flex flex-col items-center bg-black/60 backdrop-blur-2xl border border-white/5 rounded-full shadow-2xl",
                    usePipControls ? "px-1.5 py-2" : "px-2 py-3"
                  )}>
                    <div className={cn("flex flex-col items-center", usePipControls ? "w-4 h-16" : "w-5 h-20")}>
                      <SliderPrimitive.Root
                        orientation="vertical"
                        min={0}
                        max={100}
                        step={1}
                        value={[isMuted ? 0 : Math.round(volume * 100)]}
                        onValueChange={(val) => {
                          const newVol = val[0] / 100;
                          setVolume(newVol);
                          playerRef.current?.volume(newVol);
                          playerRef.current?.muted(newVol === 0);
                          setIsMuted(newVol === 0);
                        }}
                        className="relative flex w-full h-full touch-none select-none items-center justify-center cursor-pointer"
                      >
                        <SliderPrimitive.Track className="relative w-1 h-full bg-white/20 rounded-full overflow-hidden">
                          <SliderPrimitive.Range className="absolute bottom-0 w-full bg-white rounded-full" />
                        </SliderPrimitive.Track>
                        <SliderPrimitive.Thumb className="block w-2.5 h-2.5 rounded-full bg-white shadow-lg ring-2 ring-white/30 focus-visible:outline-none" />
                      </SliderPrimitive.Root>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right side vertically centered CH+ and CH- */}
          {!isLocked && (
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 z-40 flex flex-col items-center transition-all duration-300",
              usePipControls ? (isPipCompact ? "right-1.5 gap-1.5" : "right-2 gap-2") : "right-6 gap-6",
              showControls ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
            )}>
              {onNextChannel && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNextChannel(); triggerChannelWheel('up'); }}
                  className={cn("flex flex-col items-center group/ch", usePipControls ? "gap-0.5" : "gap-1.5")}
                  title="Next Channel (↑)"
                  aria-label="Next channel"
                >
                  <div className={cn(
                    "rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:bg-white/10",
                    usePipControls ? (isPipCompact ? "w-6 h-6" : "w-8 h-8") : "w-12 h-12"
                  )}>
                    <ArrowUp className={cn("text-white/60 group-hover/ch:text-white transition-colors", usePipControls ? "w-3.5 h-3.5" : "w-6 h-6")} />
                  </div>
                  <span className={cn("font-black text-white/40 uppercase tracking-widest drop-shadow-md", usePipControls ? (isPipCompact ? "text-[6px]" : "text-[7px]") : "text-[10px]")}>CH +</span>
                </button>
              )}
              {onPrevChannel && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPrevChannel(); triggerChannelWheel('down'); }}
                  className={cn("flex flex-col items-center group/ch", usePipControls ? "gap-0.5" : "gap-1.5")}
                  title="Previous Channel (↓)"
                  aria-label="Previous channel"
                >
                  <div className={cn(
                    "rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:bg-white/10",
                    usePipControls ? (isPipCompact ? "w-6 h-6" : "w-8 h-8") : "w-12 h-12"
                  )}>
                    <ArrowDown className={cn("text-white/60 group-hover/ch:text-white transition-colors", usePipControls ? "w-3.5 h-3.5" : "w-6 h-6")} />
                  </div>
                  <span className={cn("font-black text-white/40 uppercase tracking-widest drop-shadow-md", usePipControls ? (isPipCompact ? "text-[6px]" : "text-[7px]") : "text-[10px]")}>CH −</span>
                </button>
              )}
            </div>
          )}



          <div className={cn("mt-auto", usePipControls ? (isPipCompact ? "p-2 space-y-1" : "p-2.5 space-y-1.5") : "p-6 space-y-4")}>
            {/* Channel info row */}
            {!isLocked && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="space-y-0 truncate">
                    <h2 className={cn("font-bold tracking-tight truncate", usePipControls ? (isPipCompact ? "text-[10px]" : "text-xs") : "text-xl")}>{channel.name}</h2>
                    {!usePipControls && (
                      <p className="text-[10px] text-white/40 truncate uppercase tracking-[0.2em] font-black">
                        {channel.group.title || 'General'}
                      </p>
                    )}
                  </div>
                  {/* Time / LIVE badge — aligned right next to the title text */}
                  <div className={cn("flex items-center shrink-0", usePipControls ? "gap-1.5 ml-1" : "gap-3 ml-3")}>
                    {totalTime === 'LIVE' && liveClockTime ? (
                      <div className={cn("font-black tracking-widest tabular-nums text-white/60 flex items-center gap-1", usePipControls ? "text-[8px]" : "text-[10px]")}>
                        {liveClockTime}
                      </div>
                    ) : (
                      <div className={cn("font-black tracking-widest tabular-nums text-white/60", usePipControls ? "text-[8px]" : "text-[10px]")}>
                        {currentTime} <span className="text-white/20 mx-0.5">/</span>
                      </div>
                    )}
                    {totalTime === 'LIVE' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleLiveEdge?.(); }}
                        className={cn(
                          "flex items-center gap-1 rounded-md transition-all duration-300",
                          usePipControls ? "px-1.5 py-0.5" : "px-2 py-0.5",
                          forceLiveEdge
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-white/5 text-white/40 border border-white/5 hover:text-white"
                        )}
                      >
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          forceLiveEdge ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-white/20"
                        )} />
                        <span className={cn("font-black uppercase tracking-widest", usePipControls ? "text-[7px]" : "text-[9px]")}>Live</span>
                      </button>
                    ) : (
                      <div className={cn("font-black tracking-widest tabular-nums text-white/60", usePipControls ? "text-[8px]" : "text-[10px]")}>
                        {totalTime}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar (Interactive DVR Seeking) */}
            {!isLocked && (
              <div
                ref={progressBarRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onMouseMove={handleProgressHover}
                onMouseLeave={handleProgressLeave}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "relative flex items-center group/progress px-1",
                  usePipControls ? "h-6" : "h-10",
                  isDragging ? "cursor-grabbing" : "cursor-pointer"
                )}
                role="slider"
                aria-label="Seek position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                {/* Hover timestamp tooltip */}
                {hoverTime && !isDragging && (
                  <div
                    className="absolute -top-8 z-30 pointer-events-none"
                    style={{ left: `${hoverPercent}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="px-2 py-1 rounded-md bg-black/90 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] font-bold text-white tabular-nums">{hoverTime}</span>
                    </div>
                  </div>
                )}

                {/* Visual line container */}
                <div className={cn("w-full relative bg-white/15 rounded-full transition-all duration-150", usePipControls ? "h-[2px] group-hover/progress:h-[3px]" : "h-[3px] group-hover/progress:h-[5px]")}>
                  {/* Background track */}
                  <div className="absolute inset-0 bg-white/10 rounded-full" />

                  {/* Buffered range bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-white/20 rounded-full transition-[width] duration-300"
                    style={{ width: `${bufferedPercent}%` }}
                  />

                  {/* Played track fill — no transition during drag for instant response */}
                  <div
                    className="absolute inset-y-0 left-0 bg-[#299fff] rounded-full"
                    style={{
                      width: `${progress}%`,
                      transition: isDragging ? 'none' : 'width 100ms'
                    }}
                  />

                  {/* Round thumb — always visible, grows on hover/drag */}
                  <div
                    className={cn(
                      "absolute top-1/2 bg-white rounded-full shadow-[0_0_8px_rgba(41,159,255,0.8)] -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none transition-transform duration-150",
                      usePipControls ? "w-2 h-2" : "w-3 h-3",
                      isDragging ? "scale-125" : "scale-100 group-hover/progress:scale-125"
                    )}
                    style={{ left: `${progress}%` }}
                  />

                  {/* Live edge pulse dot */}
                  {totalTime === 'LIVE' && progress >= 98 && (
                    <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]", usePipControls ? "w-1.5 h-1.5" : "w-2 h-2")} />
                  )}
                </div>
              </div>
            )}

            <div className={cn("flex items-center justify-between relative", usePipControls ? "mt-0.5" : "mt-2")}>
                <div className={cn("flex items-center", usePipControls ? "gap-0" : "gap-1")}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleChannelStrip?.(); }}
                    className={cn(
                      "rounded-lg transition-all duration-300",
                      usePipControls ? "p-1" : "p-2",
                      showChannelStrip ? "text-[#299fff] bg-[#299fff]/10" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                    aria-label="Toggle channel strip"
                    title={showChannelStrip ? "Hide channel strip" : "Show channel strip"}
                  >
                    <LayoutList className={cn(usePipControls ? "w-3 h-3" : "w-4 h-4")} />
                  </button>
                  {!isLocked && !usePipControls && (
                    <>
                      <button onClick={handleShare} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors" aria-label="Share channel">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={handleOutlink} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors" aria-label="Open stream URL">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {!isLocked && (
                  <div className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10", usePipControls ? "gap-2" : "gap-4")}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
                    className={cn(
                      "rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/skip hover:bg-white/10",
                      usePipControls ? (isPipCompact ? "w-6 h-6" : "w-7 h-7") : "w-10 h-10"
                    )}
                    title="Seek back 10s (←)"
                  >
                    <div className="relative flex items-center justify-center">
                      <RotateCcw className={cn("text-white/60 group-hover/skip:text-white transition-colors", usePipControls ? "w-3 h-3" : "w-5 h-5")} />
                      <span className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-white/60 group-hover/skip:text-white leading-none", usePipControls ? "text-[5px]" : "text-[8px]")}>10</span>
                    </div>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
                    className={cn(
                      "rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/play shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/20",
                      usePipControls ? (isPipCompact ? "w-7 h-7" : "w-9 h-9") : "w-12 h-12"
                    )}
                    title="Play / Pause (Space)"
                  >
                    {isPlaying ? (
                      <Pause className={cn("text-white fill-white", usePipControls ? "w-3.5 h-3.5" : "w-5 h-5")} />
                    ) : (
                      <Play className={cn("text-white fill-white ml-0.5", usePipControls ? "w-3.5 h-3.5" : "w-5 h-5")} />
                    )}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleSkip(10); }}
                    className={cn(
                      "rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/skip hover:bg-white/10",
                      usePipControls ? (isPipCompact ? "w-6 h-6" : "w-7 h-7") : "w-10 h-10"
                    )}
                    title="Seek forward 10s (→)"
                  >
                    <div className="relative flex items-center justify-center">
                      <RotateCw className={cn("text-white/60 group-hover/skip:text-white transition-colors", usePipControls ? "w-3 h-3" : "w-5 h-5")} />
                      <span className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-white/60 group-hover/skip:text-white leading-none", usePipControls ? "text-[5px]" : "text-[8px]")}>10</span>
                    </div>
                  </button>
                </div>
                )}

                {!isLocked && (
                <div className={cn("flex items-center", usePipControls ? "gap-0" : "gap-2")}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className={cn("text-white/40 hover:text-white transition-colors outline-none rounded-lg hover:bg-white/5 flex items-center justify-center", usePipControls ? "p-1" : "p-2")} aria-label="Video quality">
                        <Settings2 className={cn(usePipControls ? "w-3 h-3" : "w-4 h-4")} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent container={containerRef.current} align="end" side="top" className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl p-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuRadioGroup value={selectedQuality} onValueChange={handleQualityChange}>
                        <DropdownMenuRadioItem value="auto" className="py-2.5 rounded-xl focus:bg-[#299fff] transition-colors cursor-pointer text-xs font-bold uppercase tracking-widest">
                          Auto
                        </DropdownMenuRadioItem>
                        {qualityLevels.map((level) => (
                          <DropdownMenuRadioItem
                            key={level.index}
                            value={level.index.toString()}
                            className="py-2.5 rounded-xl focus:bg-[#299fff] transition-colors cursor-pointer text-xs font-bold"
                          >
                            {level.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!usePipControls && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-white/40 hover:text-white transition-colors outline-none p-2 rounded-lg hover:bg-white/5 flex items-center justify-center" aria-label="Playback speed">
                          <Timer className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent container={containerRef.current} align="end" side="top" className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl p-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuRadioGroup value={playbackRate} onValueChange={handlePlaybackRateChange}>
                          {['0.5', '0.75', '1', '1.25', '1.5', '2'].map((rate) => (
                            <DropdownMenuRadioItem
                              key={rate}
                              value={rate}
                              className="py-2.5 rounded-xl focus:bg-[#299fff] transition-colors cursor-pointer text-xs font-bold"
                            >
                              {rate === '1' ? '1X' : `${rate}X`}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <button onClick={handleReplay} className={cn("rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all", usePipControls ? "p-1" : "p-2")} aria-label="Reload stream">
                    <RefreshCw className={cn(usePipControls ? "w-3 h-3" : "w-4 h-4")} />
                  </button>

                  {!usePipControls && (
                    <>
                      <button onClick={handleTogglePip} className={cn("p-2 rounded-lg transition-all", isPipActive ? "text-[#299fff] bg-[#299fff]/10" : "text-white/40 hover:text-white hover:bg-white/5")} aria-label="Picture in picture">
                        <PictureInPicture2 className="w-4 h-4" />
                      </button>

                      <button onClick={handleToggleCaptions} className={cn("transition-all duration-300 p-2 rounded-lg", captionsEnabled ? "text-[#299fff] bg-[#299fff]/10" : "text-white/40 hover:text-white hover:bg-white/5")} aria-label="Captions">
                        <Captions className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button onClick={handleFullScreen} className={cn("text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5", usePipControls ? "p-1.5" : "p-2")} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                    {isFullscreen ? <Minimize className={cn(usePipControls ? "w-3 h-3" : "w-4 h-4")} /> : <Maximize className={cn(usePipControls ? "w-3 h-3" : "w-4 h-4")} />}
                  </button>
                </div>
                )}
              </div>
            </div>
        </div>
        </div>{/* close controls scale wrapper */}
      </div>
    </div>
  );
}
