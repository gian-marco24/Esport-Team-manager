import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Image as ImageIcon, Trash2, X, ChevronLeft, ChevronRight, Video, ExternalLink, Edit3, AlertTriangle, Sparkles } from 'lucide-react';
import type { Match } from '../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';

interface MatchCardProps {
  match: Match;
  onDelete?: (id: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onDelete }) => {
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const screenshots = match.screenshotUrls && match.screenshotUrls.length > 0
    ? match.screenshotUrls
    : (match as unknown as { screenshotUrl?: string }).screenshotUrl
    ? [(match as unknown as { screenshotUrl?: string }).screenshotUrl as string]
    : [];

  const vods = match.vods || [];

  const isWin = match.outcome === 'win';
  const isLoss = match.outcome === 'loss';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(match.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card
        glow={match.type === 'tournament' ? 'gold' : 'purple'}
        className="p-4 sm:p-5 space-y-3.5 relative group transition-all hover:scale-[1.01] overflow-hidden flex flex-col justify-between"
      >
        <div className="space-y-3.5">
          {/* Header: Type, Tournament Name & Action Buttons (Edit / Delete) */}
          <div className="border-b border-[#26143E] pb-3 space-y-2">
            {/* Top Row: Type & Date on left, Outcome & Actions on right */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={match.type === 'tournament' ? 'gold' : match.type === 'tryout' ? 'blue' : 'purple'} className="text-xs px-2.5 py-0.5 shrink-0">
                  {match.type === 'tournament' ? 'Torneo' : match.type === 'tryout' ? 'Tryouts' : 'Scrim'}
                </Badge>
                <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#E2B86E] shrink-0" /> {match.date}
                </span>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-auto">
                <span
                  className={`font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0 ${
                    isWin
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : isLoss
                      ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isWin ? 'Victoria' : isLoss ? 'Derrota' : 'Empate'}
                </span>

                {/* Edit Button */}
                <Link
                  to={`/dashboard/scrims/edit/${match.id}`}
                  className="p-1 text-gray-400 hover:text-[#E2B86E] transition-colors shrink-0"
                  title="Editar partido"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Link>

                {/* Delete Trigger */}
                {onDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors shrink-0"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tournament Name: Full width across card to avoid truncation */}
            {match.type === 'tournament' && match.tournamentName && (
              <div className="flex items-start gap-1.5 pt-0.5">
                <Trophy className="w-3.5 h-3.5 text-[#E2B86E] shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-bold text-[#E2B86E] leading-snug break-words">
                  {match.tournamentName}
                </p>
              </div>
            )}
          </div>

          {/* Rival vs URS Gamara Score Box */}
          <div className="p-3.5 sm:p-4 bg-[#0D0914]/80 border border-[#26143E] rounded-xl flex items-center justify-between gap-2">
            <div className="text-center flex-1 min-w-0" title={URS_GAMARA_TEAM.name}>
              <p className="text-xs text-gray-400 font-semibold line-clamp-1 break-words">{URS_GAMARA_TEAM.name}</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{match.overallScore.split('-')[0]?.trim() || '0'}</p>
            </div>

            <div className="px-2.5 sm:px-3 py-1 bg-[#26143E] rounded-lg text-xs font-extrabold text-[#E2B86E] shrink-0">
              VS
            </div>

            <div className="text-center flex-1 min-w-0" title={match.opponentName}>
              <p className="text-xs text-gray-400 font-semibold line-clamp-1 break-words">{match.opponentName}</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{match.overallScore.split('-')[1]?.trim() || '0'}</p>
            </div>
          </div>

          {/* Maps Breakdown */}
          {match.maps && match.maps.length > 0 && (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5">
                {match.maps.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs px-2.5 sm:px-3 py-1.5 bg-[#180d29]/80 rounded-lg border border-[#522B80]/40 flex-1 min-w-[120px]"
                  >
                    <span className="font-bold text-gray-200 truncate">{m.mapName}</span>
                    <span className="font-extrabold text-[#E2B86E] ml-2 shrink-0">
                      {m.teamScore} - {m.opponentScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshot Carousel Button */}
          {screenshots.length > 0 && (
            <div>
              <button
                onClick={() => {
                  setCurrentImageIndex(0);
                  setShowScreenshotModal(true);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3.5 bg-[#26143E]/60 hover:bg-[#522B80]/60 border border-[#8B44F7]/40 rounded-xl text-xs sm:text-sm text-[#8B44F7] hover:text-[#E2B86E] font-semibold transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#E2B86E] shrink-0" />
                <span className="truncate">Ver Captura del Resultado {screenshots.length > 1 ? `(${screenshots.length})` : ''}</span>
              </button>
            </div>
          )}

          {/* VODs Section */}
          <div>
            {vods.length === 0 ? (
              <div className="relative group/tooltip inline-block w-full">
                <button
                  disabled
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3.5 bg-[#180d29]/40 border border-gray-800 rounded-xl text-xs text-gray-500 font-medium cursor-not-allowed opacity-60"
                >
                  <Video className="w-4 h-4" />
                  <span>Ver VOD del Partido</span>
                </button>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-[#0D0914] text-gray-300 text-xs font-semibold py-1.5 px-3 rounded-lg border border-[#522B80] shadow-xl whitespace-nowrap z-20">
                  No se ha cargado la vod del partido
                </div>
              </div>
            ) : vods.length === 1 ? (
              <a
                href={vods[0].url}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2 px-3.5 bg-[#522B80]/40 hover:bg-[#8B44F7]/40 border border-[#8B44F7]/40 rounded-xl text-xs sm:text-sm text-[#E2B86E] font-semibold transition-colors shadow-sm"
              >
                <Video className="w-4 h-4 shrink-0" />
                <span className="truncate">{vods[0].title || 'Ver VOD del Partido'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#E2B86E] shrink-0" />
              </a>
            ) : (
              <div className="space-y-1.5 bg-[#140b21] p-2.5 rounded-xl border border-[#26143E]">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#8B44F7] shrink-0" /> VODs del Partido:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {vods.map((v) => (
                    <a
                      key={v.id}
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#26143E] hover:bg-[#522B80] border border-[#8B44F7]/30 rounded-lg text-xs text-[#E2B86E] font-bold transition-colors"
                    >
                      <span className="truncate">{v.title || (v.isFullMatch ? 'Partido Completo' : v.mapName ? `Mapa: ${v.mapName}` : 'VOD')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Match Stats & Map Analysis Button */}
        <div className="pt-2">
          <Link
            to={`/dashboard/scrims/match/${match.id}/stats`}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-[#522B80]/70 via-[#26143E] to-[#522B80]/70 hover:from-[#8B44F7] hover:to-[#522B80] border border-[#8B44F7]/50 hover:border-[#E2B86E] rounded-xl text-xs sm:text-sm text-white hover:text-[#E2B86E] font-bold transition-all shadow-md group"
          >
            <Sparkles className="w-4 h-4 text-[#E2B86E] group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Ver Estadísticas y Rendimiento por Mapa</span>
          </Link>
        </div>
      </Card>

      {/* Screenshot Carousel Modal */}
      {showScreenshotModal && screenshots.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#0D0914] border border-[#8B44F7]/50 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#26143E]">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-[#E2B86E]">
                  Captura: {URS_GAMARA_TEAM.name} vs {match.opponentName}
                </h3>
                {screenshots.length > 1 && (
                  <span className="text-xs text-gray-400 font-medium">
                    ({currentImageIndex + 1} / {screenshots.length})
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowScreenshotModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex justify-center items-center max-h-[75vh] overflow-hidden rounded-xl bg-black">
              <img
                src={screenshots[currentImageIndex]}
                alt={`Captura ${currentImageIndex + 1}`}
                className="object-contain max-h-[75vh] w-full"
              />

              {screenshots.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-[#8B44F7] text-white transition-colors shadow-lg"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-[#8B44F7] text-white transition-colors shadow-lg"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-[#140b21] border border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">¿Eliminar Resultado de Partido?</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente la partida contra{' '}
                <strong className="text-[#E2B86E]">{match.opponentName}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Confirmar Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
