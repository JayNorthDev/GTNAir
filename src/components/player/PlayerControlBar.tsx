"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Wifi, 
  Activity,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/input'; // Note: Using a custom slider or basic input
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PlayerControlBarProps {
  player: any;
  channelName: string;
  channelLogo?: string;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}

export function PlayerControlBar({
  player,
  channelName,
  channelLogo,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute
}: PlayerControlBarProps) {
  const [volume, setVolume] = useState(100);
  const [stats, setStats] = useState({
    resolution: 'Auto',
    bitrate: '0 kbps',
    fps: '0'
  });

  useEffect(() => {
    if (!player) return;

    const updateStats = () => {
      // Basic stats extraction from Video.js
      const qualityLevels = player.qualityLevels ? player.qualityLevels() : null;
      if (qualityLevels && qualityLevels.selectedIndex !== -1) {
        const level = qualityLevels[qualityLevels.selectedIndex];
        setStats({
          resolution: `${level.height}p`,
          bitrate: `${Math.round(level.bitrate / 1000)} kbps`,
          fps: '60' // Mocked or constant if not available
        });
      } else {
        setStats({
          resolution: player.videoHeight() ? `${player.videoHeight()}p` : 'HD',
          bitrate: 'Auto-Sync',
          fps: 'Live'
        });
      }
    };

    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, [player]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (player) {
      player.volume(val / 100);
      if (val === 0) player.muted(true);
      else if (player.muted()) player.muted(false);
    }
  };

  return (
    <div className="w-full h-24 md:h-20 bg-white border-t-2 border-[#134e4a]/20 flex flex-col md:flex-row overflow-hidden select-none animate-in slide-in-from-bottom duration-500">
      {/* Left Segment: LIVE ID (Black) */}
      <div className="md:w-32 bg-black flex flex-col items-center justify-center text-white shrink-0 relative">
        <span className="text-[10px] font-black tracking-[0.2em] opacity-60">STATUS</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <span className="text-xl font-black italic tracking-tighter">LIVE</span>
        </div>
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Segment 2: Logo & Brand (White) */}
      <div className="md:w-48 bg-white border-r border-slate-200 flex flex-col items-center justify-center p-2 shrink-0">
        <div className="h-10 w-full flex items-center justify-center">
          {channelLogo ? (
            <img src={channelLogo} alt={channelName} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-lg font-black text-[#134e4a] tracking-tighter uppercase italic">{channelName.split(' ')[0]}</span>
          )}
        </div>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">AUTHENTIC BROADCAST</span>
      </div>

      {/* Segment 3: Main Channel Title (White) */}
      <div className="flex-1 bg-white border-r border-slate-200 flex flex-col justify-center px-6 overflow-hidden">
        <span className="text-[9px] font-black text-[#134e4a] opacity-40 uppercase tracking-[0.3em]">Currently Watching</span>
        <h3 className="text-lg md:text-xl font-black text-slate-800 truncate uppercase leading-tight tracking-tight">
          {channelName}
        </h3>
      </div>

      {/* Segment 4: Stream Stats (Teal/Dark Cyan) */}
      <div className="md:w-64 bg-[#134e4a] flex items-stretch text-white shrink-0">
        <div className="flex-1 flex flex-col justify-center px-4 border-r border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold opacity-60 tracking-widest uppercase">Resolution</span>
            <Wifi className="w-2.5 h-2.5 opacity-60" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tighter">${stats.resolution}</span>
            <span className="text-[10px] font-bold opacity-40">RES</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center px-4 bg-[#0f766e]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold opacity-60 tracking-widest uppercase">Bitrate</span>
            <Activity className="w-2.5 h-2.5 opacity-60" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tighter">${stats.bitrate.split(' ')[0]}</span>
            <span className="text-[10px] font-bold opacity-40">{stats.bitrate.split(' ')[1]}</span>
          </div>
        </div>
      </div>

      {/* Segment 5: Far Right Controls & Logo (Teal) */}
      <div className="md:w-72 bg-[#134e4a] border-l border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          {/* Play/Pause */}
          <button 
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            ) : (
              <Play className="w-5 h-5 text-white fill-current group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Mute/Volume */}
          <div className="flex items-center gap-2 group/volume relative">
            <button 
              onClick={onToggleMute}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange}
              className="w-20 accent-white h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/30 transition-all"
            />
          </div>
        </div>

        {/* Quality Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all ml-2">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#134e4a] border-white/10 text-white w-48">
            <div className="p-2 text-[10px] font-bold opacity-60 uppercase tracking-widest border-b border-white/5 mb-1">Stream Quality</div>
            {['1080p60', '720p', '480p', 'Auto'].map((q) => (
              <DropdownMenuItem 
                key={q} 
                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                onClick={() => setStats(prev => ({ ...prev, resolution: q }))}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{q}</span>
                  {stats.resolution === q && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-4 h-full flex flex-col justify-center items-end opacity-20">
            <span className="text-xl font-black italic tracking-tighter leading-none">GTN</span>
            <span className="text-[6px] font-bold tracking-[0.5em] -mt-0.5">PLATFORM</span>
        </div>
      </div>
      
      {/* Visual Stripe at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-transparent to-[#134e4a]/10" />
    </div>
  );
}
