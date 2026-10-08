import React, { useState } from 'react';
import { Search, ShieldAlert, Sparkles, Plus, Swords, Shield, Crosshair, Eye } from 'lucide-react';
import type { ValorantAgent, TacticalTeam, TacticalToken, ValorantAbility } from '../../types/tacticalBoard';

// Íconos oficiales vectoriales para Spike, Peligro y Visión
const SPECIAL_ICONS = {
  spike: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23FFE066"/><stop offset="60%" stop-color="%23F59E0B"/><stop offset="100%" stop-color="%23B45309"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="%23181320" stroke="%23F59E0B" stroke-width="4"/><polygon points="50,16 80,76 20,76" fill="url(%23g)" stroke="%23FFF" stroke-width="2"/><polygon points="50,32 70,72 30,72" fill="%230D0914"/><circle cx="50" cy="56" r="7" fill="%23F59E0B"/><line x1="50" y1="20" x2="50" y2="34" stroke="%23FFF" stroke-width="3" stroke-linecap="round"/></svg>`,
  danger: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%232A0B0E" stroke="%23EF4444" stroke-width="4"/><polygon points="50,18 84,78 16,78" fill="%23EF4444"/><polygon points="50,28 76,74 24,74" fill="%23180507"/><rect x="46" y="38" width="8" height="20" rx="4" fill="%23EF4444"/><circle cx="50" cy="66" r="4.5" fill="%23EF4444"/></svg>`,
  vision: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%231B0E2E" stroke="%23A855F7" stroke-width="4"/><path d="M18,50 C30,30 70,30 82,50 C70,70 30,70 18,50 Z" fill="none" stroke="%23C084FC" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="50" r="14" fill="%23A855F7"/><circle cx="50" cy="50" r="7" fill="%23FFFFFF"/></svg>`,
};

interface AgentPaletteProps {
  agents: ValorantAgent[];
  onAddToken: (token: Omit<TacticalToken, 'id'>) => void;
}

export const AgentPalette: React.FC<AgentPaletteProps> = ({ agents, onAddToken }) => {
  const [selectedTeam, setSelectedTeam] = useState<TacticalTeam>('attack');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<ValorantAgent | null>(null);

  // Filtrado de agentes
  const filteredAgents = agents.filter((ag) => {
    const matchesSearch = ag.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRole === 'all' ||
      (ag.role && ag.role.displayName.toLowerCase() === selectedRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const handleSpawnAgent = (agent: ValorantAgent) => {
    // Generar posición inicial en el cuadrante de spawn correspondiente
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
      size: 38,
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
      size: 32,
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
      size: 34,
    });
  };

  return (
    <div className="bg-[#0D0914] border border-[#26143E] rounded-xl p-3.5 space-y-3.5 shadow-xl flex flex-col h-full">
      {/* Selector de Bando: Ataque vs Defensa */}
      <div className="grid grid-cols-2 gap-2 border-b border-[#26143E] pb-3">
        <button
          type="button"
          onClick={() => setSelectedTeam('attack')}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap overflow-hidden ${
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
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap overflow-hidden ${
            selectedTeam === 'defense'
              ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-200 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/40'
              : 'bg-[#140b21] border border-[#26143E] text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">Defensa (Cyan)</span>
        </button>
      </div>

      {/* Utilidades Especiales Rápidas (Spike Oficial, Peligro, Visión) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => handleSpawnSpecialItem('Spike', 'spike', SPECIAL_ICONS.spike)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-[11px] font-bold text-[#E2B86E] hover:bg-amber-900/60 shrink-0 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E2B86E]" />
          <span>+ Spike</span>
        </button>

        <button
          type="button"
          onClick={() => handleSpawnSpecialItem('Peligro', 'ping', SPECIAL_ICONS.danger)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/50 text-[11px] font-bold text-red-300 hover:bg-red-900/60 shrink-0 transition-all cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>+ Alerta</span>
        </button>

        <button
          type="button"
          onClick={() => handleSpawnSpecialItem('Visión', 'ping', SPECIAL_ICONS.vision)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/50 text-[11px] font-bold text-purple-300 hover:bg-purple-900/60 shrink-0 transition-all cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Ojo/Visión</span>
        </button>
      </div>

      {/* Buscador & Filtro por Rol */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
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
          className="bg-[#140b21] border border-[#26143E] rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#8B44F7] cursor-pointer"
        >
          <option value="all">Todos los roles</option>
          <option value="duelist">Duelistas</option>
          <option value="initiator">Iniciadores</option>
          <option value="controller">Controladores</option>
          <option value="sentinel">Centinelas</option>
        </select>
      </div>

      {/* Catálogo de Agentes con Despliegue de Habilidades */}
      <div className="max-h-[500px] flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-[#522B80]">
        {filteredAgents.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-4">No se encontraron agentes.</p>
        ) : (
          filteredAgents.map((agent) => {
            const isExpanded = expandedAgent?.uuid === agent.uuid;

            return (
              <div
                key={agent.uuid}
                className="bg-[#140b21] border border-[#26143E] rounded-lg p-2 transition-all hover:border-[#522B80]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={agent.displayIcon}
                      alt={agent.displayName}
                      className={`w-7 h-7 rounded-full border shrink-0 object-cover ${
                        selectedTeam === 'attack'
                          ? 'border-red-500 bg-red-950/40'
                          : 'border-cyan-500 bg-cyan-950/40'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {agent.displayName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {agent.role?.displayName || 'Agente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSpawnAgent(agent)}
                      title={`Colocar a ${agent.displayName} en el mapa`}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center space-x-1 ${
                        selectedTeam === 'attack'
                          ? 'bg-red-950/80 text-red-200 hover:bg-red-900 border border-red-500/40'
                          : 'bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900 border border-cyan-500/40'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Colocar</span>
                    </button>

                    {agent.abilities.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedAgent(isExpanded ? null : agent)}
                        title="Ver y colocar habilidades de utilidad"
                        className="p-1 rounded bg-[#26143E] hover:bg-[#522B80] text-gray-300 hover:text-white transition-colors"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-[#E2B86E]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista Desplegable de Habilidades del Agente */}
                {isExpanded && agent.abilities.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#26143E] flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold text-[#E2B86E] uppercase w-full">
                      Habilidades de {agent.displayName}:
                    </span>
                    {agent.abilities.map((ab) => (
                      <button
                        type="button"
                        key={ab.slot}
                        onClick={() => handleSpawnAbility(agent, ab)}
                        title={`Colocar ${ab.displayName} (${ab.slot})`}
                        className="flex items-center space-x-1 p-1 rounded bg-[#0D0914] border border-[#26143E] hover:border-[#8B44F7] text-[10px] text-gray-200 hover:text-white transition-all"
                      >
                        <img
                          src={ab.displayIcon}
                          alt={ab.displayName}
                          className="w-4 h-4 object-contain filter invert"
                        />
                        <span className="truncate max-w-[80px]">{ab.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
