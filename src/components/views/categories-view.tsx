
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, DocumentData } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { Loader, MonitorPlay, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type CategoriesViewProps = {
  onSelectPlaylist: (playlistId: string) => void;
  currentPlaylistId: string;
};

export function CategoriesView({ onSelectPlaylist, currentPlaylistId }: CategoriesViewProps) {
  const [playlists, setPlaylists] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'playlists'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        setPlaylists(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching playlists for categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Content Categories</h1>
        <p className="text-muted-foreground text-lg">Choose a playlist source to explore live channels.</p>
      </header>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-white/10">
          <MonitorPlay className="w-16 h-16 text-slate-600" />
          <h2 className="text-2xl font-semibold text-slate-300">No Playlists Available</h2>
          <p className="text-slate-500 max-w-sm">
            Contact your administrator to add M3U playlist sources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((pl) => (
            <Card 
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className={cn(
                "group relative overflow-hidden bg-slate-900/50 border-white/10 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-primary/50",
                currentPlaylistId === pl.id && "ring-2 ring-primary border-transparent"
              )}
            >
              <CardContent className="p-0">
                <div className="aspect-[16/9] relative bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                   <Layers className={cn(
                     "w-16 h-16 transition-transform duration-500 group-hover:scale-110",
                     currentPlaylistId === pl.id ? "text-primary" : "text-slate-700"
                   )} />
                   {currentPlaylistId === pl.id && (
                     <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold">ACTIVE</Badge>
                   )}
                </div>
                <div className="p-6 space-y-2 bg-black/40 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{pl.name}</h3>
                  <div className="flex items-center text-slate-400 text-sm">
                    <MonitorPlay className="w-4 h-4 mr-2" />
                    Live Stream Source
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
