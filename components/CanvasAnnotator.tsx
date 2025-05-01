import { useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Line, Rect, Circle } from 'react-konva';
import useImage from 'use-image';
import { useAnnotation, Layer } from '../context/AnnotationContext';

interface Props {
  imageUrl: string;
  width?: number;
  height?: number;
}

export default function CanvasAnnotator({ imageUrl, width = 600, height = 400 }: Props) {
  const { currentIndex, layers, setLayers, activeTool, activeColour } = useAnnotation();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<any>(null);
  const [bgImage] = useImage(imageUrl);
  const currentLayers = layers[currentIndex] || [];

  const saveLayer = (newLayer: Layer) => {
    const updated = [...currentLayers, newLayer];
    setLayers((prev) => ({ ...prev, [currentIndex]: updated }));
  };

  const startDrawing = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (activeTool === 'pen') {
      saveLayer({
        id: Date.now(),
        type: 'pen',
        colour: activeColour,
        points: [pos.x, pos.y],
      });
      setIsDrawing(true);
    }

    if (['line', 'arrow', 'circle', 'rect'].includes(activeTool)) {
      setStartPoint(pos);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing || activeTool !== 'pen') return;
    const point = e.target.getStage().getPointerPosition();
    const updated = [...(layers[currentIndex] || [])];
    const lastLine = { ...updated[updated.length - 1] };
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    updated[updated.length - 1] = lastLine;
    setLayers((prev) => ({ ...prev, [currentIndex]: updated }));
  };

  const endDrawing = (e: any) => {
    if (isDrawing) setIsDrawing(false);
    if (!startPoint) return;

    const end = e.target.getStage().getPointerPosition();
    if (!end) return;

    const newShape: Layer = {
      id: Date.now(),
      type: activeTool as Layer['type'],
      colour: activeColour,
      points: [startPoint.x, startPoint.y, end.x, end.y],
    };
    saveLayer(newShape);
    setStartPoint(null);
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
    >
      <KonvaLayer>
        {bgImage && (
          <KonvaImage image={bgImage} width={width} height={height} listening={false} />
        )}
        {currentLayers.map((layer) => {
          const [x1, y1, x2, y2] = layer.points;
          switch (layer.type) {
            case 'pen':
              return (
                <Line
                  key={layer.id}
                  points={layer.points}
                  stroke={layer.colour}
                  strokeWidth={2}
                  lineCap="round"
                />
              );
            case 'line':
              return (
                <Line
                  key={layer.id}
                  points={[x1, y1, x2, y2]}
                  stroke={layer.colour}
                  strokeWidth={2}
                />
              );
            case 'arrow':
              return (
                <Line
                  key={layer.id}
                  points={[x1, y1, x2, y2]}
                  stroke={layer.colour}
                  strokeWidth={2}
                  pointerLength={10}
                  pointerWidth={10}
                  lineCap="round"
                  lineJoin="round"
                  tension={0}
                />
              );
            case 'circle': {
              const radius = Math.hypot(x2 - x1, y2 - y1);
              return <Circle key={layer.id} x={x1} y={y1} radius={radius} stroke={layer.colour} strokeWidth={2} />;
            }
            case 'rectangle': {
              const width = x2 - x1;
              const height = y2 - y1;
              return <Rect key={layer.id} x={x1} y={y1} width={width} height={height} stroke={layer.colour} strokeWidth={2} />;
            }
            default:
              return null;
          }
        })}
      </KonvaLayer>
    </Stage>
  );
}
