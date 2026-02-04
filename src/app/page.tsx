
"use client";

import { useState, useEffect, useMemo } from "react";
import { useChannels } from "@/hooks/useChannels";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Channel } from "@/lib/m3u-parser";
import { AlertTriangle, Loader, Heart, Grid2X2 } from "lucide-react";
import { NavRail } from "@/components/layout/nav-rail";
import { HomeGrid } from "@/components/views/home-grid";
import { HomeView } from "@/components/views/home-view";
import { CategoriesView } from "@/components/views/categories-view";
import { useFavorites } from "@/hooks/useFavorites";
import { useSettings, View as SettingsViewType } from "@/hooks/useSettings";
import { SettingsView } from "@/components/views/settings-view";
import { cn } from "@/lib/utils";


export default function Home() {
  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();
  const { 
    allChannels, 
    displayChannels, 
    categories, 
    loading, 
    error, 
    filterChannels,
    loadMore,
    hasMore
  } = useChannels(settings.customPlaylistUrl, settings.selectedPlaylistId);
  
  const { favoriteUrls, toggleFavorite, isFavorite } = useFavorites();
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<SettingsViewType>("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const favoriteChannels = useMemo(
    () => allChannels.filter(channel => favoriteUrls.includes(channel.url)),
    [allChannels, favoriteUrls]
  );
  
  useEffect(() => {
    if (settingsLoaded) {
      setView(settings.defaultView);
    }
  }, [settingsLoaded, settings.defaultView]);


  useEffect(() => {
    filterChannels(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, filterChannels]);

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
    setView("player");
    if (window.innerWidth < 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  };

  const handlePlaylistSelect = (playlistId: string) => {
    updateSettings({ selectedPlaylistId: playlistId });
    setView("player");
    setSelectedChannel(null); // Reset player state
  };

  const handleNextChannel = () => {
    if (!selectedChannel) return;
    const currentIndex = displayChannels.findIndex(c => c.url === selectedChannel.url);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % displayChannels.length;
      handleChannelClick(displayChannels[nextIndex]);
    }
  };
  
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-4 text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h2 className="text-2xl font-semibold">Failed to load playlist</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
      </div>
    );
  }
  
  if ((loading && allChannels.length === 0) || !settingsLoaded) {
    return (
        <div className="flex h-screen items-center justify-center text-foreground">
            <div className="flex flex-col items-center gap-4">
                <Loader className="w-12 h-12 animate-spin text-primary" />
                <h2 className="text-xl font-medium text-muted-foreground">Loading Channels...</h2>
            </div>
        </div>
    )
  }

  const renderContent = () => {
    switch (view) {
      case "home":
        return (
          <HomeView 
            channels={displayChannels} 
            onChannelSelect={handleChannelClick} 
            loadMore={loadMore} 
            hasMore={hasMore} 
          />
        );
      case "categories":
        return (
          <CategoriesView 
            onSelectPlaylist={handlePlaylistSelect} 
            currentPlaylistId={settings.selectedPlaylistId} 
          />
        );
      case "favorites":
        if (favoriteChannels.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Heart className="w-24 h-24 mb-4 text-slate-600" />
              <h2 className="text-2xl font-semibold">No Favorites Yet</h2>
              <p>Click the heart on a channel in the player to add it here.</p>
            </div>
          );
        }
        return (
          <div className="p-4 md:p-8">
            <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight mb-4">Your Favorite Channels</h2>
            <HomeGrid items={favoriteChannels} onChannelSelect={handleChannelClick} />
          </div>
        );
      case "player":
        return (
          <div className="flex h-full">
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              displayChannels={displayChannels}
              selectedChannel={selectedChannel}
              handleChannelClick={handleChannelClick}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              loading={loading}
            />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header
                selectedChannel={selectedChannel}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isFavorite={isFavorite(selectedChannel)}
                onToggleFavorite={() => toggleFavorite(selectedChannel)}
              />
              <VideoPlayer 
                channel={selectedChannel}
                onStreamError={handleNextChannel}
                autoSkip={settings.autoSkip}
                isMuted={settings.muteOnStartup}
              />
            </div>
          </div>
        );
      default:
        return (
          <HomeView 
            channels={displayChannels} 
            onChannelSelect={handleChannelClick} 
            loadMore={loadMore} 
            hasMore={hasMore} 
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-foreground">
      <NavRail 
        view={view} 
        setView={setView} 
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />
      <main className={cn("flex-1", view === 'player' ? 'overflow-hidden' : 'overflow-y-auto')}>
        {renderContent()}
      </main>
      <SettingsView isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
