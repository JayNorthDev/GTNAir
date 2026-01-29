
"use client";
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay } from 'lucide-react';

type VideoPlayerProps = {
  channel: Channel | null;
};

export default function VideoPlayer({ channel }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
        if (playerRef.current) {
            playerRef.current.dispose();
            playerRef.current = null;
        }
    }
  }, []);

  useEffect(() => {
    // Suppress subtitle and bandwidth warnings
    const originalWarn = videojs.log.warn;
    videojs.log.warn = function (...args: any[]) {
      if (
        (args[0] && typeof args[0] === 'string' && args[0].includes('Problem encountered loading the subtitle track')) ||
        (args[0] && typeof args[0] === 'string' && args[0].includes('Aborted early because there isn\'t enough bandwidth'))
      ) {
        return;
      }
      originalWarn.apply(this, args);
    };

    if (videoRef.current) {
        if (!playerRef.current) {
          const videoElement = videoRef.current;
          playerRef.current = videojs(videoElement, {
            autoplay: true,
            controls: true,
            fluid: true,
            liveui: true,
          });
        }
    }


    if (playerRef.current && channel) {
        playerRef.current.ready(() => {
            playerRef.current.pause();
            playerRef.current.src({
                src: channel.url,
                type: channel.http?.['content-type'] || 'application/x-mpegURL',
            });
            playerRef.current.load();
            const playPromise = playerRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => { /* Ignore abort errors */ });
            }
        });
    }
  }, [channel]);

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
