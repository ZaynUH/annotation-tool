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
  Ellipse,
  Transformer,
  Text,
} from 'react-konva';
import { Html } from 'react-konva-utils';
import useImage from 'use-image';
import Konva from 'konva';
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
      fontSize,
      pushHistory,
    } = useAnnotation();

    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    // --- Text‐editing state:
    const [editingTextId, setEditingTextId]     = useState<number | null>(null);
    const [textEditValue, setTextEditValue]     = useState<string>('');

    const [bgImage] = useImage(imageUrl);
    const [isDrawing, setIsDrawing]     = useState(false);
    const [draftLayer, setDraftLayer]   = useState<Layer | null>(null);
    const [startPoint, setStartPoint]   = useState<{ x: number; y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const currentLayers = previewOnly ? previewLayers : layers[currentIndex] || [];

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    // … your existing ctrl‐key, transformer, history, drawing logic unchanged …

    const handleSelect = (e: any) => {
      if (previewOnly || activeTool !== 'select') return;
      const idStr = e.target.id();
      const isMeta = e.evt.ctrlKey || e.evt.metaKey;
      if (idStr?.startsWith('layer-')) {
        const id = Number(idStr.replace('layer-', ''));
        setSelectedId(id);
        setSelectedIds(isMeta ? [...selectedIds, id] : [id]);
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
      const base = { id, type: activeTool as Layer['type'], colour: activeColour };
      if (activeTool === 'pen') {
        setIsDrawing(true);
        pushHistory(currentIndex, layers[currentIndex] || []);
        setLayers(prev => ({
          ...prev,
          [currentIndex]: [
            ...(prev[currentIndex] || []),
            { ...base, points: [pos.x, pos.y] },
          ],
        }));
      } else if (activeTool === 'text') {
        pushHistory(currentIndex, layers[currentIndex] || []);
        setLayers(prev => ({
          ...prev,
          [currentIndex]: [
            ...(prev[currentIndex] || []),
            {
              ...base,
              points: [pos.x, pos.y],
              text: 'Double-click to edit',
              fontSize,
            },
          ],
        }));
      } else {
        setDraftLayer({ ...base, points: [] });
      }
    };

    const draw = (e: any) => {
      if (!startPoint) return;
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      if (activeTool === 'pen' && isDrawing) {
        setLayers(prev => {
          const updated = [...(prev[currentIndex] || [])];
          const last = updated[updated.length - 1];
          last.points.push(pos.x, pos.y);
          updated[updated.length - 1] = last;
          return { ...prev, [currentIndex]: updated };
        });
      } else {
        // rectangle, circle, line, arrow logic as before…
      }
    };

    const endDrawing = () => {
      if (draftLayer) {
        pushHistory(currentIndex, layers[currentIndex] || []);
        setLayers(prev => ({
          ...prev,
          [currentIndex]: [
            ...(prev[currentIndex] || []),
            { ...draftLayer, id: Date.now() },
          ],
        }));
        setDraftLayer(null);
      }
      setIsDrawing(false);
      setStartPoint(null);
    };

    // --- open text editor on double click:
    const handleTextDblClick = (layer: Layer) => {
      setEditingTextId(layer.id);
      setTextEditValue(layer.text || '');
    };

    // --- commit or cancel text edit:
    const handleTextEditCommit = (value: string) => {
      if (editingTextId !== null) {
        pushHistory(currentIndex, layers[currentIndex] || []);
        setLayers(prev => {
          const updated = [...(prev[currentIndex] || [])];
          const idx = updated.findIndex(l => l.id === editingTextId);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], text: value };
          }
          return { ...prev, [currentIndex]: updated };
        });
      }
      setEditingTextId(null);
    };

    return (
      <div style={{ position: 'relative' }}>
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

            {[...currentLayers, ...(draftLayer ? [draftLayer] : [])].map(layer => {
              const common = {
                key: layer.id,
                id: `layer-${layer.id}`,
                stroke: layer.colour,
                strokeWidth: layer.fontSize || 2,
                draggable: activeTool === 'select',
                onClick: handleSelect,
                onTap: handleSelect,
              };

              if (layer.type === 'text') {
                const [x, y] = layer.points;
                return (
                  <React.Fragment key={layer.id}>
                    <Text
                      {...common}
                      x={x}
                      y={y}
                      text={layer.text || ''}
                      fontSize={layer.fontSize || 18}
                      onDblClick={() => handleTextDblClick(layer)}
                      onDblTap={() => handleTextDblClick(layer)}
                      visible={editingTextId !== layer.id}
                    />
                    {editingTextId === layer.id && (
                      <Html>
                        <textarea
                          value={textEditValue}
                          style={{
                            position: 'absolute',
                            top:  y,
                            left: x,
                            fontSize: `${layer.fontSize || 18}px`,
                            fontFamily: 'inherit',
                            padding: 0,
                            margin: 0,
                            border: '1px solid #999',
                            background: 'white',
                            resize: 'none',
                            outline: 'none',
                            color: layer.colour,
                          }}
                          autoFocus
                          onChange={e => setTextEditValue(e.target.value)}
                          onBlur={() => handleTextEditCommit(textEditValue)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleTextEditCommit(textEditValue);
                            } else if (e.key === 'Escape') {
                              setEditingTextId(null);
                            }
                          }}
                        />
                      </Html>
                    )}
                  </React.Fragment>
                );
              }

              // other shape types…
              switch (layer.type) {
                case 'pen':
                  return <Line {...common} points={layer.points} lineCap="round" />;
                case 'line':
                  return <Line {...common} points={layer.points} />;
                case 'arrow':
                  return <Arrow {...common} points={layer.points} fill={layer.colour} />;
                case 'rectangle':
                  return (
                    <Rect
                      {...common}
                      x={layer.points[0]}
                      y={layer.points[1]}
                      width={layer.points[2]}
                      height={layer.points[3]}
                    />
                  );
                case 'circle':
                  return (
                    <Ellipse
                      {...common}
                      x={layer.points[0]}
                      y={layer.points[1]}
                      radiusX={layer.points[2]}
                      radiusY={layer.points[2]}
                    />
                  );
                case 'ellipse':
                  return (
                    <Ellipse
                      {...common}
                      x={layer.points[0]}
                      y={layer.points[1]}
                      radiusX={layer.points[2]}
                      radiusY={layer.points[3]}
                    />
                  );
                default:
                  return null;
              }
            })}

            <Transformer ref={transformerRef} />
          </KonvaLayer>
        </Stage>
      </div>
    );
  }
);

export default CanvasAnnotator;
