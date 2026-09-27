import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trophy, Flame, Swords, FileText, Calendar, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useAuthContext } from '../../../app/providers/AuthProvider';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthContext();

  const rosterPreview = [
    { name: 'GamaraPro', role: 'Duelista', agent: 'Jett / Raze', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150', tag: 'Capitán' },
    { name: 'VortexUG', role: 'Iniciador', agent: 'Sova / Fade', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', tag: 'Titular' },
    { name: 'ShadowG', role: 'Controlador', agent: 'Omen / Viper', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', tag: 'Titular' },
    { name: 'Aegis', role: 'Centinela', agent: 'Killjoy / Cypher', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', tag: 'Titular' },
    { name: 'Kaiser', role: 'Head Coach', agent: 'Estratega Principal', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', tag: 'Staff' },
  ];

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
              <>
                <Link to="/register">
                  <Button size="lg" variant="primary" leftIcon={<Flame className="w-5 h-5 text-[#E2B86E]" />}>
                    Unirse a URS Gamara
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Acceder con mi Cuenta
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ROSTER SECTION */}
      <section id="team" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#522B80]/40 border border-[#8B44F7]/30 rounded-full text-xs font-semibold text-[#8B44F7] uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-[#E2B86E]" />
            <span>Plantilla Oficial</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-wide">Escuadra Titular</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Integrantes activos de {URS_GAMARA_TEAM.name} comprometidos con la excelencia táctica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {rosterPreview.map((player) => (
            <Card key={player.name} glow="purple" className="relative group overflow-hidden text-center hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full p-1 bg-gradient-to-tr from-[#8B44F7] via-[#E2B86E] to-[#522B80]">
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-full h-full object-cover rounded-full bg-[#0D0914]"
                />
              </div>
              <Badge variant={player.tag === 'Capitán' ? 'gold' : 'purple'} className="mb-2">
                {player.tag}
              </Badge>
              <h3 className="font-bold text-white text-base">{player.name}</h3>
              <p className="text-xs text-[#E2B86E] font-semibold">{player.role}</p>
              <p className="text-[11px] text-gray-400 mt-1">{player.agent}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="gold">Arquitectura & Funcionalidades</Badge>
          <h2 className="text-3xl font-black text-white tracking-wide">Módulos de Gestión Integrados</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Diseñado especialmente para optimizar la toma de decisiones y el progreso del equipo.
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

      {/* CUSTOMIZATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#26143E] via-[#522B80] to-[#26143E] border border-[#8B44F7]/40 rounded-2xl p-8 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#E2B86E] uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#8B44F7]" />
              <span>Diseño Modular Personalizable</span>
            </div>
            <h3 className="text-2xl font-black text-white">Preparado para Expansión Futura</h3>
            <p className="text-xs sm:text-sm text-gray-300">
              Aunque actualmente este portal está configurado a medida para <strong>{URS_GAMARA_TEAM.name}</strong>, toda la arquitectura visual, tokens de color y servicios están preparados para soportar múltiples equipos dinámicamente.
            </p>
          </div>
          <div className="shrink-0">
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Comenzar Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
