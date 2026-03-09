
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { manualParse, Channel } from '@/lib/m3u-parser';
import { usePlaylists } from './usePlaylists';

export type VisibilityMap = { [key: string]: boolean };

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
    // If playlists are still loading and we don't have a custom URL, wait.
    if (playlistsLoading && !customPlaylistUrl) return;

    setError(null);
    
    try {
      let playlistUrl = '';

      // Priority 1: User-provided custom URL in settings
      if (customPlaylistUrl) {
          playlistUrl = customPlaylistUrl;
      } 
      // Priority 2: Specifically selected playlist from the categories/sidebar
      else if (selectedPlaylistId) {
          const selected = playlists.find(p => p.id === selectedPlaylistId);
          playlistUrl = selected?.url || '';
      } 
      // Priority 3: Default to the first playlist in the global list
      else if (playlists.length > 0) {
          playlistUrl = playlists[0].url;
      }

      // STRICT REQUIREMENT: If no URL is available (database is empty and no custom URL), 
      // do not use a fallback. Just show 0 channels.
      if (!playlistUrl) {
        setAllChannels([]);
        setFilteredChannels([]);
        setCategories(['All']);
        setLoading(false);
        return;
      }

      // Basic validation: ensure it looks like an M3U/M3U8 link (allowing query params)
      const urlRegex = /^https:\/\/.*\.m3u8?(\?.*)?$/i;
      if (!urlRegex.test(playlistUrl)) {
        setAllChannels([]);
        setFilteredChannels([]);
        setCategories(['All']);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      let response;
      try {
        response = await fetch(playlistUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } catch (fetchErr) {
        // If fetch fails, try to refresh playlist definitions once as a fail-safe
        if (!isRetry && !customPlaylistUrl) {
          await refreshPlaylists(true); 
          fetchChannels(true); 
          return;
        }
        throw fetchErr;
      }
      
      const text = await response.text();
      const playlist = manualParse(text);

      // Fetch visibility overrides from Supabase
      const { data: visibilityData, error: visibilityError } = await supabase
        .from('channel_visibility')
        .select('id, visible');

      if (visibilityError) throw visibilityError;

      const visibilityMap: VisibilityMap = {};
      visibilityData?.forEach(row => {
          if (row.visible === false) { 
              visibilityMap[row.id] = false;
          }
      });

      // Filter out hidden channels and entries without URLs
      const validAndVisibleChannels = playlist.items.filter(item => {
          const isVisible = visibilityMap[item.tvg.id] !== false; 
          return item.url && isVisible;
      });

      setAllChannels(validAndVisibleChannels);
      setFilteredChannels(validAndVisibleChannels);

      const uniqueCategories = ['All', ...new Set(validAndVisibleChannels.map(item => item.group.title || 'Other').filter(Boolean))];
      setCategories(uniqueCategories.sort());

    } catch (e: any) {
      console.error('Channel fetch error:', e);
      // Only set error if we have no channels at all to show
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
