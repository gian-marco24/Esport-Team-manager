import React, { useState } from 'react';
import { Map, Compass } from 'lucide-react';
import type { Roster } from '../../teams/types';
import type { MapPresetInfo } from '../types';
import { VALORANT_MAPS, CS2_MAPS, DEFAULT_GENERIC_MAPS } from '../types';
import { TacticalChatView } from './TacticalChatView';
import { Badge } from '../../../components/ui/Badge';

interface MapPlaybookBlockProps {
  roster: Roster | null;
  rosterId: string;
}

export const MapPlaybookBlock: React.FC<MapPlaybookBlockProps> = ({ roster, rosterId }) => {
  // Determine maps list based on roster game
  const gameName = roster?.game?.toLowerCase() || 'valorant';
  const availableMaps: MapPresetInfo[] = gameName.includes('cs') || gameName.includes('counter')
    ? CS2_MAPS
    : gameName.includes('valorant')
    ? VALORANT_MAPS
    : DEFAULT_GENERIC_MAPS;

  const [selectedMapId, setSelectedMapId] = useState<string>(availableMaps[0]?.id || 'ascent');
  const [rotationOnly, setRotationOnly] = useState<boolean>(true);

  const filteredMaps = (
    rotationOnly ? availableMaps.filter((m) => m.isCompetitiveRotation) : availableMaps
  )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedMap = availableMaps.find((m) => m.id === selectedMapId) || availableMaps[0];
  const channelId = `roster-${rosterId}-map-${selectedMap.id}`;

  return (
    <div className="bg-[#140b21] border border-[#26143E] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Block Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#26143E]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E] shrink-0">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center space-x-2.5">
              <span>Libro de Jugadas & Estrategias por Mapa</span>
              <Badge variant="gold" className="text-xs px-2 py-0.5 font-bold">
                Playbooks
              </Badge>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Anotaciones tácticas, setups, ejecuciones y utilidades para cada mapa ({roster?.name || 'Escuadra'}).
            </p>
          </div>
        </div>

        {/* Filter rotation toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setRotationOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              rotationOnly
                ? 'bg-[#522B80] text-white border border-[#E2B86E]/50'
                : 'text-gray-400 hover:text-white bg-[#180d29]'
            }`}
          >
            Rotación Oficial
          </button>
          <button
            onClick={() => setRotationOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              !rotationOnly
                ? 'bg-[#522B80] text-white border border-[#E2B86E]/50'
                : 'text-gray-400 hover:text-white bg-[#180d29]'
            }`}
          >
            Todos ({availableMaps.length})
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Mini Sidebar + Active Map Chat */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[620px] lg:h-[680px]">
        {/* Left Mini Sidebar: Maps */}
        <div className="md:col-span-4 lg:col-span-3 bg-[#0D0914] border border-[#26143E] rounded-2xl p-3 flex flex-col space-y-2 overflow-y-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
            Mapas ({filteredMaps.length})
          </span>

          <div className="space-y-2">
            {filteredMaps.map((map) => {
              const isActive = map.id === selectedMapId;
              return (
                <button
                  key={map.id}
                  onClick={() => setSelectedMapId(map.id)}
                  className={`w-full p-3 rounded-xl text-left flex items-center justify-between border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#522B80] to-[#26143E] border-[#E2B86E] text-white shadow-lg shadow-[#8B44F7]/20 ring-1 ring-[#E2B86E]/50'
                      : 'bg-[#140b21]/70 border-[#26143E] text-gray-300 hover:bg-[#180d29] hover:border-[#522B80]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isActive
                          ? 'bg-[#E2B86E] text-black font-black'
                          : 'bg-[#26143E] text-purple-300'
                      }`}
                    >
                      {map.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">{map.name}</span>
                      <span className="text-[11px] text-gray-400">
                        {map.isCompetitiveRotation ? 'En Competitivo' : 'Fuera de Rotación'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2B86E] animate-pulse shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Map Chat */}
        <div className="md:col-span-8 lg:col-span-9 h-full">
          <TacticalChatView
            key={channelId}
            channelId={channelId}
            title={`Playbook & Tácticas: ${selectedMap.name}`}
            subtitle={`Notas, ejecuciones y libro de jugadas para ${selectedMap.name}`}
            badgeLabel={selectedMap.name.toUpperCase()}
            icon={<Compass className="w-5 h-5 text-[#E2B86E]" />}
            emptyPlaceholderMessage={`No hay estrategias ni anotaciones guardadas para el mapa ${selectedMap.name}. Sé el primero en compartir un apunte táctico, setup o imagen.`}
          />
        </div>
      </div>
    </div>
  );
};
