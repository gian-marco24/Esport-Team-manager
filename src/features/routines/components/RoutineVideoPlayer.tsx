import React, { useState } from 'react';
import { Play, Power, Video as VideoIcon, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface RoutineVideoPlayerProps {
  videoUrl?: string;
  title: string;
}

/**
 * Extracts YouTube embed URL or returns direct link
 */
function getEmbedUrl(url?: string): string | null {
  if (!url) return null;

  // YouTube match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // Twitch match
  const twitchMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (twitchMatch && twitchMatch[1]) {
    const parentHost = window.location.hostname || 'localhost';
    return `https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${parentHost}&autoplay=true`;
  }

  // Vimeo match
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return url;
}

export const RoutineVideoPlayer: React.FC<RoutineVideoPlayerProps> = ({ videoUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getEmbedUrl(videoUrl);

  if (!videoUrl) {
    return (
      <div className="w-full h-full min-h-[200px] sm:min-h-[240px] bg-[#0D0914] border border-[#26143E] rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-500 space-y-2">
        <VideoIcon className="w-8 h-8 text-gray-600" />
        <p className="text-xs font-medium">Sin video demostrativo adjunto.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[250px] bg-black/80 rounded-2xl overflow-hidden border border-[#522B80]/60 shadow-xl flex items-center justify-center group">
      {!isPlaying ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b0c30] via-[#140b21] to-black flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#522B80]/50 border border-[#E2B86E] flex items-center justify-center text-[#E2B86E] shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
            <Play className="w-6 h-6 fill-current ml-1" />
          </div>

          <div className="space-y-1 max-w-xs">
            <span className="text-[10px] font-bold text-[#E2B86E] uppercase tracking-wider block">
              Video Tutorial / Guía
            </span>
            <p className="text-xs font-bold text-white line-clamp-1">{title}</p>
            <p className="text-[10px] text-gray-400">
              Reproductor desactivado para ahorrar rendimiento. Haz clic para reproducir.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPlaying(true)}
            className="text-xs font-bold shadow-lg shadow-[#8B44F7]/30"
          >
            ▶ Cargar Video de Rutina
          </Button>
        </div>
      ) : (
        <div className="relative w-full h-full flex flex-col">
          {/* Top minimal control to power off player */}
          <div className="absolute top-2 right-2 z-20 flex items-center space-x-1.5">
            <button
              onClick={() => setIsPlaying(false)}
              className="px-2 py-1 bg-black/80 hover:bg-red-950/80 border border-red-500/40 rounded-lg text-[10px] font-bold text-red-300 hover:text-white flex items-center gap-1 transition-all backdrop-blur-sm"
              title="Apagar reproductor"
            >
              <Power className="w-3 h-3" />
              <span>Apagar Video</span>
            </button>
          </div>

          {embedUrl?.includes('http') ? (
            <iframe
              src={embedUrl}
              title={`Video de ${title}`}
              className="w-full h-full min-h-[220px] sm:min-h-[250px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={embedUrl || ''}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
            />
          )}
        </div>
      )}
    </div>
  );
};
