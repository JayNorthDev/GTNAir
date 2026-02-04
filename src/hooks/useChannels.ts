
import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/firebase/config';
const db = getFirestore(app);
import { manualParse, Channel } from '@/lib/m3u-parser';

export type VisibilityMap = { [key: string]: boolean };

const CACHE_PREFIX = 'playlist_cache_';
const INITIAL_PAGE_SIZE = 200;
const PAGE_INCREMENT = 100;

export function useChannels(customPlaylistUrl?: string) {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = useCallback(async () => {
    setError(null);
    
    try {
      // 1. Get Playlist URL
      const defaultUrl = 'https://iptv-org.github.io/iptv/index.m3u';
      let playlistUrl = defaultUrl;

      if (customPlaylistUrl) {
          playlistUrl = customPlaylistUrl;
      } else {
        try {
          const playlistDocRef = doc(db, 'settings', 'playlist');
          const docSnap = await getDoc(playlistDocRef);
          if (docSnap.exists() && docSnap.data().url) {
            playlistUrl = docSnap.data().url;
          }
        } catch (error) {
          console.warn('Could not fetch custom playlist URL, using default.', error);
        }
      }

      // 2. Check Cache for "Instant" Load
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
      
      // 3. Fetch Visibility Settings (Always fresh)
      const visibilityCollection = collection(db, 'channel_visibility');
      const visibilitySnapshot = await getDocs(visibilityCollection);
      const visibilityMap: VisibilityMap = {};
      visibilitySnapshot.forEach(doc => {
          if (doc.data().visible === false) { 
              visibilityMap[doc.id] = false;
          }
      });

      // 4. Fetch and Parse Playlist (Background refresh)
      const response = await fetch(playlistUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.statusText}`);
      }
      const text = await response.text();
      const playlist = manualParse(text);

      // 5. Filter channels based on visibility
      const validAndVisibleChannels = playlist.items.filter(item => {
          const isVisible = visibilityMap[item.tvg.id] !== false; 
          return item.url && isVisible;
      });

      // 6. Update State and Cache
      setAllChannels(validAndVisibleChannels);
      setFilteredChannels(validAndVisibleChannels);

      const uniqueCategories = ['All', ...new Set(validAndVisibleChannels.map(item => item.group.title || 'Other').filter(Boolean))];
      setCategories(uniqueCategories.sort());

      // Update cache for next time
      try {
          localStorage.setItem(cacheKey, JSON.stringify({ items: validAndVisibleChannels, timestamp: Date.now() }));
      } catch (e) {
          console.warn('LocalStorage quota exceeded, could not cache playlist.');
      }

    } catch (e: any) {
      console.error('Error loading playlist:', e);
      if (allChannels.length === 0) {
          setError(e.message || 'Failed to load playlist.');
      }
    } finally {
      setLoading(false);
    }
  }, [customPlaylistUrl, allChannels.length]);

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
    setVisibleCount(INITIAL_PAGE_SIZE); // Reset pagination on filter
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
