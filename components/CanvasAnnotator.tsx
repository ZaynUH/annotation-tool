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
    } = useAnnotation();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const isCtrlPressedRef = useRef(false);

    const currentLayers = previewOnly
      ? previewLayers
      : layers[currentIndex] || [];

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const [bgImage] = useImage(imageUrl);

    const [isDrawing, setIsDrawing] = useState(false);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    // Track ctrl key state
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

    // Update transformer nodes
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

    const handleSelect = (e: any) => {
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

    const updateLayer = (newLayer: Layer) => {
      setLayers((prev) => {
        const updated = [...(prev[currentIndex] || []), newLayer];
        return { ...prev, [currentIndex]: updated };
      });
    };

    const startDrawing = (e: any) => {
      if (previewOnly || activeTool !== 'pen') return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      updateLayer({
        id: Date.now(),
        type: 'pen',
        colour: '#000000',
        points: [pos.x, pos.y],
      });
      setIsDrawing(true);
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

    const endDrawing = () => {
      if (activeTool === 'pen') setIsDrawing(false);
    };

    const handleDragEnd = (e: any) => {
      const node = e.target;
      const id = Number(node.id().replace('layer-', ''));
      const shape = currentLayers.find((l) => l.id === id);
      if (!shape) return;

      const absX = node.absolutePosition().x;
      const absY = node.absolutePosition().y;

      if (shape.type === 'rectangle') {
        const [, , w, h] = shape.points;
        updateLayerPoints(id, [absX, absY, w, h]);
      } else if (shape.type === 'circle') {
        const [, , r] = shape.points;
        updateLayerPoints(id, [absX, absY, r]);
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
        const layer = currentLayers.find((l) => l.id === id);
        if (!layer) return;

        if (layer.type === 'rectangle') {
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const w = node.width() * scaleX;
          const h = node.height() * scaleY;
          updateLayerPoints(id, [node.x(), node.y(), w, h]);
        } else if (layer.type === 'circle') {
          const scaleX = node.scaleX();
          const r = node.radius() * scaleX;
          updateLayerPoints(id, [node.x(), node.y(), r]);
        }

        node.scale({ x: 1, y: 1 });
        node.position({ x: 0, y: 0 });
      });
    };

    const handleDragMove = (e: any) => {
      const shape = e.target;
      const { width, height } = stageRef.current.size();
      const box = shape.getClientRect();
      const absPos = shape.absolutePosition();

      const newX = Math.max(0, Math.min(absPos.x, width - box.width));
      const newY = Math.max(0, Math.min(absPos.y, height - box.height));

      shape.absolutePosition({ x: newX, y: newY });
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
              onDragMove: handleDragMove,
              onDragEnd: handleDragEnd,
              onTransformEnd: handleTransformEnd,
              onClick: handleSelect,
              onTap: handleSelect,
            };

            switch (layer.type) {
              case 'pen':
                return <Line key={layer.id} points={layer.points} lineCap="round" {...common} />;
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

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (isCtrlPressedRef.current) {
                const aspectRatio = oldBox.width / oldBox.height;
                newBox.height = newBox.width / aspectRatio;
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
