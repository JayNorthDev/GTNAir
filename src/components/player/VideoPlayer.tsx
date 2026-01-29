"use client";
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay } from 'lucide-react';
import type Player from 'video.js/dist/types/player';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
};

export default function VideoPlayer({ channel, onStreamError, autoSkip, isMuted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // If a player instance already exists, dispose of it before creating a new one.
    // This is the key to fixing the black screen issue, as it ensures a clean state for each new channel.
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    // Only proceed if a channel is selected and the video element is available.
    if (channel && videoRef.current) {
      // Initialize a new Video.js player.
      const player = playerRef.current = videojs(videoRef.current, {
        autoplay: true, // We want the new channel to play immediately.
        controls: true,
        fluid: true,
        liveui: true,
        muted: isMuted, // Apply the mute setting from props.
        sources: [{
          src: channel.url,
          type: channel.http?.['content-type'] || 'application/x-mpegURL',
        }],
      });

      // Set up error handling for the new player instance.
      player.on('error', () => {
        const error = player.error();
        // Suppress minor subtitle errors that don't affect playback.
        if (error && error.message.includes('Problem encountered loading the subtitle track')) {
          console.log('Ignoring subtitle loading error.');
          player.error(null); // Clear the error state
          return;
        }
        
        console.error("Video.js stream error:", error);
        if (autoSkip && onStreamError) {
          console.log("Stream error, attempting to auto-skip to the next channel.");
          onStreamError();
        }
      });
    }

    // The cleanup function for this effect will run when the channel changes again or the component unmounts.
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // The effect should re-run whenever the channel itself changes.
    // Other props are passed directly during initialization.
  }, [channel, autoSkip, onStreamError, isMuted]);

  return (
    <main className="flex-1 flex flex-col bg-black">
      {channel ? (
        <div data-vjs-player className="w-full h-full">
          <video ref={videoRef} className="video-js vjs-big-play-centered w-full h-full" />
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
