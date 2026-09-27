import React from 'react';
import { MessageSquare, ChevronRight, User, Plus } from 'lucide-react';
import { type VodAnnotation, getUserColor } from '../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface AnnotationListProps {
  annotations: VodAnnotation[];
  activeAnnotationId?: string;
  onSelectAnnotation: (annotation: VodAnnotation) => void;
  onAddMarkerClick: () => void;
}

export const AnnotationList: React.FC<AnnotationListProps> = ({
  annotations,
  activeAnnotationId,
  onSelectAnnotation,
  onAddMarkerClick,
}) => {
  // Filter only discussion thread annotations (exclude quick markers)
  const threadAnnotations = annotations.filter((a) => a.type !== 'marker');

  return (
    <div className="flex flex-col h-full bg-[#140b21] border border-[#26143E] rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#26143E] flex items-center justify-between shrink-0 bg-[#0D0914]/60">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#8B44F7]" />
            <span>Anotaciones & Debates</span>
          </h3>
          <p className="text-[11px] text-gray-400">Hilos de discusión por minuto de juego</p>
        </div>

        <Button size="sm" variant="secondary" onClick={onAddMarkerClick} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Anotación
        </Button>
      </div>

      {/* Scrollable Annotations List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {threadAnnotations.length === 0 ? (
          <div className="text-center py-12 space-y-2 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto text-gray-600" />
            <p className="text-xs font-semibold text-gray-400">No hay hilos de conversación aún</p>
            <p className="text-[11px]">Haz clic en "Anotación Táctica" en la línea de tiempo para iniciar un debate.</p>
          </div>
        ) : (
          threadAnnotations.map((ann) => {
            const isActive = activeAnnotationId === ann.id;
            const userColor = ann.color || getUserColor(ann.authorId, ann.authorName);

            return (
              <div
                key={ann.id}
                onClick={() => onSelectAnnotation(ann)}
                className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-[#522B80]/80 border-[#8B44F7] shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#8B44F7]'
                    : 'bg-[#0D0914]/60 border-[#26143E] hover:border-[#8B44F7]/40 hover:bg-[#26143E]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-[#26143E] text-[#E2B86E] border border-[#E2B86E]/40 rounded font-mono text-[11px] font-bold flex items-center gap-1">
                      <div className="w-1.5 h-3 rounded-full" style={{ backgroundColor: userColor }} />
                      {ann.timestampFormatted}
                    </span>
                    <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                      {ann.authorRole || 'Integrante'}
                    </Badge>
                  </div>

                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#E2B86E]' : 'text-gray-500'}`} />
                </div>

                <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed mb-2">
                  {ann.title}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#26143E]/60">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: userColor }}>
                    <User className="w-3 h-3" /> {ann.authorName}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#8B44F7]">
                    <MessageSquare className="w-3 h-3" />
                    {ann.repliesCount} {ann.repliesCount === 1 ? 'comentario' : 'comentarios'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
