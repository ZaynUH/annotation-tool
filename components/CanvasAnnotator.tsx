import React, { useRef, useEffect, forwardRef } from 'react';
import {
  Stage,
  Layer as KonvaLayer,
  Image as KonvaImage,
  Line,
  Arrow,
  Rect,
  Circle,
  Transformer
} from 'react-konva';
import useImage from 'use-image';
import { useAnnotation, Layer } from '../context/AnnotationContext';

interface CanvasAnnotatorProps {
  imageUrl: string;
  width?: number;
  height?: number;
  previewOnly?: boolean;
  layers?: Layer[];
}

const CanvasAnnotator = forwardRef<any, CanvasAnnotatorProps>(({
  imageUrl,
  width = 300,
  height = 400,
  previewOnly = false,
  layers: previewLayers = []
}, ref) => {
  const {
    currentIndex,
    layers,
    setLayers,
    activeTool,
    selectedId,
    setSelectedId,
    activeColour
  } = useAnnotation();

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [bgImage] = useImage(imageUrl);

  const currentLayers = previewOnly
    ? previewLayers
    : layers[currentIndex] || [];

  const updateLayerProps = (id: number, newProps: Partial<Layer>) => {
    setLayers(prev => ({
      ...prev,
      [currentIndex]: prev[currentIndex].map(l =>
        l.id === id ? { ...l, ...newProps } : l
      )
    }));
  };

  useEffect(() => {
    const tr = transformerRef.current!;
    const stage = stageRef.current!;

    if (selectedId == null) {
      tr.nodes([]);
      tr.getLayer().batchDraw();
      return;
    }

    const node = stage.findOne(`#layer-${selectedId}`);
    if (!node) {
      tr.nodes([]);
      tr.getLayer().batchDraw();
      return;
    }

    const def = currentLayers.find(l => l.id === selectedId)!;
    const isLiney = def.type === 'line' || def.type === 'arrow';

    tr.nodes([node]);
    tr.setAttrs({
      rotateEnabled: true,
      enabledAnchors: isLiney
        ? ['top-left','bottom-right']
        : ['top-left','top-right','bottom-left','bottom-right'],
      anchorSize: 8,
      anchorStroke: '#000',
      anchorFill: '#fff',
      borderDash: [6,4]
    });
    tr.getLayer().batchDraw();
  }, [selectedId, currentLayers]);

  const handleDragEnd = (e: any, layer: Layer) => {
    const node = e.target;
    if (layer.type === 'rectangle') {
      updateLayerProps(layer.id, {
        points: [node.x(), node.y(), node.width(), node.height()]
      });
    } else if (layer.type === 'circle') {
      updateLayerProps(layer.id, {
        points: [node.x(), node.y(), node.radius()]
      });
    } else {
      updateLayerProps(layer.id, {
        points: node.points()
      });
    }
  };

  const handleTransformEnd = (e: any, layer: Layer) => {
    const node = e.target;
    if (layer.type === 'rectangle') {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const newW = Math.max(5, node.width() * scaleX);
      const newH = Math.max(5, node.height() * scaleY);
      node.scaleX(1);
      node.scaleY(1);
      updateLayerProps(layer.id, {
        points: [node.x(), node.y(), newW, newH]
      });
    } else if (layer.type === 'circle') {
      const scale = node.scaleX();
      const newR = Math.max(3, node.radius() * scale);
      node.scaleX(1);
      node.scaleY(1);
      updateLayerProps(layer.id, {
        points: [node.x(), node.y(), newR]
      });
    } else {
      updateLayerProps(layer.id, {
        points: node.points()
      });
    }
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      onClick={e => {
        if (activeTool !== 'select') return;
        const idStr = e.target.id();
        if (idStr.startsWith('layer-')) {
          setSelectedId(Number(idStr.replace('layer-','')));
        } else {
          setSelectedId(null);
        }
      }}
    >
      <KonvaLayer>
        {bgImage && (
          <KonvaImage
            image={bgImage}
            width={width}
            height={height}
            listening={false}
          />
        )}

        {currentLayers.map(layer => {
          const common = {
            id: `layer-${layer.id}`,
            stroke: layer.colour,
            strokeWidth: 2,
            draggable: activeTool === 'select',
            onDragEnd: (e: any) => handleDragEnd(e, layer),
            onTransformEnd: (e: any) => handleTransformEnd(e, layer),
            onClick: () => {
              if (activeTool === 'select') setSelectedId(layer.id);
            }
          };

          switch (layer.type) {
            case 'pen':
            case 'line':
              return (
                <Line
                  key={layer.id}
                  points={layer.points}
                  lineCap="round"
                  {...common}
                />
              );
            case 'arrow':
              return (
                <Arrow
                  key={layer.id}
                  points={layer.points}
                  fill={layer.colour}
                  {...common}
                />
              );
            case 'rectangle':
              return (
                <Rect
                  key={layer.id}
                  x={layer.points[0]}
                  y={layer.points[1]}
                  width={layer.points[2]}
                  height={layer.points[3]}
                  {...common}
                />
              );
            case 'circle':
              return (
                <Circle
                  key={layer.id}
                  x={layer.points[0]}
                  y={layer.points[1]}
                  radius={layer.points[2]}
                  {...common}
                />
              );
            default:
              return null;
          }
        })}

        <Transformer ref={transformerRef} />
      </KonvaLayer>
    </Stage>
  );
});

export default CanvasAnnotator;
