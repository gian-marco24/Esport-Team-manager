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
  onAddToken?: (token: Omit<TacticalToken, 'id'>) => TacticalToken | void;
  onUpdateToken?: (id: string, updates: Partial<TacticalToken>) => void;
  onUpdateTokenPosition: (tokenId: string, x: number, y: number) => void;
  onRemoveToken: (tokenId: string) => void;
  onSelectTool?: (tool: TacticalTool) => void;
  onToggleFilterInMap?: () => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
}

// Cache de imágenes en memoria para reutilización instantánea entre fichas y re-renders
const imageCache = new Map<string, HTMLImageElement>();

// Hook para cargar imágenes de forma asíncrona, segura y con soporte de fallback CORS
function useImageLoader(url?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(() => {
    if (url && imageCache.has(url)) {
      return imageCache.get(url)!;
    }
    return null;
  });

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    if (imageCache.has(url)) {
      setImage(imageCache.get(url)!);
      return;
    }

    let isCancelled = false;
    const img = new window.Image();

    // Las Data URIs no necesitan crossOrigin
    const isData = url.startsWith('data:');
    if (!isData) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageCache.set(url, img);
      if (!isCancelled) {
        setImage(img);
      }
    };

    img.onerror = () => {
      // Si la carga con crossOrigin anónimo falla (por ejemplo, choque con caché del navegador),
      // reintentar sin crossOrigin para garantizar que el canvas siempre pinte la imagen.
      if (img.crossOrigin) {
        const fallback = new window.Image();
        fallback.onload = () => {
          imageCache.set(url, fallback);
          if (!isCancelled) {
            setImage(fallback);
          }
        };
        fallback.onerror = () => {
          if (!isCancelled) {
            setImage(null);
          }
        };
        fallback.src = url;
      } else {
        if (!isCancelled) {
          setImage(null);
        }
      }
    };

    img.src = url;

    return () => {
      isCancelled = true;
    };
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
  onHoverToken?: (id: string | null) => void;
}> = ({ token, stageWidth, stageHeight, currentTool, onUpdatePosition, onRemove, onHoverToken }) => {
  const tokenImage = useImageLoader(token.iconUrl);
  const [isHovered, setIsHovered] = useState(false);

  // Coordenadas en píxeles según el tamaño actual del lienzo
  const posX = (token.x / 100) * stageWidth;
  const posY = (token.y / 100) * stageHeight;

  const isAbility = token.type === 'ability';
  const isAgent = token.type === 'agent';
  const baseRadius = token.size ? token.size / 2 : isAbility ? 11 : isAgent ? 14 : 12;
  const teamColor = getTeamColor(token.team);

  // Configuración visual para habilidades: fondo translúcido y borde sutil con el color del equipo
  const abilityFill =
    token.team === 'attack'
      ? 'rgba(239, 68, 68, 0.15)'
      : token.team === 'defense'
      ? 'rgba(6, 182, 212, 0.15)'
      : 'rgba(255, 255, 255, 0.08)';

  const abilityStroke =
    token.team === 'attack'
      ? 'rgba(239, 68, 68, 0.75)'
      : token.team === 'defense'
      ? 'rgba(6, 182, 212, 0.75)'
      : 'rgba(255, 255, 255, 0.5)';

  const abilityShadowColor = token.team === 'attack' ? '#EF4444' : '#06B6D4';

  return (
    <Group
      x={posX}
      y={posY}
      draggable={currentTool === 'select'}
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverToken?.(token.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverToken?.(null);
      }}
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
      {isAbility ? (
        <>
          {/* Círculo sutil y translúcido de la habilidad (no tapa detalles importantes del mapa) */}
          <Circle
            radius={baseRadius}
            fill={abilityFill}
            stroke={isHovered ? '#FFFFFF' : abilityStroke}
            strokeWidth={isHovered ? 1.8 : 1.2}
            shadowColor={abilityShadowColor}
            shadowBlur={isHovered ? 6 : 3}
            shadowOpacity={0.45}
          />

          {/* Ícono oficial de la habilidad centrado en el círculo */}
          {tokenImage && (
            <KonvaImage
              image={tokenImage}
              x={-baseRadius * 0.7}
              y={-baseRadius * 0.7}
              width={baseRadius * 1.4}
              height={baseRadius * 1.4}
              opacity={0.95}
              listening={false}
            />
          )}

          {!tokenImage && (
            <Text
              text={token.subtext?.charAt(0) || token.name.charAt(0) || '•'}
              fontSize={baseRadius * 0.9}
              fill="#FFFFFF"
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              offsetX={baseRadius * 0.3}
              offsetY={baseRadius * 0.45}
              listening={false}
            />
          )}
        </>
      ) : isAgent ? (
        <>
          {/* Ficha circular del agente con retrato oficial de Valorant */}
          <Group clipFunc={(ctx) => ctx.arc(0, 0, baseRadius, 0, Math.PI * 2, false)}>
            <Rect
              x={-baseRadius}
              y={-baseRadius}
              width={baseRadius * 2}
              height={baseRadius * 2}
              fill="#140b21"
            />
            {tokenImage ? (
              <KonvaImage
                image={tokenImage}
                x={-baseRadius}
                y={-baseRadius}
                width={baseRadius * 2}
                height={baseRadius * 2}
                listening={false}
              />
            ) : (
              <Text
                text={token.name.charAt(0) || 'A'}
                fontSize={baseRadius}
                fill="#FFFFFF"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={baseRadius * 0.35}
                offsetY={baseRadius * 0.5}
                listening={false}
              />
            )}
          </Group>

          {/* Anillo de equipo con resplandor (Rojo o Cyan) */}
          <Circle
            radius={baseRadius}
            stroke={teamColor}
            strokeWidth={isHovered ? 2.5 : 2}
            shadowColor={teamColor}
            shadowBlur={isHovered ? 10 : 5}
            shadowOpacity={0.85}
          />
        </>
      ) : (
        <>
          {/* Fichas especiales (Spike, Peligro, Visión) */}
          <Group clipFunc={(ctx) => ctx.arc(0, 0, baseRadius, 0, Math.PI * 2, false)}>
            {tokenImage && (
              <KonvaImage
                image={tokenImage}
                x={-baseRadius}
                y={-baseRadius}
                width={baseRadius * 2}
                height={baseRadius * 2}
                listening={false}
              />
            )}
          </Group>
          <Circle
            radius={baseRadius}
            stroke={isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}
            strokeWidth={isHovered ? 1.8 : 1}
            shadowColor="#000000"
            shadowBlur={4}
            shadowOpacity={0.5}
          />
        </>
      )}
    </Group>
  );
};

