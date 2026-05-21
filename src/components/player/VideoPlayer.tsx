"use client";
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay } from 'lucide-react';
import { GtnLogo } from '@/components/gtn-logo';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
};

export default function VideoPlayer({ channel, onStreamError, autoSkip, isMuted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const failCountRef = useRef(0);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let adTimer: NodeJS.Timeout;
    if (channel) {
      setShowAdOverlay(true);
      setErrorMsg(null);
      adTimer = setTimeout(() => setShowAdOverlay(false), 10000);
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (!channel || !video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 20000,
      });

      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        failCountRef.current = 0; // Reset fails on success
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            if (error.name === 'AbortError') {
              // Safely ignore: The user switched channels or component re-rendered before playback started
            } else {
              // Autoplay was likely blocked, try playing muted
              video.muted = true;
              video.play().catch((e) => {
                 if (e.name !== 'AbortError') console.error("Muted playback failed:", e);
              });
            }
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            failCountRef.current += 1;
            if (failCountRef.current > 10) {
               setErrorMsg("Too many dead channels. Auto-skip paused.");
               hls.destroy();
               return;
            }
            if (autoSkip && onStreamError) {
              setErrorMsg(`Stream offline. Skipping in 2s...`);
              setTimeout(() => onStreamError(), 2000); 
            } else {
              setErrorMsg(`Network Error: Stream offline`);
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.play().catch((e) => {
         if (e.name !== 'AbortError') console.error(e);
      });
    }

    return () => {
      clearTimeout(adTimer);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, autoSkip, onStreamError, isMuted]);

  return (
    <main className="flex-1 flex flex-col bg-black relative">
      {channel ? (
        <div className="w-full h-full relative">
          <video ref={videoRef} controls muted={isMuted} className="w-full h-full object-contain bg-black" />
          {errorMsg && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <p className="text-white text-lg font-semibold bg-red-600/90 px-6 py-3 rounded-lg shadow-lg">
                  {errorMsg}
                </p>
             </div>
          )}
          {showAdOverlay && !errorMsg && (
              <div className="absolute bottom-16 right-4 z-10 bg-black/50 backdrop-blur-sm p-3 rounded-lg flex items-center gap-3 animate-in fade-in duration-500">
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
        </div>
      )}
    </main>
  );
}