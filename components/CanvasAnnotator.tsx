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
import Konva from 'konva';
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
      transformerRef.current.nodes(nodes);
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
      const base = {
        id,
        type: activeTool as Layer['type'],
        colour: activeColour,
      };

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
          const r = Math.hypot(pos.x - startPoint.x, pos.y - startPoint.y);
          points = [startPoint.x, startPoint.y, r];
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

      const { x, y } = node.position();

      if (shape.type === 'rectangle') {
        const [, , w, h] = shape.points;
        updateLayerPoints(id, [x, y, w, h]);
      } else if (shape.type === 'circle') {
        const [, , r] = shape.points;
        updateLayerPoints(id, [x, y, r]);
      } else if (shape.type === 'line' || shape.type === 'arrow') {
        const dx = node.x();
        const dy = node.y();
        const [x1, y1, x2, y2] = shape.points;
        updateLayerPoints(id, [x1 + dx, y1 + dy, x2 + dx, y2 + dy]);
      }

      node.position({ x: 0, y: 0 });
    };

    const handleTransformEnd = () => {
      const transformer = transformerRef.current;
      transformer.getNodes().forEach((node: any) => {
        const id = Number(node.id().replace('layer-', ''));
        const shape = currentLayers.find((l) => l.id === id);
        if (!shape) return;

        if (shape.type === 'rectangle') {
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const w = node.width() * scaleX;
          const h = node.height() * scaleY;
          updateLayerPoints(id, [node.x(), node.y(), w, h]);
        } else if (shape.type === 'circle') {
          const scale = node.scaleX();
          const r = node.radius() * scale;
          updateLayerPoints(id, [node.x(), node.y(), r]);
        }

        node.scale({ x: 1, y: 1 });
      });
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
              fill: layer.type === 'rectangle' || layer.type === 'circle' ? 'transparent' : undefined,
            };

            switch (layer.type) {
              case 'pen':
                return <Line {...common} points={layer.points} lineCap="round" />;
              case 'line':
                return <Line {...common} points={layer.points} hitStrokeWidth={20} />;
              case 'arrow':
                return <Arrow {...common} points={layer.points} fill={layer.colour} hitStrokeWidth={20} />;
              case 'rectangle':
                return <Rect {...common} x={layer.points[0]} y={layer.points[1]} width={layer.points[2]} height={layer.points[3]} />;
              case 'circle':
                return <Circle {...common} x={layer.points[0]} y={layer.points[1]} radius={layer.points[2]} />;
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
