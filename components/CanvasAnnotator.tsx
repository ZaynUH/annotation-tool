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

const containerRef = useRef<HTMLDivElement>(null);

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

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const isCtrlPressedRef = useRef(false);

    const [bgImage] = useImage(imageUrl);
    const [isDrawing, setIsDrawing] = useState(false);
    const [draftLayer, setDraftLayer] = useState<Layer | null>(null);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editingTextId, setEditingTextId] = useState<number | null>(null);
    const [textEditValue, setTextEditValue] = useState<string>('');

    const currentLayers = previewOnly ? previewLayers : layers[currentIndex] || [];

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Control') isCtrlPressedRef.current = e.type === 'keydown';
      };
      window.addEventListener('keydown', handleKey);
      window.addEventListener('keyup', handleKey);
      return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('keyup', handleKey);
      };
    }, []);

    useEffect(() => {
      if (!transformerRef.current) return;
      const nodes = selectedIds
        .map(id => stageRef.current.findOne(`#layer-${id}`))
        .filter(Boolean);
      const transformable = nodes.filter(node => {
        const id = Number(node.id().replace('layer-', ''));
        const l = currentLayers.find(l => l.id === id);
        return l && !['line', 'arrow', 'text'].includes(l.type);
      });
      transformerRef.current.nodes(transformable);
      transformerRef.current.getLayer()?.batchDraw();
    }, [selectedIds, currentLayers]);

    const updateLayerPoints = (id: number, points: number[]) => {
      pushHistory(currentIndex, layers[currentIndex] || []);
      setLayers(prev => {
        const updated = [...(prev[currentIndex] || [])];
        const idx = updated.findIndex(l => l.id === id);
        if (idx !== -1) updated[idx] = { ...updated[idx], points };
        return { ...prev, [currentIndex]: updated };
      });
    };

    const updateLayer = (newLayer: Layer) => {
      pushHistory(currentIndex, layers[currentIndex] || []);
      setLayers(prev => {
        const next = [...(prev[currentIndex] || []), newLayer];
        return { ...prev, [currentIndex]: next };
      });
    };

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
        updateLayer({ ...base, points: [pos.x, pos.y] });
      } else if (activeTool === 'text') {
        const newLayer: Layer = {
          ...base,
          id,
          points: [pos.x, pos.y],
          text: 'Double-click to edit',
          fontSize,
        };
        updateLayer(newLayer);
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
        let points: number[] = [];
        if (activeTool === 'line' || activeTool === 'arrow') {
          points = [startPoint.x, startPoint.y, pos.x, pos.y];
        } else if (activeTool === 'rectangle') {
          const x = Math.min(startPoint.x, pos.x);
          const y = Math.min(startPoint.y, pos.y);
          const w = Math.abs(pos.x - startPoint.x);
          const h = Math.abs(pos.y - startPoint.y);
          points = [x, y, w, h];
        } else if (activeTool === 'circle' || activeTool === 'ellipse') {
          const rx = Math.abs(pos.x - startPoint.x);
          const ry = Math.abs(pos.y - startPoint.y);
          points = [startPoint.x, startPoint.y, rx, ry];
        }
        setDraftLayer({ id: -1, type: activeTool as Layer['type'], colour: activeColour, points });
      }
    };

    const endDrawing = () => {
      if (draftLayer) {
        updateLayer({ ...draftLayer, id: Date.now() });
        setDraftLayer(null);
      }
      setIsDrawing(false);
      setStartPoint(null);
    };

    const handleTextDblClick = (layer: Layer) => {
      const stage = stageRef.current;
      const container = containerRef.current;
      if (!stage || !container) return;
    
      const [x, y] = layer.points;
      const stageBox = stage.container().getBoundingClientRect();
    
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
    
      // Style matching
      textarea.value = layer.text || '';
      textarea.style.position = 'absolute';
      textarea.style.top = `${stageBox.top + y}px`;
      textarea.style.left = `${stageBox.left + x}px`;
      textarea.style.fontSize = `${layer.fontSize || 18}px`;
      textarea.style.fontWeight = 'normal'; // Ensures no bolding
      textarea.style.border = '1px solid #ccc';
      textarea.style.padding = '4px 8px';
      textarea.style.margin = '0';
      textarea.style.overflow = 'hidden';
      textarea.style.resize = 'none';
      textarea.style.background = 'white';
      textarea.style.color = layer.colour;
      textarea.style.fontFamily = 'inherit';
      textarea.style.outline = 'none';
      textarea.style.zIndex = '100';
      textarea.style.borderRadius = '4px';
      textarea.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
      textarea.style.lineHeight = '1.2';
    
      // Sizing - width based on text length and font size
      const estimatedWidth = (layer.text?.length || 10) * (layer.fontSize || 18) * 0.6;
      textarea.style.minWidth = '100px';
      textarea.style.maxWidth = '500px';
      textarea.style.width = `${estimatedWidth}px`;
    
      // Height auto-adjust to fit content
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    
      textarea.focus();
    
      const removeTextarea = () => {
        document.body.removeChild(textarea);
        setEditingTextId(null);
      };
    
      const handleOutsideClick = (e: MouseEvent) => {
        if (e.target !== textarea) {
          updateText(layer.id, textarea.value);
          removeTextarea();
        }
      };
    
      const updateText = (id: number, newText: string) => {
        setLayers(prev => {
          const updated = [...(prev[currentIndex] || [])];
          const idx = updated.findIndex(l => l.id === id);
          if (idx !== -1) updated[idx] = { ...updated[idx], text: newText };
          return { ...prev, [currentIndex]: updated };
        });
      };
    
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          updateText(layer.id, textarea.value);
          removeTextarea();
        }
        if (e.key === 'Escape') {
          removeTextarea();
        }
      });
    
      setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
      });
    
      setEditingTextId(layer.id);
    };
    

    const handleTextEditCommit = (value: string) => {
      if (editingTextId !== null) {
        setLayers(prev => {
          const updated = [...(prev[currentIndex] || [])];
          const idx = updated.findIndex(l => l.id === editingTextId);
          if (idx !== -1) updated[idx] = { ...updated[idx], text: value };
          return { ...prev, [currentIndex]: updated };
        });
      }
      setEditingTextId(null);
    };

    return (
      <div ref={containerRef} style={{ position: 'relative' }}>
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
            {bgImage && <KonvaImage image={bgImage} width={width} height={height} listening={false} />}

            {[...currentLayers, ...(draftLayer ? [draftLayer] : [])].map(layer => {
              const common = {
                key: layer.id,
                id: `layer-${layer.id}`,
                stroke: layer.colour,
                strokeWidth: layer.fontSize || 2,
                draggable: activeTool === 'select',
                onDragEnd: () => {},
                onTransformEnd: () => {},
                onClick: handleSelect,
                onTap: handleSelect,
              };

              if (layer.type === 'text') {
                const [x, y] = layer.points;
                return (
                  <>
                    <Text
                      {...common}
                      x={x}
                      y={y}
                      text={layer.text || ''}
                      fontSize={layer.fontSize || 18}
                      onDblClick={() => handleTextDblClick(layer)}
                      visible={editingTextId !== layer.id}
                    />
                    {editingTextId === layer.id && (
                      <Html>
                        <textarea
                          value={textEditValue}
                          style={{
                            position: 'absolute',
                            top: y,
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
                          onChange={(e) => setTextEditValue(e.target.value)}
                          onBlur={() => handleTextEditCommit(textEditValue)}
                          onKeyDown={(e) => {
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
                  </>
                );
              }

              switch (layer.type) {
                case 'pen':
                  return <Line {...common} points={layer.points} lineCap="round" />;
                case 'line':
                  return <Line {...common} points={layer.points} />;
                case 'arrow':
                  return <Arrow {...common} points={layer.points} fill={layer.colour} />;
                case 'rectangle':
                  return <Rect {...common} x={layer.points[0]} y={layer.points[1]} width={layer.points[2]} height={layer.points[3]} />;
                case 'circle':
                  return <Ellipse {...common} x={layer.points[0]} y={layer.points[1]} radiusX={layer.points[2]} radiusY={layer.points[2]} />;
                case 'ellipse':
                  return <Ellipse {...common} x={layer.points[0]} y={layer.points[1]} radiusX={layer.points[2]} radiusY={layer.points[3]} />;
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
