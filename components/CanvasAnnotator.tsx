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

      // limit anchor points for line/arrow
      if (nodes.length === 1) {
        const node = nodes[0];
        const layer = currentLayers.find(l => `layer-${l.id}` === node.id());
        if (layer && (layer.type === 'line' || layer.type === 'arrow')) {
          transformerRef.current.enabledAnchors(['start', 'end']);
        } else {
          transformerRef.current.enabledAnchors(undefined);
        }
      }
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

      const abs = node.absolutePosition();
      const { width, height } = stageRef.current.size();
      const clampedX = Math.max(0, Math.min(abs.x, width));
      const clampedY = Math.max(0, Math.min(abs.y, height));

      if (shape.type === 'rectangle') {
        const [, , w, h] = shape.points;
        updateLayerPoints(id, [clampedX, clampedY, w, h]);
      } else if (shape.type === 'circle') {
        const [, , r] = shape.points;
        updateLayerPoints(id, [clampedX, clampedY, r]);
      } else if (shape.type === 'line' || shape.type === 'arrow') {
        const dx = node.x();
        const dy = node.y();
        const [x1, y1, x2, y2] = shape.points;
        updateLayerPoints(id, [x1 + dx, y1 + dy, x2 + dx, y2 + dy]);
      } else if (shape.type === 'pen') {
        const dx = node.x();
        const dy = node.y();
        const newPoints = shape.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy));
        updateLayerPoints(id, newPoints);
      }

      node.position({ x: 0, y: 0 });
    };

    const handleTransformEnd = () => {
      transformerRef.current.getNodes().forEach((node: any) => {
        const id = Number(node.id().replace('layer-', ''));
        const shape = currentLayers.find((l) => l.id === id);
        if (!shape) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const x = node.x();
        const y = node.y();

        if (shape.type === 'rectangle') {
          updateLayerPoints(id, [x, y, node.width() * scaleX, node.height() * scaleY]);
        } else if (shape.type === 'circle') {
          updateLayerPoints(id, [x, y, node.radius() * scaleX]);
        } else if (shape.type === 'pen') {
          const newPoints = shape.points.map((p, i) => {
            return i % 2 === 0
              ? (p - shape.points[0]) * scaleX + x
              : (p - shape.points[1]) * scaleY + y;
          });
          updateLayerPoints(id, newPoints);
        }

        node.scale({ x: 1, y: 1 });
        node.position({ x: 0, y: 0 });
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
              fill: ['rectangle', 'circle'].includes(layer.type) ? 'transparent' : undefined,
            };

            switch (layer.type) {
              case 'pen':
                return <Line {...common} points={layer.points} lineCap="round" closed={false} />;
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
