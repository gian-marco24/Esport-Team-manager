import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, Swords } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* HEADER WITH CTA BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Badge variant="gold" className="text-[10px]">
              Panel de Competencias
            </Badge>
            <span className="text-xs text-[#E2B86E] font-bold">• Historial URS Gamara</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">Resultados de Scrims & Torneos</h1>
          <p className="text-xs text-gray-300">
            Registro táctico, capturas de pantalla de scoreboard y estadísticas de rendimiento.
          </p>
        </div>

        <div className="shrink-0">
          <Link to="/dashboard/scrims/new">
            <Button variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
              Cargar Nuevo Resultado
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card glow="purple" className="text-center p-4">
          <p className="text-xs text-gray-400 font-semibold">Total Encuentros</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-[10px] text-[#8B44F7] font-bold mt-0.5">
            {stats.scrimsCount} Scrims | {stats.tournamentsCount} Torneos
          </p>
        </Card>

        <Card glow="gold" className="text-center p-4">
          <p className="text-xs text-gray-400 font-semibold">Winrate Global</p>
          <p className="text-2xl font-black text-[#E2B86E] mt-1">{stats.winrate}%</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{stats.wins} Victorias</p>
        </Card>

        <Card glow="purple" className="text-center p-4">
          <p className="text-xs text-gray-400 font-semibold">Victorias</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.wins}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Partidas ganadas</p>
        </Card>

        <Card glow="gold" className="text-center p-4">
          <p className="text-xs text-gray-400 font-semibold">Derrotas</p>
          <p className="text-2xl font-black text-red-400 mt-1">{stats.losses}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Para analizar y corregir</p>
        </Card>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-[#140b21] border border-[#26143E] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center space-x-1.5 bg-[#0D0914] border border-[#522B80]/60 rounded-lg p-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedType === 'all' ? 'bg-[#8B44F7] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('scrim')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedType === 'scrim' ? 'bg-[#8B44F7] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Scrims
            </button>
            <button
              onClick={() => setSelectedType('tournament')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
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
            className="bg-[#0D0914] border border-[#522B80]/60 text-gray-200 text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:border-[#8B44F7]"
          >
            <option value="all">Cualquier Resultado</option>
            <option value="win">Solo Victorias</option>
            <option value="loss">Solo Derrotas</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por rival o torneo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0D0914] border border-[#522B80]/60 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
          />
        </div>
      </div>

      {/* MATCHES GRID DISPLAY */}
      {isLoading ? (
        <LoadingSpinner label="Cargando historial de resultados..." />
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-500/40 rounded-xl text-center space-y-3">
          <p className="text-sm text-red-300 font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Reintentar
          </Button>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center bg-[#140b21]/50 border border-[#26143E] rounded-xl space-y-3">
          <Swords className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No se encontraron resultados</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'all' || selectedOutcome !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda.'
              : 'Aún no hay encuentros cargados. Haz clic en "Cargar Nuevo Resultado" para comenzar.'}
          </p>
          <Link to="/dashboard/scrims/new">
            <Button variant="secondary" size="sm" className="mt-2" leftIcon={<Plus className="w-4 h-4" />}>
              Cargar Primer Resultado
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} onDelete={removeMatch} />
          ))}
        </div>
      )}
    </div>
  );
};
