
"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { 
  MonitorPlay, 
  Maximize2, 
  X, 
  Play, 
  Pause, 
  Minus, 
  ArrowUpLeft, 
  Maximize, 
  Minimize
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | null;

export default function VideoPlayer({ 
  channel, 
  onStreamError, 
  autoSkip, 
  isMuted, 
  forceLiveEdge,
  onToggleLiveEdge,
  isPip, 
  onExpand,
  onClose
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(true);

  const onStreamErrorRef = useRef(onStreamError);
  const autoSkipRef = useRef(autoSkip);
  const forceLiveEdgeRef = useRef(forceLiveEdge);

  useEffect(() => {
    onStreamErrorRef.current = onStreamError;
  }, [onStreamError]);

  useEffect(() => {
    autoSkipRef.current = autoSkip;
  }, [autoSkip]);

  useEffect(() => {
    forceLiveEdgeRef.current = forceLiveEdge;
  }, [forceLiveEdge]);

  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [pipWidth, setPipWidth] = useState(400);
  
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDirection] = useState<ResizeDirection>(null);
  
  const interactionStart = useRef({ 
    mouseX: 0, 
    mouseY: 0, 
    startX: 0, 
    startY: 0, 
    startWidth: 0,
    hasMoved: false
  });

  const handleMouseMoveActive = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
      if (isFs) setShowControls(true);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection = null) => {
    if (!isPip || isMinimized || isFullscreen || !containerRef.current) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    interactionStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
      startWidth: rect.width,
      hasMoved: false
    };

    if (direction) {
      setResizeDirection(direction);
    } else {
      setIsDragging(true);
    }
    
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPip || isMinimized || isFullscreen || !containerRef.current) return;
    
    if (!interactionStart.current.hasMoved) {
      if (Math.abs(e.clientX - interactionStart.current.mouseX) > 5 || 
          Math.abs(e.clientY - interactionStart.current.mouseY) > 5) {
        interactionStart.current.hasMoved = true;
      }
    }

    if (!interactionStart.current.hasMoved) return;

    const deltaX = e.clientX - interactionStart.current.mouseX;
    const deltaY = e.clientY - interactionStart.current.mouseY;

    if (isDragging) {
      const newX = interactionStart.current.startX - deltaX;
      const newY = interactionStart.current.startY - deltaY;
      
      containerRef.current.style.right = `${newX}px`;
      containerRef.current.style.bottom = `${newY}px`;
    } else if (resizeDir) {
      let finalWidth = interactionStart.current.startWidth;
      const startWidth = interactionStart.current.startWidth;
      const startHeight = startWidth / (16/9);

      if (resizeDir.includes('e')) {
        finalWidth = startWidth + deltaX;
      } else if (resizeDir.includes('w')) {
        finalWidth = startWidth - deltaX;
      }

      if (resizeDir.includes('n')) {
        const widthFromY = (startHeight - deltaY) * (16/9);
        if (resizeDir.length > 1) {
          if (Math.abs(widthFromY - startWidth) > Math.abs(finalWidth - startWidth)) {
            finalWidth = widthFromY;
          }
        } else {
          finalWidth = widthFromY;
        }
      } else if (resizeDir.includes('s')) {
        const widthFromY = (startHeight + deltaY) * (16/9);
        if (resizeDir.length > 1) {
          if (Math.abs(widthFromY - startWidth) > Math.abs(finalWidth - startWidth)) {
            finalWidth = widthFromY;
          }
        } else {
          finalWidth = widthFromY;
        }
      }

      finalWidth = Math.max(280, finalWidth);

      if (resizeDir.includes('e')) {
        const widthDiff = finalWidth - startWidth;
        containerRef.current.style.right = `${interactionStart.current.startX - widthDiff}px`;
      }
      if (resizeDir.includes('s')) {
        const heightDiff = (finalWidth / (16/9)) - startHeight;
        containerRef.current.style.bottom = `${interactionStart.current.startY - heightDiff}px`;
      }

      containerRef.current.style.width = `${finalWidth}px`;
      containerRef.current.style.height = `${finalWidth / (16/9)}px`;
    }
  }, [isDragging, resizeDir, isPip, isMinimized, isFullscreen]);

  const handleMouseUp = useCallback(() => {
    if (interactionStart.current.hasMoved && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;
      
      setPosition({
        x: parentWidth - rect.right,
        y: parentHeight - rect.bottom
      });
      setPipWidth(rect.width);
    }
    setIsDragging(false);
    setResizeDirection(null);
    interactionStart.current.hasMoved = false;
  }, []);

  useEffect(() => {
    if (isDragging || resizeDir) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDir, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!channel?.url || !containerRef.current) return;

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

    player.on('timeupdate', () => {
      if (player.liveTracker) {
        setIsAtLiveEdge(player.liveTracker.atLiveEdge());
      }
    });

    player.on('waiting', () => {
      if (forceLiveEdgeRef.current && player.liveTracker && !player.liveTracker.atLiveEdge()) {
        const liveWindow = player.liveTracker.liveWindow();
        const currentTime = player.currentTime();
        if (liveWindow - currentTime > 2) {
          player.liveTracker.seekToLiveEdge();
        }
      }
    });

    const syncInterval = setInterval(() => {
      if (forceLiveEdgeRef.current && player.liveTracker && !player.liveTracker.atLiveEdge() && !player.paused()) {
        const liveWindow = player.liveTracker.liveWindow();
        const currentTime = player.currentTime();
        if (liveWindow - currentTime > 2) {
          player.liveTracker.seekToLiveEdge();
        }
      }
    }, 5000);

    player.on('error', () => {
      if (!player.isDisposed()) {
        const error = player.error();
        if (error && autoSkipRef.current && onStreamErrorRef.current) {
          setTimeout(() => {
            if (playerRef.current === player && !player.isDisposed()) {
              onStreamErrorRef.current?.();
            }
          }, 2500);
        }
      }
    });

    return () => {
      clearInterval(syncInterval);
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [channel?.url]);

  useEffect(() => {
    const player = playerRef.current;
    if (player && !player.isDisposed()) {
      player.muted(!!isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    if (!isPip) setIsMinimized(false);
  }, [isPip]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    if (player.paused()) {
      player.play();
    } else {
      player.pause();
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

  const handleLiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLiveEdge?.();
    const player = playerRef.current;
    if (player && player.liveTracker) {
      player.liveTracker.seekToLiveEdge();
    }
  };

  const handleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = document as any;
    const el = containerRef.current as any;
    
    if (el) {
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      } else {
        if (doc.exitFullscreen) doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
        else if (doc.msExitFullscreen) doc.msExitFullscreen();
      }
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

  const pipStyle: React.CSSProperties = isFullscreen ? {
    width: '100vw',
    height: '100vh',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    zIndex: 9999,
    position: 'fixed',
    transition: 'none'
  } : isPip ? { 
    right: `${position.x}px`, 
    bottom: `${position.y}px`,
    width: isMinimized ? '180px' : `${pipWidth}px`,
    height: isMinimized ? '44px' : `${pipWidth / (16/9)}px`,
    position: 'fixed',
    transition: (isDragging || resizeDir) ? 'none' : 'all 0.3s ease-in-out'
  } : {
    position: 'relative',
    transition: 'all 0.3s ease-in-out'
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMoveActive}
      onMouseLeave={handleMouseLeave}
      style={pipStyle}
      className={cn(
        "bg-black overflow-hidden group select-none flex flex-col items-center justify-center",
        (isPip || isFullscreen) && "z-[100] rounded-xl shadow-2xl border border-white/20",
        !isPip && !isFullscreen && "flex-1 w-full h-full border-none rounded-none",
        isMinimized && "hover:bg-slate-900",
        isFullscreen && "border-none rounded-none",
        isPip && !isMinimized && !isFullscreen && "cursor-move"
      )}
    >
      {isPip && !isMinimized && !isFullscreen && (
        <>
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'n'); }} className="absolute top-0 left-0 w-full h-2 cursor-ns-resize z-50" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 's'); }} className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-50" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'w'); }} className="absolute top-0 left-0 w-2 h-full cursor-ew-resize z-50" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'e'); }} className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-50" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'nw'); }} className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-[60]" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'ne'); }} className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize z-[60]" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'sw'); }} className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-[60]" />
          <div onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'se'); }} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-[60]" />
        </>
      )}

      {(isPip || isFullscreen) && (
        <div className={cn(
          "absolute top-0 left-0 right-0 z-40 p-2 flex items-center justify-between transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent pointer-events-none",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          <div className="flex items-center gap-2 overflow-hidden mr-2">
             <div className="flex items-center gap-1">
               <div className={cn(
                 "w-2 h-2 rounded-full shrink-0", 
                 isAtLiveEdge ? "bg-red-500 animate-pulse" : "bg-gray-500"
               )} />
               <button 
                onClick={handleLiveToggle}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-black pointer-events-auto transition-all",
                  forceLiveEdge 
                    ? "bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                    : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/40"
                )}
                title={forceLiveEdge ? "Smart Sync: ON" : "Smart Sync: OFF"}
               >
                LIVE
               </button>
             </div>
             <span className={cn(
               "font-bold text-white truncate drop-shadow-md uppercase tracking-wider",
               isFullscreen ? "text-sm" : "text-[10px]"
             )}>{channel.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
             {!isFullscreen && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={toggleMinimize}
                 className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white"
                 title={isMinimized ? "Maximize" : "Minimize"}
               >
                 {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
               </Button>
             )}
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={handleFullScreen}
               className={cn(
                 "rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors",
                 isFullscreen ? "h-10 w-10" : "h-7 w-7"
               )}
               title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
             >
               {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-4 h-4" />}
             </Button>
             {!isFullscreen && (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={handleExpand}
                 className="h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 text-white"
                 title="Back to tab"
               >
                 <ArrowUpLeft className="w-4 h-4" />
               </Button>
             )}
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={(e) => { e.stopPropagation(); onClose?.(); }}
               className={cn(
                 "rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors",
                 isFullscreen ? "h-10 w-10" : "h-7 w-7"
               )}
               title="Close"
             >
               <X className={isFullscreen ? "w-5 h-5" : "w-4 h-4"} />
             </Button>
          </div>
        </div>
      )}

      {(isPip || isFullscreen) && !isMinimized && (
        <div className={cn(
          "absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          <button 
            onClick={togglePlay}
            className={cn(
              "rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:scale-110 transition-transform pointer-events-auto",
              isFullscreen ? "p-6" : "p-4"
            )}
          >
            {isPlaying ? (
              <Pause className={isFullscreen ? "w-12 h-12 text-white" : "w-8 h-8 text-white"} />
            ) : (
              <Play className={isFullscreen ? "w-12 h-12 text-white fill-current" : "w-8 h-8 text-white fill-current"} />
            )}
          </button>
        </div>
      )}

      <div className={cn("w-full h-full flex items-center justify-center bg-black video-container overflow-hidden", (isPip && isMinimized) && "hidden")}>
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
