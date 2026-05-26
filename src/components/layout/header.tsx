"use client";
import { Menu, Heart, Library } from 'lucide-react';
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
    <header className="flex items-center justify-between h-16 px-6 bg-[#0a0a0a]/30 backdrop-blur-xl border-b border-white/5 shrink-0 z-30">
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 rounded-full hover:bg-white/10 block md:hidden -ml-2 text-white"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Browse Library Button - Toggle Channel List */}
        <Button
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "group flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-500 shrink-0",
            "bg-[#299fff]/10 hover:bg-[#299fff]/20 border border-[#299fff]/30 text-[#299fff] shadow-[0_0_15px_rgba(41,159,255,0.1)]",
            isSidebarOpen && "bg-[#299fff] text-white border-transparent shadow-[0_0_20px_rgba(41,159,255,0.4)]"
          )}
        >
          <Library className={cn("w-5 h-5 transition-transform duration-500", isSidebarOpen && "rotate-12 scale-110")} />
          <span className="text-xs font-black uppercase tracking-[0.15em] hidden md:inline">Browse Library</span>
        </Button>

        {selectedChannel ? (
          <div className="flex items-center gap-4 overflow-hidden min-w-0">
            <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block shrink-0" />
            <div className="flex flex-col min-w-0">
              <h2 className="font-black text-sm text-white truncate uppercase tracking-tight">
                {selectedChannel.name}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">
                {selectedChannel.group.title || "General"}
              </p>
            </div>
             <button 
               onClick={onToggleFavorite} 
               className="p-2.5 rounded-full hover:bg-white/5 transition-all duration-300 group shrink-0" 
               title="Toggle Favorite"
             >
                <Heart className={cn(
                  "w-5 h-5 transition-all duration-500", 
                  isFavorite 
                    ? "text-red-500 fill-current drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-110" 
                    : "text-slate-600 group-hover:text-slate-300"
                )}/>
              </button>
          </div>
        ) : (
          <div className="hidden sm:block ml-4">
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] animate-pulse">Waiting for Selection</span>
          </div>
        )}
      </div>
      
      <div className="w-10" />
    </header>
  );
}
