
"use client";
import { useEffect, useRef, useState } from 'react';
import { Search, Tv, ListVideo, Filter, Maximize2, Minimize2, Play, Square, ArrowUpNarrowWide } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SidebarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  displayChannels: Channel[];
  totalChannels: number;
  selectedChannel: Channel | null;
  handleChannelClick: (channel: Channel) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  loading: boolean;
  isStopped: boolean;
};

export default function Sidebar({
  isSidebarOpen,
  isExpanded,
  setIsExpanded,
  displayChannels,
  totalChannels,
  selectedChannel,
  handleChannelClick,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  loading,
  isStopped,
}: SidebarProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Dynamically calculate columns based on container width to support responsive grid virtualization
  useEffect(() => {
    if (!parentRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (!isExpanded) {
          setColumns(1);
          continue;
        }
        const width = entry.contentRect.width;
        // Breakpoints approximate matching Tailwind's grid layout relative to container width
        if (width >= 1200) setColumns(6);
        else if (width >= 960) setColumns(5);
        else if (width >= 720) setColumns(4);
        else if (width >= 540) setColumns(3);
        else setColumns(2);
      }
    });

    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, [isExpanded]);

  const rowCount = Math.ceil(displayChannels.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isExpanded ? 150 : 64, // Approximate row heights
    overscan: 5,
  });

  // Auto-scroll active channel into view using the virtualizer
  useEffect(() => {
    if (isSidebarOpen && selectedChannel) {
      const index = displayChannels.findIndex(c => c.url === selectedChannel.url);
      if (index !== -1) {
        const rowIndex = Math.floor(index / columns);
        // Add a slight delay to ensure virtualizer is ready after opening
        setTimeout(() => virtualizer.scrollToIndex(rowIndex, { align: 'auto' }), 50);
      }
    }
  }, [selectedChannel, isSidebarOpen, displayChannels, columns, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const activeChannelIndex = selectedChannel ? displayChannels.findIndex(c => c.url === selectedChannel.url) : -1;
  const activeRowIndex = activeChannelIndex !== -1 ? Math.floor(activeChannelIndex / columns) : -1;
  const isActiveVisible = virtualItems.some(item => item.index === activeRowIndex);
  const showScrollToActive = activeChannelIndex !== -1 && !isActiveVisible;
  const isActiveBelow = virtualItems.length > 0 && activeRowIndex > virtualItems[virtualItems.length - 1].index;

  return (
    <aside className={cn(
      "h-full flex flex-col overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] relative",
      "bg-gradient-to-br from-slate-900 via-black to-slate-800 backdrop-blur-[50px] border-l border-white/5 shadow-2xl",
      isExpanded ? "w-full" : "w-80"
    )}>
      {/* Subtle Blue Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(41,159,255,0.05),_transparent_40%)]" />

      <div className={cn(
        "h-full flex flex-col transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] relative z-10",
        isExpanded ? "w-full" : "w-80"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 h-20 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#299fff]/10 border border-[#299fff]/20">
              <ListVideo className="w-5 h-5 text-[#299fff]" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-[0.2em]">Channel Library</h1>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse View" : "Expand over Player"}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className={cn(
          "p-6 pb-2 shrink-0 transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
          isExpanded ? "space-y-6" : "space-y-4"
        )}>
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#299fff] transition-colors" />
            <input
              type="text"
              placeholder="Search for channels..."
              className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#299fff]/30 focus:border-[#299fff]/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Selection */}
          {isExpanded ? (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-4 scrollbar-none no-scrollbar -mx-2 px-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border shrink-0",
                    selectedCategory === category
                      ? "bg-[#299fff]/10 border-[#299fff]/40 text-white shadow-[0_4px_12px_rgba(41,159,255,0.1)] scale-105"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Filter by Category</span>
                </div>
                <div className="px-3 rounded-full bg-[#299fff]/10 border border-[#299fff]/5 shadow-[0_0_12px_rgba(41,159,255,0.1)] flex items-center justify-center h-6">
                  <span className="text-[9px] font-black text-[#299fff] tracking-[0.1em] leading-none uppercase whitespace-nowrap">
                    {totalChannels} STREAMS
                  </span>
                </div>
              </div>

              <div className="relative">
                <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                  <SelectTrigger className="w-full h-12 bg-black/40 border border-white/5 text-slate-300 rounded-2xl px-5 text-[11px] font-bold uppercase tracking-widest focus:ring-0 focus:border-white/20 hover:bg-white/10 hover:text-white transition-all duration-300 shadow-lg outline-none data-[state=open]:bg-white/10 data-[state=open]:border-white/20 data-[state=open]:text-white data-[state=open]:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent 
                    className="smooth-dropdown backdrop-blur-[60px] border border-white/10 text-white rounded-2xl shadow-[0_0_40px_-10px_rgba(41,159,255,0.1),0_30px_80px_-15px_rgba(0,0,0,0.9)] z-[100] overflow-hidden max-h-[440px]"
                    style={{
                      background:
                        "radial-gradient(125% 125% at 50% 10%, #0F0F1166 30%, #3ca2fa44 80%)",
                    }}
                  >
                    <div className="pt-2 pb-2 px-2 relative flex flex-col pl-6">
                      {/* Left vertical static track */}
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent">
                        {/* Animated Glider */}
                        <div
                          className="relative w-full bg-gradient-to-b from-transparent via-[#299fff] to-transparent transition-transform duration-500 ease-[cubic-bezier(0.37,1.95,0.66,0.56)]"
                          style={{ 
                            height: '44px',
                            transform: `translateY(${Math.max(0, categories.indexOf(hoveredCategory || selectedCategory)) * 100}%)` 
                          }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 h-3/5 w-[300%] bg-[#299fff] blur-[10px]" />
                          <div className="absolute left-0 h-full w-56 bg-gradient-to-r from-[#299fff]/20 to-transparent pointer-events-none" />
                        </div>
                      </div>

                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          onMouseEnter={() => setHoveredCategory(category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          onFocus={() => setHoveredCategory(category)}
                          onBlur={() => setHoveredCategory(null)}
                          className="h-[44px] flex items-center text-[11px] font-bold uppercase tracking-[0.15em] text-white/50 hover:text-white focus:text-white data-[state=checked]:text-[#299fff] pl-5 pr-10 cursor-pointer transition-colors duration-200 outline-none relative z-10 hover:bg-transparent focus:bg-transparent data-[state=checked]:bg-transparent [&>span.absolute]:!left-auto [&>span.absolute]:right-4 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-[#299fff]"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Channel List / Grid */}
        <nav ref={parentRef} className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading && displayChannels.length === 0 ? (
            <div className={cn(
              "grid gap-4",
              isExpanded ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6" : "grid-cols-1"
            )}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={cn(
                  "rounded-2xl bg-white/5 animate-pulse",
                  isExpanded ? "aspect-[16/10]" : "flex items-center gap-3 p-3 h-[60px]"
                )}>
                  {!isExpanded && <div className="bg-white/10 rounded-xl w-11 h-11 shrink-0" />}
                  <div className={cn("bg-white/10 rounded-xl flex-1", isExpanded ? "h-full" : "h-4")} />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * columns;
                const rowChannels = displayChannels.slice(startIndex, startIndex + columns);

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pb-4"
                  >
                    <div 
                      className="grid gap-4" 
                      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                      {rowChannels.map((channel, index) => {
                        const isActive = selectedChannel?.url === channel.url;
                        return isExpanded ? (
                          <div
                            key={channel.url}
                            onClick={() => handleChannelClick(channel)}
                            className={cn(
                              "group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl bg-white/5 border border-transparent transition-all duration-200 ease-out transform-gpu will-change-transform",
                              isActive && "bg-black/20 border-white/5 shadow-xl scale-[1.03]"
                            )}
                          >
                            <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/20">
                              {channel.tvg.logo ? (
                                <img
                                  src={channel.tvg.logo}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <Tv className="w-10 h-10 text-white/10" />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="truncate text-xs font-black text-white uppercase tracking-tight">
                                {channel.name}
                              </h3>
                              <p className="truncate text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                {channel.group.title}
                              </p>
                            </div>
                            {isActive && (
                              <div className={cn("absolute top-3 right-3 p-1.5 rounded-full border", isStopped ? "bg-red-500/20 border-red-500/30" : "bg-[#299fff]/20 border-[#299fff]/30")}>
                                {isStopped ? (
                                  <Square className="w-2.5 h-2.5 text-red-500 fill-current" />
                                ) : (
                                  <Play className="w-2.5 h-2.5 text-[#299fff] fill-current" />
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            key={channel.url}
                            onClick={() => handleChannelClick(channel)}
                            className={cn(
                              "relative w-full flex items-center gap-4 py-2 px-3 rounded-2xl text-left transition-all duration-200 group border border-transparent transform-gpu will-change-transform",
                              isActive
                                ? "bg-black/20 border-white/5 text-white shadow-xl scale-[1.02]"
                                : "hover:bg-white/5 text-slate-300 hover:text-white"
                            )}
                          >
                            <div className="relative shrink-0">
                              <div className={cn(
                                "w-11 h-11 rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center transition-all duration-200",
                                isActive ? "border-white/5" : "group-hover:border-white/5"
                              )}>
                                {channel.tvg.logo ? (
                                  <img
                                    src={channel.tvg.logo}
                                    alt=""
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <Tv className="w-5 h-5 opacity-20" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-xs truncate uppercase tracking-tight">{channel.name}</p>
                              <p className={cn(
                                "text-[10px] truncate font-medium uppercase tracking-tighter opacity-60",
                                isActive ? "text-white" : "text-slate-400"
                              )}>
                                {channel.group.title || "General"}
                              </p>
                            </div>
                            {isActive && (
                              <div className={cn("absolute top-2.5 right-3.5 p-1 rounded-full border", isStopped ? "bg-red-500/10 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "bg-[#299fff]/10 border-[#299fff]/20 shadow-[0_0_8px_rgba(41,159,255,0.3)]")}>
                                {isStopped ? (
                                  <Square className="w-2.5 h-2.5 text-red-500 fill-current" />
                                ) : (
                                  <Play className="w-2.5 h-2.5 text-[#299fff] fill-current" />
                                )}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Scroll to Active Channel Button */}
      {showScrollToActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (activeRowIndex !== -1) {
              const currentTop = virtualItems.length > 0 ? virtualItems[0].index : 0;
              const distance = Math.abs(activeRowIndex - currentTop);
              
              if (distance > 25) {
                // Instantly jump to 15 rows away to avoid a very long scrolling time
                const nearIndex = activeRowIndex > currentTop ? activeRowIndex - 15 : activeRowIndex + 15;
                virtualizer.scrollToIndex(Math.max(0, nearIndex), { align: 'center', behavior: 'auto' });
                
                // Give the browser 100ms to render the new virtual DOM nodes, then smooth glide
                setTimeout(() => {
                  virtualizer.scrollToIndex(activeRowIndex, { align: 'center', behavior: 'smooth' });
                }, 100);
              } else {
                virtualizer.scrollToIndex(activeRowIndex, { align: 'center', behavior: 'smooth' });
              }
            }
          }}
          className="absolute bottom-6 right-6 z-50 p-3 rounded-full bg-[#299fff] text-white shadow-[0_0_20px_rgba(41,159,255,0.4)] hover:scale-110 transition-all duration-300 active:scale-95 group"
          title="Scroll to playing channel"
        >
          <ArrowUpNarrowWide className={cn("w-5 h-5 transition-transform duration-300", isActiveBelow ? "scale-y-[-1]" : "")} />
        </button>
      )}
    </aside>
  );
}
