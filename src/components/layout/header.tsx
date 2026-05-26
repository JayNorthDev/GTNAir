
"use client";
import { Search, Heart, Tv } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type HeaderProps = {
  selectedChannel: Channel | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function Header({ selectedChannel, isSidebarOpen, setIsSidebarOpen, isFavorite, onToggleFavorite }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-20 px-6 bg-[#0a0a0a]/30 backdrop-blur-xl border-b border-white/5 shrink-0 z-30">
      <div className="flex items-center gap-6 flex-1 overflow-hidden">
        {/* Browse Library Button - Styled as per screenshot */}
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "group flex items-center gap-3 px-6 py-6 rounded-2xl transition-all duration-300 shrink-0",
            "bg-[#299fff] hover:bg-[#299fff]/90 text-white shadow-lg shadow-[#299fff]/20"
          )}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Browse Library</span>
        </Button>

        <div className="h-10 w-[1px] bg-white/10 mx-2 shrink-0" />

        {selectedChannel ? (
          <div className="flex items-center gap-4 overflow-hidden min-w-0">
            {/* Channel Logo Box */}
            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {selectedChannel.tvg.logo ? (
                    <img 
                        src={selectedChannel.tvg.logo} 
                        alt="" 
                        className="w-full h-full object-contain" 
                        onError={(e) => {(e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=?";}}
                    />
                ) : (
                    <Tv className="w-6 h-6 text-white/20" />
                )}
            </div>
            
            <div className="flex flex-col min-w-0">
              <h2 className="font-black text-lg text-white truncate uppercase tracking-tight">
                {selectedChannel.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#299fff]" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">
                    {selectedChannel.group.title || "General"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:block ml-4">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] animate-pulse">Waiting for Selection</span>
          </div>
        )}
      </div>
      
      {/* Favorite Button */}
      <button 
        onClick={onToggleFavorite} 
        className={cn(
            "p-3 rounded-2xl transition-all duration-300 group shrink-0 border border-white/5",
            isFavorite ? "bg-red-500/10 border-red-500/20" : "bg-white/5 hover:bg-white/10"
        )}
        title="Toggle Favorite"
      >
        <Heart className={cn(
          "w-6 h-6 transition-all duration-500", 
          isFavorite 
            ? "text-red-500 fill-current drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" 
            : "text-slate-600 group-hover:text-slate-300"
        )}/>
      </button>
    </header>
  );
}