// Medición y cálculo de salto de línea automático preciso (word wrap y char wrap)
let textMeasureCanvas: HTMLCanvasElement | null = null;
let textMeasureCtx: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string, font: string): number {
  if (typeof document === 'undefined') return text.length * 8;
  if (!textMeasureCtx) {
    textMeasureCanvas = document.createElement('canvas');
    textMeasureCtx = textMeasureCanvas.getContext('2d');
  }
  if (!textMeasureCtx) return text.length * 8;
  textMeasureCtx.font = font;
  return textMeasureCtx.measureText(text).width;
}

function computeTextLayout(
  text: string,
  fontSize: number,
  isBold: boolean,
  isItalic: boolean,
  maxBoxWidth = 260,
  paddingX = 10,
  paddingY = 7
) {
  const font = `${isBold ? 'bold ' : ''}${isItalic ? 'italic ' : ''}${fontSize}px sans-serif`.trim();
  const maxContentWidth = Math.max(60, maxBoxWidth - paddingX * 2);

  const rawParagraphs = (text || 'Texto').split('\n');
  const wrappedLines: string[] = [];

  for (const para of rawParagraphs) {
    if (para === '') {
      wrappedLines.push('');
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const candidateWidth = measureTextWidth(candidate, font);

      if (candidateWidth <= maxContentWidth) {
        currentLine = candidate;
      } else {
        if (!currentLine) {
          // Palabra única que sobrepasa el ancho máximo permitido (ej. texto largo continuo)
          let charChunk = '';
          for (const ch of word) {
            if (measureTextWidth(charChunk + ch, font) <= maxContentWidth) {
              charChunk += ch;
            } else {
              wrappedLines.push(charChunk);
              charChunk = ch;
            }
          }
          currentLine = charChunk;
        } else {
          wrappedLines.push(currentLine);
          if (measureTextWidth(word, font) <= maxContentWidth) {
            currentLine = word;
          } else {
            let charChunk = '';
            for (const ch of word) {
              if (measureTextWidth(charChunk + ch, font) <= maxContentWidth) {
                charChunk += ch;
              } else {
                wrappedLines.push(charChunk);
                charChunk = ch;
              }
            }
            currentLine = charChunk;
          }
        }
      }
    }

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  // Medir el ancho visual real de la línea más ancha calculada
  let maxLineWidth = 0;
  for (const line of wrappedLines) {
    const w = measureTextWidth(line, font);
    if (w > maxLineWidth) maxLineWidth = w;
  }

  const finalContentWidth = Math.max(64, Math.min(maxContentWidth, Math.ceil(maxLineWidth)));
  const boxWidth = Math.min(maxBoxWidth, finalContentWidth + paddingX * 2);
  const lineHeight = Math.max(16, Math.round(fontSize * 1.35));
  const boxHeight = Math.max(30, wrappedLines.length * lineHeight + paddingY * 2);

  return {
    wrappedLines,
    formattedText: wrappedLines.join('\n'),
    boxWidth,
    boxHeight,
    lineHeight,
    paddingX,
    paddingY,
  };
}

// Componente de cuadro de texto táctico (estilo ValoPlant)
const TacticalTextNode: React.FC<{
  token: TacticalToken;
  stageWidth: number;
  stageHeight: number;
  currentTool: TacticalTool;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onHoverToken?: (id: string | null) => void;
  onStartEditing: (id: string) => void;
}> = ({
  token,
  stageWidth,
  stageHeight,
  currentTool,
  onUpdatePosition,
  onRemove,
  onHoverToken,
  onStartEditing,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const posX = (token.x / 100) * stageWidth;
  const posY = (token.y / 100) * stageHeight;

  const fontSize =
    token.textLevel === 'H1' ? 18 : token.textLevel === 'H3' ? 11 : 14;

  const { boxWidth, boxHeight, formattedText, paddingX, paddingY } = computeTextLayout(
    token.text || 'Texto',
    fontSize,
    Boolean(token.isBold),
    Boolean(token.isItalic),
    260,
    10,
    7
  );

  const teamColor = getTeamColor(token.team);
  const fontStyle = `${token.isBold ? 'bold ' : ''}${token.isItalic ? 'italic' : ''}`.trim() || 'normal';

  return (
    <Group
      x={posX}
      y={posY}
      offsetX={boxWidth / 2}
      offsetY={boxHeight / 2}
      draggable={currentTool === 'select'}
      dragBoundFunc={(pos) => {
        // Limita físicamente el arrastre para que toda la caja permanezca dentro del mapa
        const minX = boxWidth / 2;
        const maxX = stageWidth - boxWidth / 2;
        const minY = boxHeight / 2;
        const maxY = stageHeight - boxHeight / 2;
        return {
          x: Math.max(minX, Math.min(maxX, pos.x)),
          y: Math.max(minY, Math.min(maxY, pos.y)),
        };
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        onHoverToken?.(token.id);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverToken?.(null);
      }}
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
      onDblClick={() => {
        onStartEditing(token.id);
      }}
      onContextMenu={(e: KonvaEventObject<MouseEvent>) => {
        e.evt.preventDefault();
        onRemove(token.id);
      }}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        // e.target.x() ya es la posición del ancla central en píxeles
        const newX = (e.target.x() / stageWidth) * 100;
        const newY = (e.target.y() / stageHeight) * 100;

        const halfWidthPct = (boxWidth / 2 / stageWidth) * 100;
        const halfHeightPct = (boxHeight / 2 / stageHeight) * 100;

        const minX = Math.max(0.5, halfWidthPct);
        const maxX = Math.min(99.5, 100 - halfWidthPct);
        const minY = Math.max(0.5, halfHeightPct);
        const maxY = Math.min(99.5, 100 - halfHeightPct);

        const boundedX = Math.max(minX, Math.min(maxX, newX));
        const boundedY = Math.max(minY, Math.min(maxY, newY));
        onUpdatePosition(token.id, boundedX, boundedY);
      }}
    >
      {/* Fondo translúcido con borde de equipo o neutral */}
      <Rect
        x={0}
        y={0}
        width={boxWidth}
        height={boxHeight}
        fill="rgba(12, 8, 20, 0.92)"
        stroke={isHovered ? '#FFFFFF' : teamColor}
        strokeWidth={isHovered ? 2 : 1.4}
        cornerRadius={6}
        shadowColor={teamColor}
        shadowBlur={isHovered ? 8 : 4}
        shadowOpacity={0.6}
      />

      {/* Contenido de texto con salto de línea multilínea visible */}
      <Text
        x={paddingX}
        y={paddingY}
        width={boxWidth - paddingX * 2}
        height={boxHeight - paddingY * 2}
        text={formattedText}
        fontSize={fontSize}
        lineHeight={1.35}
        fontFamily="sans-serif"
        fontStyle={fontStyle}
        textDecoration={token.isUnderline ? 'underline' : ''}
        fill="#FFFFFF"
        align="center"
        verticalAlign="middle"
        wrap="none"
        listening={false}
      />
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
  onAddToken,
  onUpdateToken,
  onUpdateTokenPosition,
  onRemoveToken,
  onSelectTool,
  onToggleFilterInMap,
  onDimensionsChange,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 650,
    height: 650,
  });

  // Notificar al componente padre las dimensiones exactas del mapa para sincronizar la altura
  useEffect(() => {
    onDimensionsChange?.(dimensions);
  }, [dimensions, onDimensionsChange]);

  const [activeLine, setActiveLine] = useState<TacticalLine | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Escala calibrada: 1.0 (100%) encuadra el mapa completo de Riot sin recortar spawns ni bordes
  const [mapZoom, setMapZoom] = useState<number>(1.0);

  const isDrawingRef = useRef(false);
  const isErasingRef = useRef(false);

  // Referencias a los elementos actualmente bajo el cursor (hover)
  const hoveredTokenIdRef = useRef<string | null>(null);
  const hoveredLineIdRef = useRef<string | null>(null);

  const mapImage = useImageLoader(mapIconUrl);

  // Redimensionado responsivo: el marco del mapa abraza exactamente el lienzo sin barras negras intermedias
  useEffect(() => {
    const updateSize = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const maxAvailableHeight = window.innerHeight * 0.84;
      // Ocupar casi todo el ancho disponible del bloque dejando máximo un 5% a 8% de margen
      const maxAvailableWidth = rect.width > 0 ? rect.width * 0.95 : 700;
      const size = Math.floor(Math.min(maxAvailableWidth, maxAvailableHeight, 1050));
      if (size > 0 && (size !== dimensions.width || size !== dimensions.height)) {
        setDimensions({ width: size, height: size });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
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
      const radius = token.type === 'text' ? 36 : (token.size ? token.size / 2 : 14) + 10;
      const dist = Math.hypot(pos.x - tokenPxX, pos.y - tokenPxY);
      if (dist <= radius) {
        onRemoveToken(token.id);
        if (editingTextId === token.id) {
          setEditingTextId(null);
        }
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

  // Atajos de teclado: [Q] Lápiz (toggle a Mover), [W] Borrar (toggle a Mover), [T] Flecha (toggle a Mover), [E] Eliminar solo en hover, [R] Alternar filtro en mapa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está interactuando con un campo de texto o selección
      const active = document.activeElement;
      if (active) {
        const tag = active.tagName.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          active.getAttribute('contenteditable') === 'true'
        ) {
          return;
        }
      }

      const key = e.key.toLowerCase();

      if (key === 'q') {
        e.preventDefault();
        onSelectTool?.(currentTool === 'pen' ? 'select' : 'pen');
      } else if (key === 'w') {
        e.preventDefault();
        onSelectTool?.(currentTool === 'eraser' ? 'select' : 'eraser');
      } else if (key === 't') {
        e.preventDefault();
        onSelectTool?.(currentTool === 'arrow' ? 'select' : 'arrow');
      } else if (key === 'e') {
        e.preventDefault();

        // 1. Al presionar "E", únicamente borra los elementos que estén bajo hover
        let erased = false;
        if (hoveredTokenIdRef.current) {
          onRemoveToken(hoveredTokenIdRef.current);
          hoveredTokenIdRef.current = null;
          erased = true;
        } else if (hoveredLineIdRef.current) {
          onRemoveLine(hoveredLineIdRef.current);
          hoveredLineIdRef.current = null;
          erased = true;
        }

        // Comprobación de respaldo por posición exacta del puntero en el lienzo
        if (!erased && stageRef.current) {
          const pos = stageRef.current.getPointerPosition();
          if (pos) {
            eraseUnderPointer(pos);
          }
        }
      } else if (key === 'r') {
        e.preventDefault();
        onToggleFilterInMap?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentTool, onSelectTool, onToggleFilterInMap, onRemoveToken, onRemoveLine, dimensions, tokens, lines]);

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

    if (currentTool === 'text') {
      const xPct = Math.max(6, Math.min(94, (pos.x / dimensions.width) * 100));
      const yPct = Math.max(6, Math.min(94, (pos.y / dimensions.height) * 100));

      if (onAddToken) {
        const created = onAddToken({
          type: 'text',
          name: 'Nota Táctica',
          iconUrl: '',
          x: xPct,
          y: yPct,
          team: 'neutral',
          text: 'Nota táctica',
          textLevel: 'H2',
          isBold: false,
          isItalic: false,
          isUnderline: false,
        });

        if (created && created.id) {
          setEditingTextId(created.id);
        }
      }
      onSelectTool?.('select');
      return;
    }

    // Si había un texto en edición y se hace click en el canvas, cerrar la edición
    if (editingTextId) {
      setEditingTextId(null);
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
      case 'text':
        return 'cursor-text';
      case 'select':
      default:
        return 'cursor-default';
    }
  }, [currentTool]);

  return (
    <div ref={wrapperRef} className="w-full flex items-center justify-center">
      <div
        className={`relative rounded-2xl overflow-hidden border border-[#26143E] bg-[#07040D] shadow-2xl flex items-center justify-center ${cursorClass}`}
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          try {
            const raw = e.dataTransfer.getData('application/json');
            if (!raw) return;
            const data = JSON.parse(raw);
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;
            const xPercent = Math.max(2, Math.min(98, (clientX / dimensions.width) * 100));
            const yPercent = Math.max(2, Math.min(98, (clientY / dimensions.height) * 100));

            onAddToken?.({
              ...data,
              x: xPercent,
              y: yPercent,
            });
          } catch (err) {
            console.error('Error al soltar elemento en el mapa:', err);
          }
        }}
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
          {/* Capa 1: Fondo y Mapa de Valorant con Rotación Oficial y Escala Calibrada al 100% */}
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
                scaleX={mapZoom}
                scaleY={mapZoom}
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
                  onMouseEnter={() => {
                    hoveredLineIdRef.current = line.id;
                  }}
                  onMouseLeave={() => {
                    if (hoveredLineIdRef.current === line.id) {
                      hoveredLineIdRef.current = null;
                    }
                  }}
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
                onMouseEnter={() => {
                  hoveredLineIdRef.current = line.id;
                }}
                onMouseLeave={() => {
                  if (hoveredLineIdRef.current === line.id) {
                    hoveredLineIdRef.current = null;
                  }
                }}
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

        {/* Capa 3: Agentes, Habilidades, Utilidades y Cuadros de Texto */}
        <Layer>
          {tokens.map((token) => {
            if (token.type === 'text') {
              return (
                <TacticalTextNode
                  key={token.id}
                  token={token}
                  stageWidth={dimensions.width}
                  stageHeight={dimensions.height}
                  currentTool={currentTool}
                  onUpdatePosition={onUpdateTokenPosition}
                  onRemove={onRemoveToken}
                  onHoverToken={(id) => {
                    hoveredTokenIdRef.current = id;
                  }}
                  onStartEditing={(id) => setEditingTextId(id)}
                />
              );
            }

            return (
              <TacticalTokenNode
                key={token.id}
                token={token}
                stageWidth={dimensions.width}
                stageHeight={dimensions.height}
                currentTool={currentTool}
                onUpdatePosition={onUpdateTokenPosition}
                onRemove={onRemoveToken}
                onHoverToken={(id) => {
                  hoveredTokenIdRef.current = id;
                }}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Editor flotante interactivo de cuadro de texto (Estilo ValoPlant) */}
      {(() => {
        const editingToken = tokens.find((t) => t.id === editingTextId && t.type === 'text');
        if (!editingToken) return null;

        return (
          <div
            className="absolute z-40 bg-[#120B21]/95 border border-[#8B44F7] rounded-xl p-3 shadow-2xl backdrop-blur-md w-72 max-w-[90%]"
            style={{
              left: `${Math.min(72, Math.max(28, editingToken.x))}%`,
              top: `${Math.min(72, Math.max(24, editingToken.y))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Barra superior: Tamaños H1/H2/H3, Formato B/I/U y Bando */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#26143E]">
              {/* Selector de Tamaño: H1, H2, H3 */}
              <div className="flex items-center bg-[#0C0614] rounded-lg p-0.5 border border-[#26143E]">
                {(['H1', 'H2', 'H3'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onUpdateToken?.(editingToken.id, { textLevel: lvl })}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      (editingToken.textLevel || 'H2') === lvl
                        ? 'bg-[#8B44F7] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Formato: Negrita (B), Cursiva (I), Subrayado (U) */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onUpdateToken?.(editingToken.id, { isBold: !editingToken.isBold })}
                  title="Negrita"
                  className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs transition-all cursor-pointer ${
                    editingToken.isBold
                      ? 'bg-[#E2B86E] text-black shadow-sm'
                      : 'bg-[#0C0614] border border-[#26143E] text-gray-300 hover:text-white'
                  }`}
                >
                  B
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateToken?.(editingToken.id, { isItalic: !editingToken.isItalic })}
                  title="Cursiva"
                  className={`w-6 h-6 rounded flex items-center justify-center italic font-serif text-xs transition-all cursor-pointer ${
                    editingToken.isItalic
                      ? 'bg-[#E2B86E] text-black shadow-sm'
                      : 'bg-[#0C0614] border border-[#26143E] text-gray-300 hover:text-white'
                  }`}
                >
                  I
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateToken?.(editingToken.id, { isUnderline: !editingToken.isUnderline })}
                  title="Subrayado"
                  className={`w-6 h-6 rounded flex items-center justify-center underline text-xs font-semibold transition-all cursor-pointer ${
                    editingToken.isUnderline
                      ? 'bg-[#E2B86E] text-black shadow-sm'
                      : 'bg-[#0C0614] border border-[#26143E] text-gray-300 hover:text-white'
                  }`}
                >
                  U
                </button>
              </div>

              {/* Selector de Bando / Color */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onUpdateToken?.(editingToken.id, { team: 'attack' })}
                  title="Rojo Ataque"
                  className={`w-3.5 h-3.5 rounded-full bg-red-500 border transition-transform cursor-pointer ${
                    editingToken.team === 'attack'
                      ? 'scale-125 border-white ring-1 ring-red-400'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => onUpdateToken?.(editingToken.id, { team: 'defense' })}
                  title="Cyan Defensa"
                  className={`w-3.5 h-3.5 rounded-full bg-cyan-400 border transition-transform cursor-pointer ${
                    editingToken.team === 'defense'
                      ? 'scale-125 border-white ring-1 ring-cyan-300'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => onUpdateToken?.(editingToken.id, { team: 'neutral' })}
                  title="Oro Neutral"
                  className={`w-3.5 h-3.5 rounded-full bg-[#E2B86E] border transition-transform cursor-pointer ${
                    editingToken.team === 'neutral'
                      ? 'scale-125 border-white ring-1 ring-amber-300'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              </div>
            </div>

            {/* Cuadro de texto con preview en vivo de estilo y tamaño */}
            <textarea
              autoFocus
              value={editingToken.text || ''}
              onChange={(e) => onUpdateToken?.(editingToken.id, { text: e.target.value })}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                  e.preventDefault();
                  setEditingTextId(null);
                }
              }}
              placeholder="Escribe tu nota táctica..."
              rows={3}
              className={`w-full bg-[#0C0614] border border-[#26143E] focus:border-[#8B44F7] rounded-lg p-2 text-white placeholder-gray-500 outline-none resize-none transition-all ${
                editingToken.textLevel === 'H1'
                  ? 'text-base font-bold'
                  : editingToken.textLevel === 'H3'
                  ? 'text-xs'
                  : 'text-sm font-medium'
              } ${editingToken.isBold ? 'font-black' : ''} ${editingToken.isItalic ? 'italic' : ''} ${editingToken.isUnderline ? 'underline' : ''}`}
            />

            {/* Barra de pie: Botón Borrar y Guardar / Listo */}
            <div className="flex items-center justify-between mt-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onRemoveToken(editingToken.id);
                  setEditingTextId(null);
                }}
                title="Eliminar este cuadro de texto"
                className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-[10px] text-red-300 font-semibold transition-all cursor-pointer"
              >
                Eliminar
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-gray-500">Ctrl+Enter o Listo para guardar</span>
                <button
                  type="button"
                  onClick={() => setEditingTextId(null)}
                  className="px-3 py-1 rounded bg-gradient-to-r from-[#8B44F7] to-[#602ca6] text-[11px] font-bold text-white shadow-md hover:from-[#9c58ff] hover:to-[#6d32be] transition-all cursor-pointer"
                >
                  Listo ✓
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Indicador de mapa cargado en la esquina superior izquierda */}
      <div className="absolute top-2.5 left-3 pointer-events-none select-none flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#26143E]">
        <div className="w-2 h-2 rounded-full bg-[#E2B86E] animate-pulse" />
        <span className="text-[11px] font-bold tracking-wider text-gray-200 uppercase">
          {mapName || 'Mapa'}
        </span>
      </div>

      {/* Controles de Escala / Zoom del mapa en la esquina superior derecha */}
      <div className="absolute top-2.5 right-3 select-none flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#26143E] z-20">
        <span className="text-[10px] text-gray-400 font-bold uppercase hidden sm:inline">Escala:</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapZoom((prev) => Math.max(0.75, Math.round((prev - 0.05) * 100) / 100));
          }}
          title="Reducir escala del mapa"
          className="w-5 h-5 flex items-center justify-center rounded bg-[#180E2B] hover:bg-[#2A1545] border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer font-bold text-xs"
        >
          -
        </button>
        <span className="text-[10px] font-mono font-extrabold text-[#E2B86E] px-1 min-w-[36px] text-center">
          {Math.round(mapZoom * 100)}%
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapZoom((prev) => Math.min(1.35, Math.round((prev + 0.05) * 100) / 100));
          }}
          title="Aumentar escala del mapa"
          className="w-5 h-5 flex items-center justify-center rounded bg-[#180E2B] hover:bg-[#2A1545] border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer font-bold text-xs"
        >
          +
        </button>
      </div>
    </div>
  </div>
  );
};
