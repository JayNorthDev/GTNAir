
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
  Activity,
  Cpu
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
  channelLogo?: string;
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
  channelName,
  channelLogo,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  isFullscreen,
  isError
}: PlayerControlBarProps) {
  const [stats, setStats] = useState({ resolution: 'Auto', bitrate: '---' });

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
    <div className="w-full flex flex-col md:flex-row items-center gap-4 px-6 py-4 bg-[#121212]/50 backdrop-blur-md">
      {/* Left: Metadata */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 p-1.5 flex items-center justify-center shrink-0">
          {channelLogo ? (
            <img src={channelLogo} alt="" className="w-full h-full object-contain" />
          ) : (
            <Cpu className="w-5 h-5 text-white/20" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm font-bold text-white truncate uppercase tracking-tight leading-none">
            {channelName}
          </h3>
          <span className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
             Signal Status: {isError ? 'Interrupted' : 'Encrypted'}
          </span>
        </div>
      </div>

      {/* Center: Main Commands */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onTogglePlay}
          disabled={isError}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-20"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <div className="flex items-center gap-3 group/volume">
          <button onClick={onToggleMute} className="text-white/40 hover:text-white transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-20 h-1 bg-white/5 rounded-full relative overflow-hidden">
             <div className={cn("absolute inset-y-0 left-0 bg-white/40 transition-all", isMuted ? 'w-0' : 'w-full')} />
          </div>
        </div>
      </div>

      {/* Right: Technical Stats */}
      <div className="flex items-center justify-end gap-6 flex-1">
        {!isError && (
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#299fff]" />
              <span>{stats.resolution}</span>
            </div>
            <div className="h-3 w-px bg-white/5" />
            <span>{stats.bitrate}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/10 text-white font-mono">
                <div className="px-3 py-2 text-[9px] text-white/40 border-b border-white/5">ENGINE PREFERENCES</div>
                {['Direct HLS', 'Buffer-Free', 'High Efficiency'].map((opt) => (
                   <DropdownMenuItem key={opt} className="text-[10px] focus:bg-white/10 cursor-pointer">
                      {opt}
                   </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button 
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
}
