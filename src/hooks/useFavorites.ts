"use client";

import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/lib/m3u-parser';

const FAVORITES_KEY = 'iptv-favorites-urls';

export function useFavorites() {
  const [favoriteUrls, setFavoriteUrls] = useState<string[]>([]);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    try {
      const item = window.localStorage.getItem(FAVORITES_KEY);
      if (item) {
        setFavoriteUrls(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading favorites from localStorage', error);
      setFavoriteUrls([]);
    }
  }, []);

  const updateLocalStorage = (urls: string[]) => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(urls));
    } catch (error) {
      console.error('Error saving favorites to localStorage', error);
    }
  };

  const toggleFavorite = useCallback((channel: Channel | null) => {
    if (!channel || !channel.url) return;

    setFavoriteUrls(prevUrls => {
      const isCurrentlyFavorite = prevUrls.includes(channel.url);
      let newUrls;
      if (isCurrentlyFavorite) {
        newUrls = prevUrls.filter(url => url !== channel.url);
      } else {
        newUrls = [...prevUrls, channel.url];
      }
      updateLocalStorage(newUrls);
      return newUrls;
    });
  }, []);

  const isFavorite = useCallback((channel: Channel | null): boolean => {
    if (!channel || !channel.url) return false;
    return favoriteUrls.includes(channel.url);
  }, [favoriteUrls]);

  return { favoriteUrls, toggleFavorite, isFavorite };
}
