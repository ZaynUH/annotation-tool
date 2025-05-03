import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Stage,
  Layer as KonvaLayer,
  Image as KonvaImage,
  Line,
  Arrow,
  Rect,
  Circle,
  Transformer,
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

const CanvasAnnotator = forwardRef<any, CanvasAnnotatorProps>(
  (
    {
      imageUrl,
      width = 450,
      height = 600,
      previewOnly = false,
      layers: previewLayers = [],
    },
    ref
  ) => {
    const {
      currentIndex,
      layers,
      setLayers,
      activeTool,
      selectedId,
      setSelectedId,
      activeColour,
    } = useAnnotation();

    const currentLayers = previewOnly
      ? previewLayers
      : layers[currentIndex] || [];

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const [bgImage] = useImage(imageUrl);

    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    useEffect(() => {
      const transformer = transformerRef.current;
      const stage = stageRef.current;
      if (!transformer || selectedId == null || !stage) return;

      const node = stage.findOne(`#layer-${selectedId}`);
      const layerData = currentLayers.find((l) => l.id === selectedId);
      if (!node || !layerData) return;

      if (layerData.type === 'line' || layerData.type === 'arrow') {
        transformer.nodes([]);
        return;
      }

      transformer.nodes([node]);
      transformer.setAttrs({
        rotateEnabled: true,
        anchorSize: 8,
        anchorStroke: '#3b82f6',
        anchorFill: '#ffffff',
        borderDash: [6, 4],
        enabledAnchors: [
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'middle-left',
          'middle-right',
          'top-center',
          'bottom-center',
        ],
      });

      transformer.getLayer().batchDraw();
    }, [selectedId, currentLayers]);

    const updateLayerPoints = (id: number, newPoints: number[]) => {
      setLayers((prev) => {
        const updated = [...(prev[currentIndex] || [])];
        const idx = updated.findIndex((l) => l.id === id);
        if (idx !== -1) updated[idx] = { ...updated[idx], points: newPoints };
        return { ...prev, [currentIndex]: updated };
      });

      requestAnimationFrame(() => {
        stageRef.current?.batchDraw();
      });
    };

    const updateLayer = (newLayer: Layer) => {
      const updated = [...(layers[currentIndex] || []), newLayer];
      setLayers((prev) => {
        const next = { ...prev, [currentIndex]: updated };
        requestAnimationFrame(() => {
          stageRef.current?.batchDraw();
        });
        return next;
      });
    };

    const startDrawing = (e: any) => {
      if (previewOnly || activeTool === 'select') return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      if (activeTool === 'pen') {
        updateLayer({
          id: Date.now(),
          type: 'pen',
          colour: activeColour,
          points: [pos.x, pos.y],
        });
        setIsDrawing(true);
      } else {
        setStartPoint(pos);
      }
    };

    const draw = (e: any) => {
      if (!isDrawing || activeTool !== 'pen') return;
      const point = e.target.getStage().getPointerPosition();
      if (!point) return;

      const updated = [...currentLayers];
      const last = { ...updated[updated.length - 1] };
      last.points.push(point.x, point.y);
      updated[updated.length - 1] = last;

      setLayers((prev) => {
        const next = { ...prev, [currentIndex]: updated };
        requestAnimationFrame(() => {
          stageRef.current?.batchDraw();
        });
        return next;
      });
    };

    const endDrawing = (e: any) => {
      if (activeTool === 'pen') {
        setIsDrawing(false);
        return;
      }

      if (!startPoint || activeTool === 'select') return;

      const end = e.target.getStage().getPointerPosition();
      if (!end) return;

      const id = Date.now();
      const common = { id, type: activeTool as Layer['type'], colour: activeColour };

      if (activeTool === 'line' || activeTool === 'arrow') {
        updateLayer({ ...common, points: [startPoint.x, startPoint.y, end.x, end.y] });
      } else if (activeTool === 'rectangle') {
        const x = Math.min(startPoint.x, end.x);
        const y = Math.min(startPoint.y, end.y);
        const w = Math.abs(end.x - startPoint.x);
        const h = Math.abs(end.y - startPoint.y);
        updateLayer({ ...common, points: [x, y, w, h] });
      } else if (activeTool === 'circle') {
        const r = Math.hypot(end.x - startPoint.x, end.y - startPoint.y);
        updateLayer({ ...common, points: [startPoint.x, startPoint.y, r] });
      }

      setStartPoint(null);
    };

    const handleTransformEnd = (e: any) => {
      const node = e.target;
      const id = Number(node.id().replace('layer-', ''));
      const layer = currentLayers.find((l) => l.id === id);
      if (!layer) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      if (layer.type === 'rectangle') {
        updateLayerPoints(id, [node.x(), node.y(), node.width() * scaleX, node.height() * scaleY]);
      } else if (layer.type === 'circle') {
        updateLayerPoints(id, [node.x(), node.y(), node.radius() * scaleX]);
      }

      node.scale({ x: 1, y: 1 });
    };

    const handleDragEnd = (e: any) => {
      const id = Number(e.target.id().replace('layer-', ''));
      const shape = currentLayers.find((l) => l.id === id);
      if (!shape) return;

      const node = e.target;

      if (shape.type === 'rectangle') {
        updateLayerPoints(id, [node.x(), node.y(), shape.points[2], shape.points[3]]);
      } else if (shape.type === 'circle') {
        updateLayerPoints(id, [node.x(), node.y(), shape.points[2]]);
      } else if (shape.type === 'line' || shape.type === 'arrow') {
        const dx = node.x();
        const dy = node.y();
        const [x1, y1, x2, y2] = shape.points;
        updateLayerPoints(id, [x1 + dx, y1 + dy, x2 + dx, y2 + dy]);
        node.position({ x: 0, y: 0 });
      }
    };

    return (
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onClick={(e) => {
          const idStr = e.target.id();
          if (idStr?.startsWith('layer-')) {
            const id = Number(idStr.replace('layer-', ''));
            setSelectedId(id);
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

          {currentLayers.map((layer) => {
            const common = {
              id: `layer-${layer.id}`,
              stroke: layer.colour,
              strokeWidth: 2,
              draggable: activeTool === 'select',
              onDragEnd: handleDragEnd,
              onTransformEnd: handleTransformEnd,
              onClick: () => setSelectedId(layer.id),
              onTap: () => setSelectedId(layer.id),
            };

            switch (layer.type) {
              case 'pen':
                return <Line key={layer.id} points={layer.points} lineCap="round" tension={0.4} {...common} />;
              case 'line':
                return <Line key={layer.id} points={layer.points} hitStrokeWidth={20} {...common} />;
              case 'arrow':
                return <Arrow key={layer.id} points={layer.points} fill={layer.colour} hitStrokeWidth={20} {...common} />;
              case 'rectangle':
                return (
                  <Rect
                    key={layer.id}
                    x={layer.points[0]}
                    y={layer.points[1]}
                    width={layer.points[2]}
                    height={layer.points[3]}
                    fill="transparent"
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
                    fill="transparent"
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
  }
);

export default CanvasAnnotator;
