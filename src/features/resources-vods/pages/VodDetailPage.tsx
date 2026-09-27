import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useVodPlayer } from '../hooks/useVodPlayer';
import type { VodAnnotation } from '../types';
import { VideoTimeline } from '../components/VideoTimeline';
import { AnnotationList } from '../components/AnnotationList';
import { AnnotationThreadChat } from '../components/AnnotationThreadChat';
import { UniversalVideoPlayer } from '../components/UniversalVideoPlayer';
import { AddAnnotationModal } from '../components/AddAnnotationModal';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const VodDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    vod,
    annotations,
    isLoading,
    error,
    playerRef,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    seekToTimestamp,
    createAnnotationMarker,
  } = useVodPlayer(id);

  const [activeAnnotation, setActiveAnnotation] = useState<VodAnnotation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'annotation' | 'marker'>('marker');

  if (isLoading) {
    return <LoadingSpinner label="Cargando reproductor VOD y anotaciones..." />;
  }

  if (error || !vod) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-red-400 font-semibold">{error || 'VOD no encontrada.'}</p>
        <Link to="/dashboard/vods">
          <button className="px-4 py-2 bg-[#522B80] text-white text-xs font-bold rounded-lg">
            Volver a la Biblioteca de VODs
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[2400px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#26143E] pb-3">
        <div className="flex items-center space-x-3 min-w-0">
          <Link
            to="/dashboard/vods"
            className="p-2 rounded-lg bg-[#140b21] border border-[#26143E] text-gray-400 hover:text-[#E2B86E] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-white truncate">{vod.title}</h1>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5 flex-wrap gap-1">
              <span className="uppercase text-[10px] font-bold text-[#E2B86E] px-1.5 py-0.5 bg-[#522B80]/40 rounded border border-[#E2B86E]/30">
                {vod.provider}
              </span>
              {vod.matchType && (
                <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                  {vod.matchType === 'tournament' ? (vod.tournamentName || 'Torneo') : 'Scrim'}
                </Badge>
              )}
              {vod.opponentName && <span className="font-semibold text-gray-200">vs {vod.opponentName}</span>}
              {vod.mapName && (
                <span className="flex items-center gap-1 text-[#E2B86E] font-semibold">
                  <MapPin className="w-3 h-3 text-[#E2B86E]" /> {vod.mapName}
                </span>
              )}
              {vod.outcome && (
                <Badge
                  variant={vod.outcome === 'win' ? 'success' : vod.outcome === 'loss' ? 'danger' : 'gold'}
                  className="text-[10px] px-2 py-0"
                >
                  {vod.outcome === 'win' ? 'Victoria' : vod.outcome === 'loss' ? 'Derrota' : 'Empate'}
                  {vod.mapScore ? ` (${vod.mapScore})` : vod.overallScore ? ` (${vod.overallScore})` : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Badge variant="purple" className="self-start sm:self-auto shrink-0">
          Estudio Táctico Sincronizado
        </Badge>
      </div>

      {/* Main Grid: Left 65% (Player + Timeline), Right 35% (Annotations List / Live Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Video Player & Timeline Container (65% width) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Universal Video Player Box */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-[#8B44F7]/40 shadow-2xl">
            <UniversalVideoPlayer
              playerRef={playerRef}
              url={vod.videoUrl}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onDuration={(d) => setDuration(d)}
              onProgress={(t) => setCurrentTime(t)}
            />
          </div>

          {/* Synchronized Interactive Timeline Bar */}
          <VideoTimeline
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            annotations={annotations}
            onSeek={seekToTimestamp}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSelectAnnotation={(ann) => {
              setActiveAnnotation(ann);
              seekToTimestamp(ann.timestampSeconds);
            }}
            onAddMarkerClick={(type) => {
              setModalType(type);
              setIsAddModalOpen(true);
            }}
          />
        </div>

        {/* Right Side Panel Container (35% width): Annotations List or Live Thread Chat */}
        <div className="lg:col-span-4 h-[650px] lg:h-[720px] 2xl:h-[820px] sticky top-20">
          {activeAnnotation ? (
            <AnnotationThreadChat
              annotation={activeAnnotation}
              onBack={() => setActiveAnnotation(null)}
            />
          ) : (
            <AnnotationList
              annotations={annotations}
              activeAnnotationId={activeAnnotation ? (activeAnnotation as VodAnnotation).id : undefined}
              onSelectAnnotation={(ann) => {
                setActiveAnnotation(ann);
                seekToTimestamp(ann.timestampSeconds);
              }}
              onAddMarkerClick={() => {
                setModalType('annotation');
                setIsAddModalOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Custom Modal for Adding Annotation Marker */}
      <AddAnnotationModal
        isOpen={isAddModalOpen}
        timestampSeconds={currentTime}
        initialType={modalType}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (title, type, customTimestamp) => {
          const targetTime = customTimestamp !== undefined ? customTimestamp : currentTime;
          const created = await createAnnotationMarker(targetTime, title, type);
          if (created && type === 'annotation') {
            setActiveAnnotation(created);
          }
        }}
      />
    </div>
  );
};
