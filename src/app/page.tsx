"use client";

import { useState, useEffect } from "react";
import { useChannels } from "@/hooks/useChannels";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VideoPlayer from "@/components/player/VideoPlayer";
import { Channel } from "@/lib/m3u-parser";
import { AlertTriangle, Loader } from "lucide-react";
import { NavRail } from "@/components/layout/nav-rail";
import { HomeGrid } from "@/components/views/home-grid";

export default function Home() {
  const { allChannels, displayChannels, categories, loading, error, filterChannels } = useChannels();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<"home" | "player">("home");

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
  
  if (loading && allChannels.length === 0) {
    return (
        <div className="flex h-screen items-center justify-center text-foreground">
            <div className="flex flex-col items-center gap-4">
                <Loader className="w-12 h-12 animate-spin text-primary" />
                <h2 className="text-xl font-medium text-muted-foreground">Loading Channels...</h2>
            </div>
        </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden text-foreground">
      <NavRail view={view} setView={setView} />
      <main className="flex-1 overflow-hidden">
        {view === "home" && (
            <HomeGrid channels={allChannels} onChannelSelect={handleChannelClick} />
        )}
        {view === "player" && (
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
                setIsSidebarOpen={setIsSidebarOpen}
              />
              <VideoPlayer channel={selectedChannel} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
