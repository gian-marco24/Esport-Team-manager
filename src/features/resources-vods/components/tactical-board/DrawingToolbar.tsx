import React from 'react';
import {
  MousePointer,
  Pencil,
  ArrowUpRight,
  Eraser,
  Type,
  Undo2,
  Trash2,
  Brush,
  RotateCw,
} from 'lucide-react';
import type { TacticalTool } from '../../types/tacticalBoard';

interface DrawingToolbarProps {
  currentTool: TacticalTool;
  onSelectTool: (tool: TacticalTool) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentWidth: number;
  onSelectWidth: (width: number) => void;
  onUndo: () => void;
  onClearLines: () => void;
  onClearAll: () => void;
  canUndo: boolean;
  onToggleFlip180?: () => void;
  isFlipped180?: boolean;
}

const COLORS = [
  { name: 'Oro URS', value: '#E2B86E' },
  { name: 'Púrpura', value: '#8B44F7' },
  { name: 'Cyan (Defensa)', value: '#06B6D4' },
  { name: 'Rojo (Ataque)', value: '#EF4444' },
  { name: 'Verde Utilidad', value: '#10B981' },
  { name: 'Blanco', value: '#FFFFFF' },
];

const STROKE_WIDTHS = [
  { label: 'Fino', value: 2 },
  { label: 'Medio', value: 4 },
  { label: 'Grueso', value: 7 },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentWidth,
  onSelectWidth,
  onUndo,
  onClearLines,
  onClearAll,
  canUndo,
  onToggleFlip180,
  isFlipped180,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0D0914] border border-[#26143E] rounded-xl shadow-lg text-xs">
      {/* Herramientas Principales */}
      <div className="flex items-center space-x-1.5 border-r border-[#26143E] pr-3">
        <button
          type="button"
          onClick={() => onSelectTool('select')}
          title="Mover Agentes y Fichas (Modo por defecto)"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            currentTool === 'select'
              ? 'bg-[#8B44F7] text-white shadow-md shadow-[#8B44F7]/40 ring-1 ring-[#E2B86E]/50'
              : 'text-gray-400 hover:text-white hover:bg-[#26143E]'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Mover</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(currentTool === 'pen' ? 'select' : 'pen')}
          title="Lápiz de Trazo Libre [Q] (Presiona Q de nuevo para volver a Mover)"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            currentTool === 'pen'
              ? 'bg-[#8B44F7] text-white shadow-md shadow-[#8B44F7]/40 ring-1 ring-[#E2B86E]/50'
              : 'text-gray-400 hover:text-white hover:bg-[#26143E]'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Lápiz</span>
          <kbd className="ml-1 px-1.5 py-0.5 bg-black/40 rounded text-[9px] text-gray-300 font-mono border border-white/10">Q</kbd>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(currentTool === 'arrow' ? 'select' : 'arrow')}
          title="Flecha Táctica de Trayectoria [T] (Presiona T de nuevo para volver a Mover)"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            currentTool === 'arrow'
              ? 'bg-[#8B44F7] text-white shadow-md shadow-[#8B44F7]/40 ring-1 ring-[#E2B86E]/50'
              : 'text-gray-400 hover:text-white hover:bg-[#26143E]'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Flecha</span>
          <kbd className="ml-1 px-1.5 py-0.5 bg-black/40 rounded text-[9px] text-gray-300 font-mono border border-white/10">T</kbd>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(currentTool === 'eraser' ? 'select' : 'eraser')}
          title="Modo Borrador [W] (Presiona W de nuevo para volver a Mover)"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            currentTool === 'eraser'
              ? 'bg-[#8B44F7] text-white shadow-md shadow-[#8B44F7]/40 ring-1 ring-[#E2B86E]/50'
              : 'text-gray-400 hover:text-white hover:bg-[#26143E]'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Borrar</span>
          <kbd className="ml-1 px-1.5 py-0.5 bg-black/40 rounded text-[9px] text-gray-300 font-mono border border-white/10">W</kbd>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool(currentTool === 'text' ? 'select' : 'text')}
          title="Crear Cuadro de Texto Táctico (Haz click en el mapa para escribir)"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            currentTool === 'text'
              ? 'bg-[#8B44F7] text-white shadow-md shadow-[#8B44F7]/40 ring-1 ring-[#E2B86E]/50'
              : 'text-gray-400 hover:text-white hover:bg-[#26143E]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Texto</span>
        </button>
      </div>

      {/* Paleta de Colores de Trazo */}
      <div className="flex items-center space-x-2 border-r border-[#26143E] pr-3">
        <span className="text-[10px] text-gray-400 font-bold uppercase hidden sm:inline">Color:</span>
        <div className="flex items-center space-x-1.5">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => onSelectColor(c.value)}
              title={c.name}
              className={`w-5 h-5 rounded-full border transition-transform ${
                currentColor === c.value
                  ? 'scale-125 border-white ring-2 ring-[#E2B86E]'
                  : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      {/* Grosor de Trazo */}
      <div className="flex items-center space-x-1.5 border-r border-[#26143E] pr-3">
        {STROKE_WIDTHS.map((sw) => (
          <button
            type="button"
            key={sw.value}
            onClick={() => onSelectWidth(sw.value)}
            title={`Grosor ${sw.label}`}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              currentWidth === sw.value
                ? 'bg-[#522B80] text-[#E2B86E] border border-[#8B44F7]/60'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {sw.label}
          </button>
        ))}
      </div>

      {/* Botones de Acción (Girar 180°, Deshacer, Limpiar Trazos, Reiniciar) */}
      <div className="flex items-center space-x-1.5">
        {onToggleFlip180 && (
          <button
            type="button"
            onClick={onToggleFlip180}
            title="Girar perspectiva 180° (invierte vista entre atacantes y defensores)"
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isFlipped180
                ? 'bg-[#522B80] border-[#E2B86E] text-[#E2B86E] shadow-sm'
                : 'bg-[#140b21] border-[#26143E] text-gray-300 hover:text-white hover:border-[#8B44F7]'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Girar 180°</span>
          </button>
        )}

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Deshacer último trazo"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#140b21] border border-[#26143E] text-gray-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Deshacer</span>
        </button>

        <button
          type="button"
          onClick={onClearLines}
          title="Borrar todos los dibujos del mapa"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#140b21] border border-[#26143E] text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition-all"
        >
          <Brush className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Limpiar Trazos</span>
        </button>

        <button
          type="button"
          onClick={onClearAll}
          title="Reiniciar todo el tablero táctico"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reiniciar</span>
        </button>
      </div>
    </div>
  );
};
