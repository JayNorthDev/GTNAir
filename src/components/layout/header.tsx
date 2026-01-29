"use client";
import { Menu, SidebarOpen, SidebarClose, Heart } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';

type HeaderProps = {
  selectedChannel: Channel | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function Header({ selectedChannel, isSidebarOpen, setIsSidebarOpen, isFavorite, onToggleFavorite }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-secondary block md:hidden -ml-2">
          <Menu />
        </button>
        {selectedChannel ? (
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-semibold text-lg">{selectedChannel.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedChannel.group.title}</p>
            </div>
             <button onClick={onToggleFavorite} className="p-2 rounded-full hover:bg-secondary transition-colors" title="Toggle Favorite">
                <Heart className={cn("w-6 h-6 transition-all", isFavorite ? "text-red-500 fill-current" : "text-gray-500")}/>
              </button>
          </div>
        ) : (
          <div />
        )}
      </div>
      
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        className="p-2 hover:bg-secondary transition-colors hidden md:block"
      >
        {isSidebarOpen ? <SidebarClose /> : <SidebarOpen />}
        <span className="sr-only">Toggle Channel List</span>
      </button>
    </header>
  );
}
