import React from 'react';
import { Clock, Play, Pause, Bookmark, MessageSquare } from 'lucide-react';
import { type VodAnnotation, formatVideoTimestamp, getUserColor } from '../types';
import { Button } from '../../../components/ui/Button';

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  annotations: VodAnnotation[];
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onSelectAnnotation?: (annotation: VodAnnotation) => void;
  onAddMarkerClick: (type: 'annotation' | 'marker') => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  currentTime,
  duration,
  isPlaying,
  annotations,
  onSeek,
  onTogglePlay,
  onSelectAnnotation,
  onAddMarkerClick,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate minute ticks
  const minuteTicks: number[] = [];
  const totalMinutes = Math.max(1, Math.ceil(duration / 60));
  const step = totalMinutes > 40 ? 5 : totalMinutes > 20 ? 2 : 1;

  for (let m = 0; m <= totalMinutes; m += step) {
    minuteTicks.push(m * 60);
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * duration;
    onSeek(targetSeconds);
  };

  return (
    <div className="space-y-3 bg-[#140b21] border border-[#26143E] rounded-xl p-4 shadow-lg">
      {/* Playback Controls & Timestamp Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-lg bg-[#522B80] hover:bg-[#8B44F7] text-white transition-colors shadow"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <div className="flex items-center space-x-1.5 text-gray-300 font-mono font-bold">
            <Clock className="w-4 h-4 text-[#E2B86E]" />
            <span className="text-[#E2B86E]">{formatVideoTimestamp(currentTime)}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{formatVideoTimestamp(duration)}</span>
          </div>
        </div>

        {/* Action Buttons: Add Marker (Dot) vs Add Annotation (Discussion Thread) */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddMarkerClick('marker')}
            leftIcon={<Bookmark className="w-3.5 h-3.5 text-[#E2B86E]" />}
          >
            Marcador Rápido
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddMarkerClick('annotation')}
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          >
            Anotación Táctica
          </Button>
        </div>
      </div>

      {/* Synchronized Interactive Timeline Track */}
      <div className="space-y-1">
        <div
          onClick={handleTimelineClick}
          className="relative h-7 bg-[#0D0914] border border-[#522B80]/60 rounded-lg cursor-pointer overflow-hidden group select-none"
        >
          {/* Progress Bar Fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#522B80] to-[#8B44F7] opacity-80"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Current Time Indicator Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-[#E2B86E] z-10 shadow-lg shadow-[#E2B86E]/50"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Timeline Pins: Markers (Solid Dots) & Annotations (Vertical Lines) */}
          {annotations.map((ann) => {
            const pinPercent = duration > 0 ? (ann.timestampSeconds / duration) * 100 : 0;
            const isMarker = ann.type === 'marker';
            const userColor = ann.color || getUserColor(ann.authorId, ann.authorName);

            return (
              <div
                key={ann.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(ann.timestampSeconds);
                  if (!isMarker && onSelectAnnotation) {
                    onSelectAnnotation(ann);
                  }
                }}
                style={{ left: `${pinPercent}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group/pin cursor-pointer"
              >
                {/* Visual Representation */}
                {isMarker ? (
                  /* Marcador: Solid filled dot (no black ring, transparent background) */
                  <div
                    className="w-3 h-3 rounded-full shadow-lg group-hover/pin:scale-150 transition-transform"
                    style={{ backgroundColor: userColor }}
                  />
                ) : (
                  /* Anotación: Small vertical line */
                  <div
                    className="w-1 h-5 rounded-full shadow-lg group-hover/pin:scale-125 transition-transform"
                    style={{ backgroundColor: userColor }}
                  />
                )}

                {/* Floating Tooltip Card on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/pin:block bg-[#0D0914] border border-[#8B44F7]/60 text-white text-[11px] p-2 rounded-xl font-semibold whitespace-nowrap shadow-2xl z-30 pointer-events-none min-w-[140px] space-y-1">
                  <div className="flex items-center justify-between gap-2 border-b border-[#26143E] pb-1">
                    <span className="font-bold text-xs" style={{ color: userColor }}>
                      {ann.authorName}
                    </span>
                    <span className="text-[#E2B86E] font-mono text-[10px]">{ann.timestampFormatted}</span>
                  </div>
                  <p className="text-gray-200 text-[10px] max-w-[200px] truncate">{ann.title}</p>
                  <div className="text-[9px] text-gray-400 font-normal">
                    {isMarker ? '📍 Marcador Rápido' : '💬 Anotación (Clic para abrir discusión)'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minute Ticks Scale Labels */}
        <div className="relative h-4 text-[9px] text-gray-500 font-mono select-none">
          {minuteTicks.map((tickSecs) => {
            if (duration > 0 && tickSecs > duration) return null;
            const posPercent = duration > 0 ? (tickSecs / duration) * 100 : 0;
            return (
              <div
                key={tickSecs}
                style={{ left: `${posPercent}%` }}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              >
                <div className="w-px h-1 bg-[#26143E]" />
                <span>{formatVideoTimestamp(tickSecs)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
