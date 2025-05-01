import { useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Line, Arrow, Circle, Rect } from 'react-konva';
import useImage from 'use-image';
import { useAnnotation, Layer } from '../context/AnnotationContext';

interface CanvasAnnotatorProps {
  imageUrl: string;
  width?: number;
  height?: number;
}

export interface CanvasAnnotatorHandle {
  exportImage: () => string;
}

const CanvasAnnotator = forwardRef<CanvasAnnotatorHandle, CanvasAnnotatorProps>(
  ({ imageUrl, width = 600, height = 400 }, ref) => {
    const { currentIndex, layers, setLayers, activeTool, activeColour } = useAnnotation();
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const stageRef = useRef<any>(null);
    const [bgImage] = useImage(imageUrl);

    const currentLayers = layers[currentIndex] || [];

    useImperativeHandle(ref, () => ({
      exportImage: () => stageRef.current?.toDataURL() ?? '',
    }));

    const startDrawing = (e: any) => {
      const pos = e.target.getStage().getPointerPosition();

      if (activeTool === 'pen') {
        const newLine: Layer = {
          id: Date.now(),
          type: 'pen',
          colour: activeColour,
          points: [pos.x, pos.y],
        };
        setLayers((prev) => ({ ...prev, [currentIndex]: [...currentLayers, newLine] }));
        setIsDrawing(true);
      } else if (['line', 'arrow', 'circle', 'rectangle'].includes(activeTool)) {
        setStartPoint(pos);
      }
    };

    const draw = (e: any) => {
      if (activeTool === 'pen' && isDrawing) {
        const pos = e.target.getStage().getPointerPosition();
        const updated = [...(layers[currentIndex] || [])];
        const last = { ...updated[updated.length - 1] };
        last.points = [...last.points, pos.x, pos.y];
        updated[updated.length - 1] = last;
        setLayers((prev) => ({ ...prev, [currentIndex]: updated }));
      }
    };

    const endDrawing = (e: any) => {
      if (!startPoint || !['line', 'arrow', 'circle', 'rectangle'].includes(activeTool)) return;

      const end = e.target.getStage().getPointerPosition();
      let newLayer: Layer;

      switch (activeTool) {
        case 'line':
        case 'arrow':
          newLayer = {
            id: Date.now(),
            type: activeTool as 'line' | 'arrow',
            colour: activeColour,
            points: [startPoint.x, startPoint.y, end.x, end.y],
          };
          break;
        case 'circle':
          const radius = Math.hypot(end.x - startPoint.x, end.y - startPoint.y);
          newLayer = {
            id: Date.now(),
            type: 'circle',
            colour: activeColour,
            points: [startPoint.x, startPoint.y, radius],
          };
          break;
        case 'rectangle':
          newLayer = {
            id: Date.now(),
            type: 'rectangle',
            colour: activeColour,
            points: [startPoint.x, startPoint.y, end.x - startPoint.x, end.y - startPoint.y],
          };
          break;
        default:
          return;
      }

      setLayers((prev) => ({ ...prev, [currentIndex]: [...currentLayers, newLayer] }));
      setStartPoint(null);
      setIsDrawing(false);
    };

    return (
      <Stage
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMousemove={draw}
        onMouseup={endDrawing}
        ref={stageRef}
      >
        <KonvaLayer>
          {bgImage && <KonvaImage image={bgImage} width={width} height={height} listening={false} />}
          {currentLayers.map((layer) => {
            switch (layer.type) {
              case 'pen':
              case 'line':
                return (
                  <Line
                    key={layer.id}
                    points={layer.points}
                    stroke={layer.colour}
                    strokeWidth={2}
                    lineCap="round"
                  />
                );
              case 'arrow':
                return (
                  <Arrow
                    key={layer.id}
                    points={layer.points}
                    stroke={layer.colour}
                    strokeWidth={2}
                  />
                );
              case 'circle':
                return (
                  <Circle
                    key={layer.id}
                    x={layer.points[0]}
                    y={layer.points[1]}
                    radius={layer.points[2]}
                    stroke={layer.colour}
                    strokeWidth={2}
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
                    stroke={layer.colour}
                    strokeWidth={2}
                  />
                );
              default:
                return null;
            }
          })}
        </KonvaLayer>
      </Stage>
    );
  }
);

export default CanvasAnnotator;
