import React, { useState, useMemo } from 'react';
import { Video, Plus, Search, Sparkles, Calendar, X } from 'lucide-react';
import type { MatchType, MatchResultOutcome } from '../../scrims-tournaments/types';
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
  const [selectedType, setSelectedType] = useState<MatchType | 'all'>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<MatchResultOutcome | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const filteredVods = useMemo(() => {
    const list = vods.filter((v) => {
      if (selectedType !== 'all' && v.matchType !== selectedType) return false;
      if (selectedOutcome !== 'all' && v.outcome !== selectedOutcome) return false;
      if (selectedDate) {
        const vDate = v.matchDate || (v.createdAt ? v.createdAt.slice(0, 10) : '');
        if (vDate !== selectedDate) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.opponentName?.toLowerCase().includes(q) ||
        v.mapName?.toLowerCase().includes(q) ||
        v.tournamentName?.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.matchDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.matchDate || 0).getTime();
      return timeB - timeA;
    });
  }, [vods, selectedType, selectedOutcome, selectedDate, searchQuery]);

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
      <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center space-x-1.5 bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-1.5">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                selectedType === 'all' ? 'bg-[#8B44F7] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('scrim')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                selectedType === 'scrim' ? 'bg-[#8B44F7] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Scrims
            </button>
            <button
              onClick={() => setSelectedType('tournament')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                selectedType === 'tournament' ? 'bg-[#E2B86E] text-[#0D0914]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Torneos
            </button>
            <button
              onClick={() => setSelectedType('tryout')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                selectedType === 'tryout' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tryouts
            </button>
          </div>

          {/* Filter Outcome */}
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value as MatchResultOutcome | 'all')}
            className="bg-[#0D0914] border border-[#522B80]/60 text-gray-200 text-xs sm:text-sm rounded-xl py-2 px-3.5 focus:outline-none focus:border-[#8B44F7] cursor-pointer"
          >
            <option value="all">Cualquier Resultado</option>
            <option value="win">Solo Victorias</option>
            <option value="loss">Solo Derrotas</option>
            <option value="draw">Solo Empates</option>
          </select>

          {/* Filter Date */}
          <div className="flex items-center space-x-2 bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-3 py-1.5 focus-within:border-[#8B44F7]">
            <Calendar className="w-4 h-4 text-[#E2B86E] shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-gray-200 text-xs sm:text-sm focus:outline-none cursor-pointer [color-scheme:dark]"
              title="Filtrar por fecha específica"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-gray-400 hover:text-white p-0.5 ml-1 transition-colors"
                title="Limpiar filtro de fecha"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input & Total */}
        <div className="flex items-center gap-3 w-full md:w-auto">
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
