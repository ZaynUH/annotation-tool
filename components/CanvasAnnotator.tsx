import React, 
{
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import 
{
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

import useImage from 'use-image';
import Konva from 'konva';
import { useAnnotation, Layer } from '../context/AnnotationContext';
import TextEditor from './TextEditor';

interface CanvasAnnotatorProps 
{
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
      setActiveTool,
      selectedId,
      setSelectedId,
      activeColour,
      fontSize,
      pushHistory,
    } = useAnnotation();

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const isCtrlPressedRef = useRef(false); 

    const [bgImage] = useImage(imageUrl); // Loads the base image
    const [isDrawing, setIsDrawing] = useState(false);
    const [draftLayer, setDraftLayer] = useState<Layer | null>(null);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editingTextId, setEditingTextId] = useState<number | null>(null);

    const currentLayers = previewOnly ? previewLayers : layers[currentIndex] || [];

    useImperativeHandle(ref, () => (
    {
      getStage: () => stageRef.current, // Allows parent to access canvas
    }));

    useEffect(() => 
    {
      // Tracks Control key for multi-select (optional)
      const handleKey = (e: KeyboardEvent) => 
      {
        if (e.key === 'Control')
          { 
            isCtrlPressedRef.current = e.type === 'keydown';
          }
      };
      window.addEventListener('keydown', handleKey);
      window.addEventListener('keyup', handleKey);
      return () => 
      {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('keyup', handleKey);
      };
    }, []);

    useEffect(() => 
    {
      // Keep Transformer selection in sync
      if (selectedId !== null) 
      {
        setSelectedIds([selectedId]);
      }
      else 
      {
        setSelectedIds([]);
      }
    }, [selectedId]);

    useEffect(() => 
    {
      // Attach Transformers to selected shapes
      if (!transformerRef.current || !stageRef.current) return;

      const nodes = selectedIds
        .map(id => stageRef.current.findOne(`#layer-${id}`))
        .filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }, [selectedIds, currentLayers]);

    const updateLayer = (newLayer: Layer) => 
    {
      // Save undo state and update current layers
      pushHistory(currentIndex, layers[currentIndex] || []);
      setLayers(prev => 
      {
        const next = [...(prev[currentIndex] || []), newLayer];
        return { ...prev, [currentIndex]: next };
      });
    };

    const handleSelect = (e: any) => 
    {
      // Annotation selection logic
      if (previewOnly || activeTool !== 'select') return;

      const idStr = e.target.id();
      const isMeta = e.evt.ctrlKey || e.evt.metaKey;

      if (idStr?.startsWith('layer-')) 
      {
        const id = Number(idStr.replace('layer-', ''));
        setSelectedId(id);
        setSelectedIds(isMeta ? [...selectedIds, id] : [id]);
      } 
      else 
      {
        setSelectedIds([]);
        setSelectedId(null);
      }
    };

    const startDrawing = (e: any) => 
    {
      // Handle mouse down for drawing
      if (previewOnly || activeTool === 'select') return;

      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      setStartPoint(pos);
      const id = Date.now();
      const base = { id, type: activeTool as Layer['type'], colour: activeColour };
      
      if (activeTool === 'pen') 
      {
        setIsDrawing(true);
        updateLayer({ ...base, points: [pos.x, pos.y] });
      } 
      else if (activeTool === 'text') 
      {
        const newLayer: Layer = {
          ...base,
          id,
          points: [pos.x, pos.y],
          text: '',
          fontSize,
        };
        updateLayer(newLayer);
        setEditingTextId(id);
      } 
      else
      {
        setDraftLayer({ ...base, points: [] });
      }
    };

    const draw = (e: any) => 
    {
      // Handle mouse move for drawing
      if (!startPoint) return;

      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      if (activeTool === 'pen' && isDrawing) 
      {
        setLayers(prev => 
        {
          const updated = [...(prev[currentIndex] || [])];
          const last = updated[updated.length - 1];
          last.points.push(pos.x, pos.y);
          updated[updated.length - 1] = last;

          return { ...prev, [currentIndex]: updated };
        });
      } 
      else 
      {
        let points: number[] = [];
        if (activeTool === 'line' || activeTool === 'arrow') 
        {
          points = [startPoint.x, startPoint.y, pos.x, pos.y];
        } 
        else if (activeTool === 'rectangle') 
        {
          const x = Math.min(startPoint.x, pos.x);
          const y = Math.min(startPoint.y, pos.y);
          const w = Math.abs(pos.x - startPoint.x);
          const h = Math.abs(pos.y - startPoint.y);
          points = [x, y, w, h];
        } 
        else if (activeTool === 'circle' || activeTool === 'ellipse') 
        {
          const rx = Math.abs(pos.x - startPoint.x);
          const ry = Math.abs(pos.y - startPoint.y);
          points = [startPoint.x, startPoint.y, rx, ry];
        }
        setDraftLayer({ id: -1, type: activeTool as Layer['type'], colour: activeColour, points });
      }
    };

    const endDrawing = () => 
    {
      // Finalize shape after drawing
      if (draftLayer) 
      {
        updateLayer({ ...draftLayer, id: Date.now() });
        setDraftLayer(null);
      }
      setIsDrawing(false);
      setStartPoint(null);
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
            {bgImage && <KonvaImage image={bgImage} width={width} height={height} listening={false} />} 

            {[...currentLayers, ...(draftLayer ? [draftLayer] : [])].map(layer => 
            {
              const sW = layer.type === 'text' ? 2 : layer.fontSize || 2;
              // Annotation State
              const common = 
              {
                key: layer.id,
                id: `layer-${layer.id}`,
                stroke: layer.colour,
                strokeWidth: sW,
                draggable: activeTool === 'select',
                onClick: handleSelect,
                onTap: handleSelect,
              };
              if (layer.type === 'text') 
              {
                const [x, y] = layer.points;
                return (
                  <Text
                    {...common}
                    x={x}
                    y={y}
                    text={layer.text || ''}
                    fontSize={layer.fontSize || 18}
                    onDblClick={() => 
                    {
                      if (activeTool === 'select') {
                        setEditingTextId(layer.id);
                      }
                    }}
                  />
                );
              }

              switch (layer.type) 
              {
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

        {editingTextId !== null && (() => 
        {
          // TextEditor overlay
          const textLayer = currentLayers.find(l => l.id === editingTextId);
          const node = stageRef.current?.findOne(`#layer-${editingTextId}`);

          if (!textLayer || !node || !(node instanceof Konva.Text)) return null;

          return (
            <TextEditor
              textNode={node}
              onChange={(newText: string) => 
              {
                setLayers(prev => 
                {
                  const updated = [...(prev[currentIndex] || [])];
                  const index = updated.findIndex(l => l.id === editingTextId);
                  if (index !== -1) updated[index] = { ...updated[index], text: newText };
                  
                  return { ...prev, [currentIndex]: updated };
                });
              }}
              onClose={() => setEditingTextId(null)}
            />
          );
        })()}
      </div>
    );
  }
);

export default CanvasAnnotator;
