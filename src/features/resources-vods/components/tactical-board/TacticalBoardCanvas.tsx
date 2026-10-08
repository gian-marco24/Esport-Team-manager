import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Arrow, Circle, Group, Text, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
  TacticalToken,
  TacticalLine,
  TacticalTool,
  TacticalTeam,
} from '../../types/tacticalBoard';

interface TacticalBoardCanvasProps {
  mapIconUrl: string;
  mapName: string;
  mapRotation?: number;
  tokens: TacticalToken[];
  lines: TacticalLine[];
  currentTool: TacticalTool;
  currentColor: string;
  currentWidth: number;
  onAddLine: (line: TacticalLine) => void;
  onRemoveLine: (lineId: string) => void;
  onUpdateTokenPosition: (tokenId: string, x: number, y: number) => void;
  onRemoveToken: (tokenId: string) => void;
}

// Hook para cargar imágenes de forma asíncrona y segura
function useImageLoader(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
  }, [url]);

  return image;
}

const getTeamColor = (team: TacticalTeam): string => {
  switch (team) {
    case 'attack':
      return '#EF4444'; // Rojo Ataque
    case 'defense':
      return '#06B6D4'; // Cyan Defensa
    default:
      return '#E2B86E'; // Oro Neutral / Spike
  }
};

// Componente individual de ficha interactiva en el mapa
const TacticalTokenNode: React.FC<{
  token: TacticalToken;
  stageWidth: number;
  stageHeight: number;
  currentTool: TacticalTool;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}> = ({ token, stageWidth, stageHeight, currentTool, onUpdatePosition, onRemove }) => {
  const tokenImage = useImageLoader(token.iconUrl);
  const [isHovered, setIsHovered] = useState(false);

  // Coordenadas en píxeles según el tamaño actual del lienzo
  const posX = (token.x / 100) * stageWidth;
  const posY = (token.y / 100) * stageHeight;

  const isAbility = token.type === 'ability';
  const baseRadius = token.size ? token.size / 2 : isAbility ? 16 : 18;
  const teamColor = getTeamColor(token.team);

  // Escala para ajustar la imagen dentro del círculo
  const patternScale = useMemo(() => {
    if (!tokenImage || !tokenImage.width || !tokenImage.height) return { x: 1, y: 1 };
    return {
      x: (baseRadius * 2) / tokenImage.width,
      y: (baseRadius * 2) / tokenImage.height,
    };
  }, [tokenImage, baseRadius]);

  const patternOffset = useMemo(() => {
    if (!tokenImage || !tokenImage.width || !tokenImage.height) return { x: 0, y: 0 };
    return {
      x: tokenImage.width / 2,
      y: tokenImage.height / 2,
    };
  }, [tokenImage]);

  return (
    <Group
      x={posX}
      y={posY}
      draggable={currentTool === 'select'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (currentTool === 'eraser') {
          onRemove(token.id);
        }
      }}
      onTap={() => {
        if (currentTool === 'eraser') {
          onRemove(token.id);
        }
      }}
      onDblClick={() => onRemove(token.id)}
      onContextMenu={(e: KonvaEventObject<MouseEvent>) => {
        e.evt.preventDefault();
        onRemove(token.id);
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        const newX = (e.target.x() / stageWidth) * 100;
        const newY = (e.target.y() / stageHeight) * 100;
        const boundedX = Math.max(2, Math.min(98, newX));
        const boundedY = Math.max(2, Math.min(98, newY));
        onUpdatePosition(token.id, boundedX, boundedY);
      }}
    >
      {/* Círculo de Fondo y Borde: para habilidades es sutil sin borde molesto, para agentes tiene anillo del equipo */}
      <Circle
        radius={baseRadius}
        fill={tokenImage ? undefined : '#140b21'}
        fillPatternImage={tokenImage || undefined}
        fillPatternScale={patternScale}
        fillPatternOffset={patternOffset}
        stroke={
          isAbility
            ? isHovered
              ? 'rgba(255, 255, 255, 0.5)'
              : undefined
            : teamColor
        }
        strokeWidth={isAbility ? 1 : isHovered ? 3.5 : 2.5}
        shadowColor={isAbility ? undefined : teamColor}
        shadowBlur={isAbility ? 0 : isHovered ? 12 : 6}
        shadowOpacity={0.85}
      />

      {/* Botón de eliminar rápido al pasar el cursor */}
      {isHovered && currentTool === 'select' && (
        <Group
          x={baseRadius - 2}
          y={-baseRadius + 2}
          onClick={(e: KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            onRemove(token.id);
          }}
        >
          <Circle radius={7} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1} />
          <Text text="×" fontSize={11} fill="#FFFFFF" fontStyle="bold" offsetX={3} offsetY={5.5} />
        </Group>
      )}
    </Group>
  );
};

