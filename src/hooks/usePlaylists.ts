"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

let globalPlaylistsCache: Playlist[] | null = null;
let subscribers: ((playlists: Playlist[]) => void)[] = [];

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

async function fetchPlaylistsFromSupabase(): Promise<Playlist[]> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 'playlists')
      .single();

    if (error) throw error;
    
    const items = (data?.data?.items || []) as Playlist[];
    // Ensure items are always sorted by order for consistency
    const sorted = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    setLocalCache(sorted);
    globalPlaylistsCache = sorted;
    
    return sorted;
  } catch (error: any) {
    console.error('Supabase fetch error:', error);
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

    if (items.length === 0) {
      items = await fetchPlaylistsFromSupabase();
    }

    const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    globalPlaylistsCache = sortedItems;
    setPlaylists(sortedItems);
    setIsLoading(false);
    
    // Notify all instances of the hook to update
    subscribers.forEach(sub => sub(sortedItems));
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

export async function updateAllPlaylists(items: Playlist[]) {
  try {
    // Ensure we sort before saving to maintain predictable array structure
    const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Single Document Strategy: overwrite the 'items' array in the 'playlists' settings record
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 'playlists', data: { items: sortedItems } }, { onConflict: 'id' });

    if (error) throw error;
    
    // Update local cache and notify subscribers immediately
    setLocalCache(sortedItems);
    globalPlaylistsCache = sortedItems;
    subscribers.forEach(sub => sub(sortedItems));
    
  } catch (error: any) {
    console.error('Supabase update error:', error);
    throw error;
  }
}