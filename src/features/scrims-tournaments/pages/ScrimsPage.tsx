import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, Swords, ChevronDown, Calendar, X } from 'lucide-react';
import { useMatches } from '../hooks/useMatches';
import { MatchCard } from '../components/MatchCard';
import type { MatchResultOutcome } from '../types';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const ScrimsPage: React.FC = () => {
  const {
    matches,
    isLoading,
    error,
    stats,
    selectedType,
    setSelectedType,
    selectedOutcome,
    setSelectedOutcome,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    refetch,
    removeMatch,
  } = useMatches();

  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedType, selectedOutcome, selectedDate, searchQuery]);

  const displayedMatches = matches.slice(0, visibleCount);

  return (
    <div className="space-y-6 w-full pb-10">
      {/* HEADER WITH CTA BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <Badge variant="gold" className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5">
              Panel de Competencias
            </Badge>
            <span className="text-xs sm:text-sm text-[#E2B86E] font-bold">• Historial URS Gamara</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">Resultados de Scrims & Torneos</h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Registro táctico, capturas de pantalla de scoreboard y estadísticas de rendimiento.
          </p>
        </div>

        <div className="shrink-0">
          <Link to="/dashboard/scrims/new">
            <Button variant="secondary" size="lg" className="font-bold shadow-lg shadow-[#8B44F7]/25" leftIcon={<Plus className="w-5 h-5" />}>
              Cargar Nuevo Resultado
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <Card glow="purple" className="text-center p-5 sm:p-6 space-y-1">
          <p className="text-xs sm:text-sm text-gray-400 font-semibold">Total Encuentros</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-xs text-[#8B44F7] font-bold mt-1">
            {stats.scrimsCount} Scrims | {stats.tournamentsCount} Torneos{stats.tryoutsCount > 0 ? ` | ${stats.tryoutsCount} Tryouts` : ''}
          </p>
        </Card>

        <Card glow="gold" className="text-center p-5 sm:p-6 space-y-1">
          <p className="text-xs sm:text-sm text-gray-400 font-semibold">Winrate Global</p>
          <p className="text-2xl sm:text-3xl font-black text-[#E2B86E] mt-1">{stats.winrate}%</p>
          <p className="text-xs text-emerald-400 font-bold mt-1">{stats.wins} Victorias</p>
        </Card>

        <Card glow="purple" className="text-center p-5 sm:p-6 space-y-1">
          <p className="text-xs sm:text-sm text-gray-400 font-semibold">Victorias</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{stats.wins}</p>
          <p className="text-xs text-gray-400 mt-1">Partidas ganadas</p>
        </Card>

        <Card glow="gold" className="text-center p-5 sm:p-6 space-y-1">
          <p className="text-xs sm:text-sm text-gray-400 font-semibold">Derrotas</p>
          <p className="text-2xl sm:text-3xl font-black text-red-400 mt-1">{stats.losses}</p>
          <p className="text-xs text-gray-400 mt-1">Para analizar y corregir</p>
        </Card>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap desktop:flex-nowrap items-center justify-between gap-3">
        {/* Block 1: Filter Type Pills */}
        <div className="order-1 flex items-center space-x-1 bg-[#0D0914] border border-[#522B80]/60 rounded-xl p-1.5 overflow-x-auto scrollbar-none shrink-0 max-w-full">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'all' ? 'bg-[#8B44F7] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedType('scrim')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'scrim' ? 'bg-[#8B44F7] text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Scrims
          </button>
          <button
            onClick={() => setSelectedType('tournament')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedType === 'tournament' ? 'bg-[#E2B86E] text-[#0D0914] shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Torneos
          </button>
          <button
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
              placeholder="Buscar por rival o torneo..."
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
            Partidos: {matches.length}
          </span>
        </div>
      </div>

      {/* MATCHES GRID DISPLAY */}
      {isLoading ? (
        <LoadingSpinner label="Cargando historial de resultados..." />
      ) : error ? (
        <div className="p-8 bg-red-950/40 border border-red-500/40 rounded-2xl text-center space-y-3">
          <p className="text-sm sm:text-base text-red-300 font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reintentar
          </Button>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center bg-[#140b21]/50 border border-[#26143E] rounded-2xl space-y-3">
          <Swords className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-white">No se encontraron resultados</h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'all' || selectedOutcome !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda.'
              : 'Aún no hay encuentros cargados. Haz clic en "Cargar Nuevo Resultado" para comenzar.'}
          </p>
          <Link to="/dashboard/scrims/new">
            <Button variant="secondary" size="md" className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
              Cargar Primer Resultado
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 desktop:grid-cols-3 gap-6">
            {displayedMatches.map((m) => (
              <MatchCard key={m.id} match={m} onDelete={removeMatch} />
            ))}
          </div>

          {/* Load More Button (12 more matches per click) */}
          {visibleCount < matches.length && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="font-bold shadow-lg shadow-[#8B44F7]/25 px-8 flex items-center space-x-2"
                leftIcon={<ChevronDown className="w-4 h-4" />}
              >
                <span>Ver más encuentros ({matches.length - visibleCount} restantes)</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
