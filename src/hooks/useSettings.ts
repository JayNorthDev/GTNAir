"use client";
import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'iptv-player-settings';

export type View = 'home' | 'player' | 'favorites' | 'settings';

export type Settings = {
  autoSkip: boolean;
  muteOnStartup: boolean;
  defaultView: View;
  customPlaylistUrl: string;
};

export const defaultSettings: Settings = {
  autoSkip: true,
  muteOnStartup: false,
  defaultView: 'home',
  customPlaylistUrl: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    try {
      const item = window.localStorage.getItem(SETTINGS_KEY);
      if (item) {
        // Merge saved settings with defaults to avoid breaking changes
        const savedSettings = JSON.parse(item);
        setSettings({ ...defaultSettings, ...savedSettings });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error reading settings from localStorage', error);
      setSettings(defaultSettings);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving settings to localStorage', error);
      }
      return updated;
    });
  }, []);

  return { settings, updateSettings, isLoaded };
}
