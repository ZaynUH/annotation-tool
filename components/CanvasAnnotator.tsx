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
      width = 300,
      height = 400,
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
      activeColour,
    } = useAnnotation();

    const currentLayers = previewOnly
      ? previewLayers
      : layers[currentIndex] || [];

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const [bgImage] = useImage(imageUrl);

    /** expose stage to parent */
    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    /** Re-attach transformer whenever selection or layers change */
    useEffect(() => {
      const transformer = transformerRef.current;
      if (!transformer) return;

      if (selectedId == null) {
        transformer.nodes([]);
        transformer.getLayer().batchDraw();
        return;
      }

      const node = stageRef.current.findOne(`#layer-${selectedId}`);
      if (!node) return;

      // determine anchors based on shape type
      const shapeDef = currentLayers.find((l) => l.id === selectedId)!;
      const isLiney =
        shapeDef.type === 'line' || shapeDef.type === 'arrow';

      transformer.nodes([node]);
      transformer.setAttrs({
        rotateEnabled: !isLiney,
        enabledAnchors: isLiney
          ? ['top-left', 'bottom-right']
          : ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        anchorSize: 8,
        anchorStroke: 'black',
        anchorFill: 'white',
        borderDash: [6, 4],
      });
      transformer.getLayer().batchDraw();
    }, [selectedId, currentLayers]);

    /** Helper to update a single layer entry */
    const updateLayer = (newLayer: Layer) => {
      const updated = [...currentLayers, newLayer];
      setLayers((prev) => ({
        ...prev,
        [currentIndex]: updated,
      }));
    };

    /** Drawing logic (pen, line, rect, circle) **/
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
      null
    );

    const startDrawing = (e: any) => {
      if (previewOnly || activeTool === 'select') return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      if (activeTool === 'pen') {
        updateLayer({
          id: Date.now(),
          type: 'pen',
          colour: activeColour,
          points: [pos.x, pos.y],
        });
        setIsDrawing(true);
      } else {
        setStartPoint(pos);
      }
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

    const endDrawing = (e: any) => {
      if (activeTool === 'pen') {
        setIsDrawing(false);
        return;
      }
      if (activeTool === 'select' || !startPoint) return;

      const end = e.target.getStage().getPointerPosition();
      if (!end) return;

      const id = Date.now();
      const colour = activeColour;
      const common = { id, type: activeTool as any, colour };

      if (activeTool === 'line' || activeTool === 'arrow') {
        updateLayer({ ...common, points: [startPoint.x, startPoint.y, end.x, end.y] });
      } else if (activeTool === 'rectangle') {
        const x = Math.min(startPoint.x, end.x);
        const y = Math.min(startPoint.y, end.y);
        const w = Math.abs(end.x - startPoint.x);
        const h = Math.abs(end.y - startPoint.y);
        updateLayer({ ...common, points: [x, y, w, h] });
      } else if (activeTool === 'circle') {
        const r = Math.hypot(end.x - startPoint.x, end.y - startPoint.y);
        updateLayer({ ...common, points: [startPoint.x, startPoint.y, r] });
      }

      setStartPoint(null);
    };

    /** After dragging a shape, push its new coords back into state */
    const handleDragEnd = (e: any, id: number) => {
      const node = e.target;
      const updated = currentLayers.map((l) =>
        l.id === id
          ? { ...l, points: updatePoints(l.type, node) }
          : l
      );
      setLayers((prev) => ({
        ...prev,
        [currentIndex]: updated,
      }));
    };

    const updatePoints = (type: Layer['type'], node: any): number[] => {
      const { x, y, width, height, points } = node.attrs;
      switch (type) {
        case 'rectangle':
          return [x, y, width, height];
        case 'circle':
          return [x, y, node.radius()];
        default:
          return points;
      }
    };

    return (
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onClick={(e) => {
          if (activeTool !== 'select') return;
          const idStr = e.target.id();
          if (idStr.startsWith('layer-')) {
            setSelectedId(Number(idStr.replace('layer-', '')));
          } else {
            setSelectedId(null);
          }
        }}
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
              onDragEnd: (e: any) => handleDragEnd(e, layer.id),
              onClick: () => {
                if (activeTool === 'select') setSelectedId(layer.id);
              },
              onDragStart: () => {
                if (activeTool === 'select') setSelectedId(layer.id);
              },
            };

            switch (layer.type) {
              case 'pen':
                return <Line key={layer.id} points={layer.points} lineCap="round" {...common} />;
              case 'line':
                return <Line key={layer.id} points={layer.points} {...common} />;
              case 'arrow':
                return <Arrow key={layer.id} points={layer.points} fill={layer.colour} {...common} />;
              case 'rectangle':
                return (
                  <Rect
                    key={layer.id}
                    x={layer.points[0]}
                    y={layer.points[1]}
                    width={layer.points[2]}
                    height={layer.points[3]}
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
                    {...common}
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
