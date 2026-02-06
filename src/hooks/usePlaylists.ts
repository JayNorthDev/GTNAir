
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Playlist {
  id: string;
  name: string;
  url: string;
  category: 'Main Playlists' | 'Sub Playlists';
  order: number;
  updatedAt: string;
}

// Global cache to avoid re-fetching when moving between views
let globalPlaylistsCache: Playlist[] | null = null;
let globalPlaylistsLoading = true;
let subscribers: ((playlists: Playlist[]) => void)[] = [];

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(globalPlaylistsCache || []);
  const [isLoading, setIsLoading] = useState(globalPlaylistsLoading);

  useEffect(() => {
    const playlistsDocRef = doc(db, 'settings', 'playlists');

    const unsubscribe = onSnapshot(playlistsDocRef, (snapshot) => {
      const data = snapshot.data();
      const items = (data?.items || []) as Playlist[];
      
      // Sort by order ASC
      const sortedItems = [...items].sort((a, b) => a.order - b.order);
      
      globalPlaylistsCache = sortedItems;
      globalPlaylistsLoading = false;
      
      setPlaylists(sortedItems);
      setIsLoading(false);
      
      // Notify other hook instances
      subscribers.forEach(sub => sub(sortedItems));
    }, (error) => {
      console.error("Playlists sync error:", error);
      const permissionError = new FirestorePermissionError({
        path: 'settings/playlists',
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    const sub = (newPlaylists: Playlist[]) => setPlaylists(newPlaylists);
    subscribers.push(sub);

    return () => {
      unsubscribe();
      subscribers = subscribers.filter(s => s !== sub);
    };
  }, []);

  return { playlists, isLoading };
}

/**
 * Administrative helper to update playlists
 */
export async function updateAllPlaylists(items: Playlist[]) {
  const docRef = doc(db, 'settings', 'playlists');
  
  // Try to update, if doc doesn't exist, create it
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, { items });
    } else {
      await updateDoc(docRef, { items });
    }
  } catch (error) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'write',
      requestResourceData: { items },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  }
}
