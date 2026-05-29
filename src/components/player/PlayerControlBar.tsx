
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Zap,
  Monitor,
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
      // Basic quality check from video element
      const height = player.videoHeight();
      const res = height ? `${height}p` : 'HD';
      
      // Basic bitrate estimation for VHS tech if available
      let br = 'Auto-Sync';
      try {
        if (player.tech() && player.tech().vhs) {
          const playlist = player.tech().vhs.playlists.master;
          if (playlist && playlist.attributes && playlist.attributes.BANDWIDTH) {
             br = `${Math.round(playlist.attributes.BANDWIDTH / 1000)} kbps`;
          }
        }
      } catch (e) {
        // Silently ignore stats fetch errors
      }

      setStats({
        resolution: res,
        bitrate: br
      });
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
    <div className="w-full h-24 bg-[#050505]/80 backdrop-blur-2xl border-t border-white/5 flex items-center px-8 relative overflow-hidden group/bar transition-all duration-500">
      {/* Premium Surface Highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      
      {/* Left: Broadcast Presence */}
      <div className="flex items-center gap-6 flex-1 min-w-0 z-10">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-2 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/bar:scale-105 shadow-2xl shadow-black/50">
            {channelLogo ? (
              <img src={channelLogo} alt="" className="w-full h-full object-contain" />
            ) : (
              <Monitor className="w-6 h-6 text-white/20" />
            )}
          </div>
          {/* Elite Live Badge */}
          <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1.5 bg-[#FF0000] px-2.5 py-0.5 rounded-full border-2 border-[#050505] shadow-[0_0_15px_rgba(255,0,0,0.5)]">
             <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
             <span className="text-[9px] font-black text-white uppercase tracking-tighter">LIVE</span>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black text-[#299fff] uppercase tracking-[0.4em] mb-1 opacity-90 drop-shadow-[0_0_8px_rgba(41,159,255,0.6)]">Signal Active</span>
          <h3 className="text-2xl font-black text-white truncate uppercase tracking-tight leading-none font-headline">
            {channelName}
          </h3>
        </div>
      </div>

      {/* Center: Playback Core */}
      <div className="flex items-center gap-10 px-8 z-10">
        {/* Play/Pause Command Button */}
        <button 
          onClick={onTogglePlay}
          className={cn(
            "w-16 h-16 rounded-full bg-white/5 hover:bg-[#299fff] border border-white/10 hover:border-[#299fff] flex items-center justify-center transition-all duration-300 group/play shadow-2xl",
            "hover:shadow-[0_0_40px_rgba(41,159,255,0.4)] active:scale-95"
          )}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-white transition-transform group-hover/play:scale-110" />
          ) : (
            <Play className="w-7 h-7 text-white fill-current transition-transform group-hover/play:scale-110 ml-1" />
          )}
        </button>

        {/* Dynamic Volume Interface */}
        <div className="flex items-center gap-4 group/volume">
          <button 
            onClick={onToggleMute}
            className="text-white/40 hover:text-[#299fff] transition-all duration-300"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="w-28 h-1 bg-white/10 rounded-full relative overflow-hidden cursor-pointer group-hover/volume:h-1.5 transition-all duration-300">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={isMuted ? 0 : volume} 
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#299fff] to-[#55b4ff] transition-all duration-200" 
              style={{ width: `${isMuted ? 0 : volume}%` }}
            >
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_12px_white]" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Technical Command */}
      <div className="flex items-center gap-8 flex-1 justify-end z-10">
        {/* Intelligence Block */}
        <div className="hidden lg:flex items-center gap-6 bg-white/[0.04] rounded-2xl px-6 py-3 border border-white/5 backdrop-blur-md">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Stream Meta</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white uppercase tracking-tighter">{stats.resolution}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#299fff] shadow-[0_0_10px_rgba(41,159,255,1)]" />
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">Throughput</span>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-[#299fff]" />
              <span className="text-sm font-black text-white uppercase tracking-tighter">{stats.bitrate.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Contextual Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group/settings shadow-lg">
              <Settings className="w-5 h-5 text-white/40 group-hover/settings:text-white group-hover/settings:rotate-90 transition-all duration-700" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white w-64 rounded-[2rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <div className="px-4 py-3 text-[10px] font-black text-[#299fff] uppercase tracking-[0.35em] opacity-80 border-b border-white/5 mb-2">Signal Engine</div>
            {['1080p Ultra', '720p HD', '480p SD', 'Auto Dynamic'].map((q) => (
              <DropdownMenuItem 
                key={q} 
                className="hover:bg-[#299fff]/20 hover:text-[#299fff] focus:bg-[#299fff]/20 focus:text-[#299fff] rounded-2xl cursor-pointer transition-all px-4 py-3 mb-1 last:mb-0 group/item"
                onClick={() => setStats(prev => ({ ...prev, resolution: q }))}
              >
                <div className="flex items-center justify-between w-full font-bold uppercase text-[10px] tracking-widest">
                  <span>{q}</span>
                  {stats.resolution.includes(q.split(' ')[0]) && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#299fff] shadow-[0_0_15px_rgba(41,159,255,1)]" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between px-4">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Latency</span>
                <span className="text-[8px] font-black text-[#299fff]">OPTIMAL</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Finishing Premium Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#299fff]/40 to-transparent opacity-50 blur-[0.5px]" />
    </div>
  );
}
