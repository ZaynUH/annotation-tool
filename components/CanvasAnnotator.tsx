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
      activeColour,
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
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      if (!transformer || !selectedId) return;

      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
      } else {
        transformer.nodes([]);
      }
    }, [selectedId]);

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
        const newLine: Layer = {
          id: Date.now(),
          type: 'pen',
          colour: activeColour,
          points: [pos.x, pos.y],
        };
        updateLayer(newLine);
        setIsDrawing(true);
      } else {
        setStartPoint(pos);
      }
    };

    const draw = (e: any) => {
      if (previewOnly || !isDrawing || activeTool !== 'pen') return;
      const pos = e.target.getStage().getPointerPosition();
      const updated = [...(layers[currentIndex] || [])];
      const last = { ...updated[updated.length - 1] };
      last.points = last.points.concat([pos.x, pos.y]);
      updated[updated.length - 1] = last;
      setLayers((prev) => ({
        ...prev,
        [currentIndex]: updated,
      }));
    };

    const endDrawing = (e: any) => {
      if (previewOnly || activeTool === 'pen' || activeTool === 'select') return;
      const end = e.target.getStage().getPointerPosition();
      if (!startPoint) return;

      const id = Date.now();
      const colour = activeColour;
      const commonProps = { id, type: activeTool as any, colour };

      if (activeTool === 'line' || activeTool === 'arrow') {
        updateLayer({ ...commonProps, points: [startPoint.x, startPoint.y, end.x, end.y] });
      } else if (activeTool === 'rectangle') {
        const x = Math.min(startPoint.x, end.x);
        const y = Math.min(startPoint.y, end.y);
        const width = Math.abs(end.x - startPoint.x);
        const height = Math.abs(end.y - startPoint.y);
        updateLayer({ ...commonProps, points: [x, y, width, height] });
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt((end.x - startPoint.x) ** 2 + (end.y - startPoint.y) ** 2);
        updateLayer({ ...commonProps, points: [startPoint.x, startPoint.y, radius] });
      }

      setStartPoint(null);
    };

    const handleSelect = (id: number) => {
      if (previewOnly || activeTool !== 'select') return;
      setSelectedId(id);
    };

    return (
      <Stage
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMousemove={draw}
        onMouseup={endDrawing}
        ref={stageRef}
        onClick={(e) => {
          const id = e.target.id();
          if (activeTool === 'select') {
            if (id) setSelectedId(Number(id));
            else setSelectedId(null);
          }
        }}
      >
        <KonvaLayer>
          {bgImage && (
            <KonvaImage image={bgImage} width={width} height={height} listening={false} />
          )}
          {currentLayers.map((layer) => {
            const { id, type, points, colour } = layer;

            switch (type) {
              case 'pen':
              case 'line':
                return (
                  <Line
                    key={id}
                    id={id.toString()}
                    points={points}
                    stroke={colour}
                    strokeWidth={2}
                    lineCap="round"
                    draggable={activeTool === 'select'}
                    onClick={() => handleSelect(id)}
                  />
                );
              case 'arrow':
                return (
                  <Arrow
                    key={id}
                    id={id.toString()}
                    points={points}
                    stroke={colour}
                    fill={colour}
                    strokeWidth={2}
                    draggable={activeTool === 'select'}
                    onClick={() => handleSelect(id)}
                  />
                );
              case 'rectangle':
                return (
                  <Rect
                    key={id}
                    id={id.toString()}
                    x={points[0]}
                    y={points[1]}
                    width={points[2]}
                    height={points[3]}
                    stroke={colour}
                    strokeWidth={2}
                    draggable={activeTool === 'select'}
                    onClick={() => handleSelect(id)}
                  />
                );
              case 'circle':
                return (
                  <Circle
                    key={id}
                    id={id.toString()}
                    x={points[0]}
                    y={points[1]}
                    radius={points[2]}
                    stroke={colour}
                    strokeWidth={2}
                    draggable={activeTool === 'select'}
                    onClick={() => handleSelect(id)}
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
