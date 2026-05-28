
"use client";
import { Search, Tv, ListVideo, Filter, LayoutGrid, Maximize2, Minimize2 } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SidebarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  displayChannels: Channel[];
  selectedChannel: Channel | null;
  handleChannelClick: (channel: Channel) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  loading: boolean;
};

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  isExpanded,
  setIsExpanded,
  displayChannels,
  selectedChannel,
  handleChannelClick,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  loading,
}: SidebarProps) {
  return (
    <aside className={cn(
      "h-full flex flex-col overflow-hidden bg-transparent transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
      isExpanded ? "w-full" : "w-80"
    )}>
      {/* Content wrapper - fixed width for normal mode to avoid layout shifts during transitions */}
      <div className={cn(
        "h-full flex flex-col transition-all duration-700",
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
              <p className="text-[10px] text-slate-500 font-bold uppercase">{displayChannels.length} Streams Available</p>
            </div>
          </div>
          {/* Expansion Toggle Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse View" : "Expand over Player"}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className={cn(
            "p-6 pb-2 shrink-0 transition-all duration-500",
            isExpanded ? "space-y-6" : "space-y-4"
        )}>
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#299fff] transition-colors" />
            <input
              type="text"
              placeholder="Search for channels..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#299fff]/30 focus:border-[#299fff]/50 transition-all"
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
                      ? "bg-[#299fff] border-[#299fff] text-white shadow-[0_4px_12px_rgba(41,159,255,0.2)] scale-105"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Filter className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Filter by Category</span>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full bg-white/5 border-white/5 text-slate-200 rounded-2xl h-12 px-4 focus:ring-[#299fff]/30">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white max-h-80">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="focus:bg-[#299fff] focus:text-white">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Channel List / Grid */}
        <nav className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
            <div className={cn(
                "grid transition-all duration-700 ease-in-out gap-4",
                isExpanded 
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
                    : "grid-cols-1"
            )}>
              {displayChannels.map((channel, index) => (
                isExpanded ? (
                    <div
                        key={`${channel.url}-${index}`}
                        onClick={() => handleChannelClick(channel)}
                        className={cn(
                            "group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl bg-white/5 border border-white/5",
                            "transition-all duration-300 ease-in-out hover:z-10 hover:scale-105 hover:shadow-2xl hover:shadow-black/50 hover:ring-2 hover:ring-[#299fff] focus:ring-2 focus:ring-[#299fff]",
                            selectedChannel?.url === channel.url && "ring-2 ring-[#299fff] bg-[#299fff]/10"
                        )}
                    >
                        <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/20">
                            {channel.tvg.logo ? (
                                <img 
                                    src={channel.tvg.logo} 
                                    alt="" 
                                    className="w-full h-full object-contain" 
                                    onError={(e) => {(e.target as HTMLImageElement).style.display='none';}}
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
                        {selectedChannel?.url === channel.url && (
                             <div className="absolute top-3 right-3 w-2 h-2 bg-[#299fff] rounded-full shadow-[0_0_10px_rgba(41,159,255,1)] animate-pulse" />
                        )}
                    </div>
                ) : (
                    <button
                        key={`${channel.url}-${index}`}
                        onClick={() => handleChannelClick(channel)}
                        className={cn(
                            "w-full flex items-center gap-4 py-2 px-3 rounded-2xl text-left transition-all duration-300 group",
                            selectedChannel?.url === channel.url 
                            ? "bg-[#299fff] text-white shadow-[0_4px_12px_rgba(41,159,255,0.2)] scale-[1.01]" 
                            : "hover:bg-white/5 text-slate-300 hover:text-white"
                        )}
                    >
                        <div className="relative shrink-0">
                            <div className={cn(
                                "w-11 h-11 rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center transition-all",
                                selectedChannel?.url === channel.url ? "border-white/20" : "group-hover:border-white/10"
                            )}>
                                {channel.tvg.logo ? (
                                    <img 
                                        src={channel.tvg.logo} 
                                        alt="" 
                                        className="w-full h-full object-contain p-1" 
                                        onError={(e) => {(e.target as HTMLImageElement).style.display='none';}}
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
                                selectedChannel?.url === channel.url ? "text-white" : "text-slate-400"
                            )}>
                            {channel.group.title || "General"}
                            </p>
                        </div>
                    </button>
                )
              ))}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
