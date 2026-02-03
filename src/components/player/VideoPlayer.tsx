
"use client";
import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay } from 'lucide-react';
import type Player from 'video.js/dist/types/player';
import { GtnLogo } from '@/components/gtn-logo';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
};

export default function VideoPlayer({ channel, onStreamError, autoSkip, isMuted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);

  useEffect(() => {
    // Show ad overlay for 10 seconds whenever the channel changes
    let adTimer: NodeJS.Timeout;
    if (channel) {
        setShowAdOverlay(true);
        adTimer = setTimeout(() => {
            setShowAdOverlay(false);
        }, 10000);
    }

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    if (channel && videoRef.current) {
      // Determine source type: prefer HLS for .m3u8 extensions
      const isHls = channel.url.toLowerCase().includes('.m3u8') || 
                    channel.http?.['content-type'] === 'application/x-mpegURL';
      
      const sourceType = isHls ? 'application/x-mpegURL' : (channel.http?.['content-type'] || 'application/x-mpegURL');

      const player = playerRef.current = videojs(videoRef.current, {
        autoplay: true,
        controls: true,
        fluid: true,
        liveui: true,
        muted: isMuted,
        sources: [{
          src: channel.url,
          type: sourceType,
        }],
      });

      player.on('error', () => {
        const error = player.error();
        // Subtitle errors are common and often non-fatal for playback
        if (error && error.message.includes('Problem encountered loading the subtitle track')) {
          console.log('Ignoring subtitle loading error.');
          player.error(null); 
          return;
        }
        
        console.error("Video.js stream error:", error);
        if (autoSkip && onStreamError) {
          console.log("Stream error, attempting to auto-skip to the next channel.");
          onStreamError();
        }
      });
    }

    return () => {
      clearTimeout(adTimer);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [channel, autoSkip, onStreamError, isMuted]);

  return (
    <main className="flex-1 flex flex-col bg-black relative">
      {channel ? (
        <div data-vjs-player className="w-full h-full">
          <video ref={videoRef} className="video-js vjs-big-play-centered w-full h-full" />
           {showAdOverlay && (
              <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-sm p-3 rounded-lg flex items-center gap-3 animate-in fade-in duration-500">
                  <GtnLogo className="w-8 h-8 text-primary" />
                  <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Powered by</span>
                      <span className="text-base font-semibold text-white">GTNPlay Media</span>
                  </div>
              </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-transparent">
          <MonitorPlay className="w-24 h-24 mb-4 text-slate-600" />
          <h2 className="text-2xl font-semibold">Select a channel to start watching</h2>
          <p>Choose from the list on the left or from the Home screen</p>
        </div>
      )}
    </main>
  );
}
