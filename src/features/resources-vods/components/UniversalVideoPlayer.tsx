import React, { useEffect, useRef, useState } from 'react';

interface UniversalVideoPlayerProps {
  url: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onProgress?: (currentTime: number) => void;
  onDuration?: (duration: number) => void;
  playerRef?: React.MutableRefObject<any>;
}

// Helpers to extract embed and stream URLs
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  if (url.includes('/shorts/')) {
    const parts = url.split('/shorts/')[1]?.split('?')[0];
    if (parts && parts.length === 11) return parts;
  }
  return null;
}

export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function getGoogleDriveEmbedUrl(url: string): string | null {
  const fileId = getGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return null;
}

export function getTwitchEmbedUrl(url: string): string | null {
  if (!url) return null;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const vodMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (vodMatch && vodMatch[1]) {
    return `https://player.twitch.tv/?video=${vodMatch[1]}&parent=${hostname}&autoplay=false`;
  }
  const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (channelMatch && channelMatch[1]) {
    return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${hostname}&autoplay=false`;
  }
  return null;
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  url,
  isPlaying,
  onPlay,
  onPause,
  onProgress,
  onDuration,
  playerRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  const [useDriveIframeFallback, setUseDriveIframeFallback] = useState(false);

  const ytId = getYouTubeId(url);
  const driveFileId = getGoogleDriveFileId(url);
  const driveEmbedUrl = getGoogleDriveEmbedUrl(url);
  const twitchEmbedUrl = getTwitchEmbedUrl(url);

  // Define playerRef methods for parent seekTo
  useEffect(() => {
    if (playerRef) {
      playerRef.current = {
        seekTo: (seconds: number) => {
          if (ytId && ytPlayerRef.current?.seekTo) {
            ytPlayerRef.current.seekTo(seconds, true);
          } else if (videoElementRef.current) {
            videoElementRef.current.currentTime = seconds;
          }
        },
      };
    }
  }, [playerRef, ytId, driveFileId, useDriveIframeFallback]);

  // YouTube Iframe API initialization
  useEffect(() => {
    if (!ytId) return;

    let isMounted = true;

    const initYT = () => {
      if (!(window as any).YT || !(window as any).YT.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }

      ytPlayerRef.current = new (window as any).YT.Player(`yt-player-${ytId}`, {
        videoId: ytId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            const dur = event.target.getDuration();
            if (dur && onDuration) onDuration(dur);
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            if (event.data === 1 && onPlay) onPlay();
            if (event.data === 2 && onPause) onPause();
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initYT();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = () => {
        initYT();
      };
    }

    // High frequency polling (200ms) for smooth real-time progress bar movement in YouTube
    timerRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const curr = ytPlayerRef.current.getCurrentTime();
        const dur = ytPlayerRef.current.getDuration();
        if (typeof curr === 'number' && onProgress) {
          onProgress(curr);
        }
        if (typeof dur === 'number' && dur > 0 && onDuration) {
          onDuration(dur);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [ytId]);

  // Sync play/pause prop with YouTube
  useEffect(() => {
    if (ytId && ytPlayerRef.current) {
      try {
        if (isPlaying && ytPlayerRef.current.playVideo) {
          ytPlayerRef.current.playVideo();
        } else if (!isPlaying && ytPlayerRef.current.pauseVideo) {
          ytPlayerRef.current.pauseVideo();
        }
      } catch {}
    }
  }, [isPlaying, ytId]);

  // Fallback duration scale for Twitch or iframe fallback
  useEffect(() => {
    if ((useDriveIframeFallback || twitchEmbedUrl) && onDuration) {
      onDuration(1800); // 30 minute timeline scale
    }
  }, [useDriveIframeFallback, twitchEmbedUrl, onDuration]);

  // 1. Render YouTube Player
  if (ytId) {
    return (
      <div ref={containerRef} className="w-full h-full relative bg-black">
        <div id={`yt-player-${ytId}`} className="w-full h-full absolute inset-0" />
      </div>
    );
  }

  // 2. Render Google Drive Direct HTML5 Stream (Primary mode for real-time duration & seeking)
  if (driveFileId && !useDriveIframeFallback) {
    const directStreamUrl = `https://docs.google.com/uc?export=download&id=${driveFileId}`;
    return (
      <div className="w-full h-full relative bg-black flex items-center justify-center">
        <video
          ref={videoElementRef}
          src={directStreamUrl}
          controls
          className="w-full h-full object-contain"
          onPlay={() => onPlay && onPlay()}
          onPause={() => onPause && onPause()}
          onLoadedMetadata={(e) => {
            const target = e.currentTarget;
            if (target.duration && !isNaN(target.duration) && onDuration) {
              onDuration(target.duration);
            }
          }}
          onTimeUpdate={(e) => {
            const target = e.currentTarget;
            if (typeof target.currentTime === 'number' && onProgress) {
              onProgress(target.currentTime);
            }
          }}
          onError={() => {
            console.warn('Google Drive direct stream fallback to iframe preview.');
            setUseDriveIframeFallback(true);
          }}
        />
      </div>
    );
  }

  // 3. Render Google Drive Iframe Preview (Fallback if direct HTML5 stream is blocked by Google)
  if (driveEmbedUrl) {
    return (
      <div className="w-full h-full relative bg-black flex items-center justify-center">
        <iframe
          src={driveEmbedUrl}
          className="w-full h-full border-0 rounded-2xl"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Google Drive Video Player"
        />
      </div>
    );
  }

  // 4. Render Twitch Embed
  if (twitchEmbedUrl) {
    return (
      <div className="w-full h-full relative bg-black flex items-center justify-center">
        <iframe
          src={twitchEmbedUrl}
          className="w-full h-full border-0 rounded-2xl"
          allowFullScreen
          title="Twitch Video Player"
        />
      </div>
    );
  }

  // 5. Render Fallback HTML5 Player
  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      <video
        ref={videoElementRef}
        src={url}
        controls
        className="w-full h-full object-contain"
        onPlay={() => onPlay && onPlay()}
        onPause={() => onPause && onPause()}
        onLoadedMetadata={(e) => {
          const target = e.currentTarget;
          if (target.duration && onDuration) onDuration(target.duration);
        }}
        onTimeUpdate={(e) => {
          const target = e.currentTarget;
          if (target.currentTime && onProgress) onProgress(target.currentTime);
        }}
      />
    </div>
  );
};
