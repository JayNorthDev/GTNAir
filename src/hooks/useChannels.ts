
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { manualParse, Channel } from '@/lib/m3u-parser';
import { usePlaylists } from './usePlaylists';

export type VisibilityMap = { [key: string]: boolean };

const CHANNELS_CACHE_PREFIX = 'playlist_channels_cache_';
const INITIAL_PAGE_SIZE = 100;
const PAGE_INCREMENT = 100;

export function useChannels(customPlaylistUrl?: string, selectedPlaylistId?: string) {
  const { playlists, isLoading: playlistsLoading, refresh: refreshPlaylists } = usePlaylists();
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async (isRetry = false) => {
    if (playlistsLoading && !customPlaylistUrl) return;

    setError(null);
    
    try {
      const defaultUrl = 'https://iptv-org.github.io/iptv/index.m3u';
      let playlistUrl = '';

      if (customPlaylistUrl) {
          playlistUrl = customPlaylistUrl;
      } else if (selectedPlaylistId) {
          const selected = playlists.find(p => p.id === selectedPlaylistId);
          playlistUrl = selected?.url || defaultUrl;
      } else {
          playlistUrl = playlists.length > 0 ? playlists[0].url : defaultUrl;
      }

      const urlRegex = /^https:\/\/.*\.m3u8?$/;
      if (!playlistUrl || !urlRegex.test(playlistUrl)) {
        setAllChannels([]);
        setFilteredChannels([]);
        setCategories(['All']);
        setLoading(false);
        return;
      }

      // 1. Try Content Cache (Individual Playlist Content)
      const contentCacheKey = `${CHANNELS_CACHE_PREFIX}${playlistUrl}`;
      const cachedContent = localStorage.getItem(contentCacheKey);
      
      if (cachedContent && !isRetry) {
          try {
              const cachedData = JSON.parse(cachedContent);
              if (cachedData && Array.isArray(cachedData.items)) {
                  setAllChannels(cachedData.items);
                  setFilteredChannels(cachedData.items);
                  const uniqueCategories = ['All', ...new Set(cachedData.items.map((item: any) => item.group.title || 'Other').filter(Boolean) as string[])];
                  setCategories(uniqueCategories.sort());
                  setLoading(false);
              }
          } catch (e) {
              console.warn('Failed to parse cached channels');
          }
      } else {
          setLoading(true);
      }
      
      // 2. Fetch M3U Content
      let response;
      try {
        response = await fetch(playlistUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } catch (fetchErr) {
        // FAIL-SAFE / AUTO-RECOVERY
        // If fetch fails and we haven't retried yet, refresh playlist definitions from Firestore
        if (!isRetry && !customPlaylistUrl) {
          console.warn('Cached URL fetch failed, forcing Firestore re-sync for auto-recovery...');
          await refreshPlaylists(true); // Force hit Firestore
          fetchChannels(true); // Retry once with fresh data
          return;
        }
        throw fetchErr;
      }
      
      const text = await response.text();
      const playlist = manualParse(text);

      // Fetch Visibility Settings (always fresh from DB)
      const visibilityCollection = collection(db, 'channel_visibility');
      const visibilitySnapshot = await getDocs(visibilityCollection);
      const visibilityMap: VisibilityMap = {};
      visibilitySnapshot.forEach(doc => {
          if (doc.data().visible === false) { 
              visibilityMap[doc.id] = false;
          }
      });

      const validAndVisibleChannels = playlist.items.filter(item => {
          const isVisible = visibilityMap[item.tvg.id] !== false; 
          return item.url && isVisible;
      });

      setAllChannels(validAndVisibleChannels);
      setFilteredChannels(validAndVisibleChannels);

      const uniqueCategories = ['All', ...new Set(validAndVisibleChannels.map(item => item.group.title || 'Other').filter(Boolean))];
      setCategories(uniqueCategories.sort());

      // Update Content Cache
      try {
          localStorage.setItem(contentCacheKey, JSON.stringify({ items: validAndVisibleChannels, timestamp: Date.now() }));
      } catch (e) {
          console.warn('LocalStorage quota exceeded for channel content');
      }

    } catch (e: any) {
      console.error('Error loading channels:', e);
      if (allChannels.length === 0) {
          setError(e.message || 'Failed to load channels.');
      }
    } finally {
      setLoading(false);
    }
  }, [customPlaylistUrl, selectedPlaylistId, playlists, playlistsLoading, refreshPlaylists, allChannels.length]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const filterChannels = useCallback((searchTerm: string, selectedCategory: string) => {
    let channels = allChannels;
    if (selectedCategory !== 'All') {
      channels = channels.filter(c => (c.group.title || 'Other') === selectedCategory);
    }
    if (searchTerm) {
      channels = channels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredChannels(channels);
    setVisibleCount(INITIAL_PAGE_SIZE); 
  }, [allChannels]);

  const displayChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_INCREMENT);
  }, []);

  const hasMore = visibleCount < filteredChannels.length;

  return { 
    allChannels, 
    displayChannels, 
    categories, 
    loading, 
    error, 
    filterChannels,
    loadMore,
    hasMore,
    totalFiltered: filteredChannels.length
  };
}
