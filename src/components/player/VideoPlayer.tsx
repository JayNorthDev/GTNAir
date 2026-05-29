
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';
import { PlayerControlBar } from './PlayerControlBar';
import { Loader2 } from 'lucide-react';

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
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
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
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
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
      {/* Top Overlay - Channel Info (LDSG Style) */}
      <div className={cn(
        "absolute top-0 inset-x-0 p-6 z-20 transition-opacity duration-500 bg-gradient-to-b from-black/60 to-transparent pointer-events-none",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium tracking-tight text-white/90">{channel.name}</h2>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">LIVE</span>
             </div>
             <span className="text-xs text-white/40 font-medium uppercase tracking-widest">{channel.group.title || "General"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-black">
        {isLoading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
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

        {/* Floating Big Play Overlay */}
        {!error && !isPlaying && !isLoading && (
           <div 
             onClick={() => playerRef.current?.play()}
             className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 cursor-pointer transition-colors hover:bg-black/10"
           >
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2" />
              </div>
           </div>
        )}
      </div>

      {/* Control Bar - LINE LDSG Design */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 z-30 transition-opacity duration-500",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-2">
          <PlayerControlBar 
            player={playerRef.current}
            channelName={channel.name}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onTogglePlay={() => {
              if (isPlaying) playerRef.current?.pause();
              else playerRef.current?.play();
            }}
            onToggleMute={() => {
              const newMute = !isMuted;
              setIsMuted(newMute);
              playerRef.current?.muted(newMute);
            }}
            onToggleFullscreen={handleFullScreen}
            isFullscreen={isFullscreen}
            isError={!!error}
          />
        </div>
      </div>
    </div>
  );
}
