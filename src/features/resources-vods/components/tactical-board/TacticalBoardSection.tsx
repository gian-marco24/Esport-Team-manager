import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  Radio,
  PowerOff,
  Loader2,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { DrawingToolbar } from './DrawingToolbar';
import { AgentPalette } from './AgentPalette';
import { TacticalBoardCanvas } from './TacticalBoardCanvas';
import { valorantApiService } from '../../services/valorantApiService';
import { tacticalBoardService } from '../../services/tacticalBoardService';
import type {
  ValorantMap,
  ValorantAgent,
  TacticalBoardState,
  TacticalTool,
  TacticalToken,
  TacticalLine,
} from '../../types/tacticalBoard';

interface TacticalBoardSectionProps {
  vodId: string;
  initialMapName?: string;
}

export const TacticalBoardSection: React.FC<TacticalBoardSectionProps> = ({
  vodId,
  initialMapName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [maps, setMaps] = useState<ValorantMap[]>([]);
  const [agents, setAgents] = useState<ValorantAgent[]>([]);
  const [selectedMap, setSelectedMap] = useState<ValorantMap | null>(null);

  const [currentTool, setCurrentTool] = useState<TacticalTool>('select');
  const [currentColor, setCurrentColor] = useState<string>('#E2B86E');
  const [currentWidth, setCurrentWidth] = useState<number>(3);

  const [boardState, setBoardState] = useState<TacticalBoardState>({
    vodId,
    mapName: initialMapName || 'Ascent',
    mapIconUrl: '',
    tokens: [],
    lines: [],
  });

  const disconnectRef = useRef<(() => void) | null>(null);

  // Desconexión limpia al desmontar o cerrar
  const handleCloseBoard = useCallback(() => {
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
    tacticalBoardService.disconnect();
    setIsConnected(false);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    // Al desmontar el componente (navegación o cambio de página)
    return () => {
      handleCloseBoard();
    };
  }, [handleCloseBoard]);

  // Apertura y conexión manual
  const handleOpenBoard = async () => {
    setIsLoading(true);
    setIsOpen(true);

    try {
      const [fetchedMaps, fetchedAgents] = await Promise.all([
        valorantApiService.getMaps(),
        valorantApiService.getAgents(),
      ]);

      setMaps(fetchedMaps);
      setAgents(fetchedAgents);

      // Encontrar mapa inicial o por defecto
      let matchedMap = fetchedMaps.find((m) =>
        initialMapName
          ? m.displayName.toLowerCase().trim() === initialMapName.toLowerCase().trim()
          : false
      );

      if (!matchedMap && fetchedMaps.length > 0) {
        matchedMap = fetchedMaps[0];
      }

      if (matchedMap) {
        setSelectedMap(matchedMap);
      }

      // Suscribirse a la sincronización en tiempo real
      const unsubscribe = tacticalBoardService.connectAndSubscribe(vodId, (remoteState) => {
        if (!remoteState) return;

        setBoardState((prev) => ({
          ...prev,
          ...remoteState,
          tokens: remoteState.tokens || [],
          lines: remoteState.lines || [],
        }));

        // Si el estado remoto define otro mapa, sincronizarlo
        if (remoteState.mapName) {
          const mapByName = fetchedMaps.find(
            (m) => m.displayName.toLowerCase() === remoteState.mapName.toLowerCase()
          );
          if (mapByName) {
            setSelectedMap(mapByName);
          }
        }
      });

      disconnectRef.current = unsubscribe;
      setIsConnected(true);

      // Si tenemos mapa pero el estado inicial no tiene icono, actualizarlo
      if (matchedMap) {
        setBoardState((prev) => ({
          ...prev,
          mapName: matchedMap!.displayName,
          mapIconUrl: matchedMap!.displayIcon,
        }));
      }
    } catch (err) {
      console.error('Error al inicializar la Pizarra Táctica:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar y transmitir cambios al mover agentes, dibujar o borrar
  const broadcastChange = useCallback(
    (updater: (prev: TacticalBoardState) => TacticalBoardState) => {
      setBoardState((prev) => {
        const nextState = updater(prev);
        tacticalBoardService.updateBoardState(vodId, nextState);
        return nextState;
      });
    },
    [vodId]
  );

  const handleSelectMap = (map: ValorantMap) => {
    setSelectedMap(map);
    broadcastChange((prev) => ({
      ...prev,
      mapName: map.displayName,
      mapIconUrl: map.displayIcon,
    }));
  };

  const handleAddToken = (token: Omit<TacticalToken, 'id'>) => {
    const newToken: TacticalToken = {
      ...token,
      id: `token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    broadcastChange((prev) => ({
      ...prev,
      tokens: [...prev.tokens, newToken],
    }));
  };

  const handleUpdateTokenPosition = (id: string, x: number, y: number) => {
    broadcastChange((prev) => ({
      ...prev,
      tokens: prev.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)),
    }));
  };

  const handleRemoveToken = (id: string) => {
    broadcastChange((prev) => ({
      ...prev,
      tokens: prev.tokens.filter((t) => t.id !== id),
    }));
  };

  const handleAddLine = (line: TacticalLine) => {
    broadcastChange((prev) => ({
      ...prev,
      lines: [...prev.lines, line],
    }));
  };

  const handleRemoveLine = (lineId: string) => {
    broadcastChange((prev) => ({
      ...prev,
      lines: prev.lines.filter((l) => l.id !== lineId),
    }));
  };

  const handleUndo = () => {
    if (boardState.lines.length === 0) return;
    broadcastChange((prev) => ({
      ...prev,
      lines: prev.lines.slice(0, -1),
    }));
  };

  const handleClearLines = () => {
    broadcastChange((prev) => ({
      ...prev,
      lines: [],
    }));
  };

  const handleClearAll = () => {
    broadcastChange((prev) => ({
      ...prev,
      tokens: [],
      lines: [],
    }));
  };

  return (
    <div className="w-full mt-6 mb-8">
      {!isOpen ? (
        /* Tarjeta / Banner de Acceso Manual (Ahorro de recursos y desconexión por defecto) */
        <div className="bg-gradient-to-r from-[#140b21] via-[#1a0f2b] to-[#140b21] border border-[#26143E] hover:border-[#8B44F7]/60 rounded-2xl p-6 shadow-xl transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#522B80]/30 border border-[#8B44F7]/40 flex items-center justify-center shrink-0 shadow-inner">
                <Compass className="w-6 h-6 text-[#E2B86E]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Pizarra Táctica de Análisis
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E2B86E]/20 text-[#E2B86E] border border-[#E2B86E]/30">
                    Multijugador en vivo
                  </span>
                </div>
                <p className="text-xs text-gray-400 max-w-xl">
                  Estudia ejecuciones, simula posicionamiento de agentes con habilidades oficiales de Valorant y traza flechas tácticas sincronizadas en tiempo real con todo tu equipo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenBoard}
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B44F7] to-[#602ca6] hover:from-[#9c58ff] hover:to-[#6d32be] text-white font-bold text-xs shadow-lg shadow-[#8B44F7]/30 border border-[#E2B86E]/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E2B86E]" />
                  <span>Cargando recursos tácticos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E2B86E]" />
                  <span>Entrar a la Pizarra Táctica</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Pizarra Táctica Activa y Conectada */
        <div className="bg-[#0B0713] border border-[#26143E] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4">
          {/* Barra Superior de Estado y Controles */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26143E] pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#522B80]/40 border border-[#8B44F7]/40 flex items-center justify-center">
                <Compass className="w-4 h-4 text-[#E2B86E]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Pizarra Táctica de Análisis</span>
                  {isConnected && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold">
                      <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      <span>Sincronizado en Vivo</span>
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Arrastra agentes y utilidades, traza rutas y visualiza la estrategia en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Selector de Mapa de Valorant */}
              <div className="relative">
                <select
                  value={selectedMap?.uuid || ''}
                  onChange={(e) => {
                    const m = maps.find((x) => x.uuid === e.target.value);
                    if (m) handleSelectMap(m);
                  }}
                  className="bg-[#140b21] border border-[#26143E] text-xs font-semibold text-white pl-3 pr-8 py-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-[#8B44F7]"
                >
                  {maps.map((m) => (
                    <option key={m.uuid} value={m.uuid}>
                      Mapa: {m.displayName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Botón de Desconectar y Cerrar Pizarra */}
              <button
                type="button"
                onClick={handleCloseBoard}
                title="Cerrar y desconectar pizarra para liberar ancho de banda"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desconectar y Salir</span>
              </button>
            </div>
          </div>

          {/* Barra de Herramientas de Dibujo y Trazado */}
          <DrawingToolbar
            currentTool={currentTool}
            onSelectTool={setCurrentTool}
            currentColor={currentColor}
            onSelectColor={setCurrentColor}
            currentWidth={currentWidth}
            onSelectWidth={setCurrentWidth}
            onUndo={handleUndo}
            onClearLines={handleClearLines}
            onClearAll={handleClearAll}
            canUndo={boardState.lines.length > 0}
          />

          {/* Layout Principal: Lienzo Táctico Central + Catálogo Lateral de Agentes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Columna Izquierda: Lienzo Táctico Centrado (8 columnas en lg) */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center">
              <TacticalBoardCanvas
                mapIconUrl={selectedMap?.displayIcon || boardState.mapIconUrl}
                mapName={selectedMap?.displayName || boardState.mapName}
                tokens={boardState.tokens}
                lines={boardState.lines}
                currentTool={currentTool}
                currentColor={currentColor}
                currentWidth={currentWidth}
                onAddLine={handleAddLine}
                onRemoveLine={handleRemoveLine}
                onUpdateTokenPosition={handleUpdateTokenPosition}
                onRemoveToken={handleRemoveToken}
              />
            </div>

            {/* Columna Derecha: Selector de Agentes y Habilidades Oficiales (4 columnas en lg) */}
            <div className="lg:col-span-4 w-full">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-[#E2B86E]" />
                  <span>Roster y Despliegue</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  {boardState.tokens.length} fichas en campo
                </span>
              </div>
              <AgentPalette agents={agents} onAddToken={handleAddToken} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
