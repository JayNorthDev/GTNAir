
"use client";
import { Search, Tv, X, ListVideo, Filter, LayoutGrid } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SidebarProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
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
      "absolute left-0 top-0 h-full z-40 bg-[#0a0a0a]/98 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col shadow-[40px_0_100px_rgba(0,0,0,0.9)] overflow-hidden",
      isSidebarOpen ? "w-80 opacity-100 translate-x-0" : "w-80 opacity-0 -translate-x-full pointer-events-none"
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
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search & Filter Section */}
      <div className="p-6 pb-2 shrink-0 space-y-4">
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

        <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Filter className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Filter by Category</span>
            </div>
            <div className="relative">
                <select
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    value={selectedCategory}
                    className="w-full bg-white/5 border border-white/5 text-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#299fff]/30 backdrop-blur-md appearance-none cursor-pointer hover:bg-white/10 transition-all"
                >
                    {categories.map(category => (
                        <option key={category} value={category} className="bg-[#1a1a1a] text-white">{category}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <LayoutGrid className="w-3 h-3" />
                </div>
            </div>
        </div>
      </div>

      {/* Channel List */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {loading && displayChannels.length === 0 ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-white/10 rounded" />
                  <div className="h-2 w-1/2 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {displayChannels.map((channel, index) => (
              <button
                key={`${channel.url}-${index}`}
                onClick={() => handleChannelClick(channel)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-2xl text-left transition-all duration-300 group",
                  selectedChannel?.url === channel.url 
                    ? "bg-[#299fff] text-white shadow-[0_0_20px_rgba(41,159,255,0.4)] scale-[1.02]" 
                    : "hover:bg-white/5 text-slate-300 hover:text-white"
                )}
              >
                <div className="relative shrink-0">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center transition-all",
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
                            <Tv className="w-6 h-6 opacity-20" />
                        )}
                    </div>
                    {selectedChannel?.url === channel.url && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-[#299fff] animate-pulse" />
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-xs truncate uppercase tracking-tight">{channel.name}</p>
                  <p className={cn(
                      "text-[10px] truncate font-medium uppercase tracking-tighter opacity-60",
                      selectedChannel?.url === channel.url ? "text-white" : "text-slate-400"
                  )}>
                    {channel.group.title || "Uncategorized"}
                  </p>
                </div>
              </button>
            ))}
            {displayChannels.length === 0 && searchTerm && (
              <div className="text-center py-20 px-4">
                <LayoutGrid className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Channels Found</p>
                <p className="text-[10px] text-slate-600 font-medium mt-1">Try a different search term or category</p>
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
