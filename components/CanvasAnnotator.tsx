import { useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { useAnnotation, Layer } from '../context/AnnotationContext';

interface CanvasAnnotatorProps {
  imageUrl: string;
  width?: number;
  height?: number;
}

export default function CanvasAnnotator({ imageUrl, width = 600, height = 400 }: CanvasAnnotatorProps) {
  const { currentIndex, layers, setLayers, activeTool, activeColour } = useAnnotation();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const stageRef = useRef<any>(null);
  const [bgImage] = useImage(imageUrl);

  const currentLayers = layers[currentIndex] || [];

  const startDrawing = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();

    if (activeTool === 'pen') {
      const newLine: Layer = {
        id: Date.now(),
        type: 'pen',
        colour: activeColour,
        points: [pos.x, pos.y],
      };
      const updated: Layer[] = [...currentLayers, newLine];
      setLayers(prev => ({ ...prev, [currentIndex]: updated }));
      setIsDrawing(true);
    }

    if (activeTool === 'line') {
      if (!startPoint) {
        setStartPoint(pos);
      } else {
        const newLine: Layer = {
          id: Date.now(),
          type: 'line',
          colour: activeColour,
          points: [startPoint.x, startPoint.y, pos.x, pos.y],
        };
        const updated: Layer[] = [...currentLayers, newLine];
        setLayers(prev => ({ ...prev, [currentIndex]: updated }));
        setStartPoint(null);
      }
    }
  };

  const draw = (e: any) => {
    if (!isDrawing || activeTool !== 'pen') return;
    const point = e.target.getStage().getPointerPosition();
    const updatedLines: Layer[] = [...(layers[currentIndex] || [])];
    const lastLine = { ...updatedLines[updatedLines.length - 1] };
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    updatedLines[updatedLines.length - 1] = lastLine;
    setLayers(prev => ({ ...prev, [currentIndex]: updatedLines }));
  };

  const endDrawing = () => setIsDrawing(false);

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
        {bgImage && (
          <KonvaImage image={bgImage} width={width} height={height} listening={false} />
        )}
        {currentLayers.map((layer) => {
          if (layer.type === 'pen' || layer.type === 'line') {
            return (
              <Line
                key={layer.id}
                points={layer.points}
                stroke={layer.colour}
                strokeWidth={2}
                lineCap="round"
              />
            );
          }
          return null;
        })}
      </KonvaLayer>
    </Stage>
  );
}
