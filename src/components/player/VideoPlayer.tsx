
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
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  /**
   * Main Initialization & Disposal Effect
   * We initialize Video.js on a stable container to prevent React from throwing 
   * 'removeChild' errors when the DOM is modified by both React and Video.js.
   */
  useEffect(() => {
    // Exit if no channel is selected or DOM is not ready
    if (!channel || !videoRef.current) return;

    // 1. Create a fresh video element manually to avoid React reconciliation conflicts
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered w-full h-full object-contain';
    videoElement.setAttribute('playsinline', 'true');
    videoRef.current.appendChild(videoElement);

    // 2. Initialize Video.js instance
    const player = videojs(videoElement, {
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

    // 3. Attach error listeners for auto-skip logic
    player.on('error', () => {
      const error = player.error();
      if (error && autoSkip && onStreamError) {
        console.warn('Playback error detected, triggering auto-skip logic...');
        // Small delay to avoid rapid skipping loops
        setTimeout(() => {
          if (playerRef.current === player && !player.isDisposed()) {
            onStreamError();
          }
        }, 2500);
      }
    });

    /**
     * CRITICAL CLEANUP: The return function ensures player.dispose() is called.
     * Video.js dispose() will remove the 'videoElement' we created manually,
     * leaving the React-managed 'videoRef' container empty but intact.
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
   */
  useEffect(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      playerRef.current.muted(!!isMuted);
    }
  }, [isMuted]);

  /**
   * UI Controls Sync Effect
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
      onClick={isPip ? onExpand : undefined}
      className={cn(
        isPip 
          ? "fixed bottom-6 right-6 w-72 md:w-96 aspect-video z-[100] rounded-xl shadow-2xl border border-white/20 bg-black overflow-hidden hover:scale-105 transition-all cursor-pointer"
          : "flex-1 flex flex-col bg-black relative w-full h-full"
      )}
    >
      {channel ? (
        <div data-vjs-player className="w-full h-full">
          {/* Stable container for Video.js to mount onto */}
          <div ref={videoRef} className="w-full h-full" />
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
