import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, Swords, ChevronDown } from 'lucide-react';
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
    searchQuery,
    setSearchQuery,
    refetch,
    removeMatch,
  } = useMatches();

  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedType, selectedOutcome, searchQuery]);

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
            {stats.scrimsCount} Scrims | {stats.tournamentsCount} Torneos
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
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por rival o torneo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
          />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
