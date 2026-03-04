
"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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

const PLAYLISTS_DOC_CACHE_KEY = 'gtnplay_playlists_definitions_v1';
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

// Global in-memory cache
let globalPlaylistsCache: Playlist[] | null = null;
let subscribers: ((playlists: Playlist[]) => void)[] = [];

/**
 * Internal helper to get cached data from localStorage
 */
function getLocalCache(): { items: Playlist[]; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(PLAYLISTS_DOC_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    return null;
  }
}

/**
 * Internal helper to set local cache
 */
function setLocalCache(items: Playlist[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYLISTS_DOC_CACHE_KEY, JSON.stringify({
      items,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('LocalStorage quota exceeded for playlist definitions');
  }
}

/**
 * Fetches the playlist definitions from Supabase
 */
async function fetchPlaylistsFromSupabase(): Promise<Playlist[]> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('items')
      .eq('id', 'playlists')
      .single();

    if (error) throw error;
    
    const items = (data?.items || []) as Playlist[];
    const sorted = [...items].sort((a, b) => a.order - b.order);
    
    // Update caches
    setLocalCache(sorted);
    globalPlaylistsCache = sorted;
    
    return sorted;
  } catch (error: any) {
    console.error('Supabase fetch error:', error);
    const permissionError = new FirestorePermissionError({
      path: 'settings/playlists',
      operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    return [];
  }
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(globalPlaylistsCache || []);
  const [isLoading, setIsLoading] = useState(!globalPlaylistsCache);

  const refresh = useCallback(async (forceSupabase = false) => {
    setIsLoading(true);
    
    let items: Playlist[] = [];
    
    if (!forceSupabase) {
      const cached = getLocalCache();
      const isExpired = cached ? (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) : true;
      
      if (cached && !isExpired) {
        items = cached.items;
      }
    }

    // If no valid cache or forced, hit Supabase
    if (items.length === 0) {
      items = await fetchPlaylistsFromSupabase();
    }

    globalPlaylistsCache = items;
    setPlaylists(items);
    setIsLoading(false);
    
    // Notify other hook instances
    subscribers.forEach(sub => sub(items));
  }, []);

  useEffect(() => {
    if (!globalPlaylistsCache) {
      refresh();
    }

    const sub = (newPlaylists: Playlist[]) => setPlaylists(newPlaylists);
    subscribers.push(sub);

    return () => {
      subscribers = subscribers.filter(s => s !== sub);
    };
  }, [refresh]);

  return { playlists, isLoading, refresh };
}

/**
 * Administrative helper to update playlists
 */
export async function updateAllPlaylists(items: Playlist[]) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 'playlists', items }, { onConflict: 'id' });

    if (error) throw error;
    
    // Update local cache immediately after successful write
    setLocalCache(items);
    globalPlaylistsCache = items;
    subscribers.forEach(sub => sub(items));
    
  } catch (error: any) {
    console.error('Supabase update error:', error);
    const permissionError = new FirestorePermissionError({
      path: 'settings/playlists',
      operation: 'write',
      requestResourceData: { items },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  }
}
