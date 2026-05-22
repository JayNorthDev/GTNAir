
"use client";
import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'iptv-player-settings';

export type View = 'home' | 'player' | 'favorites' | 'categories';

export type Settings = {
  autoSkip: boolean;
  muteOnStartup: boolean;
  forceLiveEdge: boolean;
  defaultView: View;
  customPlaylistUrl: string;
  selectedPlaylistId: string;
};

export const defaultSettings: Settings = {
  autoSkip: true,
  muteOnStartup: false,
  forceLiveEdge: true,
  defaultView: 'home',
  customPlaylistUrl: '',
  selectedPlaylistId: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SETTINGS_KEY);
      if (item) {
        const savedSettings = JSON.parse(item);
        const newSettings = { ...defaultSettings, ...savedSettings };
        
        if (newSettings.defaultView === 'settings' as any) {
          newSettings.defaultView = 'home';
        }
        setSettings(newSettings);
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
