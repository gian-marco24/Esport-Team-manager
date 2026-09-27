import React from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Swords,
  Target,
  Flame,
  Award,
  Calendar,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useUserStats } from '../hooks/useUserStats';
import { useTeamStats } from '../hooks/useTeamStats';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';

export const DashboardPage: React.FC = () => {
  const { user, performanceHistory } = useUserStats();
  const { teamOverview, recentMatches } = useTeamStats();

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#26143E] via-[#522B80]/80 to-[#26143E] border border-[#8B44F7]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none">
          <Trophy className="w-64 h-64 text-[#E2B86E]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="gold" className="text-[10px]">
                {user?.role || 'Jugador'}
              </Badge>
              <span className="text-xs text-[#E2B86E] font-bold">• {URS_GAMARA_TEAM.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Bienvenido, {user?.displayName || 'Integrante'}
            </h1>
            <p className="text-xs text-gray-300">
              Posición: <strong className="text-white">{user?.position || 'Pendiente de asignación'}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-4 py-2 bg-[#0D0914]/80 border border-[#8B44F7]/40 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Winrate Equipo</p>
              <p className="text-lg font-extrabold text-[#E2B86E]">{teamOverview.winRate}%</p>
            </div>
            <div className="px-4 py-2 bg-[#0D0914]/80 border border-[#8B44F7]/40 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Partidas Registradas</p>
              <p className="text-lg font-extrabold text-[#8B44F7]">{teamOverview.totalMatches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="purple" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Partidas Jugadas</p>
            <p className="text-xl font-black text-white">{teamOverview.totalMatches}</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> Datos reales de BD
            </p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Victorias en BD</p>
            <p className="text-xl font-black text-white">{teamOverview.wins}</p>
            <p className="text-[10px] text-[#E2B86E] font-semibold mt-0.5">Partidas ganadas</p>
          </div>
        </Card>

        <Card glow="purple" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Derrotas en BD</p>
            <p className="text-xl font-black text-white">{teamOverview.losses}</p>
            <p className="text-[10px] text-purple-300 font-semibold mt-0.5">Partidas perdidas</p>
          </div>
        </Card>

        <Card glow="gold" className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#A88144]/30 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Winrate Global</p>
            <p className="text-xl font-black text-white">{teamOverview.winRate}%</p>
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Basado en registros reales</p>
          </div>
        </Card>
      </div>

      {/* CHART & NEXT MATCH ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KDA Performance Area Chart */}
        <Card glow="purple" className="lg:col-span-2 space-y-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#8B44F7]" />
              <span>Rendimiento KDA Reciente</span>
            </CardTitle>
            <Badge variant="purple">BD Real</Badge>
          </CardHeader>

          {performanceHistory.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kdaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B44F7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B44F7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26143E" />
                  <XAxis dataKey="match" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} domain={[0, 4]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D0914', borderColor: '#8B44F7', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="kda" stroke="#8B44F7" strokeWidth={3} fillOpacity={1} fill="url(#kdaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-[#522B80]/40 rounded-xl bg-[#0D0914]/40">
              <TrendingUp className="w-10 h-10 text-gray-500 mb-1" />
              <p className="text-xs text-gray-300 font-semibold">Sin datos gráficos suficientes</p>
              <p className="text-[11px] text-gray-500 max-w-sm">
                A medida que cargues scrims y partidos en la base de datos se generará el historial de rendimiento.
              </p>
            </div>
          )}
        </Card>

        {/* Next Match Card */}
        <Card glow="gold" className="space-y-4 flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[#E2B86E]">
                <Calendar className="w-5 h-5" />
                <span>Próximo Enfrentamiento</span>
              </CardTitle>
              <Badge variant="gold">Oficial</Badge>
            </CardHeader>

            {teamOverview.nextMatch ? (
              <div className="space-y-3 text-center py-4 bg-[#0D0914]/60 rounded-xl border border-[#A88144]/30">
                <p className="text-xs text-gray-400 font-semibold uppercase">{teamOverview.nextMatch.tournament}</p>
                <div className="flex items-center justify-center space-x-3">
                  <span className="font-extrabold text-white text-base">{URS_GAMARA_TEAM.name}</span>
                  <span className="text-xs text-[#E2B86E] font-bold">VS</span>
                  <span className="font-extrabold text-white text-base">{teamOverview.nextMatch.opponent}</span>
                </div>
                <p className="text-xs text-[#E2B86E] font-medium">{teamOverview.nextMatch.date}</p>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#0D0914]/40 rounded-xl border border-dashed border-[#A88144]/30 space-y-1">
                <p className="text-xs text-gray-400 font-medium">Sin partidos próximos agendados</p>
                <p className="text-[11px] text-gray-500">Consulta el calendario del equipo.</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Link to="/dashboard/scrims/new">
              <Button variant="secondary" className="w-full text-xs" leftIcon={<Plus className="w-4 h-4" />}>
                Cargar Nuevo Resultado
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* RECENT SCRIMS TABLE */}
      <Card glow="purple" className="space-y-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#8B44F7]" />
            <span>Historial Reciente de Scrims y Torneos en Base de Datos</span>
          </CardTitle>
          <span className="text-xs text-gray-400">Total en BD: {recentMatches.length}</span>
        </CardHeader>

        {recentMatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#140b21] text-gray-400 uppercase font-semibold border-b border-[#26143E]">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Rival</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Mapas / Score</th>
                  <th className="p-3">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26143E]">
                {recentMatches.map((m) => (
                  <tr key={m.id} className="hover:bg-[#26143E]/40 transition-colors">
                    <td className="p-3 font-medium text-gray-400">{m.date}</td>
                    <td className="p-3 font-bold text-white">{m.opponentName}</td>
                    <td className="p-3">
                      <Badge variant={m.type === 'tournament' ? 'gold' : 'purple'}>
                        {m.type === 'tournament' ? 'Torneo' : 'Scrim'}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-300">
                      {m.maps?.map((map) => map.mapName).join(', ') || 'N/A'} ({m.overallScore})
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          m.outcome === 'win'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : m.outcome === 'loss'
                            ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {m.outcome === 'win' ? 'Victoria' : m.outcome === 'loss' ? 'Derrota' : 'Empate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#0D0914]/40 border border-dashed border-[#522B80]/40 rounded-xl space-y-3">
            <p className="text-xs text-gray-400">Aún no hay partidas o scrims registradas en la base de datos.</p>
            <Link to="/dashboard/scrims/new">
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Cargar Primer Partido
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
