
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay, Maximize2, X, Play, Pause, GripHorizontal, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
  isPip?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
};

export default function VideoPlayer({ 
  channel, 
  onStreamError, 
  autoSkip, 
  isMuted, 
  isPip, 
  onExpand,
  onClose
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: 24, y: 24 }); // Bottom-right offsets
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPip) return;
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isPip) return;
    const deltaX = dragStart.current.mouseX - e.clientX;
    const deltaY = dragStart.current.mouseY - e.clientY;
    
    setPosition({
      x: dragStart.current.startX + deltaX,
      y: dragStart.current.startY + deltaY
    });
  }, [isDragging, isPip]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle Player Initialization (Only on channel change)
  useEffect(() => {
    if (!channel || !containerRef.current) return;

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered w-full h-full object-contain';
    videoElement.setAttribute('playsinline', 'true');
    containerRef.current.appendChild(videoElement);
    videoElementRef.current = videoElement;

    const player = videojs(videoElement, {
      autoplay: true,
      controls: !isPip,
      fluid: true,
      muted: !!isMuted,
      responsive: true,
      sources: [{
        src: channel.url,
        type: 'application/x-mpegURL'
      }]
    });

    playerRef.current = player;
    setIsPlaying(true);

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));

    player.on('error', () => {
      const error = player.error();
      if (error && autoSkip && onStreamError) {
        setTimeout(() => {
          if (playerRef.current === player && !player.isDisposed()) {
            onStreamError();
          }
        }, 2500);
      }
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
        videoElementRef.current = null;
      }
    };
  }, [channel?.url, autoSkip, onStreamError]);

  // Handle Dynamic Updates (Mute/Controls) without re-initializing
  useEffect(() => {
    const player = playerRef.current;
    if (player && !player.isDisposed()) {
      player.muted(!!isMuted);
      player.controls(!isPip);
    }
  }, [isMuted, isPip]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    if (playerRef.current.paused()) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  };

  if (!channel) {
    return isPip ? null : (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 bg-transparent">
        <MonitorPlay className="w-24 h-24 mb-4 text-slate-600" />
        <h2 className="text-2xl font-semibold">Select a channel to start watching</h2>
      </div>
    );
  }

  return (
    <div 
      style={isPip ? { 
        right: `${position.x}px`, 
        bottom: `${position.y}px`,
        width: isMinimized ? '150px' : undefined,
        height: isMinimized ? '40px' : undefined
      } : undefined}
      className={cn(
        "transition-all duration-300 ease-in-out",
        isPip 
          ? "fixed z-[100] rounded-xl shadow-2xl border border-white/20 bg-black overflow-hidden group select-none"
          : "flex-1 flex flex-col bg-black relative w-full h-full",
        isPip && !isMinimized && "w-72 md:w-[480px] aspect-video resize overflow-hidden min-w-[200px] min-h-[120px]",
        isDragging && "opacity-80 scale-[1.02] cursor-grabbing"
      )}
    >
      {/* Drag Handle for PIP */}
      {isPip && !isMinimized && (
        <div 
          onMouseDown={handleMouseDown}
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center"
        >
          <GripHorizontal className="w-8 h-8 text-white/50" />
        </div>
      )}

      {/* PIP Controls Overlay */}
      {isPip && (
        <div className="absolute top-0 left-0 right-0 z-30 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-1 overflow-hidden mr-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
             <span className="text-[10px] font-bold text-white truncate drop-shadow-md uppercase tracking-wider">{channel.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white"
               onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
               title={isMinimized ? "Restore" : "Minimize"}
             >
               <Minus className="w-4 h-4" />
             </Button>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white"
               onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
               title="Back to tab"
             >
               <Maximize2 className="w-4 h-4" />
             </Button>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-7 w-7 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
               onClick={(e) => { e.stopPropagation(); onClose?.(); }}
               title="Close"
             >
               <X className="w-4 h-4" />
             </Button>
          </div>
        </div>
      )}

      {/* Play/Pause for PIP */}
      {isPip && !isMinimized && (
        <button 
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="p-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:scale-110 transition-transform">
            {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white fill-current" />}
          </div>
        </button>
      )}

      <div className={cn("w-full h-full", isMinimized && "hidden")}>
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {isMinimized && (
        <div className="w-full h-full flex items-center justify-center bg-black/90 p-2">
           <span className="text-[10px] text-white/60 truncate font-bold">PIP MINIMIZED</span>
        </div>
      )}
    </div>
  );
}
