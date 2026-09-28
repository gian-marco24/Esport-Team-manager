import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trophy, Swords, FileText, Calendar, ArrowRight, CheckCircle2, UserCheck, Shield, Users, LogIn } from 'lucide-react';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { teamService } from '../../teams/services/teamService';
import type { Roster, TeamMember } from '../../teams/types';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const [completeRosters, setCompleteRosters] = useState<{ roster: Roster; members: TeamMember[] }[]>([]);
  const [loadingRosters, setLoadingRosters] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOfficialRosters() {
      try {
        const [allRosters, allMembers] = await Promise.all([
          teamService.getRosters(URS_GAMARA_TEAM.id),
          teamService.getMembers(URS_GAMARA_TEAM.id),
        ]);

        // Find rosters that have AT LEAST 5 main titular players
        const validRosters = allRosters
          .map((roster) => {
            const rosterMembers = allMembers.filter((m) =>
              m.rosterAssignments?.some((a) => a.rosterId === roster.id && a.subrole === 'Player titular')
            );
            return { roster, members: rosterMembers };
          })
          .filter(({ members }) => members.length >= 5);

        if (isMounted) {
          setCompleteRosters(validRosters);
        }
      } catch (err) {
        console.error('Error fetching rosters for home page:', err);
      } finally {
        if (isMounted) setLoadingRosters(false);
      }
    }
    loadOfficialRosters();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuresList = [
    {
      icon: Swords,
      title: 'Gestión de Scrims & Resultados',
      description: 'Registra y analiza partidas de entrenamiento, capturas de pantalla, composiciones de mapas y estadísticas de ronda.',
    },
    {
      icon: FileText,
      title: 'Anotador & Cuaderno Táctico',
      description: 'Notas compartidas entre jugadores y cuerpo técnico para setups, ejecuciones y corrección de errores por mapa.',
    },
    {
      icon: Calendar,
      title: 'Cronograma & Calendario',
      description: 'Planificación centralizada de entrenamientos, revisión de VODs, horarios de torneos y disponibilidad del equipo.',
    },
    {
      icon: Trophy,
      title: 'Estadísticas & Análisis',
      description: 'Métricas de rendimiento individual y colectivo, Winrate por mapa, KDA promedios y seguimiento de objetivos.',
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#522B80]/30 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-[#8B44F7]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#26143E] border border-[#E2B86E]/50 rounded-full text-xs font-semibold text-[#E2B86E] shadow-lg shadow-[#8B44F7]/20">
            <Sparkles className="w-4 h-4 text-[#E2B86E] animate-pulse" />
            <span>Portal Oficial URS Gamara Esports</span>
          </div>

          <div className="flex justify-center my-4">
            <img
              src="/logo.png"
              alt={URS_GAMARA_TEAM.name}
              className="w-28 h-28 object-contain drop-shadow-[0_0_25px_rgba(139,68,247,0.4)] hover:scale-105 transition-transform duration-300"
            />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase leading-tight text-white">
            Plataforma de Gestión y <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B44F7] via-[#E2B86E] to-[#8B44F7]">
              Alto Rendimiento
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {URS_GAMARA_TEAM.description} Centraliza tácticas, monitorea estadísticas en tiempo real y organiza el desarrollo de cada integrante de la escuadra.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Ir al Dashboard del Equipo
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" variant="primary" leftIcon={<LogIn className="w-5 h-5 text-[#E2B86E]" />}>
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ROSTER SECTION (Only rendered if there are complete rosters with >= 5 titular players) */}
      {!loadingRosters && completeRosters.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {completeRosters.map(({ roster, members }) => (
            <div key={roster.id} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#522B80]/40 border border-[#8B44F7]/30 rounded-full text-xs font-semibold text-[#8B44F7] uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5 text-[#E2B86E]" />
                  <span>Plantilla Oficial</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-wide flex items-center justify-center gap-3">
                  {roster.logoUrl && (
                    <img src={roster.logoUrl} alt={roster.name} className="w-8 h-8 object-contain" />
                  )}
                  <span>{roster.name}</span>
                </h2>
                <p className="text-sm text-gray-400 max-w-xl mx-auto">
                  Escuadra oficial de {roster.game} integrada por 5 titulares confirmados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {members.map((player) => (
                  <Card key={player.id} glow="purple" className="relative group overflow-hidden text-center hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full p-1 bg-gradient-to-tr from-[#8B44F7] via-[#E2B86E] to-[#522B80] flex items-center justify-center">
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt={player.displayName}
                          className="w-full h-full object-cover rounded-full bg-[#0D0914]"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#140b21] flex items-center justify-center text-[#E2B86E]">
                          <Users className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <Badge variant="gold" className="mb-2">
                      Titular
                    </Badge>
                    <h3 className="font-bold text-white text-base">{player.displayName}</h3>
                    <p className="text-xs text-[#E2B86E] font-semibold">{player.teamRole}</p>
                    {player.country && (
                      <p className="text-[11px] text-gray-400 mt-1">{player.country}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ORGANIZATIONAL OVERVIEW & PRESENTATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="purple">Estructura Organizacional</Badge>
          <h2 className="text-3xl font-black text-white tracking-wide">Filosofía URS Gamara</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Organización estructurada en áreas operativas para garantizar un ecosistema profesional en Esports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card glow="purple" className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
              <Shield className="w-6 h-6 text-[#E2B86E]" />
            </div>
            <h3 className="font-bold text-white text-lg">Dirección & Liderazgo</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Gestión estratégica del club, toma de decisiones administrativas, asignación de roles de staff y coordinación general del proyecto.
            </p>
          </Card>

          <Card glow="gold" className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-lg">Cuerpo Técnico & Rosters</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Entrenadores, analistas y alineaciones de jugadores enfocados en la constante preparación, estudio de rivales y rendimiento competitivo.
            </p>
          </Card>

          <Card glow="purple" className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#8B44F7]">
              <Users className="w-6 h-6 text-[#8B44F7]" />
            </div>
            <h3 className="font-bold text-white text-lg">Staff & Creadores</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Equipo multidisciplinario que incluye gestión de contenido, soporte operacional y moderación de la comunidad oficial.
            </p>
          </Card>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="gold">Módulos del Sistema</Badge>
          <h2 className="text-3xl font-black text-white tracking-wide">Módulos de Gestión Integrados</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Herramientas exclusivas diseñadas para potenciar el flujo de trabajo del equipo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card key={feat.title} glow="gold" className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#522B80]/60 border border-[#E2B86E]/40 flex items-center justify-center text-[#E2B86E]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">{feat.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{feat.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CUSTOMIZATION / ACCESS FOOTER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#26143E] via-[#522B80] to-[#26143E] border border-[#8B44F7]/40 rounded-2xl p-8 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#E2B86E] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#8B44F7]" />
              <span>Acceso Privado e Integración Privada</span>
            </div>
            <h3 className="text-2xl font-black text-white">Gestión Centralizada URS Gamara</h3>
            <p className="text-xs sm:text-sm text-gray-300">
              El registro de nuevos integrantes y la asignación de roles se gestiona exclusivamente mediante invitaciones generadas por la Dirección (CEO).
            </p>
          </div>
          <div className="shrink-0">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="lg">
                  Panel de Control
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="lg" leftIcon={<LogIn className="w-4 h-4 text-[#E2B86E]" />}>
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
