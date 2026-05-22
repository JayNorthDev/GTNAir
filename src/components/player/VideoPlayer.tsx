
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay, Maximize2, X, Play, Pause, Minus, ArrowUpLeft } from 'lucide-react';
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

  // Position and Size state for persistence
  const [position, setPosition] = useState({ x: 24, y: 24 }); // Bottom-right offsets
  const [pipWidth, setPipWidth] = useState(400); // Default PIP width
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const interactionStart = useRef({ 
    mouseX: 0, 
    mouseY: 0, 
    startX: 0, 
    startY: 0, 
    startWidth: 0 
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPip || isMinimized || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const borderThreshold = 15;
    
    // Check if mouse is near the left or top edges for resizing
    const isNearLeft = e.clientX - rect.left < borderThreshold;
    const isNearTop = e.clientY - rect.top < borderThreshold;

    interactionStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
      startWidth: rect.width
    };

    if (isNearLeft || isNearTop) {
      setIsResizing(true);
    } else {
      // Only drag if not clicking buttons
      const target = e.target as HTMLElement;
      if (!target.closest('button')) {
        setIsDragging(true);
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPip || isMinimized || !containerRef.current) return;
    
    if (isDragging) {
      const deltaX = interactionStart.current.mouseX - e.clientX;
      const deltaY = interactionStart.current.mouseY - e.clientY;
      const newX = interactionStart.current.startX + deltaX;
      const newY = interactionStart.current.startY + deltaY;
      
      // Update DOM directly for max performance (no lag)
      containerRef.current.style.right = `${newX}px`;
      containerRef.current.style.bottom = `${newY}px`;
    } else if (isResizing) {
      const deltaX = interactionStart.current.mouseX - e.clientX;
      const deltaY = interactionStart.current.mouseY - e.clientY;
      
      // Since we're anchored to bottom-right, moving mouse left/up increases width/height
      // We prioritize X delta for width and let aspect-ratio handle height
      const newWidth = Math.max(280, interactionStart.current.startWidth + Math.max(deltaX, deltaY));
      
      containerRef.current.style.width = `${newWidth}px`;
    }
  }, [isDragging, isResizing, isPip, isMinimized]);

  const handleMouseUp = useCallback(() => {
    if ((isDragging || isResizing) && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;
      
      // Finalize position in state
      setPosition({
        x: parentWidth - rect.right,
        y: parentHeight - rect.bottom
      });
      setPipWidth(rect.width);
    }
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging, isResizing]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing ? 'nwse-resize' : 'grabbing';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!isPip) {
      setIsMinimized(false);
    }
  }, [isPip]);

  useEffect(() => {
    if (!channel || !containerRef.current) return;

    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered w-full h-full';
    videoElement.setAttribute('playsinline', 'true');
    
    const playerContainer = containerRef.current.querySelector('.video-container');
    if (playerContainer) {
      playerContainer.innerHTML = '';
      playerContainer.appendChild(videoElement);
    }

    const player = videojs(videoElement, {
      autoplay: true,
      controls: !isPip,
      fluid: false, 
      fill: true,   
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
      }
    };
  }, [channel?.url, autoSkip, onStreamError]);

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

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(false);
    onExpand?.();
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
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
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={isPip ? { 
        right: `${position.x}px`, 
        bottom: `${position.y}px`,
        width: isMinimized ? '180px' : `${pipWidth}px`,
        height: isMinimized ? '44px' : 'auto',
        aspectRatio: isMinimized ? 'unset' : '16/9'
      } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-200 ease-out",
        isPip 
          ? "fixed z-[100] rounded-xl shadow-2xl border border-white/20 bg-black overflow-hidden group select-none flex flex-col items-center justify-center cursor-move"
          : "flex-1 flex flex-col bg-black relative w-full h-full",
        isDragging && "opacity-80 scale-[1.01] transition-none",
        isResizing && "transition-none",
        isMinimized && "hover:bg-slate-900"
      )}
    >
      {/* Edge Resize Indicators (Invisible handles) */}
      {isPip && !isMinimized && (
        <>
          <div className="absolute top-0 left-0 w-full h-3 cursor-ns-resize z-50 hover:bg-primary/10" />
          <div className="absolute top-0 left-0 w-3 h-full cursor-ew-resize z-50 hover:bg-primary/10" />
          <div className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-50 hover:bg-primary/20" />
        </>
      )}

      {/* PIP Controls Overlay */}
      {isPip && (
        <div className="absolute top-0 left-0 right-0 z-40 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-1 overflow-hidden mr-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
             <span className="text-[10px] font-bold text-white truncate drop-shadow-md uppercase tracking-wider">{channel.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white"
               onClick={toggleMinimize}
               title={isMinimized ? "Restore" : "Minimize"}
             >
               {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
             </Button>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white"
               onClick={handleExpand}
               title="Back to tab"
             >
               <ArrowUpLeft className="w-4 h-4" />
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

      {/* Central Play/Pause for PIP */}
      {isPip && !isMinimized && (
        <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <button 
            onClick={togglePlay}
            className="p-4 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:scale-110 transition-transform pointer-events-auto"
          >
            {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white fill-current" />}
          </button>
        </div>
      )}

      {/* Video Container */}
      <div className={cn("w-full h-full flex items-center justify-center bg-black video-container", (isPip && isMinimized) && "hidden")}>
        {/* video element injected here via useEffect */}
      </div>

      {(isPip && isMinimized) && (
        <div 
          onClick={handleExpand}
          className="w-full h-full flex items-center justify-center bg-black/90 p-2 cursor-pointer hover:bg-black transition-colors"
        >
           <span className="text-[10px] text-white/60 truncate font-bold uppercase tracking-widest">PIP Minimized</span>
        </div>
      )}
    </div>
  );
}
