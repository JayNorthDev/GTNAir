
"use client";

import { useState, useEffect, useMemo, useCallback, use, useRef } from "react";
import { useChannels } from "@/hooks/useChannels";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Channel } from "@/lib/m3u-parser";
import { AlertTriangle, Heart, AlertCircle } from "lucide-react";
import { NavRail } from "@/components/layout/nav-rail";
import { HomeView } from "@/components/views/home-view";
import { CategoriesView } from "@/components/views/categories-view";
import { useFavorites } from "@/hooks/useFavorites";
import { useSettings, View as SettingsViewType } from "@/hooks/useSettings";
import { SettingsView } from "@/components/views/settings-view";
import { cn } from "@/lib/utils";
import { GtnLogo } from "@/components/gtn-logo";
import { Button } from "@/components/ui/button";

interface HomeProps {
  params: Promise<any>;
  searchParams: Promise<any>;
}

const GREETINGS = [
  "Hello",
  "Bonjour",
  "Hola",
  "Ciao",
  "Konnichiwa",
  "Ayubowan",
  "Namaste",
  "Salu",
  "Nǐ hǎo"
];

export default function Home(props: HomeProps) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const { settings, updateSettings, isLoaded: settingsLoaded } = useSettings();
  const { 
    allChannels, 
    filteredChannels, // Full list for Sidebar
    displayChannels, // Sliced list for Home
    categories, 
    loading, 
    error, 
    filterChannels,
    loadMore,
    hasMore,
    totalFiltered
  } = useChannels(settings.customPlaylistUrl, settings.selectedPlaylistId);
  
  const { favoriteUrls, toggleFavorite, isFavorite } = useFavorites();
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  const [view, setView] = useState<SettingsViewType>("home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [channelToConfirm, setChannelToConfirm] = useState<Channel | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const [failCount, setFailCount] = useState(0);
  const [skipError, setSkipError] = useState(false);

  const allChannelsRef = useRef(allChannels);
  useEffect(() => {
    allChannelsRef.current = allChannels;
  }, [allChannels]);

  const failCountRef = useRef(failCount);
  useEffect(() => { failCountRef.current = failCount; }, [failCount]);

  const skipErrorRef = useRef(skipError);
  useEffect(() => { skipErrorRef.current = skipError; }, [skipError]);

  const selectedChannelRef = useRef(selectedChannel);
  useEffect(() => { selectedChannelRef.current = selectedChannel; }, [selectedChannel]);

  const isStoppedRef = useRef(isStopped);
  useEffect(() => { isStoppedRef.current = isStopped; }, [isStopped]);

  // Apple Hello Loader State
  const [greetingIndex, setGreetingIndex] = useState(0);

  const favoriteChannels = useMemo(
    () => allChannels.filter(channel => favoriteUrls.includes(channel.url)),
    [allChannels, favoriteUrls]
  );
  
  useEffect(() => {
    if (settingsLoaded) {
      setView(settings.defaultView);
    }
  }, [settingsLoaded, settings.defaultView]);

  // Sync document title with the currently playing channel
  useEffect(() => {
    if (selectedChannel) {
      document.title = `GTNPlay — ${selectedChannel.name}`;
    } else {
      document.title = 'GTNPlay';
    }
  }, [selectedChannel]);

  useEffect(() => {
    filterChannels(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, filterChannels]);

  // Greeting Cycle Effect
  useEffect(() => {
    const isLoading = (loading && allChannels.length === 0) || !settingsLoaded;
    if (isLoading) {
      const interval = setInterval(() => {
        setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, allChannels.length, settingsLoaded]);

  const handleChannelSelect = useCallback((channel: Channel) => {
    if (isStoppedRef.current && selectedChannelRef.current?.url === channel.url) {
      setChannelToConfirm(channel);
      return;
    }

    setSelectedChannel(channel);
    setFailCount(0); 
    setSkipError(false);
    setIsStopped(false);
    setView("player");
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleNextChannel = useCallback(() => {
    const currentChannel = selectedChannelRef.current;
    if (!currentChannel || skipErrorRef.current) return;

    if (failCountRef.current >= 9) {
      setSkipError(true);
      return;
    }

    setTimeout(() => {
      const channels = allChannelsRef.current;
      const currentIndex = channels.findIndex(c => c.url === currentChannel.url);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % channels.length;
        setSelectedChannel(channels[nextIndex]);
        setFailCount(prev => prev + 1);
      }
    }, 2000);
  }, []);

  // Instant channel navigation — used by CH+/CH- buttons and keyboard
  const handleManualNextChannel = useCallback(() => {
    if (!selectedChannel) return;
    const channels = allChannelsRef.current;
    const currentIndex = channels.findIndex(c => c.url === selectedChannel.url);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % channels.length;
      setSelectedChannel(channels[nextIndex]);
      setFailCount(0);
      setSkipError(false);
      setIsStopped(false);
    }
  }, [selectedChannel]);

  const handleManualPrevChannel = useCallback(() => {
    if (!selectedChannel) return;
    const channels = allChannelsRef.current;
    const currentIndex = channels.findIndex(c => c.url === selectedChannel.url);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
      setSelectedChannel(channels[prevIndex]);
      setFailCount(0);
      setSkipError(false);
      setIsStopped(false);
    }
  }, [selectedChannel]);

  const handlePlaylistSelect = (playlistId: string) => {
    updateSettings({ selectedPlaylistId: playlistId });
    setView("player");
  };

  const handleToggleLiveEdge = useCallback(() => {
    updateSettings({ forceLiveEdge: !settings.forceLiveEdge });
  }, [settings.forceLiveEdge, updateSettings]);

  const handleToggleChannelStrip = useCallback(() => {
    updateSettings({ showChannelStrip: !settings.showChannelStrip });
  }, [settings.showChannelStrip, updateSettings]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-4 text-center p-4">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h2 className="text-2xl font-semibold">Failed to load playlist</h2>
          <p className="text-muted-foreground max-md">{error}</p>
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
            selectedChannelUrl={selectedChannel?.url}
            favoriteUrls={favoriteUrls}
            onToggleFavorite={toggleFavorite}
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
        return (
          <div className="p-4 md:p-8 flex flex-col h-full animate-in fade-in duration-700">
            <header className="space-y-2 border-b border-white/5 pb-8 shrink-0">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">Your Favorites</h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Quickly access your most-watched channels.
              </p>
            </header>
            
            {favoriteChannels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center pb-20">
                <Heart className="w-24 h-24 mb-4 text-slate-600" />
                <h2 className="text-2xl font-semibold mb-2">No Favorites Yet</h2>
                <p>Click the heart on a channel in the player to add it here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto min-h-0 pt-8 pb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {favoriteChannels.map((channel, index) => (
                    <div
                        key={`${channel.url}-${index}`}
                        onClick={() => handleChannelSelect(channel)}
                        className={cn(
                            "group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-md bg-slate-900/50 border border-transparent",
                            "transition-all duration-300 ease-in-out hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-black/50 hover:ring-2 hover:ring-primary focus:z-10 focus:scale-105 focus:shadow-2xl focus:ring-2 focus:ring-primary"
                        )}
                    >
                        <img
                            src={channel.tvg.logo || "https://placehold.co/300x170/020617/334155?text=No+Logo"}
                            alt={channel.name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-contain p-4 bg-black/20"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "https://placehold.co/300x170/020617/334155?text=No+Logo";
                                (e.target as HTMLImageElement).classList.add("object-scale-down");
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="truncate font-semibold text-white">
                                {channel.name}
                            </h3>
                            <p className="truncate text-xs text-slate-400">
                                {channel.group.title}
                            </p>
                        </div>
                    </div>
                ))}
              </div>
            </div>
            )}
          </div>
        );
      default:
        return null;
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
      
      <main className="flex-1 relative overflow-hidden bg-background">
        {/* Sidebar Container */}
        <div 
          className={cn(
            "absolute inset-y-0 left-0 z-30 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] border-r border-white/5",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            isLibraryExpanded ? "w-full" : "w-80"
          )}
        >
          <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isExpanded={isLibraryExpanded}
          setIsExpanded={setIsLibraryExpanded}
          displayChannels={filteredChannels}
          totalChannels={totalFiltered}
          selectedChannel={selectedChannel}
          handleChannelClick={handleChannelSelect}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          loading={loading}
          isStopped={isStopped}
        />
        </div>

        {/* Player / Content Stage */}
        <div 
          className={cn(
            "absolute inset-y-0 right-0 flex flex-col transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] z-10",
            isSidebarOpen 
              ? (isLibraryExpanded ? "left-0 translate-x-full" : "left-80 translate-x-0") 
              : "left-0 translate-x-0"
          )}
        >
          {view === 'player' && (
            <Header
              selectedChannel={selectedChannel}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              isFavorite={isFavorite(selectedChannel)}
              onToggleFavorite={() => toggleFavorite(selectedChannel)}
            />
          )}

          {/* This container handles scrolling for all non-player views */}
          <div className={cn(
            "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent", 
            view === 'player' ? "hidden" : "block"
          )}>
            {renderContent()}
          </div>

          <VideoPlayer 
            channel={selectedChannel}
            onStreamError={handleNextChannel}
            onStreamSuccess={() => setFailCount(0)}
            autoSkip={settings.autoSkip}
            isMuted={settings.muteOnStartup}
            forceLiveEdge={settings.forceLiveEdge}
            onToggleLiveEdge={handleToggleLiveEdge}
            isPip={view !== 'player'}
            onExpand={() => setView('player')}
            onClose={() => setSelectedChannel(null)}
            onPrevChannel={handleManualNextChannel}
            onNextChannel={handleManualPrevChannel}
            onSelectChannel={setSelectedChannel}
            channelList={allChannels}
            showChannelStrip={settings.showChannelStrip}
            onToggleChannelStrip={handleToggleChannelStrip}
            retryTrigger={retryTrigger}
          />
        </div>
        
        {skipError && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 p-8 bg-card border border-border rounded-xl text-center">
              <AlertCircle className="w-16 h-16 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Auto-skip Paused</h2>
                <p className="text-muted-foreground">Too many dead channels detected (10+). Please select a channel manually.</p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => {
                    setSkipError(false);
                    setFailCount(0);
                    setIsStopped(true);
                    if (window.innerWidth >= 768) {
                      setIsSidebarOpen(true);
                    } else {
                      setView("home");
                    }
                  }} 
                  variant="outline" 
                  className="px-6"
                >
                  Select Manually
                </Button>
                <Button onClick={handleManualNextChannel} className="px-6">Try Next Channel</Button>
              </div>
            </div>
          </div>
        )}

        {!!channelToConfirm && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-md">
            <div className="bg-card border border-border rounded-xl text-center relative overflow-hidden">
              
              {/* Ghost content to force EXACT SAME SIZE as Auto-skip Paused popup */}
              <div className="invisible flex flex-col items-center gap-6 p-8" aria-hidden="true">
                <AlertCircle className="w-16 h-16" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Auto-skip Paused</h2>
                  <p className="text-muted-foreground">Too many dead channels detected (10+). Please select a channel manually.</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="px-6">Select Manually</Button>
                  <Button className="px-6">Try Next Channel</Button>
                </div>
              </div>

              {/* Visible Content */}
              <div className="absolute inset-0 flex flex-col items-center gap-6 p-8">
                <AlertCircle className="w-16 h-16 text-destructive" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Play this channel again?</h2>
                  <p className="text-muted-foreground">
                    This channel failed to load. Do you want to try playing it again?
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 mt-auto">
                  <Button 
                    onClick={() => setChannelToConfirm(null)} 
                    variant="outline" 
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedChannel(channelToConfirm);
                      setRetryTrigger(prev => prev + 1);
                      setFailCount(9);
                      setSkipError(false);
                      setIsStopped(false);
                      setView("player");
                      if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                      setChannelToConfirm(null);
                    }} 
                    className="px-6 bg-[#299fff] hover:bg-[#299fff]/80 text-white"
                  >
                    Play Anyway
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <SettingsView isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Apple Hello Style Loader */}
      {isLoading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#050505] animate-in fade-in duration-1000 overflow-hidden">
          {/* Apple-style background gradient layers */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Main central soft light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.04)_0%,_transparent_70%)]" />
            
            {/* Top left subtle purple bloom */}
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse duration-[10s]" />
            
            {/* Bottom right subtle blue bloom */}
            <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse duration-[8s] delay-1000" />
            
            {/* Soft edge vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.4)_100%)]" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px] w-full">
            {/* Animated Greeting Text */}
            <div className="relative overflow-hidden h-32 flex items-center justify-center w-full">
               {GREETINGS.map((text, idx) => (
                 <span 
                   key={text}
                   className={cn(
                     "absolute text-5xl md:text-7xl font-bold tracking-tight text-white transition-all duration-1000 ease-in-out transform-gpu",
                     idx === greetingIndex 
                      ? "opacity-100 translate-y-0 blur-0 scale-100" 
                      : "opacity-0 translate-y-8 blur-xl scale-90 pointer-events-none"
                   )}
                   style={{ fontFamily: 'var(--font-headline)' }}
                 >
                   {text}
                 </span>
               ))}
            </div>

            {/* Subtle Progress Indicator */}
            <div className="mt-12 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
               <div className="w-48 h-[1px] bg-white/10 overflow-hidden rounded-full">
                  <div className="h-full bg-white/40 animate-shimmer w-full translate-x-[-100%]" />
               </div>
               <div className="flex items-center gap-3">
                  <GtnLogo className="w-6 h-6 text-white/20 animate-pulse" />
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">GTNPlay Premium</span>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
