
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useChannels } from "@/hooks/useChannels";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Channel } from "@/lib/m3u-parser";
import { AlertTriangle, Heart, AlertCircle } from "lucide-react";
import { NavRail } from "@/components/layout/nav-rail";
import { HomeGrid } from "@/components/views/home-grid";
import { HomeView } from "@/components/views/home-view";
import { CategoriesView } from "@/components/views/categories-view";
import { useFavorites } from "@/hooks/useFavorites";
import { useSettings, View as SettingsViewType } from "@/hooks/useSettings";
import { SettingsView } from "@/components/views/settings-view";
import { cn } from "@/lib/utils";
import { GtnLogo } from "@/components/gtn-logo";
import { Button } from "@/components/ui/button";

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

  // Failure tracking for auto-skip
  const [failCount, setFailCount] = useState(0);
  const [skipError, setSkipError] = useState(false);

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

  const handleChannelSelect = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    setFailCount(0); // Reset failures on manual select
    setSkipError(false);
    setView("player");
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleNextChannel = useCallback(() => {
    if (!selectedChannel || skipError) return;

    if (failCount >= 10) {
      setSkipError(true);
      return;
    }

    // Mandatory 2s delay before skipping to prevent browser freeze
    setTimeout(() => {
      const currentIndex = displayChannels.findIndex(c => c.url === selectedChannel.url);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % displayChannels.length;
        setSelectedChannel(displayChannels[nextIndex]);
        setFailCount(prev => prev + 1);
      }
    }, 2000);
  }, [selectedChannel, displayChannels, failCount, skipError]);

  const handlePlaylistSelect = (playlistId: string) => {
    updateSettings({ selectedPlaylistId: playlistId });
    setView("player");
    setSelectedChannel(null);
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

  const renderContent = () => {
    switch (view) {
      case "home":
        return (
          <HomeView 
            channels={displayChannels} 
            onChannelSelect={handleChannelSelect} 
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
            <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in duration-700">
              <Heart className="w-24 h-24 mb-4 text-slate-600" />
              <h2 className="text-2xl font-semibold">No Favorites Yet</h2>
              <p>Click the heart on a channel in the player to add it here.</p>
            </div>
          );
        }
        return (
          <div className="p-4 md:p-8 space-y-12 animate-in fade-in duration-700">
            <header className="space-y-2 border-b border-white/5 pb-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">Your Favorites</h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Quickly access your most-watched channels.
              </p>
            </header>
            <HomeGrid items={favoriteChannels} onChannelSelect={handleChannelSelect} />
          </div>
        );
      case "player":
        return (
          <div className="flex h-full relative">
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              displayChannels={displayChannels}
              selectedChannel={selectedChannel}
              handleChannelClick={handleChannelSelect}
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
            
            {skipError && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
                <div className="flex flex-col items-center gap-6 p-8 bg-card border border-border rounded-xl text-center">
                  <AlertCircle className="w-16 h-16 text-destructive" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Auto-skip Paused</h2>
                    <p className="text-muted-foreground">Too many dead channels detected (10+). Please select a channel manually.</p>
                  </div>
                  <Button onClick={() => setSkipError(false)} className="px-8">Dismiss</Button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <HomeView 
            channels={displayChannels} 
            onChannelSelect={handleChannelSelect} 
            loadMore={loadMore} 
            hasMore={hasMore} 
          />
        );
    }
  };

  const isLoading = (loading && allChannels.length === 0) || !settingsLoaded;

  return (
    <div className="flex h-screen overflow-hidden text-foreground relative">
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

      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-700">
          <div className="flex flex-col items-center gap-10">
            <div className="relative">
              <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <GtnLogo className="w-20 h-20 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(0,174,239,0.8)]" />
            </div>

            <div className="flex items-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="w-4 h-4 bg-primary/90 rounded-[2px] shadow-[0_0_12px_rgba(0,174,239,0.5)] animate-pulse"
                  style={{ animationDelay: `${i * 200}ms`, animationDuration: '1.5s' }}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-bold tracking-[0.4em] text-white/80 uppercase animate-pulse">
                Initializing Channels
              </span>
              <div className="h-[1px] w-16 bg-primary/30" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
