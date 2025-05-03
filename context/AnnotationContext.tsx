import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction
} from 'react';

export type Layer = {
  id: number;
  type: 'pen' | 'line' | 'arrow' | 'circle' | 'rectangle' | 'ellipse';
  colour: string;
  points: number[];
  name?: string;
};

export interface AnnotationContextType {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  layers: Record<number, Layer[]>;
  setLayers: Dispatch<SetStateAction<Record<number, Layer[]>>>;
  activeTool: string;
  setActiveTool: Dispatch<SetStateAction<string>>;
  activeColour: string;
  setActiveColour: Dispatch<SetStateAction<string>>;
  selectedId: number | null;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

export function AnnotationProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [layers, setLayers] = useState<Record<number, Layer[]>>({});
  const [activeTool, setActiveTool] = useState<string>('pen');
  const [activeColour, setActiveColour] = useState<string>('#000000');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [history, setHistory] = useState<Record<number, Layer[][]>>({});
  const [future, setFuture] = useState<Record<number, Layer[][]>>({});

  const pushToHistory = (index: number, newLayers: Layer[]) => {
    setHistory(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), newLayers]
    }));
    setFuture(prev => ({ ...prev, [index]: [] }));
  };

  const undo = () => {
    const prevStack = history[currentIndex] || [];
    const current = layers[currentIndex] || [];

    if (prevStack.length === 0) return;
    const prevState = prevStack[prevStack.length - 1];
    setHistory(prev => ({
      ...prev,
      [currentIndex]: prev[currentIndex].slice(0, -1)
    }));
    setFuture(prev => ({
      ...prev,
      [currentIndex]: [current, ...(prev[currentIndex] || [])]
    }));
    setLayers(prev => ({ ...prev, [currentIndex]: prevState }));
  };

  const redo = () => {
    const futureStack = future[currentIndex] || [];
    const current = layers[currentIndex] || [];

    if (futureStack.length === 0) return;
    const nextState = futureStack[0];
    setFuture(prev => ({
      ...prev,
      [currentIndex]: prev[currentIndex].slice(1)
    }));
    setHistory(prev => ({
      ...prev,
      [currentIndex]: [...(prev[currentIndex] || []), current]
    }));
    setLayers(prev => ({ ...prev, [currentIndex]: nextState }));
  };

  const canUndo = (history[currentIndex] || []).length > 0;
  const canRedo = (future[currentIndex] || []).length > 0;

  return (
    <AnnotationContext.Provider
      value={{
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
        selectedId,
        setSelectedId,
        undo,
        redo,
        canUndo,
        canRedo
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}

export function useAnnotation() {
  const ctx = useContext(AnnotationContext);
  if (!ctx) throw new Error('useAnnotation must be used inside AnnotationProvider');
  return ctx;
}
