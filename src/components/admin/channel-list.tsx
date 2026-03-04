
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { manualParse, Channel } from '@/lib/m3u-parser';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Tv, Loader2, Search, Filter } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

type VisibilityMap = { [key: string]: boolean };
const BATCH_SIZE = 100;

interface ChannelListProps {
    onRefreshing?: (refreshing: boolean) => void;
    forcedPlaylistUrl?: string;
}

export function ChannelList({ onRefreshing, forcedPlaylistUrl }: ChannelListProps) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [visibility, setVisibility] = useState<VisibilityMap>({});
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    
    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onRefreshing?.(isRefreshing);
    }, [isRefreshing, onRefreshing]);

    const fetchChannelsAndVisibility = useCallback(async () => {
        setError(null);
        try {
            let playlistUrl = forcedPlaylistUrl;
            
            if (!playlistUrl) {
                const { data: settingsData } = await supabase
                    .from('settings')
                    .select('items')
                    .eq('id', 'playlists')
                    .single();
                
                const playlists = (settingsData?.items || []) as any[];
                playlistUrl = playlists.length > 0 ? playlists[0].url : 'https://iptv-org.github.io/iptv/index.m3u';
            }

            setLoading(true);

            // Using 'id' as per migration schema
            const { data: visibilityData, error: visibilityError } = await supabase
                .from('channel_visibility')
                .select('id, visible');
            
            if (visibilityError) throw visibilityError;

            const visibilityMap: VisibilityMap = {};
            visibilityData?.forEach(row => {
                visibilityMap[row.id] = row.visible;
            });
            setVisibility(visibilityMap);

            const response = await fetch(playlistUrl);
            if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            const m3uText = await response.text();
            const parsedPlaylist = manualParse(m3uText);
            const validChannels = parsedPlaylist.items.filter(c => c.url && c.tvg?.id);
            
            setChannels(validChannels);

        } catch (e: any) {
            const permissionError = new FirestorePermissionError({
                path: 'channel_visibility',
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);

            if (channels.length === 0) {
                setError(e.message || 'An unknown error occurred.');
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [channels.length, forcedPlaylistUrl]);

    useEffect(() => {
        fetchChannelsAndVisibility();
    }, [fetchChannelsAndVisibility]);

    const filteredChannels = useMemo(() => {
        return channels.filter(channel => {
            const name = channel.name.toLowerCase();
            const id = channel.tvg.id.toLowerCase();
            const search = searchTerm.toLowerCase();
            
            const matchesSearch = name.includes(search) || id.includes(search);
            
            const isGeoBlocked = channel.name.includes('[Geo-blocked]');
            const isNot247 = channel.name.includes('[Not 24/7]');
            
            const matchesGeo = activeFilters.includes('geo') ? isGeoBlocked : true;
            const matches247 = activeFilters.includes('not247') ? isNot247 : true;

            return matchesSearch && matchesGeo && matches247;
        });
    }, [channels, searchTerm, activeFilters]);

    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [searchTerm, activeFilters]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && filteredChannels.length > visibleCount) {
                    setVisibleCount((prev) => prev + BATCH_SIZE);
                }
            },
            { threshold: 0.1, root: containerRef.current }
        );

        const target = observerTarget.current;
        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) {
                observer.unobserve(target);
            }
        };
    }, [filteredChannels.length, visibleCount]);

    const handleVisibilityChange = async (channelId: string, isVisible: boolean) => {
        if (!channelId) return;
        
        setVisibility(prev => ({ ...prev, [channelId]: isVisible }));

        try {
            // Using 'id' as per migration schema
            const { error } = await supabase
                .from('channel_visibility')
                .upsert({ id: channelId, visible: isVisible }, { onConflict: 'id' });
            
            if (error) throw error;
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: `channel_visibility/${channelId}`,
                operation: 'write',
                requestResourceData: { id: channelId, visible: isVisible },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);

            setVisibility(prev => ({ ...prev, [channelId]: !isVisible }));
        }
    };

    const toggleFilter = (filter: string) => {
        setActiveFilters(prev => 
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        );
    };

    const displayedChannels = useMemo(() => {
        return filteredChannels.slice(0, visibleCount);
    }, [filteredChannels, visibleCount]);

    if (loading) {
        return (
             <div className="rounded-lg border border-[#333] overflow-hidden bg-[#1a1a1a]/50">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-[#1a1a1a] border-b-[#333]">
                            <TableHead className="w-[72px] px-4">Icon</TableHead>
                            <TableHead className="px-4">Channel</TableHead>
                            <TableHead className="px-4 w-[250px]">ID</TableHead>
                            <TableHead className="text-right px-4 w-[150px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(10)].map((_, i) => (
                            <TableRow key={i} className="border-b-[#333]">
                                <TableCell className="p-2">
                                    <Skeleton className="w-12 h-12 rounded-md" />
                                </TableCell>
                                <TableCell className="p-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </TableCell>
                                <TableCell className="p-4">
                                     <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-3">
                                        <Skeleton className="h-4 w-10" />
                                        <Skeleton className="h-6 w-11 rounded-full" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-400 bg-red-900/20 rounded-lg">
                <AlertCircle className="w-10 h-10 mb-4" />
                <h3 className="text-xl font-semibold">Error Loading Channels</h3>
                <p className="mt-2 text-center">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="relative space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                        placeholder="Search channels by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-[#0f0f0f] border-[#333] focus:border-purple-500 focus:ring-purple-500/20"
                    />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-2">
                        <Button
                            variant={activeFilters.includes('geo') ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter('geo')}
                            className={cn(
                                "h-9 px-4 rounded-full text-xs font-semibold transition-all",
                                activeFilters.includes('geo') 
                                    ? "bg-purple-600 hover:bg-purple-700 border-transparent shadow-lg shadow-purple-500/20" 
                                    : "bg-transparent border-[#333] text-gray-400 hover:text-white hover:border-gray-600"
                            )}
                        >
                            [Geo-blocked]
                        </Button>
                        <Button
                            variant={activeFilters.includes('not247') ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFilter('not247')}
                            className={cn(
                                "h-9 px-4 rounded-full text-xs font-semibold transition-all",
                                activeFilters.includes('not247') 
                                    ? "bg-purple-600 hover:bg-purple-700 border-transparent shadow-lg shadow-purple-500/20" 
                                    : "bg-transparent border-[#333] text-gray-400 hover:text-white hover:border-gray-600"
                            )}
                        >
                            [Not 24/7]
                        </Button>
                    </div>
                    {activeFilters.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setActiveFilters([])}
                            className="text-xs text-gray-500 hover:text-white h-9"
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Content */}
            <div className="rounded-lg border border-[#333] bg-[#1a1a1a]/30 overflow-hidden">
                <div 
                    ref={containerRef}
                    className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent"
                >
                    <Table className="min-w-[800px] table-fixed">
                        <TableHeader className="sticky top-0 bg-[#1a1a1a] z-10 shadow-sm shadow-black/20">
                            <TableRow className="border-b-[#333] hover:bg-[#1a1a1a]">
                                <TableHead className="w-[80px] px-4 bg-[#1a1a1a]">Icon</TableHead>
                                <TableHead className="px-4 bg-[#1a1a1a]">Channel</TableHead>
                                <TableHead className="px-4 w-[250px] bg-[#1a1a1a]">ID</TableHead>
                                <TableHead className="text-right px-4 w-[120px] bg-[#1a1a1a]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedChannels.map((channel, index) => {
                                const channelId = channel.tvg.id;
                                const isVisible = visibility[channelId] !== false; 
                                
                                return (
                                    <TableRow key={`${channelId}-${index}`} className="border-b-[#333] hover:bg-[#2a2a2a]/50 group">
                                        <TableCell className="p-2">
                                            <div className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-md overflow-hidden shrink-0">
                                                {channel.tvg.logo ? 
                                                    <img 
                                                        src={channel.tvg.logo} 
                                                        alt="" 
                                                        className="max-w-full max-h-full object-contain" 
                                                        onError={(e) => {(e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=?";}}
                                                        loading="lazy"
                                                    /> 
                                                    : <div className="w-12 h-12 flex items-center justify-center"><Tv className="w-6 h-6 text-muted-foreground" /></div>
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 font-medium text-white">
                                            <div className='overflow-hidden'>
                                                <p className="font-medium text-white truncate" title={channel.name}>{channel.name}</p>
                                                <p className="text-sm text-gray-400 truncate" title={channel.group.title || 'No Group'}>
                                                    {channel.group.title || 'No Group'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 text-sm text-gray-400 font-mono">
                                            <div className="truncate" title={channelId}>
                                                {channelId}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Label htmlFor={`switch-${channelId}-${index}`} className="text-sm text-gray-400 cursor-pointer hidden sm:block">
                                                    {isVisible ? 'On' : 'Off'}
                                                </Label>
                                                <Switch
                                                    id={`switch-${channelId}-${index}`}
                                                    checked={isVisible}
                                                    onCheckedChange={(checked) => handleVisibilityChange(channelId, checked)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <tr ref={observerTarget} className="h-10">
                                <td colSpan={4} className="text-center py-4">
                                    {visibleCount < filteredChannels.length && (
                                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading more...
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </TableBody>
                    </Table>
                </div>
            </div>
            {filteredChannels.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 border border-dashed border-[#333] rounded-lg mt-4 flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8 opacity-20" />
                    <p>No channels found matching your search or filters.</p>
                </div>
            )}
        </div>
    );
}
