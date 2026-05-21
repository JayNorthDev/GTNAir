
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

  useEffect(() => {
    // If there's no channel or no video element, cleanup and return
    if (!channel || !videoRef.current) {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    // Dispose existing player before re-initializing for a new channel
    if (playerRef.current && !playerRef.current.isDisposed()) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    // Initialize Video.js player with direct URL
    const player = playerRef.current = videojs(videoRef.current, {
      autoplay: true,
      controls: !isPip,
      fluid: true,
      muted: isMuted,
      responsive: true,
      sources: [{
        src: channel.url,
        type: 'application/x-mpegURL'
      }]
    });

    // Handle stream errors for auto-skip logic
    player.on('error', () => {
      const error = player.error();
      if (error) {
        console.error('Video.js Playback Error:', error.code, error.message);
        if (autoSkip && onStreamError) {
          // Delay to prevent rapid skip loops if multiple channels are down
          setTimeout(() => {
            onStreamError();
          }, 2000);
        }
      }
    });

    // Cleanup on unmount or channel change
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [channel, isMuted, isPip, autoSkip, onStreamError]);

  // If PIP mode and no channel is selected, don't render anything
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
