import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Image as ImageIcon, Trash2, X, ChevronLeft, ChevronRight, Video, ExternalLink, Edit3, AlertTriangle } from 'lucide-react';
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
        className="p-4 space-y-3 relative group transition-all hover:scale-[1.01]"
      >
        {/* Header: Type, Tournament Name & Action Buttons (Edit / Delete) */}
        <div className="flex items-start justify-between border-b border-[#26143E] pb-2.5">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <Badge variant={match.type === 'tournament' ? 'gold' : 'purple'} className="text-[9px] px-2 py-0">
                {match.type === 'tournament' ? 'Torneo' : 'Scrim'}
              </Badge>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#E2B86E]" /> {match.date}
              </span>
            </div>
            {match.type === 'tournament' && match.tournamentName && (
              <p className="text-xs font-bold text-[#E2B86E] truncate flex items-center gap-1 mt-0.5">
                <Trophy className="w-3 h-3 shrink-0" /> {match.tournamentName}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <span
              className={`font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
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
              className="p-1 text-gray-400 hover:text-[#E2B86E] transition-colors"
              title="Editar partido"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>

            {/* Delete Trigger */}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                title="Eliminar registro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Rival vs URS Gamara Score Box */}
        <div className="p-3 bg-[#0D0914]/80 border border-[#26143E] rounded-lg flex items-center justify-between">
          <div className="text-center flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-semibold truncate">{URS_GAMARA_TEAM.name}</p>
            <p className="text-lg font-black text-white">{match.overallScore.split('-')[0]?.trim() || '0'}</p>
          </div>

          <div className="px-2.5 py-0.5 bg-[#26143E] rounded text-[10px] font-extrabold text-[#E2B86E]">
            VS
          </div>

          <div className="text-center flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-semibold truncate">{match.opponentName}</p>
            <p className="text-lg font-black text-white">{match.overallScore.split('-')[1]?.trim() || '0'}</p>
          </div>
        </div>

        {/* Maps Breakdown */}
        {match.maps && match.maps.length > 0 && (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {match.maps.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] px-2.5 py-1 bg-[#180d29]/80 rounded border border-[#522B80]/40 flex-1 min-w-[120px]"
                >
                  <span className="font-bold text-gray-200">{m.mapName}</span>
                  <span className="font-extrabold text-[#E2B86E] ml-2">
                    {m.teamScore} - {m.opponentScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VODs Section (Single VOD or Multi-VOD List) */}
        <div className="pt-1">
          {vods.length === 0 ? (
            <div className="relative group/tooltip inline-block w-full">
              <button
                disabled
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-[#180d29]/40 border border-gray-800 rounded-lg text-xs text-gray-500 font-medium cursor-not-allowed opacity-60"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Ver VOD del Partido</span>
              </button>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-[#0D0914] text-gray-300 text-[10px] font-semibold py-1 px-2.5 rounded border border-[#522B80] shadow-xl whitespace-nowrap z-20">
                No se ha cargado la vod del partido
              </div>
            </div>
          ) : vods.length === 1 ? (
            <a
              href={vods[0].url}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-[#522B80]/40 hover:bg-[#8B44F7]/40 border border-[#8B44F7]/40 rounded-lg text-xs text-[#E2B86E] font-semibold transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Ver VOD del Partido</span>
              <ExternalLink className="w-3 h-3 text-[#E2B86E]" />
            </a>
          ) : (
            <div className="space-y-1 bg-[#140b21] p-2 rounded-lg border border-[#26143E]">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Video className="w-3 h-3 text-[#8B44F7]" /> VODs del Partido:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vods.map((v) => (
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#26143E] hover:bg-[#522B80] border border-[#8B44F7]/30 rounded text-[10px] text-[#E2B86E] font-bold transition-colors"
                  >
                    <span>{v.isFullMatch ? 'Partido Completo' : v.mapName || 'VOD'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Screenshot Carousel Button */}
        {screenshots.length > 0 && (
          <div>
            <button
              onClick={() => {
                setCurrentImageIndex(0);
                setShowScreenshotModal(true);
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-[#26143E]/60 hover:bg-[#522B80]/60 border border-[#8B44F7]/40 rounded-lg text-xs text-[#8B44F7] font-semibold transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>
                Ver Captura del Resultado {screenshots.length > 1 ? `(${screenshots.length})` : ''}
              </span>
            </button>
          </div>
        )}
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
