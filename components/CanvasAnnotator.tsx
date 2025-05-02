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
      width = 300,
      height = 400,
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

    // Expose to parent
    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    // Transformer logic (for circle + rect only)
    useEffect(() => {
      const transformer = transformerRef.current;
      if (!transformer || selectedId == null) return;

      const node = stageRef.current.findOne(`#layer-${selectedId}`);
      const layerData = currentLayers.find((l) => l.id === selectedId);
      if (!node || !layerData) return;

      if (layerData.type === 'line' || layerData.type === 'arrow') {
        transformer.nodes([]); // Do not attach transformer
        return;
      }

      transformer.nodes([node]);
      transformer.getLayer().batchDraw();
    }, [selectedId, currentLayers]);

    const updateLayerPoints = (id: number, newPoints: number[]) => {
      setLayers((prev) => {
        const updated = [...(prev[currentIndex] || [])];
        const idx = updated.findIndex((l) => l.id === id);
        if (idx !== -1) updated[idx] = { ...updated[idx], points: newPoints };
        return { ...prev, [currentIndex]: updated };
      });
    };

    const updateLayer = (newLayer: Layer) => {
      const updated = [...currentLayers, newLayer];
      setLayers((prev) => ({
        ...prev,
        [currentIndex]: updated,
      }));
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

      setLayers((prev) => ({
        ...prev,
        [currentIndex]: updated,
      }));
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
      const colour = activeColour;
      const common = { id, type: activeTool as Layer['type'], colour };

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

      if (layer.type === 'rectangle') {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const newW = node.width() * scaleX;
        const newH = node.height() * scaleY;
        const newX = node.x();
        const newY = node.y();
        updateLayerPoints(id, [newX, newY, newW, newH]);
        node.scale({ x: 1, y: 1 });
      } else if (layer.type === 'circle') {
        const scaleX = node.scaleX();
        const newR = node.radius() * scaleX;
        updateLayerPoints(id, [node.x(), node.y(), newR]);
        node.scale({ x: 1, y: 1 });
      }
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

            if (layer.type === 'pen') {
              return <Line key={layer.id} points={layer.points} lineCap="round" {...common} />;
            }

            if (layer.type === 'line') {
              return (
                <Line key={layer.id} points={layer.points} {...common} />
              );
            }

            if (layer.type === 'arrow') {
              return (
                <Arrow key={layer.id} points={layer.points} fill={layer.colour} {...common} />
              );
            }

            if (layer.type === 'rectangle') {
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
            }

            if (layer.type === 'circle') {
              return (
                <Circle
                  key={layer.id}
                  x={layer.points[0]}
                  y={layer.points[1]}
                  radius={layer.points[2]}
                  {...common}
                />
              );
            }

            return null;
          })}

          {/* Transformer for rect/circle */}
          <Transformer ref={transformerRef} />

          {/* Anchor points for line/arrow */}
          {selectedId != null &&
            (() => {
              const sel = currentLayers.find((l) => l.id === selectedId);
              if (!sel || (sel.type !== 'line' && sel.type !== 'arrow')) return null;
              const [x1, y1, x2, y2] = sel.points;
              return (
                <>
                  <Circle
                    x={x1}
                    y={y1}
                    radius={6}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                    draggable
                    onDragMove={(e) => {
                      const { x, y } = e.target.position();
                      updateLayerPoints(selectedId, [x, y, sel.points[2], sel.points[3]]);
                    }}
                  />
                  <Circle
                    x={x2}
                    y={y2}
                    radius={6}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                    draggable
                    onDragMove={(e) => {
                      const { x, y } = e.target.position();
                      updateLayerPoints(selectedId, [sel.points[0], sel.points[1], x, y]);
                    }}
                  />
                </>
              );
            })()}
        </KonvaLayer>
      </Stage>
    );
  }
);

export default CanvasAnnotator;
