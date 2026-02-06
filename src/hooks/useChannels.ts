
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { manualParse, Channel } from '@/lib/m3u-parser';
import { usePlaylists } from './usePlaylists';

export type VisibilityMap = { [key: string]: boolean };

const CACHE_PREFIX = 'playlist_cache_';
const INITIAL_PAGE_SIZE = 100;
const PAGE_INCREMENT = 100;

export function useChannels(customPlaylistUrl?: string, selectedPlaylistId?: string) {
  const { playlists, isLoading: playlistsLoading } = usePlaylists();
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
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
          // Use the first available playlist as default
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

      const cacheKey = `${CACHE_PREFIX}${playlistUrl}`;
      const cachedContent = localStorage.getItem(cacheKey);
      
      if (cachedContent) {
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
              console.warn('Failed to parse cached playlist data', e);
          }
      } else {
          setLoading(true);
      }
      
      const visibilityCollection = collection(db, 'channel_visibility');
      const visibilitySnapshot = await getDocs(visibilityCollection);
      const visibilityMap: VisibilityMap = {};
      visibilitySnapshot.forEach(doc => {
          if (doc.data().visible === false) { 
              visibilityMap[doc.id] = false;
          }
      });

      const response = await fetch(playlistUrl);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      
      const text = await response.text();
      const playlist = manualParse(text);

      const validAndVisibleChannels = playlist.items.filter(item => {
          const isVisible = visibilityMap[item.tvg.id] !== false; 
          return item.url && isVisible;
      });

      setAllChannels(validAndVisibleChannels);
      setFilteredChannels(validAndVisibleChannels);

      const uniqueCategories = ['All', ...new Set(validAndVisibleChannels.map(item => item.group.title || 'Other').filter(Boolean))];
      setCategories(uniqueCategories.sort());

      try {
          localStorage.setItem(cacheKey, JSON.stringify({ items: validAndVisibleChannels, timestamp: Date.now() }));
      } catch (e) {
          console.warn('LocalStorage quota exceeded.');
      }

    } catch (e: any) {
      console.error('Error loading playlist:', e);
      if (allChannels.length === 0) {
          setError(e.message || 'Failed to load playlist.');
      }
    } finally {
      setLoading(false);
    }
  }, [customPlaylistUrl, selectedPlaylistId, playlists, playlistsLoading]);

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
