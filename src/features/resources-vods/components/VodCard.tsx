import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Video, Calendar, MapPin, Trash2, Swords, Trophy } from 'lucide-react';
import type { VodItem } from '../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface VodCardProps {
  vod: VodItem;
  onDelete?: (id: string) => void;
}

export const VodCard: React.FC<VodCardProps> = ({ vod, onDelete }) => {
  const providerColors = {
    youtube: 'bg-red-950/80 text-red-400 border-red-500/40',
    twitch: 'bg-purple-950/80 text-purple-400 border-purple-500/40',
    drive: 'bg-blue-950/80 text-blue-400 border-blue-500/40',
    custom: 'bg-gray-900 text-gray-300 border-gray-700',
  };

  const getOutcomeBadge = () => {
    if (!vod.outcome) return null;
    if (vod.outcome === 'win') {
      return (
        <Badge variant="success" className="text-[10px] px-2 py-0.5 font-bold">
          Victoria {vod.mapScore ? `(${vod.mapScore})` : vod.overallScore ? `(${vod.overallScore})` : ''}
        </Badge>
      );
    }
    if (vod.outcome === 'loss') {
      return (
        <Badge variant="danger" className="text-[10px] px-2 py-0.5 font-bold">
          Derrota {vod.mapScore ? `(${vod.mapScore})` : vod.overallScore ? `(${vod.overallScore})` : ''}
        </Badge>
      );
    }
    return (
      <Badge variant="gold" className="text-[10px] px-2 py-0.5 font-bold">
        Empate {vod.mapScore ? `(${vod.mapScore})` : vod.overallScore ? `(${vod.overallScore})` : ''}
      </Badge>
    );
  };

  return (
    <Card glow="purple" className="p-4 space-y-3 relative group hover:scale-[1.01] transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Bar: Provider Badge & Delete Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                providerColors[vod.provider]
              }`}
            >
              {vod.provider}
            </span>
            {vod.matchType && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#26143E] text-[#E2B86E] border border-[#8B44F7]/30 flex items-center gap-1">
                {vod.matchType === 'tournament' ? (
                  <>
                    <Trophy className="w-3 h-3 text-[#E2B86E]" /> {vod.tournamentName || 'Torneo'}
                  </>
                ) : (
                  <>
                    <Swords className="w-3 h-3 text-[#8B44F7]" /> Scrim
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {vod.matchDate && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#E2B86E]" /> {vod.matchDate}
              </span>
            )}
            {onDelete && !vod.sourceMatchId && (
              <button
                onClick={() => onDelete(vod.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity ml-1"
                title="Eliminar VOD"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video Preview Box */}
        <Link to={`/dashboard/vods/${vod.id}`} className="block relative rounded-xl overflow-hidden group/player">
          <div className="w-full h-36 bg-[#0D0914] border border-[#26143E] flex items-center justify-center relative">
            <div className="w-12 h-12 rounded-full bg-[#522B80]/80 border border-[#E2B86E]/50 flex items-center justify-center text-[#E2B86E] shadow-xl group-hover/player:scale-110 group-hover/player:bg-[#8B44F7] transition-all">
              <Play className="w-6 h-6 ml-1 fill-current" />
            </div>
            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-[10px] text-[#E2B86E] font-bold rounded">
              {vod.annotationsCount} Marcadores
            </span>
            {vod.mapName && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-[10px] text-white font-bold rounded flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#E2B86E]" /> {vod.mapName}
              </span>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Link to={`/dashboard/vods/${vod.id}`} className="flex-1">
              <h3 className="text-sm font-bold text-white hover:text-[#E2B86E] line-clamp-2 transition-colors">
                {vod.title}
              </h3>
            </Link>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5 flex-wrap gap-1">
            {vod.opponentName && (
              <span className="font-semibold text-gray-300">vs {vod.opponentName}</span>
            )}
            {getOutcomeBadge()}
          </div>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="pt-1">
        <Link to={`/dashboard/vods/${vod.id}`}>
          <button className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-[#26143E]/60 hover:bg-[#522B80]/60 border border-[#8B44F7]/40 rounded-lg text-xs text-white font-semibold transition-colors">
            <Video className="w-3.5 h-3.5 text-[#E2B86E]" />
            <span>Abrir Reproductor & Anotaciones</span>
          </button>
        </Link>
      </div>
    </Card>
  );
};
