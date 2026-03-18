
'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Channel } from '@/lib/m3u-parser';
import { MonitorPlay, AlertCircle } from 'lucide-react';
import { GtnLogo } from '@/components/gtn-logo';

type VideoPlayerProps = {
  channel: Channel | null;
  onStreamError?: () => void;
  autoSkip?: boolean;
  isMuted?: boolean;
};

class SmartLoader extends Hls.DefaultConfig.loader {
  constructor(config: any) {
    super(config);
    const retry = this.load.bind(this);
    this.load = (context: any, config: any, callbacks: any) => {
      // CRITICAL: Initialize stats correctly to prevent Hls.js crashes
      context.stats = {
        trequest: performance.now(),
        retry: 0,
        tfirst: 0,
        tload: 0,
        parsed: 0,
        loader: { start: 0, end: 0 },
        parsing: { start: 0, end: 0 },
        buffering: { start: 0, end: 0 },
        bwEstimate: 0,
        total: 0,
        loaded: 0
      };

      // Route through binary proxy
      if (context.url && !context.url.includes('/api/proxy')) {
        context.url = `/api/proxy?url=${encodeURIComponent(context.url)}`;
      }
      retry(context, config, callbacks);
    };
  }
}

export default function VideoPlayer({ channel, onStreamError, autoSkip, isMuted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let adTimer: NodeJS.Timeout;
    if (channel) {
      setShowAdOverlay(true);
      setError(null);
      adTimer = setTimeout(() => {
        setShowAdOverlay(false);
      }, 10000);
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (channel && videoRef.current) {
      const video = videoRef.current;
      video.muted = !!isMuted;

      if (Hls.isSupported()) {
        const hls = new Hls({
          fLoader: SmartLoader,
          pLoader: SmartLoader,
          manifestLoadingTimeOut: 15000,
          levelLoadingTimeOut: 15000,
          fragLoadingTimeOut: 15000,
        });

        hlsRef.current = hls;
        hls.loadSource(channel.url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            console.log("Autoplay blocked, waiting for interaction");
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('Fatal HLS error:', data.type);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError("Stream unplayable");
                if (autoSkip && onStreamError) {
                  onStreamError();
                }
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari
        video.src = channel.url;
        video.addEventListener('loadedmetadata', () => {
          video.play();
        });
        video.addEventListener('error', () => {
          setError("Native playback error");
          if (autoSkip && onStreamError) {
            onStreamError();
          }
        });
      }
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
        <div className="w-full h-full relative group">
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain"
            controls
            playsInline
          />
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <AlertCircle className="w-12 h-12 text-destructive mb-2" />
              <p className="text-white font-medium">{error}</p>
            </div>
          )}

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
