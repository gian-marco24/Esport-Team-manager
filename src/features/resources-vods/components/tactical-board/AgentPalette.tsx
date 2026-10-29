import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShieldAlert, Sparkles, Swords, Shield, Eye, Type } from 'lucide-react';
import type { ValorantAgent, TacticalTeam, TacticalToken, ValorantAbility } from '../../types/tacticalBoard';

// Helper para generar Data URI SVG seguros con codificación de caracteres
const createSvgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// Íconos oficiales vectoriales para Spike (Rombo oficial de Valorant), Peligro y Visión
const SPECIAL_ICONS = {
  spike: createSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="spikeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFE066"/>
        <stop offset="60%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#B45309"/>
      </radialGradient>
      <linearGradient id="spikeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2D1F3D"/>
        <stop offset="100%" stop-color="#140B1E"/>
      </linearGradient>
    </defs>
    <!-- Base circular oscura con anillo de oro brillante -->
    <circle cx="50" cy="50" r="46" fill="#120A1D" stroke="#F59E0B" stroke-width="3.5"/>
    <!-- Diamante / Rombo oficial de la Spike de Valorant -->
    <polygon points="50,14 84,50 50,86 16,50" fill="url(#spikeMetal)" stroke="#FFE066" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- Bisel interior tecnológico -->
    <polygon points="50,22 76,50 50,78 24,50" fill="#0C0614" stroke="#D97706" stroke-width="1.5"/>
    <!-- Núcleo radiante de Radianita -->
    <polygon points="50,30 68,50 50,70 32,50" fill="url(#spikeGlow)" stroke="#FFF" stroke-width="1.5"/>
    <!-- Centro energético y detalles tecnológicos -->
    <circle cx="50" cy="50" r="4" fill="#FFFFFF"/>
    <line x1="50" y1="16" x2="50" y2="26" stroke="#FFE066" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="74" x2="50" y2="84" stroke="#FFE066" stroke-width="2" stroke-linecap="round"/>
    <line x1="18" y1="50" x2="28" y2="50" stroke="#FFE066" stroke-width="2" stroke-linecap="round"/>
    <line x1="72" y1="50" x2="82" y2="50" stroke="#FFE066" stroke-width="2" stroke-linecap="round"/>
  </svg>`),
  danger: createSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#2A0B0E" stroke="#EF4444" stroke-width="4"/>
    <polygon points="50,18 84,78 16,78" fill="#EF4444"/>
    <polygon points="50,28 76,74 24,74" fill="#180507"/>
    <rect x="46" y="38" width="8" height="20" rx="4" fill="#EF4444"/>
    <circle cx="50" cy="66" r="4.5" fill="#EF4444"/>
  </svg>`),
  vision: createSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#1B0E2E" stroke="#A855F7" stroke-width="4"/>
    <path d="M18,50 C30,30 70,30 82,50 C70,70 30,70 18,50 Z" fill="none" stroke="#C084FC" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="50" cy="50" r="14" fill="#A855F7"/>
    <circle cx="50" cy="50" r="7" fill="#FFFFFF"/>
  </svg>`),
};

// Normalización de roles para admitir nombres en español e inglés
const normalizeRole = (roleStr?: string): string => {
  if (!roleStr) return '';
  const clean = roleStr.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.startsWith('duel')) return 'duelist';
  if (clean.startsWith('inic') || clean.startsWith('init')) return 'initiator';
  if (clean.startsWith('contr')) return 'controller';
  if (clean.startsWith('cent') || clean.startsWith('sent')) return 'sentinel';
  return clean;
};

interface AgentPaletteProps {
  agents: ValorantAgent[];
  tokens?: TacticalToken[];
  onlyInMap?: boolean;
  onToggleOnlyInMap?: () => void;
  onAddToken: (token: Omit<TacticalToken, 'id'>) => void;
}

export const AgentPalette: React.FC<AgentPaletteProps> = ({
  agents,
  tokens = [],
  onlyInMap = false,
  onToggleOnlyInMap,
  onAddToken,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<TacticalTeam>('attack');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el panel flotante de habilidades que aparece a la izquierda
  const [flyoutAgent, setFlyoutAgent] = useState<ValorantAgent | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(60);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Conjunto de nombres de agentes que están en el mapa (como agente o por sus habilidades)
  const agentsOnMapNames = useMemo(() => {
    const set = new Set<string>();
    tokens.forEach((t) => {
      if (t.type === 'agent') {
        set.add(t.name.toLowerCase().trim());
      } else if (t.type === 'ability') {
        const agentName = t.name.split(' - ')[0]?.toLowerCase().trim();
        if (agentName) set.add(agentName);
      }
    });
    return set;
  }, [tokens]);

  const agentsOnMapCount = useMemo(() => {
    return agents.filter((ag) => agentsOnMapNames.has(ag.displayName.toLowerCase().trim())).length;
  }, [agents, agentsOnMapNames]);

  // Filtrado de agentes
  const filteredAgents = agents.filter((ag) => {
    const matchesSearch = ag.displayName.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const agentRoleKey = normalizeRole(ag.role?.displayName);
    const matchesRole = selectedRole === 'all' || agentRoleKey === selectedRole;
    const matchesMapFilter = !onlyInMap || agentsOnMapNames.has(ag.displayName.toLowerCase().trim());

    return matchesSearch && matchesRole && matchesMapFilter;
  });

  const handleSpawnAgent = (agent: ValorantAgent) => {
    const initialX = selectedTeam === 'attack' ? 25 + Math.random() * 10 : 65 + Math.random() * 10;
    const initialY = 45 + Math.random() * 10;

    onAddToken({
      type: 'agent',
      name: agent.displayName,
      iconUrl: agent.displayIcon,
      x: initialX,
      y: initialY,
      team: selectedTeam,
      subtext: agent.role?.displayName || '',
      size: 28,
    });
  };

  const handleSpawnAbility = (agent: ValorantAgent, ability: ValorantAbility) => {
    onAddToken({
      type: 'ability',
      name: `${agent.displayName} - ${ability.displayName}`,
      iconUrl: ability.displayIcon,
      x: 50 + (Math.random() - 0.5) * 15,
      y: 50 + (Math.random() - 0.5) * 15,
      team: selectedTeam,
      subtext: ability.displayName,
      size: 22,
    });
  };

  const handleSpawnSpecialItem = (name: string, type: 'spike' | 'ping', iconUrl: string) => {
    onAddToken({
      type,
      name,
      iconUrl,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10,
      team: 'neutral',
      size: 24,
    });
  };

  const handleSpawnTextItem = () => {
    onAddToken({
      type: 'text',
      name: 'Nota Táctica',
      iconUrl: '',
      x: 50 + (Math.random() - 0.5) * 8,
      y: 50 + (Math.random() - 0.5) * 8,
      team: selectedTeam,
      text: 'Nota táctica',
      textLevel: 'H2',
      isBold: false,
      isItalic: false,
      isUnderline: false,
    });
  };

  // Manejadores de hover para el bloque flotante a la izquierda
  const handleCardMouseEnter = (agent: ValorantAgent, e: React.MouseEvent<HTMLDivElement>) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    const cardRect = e.currentTarget.getBoundingClientRect();
    const paletteRect = paletteRef.current?.getBoundingClientRect();
    if (paletteRect) {
      const relTop = cardRect.top - paletteRect.top;
      // Clamp para que el flyout no se desborde del alto del palette
      const maxTop = Math.max(10, paletteRect.height - 230);
      setFlyoutTop(Math.max(10, Math.min(maxTop, relTop - 15)));
    }
    setFlyoutAgent(agent);
  };

  const handleCardMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setFlyoutAgent(null);
    }, 250);
  };

  const handleFlyoutMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setFlyoutAgent(null);
    }, 200);
  };

  return (
    <div
      ref={paletteRef}
      className="relative bg-[#0D0914] border border-[#26143E] rounded-xl p-3.5 space-y-3 shadow-xl flex flex-col h-full"
    >
      {/* Selector de Bando: Ataque vs Defensa */}
      <div className="grid grid-cols-2 gap-2 border-b border-[#26143E] pb-3 shrink-0">
        <button
          type="button"
          onClick={() => setSelectedTeam('attack')}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap overflow-hidden cursor-pointer ${
            selectedTeam === 'attack'
              ? 'bg-red-950/80 border border-red-500/80 text-red-200 shadow-md shadow-red-950/50 ring-1 ring-red-500/40'
              : 'bg-[#140b21] border border-[#26143E] text-gray-400 hover:text-white'
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="truncate">Ataque (Rojo)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTeam('defense')}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap overflow-hidden cursor-pointer ${
            selectedTeam === 'defense'
              ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/40'
              : 'bg-[#140b21] border border-[#26143E] text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">Defensa (Cyan)</span>
        </button>
      </div>

      {/* Utilidades Rápidas Arrastrables o Clickeables */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <button
          type="button"
          draggable={true}
          onDragStart={(e) => {
            const tokenData = {
              type: 'spike',
              name: 'Spike',
              iconUrl: SPECIAL_ICONS.spike,
              team: 'neutral' as const,
              size: 24,
            };
            e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => handleSpawnSpecialItem('Spike', 'spike', SPECIAL_ICONS.spike)}
          title="Arrastra o haz click para colocar la Spike"
          className="flex items-center justify-center space-x-1 px-1.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-[11px] font-bold text-[#E2B86E] hover:bg-amber-900/60 transition-all cursor-grab active:cursor-grabbing whitespace-nowrap overflow-hidden select-none"
        >
          <Sparkles className="w-3 h-3 text-[#E2B86E] shrink-0" />
          <span className="truncate">+ Spike</span>
        </button>

        <button
          type="button"
          draggable={true}
          onDragStart={(e) => {
            const tokenData = {
              type: 'ping',
              name: 'Peligro',
              iconUrl: SPECIAL_ICONS.danger,
              team: 'neutral' as const,
              size: 24,
            };
            e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => handleSpawnSpecialItem('Peligro', 'ping', SPECIAL_ICONS.danger)}
          title="Arrastra o haz click para colocar Alerta"
          className="flex items-center justify-center space-x-1 px-1.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-[11px] font-bold text-red-300 hover:bg-red-900/60 transition-all cursor-grab active:cursor-grabbing whitespace-nowrap overflow-hidden select-none"
        >
          <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
          <span className="truncate">+ Alerta</span>
        </button>

        <button
          type="button"
          draggable={true}
          onDragStart={(e) => {
            const tokenData = {
              type: 'ping',
              name: 'Visión',
              iconUrl: SPECIAL_ICONS.vision,
              team: 'neutral' as const,
              size: 24,
            };
            e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => handleSpawnSpecialItem('Visión', 'ping', SPECIAL_ICONS.vision)}
          title="Arrastra o haz click para colocar Visión"
          className="flex items-center justify-center space-x-1 px-1.5 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/50 text-[11px] font-bold text-purple-300 hover:bg-purple-900/60 transition-all cursor-grab active:cursor-grabbing whitespace-nowrap overflow-hidden select-none"
        >
          <Eye className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="truncate">+ Visión</span>
        </button>

        <button
          type="button"
          draggable={true}
          onDragStart={(e) => {
            const tokenData = {
              type: 'text',
              name: 'Nota Táctica',
              iconUrl: '',
              team: selectedTeam,
              text: 'Nota táctica',
              textLevel: 'H2',
              isBold: false,
              isItalic: false,
              isUnderline: false,
            };
            e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={handleSpawnTextItem}
          title="Arrastra o haz click para colocar Cuadro de Texto"
          className="flex items-center justify-center space-x-1 px-1.5 py-1.5 rounded-lg bg-[#26143E] border border-[#8B44F7]/60 text-[11px] font-bold text-[#E2B86E] hover:bg-[#341b54] transition-all cursor-grab active:cursor-grabbing shadow-sm whitespace-nowrap overflow-hidden select-none"
        >
          <Type className="w-3 h-3 text-[#E2B86E] shrink-0" />
          <span className="truncate">+ Texto</span>
        </button>
      </div>

      {/* Buscador & Filtro por Rol */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar agente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#140b21] border border-[#26143E] rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B44F7]"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-[#140b21] border border-[#26143E] rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#8B44F7] cursor-pointer shrink-0"
        >
          <option value="all">Todos los roles</option>
          <option value="duelist">Duelistas</option>
          <option value="initiator">Iniciadores</option>
          <option value="controller">Controladores</option>
          <option value="sentinel">Centinelas</option>
        </select>
      </div>

      {/* Filtro Todos vs En el mapa [R] */}
      <div className="flex items-center space-x-1.5 bg-[#140b21] p-1 rounded-lg border border-[#26143E] shrink-0">
        <button
          type="button"
          onClick={() => {
            if (onlyInMap) onToggleOnlyInMap?.();
          }}
          className={`flex-1 py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
            !onlyInMap
              ? 'bg-[#26143E] text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Todos ({agents.length})
        </button>
        <button
          type="button"
          onClick={() => {
            if (!onlyInMap) onToggleOnlyInMap?.();
          }}
          title="Filtrar agentes que están en el mapa o cuyas habilidades están desplegadas (Presiona [R] para alternar)"
          className={`flex-1 py-1 px-2 rounded-md text-[11px] font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            onlyInMap
              ? 'bg-[#8B44F7] text-white shadow-md shadow-[#8B44F7]/40 ring-1 ring-[#E2B86E]/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <span>En el mapa</span>
          <kbd className="px-1 py-0.2 rounded bg-black/40 text-[9px] text-[#E2B86E] font-mono border border-white/10">R</kbd>
          {agentsOnMapCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#E2B86E]/20 text-[#E2B86E] text-[10px] font-extrabold">
              {agentsOnMapCount}
            </span>
          )}
        </button>
      </div>

      {/* Catálogo de Agentes en Cuadrícula de 2 Columnas (No crece el contenedor) */}
      <div className="flex-1 min-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#522B80]">
        {filteredAgents.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <p className="text-center text-xs text-gray-500">
              {onlyInMap
                ? 'No hay agentes ni habilidades en el mapa con los filtros seleccionados.'
                : 'No se encontraron agentes.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAgents.map((agent) => {
              const isSelected = flyoutAgent?.uuid === agent.uuid;

              return (
                <div
                  key={agent.uuid}
                  draggable={true}
                  onDragStart={(e) => {
                    const tokenData: Omit<TacticalToken, 'id'> = {
                      type: 'agent',
                      name: agent.displayName,
                      iconUrl: agent.displayIcon,
                      team: selectedTeam,
                      subtext: agent.role?.displayName || '',
                      size: 28,
                      x: 50,
                      y: 50,
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onMouseEnter={(e) => handleCardMouseEnter(agent, e)}
                  onMouseLeave={handleCardMouseLeave}
                  onClick={() => handleSpawnAgent(agent)}
                  title={`Arrastra al mapa o haz click para colocar a ${agent.displayName}`}
                  className={`bg-[#140b21] border rounded-xl p-2 transition-all cursor-grab active:cursor-grabbing select-none group flex items-center space-x-2 ${
                    isSelected
                      ? 'border-[#8B44F7] bg-[#1a0e2e] shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#8B44F7]/50'
                      : 'border-[#26143E] hover:border-[#8B44F7]/70 hover:bg-[#180e2b]'
                  }`}
                >
                  <img
                    src={agent.displayIcon}
                    alt={agent.displayName}
                    className={`w-7 h-7 rounded-full border shrink-0 object-cover transition-transform group-hover:scale-105 ${
                      selectedTeam === 'attack'
                        ? 'border-red-500 bg-red-950/40'
                        : 'border-cyan-500 bg-cyan-950/40'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-purple-200 transition-colors">
                      {agent.displayName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {agent.role?.displayName || 'Agente'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bloque Flotante de Habilidades a la Izquierda del Panel (No deforma la lista de agentes) */}
      {flyoutAgent && flyoutAgent.abilities.length > 0 && (
        <div
          style={{ top: `${flyoutTop}px` }}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
          className="absolute right-[calc(100%+10px)] z-50 w-60 bg-[#0E071A]/95 backdrop-blur-md border border-[#8B44F7]/60 rounded-xl p-3 shadow-2xl shadow-purple-950/90 animate-in fade-in zoom-in-95 duration-150 before:absolute before:-right-3 before:top-0 before:w-3 before:h-full"
        >
          {/* Cabecera del bloque flotante */}
          <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-[#26143E]">
            <img
              src={flyoutAgent.displayIcon}
              alt={flyoutAgent.displayName}
              className={`w-6 h-6 rounded-full border object-cover shrink-0 ${
                selectedTeam === 'attack'
                  ? 'border-red-500 bg-red-950/40'
                  : 'border-cyan-500 bg-cyan-950/40'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#E2B86E] truncate leading-tight">
                Habilidades de {flyoutAgent.displayName}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {flyoutAgent.role?.displayName || 'Agente'} • Arrastra al mapa
              </p>
            </div>
          </div>

          {/* Lista de habilidades arrastrables o clickeables */}
          <div className="space-y-1.5">
            {flyoutAgent.abilities.map((ab) => (
              <button
                type="button"
                key={ab.slot}
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  const tokenData: Omit<TacticalToken, 'id'> = {
                    type: 'ability',
                    name: `${flyoutAgent.displayName} - ${ab.displayName}`,
                    iconUrl: ab.displayIcon,
                    team: selectedTeam,
                    subtext: ab.displayName,
                    size: 22,
                    x: 50,
                    y: 50,
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpawnAbility(flyoutAgent, ab);
                }}
                title={`Arrastra o haz click para desplegar ${ab.displayName} (${ab.slot}) en el mapa`}
                className={`w-full flex items-center justify-between p-1.5 rounded-lg bg-[#150a24] border transition-all text-xs text-gray-200 hover:text-white cursor-grab active:cursor-grabbing hover:scale-[1.02] select-none ${
                  selectedTeam === 'attack'
                    ? 'border-red-950/70 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'border-cyan-950/70 hover:border-cyan-500/60 hover:bg-cyan-950/40'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <img
                    src={ab.displayIcon}
                    alt={ab.displayName}
                    className="w-5 h-5 object-contain shrink-0"
                  />
                  <span className="truncate text-[11px] font-semibold text-gray-100">{ab.displayName}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-[#E2B86E] font-mono font-bold uppercase shrink-0 border border-white/5 ml-1">
                  {ab.slot.replace('Ability', 'Hab ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
