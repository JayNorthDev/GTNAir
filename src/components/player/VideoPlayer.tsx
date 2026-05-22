
"use client";
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay } from 'lucide-react';
import { cn } from '@/lib/utils';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
  isPip?: boolean;
  onExpand?: () => void;
};

export default function VideoPlayer({ 
  channel, 
  onStreamError, 
  autoSkip, 
  isMuted, 
  isPip, 
  onExpand 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  /**
   * Main Initialization & Disposal Effect
   * This effect handles the creation and destruction of the Video.js instance.
   * It re-runs strictly when the channel URL changes, ensuring the old player
   * is dismantled before a new one is built.
   */
  useEffect(() => {
    // Exit if no channel is selected or DOM is not ready
    if (!channel || !videoRef.current) return;

    // 1. Initialize Video.js instance
    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: !isPip,
      fluid: true,
      muted: !!isMuted,
      responsive: true,
      sources: [{
        src: channel.url,
        type: 'application/x-mpegURL'
      }]
    });

    playerRef.current = player;

    // 2. Attach error listeners for auto-skip logic
    player.on('error', () => {
      const error = player.error();
      if (error && autoSkip && onStreamError) {
        console.warn('Playback error detected, triggering auto-skip logic...');
        // Small delay to avoid rapid skipping loops that can freeze the browser
        setTimeout(() => {
          // Ensure we are still managing the same player instance before triggering skip
          if (playerRef.current === player && !player.isDisposed()) {
            onStreamError();
          }
        }, 2500);
      }
    });

    /**
     * CRITICAL CLEANUP: The return function of useEffect is guaranteed to run
     * when the component unmounts OR before the effect re-runs (due to channel URL change).
     * This ensures player.dispose() is called, preventing orphaned streams from 
     * playing in the background.
     */
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [channel?.url, autoSkip, onStreamError]);

  /**
   * Mute State Sync Effect
   * Updates the volume/mute state without re-initializing the entire player.
   */
  useEffect(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      playerRef.current.muted(!!isMuted);
    }
  }, [isMuted]);

  /**
   * UI Controls Sync Effect
   * Toggles controls based on PIP mode without re-initializing the entire player.
   */
  useEffect(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      playerRef.current.controls(!isPip);
    }
  }, [isPip]);

  // Don't render a PIP box if there's no active stream
  if (isPip && !channel) return null;

  return (
    <div 
      /**
       * The 'key' attribute is vital here. By keying the container with the channel's URL,
       * React will completely destroy the old DOM subtree and recreate it whenever
       * the channel changes. This gives Video.js a fresh <video> element every time,
       * which is the most robust way to avoid stale player states.
       */
      key={channel?.url || 'empty-player'}
      onClick={isPip ? onExpand : undefined}
      className={cn(
        isPip 
          ? "fixed bottom-6 right-6 w-72 md:w-96 aspect-video z-[100] rounded-xl shadow-2xl border border-white/20 bg-black overflow-hidden hover:scale-105 transition-all cursor-pointer"
          : "flex-1 flex flex-col bg-black relative w-full h-full"
      )}
    >
      {channel ? (
        <div data-vjs-player className="w-full h-full">
          <video 
            ref={videoRef} 
            className="video-js vjs-big-play-centered w-full h-full object-contain" 
            playsInline
          />
        </div>
      ) : (
        !isPip && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-transparent">
            <MonitorPlay className="w-24 h-24 mb-4 text-slate-600" />
            <h2 className="text-2xl font-semibold">Select a channel to start watching</h2>
          </div>
        )
      )}
    </div>
  );
}
