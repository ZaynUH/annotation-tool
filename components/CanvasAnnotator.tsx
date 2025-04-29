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
  const stageRef = useRef<any>(null);
  const [bgImage] = useImage(imageUrl);

  const currentLayers = layers[currentIndex] || [];

  const startDrawing = (e: any) => {
    if (activeTool !== 'pen') return;
    const pos = e.target.getStage().getPointerPosition();
    const newLine: Layer = {
      id: Date.now(),
      type: 'pen',
      colour: activeColour,
      points: [pos.x, pos.y],
      name: `Layer ${currentLayers.length + 1}`
    };
    const updated: Layer[] = [...currentLayers, newLine];
    setLayers(prev => ({
      ...prev,
      [currentIndex]: updated
    }));
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || activeTool !== 'pen') return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const updatedLines: Layer[] = [...(layers[currentIndex] || [])];
    const lastLine = { ...updatedLines[updatedLines.length - 1] };
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    updatedLines[updatedLines.length - 1] = lastLine;
    setLayers(prev => ({
      ...prev,
      [currentIndex]: updatedLines
    }));
  };

  const endDrawing = () => {
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
        {bgImage && (
          <KonvaImage
            image={bgImage}
            width={width}
            height={height}
            listening={false}
          />
        )}
        {currentLayers.map((layer) => {
          if (layer.type === 'pen') {
            return (
              <Line
                key={layer.id}
                points={layer.points}
                stroke={layer.colour}
                strokeWidth={2}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation="source-over"
              />
            );
          }
          return null;
        })}
      </KonvaLayer>
    </Stage>
  );
}
