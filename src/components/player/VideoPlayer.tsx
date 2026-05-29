
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  Subtitles,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
  forceLiveEdge?: boolean;
  onToggleLiveEdge?: () => void;
  isPip?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
};

export default function VideoPlayer({ 
  channel, 
  onStreamError, 
  autoSkip, 
  isMuted: initialIsMuted, 
  isPip, 
  onExpand,
  onClose
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(!!initialIsMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  
  // Real-time functioning states
  const [currentTime, setCurrentTime] = useState('00:00');
  const [totalTime, setTotalTime] = useState('00:00');
  const [progress, setProgress] = useState(0);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      if (isPlaying) setShowControls(false);
    }, 5000);
  }, [isPlaying]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!channel?.url || !containerRef.current) return;

    setError(null);
    setIsLoading(true);
    setCurrentTime('00:00');
    setTotalTime('00:00');
    setProgress(0);

    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered w-full h-full object-contain';
    videoElement.setAttribute('playsinline', 'true');
    
    const playerContainer = containerRef.current.querySelector('.video-container');
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
          overrideNative: true
        }
      }
    });

    playerRef.current = player;

    player.on('play', () => {
      setIsPlaying(true);
      resetControlsTimer();
    });
    player.on('pause', () => {
      setIsPlaying(false);
      setShowControls(true);
    });
    player.on('waiting', () => setIsLoading(true));
    player.on('playing', () => setIsLoading(false));
    player.on('loadedmetadata', () => {
      setIsLoading(false);
      const duration = player.duration();
      if (duration && duration !== Infinity) {
        setTotalTime(formatTime(duration));
      } else {
        setTotalTime('LIVE');
      }
    });

    player.on('timeupdate', () => {
      const current = player.currentTime();
      const duration = player.duration();
      setCurrentTime(formatTime(current));
      
      if (duration && duration !== Infinity) {
        const prog = (current / duration) * 100;
        setProgress(prog);
        setTotalTime(formatTime(duration));
      } else {
        setProgress(100); 
        setTotalTime('LIVE');
      }
    });

    player.on('volumechange', () => {
      setVolume(player.volume());
      setIsMuted(player.muted());
    });
    
    player.on('error', () => {
      const vjsError = player.error();
      if (vjsError) {
        setError(`Failed to load stream. Please try again later.`);
        setIsLoading(false);
        if (autoSkip) {
          setTimeout(() => onStreamError?.(), 3000);
        }
      }
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [channel?.url, autoSkip, onStreamError, resetControlsTimer]);

  const handleTogglePlay = () => {
    if (isPlaying) playerRef.current?.pause();
    else playerRef.current?.play();
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

  const handleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!channel) return null;

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className={cn(
        "group relative flex flex-col bg-black text-white select-none overflow-hidden transition-all duration-500",
        isPip ? "fixed bottom-6 right-6 w-[400px] rounded-xl shadow-2xl border border-white/10 z-[100]" : "flex-1 w-full h-full",
        isFullscreen && "rounded-none border-none"
      )}
    >
      {/* Main Video Container */}
      <div className="flex-1 relative bg-black">
        {isLoading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-[#299fff] animate-spin" />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
               <span className="text-2xl text-red-500">!</span>
            </div>
            <p className="text-white/60 text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="video-container w-full h-full" />
        )}

        {/* --- Cinematic Overlay UI --- */}
        <div className={cn(
          "absolute inset-0 z-20 flex flex-col p-6 transition-opacity duration-500",
          showControls ? "opacity-100 bg-black/40" : "opacity-0 pointer-events-none"
        )}>
          
          {/* Top Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#299fff] flex items-center justify-center shadow-lg shadow-[#299fff]/20">
                <span className="text-xl font-black italic">V</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight">CinemaPro</span>
                <X className="w-4 h-4 text-white/40 cursor-pointer hover:text-white transition-colors" onClick={onClose} />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider">4K UHD</span>
                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider">60 FPS</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] font-bold">
                JD
              </div>
            </div>
          </div>

          {/* Middle Section - Large Center Play Button */}
          <div className="flex-1 flex items-center justify-center">
            {!isPlaying && (
              <button 
                onClick={handleTogglePlay}
                className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/play"
              >
                <Play className="w-10 h-10 fill-white ml-1 text-white group-hover/play:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </button>
            )}
          </div>

          {/* Bottom Section - Metadata & Controls */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{channel.name}</h2>
              <p className="text-sm italic text-white/60">
                Automotive Innovation • {channel.group.title || 'Cinematic Documentary Series'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="relative group/progress cursor-pointer">
              <div className="absolute -top-4 inset-x-0 h-10 z-10" /> {/* Larger hit area */}
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 bg-[#299fff] transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(41,159,255,0.8)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Scrubber Thumb */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform duration-200 z-20"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={handleTogglePlay} className="hover:text-[#299fff] transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <div className="flex items-center gap-4">
                  <button className="text-white/60 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <button className="text-white/60 hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-3 group/volume">
                  <button onClick={handleToggleMute} className="hover:text-[#299fff] transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input 
                    type="range" min="0" max="1" step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#299fff] overflow-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-xs font-medium tracking-widest tabular-nums text-white/80">
                  {currentTime} <span className="text-white/20 mx-1">/</span> {totalTime}
                </div>
                
                <div className="flex items-center gap-6">
                  <button className="text-white/60 hover:text-white transition-colors"><Subtitles className="w-5 h-5" /></button>
                  <button className="text-white/60 hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
                  <button onClick={handleFullScreen} className="text-white/60 hover:text-white transition-colors">
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
