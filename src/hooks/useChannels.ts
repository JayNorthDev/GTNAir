
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/firebase/config';
const db = getFirestore(app);
import { manualParse, Channel } from '@/lib/m3u-parser';

export type VisibilityMap = { [key: string]: boolean };

export function useChannels(customPlaylistUrl?: string) {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [displayChannels, setDisplayChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannels() {
      setLoading(true);
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
        
        // 2. Fetch Visibility Settings
        const visibilityCollection = collection(db, 'channel_visibility');
        const visibilitySnapshot = await getDocs(visibilityCollection);
        const visibilityMap: VisibilityMap = {};
        visibilitySnapshot.forEach(doc => {
            if (doc.data().visible === false) { // only store hidden channels to save memory
                visibilityMap[doc.id] = false;
            }
        });

        // 3. Fetch and Parse Playlist
        const response = await fetch(playlistUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        }
        const text = await response.text();
        const playlist = manualParse(text);

        // 4. Filter channels based on visibility
        const validAndVisibleChannels = playlist.items.filter(item => {
            const isVisible = visibilityMap[item.tvg.id] !== false; // Default to true if not in map
            return item.url && isVisible;
        });

        setAllChannels(validAndVisibleChannels);
        setDisplayChannels(validAndVisibleChannels.slice(0, 200));

        const uniqueCategories = ['All', ...new Set(validAndVisibleChannels.map(item => item.group.title || 'Other').filter(Boolean))];
        setCategories(uniqueCategories.sort());

      } catch (e: any) {
        console.error('Error loading playlist:', e);
        setError(e.message || 'Failed to load playlist.');
      } finally {
        setLoading(false);
      }
    }
    fetchChannels();
  }, [customPlaylistUrl]);

  const filterChannels = useCallback((searchTerm: string, selectedCategory: string) => {
    let channels = allChannels;
    if (selectedCategory !== 'All') {
      channels = channels.filter(c => (c.group.title || 'Other') === selectedCategory);
    }
    if (searchTerm) {
      channels = channels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setDisplayChannels(channels.slice(0, 200));
  }, [allChannels]);

  return { allChannels, displayChannels, categories, loading, error, filterChannels };
}
