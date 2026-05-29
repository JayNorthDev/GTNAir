
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Activity,
  Zap,
  Monitor
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
    bitrate: '0 kbps'
  });

  useEffect(() => {
    if (!player) return;

    const updateStats = () => {
      const qualityLevels = player.qualityLevels ? player.qualityLevels() : null;
      if (qualityLevels && qualityLevels.selectedIndex !== -1) {
        const level = qualityLevels[qualityLevels.selectedIndex];
        setStats({
          resolution: `${level.height}p`,
          bitrate: `${Math.round(level.bitrate / 1000)} kbps`
        });
      } else {
        setStats({
          resolution: player.videoHeight() ? `${player.videoHeight()}p` : 'HD',
          bitrate: 'Auto-Sync'
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
    <div className="w-full h-24 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center px-8 relative overflow-hidden group/bar transition-all duration-500">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#299fff]/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Left Section: Brand & Channel */}
      <div className="flex items-center gap-6 flex-1 min-w-0 z-10">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover/bar:scale-105">
            {channelLogo ? (
              <img src={channelLogo} alt="" className="w-full h-full object-contain" />
            ) : (
              <Monitor className="w-6 h-6 text-white/20" />
            )}
          </div>
          {/* Live Badge Overlay */}
          <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full border-2 border-[#0a0a0a] shadow-lg">
             <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
             <span className="text-[8px] font-black text-white uppercase tracking-tighter">LIVE</span>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-black text-[#299fff] uppercase tracking-[0.3em] mb-0.5 opacity-80">Now Broadcasting</span>
          <h3 className="text-xl font-black text-white truncate uppercase tracking-tight leading-none">
            {channelName}
          </h3>
        </div>
      </div>

      {/* Center Section: Main Controls */}
      <div className="flex items-center gap-8 px-8 z-10">
        {/* Play/Pause */}
        <button 
          onClick={onTogglePlay}
          className="w-14 h-14 rounded-full bg-white/5 hover:bg-[#299fff] border border-white/10 hover:border-[#299fff] flex items-center justify-center transition-all duration-300 group/play shadow-xl hover:shadow-[#299fff]/20"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white transition-transform group-active/play:scale-90" />
          ) : (
            <Play className="w-6 h-6 text-white fill-current transition-transform group-active/play:scale-90" />
          )}
        </button>

        {/* Volume System */}
        <div className="flex items-center gap-4 group/volume">
          <button 
            onClick={onToggleMute}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="w-24 h-1 bg-white/10 rounded-full relative overflow-hidden cursor-pointer">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="absolute left-0 top-0 h-full bg-[#299fff] transition-all duration-200" 
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Section: Intelligence & Settings */}
      <div className="flex items-center gap-6 flex-1 justify-end z-10">
        {/* Stream Intelligence */}
        <div className="hidden md:flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-3 border border-white/5">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Resolution</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white uppercase tracking-tighter">{stats.resolution}</span>
              <div className="w-1 h-1 rounded-full bg-[#299fff]" />
            </div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Efficiency</span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#299fff]" />
              <span className="text-sm font-black text-white uppercase tracking-tighter">{stats.bitrate.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Quality Gear */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all">
              <Settings className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white w-56 rounded-2xl p-2 shadow-2xl">
            <div className="px-3 py-2 text-[10px] font-black text-[#299fff] uppercase tracking-[0.2em] opacity-80 border-b border-white/5 mb-1">Stream Engine</div>
            {['1080p', '720p', '480p', 'Auto Sync'].map((q) => (
              <DropdownMenuItem 
                key={q} 
                className="hover:bg-[#299fff] hover:text-white focus:bg-[#299fff] rounded-xl cursor-pointer transition-colors px-3 py-2"
                onClick={() => setStats(prev => ({ ...prev, resolution: q }))}
              >
                <div className="flex items-center justify-between w-full font-bold uppercase text-[10px] tracking-widest">
                  <span>{q}</span>
                  {stats.resolution === q && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Decorative Brand Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#299fff]/20 to-transparent opacity-50" />
    </div>
  );
}
