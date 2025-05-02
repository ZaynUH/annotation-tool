import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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

const CanvasAnnotator = forwardRef<any, CanvasAnnotatorProps>(
  ({ imageUrl, width = 300, height = 400, previewOnly = false, layers: previewLayers = [] }, ref) => {
    const {
      currentIndex,
      layers,
      setLayers,
      activeTool,
      setActiveTool,
      activeColour
    } = useAnnotation();

    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const transformerRef = useRef<any>(null);
    const stageRef = useRef<any>(null);
    const [bgImage] = useImage(imageUrl);
    const currentLayers = previewOnly ? previewLayers : layers[currentIndex] || [];

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    useEffect(() => {
      const transformer = transformerRef.current;
      if (!transformer || selectedId === null) return;
      const selectedNode = stageRef.current.findOne(`#layer-${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
      } else {
        transformer.nodes([]);
      }
    }, [selectedId, currentLayers]);

    const updateLayer = (newLayer: Layer) => {
      const updated: Layer[] = [...currentLayers, newLayer];
      setLayers((prev) => ({
        ...prev,
        [currentIndex]: updated,
      }));
    };

    const startDrawing = (e: any) => {
      if (previewOnly || activeTool === 'select') return;
      const pos = e.target.getStage().getPointerPosition();
      if (activeTool === 'pen') {
        updateLayer({
          id: Date.now(),
          type: 'pen',
          colour: activeColour,
          points: [pos.x, pos.y]
        });
        setIsDrawing(true);
      } else {
        setStartPoint(pos);
      }
    };

    const draw = (e: any) => {
      if (!isDrawing || activeTool !== 'pen') return;
      const point = e.target.getStage().getPointerPosition();
      const updated = [...currentLayers];
      const last = { ...updated[updated.length - 1] };
      last.points.push(point.x, point.y);
      updated[updated.length - 1] = last;
      setLayers(prev => ({
        ...prev,
        [currentIndex]: updated
      }));
    };

    const endDrawing = (e: any) => {
      if (activeTool === 'pen') setIsDrawing(false);
      if (activeTool !== 'select' && startPoint) {
        const end = e.target.getStage().getPointerPosition();
        const id = Date.now();
        const colour = activeColour;

        const common = { id, type: activeTool as any, colour };
        if (activeTool === 'line' || activeTool === 'arrow') {
          updateLayer({ ...common, points: [startPoint.x, startPoint.y, end.x, end.y] });
        } else if (activeTool === 'rectangle') {
          updateLayer({ ...common, points: [
            Math.min(startPoint.x, end.x),
            Math.min(startPoint.y, end.y),
            Math.abs(end.x - startPoint.x),
            Math.abs(end.y - startPoint.y)
          ]});
        } else if (activeTool === 'circle') {
          const r = Math.sqrt((end.x - startPoint.x) ** 2 + (end.y - startPoint.y) ** 2);
          updateLayer({ ...common, points: [startPoint.x, startPoint.y, r] });
        }
        setStartPoint(null);
      }
    };

    const handleDragEnd = (e: any, id: number) => {
      const node = e.target;
      const updated = currentLayers.map(layer =>
        layer.id === id
          ? { ...layer, points: updatePoints(layer.type, node) }
          : layer
      );
      setLayers(prev => ({ ...prev, [currentIndex]: updated }));
    };

    const updatePoints = (type: string, node: any): number[] => {
      const { x, y, width, height } = node.attrs;
      switch (type) {
        case 'rectangle': return [x, y, width, height];
        case 'circle': return [x, y, width / 2]; // radius approximation
        case 'pen':
        case 'line':
        case 'arrow':
        default: return node.attrs.points;
      }
    };

    return (
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={startDrawing}
        onMousemove={draw}
        onMouseup={endDrawing}
        onClick={(e) => {
          const id = e.target.id();
          if (activeTool === 'select') {
            if (id.startsWith('layer-')) {
              setSelectedId(Number(id.replace('layer-', '')));
            } else {
              setSelectedId(null);
            }
          }
        }}
      >
        <KonvaLayer>
          {bgImage && <KonvaImage image={bgImage} width={width} height={height} listening={false} />}
          {currentLayers.map(({ id, type, points, colour }) => {
            const commonProps = {
              id: `layer-${id}`,
              stroke: colour,
              strokeWidth: 2,
              draggable: activeTool === 'select',
              onDragEnd: (e: any) => handleDragEnd(e, id),
              onClick: () => {
                if (activeTool === 'select') setSelectedId(id);
              }
            };

            switch (type) {
              case 'pen':
              case 'line': return <Line key={id} points={points} {...commonProps} lineCap="round" />;
              case 'arrow': return <Arrow key={id} points={points} {...commonProps} fill={colour} />;
              case 'rectangle': return <Rect key={id} x={points[0]} y={points[1]} width={points[2]} height={points[3]} {...commonProps} />;
              case 'circle': return <Circle key={id} x={points[0]} y={points[1]} radius={points[2]} {...commonProps} />;
              default: return null;
            }
          })}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            anchorStroke="blue"
            anchorSize={6}
            borderDash={[4, 4]}
          />
        </KonvaLayer>
      </Stage>
    );
  }
);

export default CanvasAnnotator;
