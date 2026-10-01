import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ShieldPlus, Gamepad2 } from 'lucide-react';
import type { Roster, TeamMember } from '../types';
import { RosterCard } from './RosterCard';
import { Button } from '../../../components/ui/Button';

interface RosterCarouselProps {
  rosters: Roster[];
  members: TeamMember[];
  onSelectRoster: (roster: Roster) => void;
  onCreateRosterClick: () => void;
  isCeo: boolean;
}

export const RosterCarousel: React.FC<RosterCarouselProps> = ({
  rosters,
  members,
  onSelectRoster,
  onCreateRosterClick,
  isCeo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center space-x-2.5">
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#E2B86E]" />
            <span>Escuadras & Rosters del Equipo</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">Selecciona un roster para inspeccionar a sus integrantes o crea una nueva alineación.</p>
        </div>

        <div className="flex items-center space-x-2.5">
          {rosters.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => scroll('left')}
                className="p-2.5 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80]/60 text-gray-300 hover:text-white rounded-xl transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2.5 bg-[#180d29] hover:bg-[#26143E] border border-[#522B80]/60 text-gray-300 hover:text-white rounded-xl transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {isCeo && (
            <Button
              onClick={onCreateRosterClick}
              variant="secondary"
              size="md"
              leftIcon={<ShieldPlus className="w-4 h-4" />}
            >
              Crear Roster
            </Button>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex space-x-5 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-[#522B80] scrollbar-track-transparent snap-x"
        style={{ scrollbarWidth: 'thin' }}
      >
        {rosters.length === 0 ? (
          <div className="w-full p-8 bg-[#180d29]/40 border border-dashed border-[#522B80]/60 rounded-2xl text-center space-y-3">
            <Gamepad2 className="w-12 h-12 text-gray-500 mx-auto" />
            <h4 className="text-base font-bold text-gray-300">No hay rosters creados en este equipo</h4>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
              Como CEO, puedes hacer clic en "Crear Roster" para registrar la primera escuadra oficial de Valorant, LoL, CS2, etc.
            </p>
            {isCeo && (
              <Button onClick={onCreateRosterClick} variant="secondary" size="md">
                Crear Primer Roster
              </Button>
            )}
          </div>
        ) : (
          <>
            {rosters.map((roster) => (
              <div key={roster.id} className="snap-start">
                <RosterCard
                  roster={roster}
                  members={members}
                  onClick={() => onSelectRoster(roster)}
                />
              </div>
            ))}

            {isCeo && (
              <div
                onClick={onCreateRosterClick}
                className="w-80 lg:w-88 shrink-0 border-2 border-dashed border-[#522B80]/60 hover:border-[#8B44F7] bg-[#140b21]/40 hover:bg-[#180d29] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition-all duration-300 group select-none snap-start min-h-[220px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#26143E] border border-[#8B44F7]/30 flex items-center justify-center text-[#E2B86E] group-hover:scale-110 transition-transform">
                  <ShieldPlus className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base group-hover:text-[#E2B86E]">Agregar Nuevo Roster</h4>
                  <p className="text-xs text-gray-400 mt-1">Valorant, LoL, Rocket League, CS, CoD, etc.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
