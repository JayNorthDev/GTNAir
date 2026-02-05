import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/firebase/config';
const db = getFirestore(app);
import { manualParse, Channel } from '@/lib/m3u-parser';

export type VisibilityMap = { [key: string]: boolean };

const CACHE_PREFIX = 'playlist_cache_';
const INITIAL_PAGE_SIZE = 100;
const PAGE_INCREMENT = 100;

export function useChannels(customPlaylistUrl?: string, selectedPlaylistId?: string) {
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
      let playlistUrl = '';

      if (customPlaylistUrl) {
          playlistUrl = customPlaylistUrl;
      } else if (selectedPlaylistId) {
        try {
          const playlistDocRef = doc(db, 'playlists', selectedPlaylistId);
          const docSnap = await getDoc(playlistDocRef);
          if (docSnap.exists() && docSnap.data().url) {
            playlistUrl = docSnap.data().url;
          }
        } catch (error) {
          console.warn('Could not fetch selected playlist URL', error);
        }
      } else {
        try {
          const q = query(collection(db, 'playlists'), orderBy('order', 'asc'), limit(1));
          const plSnap = await getDocs(q);
          if (!plSnap.empty) {
            playlistUrl = plSnap.docs[0].data().url;
          } else {
             const settingsDocRef = doc(db, 'settings', 'playlist');
             const docSnap = await getDoc(settingsDocRef);
             if (docSnap.exists() && docSnap.data().url) {
               playlistUrl = docSnap.data().url;
             } else {
               playlistUrl = defaultUrl;
             }
          }
        } catch (error) {
          console.warn('Could not fetch default playlist URL', error);
          playlistUrl = defaultUrl;
        }
      }

      // 2. Validate URL format before proceeding
      const urlRegex = /^https:\/\/.*\.m3u8?$/;
      if (!playlistUrl || !urlRegex.test(playlistUrl)) {
        // If the derived URL is empty or invalid, we do NOT fall back to cache.
        // We present a "No Channels Found" state.
        setAllChannels([]);
        setFilteredChannels([]);
        setCategories(['All']);
        setLoading(false);
        return;
      }

      // 3. Check Cache (Only if URL is valid)
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
      
      // 4. Fetch Visibility Settings
      const visibilityCollection = collection(db, 'channel_visibility');
      const visibilitySnapshot = await getDocs(visibilityCollection);
      const visibilityMap: VisibilityMap = {};
      visibilitySnapshot.forEach(doc => {
          if (doc.data().visible === false) { 
              visibilityMap[doc.id] = false;
          }
      });

      // 5. Fetch and Parse Playlist
      const response = await fetch(playlistUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.statusText}`);
      }
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
  }, [customPlaylistUrl, selectedPlaylistId, allChannels.length]);

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
