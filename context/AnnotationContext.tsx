import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

// Represents a single annotation layer
export type Layer = {
  id: number;
  type: 'pen' | 'line' | 'arrow' | 'circle' | 'rectangle' | 'ellipse' | 'text';
  colour: string;
  points: number[];
  name?: string;
  text?: string;
  fontSize?: number;
};

// Type for the Annotation context shape
export interface AnnotationContextType {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  layers: Record<number, Layer[]>; // Index-based mapping of layers
  setLayers: Dispatch<SetStateAction<Record<number, Layer[]>>>;
  activeTool: string;
  setActiveTool: Dispatch<SetStateAction<string>>;
  activeColour: string;
  setActiveColour: Dispatch<SetStateAction<string>>;
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  selectedId: number | null;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: (index: number, layers: Layer[]) => void;
}

// Context creation
const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

// Context provider component
export function AnnotationProvider({ children }: { children: ReactNode }) 
{
  const [images, setImages] = useState<string[]>([]); // List of image filenames
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Active image index
  const [layers, setLayers] = useState<Record<number, Layer[]>>({}); // Layers by image index
  const [activeTool, setActiveTool] = useState<string>('pen'); // Currently selected tool
  const [activeColour, setActiveColour] = useState<string>('#000000'); // Current drawing color
  const [fontSize, setFontSize] = useState<number>(18); // Font size or stroke width
  const [selectedId, setSelectedId] = useState<number | null>(null); // Selected layer ID

  const [history, setHistory] = useState<Record<number, Layer[][]>>({}); // Undo history for an image
  const [future, setFuture] = useState<Record<number, Layer[][]>>({}); // Redo stack for an image

  // Push current layers to history stack and clear redo stack
  const pushHistory = (index: number, currentLayers: Layer[]) => 
  {
    setHistory(prev => (
    {
      ...prev,
      [index]: [...(prev[index] || []), currentLayers],
    }));
    setFuture(prev => (
    {
      ...prev,
      [index]: [],
    }));
  };

  // Undo last action by restoring from history
  const undo = () => 
  {
    const prevStack = history[currentIndex] || [];
    const current = layers[currentIndex] || [];

    if (prevStack.length === 0) return;

    const prevState = prevStack[prevStack.length - 1];

    setHistory(prev => (
    {
      ...prev,
      [currentIndex]: prev[currentIndex].slice(0, -1),
    }));
    setFuture(prev => (
    {
      ...prev,
      [currentIndex]: [current, ...(prev[currentIndex] || [])],
    }));
    setLayers(prev => ({ ...prev, [currentIndex]: prevState }));
  };

  // Redo an undone action if available
  const redo = () => 
  {
    const futureStack = future[currentIndex] || [];
    const current = layers[currentIndex] || [];

    if (futureStack.length === 0) return;
    const nextState = futureStack[0];

    setFuture(prev => (
    {
      ...prev,
      [currentIndex]: prev[currentIndex].slice(1),
    }));
    setHistory(prev => (
    {
      ...prev,
      [currentIndex]: [...(prev[currentIndex] || []), current],
    }));
    setLayers(prev => ({ ...prev, [currentIndex]: nextState }));
  };

  const canUndo = (history[currentIndex] || []).length > 0;
  const canRedo = (future[currentIndex] || []).length > 0;

  // Provide context to children
  return (
    <AnnotationContext.Provider
      value={
      {
        images,
        setImages,
        currentIndex,
        setCurrentIndex,
        layers,
        setLayers,
        activeTool,
        setActiveTool,
        activeColour,
        setActiveColour,
        fontSize,
        setFontSize,
        selectedId,
        setSelectedId,
        undo,
        redo,
        canUndo,
        canRedo,
        pushHistory,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}

// Custom hook fto use the annotation context in components
export function useAnnotation() 
{
  const ctx = useContext(AnnotationContext);
  if (!ctx) throw new Error('useAnnotation must be used inside AnnotationProvider');
  return ctx;
}
