
"use client";

import { useState, useEffect } from "react";
import { ChannelList } from "@/components/admin/channel-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Layers } from "lucide-react";
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, DocumentData } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminChannelsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playlists, setPlaylists] = useState<DocumentData[]>([]);
  const [selectedPlaylistUrl, setSelectedPlaylistUrl] = useState<string>("");

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const q = query(collection(db, 'playlists'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlaylists(data);
        if (data.length > 0) {
          setSelectedPlaylistUrl(data[0].url);
        }
      } catch (error) {
        console.error("Error fetching playlists for admin:", error);
      }
    };
    fetchPlaylists();
  }, []);

  return (
    <div className="w-full space-y-6">
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Channel Management
            </CardTitle>
            <CardDescription>
              Toggle visibility for channels from your selected playlist source.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">SOURCE:</span>
              <Select value={selectedPlaylistUrl} onValueChange={setSelectedPlaylistUrl}>
                <SelectTrigger className="w-[200px] bg-black border-[#333] h-9">
                  <SelectValue placeholder="Select Playlist" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                  {playlists.map(pl => (
                    <SelectItem key={pl.id} value={pl.url}>{pl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-300 backdrop-blur-sm animate-pulse shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
            {selectedPlaylistUrl && (
              <ChannelList 
                key={selectedPlaylistUrl} 
                onRefreshing={setIsRefreshing} 
                forcedPlaylistUrl={selectedPlaylistUrl}
              />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
