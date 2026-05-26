
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
  showChannelStrip: boolean;
};

export const defaultSettings: Settings = {
  autoSkip: true,
  muteOnStartup: false,
  forceLiveEdge: true,
  defaultView: 'home',
  customPlaylistUrl: '',
  selectedPlaylistId: '',
  showChannelStrip: true,
};

// Global state to sync between multiple hook instances
let globalSettings: Settings = defaultSettings;
let settingsLoaded = false;
let subscribers: ((settings: Settings) => void)[] = [];

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(globalSettings);
  const [isLoaded, setIsLoaded] = useState(settingsLoaded);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load from localStorage if not loaded yet
    if (!settingsLoaded) {
      try {
        const item = window.localStorage.getItem(SETTINGS_KEY);
        if (item) {
          const savedSettings = JSON.parse(item);
          globalSettings = { ...defaultSettings, ...savedSettings };
          
          if (globalSettings.defaultView === 'settings' as any) {
            globalSettings.defaultView = 'home';
          }
        }
      } catch (error) {
        console.error('Error reading settings from localStorage', error);
      }
      settingsLoaded = true;
    }

    setSettings(globalSettings);
    setIsLoaded(true);

    const sub = (newSettings: Settings) => setSettings(newSettings);
    subscribers.push(sub);

    return () => {
      subscribers = subscribers.filter(s => s !== sub);
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    globalSettings = { ...globalSettings, ...newSettings };
    
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(globalSettings));
      }
    } catch (error) {
      console.error('Error saving settings to localStorage', error);
    }

    // Notify all hook instances
    subscribers.forEach(sub => sub(globalSettings));
  }, []);

  return { settings, updateSettings, isLoaded };
}
