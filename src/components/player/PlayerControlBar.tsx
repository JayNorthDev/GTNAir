
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize, 
  Minimize,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PlayerControlBarProps {
  player: any;
  channelName: string;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isError?: boolean;
}

export function PlayerControlBar({
  player,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  isFullscreen,
  isError
}: PlayerControlBarProps) {
  const [stats, setStats] = useState({ resolution: 'Source', bitrate: 'Auto' });
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (!player || isError) return;
    const interval = setInterval(() => {
      try {
        const height = player.videoHeight();
        const res = height ? `${height}p` : 'Source';
        setStats({ resolution: res, bitrate: 'Optimized' });
      } catch (e) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [player, isError]);

  return (
    <div className="w-full flex items-center justify-between px-8 py-4 pointer-events-auto">
      {/* Left: Playback Commands */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onTogglePlay}
          disabled={isError}
          className="text-white hover:text-white/80 transition-all disabled:opacity-20"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 stroke-[1.5]" />
          ) : (
            <Play className="w-7 h-7 stroke-[1.5] fill-current" />
          )}
        </button>

        {/* Volume Control - LDSG Minimalist Slider */}
        <div className="flex items-center gap-3 group/volume">
          <button onClick={onToggleMute} className="text-white/80 hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 stroke-[1.5]" /> : <Volume2 className="w-6 h-6 stroke-[1.5]" />}
          </button>
          <div className="hidden sm:block w-0 group-hover/volume:w-24 transition-all duration-300 overflow-hidden">
             <div className="w-24 h-1 bg-white/20 rounded-full relative ml-1 cursor-pointer">
                <div 
                  className={cn("absolute inset-y-0 left-0 bg-white transition-all rounded-full")} 
                  style={{ width: isMuted ? '0%' : `${volume * 100}%` }}
                />
             </div>
          </div>
        </div>
      </div>

      {/* Right: Interface & Settings */}
      <div className="flex items-center gap-6">
        {!isError && (
          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-white/60 tracking-wider">
            <Activity className="w-3.5 h-3.5" />
            <span>{stats.resolution}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-white/80 hover:text-white transition-colors outline-none">
                  <Settings className="w-6 h-6 stroke-[1.5]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-2xl border-white/10 text-white min-w-[160px] p-2 rounded-xl">
                <div className="px-3 py-2 text-[10px] text-white/40 font-bold uppercase tracking-widest border-b border-white/5 mb-1">Stream Options</div>
                {['Direct HLS', 'Auto Buffer', 'Force High Quality'].map((opt) => (
                   <DropdownMenuItem key={opt} className="text-xs font-medium focus:bg-white/10 focus:text-white cursor-pointer py-2 px-3 rounded-lg">
                      {opt}
                   </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button 
              onClick={onToggleFullscreen}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-6 h-6 stroke-[1.5]" /> : <Maximize className="w-6 h-6 stroke-[1.5]" />}
            </button>
        </div>
      </div>
    </div>
  );
}
