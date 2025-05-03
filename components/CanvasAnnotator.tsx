// 🧠 Full improved CanvasAnnotator with Pen fix, Custom Line Anchors, Circle logic

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
  Ellipse,
  Transformer,
} from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { useAnnotation, Layer } from '../context/AnnotationContext';

interface CanvasAnnotatorProps {
  imageUrl: string;
  width?: number;
  height?: number;
  previewOnly?: boolean;
  layers?: Layer[];
}

const CanvasAnnotator = forwardRef<any, CanvasAnnotatorProps>(
  ({ imageUrl, width = 450, height = 600, previewOnly = false, layers: previewLayers = [] }, ref) => {
    const {
      currentIndex,
      layers,
      setLayers,
      activeTool,
      selectedId,
      setSelectedId,
      activeColour,
    } = useAnnotation();

    const currentLayers = previewOnly ? previewLayers : layers[currentIndex] || [];

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const isCtrlPressedRef = useRef(false);

    const [bgImage] = useImage(imageUrl);
    const [isDrawing, setIsDrawing] = useState(false);
    const [draftLayer, setDraftLayer] = useState<Layer | null>(null);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === 'Control') isCtrlPressedRef.current = true;
      };
      const up = (e: KeyboardEvent) => {
        if (e.key === 'Control') isCtrlPressedRef.current = false;
      };
      window.addEventListener('keydown', down);
      window.addEventListener('keyup', up);
      return () => {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
      };
    }, []);

    useEffect(() => {
      if (!transformerRef.current) return;
      const nodes = selectedIds
        .map(id => stageRef.current.findOne(`#layer-${id}`))
        .filter(Boolean);

      // Skip transformer for line/arrow types
      const shapes = nodes.filter((node) => {
        const shapeId = Number(node.id().replace('layer-', ''));
        const shape = currentLayers.find((l) => l.id === shapeId);
        return shape?.type !== 'line' && shape?.type !== 'arrow';
      });

      transformerRef.current.nodes(shapes);
      transformerRef.current.getLayer()?.batchDraw();
    }, [selectedIds, currentLayers]);

    const updateLayerPoints = (id: number, newPoints: number[]) => {
      setLayers((prev) => {
        const updated = [...(prev[currentIndex] || [])];
        const idx = updated.findIndex((l) => l.id === id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], points: newPoints };
        }
        return { ...prev, [currentIndex]: updated };
      });
    };

    const updateLayer = (newLayer: Layer) => {
      setLayers((prev) => {
        const updated = [...(prev[currentIndex] || []), newLayer];
        return { ...prev, [currentIndex]: updated };
      });
    };

    const handleSelect = (e: any) => {
      if (previewOnly || activeTool !== 'select') return;
      const idStr = e.target.id();
      const isMeta = e.evt.ctrlKey || e.evt.metaKey;
      if (idStr?.startsWith('layer-')) {
        const id = Number(idStr.replace('layer-', ''));
        if (isMeta) {
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          );
        } else {
          setSelectedIds([id]);
        }
        setSelectedId(id);
      } else {
        setSelectedIds([]);
        setSelectedId(null);
      }
    };

    const startDrawing = (e: any) => {
      if (previewOnly || activeTool === 'select') return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      setStartPoint(pos);
      const id = Date.now();
      const base = { id, type: activeTool as Layer['type'], colour: activeColour };
      if (activeTool === 'pen') {
        setIsDrawing(true);
        updateLayer({ ...base, points: [pos.x, pos.y] });
      } else {
        setDraftLayer({ ...base, points: [] });
      }
    };

    const draw = (e: any) => {
      if (!startPoint) return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      if (activeTool === 'pen' && isDrawing) {
        setLayers((prev) => {
          const updated = [...(prev[currentIndex] || [])];
          const last = updated[updated.length - 1];
          last.points.push(pos.x, pos.y);
          updated[updated.length - 1] = last;
          return { ...prev, [currentIndex]: updated };
        });
      } else if (
        ['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)
      ) {
        let points: number[] = [];
        if (activeTool === 'line' || activeTool === 'arrow') {
          points = [startPoint.x, startPoint.y, pos.x, pos.y];
        } else if (activeTool === 'rectangle') {
          const x = Math.min(startPoint.x, pos.x);
          const y = Math.min(startPoint.y, pos.y);
          const w = Math.abs(pos.x - startPoint.x);
          const h = Math.abs(pos.y - startPoint.y);
          points = [x, y, w, h];
        } else if (activeTool === 'circle') {
          const rx = Math.abs(pos.x - startPoint.x);
          const ry = Math.abs(pos.y - startPoint.y);
          points = [startPoint.x, startPoint.y, rx, ry];
        }
        setDraftLayer({ id: -1, type: activeTool as Layer['type'], colour: activeColour, points });
      }
    };

    const endDrawing = () => {
      if (draftLayer) {
        updateLayer({ ...draftLayer, id: Date.now() });
        setDraftLayer(null);
      }
      setIsDrawing(false);
      setStartPoint(null);
    };

    const handleDragEnd = (e: any) => {
      const node = e.target;
      const id = Number(node.id().replace('layer-', ''));
      const shape = currentLayers.find((l) => l.id === id);
      if (!shape) return;

      const dx = node.x();
      const dy = node.y();
      const newPoints = shape.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy));
      updateLayerPoints(id, newPoints);
      node.position({ x: 0, y: 0 });
    };

    const handleTransformEnd = () => {
      transformerRef.current.getNodes().forEach((node: any) => {
        const id = Number(node.id().replace('layer-', ''));
        const shape = currentLayers.find((l) => l.id === id);
        if (!shape) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const newPoints = [...shape.points];

        if (shape.type === 'rectangle') {
          newPoints[2] *= scaleX;
          newPoints[3] *= scaleY;
        } else if (shape.type === 'circle') {
          newPoints[2] *= scaleX;
          newPoints[3] *= scaleY;
        } else if (shape.type === 'pen') {
          for (let i = 0; i < newPoints.length; i += 2) {
            newPoints[i] = (newPoints[i] - shape.points[0]) * scaleX + node.x();
            newPoints[i + 1] = (newPoints[i + 1] - shape.points[1]) * scaleY + node.y();
          }
        }

        updateLayerPoints(id, newPoints);
        node.scale({ x: 1, y: 1 });
        node.position({ x: 0, y: 0 });
      });
    };

    const renderAnchorsForLine = (layer: Layer) => {
      const [x1, y1, x2, y2] = layer.points;
      const updatePoint = (index: number, x: number, y: number) => {
        const updated = [...layer.points];
        updated[index] = x;
        updated[index + 1] = y;
        updateLayerPoints(layer.id, updated);
      };

      return (
        <>
          <Circle
            x={x1}
            y={y1}
            radius={6}
            fill="white"
            stroke="black"
            draggable
            onDragMove={(e) => {
              const pos = e.target.position();
              updatePoint(0, pos.x, pos.y);
            }}
          />
          <Circle
            x={x2}
            y={y2}
            radius={6}
            fill="white"
            stroke="black"
            draggable
            onDragMove={(e) => {
              const pos = e.target.position();
              updatePoint(2, pos.x, pos.y);
            }}
          />
        </>
      );
    };

    return (
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onClick={handleSelect}
      >
        <KonvaLayer>
          {bgImage && (
            <KonvaImage image={bgImage} width={width} height={height} listening={false} />
          )}

          {[...currentLayers, ...(draftLayer ? [draftLayer] : [])].map((layer) => {
            const common = {
              key: layer.id,
              id: `layer-${layer.id}`,
              stroke: layer.colour,
              strokeWidth: 2,
              draggable: activeTool === 'select',
              onDragEnd: handleDragEnd,
              onTransformEnd: handleTransformEnd,
              onClick: handleSelect,
              onTap: handleSelect,
              fill: ['rectangle', 'circle'].includes(layer.type) ? 'transparent' : undefined,
            };

            switch (layer.type) {
              case 'pen':
                return <Line {...common} points={layer.points} lineCap="round" />;
              case 'line':
                return (
                  <>
                    <Line {...common} points={layer.points} hitStrokeWidth={20} />
                    {selectedIds.includes(layer.id) && renderAnchorsForLine(layer)}
                  </>
                );
              case 'arrow':
                return (
                  <>
                    <Arrow {...common} points={layer.points} fill={layer.colour} hitStrokeWidth={20} />
                    {selectedIds.includes(layer.id) && renderAnchorsForLine(layer)}
                  </>
                );
              case 'rectangle':
                return <Rect {...common} x={layer.points[0]} y={layer.points[1]} width={layer.points[2]} height={layer.points[3]} />;
              case 'circle':
                return <Ellipse {...common} x={layer.points[0]} y={layer.points[1]} radiusX={layer.points[2]} radiusY={layer.points[3]} />;
              default:
                return null;
            }
          })}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (isCtrlPressedRef.current) {
                const aspect = oldBox.width / oldBox.height;
                newBox.height = newBox.width / aspect;
              }
              return newBox;
            }}
          />
        </KonvaLayer>
      </Stage>
    );
  }
);

export default CanvasAnnotator;
