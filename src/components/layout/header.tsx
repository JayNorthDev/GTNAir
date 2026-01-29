"use client";
import { Menu, SidebarOpen, SidebarClose } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';

type HeaderProps = {
  selectedChannel: Channel | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
};

export default function Header({ selectedChannel, isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
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
