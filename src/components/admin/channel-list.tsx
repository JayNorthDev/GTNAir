"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { manualParse, Channel } from '@/lib/m3u-parser';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Tv, Loader2 } from 'lucide-react';
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

type VisibilityMap = { [key: string]: boolean };
const CACHE_PREFIX = 'admin_playlist_cache_';
const BATCH_SIZE = 100;

interface ChannelListProps {
    onRefreshing?: (refreshing: boolean) => void;
}

export function ChannelList({ onRefreshing }: ChannelListProps) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [visibility, setVisibility] = useState<VisibilityMap>({});
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onRefreshing?.(isRefreshing);
    }, [isRefreshing, onRefreshing]);

    const fetchChannelsAndVisibility = useCallback(async () => {
        setError(null);
        try {
            const playlistDocRef = doc(db, 'settings', 'playlist');
            const docSnap = await getDoc(playlistDocRef);
            let playlistUrl = 'https://iptv-org.github.io/iptv/index.m3u'; 
            if (docSnap.exists() && docSnap.data().url) {
                playlistUrl = docSnap.data().url;
            }

            const cacheKey = `${CACHE_PREFIX}${playlistUrl}`;
            const cachedContent = localStorage.getItem(cacheKey);
            if (cachedContent) {
                try {
                    const cachedData = JSON.parse(cachedContent);
                    if (cachedData && Array.isArray(cachedData.items)) {
                        setChannels(cachedData.items);
                        setLoading(false);
                        setIsRefreshing(true);
                    }
                } catch (e) {
                    console.warn('Admin cache parse failed', e);
                }
            } else {
                setLoading(true);
            }

            const visibilityCollection = collection(db, 'channel_visibility');
            const visibilitySnapshot = await getDocs(visibilityCollection);
            const visibilityMap: VisibilityMap = {};
            visibilitySnapshot.forEach(doc => {
                visibilityMap[doc.id] = doc.data().visible;
            });
            setVisibility(visibilityMap);

            const response = await fetch(playlistUrl);
            if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            const m3uText = await response.text();
            const parsedPlaylist = manualParse(m3uText);
            const validChannels = parsedPlaylist.items.filter(c => c.url && c.tvg?.id);
            
            setChannels(validChannels);

            try {
                localStorage.setItem(cacheKey, JSON.stringify({ items: validChannels, timestamp: Date.now() }));
            } catch (e) {
                console.warn('Admin LocalStorage quota exceeded');
            }

        } catch (e: any) {
            if (channels.length === 0) {
                setError(e.message || 'An unknown error occurred.');
            }
            console.error(e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [channels.length]);

    useEffect(() => {
        fetchChannelsAndVisibility();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && channels.length > visibleCount) {
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
    }, [channels.length, visibleCount]);

    const handleVisibilityChange = async (channelId: string, isVisible: boolean) => {
        if (!channelId) return;
        
        setVisibility(prev => ({ ...prev, [channelId]: isVisible }));

        try {
            const visibilityDocRef = doc(db, 'channel_visibility', channelId);
            setDoc(visibilityDocRef, { visible: isVisible, channelId: channelId }, { merge: true })
                .catch((error) => {
                    console.error('Failed to update visibility:', error);
                    setVisibility(prev => ({ ...prev, [channelId]: !isVisible }));
                });
        } catch (error) {
            console.error('Failed to initiate visibility update:', error);
        }
    };

    const displayedChannels = useMemo(() => {
        return channels.slice(0, visibleCount);
    }, [channels, visibleCount]);

    if (loading) {
        return (
             <div className="rounded-lg border border-[#333] overflow-hidden bg-[#1a1a1a]/50">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-[#1a1a1a] border-b-[#333]">
                            <TableHead className="w-[72px] px-4">Icon</TableHead>
                            <TableHead className="px-4 w-[250px]">ID</TableHead>
                            <TableHead className="px-4">Channel</TableHead>
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
                                     <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell className="p-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
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
        <div className="relative">
            <div className="rounded-lg border border-[#333] bg-[#1a1a1a]/30 overflow-hidden">
                <div 
                    ref={containerRef}
                    className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent"
                >
                    <Table className="min-w-[800px] table-fixed">
                        <TableHeader className="sticky top-0 bg-[#1a1a1a] z-10 shadow-sm shadow-black/20">
                            <TableRow className="border-b-[#333] hover:bg-[#1a1a1a]">
                                <TableHead className="w-[80px] px-4 bg-[#1a1a1a]">Icon</TableHead>
                                <TableHead className="px-4 w-[250px] bg-[#1a1a1a]">ID</TableHead>
                                <TableHead className="px-4 bg-[#1a1a1a]">Channel</TableHead>
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
                                        <TableCell className="p-4 text-sm text-gray-400 font-mono">
                                            <div className="truncate" title={channelId}>
                                                {channelId}
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
                                    {visibleCount < channels.length && (
                                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading more channels...
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </TableBody>
                    </Table>
                </div>
            </div>
            {channels.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 border border-dashed border-[#333] rounded-lg mt-4">
                    No channels found in the playlist.
                </div>
            )}
        </div>
    );
}