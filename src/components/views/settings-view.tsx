"use client";

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const [customUrl, setCustomUrl] = useState(settings.customPlaylistUrl);
  const { toast } = useToast();
  const router = useRouter();

  const handleSavePlaylist = () => {
    updateSettings({ customPlaylistUrl: customUrl });
    toast({
      title: 'Playlist URL Saved',
      description: 'The channel list will refresh with the new URL.',
    });
    // Force a reload to make useChannels re-fetch.
    // A more elegant solution might involve a global state manager.
    window.location.reload();
  };

  return (
    <div className="h-full w-full p-4 md:p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your player preferences and settings.</p>
      </header>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="playlist">Playlist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <div className="grid gap-8 max-w-2xl">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Playback</CardTitle>
                <CardDescription>Customize video playback behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-background/50 border">
                  <Label htmlFor="auto-skip" className="flex flex-col space-y-1">
                    <span>Auto-skip Broken Streams</span>
                    <span className="font-normal leading-snug text-muted-foreground text-sm">
                      Automatically play the next channel if a stream fails to load.
                    </span>
                  </Label>
                  <Switch
                    id="auto-skip"
                    checked={settings.autoSkip}
                    onCheckedChange={(checked) => updateSettings({ autoSkip: checked })}
                  />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-background/50 border">
                  <Label htmlFor="mute-on-startup" className="flex flex-col space-y-1">
                    <span>Mute by Default</span>
                    <span className="font-normal leading-snug text-muted-foreground text-sm">
                      Start all videos in a muted state.
                    </span>
                  </Label>
                  <Switch
                    id="mute-on-startup"
                    checked={settings.muteOnStartup}
                    onCheckedChange={(checked) => updateSettings({ muteOnStartup: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Interface</CardTitle>
                <CardDescription>Adjust the look and feel of the application.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg bg-background/50 border">
                  <Label htmlFor="default-view" className="flex flex-col space-y-1">
                    <span>Default View on Startup</span>
                     <span className="font-normal leading-snug text-muted-foreground text-sm">
                      Choose which screen to see when you open the app.
                    </span>
                  </Label>
                  <Select
                    value={settings.defaultView}
                    onValueChange={(value) => updateSettings({ defaultView: value as 'home' | 'player' | 'favorites' })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="player">Live TV</SelectItem>
                      <SelectItem value="favorites">Favorites</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="playlist" className="mt-6">
           <Card className="max-w-2xl bg-card/50">
              <CardHeader>
                <CardTitle>Custom Playlist</CardTitle>
                <CardDescription>
                  Provide a direct URL to your own M3U playlist file. This will override the default playlist.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-url">M3U Playlist URL</Label>
                  <Input 
                    id="playlist-url" 
                    placeholder="https://example.com/my_playlist.m3u"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleSavePlaylist}>Save and Refresh</Button>
                 <p className="text-xs text-muted-foreground pt-4">
                  For advanced playlist management, developers can use the <Link href="/admin" className="underline hover:text-primary">Admin Dashboard</Link>.
                </p>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