export const TacticalBoardCanvas: React.FC<TacticalBoardCanvasProps> = ({
  mapIconUrl,
  mapName,
  mapRotation = 0,
  tokens,
  lines,
  currentTool,
  currentColor,
  currentWidth,
  onAddLine,
  onRemoveLine,
  onUpdateTokenPosition,
  onRemoveToken,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 600,
  });

  const [activeLine, setActiveLine] = useState<TacticalLine | null>(null);
  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);

  const mapImage = useImageLoader(mapIconUrl);

  // Redimensionado responsivo para mantener siempre relación de aspecto 1:1
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.floor(Math.min(rect.width, window.innerHeight * 0.75, 780));
      if (size > 0 && (size !== dimensions.width || size !== dimensions.height)) {
        setDimensions({ width: size, height: size });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [dimensions.width, dimensions.height]);

  // Borrado continuo al mantener presionado el borrador
  const eraseUnderPointer = (pos: { x: number; y: number }) => {
    // 1. Borrar fichas debajo del cursor
    tokens.forEach((token) => {
      const tokenPxX = (token.x / 100) * dimensions.width;
      const tokenPxY = (token.y / 100) * dimensions.height;
      const radius = (token.size ? token.size / 2 : 18) + 12;
      const dist = Math.hypot(pos.x - tokenPxX, pos.y - tokenPxY);
      if (dist <= radius) {
        onRemoveToken(token.id);
      }
    });

    // 2. Borrar líneas o flechas debajo del cursor
    lines.forEach((line) => {
      for (let i = 0; i < line.points.length - 1; i += 2) {
        const ptX = (line.points[i] / 100) * dimensions.width;
        const ptY = (line.points[i + 1] / 100) * dimensions.height;
        const dist = Math.hypot(pos.x - ptX, pos.y - ptY);
        if (dist <= 18) {
          onRemoveLine(line.id);
          break;
        }
      }
    });
  };

  // Manejo de dibujo y borrador continuo con Mouse / Touch
  const handlePointerDown = (_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (currentTool === 'eraser') {
      isErasingRef.current = true;
      eraseUnderPointer(pos);
      return;
    }

    if (currentTool !== 'pen' && currentTool !== 'arrow') return;

    const xPct = (pos.x / dimensions.width) * 100;
    const yPct = (pos.y / dimensions.height) * 100;

    isDrawingRef.current = true;

    if (currentTool === 'pen') {
      setActiveLine({
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tool: 'pen',
        points: [xPct, yPct],
        color: currentColor,
        width: currentWidth,
      });
    } else if (currentTool === 'arrow') {
      setActiveLine({
        id: `arrow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tool: 'arrow',
        points: [xPct, yPct, xPct, yPct],
        color: currentColor,
        width: currentWidth,
      });
    }
  };

  const handlePointerMove = (_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (currentTool === 'eraser' && isErasingRef.current) {
      eraseUnderPointer(pos);
      return;
    }

    if (!isDrawingRef.current || !activeLine) return;

    const xPct = Math.max(0, Math.min(100, (pos.x / dimensions.width) * 100));
    const yPct = Math.max(0, Math.min(100, (pos.y / dimensions.height) * 100));

    if (activeLine.tool === 'pen') {
      setActiveLine((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, xPct, yPct],
        };
      });
    } else if (activeLine.tool === 'arrow') {
      setActiveLine((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [prev.points[0], prev.points[1], xPct, yPct],
        };
      });
    }
  };

  const handlePointerUp = () => {
    isErasingRef.current = false;

    if (!isDrawingRef.current || !activeLine) {
      isDrawingRef.current = false;
      return;
    }

    isDrawingRef.current = false;

    // Validación mínima para no guardar clicks accidentales
    if (activeLine.tool === 'pen' && activeLine.points.length >= 4) {
      onAddLine(activeLine);
    } else if (activeLine.tool === 'arrow') {
      const [x1, y1, x2, y2] = activeLine.points;
      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist > 1.5) {
        onAddLine(activeLine);
      }
    }

    setActiveLine(null);
  };

  // Convertir puntos porcentuales a coordenadas absolutas en pantalla
  const denormalizePoints = (pts: number[]): number[] => {
    const res: number[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      res.push((pts[i] / 100) * dimensions.width);
      res.push((pts[i + 1] / 100) * dimensions.height);
    }
    return res;
  };

  const cursorClass = useMemo(() => {
    switch (currentTool) {
      case 'pen':
      case 'arrow':
        return 'cursor-crosshair';
      case 'eraser':
        return 'cursor-not-allowed';
      case 'select':
      default:
        return 'cursor-default';
    }
  }, [currentTool]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square max-w-[780px] mx-auto rounded-2xl overflow-hidden border border-[#26143E] bg-[#07040D] shadow-2xl flex items-center justify-center ${cursorClass}`}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Capa 1: Fondo y Mapa de Valorant con Rotación Oficial (Spawns Arriba y Abajo) */}
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill="#090513"
          />

          {mapImage && (
            <Group
              x={dimensions.width / 2}
              y={dimensions.height / 2}
              rotation={mapRotation}
              offsetX={dimensions.width / 2}
              offsetY={dimensions.height / 2}
            >
              <KonvaImage
                image={mapImage}
                x={0}
                y={0}
                width={dimensions.width}
                height={dimensions.height}
                opacity={0.92}
              />
            </Group>
          )}
        </Layer>

        {/* Capa 2: Dibujos y Flechas Tácticas */}
        <Layer>
          {lines.map((line) => {
            const screenPoints = denormalizePoints(line.points);

            if (line.tool === 'arrow') {
              return (
                <Arrow
                  key={line.id}
                  points={screenPoints}
                  stroke={line.color}
                  fill={line.color}
                  strokeWidth={line.width}
                  pointerLength={Math.max(10, line.width * 2.8)}
                  pointerWidth={Math.max(8, line.width * 2.2)}
                  lineCap="round"
                  lineJoin="round"
                  hitStrokeWidth={Math.max(18, line.width * 3)}
                  onClick={() => {
                    if (currentTool === 'eraser') onRemoveLine(line.id);
                  }}
                  onTap={() => {
                    if (currentTool === 'eraser') onRemoveLine(line.id);
                  }}
                />
              );
            }

            return (
              <Line
                key={line.id}
                points={screenPoints}
                stroke={line.color}
                strokeWidth={line.width}
                tension={0.35}
                lineCap="round"
                lineJoin="round"
                hitStrokeWidth={Math.max(18, line.width * 3)}
                onClick={() => {
                  if (currentTool === 'eraser') onRemoveLine(line.id);
                }}
                onTap={() => {
                  if (currentTool === 'eraser') onRemoveLine(line.id);
                }}
              />
            );
          })}

          {/* Trazo activo en tiempo real mientras el usuario dibuja */}
          {activeLine && (
            activeLine.tool === 'arrow' ? (
              <Arrow
                points={denormalizePoints(activeLine.points)}
                stroke={activeLine.color}
                fill={activeLine.color}
                strokeWidth={activeLine.width}
                pointerLength={Math.max(10, activeLine.width * 2.8)}
                pointerWidth={Math.max(8, activeLine.width * 2.2)}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            ) : (
              <Line
                points={denormalizePoints(activeLine.points)}
                stroke={activeLine.color}
                strokeWidth={activeLine.width}
                tension={0.35}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            )
          )}
        </Layer>

        {/* Capa 3: Agentes, Habilidades y Utilidades (Sin textos molestos) */}
        <Layer>
          {tokens.map((token) => (
            <TacticalTokenNode
              key={token.id}
              token={token}
              stageWidth={dimensions.width}
              stageHeight={dimensions.height}
              currentTool={currentTool}
              onUpdatePosition={onUpdateTokenPosition}
              onRemove={onRemoveToken}
            />
          ))}
        </Layer>
      </Stage>

      {/* Indicador de mapa cargado en la esquina superior izquierda */}
      <div className="absolute top-2.5 left-3 pointer-events-none select-none flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#26143E]">
        <div className="w-2 h-2 rounded-full bg-[#E2B86E] animate-pulse" />
        <span className="text-[11px] font-bold tracking-wider text-gray-200 uppercase">
          {mapName || 'Mapa'}
        </span>
      </div>

      {/* Mensaje de ayuda rápida para borrado continuo */}
      {currentTool === 'eraser' && (
        <div className="absolute bottom-2.5 inset-x-auto pointer-events-none bg-red-950/80 border border-red-500/50 text-red-200 text-[11px] px-3 py-1 rounded-full backdrop-blur-md shadow-lg">
          Mantén presionado y arrastra para borrar trazos o fichas debajo del cursor
        </div>
      )}
    </div>
  );
};
