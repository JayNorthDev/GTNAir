
"use client";

import { useState, useEffect, useCallback } from 'react';
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

type VisibilityMap = { [key: string]: boolean };
const CACHE_PREFIX = 'admin_playlist_cache_';

export function ChannelList() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [visibility, setVisibility] = useState<VisibilityMap>({});
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChannelsAndVisibility = useCallback(async () => {
        setError(null);
        try {
            // 1. Fetch playlist URL
            const playlistDocRef = doc(db, 'settings', 'playlist');
            const docSnap = await getDoc(playlistDocRef);
            let playlistUrl = 'https://iptv-org.github.io/iptv/index.m3u'; 
            if (docSnap.exists() && docSnap.data().url) {
                playlistUrl = docSnap.data().url;
            }

            // 2. Check Cache for instant load
            const cacheKey = `${CACHE_PREFIX}${playlistUrl}`;
            const cachedContent = localStorage.getItem(cacheKey);
            if (cachedContent) {
                try {
                    const cachedData = JSON.parse(cachedContent);
                    if (cachedData && Array.isArray(cachedData.items)) {
                        setChannels(cachedData.items);
                        setLoading(false);
                        setIsRefreshing(true); // Indicate background refresh
                    }
                } catch (e) {
                    console.warn('Admin cache parse failed', e);
                }
            } else {
                setLoading(true);
            }

            // 3. Fetch Visibility States
            const visibilityCollection = collection(db, 'channel_visibility');
            const visibilitySnapshot = await getDocs(visibilityCollection);
            const visibilityMap: VisibilityMap = {};
            visibilitySnapshot.forEach(doc => {
                visibilityMap[doc.id] = doc.data().visible;
            });
            setVisibility(visibilityMap);

            // 4. Fetch and Parse Playlist (Refresh)
            const response = await fetch(playlistUrl);
            if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            const m3uText = await response.text();
            const parsedPlaylist = manualParse(m3uText);
            const validChannels = parsedPlaylist.items.filter(c => c.url && c.tvg?.id);
            
            setChannels(validChannels);

            // Update cache
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

    const handleVisibilityChange = async (channelId: string, isVisible: boolean) => {
        if (!channelId) return;
        
        setVisibility(prev => ({ ...prev, [channelId]: isVisible }));

        try {
            const visibilityDocRef = doc(db, 'channel_visibility', channelId);
            await setDoc(visibilityDocRef, { visible: isVisible, channelId: channelId }, { merge: true });
        } catch (error) {
            console.error('Failed to update visibility:', error);
            setVisibility(prev => ({ ...prev, [channelId]: !isVisible }));
        }
    };

    if (loading) {
        return (
             <div className="rounded-lg border border-[#333] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-[#1a1a1a]">
                            <TableHead className="w-[72px] px-4">Icon</TableHead>
                            <TableHead className="px-4">Channel</TableHead>
                            <TableHead className="px-4">ID</TableHead>
                            <TableHead className="text-right px-4">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(15)].map((_, i) => (
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
        <div className="relative">
            {isRefreshing && (
                <div className="absolute top-2 right-4 z-20 flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-300 backdrop-blur-sm animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating playlist...
                </div>
            )}
            <div className="rounded-lg border border-[#333] overflow-hidden max-h-[calc(100vh-280px)] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-[#1a1a1a]/80 backdrop-blur-sm z-10">
                        <TableRow className="border-b-[#333] hover:bg-[#1a1a1a]">
                            <TableHead className="w-[72px] px-4">Icon</TableHead>
                            <TableHead className="px-4">Channel</TableHead>
                            <TableHead className="px-4">ID</TableHead>
                            <TableHead className="text-right px-4">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {channels.map(channel => {
                            const channelId = channel.tvg.id;
                            const isVisible = visibility[channelId] !== false; 
                            
                            return (
                                <TableRow key={channelId} className="border-b-[#333] hover:bg-[#2a2a2a]/50">
                                    <TableCell className="p-2">
                                        <div className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-md">
                                            {channel.tvg.logo ? 
                                                <img src={channel.tvg.logo} alt="" className="max-w-full max-h-full object-contain" onError={(e) => {(e.target as HTMLImageElement).closest('div')?.remove();}}/> 
                                                : <div className="w-12 h-12 flex items-center justify-center"><Tv className="w-6 h-6 text-muted-foreground" /></div>
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-4 font-medium text-white">
                                        <div className='overflow-hidden'>
                                            <p className="font-medium text-white truncate">{channel.name}</p>
                                            <p className="text-sm text-gray-400 truncate">{channel.group.title}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-4 text-sm text-gray-400 font-mono">
                                        {channelId}
                                    </TableCell>
                                    <TableCell className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Label htmlFor={`switch-${channelId}`} className="text-sm text-gray-400">{isVisible ? 'On' : 'Off'}</Label>
                                            <Switch
                                                id={`switch-${channelId}`}
                                                checked={isVisible}
                                                onCheckedChange={(checked) => handleVisibilityChange(channelId, checked)}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
