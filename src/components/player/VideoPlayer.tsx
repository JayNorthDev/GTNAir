
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  SkipBack, 
  SkipForward, 
  Pause, 
  Play, 
  Plus,
  User
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
  const [currentTime, setCurrentTime] = useState('01:35');
  const [totalTime, setTotalTime] = useState('02:00');
  const [progress, setProgress] = useState(75);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    player.on('loadedmetadata', () => setIsLoading(false));
    
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

  const handleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const PlusIconBox = () => (
    <div className="w-8 h-8 flex items-center justify-center border border-white/20 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
      <Plus className="w-4 h-4 text-white" />
    </div>
  );

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
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
               <span className="text-2xl">!</span>
            </div>
            <p className="text-white/60 text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="video-container w-full h-full" />
        )}

        {/* --- Image-based Overlay UI --- */}
        <div className={cn(
          "absolute inset-0 z-20 flex flex-col p-6 transition-opacity duration-500 bg-black/40",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          
          {/* Top Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100/20 border border-white/10 flex items-center justify-center overflow-hidden">
                {channel.tvg.logo ? (
                  <img src={channel.tvg.logo} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                  <User className="w-6 h-6 text-white/40" />
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold tracking-tight uppercase">{channel.name || 'THIS IS A VIDEO TITLE'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1 py-0.5 text-[8px] font-bold border border-white/40 rounded-sm opacity-60">AD</span>
                  <span className="text-xs font-bold uppercase opacity-60">{channel.group.title || 'SPONSOR NAME'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <PlusIconBox />
              <PlusIconBox />
              <PlusIconBox />
            </div>
          </div>

          {/* Middle Section - Big Controls */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-16 md:gap-24">
              <button className="text-white/80 hover:text-white transition-all transform active:scale-90">
                <SkipBack className="w-12 h-12 fill-current" />
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPlaying) playerRef.current?.pause();
                  else playerRef.current?.play();
                }}
                className="text-white transform transition-all hover:scale-110 active:scale-95"
              >
                {isPlaying ? (
                  <div className="flex gap-2">
                    <div className="w-4 h-16 bg-white rounded-sm" />
                    <div className="w-4 h-16 bg-white rounded-sm" />
                  </div>
                ) : (
                  <Play className="w-20 h-20 fill-current" />
                )}
              </button>

              <button className="text-white/80 hover:text-white transition-all transform active:scale-90">
                <SkipForward className="w-12 h-12 fill-current" />
              </button>
            </div>
          </div>

          {/* Lower Middle - Ad Notice */}
          <div className="flex justify-center mb-6">
            <div className="px-5 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/5 flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">This video will start to play in</span>
              <span className="text-sm font-bold text-green-400">13</span>
            </div>
          </div>

          {/* Bottom Section - Progress & Time */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-tighter opacity-80">{currentTime}</span>
            <div className="flex-1 relative h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold tracking-tighter opacity-80">{totalTime}</span>
            
            <div className="flex items-center gap-3">
              <PlusIconBox />
              <PlusIconBox />
              <PlusIconBox />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
