
"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/firebase/config';
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { Loader, MonitorPlay, Layers, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type CategoriesViewProps = {
  onSelectPlaylist: (playlistId: string) => void;
  currentPlaylistId: string;
};

export function CategoriesView({ onSelectPlaylist, currentPlaylistId }: CategoriesViewProps) {
  const [playlists, setPlaylists] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'playlists'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({
        path: 'playlists',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const groupedPlaylists = useMemo(() => {
    return {
      main: playlists.filter(p => p.category === 'Main Playlists' || !p.category),
      sub: playlists.filter(p => p.category === 'Sub Playlists')
    };
  }, [playlists]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderSection = (title: string, items: DocumentData[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-l-4 border-primary pl-4 py-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
            {items.length}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((pl) => (
            <Card 
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className={cn(
                "group relative overflow-hidden bg-slate-900/50 border-white/5 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:border-primary/50",
                currentPlaylistId === pl.id && "ring-2 ring-primary border-transparent"
              )}
            >
              <CardContent className="p-0">
                <div className="aspect-[16/9] relative bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center overflow-hidden">
                   <Layers className={cn(
                     "w-16 h-16 transition-all duration-500 group-hover:scale-110",
                     currentPlaylistId === pl.id ? "text-primary drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]" : "text-slate-700"
                   )} />
                   {currentPlaylistId === pl.id && (
                     <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold shadow-lg">ACTIVE</Badge>
                   )}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
                        <ChevronRight className="w-8 h-8 text-primary" />
                      </div>
                   </div>
                </div>
                <div className="p-6 space-y-2 bg-black/60 backdrop-blur-sm border-t border-white/5">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">{pl.name}</h3>
                  <div className="flex items-center text-slate-400 text-sm">
                    <MonitorPlay className="w-4 h-4 mr-2 text-primary/70" />
                    Live Stream Source
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2 border-b border-white/5 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">Content Categories</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Choose a playlist source below to explore our vast library of premium channels. Select a source to activate it in the player.
        </p>
      </header>

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
          <MonitorPlay className="w-20 h-20 text-slate-700" />
          <h2 className="text-2xl font-semibold text-slate-300">No Playlists Available</h2>
          <p className="text-slate-500 max-w-sm">
            Contact your administrator to add M3U playlist sources to your account.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {renderSection("Main Playlists", groupedPlaylists.main)}
          {renderSection("Sub Playlists", groupedPlaylists.sub)}
        </div>
      )}
    </div>
  );
}
