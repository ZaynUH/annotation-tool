import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState
} from 'react';
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
  (
    { imageUrl, width = 300, height = 400, previewOnly = false, layers: previewLayers = [] },
    ref
  ) => {
    const {
      currentIndex,
      layers,
      setLayers,
      activeTool,
      selectedId,
      setSelectedId,
      activeColour
    } = useAnnotation();

    // combine preview-vs-live layers
    const currentLayers = previewOnly ? previewLayers : layers[currentIndex] || [];

    // expose stage if needed
    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    useImperativeHandle(ref, () => ({ getStage: () => stageRef.current }));

    // background image
    const [bgImage] = useImage(imageUrl);

    /** Re-attach Transformer when selection or layers change **/
    useEffect(() => {
      const tr = transformerRef.current;
      if (!tr) return;
      // if selected shape is rect/circle: attach transformer
      const sel = currentLayers.find((l) => l.id === selectedId);
      if (!sel || sel.type === 'line' || sel.type === 'arrow') {
        tr.nodes([]);
        tr.getLayer().batchDraw();
        return;
      }
      const node = stageRef.current!.findOne(`#layer-${selectedId}`);
      if (node) {
        tr.nodes([node]);
        tr.setAttrs({
          rotateEnabled: true,
          enabledAnchors: [
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right'
          ],
          anchorSize: 8,
          anchorStroke: 'black',
          anchorFill: 'white',
          borderDash: [6, 4]
        });
        tr.getLayer().batchDraw();
      }
    }, [selectedId, currentLayers]);

    /** Utility to update a single layer’s points **/
    const saveLayerPoints = (id: number, newPts: number[]) => {
      setLayers((prev) => {
        const arr = [...(prev[currentIndex] || [])];
        const idx = arr.findIndex((l) => l.id === id);
        if (idx !== -1) arr[idx] = { ...arr[idx], points: newPts };
        return { ...prev, [currentIndex]: arr };
      });
    };

    /** handle end of transform on rect/circle **/
    const handleTransformEnd = (e: any) => {
      const node = e.target;
      const id = Number(node.id().replace('layer-', ''));
      const layerDef = currentLayers.find((l) => l.id === id);
      if (!layerDef) return;

      if (layerDef.type === 'rectangle') {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const newW = node.width() * scaleX;
        const newH = node.height() * scaleY;
        const newX = node.x();
        const newY = node.y();
        saveLayerPoints(id, [newX, newY, newW, newH]);
        node.scaleX(1);
        node.scaleY(1);
      } else if (layerDef.type === 'circle') {
        const scaleX = node.scaleX();
        // uniform
        const newR = node.radius() * scaleX;
        const newX = node.x();
        const newY = node.y();
        saveLayerPoints(id, [newX, newY, newR]);
        node.scaleX(1);
        node.scaleY(1);
      }
    };

    /** handle drag-end on any shape **/
    const handleDragEnd = (e: any) => {
      const node = e.target;
      const id = Number(node.id().replace('layer-', ''));
      const layerDef = currentLayers.find((l) => l.id === id);
      if (!layerDef) return;

      if (layerDef.type === 'rectangle') {
        saveLayerPoints(id, [node.x(), node.y(), layerDef.points[2], layerDef.points[3]]);
      } else if (layerDef.type === 'circle') {
        saveLayerPoints(id, [node.x(), node.y(), layerDef.points[2]]);
      } else if (layerDef.type === 'line' || layerDef.type === 'arrow') {
        // shift both endpoints by the drag offset
        const dx = node.x();
        const dy = node.y();
        const [x1, y1, x2, y2] = layerDef.points;
        saveLayerPoints(id, [x1 + dx, y1 + dy, x2 + dx, y2 + dy]);
      }
    };

    /** drawing logic omitted—you keep your pen/line/rect/circle creation **/

    return (
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={(e) => {
          if (activeTool !== 'select') return;
          const id = (e.target.id() || '').replace('layer-', '');
          if (!id || isNaN(Number(id))) {
            setSelectedId(null);
          } else {
            setSelectedId(Number(id));
          }
        }}
        onMouseDown={(e) => {
          /* your existing startDrawing */
        }}
        onMouseMove={(e) => {
          /* your existing draw */
        }}
        onMouseUp={(e) => {
          /* your existing endDrawing */
        }}
      >
        <KonvaLayer>
          {bgImage && (
            <KonvaImage image={bgImage} width={width} height={height} listening={false} />
          )}

          {currentLayers.map((l) => {
            const common = {
              id: `layer-${l.id}`,
              stroke: l.colour,
              strokeWidth: 2,
              draggable: activeTool === 'select',
              onDragEnd: handleDragEnd,
              onTransformEnd: handleTransformEnd,
              onClick: () => {
                if (activeTool === 'select') setSelectedId(l.id);
              }
            };

            if (l.type === 'line') {
              return (
                <Line
                  key={l.id}
                  points={l.points}
                  lineCap="round"
                  perfectDrawEnabled={false}
                  hitStrokeWidth={20}
                  {...common}
                />
              );
            }

            if (l.type === 'arrow') {
              return (
                <Arrow
                  key={l.id}
                  points={l.points}
                  fill={l.colour}
                  perfectDrawEnabled={false}
                  hitStrokeWidth={20}
                  {...common}
                />
              );
            }

            if (l.type === 'rectangle') {
              return (
                <Rect
                  key={l.id}
                  x={l.points[0]}
                  y={l.points[1]}
                  width={l.points[2]}
                  height={l.points[3]}
                  {...common}
                />
              );
            }

            if (l.type === 'circle') {
              return (
                <Circle
                  key={l.id}
                  x={l.points[0]}
                  y={l.points[1]}
                  radius={l.points[2]}
                  {...common}
                />
              );
            }

            // pen/tool logic you already had…
            return null;
          })}

          {/** for rects/circles only **/}
          <Transformer
            ref={transformerRef}
          />

          {/** custom anchors for line/arrow endpoints **/}
          {selectedId != null &&
            ((): React.ReactNode => {
              const sel = currentLayers.find((l) => l.id === selectedId);
              if (!sel || (sel.type !== 'line' && sel.type !== 'arrow')) return null;
              const [x1, y1, x2, y2] = sel.points;
              return (
                <>
                  <Circle
                    x={x1}
                    y={y1}
                    radius={6}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                    draggable
                    onDragMove={(e) => {
                      const { x, y } = e.target.position();
                      saveLayerPoints(selectedId, [x, y, sel.points[2], sel.points[3]]);
                    }}
                  />
                  <Circle
                    x={x2}
                    y={y2}
                    radius={6}
                    fill="white"
                    stroke="black"
                    strokeWidth={1}
                    draggable
                    onDragMove={(e) => {
                      const { x, y } = e.target.position();
                      saveLayerPoints(selectedId, [sel.points[0], sel.points[1], x, y]);
                    }}
                  />
                </>
              );
            })()}
        </KonvaLayer>
      </Stage>
    );
  }
);

export default CanvasAnnotator;
