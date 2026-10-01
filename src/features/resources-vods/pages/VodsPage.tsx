import React, { useState } from 'react';
import { Video, Plus, Search, Sparkles } from 'lucide-react';
import { useVods } from '../hooks/useVods';
import { VodCard } from '../components/VodCard';
import { AddVodModal } from '../components/AddVodModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const VodsPage: React.FC = () => {
  const { vods, isLoading, error, addVod, removeVod } = useVods();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVods = vods.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      v.opponentName?.toLowerCase().includes(q) ||
      v.mapName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Badge variant="gold" className="text-xs">
              Estudio & Análisis
            </Badge>
            <span className="text-sm text-[#E2B86E] font-bold">• Biblioteca de VODs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">VODs & Revisiones Tácticas</h1>
          <p className="text-sm text-gray-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#E2B86E]" /> Reprodúcelos con marcadores por minuto y discusiones en tiempo real.
          </p>
        </div>

        <div className="shrink-0">
          <Button variant="secondary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4.5 h-4.5" />}>
            Agregar VOD
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, rival o mapa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
          />
        </div>
        <span className="text-sm text-gray-400 font-semibold hidden sm:inline">
          Total VODs: {filteredVods.length}
        </span>
      </div>

      {/* Grid of VOD Cards: 3 columns on 1080p, 4 columns on 1440p+ */}
      {isLoading ? (
        <LoadingSpinner label="Cargando biblioteca de VODs..." />
      ) : error ? (
        <p className="text-sm text-red-400 font-medium text-center">{error}</p>
      ) : filteredVods.length === 0 ? (
        <div className="p-12 text-center bg-[#140b21]/50 border border-[#26143E] rounded-2xl space-y-4">
          <Video className="w-14 h-14 text-gray-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No hay VODs disponibles</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Prueba borrando el filtro de búsqueda.'
              : 'Haz clic en "Agregar VOD" para incorporar un video de YouTube, Twitch o Google Drive.'}
          </p>
          <Button variant="secondary" size="md" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Agregar Primera VOD
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVods.map((v) => (
            <VodCard key={v.id} vod={v} onDelete={removeVod} />
          ))}
        </div>
      )}

      {/* Modal */}
      <AddVodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await addVod(data);
        }}
      />
    </div>
  );
};
