
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Copy, 
  BookOpen, 
  Box,
  AlertCircle,
  Maximize,
  Minimize
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PlayerControlBar } from './PlayerControlBar';

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
  forceLiveEdge,
  onToggleLiveEdge,
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
      }]
    });

    playerRef.current = player;

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    
    player.on('error', () => {
      const vjsError = player.error();
      if (vjsError) {
        setError(`VIDEOJS: "ERROR:" "(CODE:${vjsError.code} ${vjsError.message})" "HLS playlist request error at URL: ${channel.url}"`);
        if (autoSkip) {
          setTimeout(() => onStreamError?.(), 3000);
        }
      }
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [channel?.url, autoSkip, onStreamError]);

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
      className={cn(
        "flex flex-col bg-[#0a0a0a] text-[#e5e7eb] font-mono select-none overflow-hidden transition-all duration-500",
        isPip ? "fixed bottom-6 right-6 w-[450px] rounded-[24px] shadow-2xl border border-white/10 z-[100]" : "flex-1 w-full h-full",
        isFullscreen && "rounded-none border-none"
      )}
    >
      {/* Header Tabs - Replicating the Image Style */}
      <div className="flex items-start w-full px-4 pt-4 shrink-0 z-50">
        {/* Left Tab: Navigation */}
        <div className="flex items-center gap-4 bg-[#121212] px-3 py-2 rounded-t-[12px] border-t border-l border-r border-white/5 relative">
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 text-white/40">
                <ChevronLeft className="h-3 w-3" />
             </Button>
             <span className="text-[10px] font-bold text-white/60 min-w-[30px] text-center">1/1</span>
             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 text-white/40">
                <ChevronRight className="h-3 w-3" />
             </Button>
          </div>
          {/* Connection Line mask effect */}
          <div className="absolute -right-4 bottom-0 w-4 h-[1px] bg-white/5" />
        </div>

        <div className="flex-1 h-[1px] bg-white/5 mt-[39px]" />

        {/* Right Tab: Info & Icons */}
        <div className="flex items-center gap-3 bg-[#121212] px-3 py-2 rounded-t-[12px] border-t border-l border-r border-white/5 relative">
            <div className="flex items-center gap-2 px-2 py-0.5 bg-black/40 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-[#ff4b4b] animate-pulse shadow-[0_0_8px_#ff4b4b]" />
                <span className="text-[9px] font-bold tracking-tight">GTN.PRO <span className="opacity-40 font-normal">(stream)</span> <span className="text-[#ff4b4b]">Live</span></span>
            </div>
            <div className="flex items-center gap-1 text-white/20">
                <Copy className="h-3.5 w-3.5 hover:text-white/60 cursor-pointer transition-colors" />
                <BookOpen className="h-3.5 w-3.5 hover:text-white/60 cursor-pointer transition-colors" />
                <Box className="h-3.5 w-3.5 hover:text-white/60 cursor-pointer transition-colors" />
            </div>
            <div className="absolute -left-4 bottom-0 w-4 h-[1px] bg-white/5" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-[#0a0a0a] border-x border-white/5 mx-4 min-h-0 flex flex-col">
        {error ? (
          <div className="p-8 space-y-6 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#2d1414] text-[#ff4b4b] text-[11px] font-bold border border-[#ff4b4b]/20">
               Console Error
            </div>
            <p className="text-[#ff4b4b] text-sm leading-relaxed max-w-2xl break-all">
              {error}
            </p>
            <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-white/40 text-[11px] font-bold">
                    <span>Call Stack <span className="bg-white/5 px-1.5 py-0.5 rounded ml-2 text-[9px]">20</span></span>
                    <div className="flex items-center gap-2 cursor-pointer hover:text-white/60">
                        <span>Show 20 ignore-listed frame(s)</span>
                        <ChevronRight className="h-3 w-3 rotate-90" />
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="video-container flex-1 overflow-hidden" />
        )}

        {/* Floating Play Overlay for Mobile/Interaction */}
        {!error && !isPlaying && (
           <div 
             onClick={() => playerRef.current?.play()}
             className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer"
           >
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
           </div>
        )}
      </div>

      {/* Control Bar - Bottom Section */}
      <div className="mx-4 mb-4 bg-[#0a0a0a] border-x border-b border-white/5 rounded-b-[24px] overflow-hidden shrink-0">
        <PlayerControlBar 
          player={playerRef.current}
          channelName={channel.name}
          channelLogo={channel.tvg.logo}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTogglePlay={() => {
            if (isPlaying) playerRef.current?.pause();
            else playerRef.current?.play();
          }}
          onToggleMute={() => {
            setIsMuted(!isMuted);
            playerRef.current?.muted(!isMuted);
          }}
          onToggleFullscreen={handleFullScreen}
          isFullscreen={isFullscreen}
          isError={!!error}
        />
      </div>

      {/* Replicating the "Was this helpful?" footer style */}
      {!isPip && (
        <div className="px-8 py-3 flex items-center justify-end gap-6 text-[10px] text-white/20 border-t border-white/5 mx-4 mb-2">
            <span className="hover:text-[#299fff] cursor-pointer transition-colors">Was this helpful?</span>
            <div className="flex items-center gap-4">
                <button className="hover:text-white transition-colors">👍</button>
                <button className="hover:text-white transition-colors">👎</button>
            </div>
        </div>
      )}
    </div>
  );
}
