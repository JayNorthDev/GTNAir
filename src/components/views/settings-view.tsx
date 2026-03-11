
"use client";

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type SettingsViewProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsView({ isOpen, onClose }: SettingsViewProps) {
  const { settings, updateSettings } = useSettings();
  const [customUrl, setCustomUrl] = useState(settings.customPlaylistUrl);
  const { toast } = useToast();

  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  useEffect(() => {
    setCustomUrl(settings.customPlaylistUrl);
  }, [settings.customPlaylistUrl]);

  const handleSaveClick = () => {
    const isChanging = customUrl.trim() !== settings.customPlaylistUrl;

    if (!isChanging) {
      toast({
        title: 'No Changes',
        description: 'The playlist URL is already up to date.',
      });
      return;
    }
    
    if (customUrl.trim() === '') {
        toast({
            variant: 'destructive',
            title: 'Empty URL',
            description: 'Please use the "Reset to Default" button to clear the custom playlist.',
        });
        return;
    }
    
    setIsSaveConfirmOpen(true);
  };
  
  const performSave = () => {
    updateSettings({ customPlaylistUrl: customUrl.trim() });
    toast({
      title: 'Playlist URL Saved',
      description: 'The player will now refresh to load the new playlist.',
    });
    
    setTimeout(() => window.location.reload(), 1500);
  }

  const handleResetPlaylist = () => {
    if (!settings.customPlaylistUrl) {
         toast({
            title: 'Already Default',
            description: 'The default playlist is already in use.',
        });
        return;
    }
    
    updateSettings({ customPlaylistUrl: '' });
    setCustomUrl('');
    toast({
        title: 'Playlist Reset',
        description: 'The player will now refresh and restore the default playlist.',
    });
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 left-0 md:left-24 z-50 transform-gpu transition-transform duration-500 ease-in-out",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!isOpen}
    >
      <div 
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xl"
        onClick={onClose} 
      />
      <div className="relative h-full w-full max-w-4xl mx-auto flex flex-col">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <button onClick={onClose} className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors">
            <X className="w-6 h-6" />
            <span className="sr-only">Close Settings</span>
          </button>
        </div>
        
        <div className="h-full w-full p-4 pt-8 md:p-8 md:pt-10 overflow-y-auto">
          <header className="mb-6">
            <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your player preferences and settings.</p>
          </header>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="playlist">Playlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-6">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Playback</CardTitle>
                    <CardDescription>Customize video playback behavior.</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y divide-border">
                    <div className="flex items-center justify-between py-6">
                      <Label htmlFor="auto-skip" className="flex flex-col space-y-1 pr-6">
                        <span className="font-semibold">Auto-skip Broken Streams</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                          Automatically play the next channel if a stream fails to load.
                        </span>
                      </Label>
                      <Switch
                        id="auto-skip"
                        checked={settings.autoSkip}
                        onCheckedChange={(checked) => updateSettings({ autoSkip: checked })}
                      />
                    </div>
                     <div className="flex items-center justify-between py-6">
                      <Label htmlFor="mute-on-startup" className="flex flex-col space-y-1 pr-6">
                        <span className="font-semibold">Mute by Default</span>
                        <span className="font-normal leading-snug text-muted-foreground">
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

                <Card>
                  <CardHeader>
                    <CardTitle>Interface</CardTitle>
                    <CardDescription>Adjust the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between py-6">
                      <Label htmlFor="default-view" className="flex flex-col space-y-1 pr-6">
                        <span className="font-semibold">Default View on Startup</span>
                         <span className="font-normal leading-snug text-muted-foreground">
                          Choose which screen to see when you open the app.
                        </span>
                      </Label>
                      <Select
                        value={settings.defaultView}
                        onValueChange={(value) => updateSettings({ defaultView: value as 'home' | 'player' | 'favorites' | 'categories' })}
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
               <Card>
                  <CardHeader>
                    <CardTitle>Custom Playlist</CardTitle>
                    <CardDescription>
                      Provide a direct URL to your own .m3u or .m3u8 playlist file. This will override the application's default playlist for this device only.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="playlist-url">Playlist URL (.m3u/.m3u8)</Label>
                      <Input 
                        id="playlist-url" 
                        placeholder="https://example.com/my_playlist.m3u8"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSaveClick}>Save and Refresh</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={!settings.customPlaylistUrl}>Reset to Default</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove your custom playlist URL and restore the application's default playlist. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetPlaylist}>
                                    Continue
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>

            <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Change Playlist Source?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will disconnect you from the current playlist source and refresh the application to load the new one. Are you sure you want to continue?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={performSave}>
                        Save and Refresh
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
      </div>
    </div>
  );
}
