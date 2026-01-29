
"use client";
import { Menu, Heart } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { cn } from '@/lib/utils';

type HeaderProps = {
  selectedChannel: Channel | null;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isFavorite: (channel: Channel | null) => boolean;
  toggleFavorite: (channel: Channel | null) => void;
};

export default function Header({ selectedChannel, setIsSidebarOpen, isFavorite, toggleFavorite }: HeaderProps) {
  const handleFavoriteClick = () => {
    if (selectedChannel) {
      toggleFavorite(selectedChannel);
    }
  }
  
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-secondary block md:hidden -ml-2">
          <Menu />
        </button>
        {selectedChannel ? (
          <div>
            <h2 className="font-semibold text-lg">{selectedChannel.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedChannel.group.title}</p>
          </div>
        ) : (
          <div />
        )}
      </div>
      
      {selectedChannel && (
        <button onClick={handleFavoriteClick} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Heart className={cn(
            "w-6 h-6 transition-all",
            isFavorite(selectedChannel)
              ? "text-red-500 fill-red-500"
              : "text-gray-500"
          )} />
          <span className="sr-only">Toggle Favorite</span>
        </button>
      )}
    </header>
  );
}
