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
  PictureInPicture2,
  Lock,
  Unlock,
  RefreshCw
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
  
  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [playbackRate, setPlaybackRate] = useState<string>('1');

  const [currentTime, setCurrentTime] = useState('00:00');
  const [totalTime, setTotalTime] = useState('00:00');
  const [progress, setProgress] = useState(0);

  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

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
    setQualityLevels([]);
    setSelectedQuality('auto');
    setPlaybackRate('1');

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
          overrideNative: true,
          enableLowInitialPlaylist: true,
          fastQualityChangeHtml5: true
        }
      }
    });

    playerRef.current = player;

    const levels = player.qualityLevels();
    
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
    player.on('playing', () => setIsLoading(false));
    
    player.on('loadedmetadata', () => {
      setIsLoading(false);
      const duration = player.duration();
      if (duration && duration !== Infinity) {
        setTotalTime(formatTime(duration));
      } else {
        setTotalTime('LIVE');
      }
      updateQualityLevels();
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
  }, [channel?.url, autoSkip, onStreamError, resetControlsTimer, isMuted]);

  const handleTogglePlay = () => {
    if (isPlaying) playerRef.current?.pause();
    else playerRef.current?.play();
  };

  const handleSkip = (seconds: number) => {
    if (!playerRef.current || isLocked) return;
    const currentTimeValue = playerRef.current.currentTime();
    playerRef.current.currentTime(currentTimeValue + seconds);
    resetControlsTimer();
  };

  const handleReplay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
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
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
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
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (e) {
      console.error("PIP failed", e);
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!channel) return;
    if (navigator.share) {
      navigator.share({
        title: channel.name,
        text: `Watch ${channel.name} live on GTNPlay!`,
        url: window.location.href,
      });
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
    setIsLocked(!isLocked);
    resetControlsTimer();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const threshold = 300; 
    const diff = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    if (isLocked) {
      resetControlsTimer();
      return;
    }

    if (diff < threshold) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const midPoint = rect.width / 2;

      if (clickX < midPoint) {
        handleSkip(-10);
      } else {
        handleSkip(10);
      }
    } else {
      resetControlsTimer();
    }
  };

  const handleProgressBarInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressBarRef.current || !playerRef.current || isLocked) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'clientX' in e ? (e as React.MouseEvent).clientX : (e as any).touches[0].clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    const duration = playerRef.current.duration();
    
    if (duration && duration !== Infinity) {
      playerRef.current.currentTime(duration * percentage);
      setProgress(percentage * 100);
    }
  };

  if (!channel) return null;

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={handleContainerClick}
      className={cn(
        "group relative flex flex-col bg-black text-white select-none overflow-hidden transition-all duration-500",
        isPip ? "fixed bottom-6 right-6 w-[400px] rounded-xl shadow-2xl border border-white/10 z-[100]" : "flex-1 w-full h-full",
        isFullscreen && "rounded-none border-none"
      )}
    >
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

        <div className={cn(
          "absolute inset-0 z-20 flex flex-col transition-opacity duration-500",
          showControls ? "opacity-100 bg-black/40" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
               <button 
                  onClick={handleToggleLock}
                  className={cn(
                    "p-1.5 rounded-lg transition-all flex items-center justify-center",
                    isLocked 
                      ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  title={isLocked ? "Unlock Screen" : "Lock Screen"}
               >
                 {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
               </button>
               {!isLocked && <X className="w-4 h-4 text-white/40 cursor-pointer hover:text-white transition-colors" onClick={onClose} />}
            </div>
            
            {!isLocked && (
              <div className="flex items-center gap-6">
                <div className="relative group/volume flex flex-col items-center gap-2">
                  <div className="absolute top-12 flex flex-col items-center bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl opacity-0 group-hover/volume:opacity-100 transition-all duration-300 pointer-events-none group-hover/volume:pointer-events-auto shadow-2xl">
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="h-32 appearance-none bg-white/20 rounded-full cursor-pointer accent-[#299fff] [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
                      style={{ WebkitAppearance: 'slider-vertical', width: '4px' }}
                    />
                  </div>
                  <button 
                    onClick={handleToggleMute} 
                    className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 flex items-center justify-center"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isLocked && (
            <div className="flex-1 flex items-center justify-center gap-12">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSkip(-10); }}
                className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/skip"
              >
                <div className="relative flex items-center justify-center">
                  <RotateCcw className="w-8 h-8 text-white/60 group-hover/skip:text-white transition-colors" />
                  <span className="absolute text-[10px] font-bold mt-1">10</span>
                </div>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
                className="w-28 h-28 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/play shadow-[0_0_40px_rgba(255,255,255,0.05)]"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white fill-white" />
                ) : (
                  <Play className="w-12 h-12 text-white fill-white ml-2" />
                )}
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleSkip(10); }}
                className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/skip"
              >
                <div className="relative flex items-center justify-center">
                  <RotateCw className="w-8 h-8 text-white/60 group-hover/skip:text-white transition-colors" />
                  <span className="absolute text-[10px] font-bold mt-1">10</span>
                </div>
              </button>
            </div>
          )}

          {!isLocked && (
            <div className="p-6 space-y-4">
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{channel.name}</h2>
                  <p className="text-sm italic text-white/60">
                    Live Broadcast • {channel.group.title || 'General'}
                  </p>
                </div>
                <div className="flex items-center gap-4 mb-1">
                   <button onClick={handleShare} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                     <Share2 className="w-5 h-5" />
                   </button>
                   <button onClick={handleOutlink} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                     <ExternalLink className="w-5 h-5" />
                   </button>
                </div>
              </div>

              <div 
                ref={progressBarRef}
                onMouseDown={handleProgressBarInteraction}
                onClick={(e) => e.stopPropagation()}
                className="relative group/progress cursor-pointer"
              >
                <div className="absolute -top-4 inset-x-0 h-10 z-10" />
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#299fff] transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(41,159,255,0.8)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform duration-200 z-20"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium tracking-widest tabular-nums text-white/80">
                    {currentTime} <span className="text-white/20 mx-1">/</span> {totalTime}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Quality Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-white/60 hover:text-white transition-colors outline-none p-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2">
                          <Settings2 className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">
                            Quality: {selectedQuality === 'auto' ? 'Auto' : qualityLevels.find(q => q.index.toString() === selectedQuality)?.label || 'Auto'}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="top" className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl p-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-2">Video Quality</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={selectedQuality} onValueChange={handleQualityChange}>
                          <DropdownMenuRadioItem value="auto" className="py-2.5 px-3 rounded-xl focus:bg-[#299fff] transition-colors cursor-pointer text-xs font-bold uppercase tracking-widest">
                            Auto
                          </DropdownMenuRadioItem>
                          <DropdownMenuSeparator className="bg-white/5 mx-2" />
                          {qualityLevels.map((level) => (
                            <DropdownMenuRadioItem 
                              key={level.index} 
                              value={level.index.toString()}
                              className="py-2.5 px-3 rounded-xl focus:bg-[#299fff] transition-colors cursor-pointer text-xs font-bold"
                            >
                              {level.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Speed Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="text-white/60 hover:text-white transition-colors outline-none p-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2">
                          <Timer className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">
                            Speed: {playbackRate === '1' ? '1X' : `${playbackRate}X`}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="top" className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white rounded-2xl shadow-2xl p-2 z-[110]" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-2">Playback Speed</DropdownMenuLabel>
                         <DropdownMenuRadioGroup value={playbackRate} onValueChange={handlePlaybackRateChange}>
                            {['0.5', '0.75', '1', '1.25', '1.5', '2'].map((rate) => (
                              <DropdownMenuRadioItem 
                                key={rate} 
                                value={rate}
                                className="py-2.5 px-3 rounded-xl focus:bg-[#299fff] transition-colors cursor-pointer text-xs font-bold"
                              >
                                {rate === '1' ? 'Normal (1X)' : `${rate}X`}
                              </DropdownMenuRadioItem>
                            ))}
                         </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button onClick={handleReplay} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all">
                      <RefreshCw className="w-5 h-5" />
                    </button>

                    <button onClick={handleTogglePip} className={cn("p-1.5 rounded-lg transition-all", isPipActive ? "text-[#299fff] bg-[#299fff]/10" : "text-white/60 hover:text-white hover:bg-white/5")}>
                      <PictureInPicture2 className="w-5 h-5" />
                    </button>

                    <button onClick={handleToggleCaptions} className={cn("transition-all duration-300 p-1.5 rounded-lg", captionsEnabled ? "text-[#299fff] bg-[#299fff]/10" : "text-white/60 hover:text-white hover:bg-white/5")}>
                      <Captions className="w-5 h-5" />
                    </button>

                    <button onClick={handleFullScreen} className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
