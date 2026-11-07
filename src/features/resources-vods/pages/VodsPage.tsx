import React, { useState, useMemo } from 'react';
import { Video, Plus, Search, Sparkles, Calendar, X, ChevronDown } from 'lucide-react';
import type { MatchResultOutcome } from '../../scrims-tournaments/types';
import type { VodType } from '../types';
import { useVods } from '../hooks/useVods';
import { VodCard } from '../components/VodCard';
import { AddVodModal } from '../components/AddVodModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const VodsPage: React.FC = () => {
  const { vods, isLoading, isLoadingMore, hasMore, loadMore, error, addVod, removeVod } = useVods(9);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<VodType | 'all'>('all');
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
      <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap desktop:flex-nowrap items-center justify-between gap-3">
        {/* Block 1: Filter Type Pills */}
        <div className="order-1 flex items-center space-x-1 bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-1.5 overflow-x-auto scrollbar-none shrink-0 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'all' ? 'bg-[#8B44F7] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('analysis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'analysis' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Análisis
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('scrim')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'scrim' ? 'bg-[#8B44F7] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Scrims
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('tournament')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'tournament' ? 'bg-[#E2B86E] text-[#0D0914] shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Torneos
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('tryout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'tryout' ? 'bg-sky-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Tryouts
          </button>
        </div>

        {/* Block 2: Secondary Filters (Outcome & Date) - In 1 row on >= 1370px, drops to row 2 on < 1370px */}
        <div className="order-3 desktop:order-2 w-full desktop:w-auto flex items-center gap-2.5 flex-wrap pt-2.5 desktop:pt-0 border-t border-[#26143E] desktop:border-t-0 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
            Filtros:
          </span>

          {/* Filter Outcome */}
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value as MatchResultOutcome | 'all')}
            className="bg-[#0D0914] border border-[#522B80]/60 text-gray-200 text-xs rounded-xl py-1.5 px-3 focus:outline-none focus:border-[#8B44F7] cursor-pointer"
          >
            <option value="all">Cualquier Resultado</option>
            <option value="win">Solo Victorias</option>
            <option value="loss">Solo Derrotas</option>
            <option value="draw">Solo Empates</option>
          </select>

          {/* Filter Date */}
          <div className="flex items-center space-x-2 bg-[#0D0914] border border-[#522B80]/60 rounded-xl px-2.5 py-1 focus-within:border-[#8B44F7]">
            <Calendar className="w-3.5 h-3.5 text-[#E2B86E] shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-gray-200 text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
              title="Filtrar por fecha específica"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-gray-400 hover:text-white p-0.5 ml-1 transition-colors"
                title="Limpiar fecha"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Reset all button if active */}
          {(selectedType !== 'all' || selectedOutcome !== 'all' || selectedDate || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedType('all');
                setSelectedOutcome('all');
                setSelectedDate('');
                setSearchQuery('');
              }}
              className="text-[11px] font-bold text-[#E2B86E] hover:underline px-2 py-1 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Block 3: Search Box & Total Count - Placed on right on >= 1370px, or on row 1 right side on < 1370px */}
        <div className="order-2 desktop:order-3 flex items-center gap-3 w-full sm:w-auto desktop:ml-auto shrink-0">
          <div className="relative flex-1 sm:w-72 xl:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título, rival o mapa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl py-2 pl-9 pr-3.5 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400 font-semibold whitespace-nowrap shrink-0">
            VODs: {filteredVods.length}{hasMore ? '+' : ''}
          </span>
        </div>
      </div>

      {/* Grid of VOD Cards */}
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
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 desktop:grid-cols-3 gap-6">
            {filteredVods.map((v) => (
              <VodCard key={v.id} vod={v} onDelete={removeVod} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <Button
                variant="secondary"
                size="md"
                onClick={loadMore}
                isLoading={isLoadingMore}
                leftIcon={<ChevronDown className="w-4 h-4" />}
                className="px-6 py-2.5 shadow-lg shadow-[#8B44F7]/20"
              >
                Ver más VODs (+9)
              </Button>
            </div>
          )}
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
