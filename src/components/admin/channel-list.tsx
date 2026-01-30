"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { manualParse, Channel } from '@/lib/m3u-parser';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Tv } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type VisibilityMap = { [key: string]: boolean };

export function ChannelList() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [visibility, setVisibility] = useState<VisibilityMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChannelsAndVisibility = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch playlist URL
            const playlistDocRef = doc(db, 'settings', 'playlist');
            const docSnap = await getDoc(playlistDocRef);
            let playlistUrl = 'https://iptv-org.github.io/iptv/index.m3u'; // Default
            if (docSnap.exists() && docSnap.data().url) {
                playlistUrl = docSnap.data().url;
            }

            // 2. Fetch and parse playlist
            const response = await fetch(playlistUrl);
            if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            const m3uText = await response.text();
            const parsedPlaylist = manualParse(m3uText);
            const validChannels = parsedPlaylist.items.filter(c => c.url && c.tvg?.id);
            setChannels(validChannels);

            // 3. Fetch visibility states from Firestore
            const visibilityCollection = collection(db, 'channel_visibility');
            const visibilitySnapshot = await getDocs(visibilityCollection);
            const visibilityMap: VisibilityMap = {};
            visibilitySnapshot.forEach(doc => {
                visibilityMap[doc.id] = doc.data().visible;
            });
            setVisibility(visibilityMap);

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChannelsAndVisibility();
    }, [fetchChannelsAndVisibility]);

    const handleVisibilityChange = async (channelId: string, isVisible: boolean) => {
        if (!channelId) return;
        
        // Optimistic update
        setVisibility(prev => ({ ...prev, [channelId]: isVisible }));

        try {
            const visibilityDocRef = doc(db, 'channel_visibility', channelId);
            await setDoc(visibilityDocRef, { visible: isVisible, channelId: channelId }, { merge: true });
        } catch (error) {
            console.error('Failed to update visibility:', error);
            // Revert optimistic update on error
            setVisibility(prev => ({ ...prev, [channelId]: !isVisible }));
            // Optionally, show a toast message to the user
        }
    };

    if (loading) {
        return (
             <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-[#0f0f0f] border border-[#333]">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-md" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                ))}
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
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {channels.map(channel => {
                const channelId = channel.tvg.id;
                // Default to visible if not in map
                const isVisible = visibility[channelId] !== false; 
                
                return (
                    <div key={channelId} className="flex items-center justify-between p-3 rounded-lg bg-[#0f0f0f] border border-transparent hover:border-[#333] transition-colors">
                        <div className="flex items-center gap-4 overflow-hidden">
                           {channel.tvg.logo ? 
                                <img src={channel.tvg.logo} alt="" className="w-10 h-10 object-contain rounded-md bg-black/20 shrink-0" onError={(e) => {(e.target as HTMLImageElement).style.display='none';}}/> 
                                : <div className="w-10 h-10 flex items-center justify-center bg-card rounded-md shrink-0"><Tv className="w-5 h-5 text-muted-foreground" /></div>
                            }
                            <div className='overflow-hidden'>
                                <p className="font-medium text-white truncate">{channel.name}</p>
                                <p className="text-sm text-gray-400 truncate">{channel.group.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <Label htmlFor={`switch-${channelId}`} className="text-sm text-gray-400">{isVisible ? 'Visible' : 'Hidden'}</Label>
                             <Switch
                                id={`switch-${channelId}`}
                                checked={isVisible}
                                onCheckedChange={(checked) => handleVisibilityChange(channelId, checked)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
